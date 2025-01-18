import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { X } from 'lucide-react';
import LoadingSpinner from './spinner';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { createCodeSchema } from '@/schemas/create-code-schema';
import { DateTimePicker } from './date-time-picker';
import { contentApi } from '@/lib/api';
import type { Node } from '@/types';
import { debounce } from 'lodash';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface CreateCodeDialogProps {
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  form: UseFormReturn<z.infer<typeof createCodeSchema>>;
  onCreateCode: (data: z.infer<typeof createCodeSchema>) => Promise<void>;
}

const SEARCH_DEBOUNCE_MS = 300;

const CreateCodeDialog: React.FC<CreateCodeDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  form,
  onCreateCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNodeSearch, setShowNodeSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [selectedNodesInfo, setSelectedNodesInfo] = useState<Map<number, Node>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDateTouched, setStartDateTouched] = useState(false);
  const [endDateTouched, setEndDateTouched] = useState(false);

  // Create a memoized debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const response = await contentApi.searchNodes(term);
        if (response.status === 'success' && response.data) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Error searching nodes:', error);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS),
    [setSearchResults, setIsSearching]
  );

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setSearchTerm('');
      setShowNodeSearch(false);
      setSearchResults([]);
      setStartDateTouched(false);
      setEndDateTouched(false);
      form.reset();
    }
  }, [dialogOpen, form]);

  // Handle search term changes
  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (term.trim()) {
        setIsSearching(true);
        debouncedSearch(term);
      } else {
        setSearchResults([]);
      }
    },
    [debouncedSearch]
  );

  const selectedNodeIds = form.watch('nodeIds') || [];
  const startTime = form.watch('validFrom');
  const endTime = form.watch('validTo');

  const validateDates = useCallback(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const currentTime = new Date();
    const minStartTime = new Date(currentTime.getTime() + 5 * 60000);
    let hasErrors = false;

    if (startDateTouched && start < minStartTime) {
      form.setError('validFrom', {
        type: 'manual',
        message: 'Start time must be at least 5 minutes from now',
      });
      hasErrors = true;
    } else if (startDateTouched) {
      form.clearErrors('validFrom');
    }

    if (endDateTouched && end <= start) {
      form.setError('validTo', {
        type: 'manual',
        message: 'Expiry time must be after start time',
      });
      hasErrors = true;
    } else if (endDateTouched) {
      form.clearErrors('validTo');
    }

    return !hasErrors;
  }, [startTime, endTime, form, startDateTouched, endDateTouched]);

  // Only validate when dates are touched
  useEffect(() => {
    if (startDateTouched || endDateTouched) {
      validateDates();
    }
  }, [startTime, endTime, validateDates, startDateTouched, endDateTouched]);

  const handleStartDateChange = (value: string) => {
    setStartDateTouched(true);
    form.setValue('validFrom', value);
  };

  const handleEndDateChange = (value: string) => {
    setEndDateTouched(true);
    form.setValue('validTo', value);
  };

  const filteredNodes = searchResults.filter(
    (node) => !selectedNodeIds.includes(node.id)
  );

  const handleNodeSelect = useCallback(
    (node: Node) => {
      const currentNodeIds = form.getValues('nodeIds') || [];
      form.setValue('nodeIds', [...currentNodeIds, node.id]);
      setSelectedNodesInfo(new Map(selectedNodesInfo.set(node.id, node)));
      setShowNodeSearch(false);
      setSearchTerm('');
    },
    [form, selectedNodesInfo]
  );

  const handleRemoveNode = useCallback(
    (nodeId: number) => {
      const currentNodeIds = form.getValues('nodeIds') || [];
      form.setValue(
        'nodeIds',
        currentNodeIds.filter((id) => id !== nodeId)
      );
      const updatedNodesInfo = new Map(selectedNodesInfo);
      updatedNodesInfo.delete(nodeId);
      setSelectedNodesInfo(updatedNodesInfo);
    },
    [form, selectedNodesInfo]
  );

  const handleSubmit = async (values: z.infer<typeof createCodeSchema>) => {
    // Force validation of both dates before submission
    setStartDateTouched(true);
    setEndDateTouched(true);

    if (!validateDates()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateCode(values);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          + Create Code
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-xl"
        aria-describedby="div"
        aria-description="Create Code Dialog Box"
      >
        <DialogHeader>
          <DialogTitle>Create New Code</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-2"
          >
            <FormField
              control={form.control}
              name="nodeIds"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Nodes</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map((nodeId) => {
                        const nodeInfo = selectedNodesInfo.get(nodeId);
                        return (
                          <Badge
                            key={nodeId}
                            variant="secondary"
                            className="gap-1.5 h-7 p-2"
                          >
                            {nodeInfo ? nodeInfo.path : nodeId}
                            <button
                              type="button"
                              onClick={() => handleRemoveNode(nodeId)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}

                      <Popover
                        open={showNodeSearch}
                        onOpenChange={setShowNodeSearch}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-start h-7 p-2"
                          >
                            + Add Node
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search nodes..."
                              value={searchTerm}
                              onValueChange={handleSearchChange}
                            />
                            <ScrollArea className="h-[100px] overflow-y-auto">
                              <CommandList className="max-h-48">
                                {isSearching ? (
                                  <CommandItem disabled className="h-10 w-full">
                                    <LoadingSpinner size="small" />
                                    <span className="ml-2 text-sm">
                                      Searching...
                                    </span>
                                  </CommandItem>
                                ) : (
                                  <>
                                    <CommandEmpty>No nodes found</CommandEmpty>
                                    {filteredNodes.map((node) => (
                                      <CommandItem
                                        value={node.path}
                                        key={node.id}
                                        onSelect={() => handleNodeSelect(node)}
                                      >
                                        {node.path}
                                      </CommandItem>
                                    ))}
                                  </>
                                )}
                              </CommandList>
                            </ScrollArea>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onChange={handleStartDateChange}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onChange={handleEndDateChange}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Users</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      placeholder="Enter maximum users"
                      className="w-20 h-7 p-2 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  'Create Code'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCodeDialog;
