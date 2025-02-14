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
} from '@/components/ui/command';
import { createCodeSchema } from '@/schemas/create-code-schema';
import { contentApi, subscriptionApi } from '@/lib/api';
import type { Node } from '@/types';
import { debounce } from 'lodash';
import { ScrollArea } from './ui/scroll-area';

interface CreateCodeDialogProps {
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  form: UseFormReturn<z.infer<typeof createCodeSchema>>;
  onCreateCode: (data: z.infer<typeof createCodeSchema>) => Promise<void>;
}

const SEARCH_DEBOUNCE_MS = 300;
const SERVER_TIME_REFRESH_INTERVAL = 5000;

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
    new Map(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [isLoadingServerTime, setIsLoadingServerTime] = useState(true);

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
    [setSearchResults, setIsSearching],
  );

  // Fetch server time
  const fetchServerTime = async () => {
    try {
      const response = await subscriptionApi.getServerTime();
      setServerTime(new Date(response.data.serverTime));
    } catch (error) {
      console.error('Error fetching server time:', error);
    } finally {
      setIsLoadingServerTime(false);
    }
  };

  // Initialize server time polling
  useEffect(() => {
    if (dialogOpen) {
      fetchServerTime();
      const interval = setInterval(
        fetchServerTime,
        SERVER_TIME_REFRESH_INTERVAL,
      );
      return () => clearInterval(interval);
    }
  }, [dialogOpen]);

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
    [debouncedSearch],
  );

  const selectedNodeIds = form.watch('nodeIds') || [];

  const filteredNodes = searchResults.filter(
    node => !selectedNodeIds.includes(node.id),
  );

  const handleNodeSelect = useCallback(
    (node: Node) => {
      const currentNodeIds = form.getValues('nodeIds') || [];
      form.setValue('nodeIds', [...currentNodeIds, node.id]);
      setSelectedNodesInfo(new Map(selectedNodesInfo.set(node.id, node)));
      setShowNodeSearch(false);
      setSearchTerm('');
    },
    [form, selectedNodesInfo],
  );

  const handleRemoveNode = useCallback(
    (nodeId: number) => {
      const currentNodeIds = form.getValues('nodeIds') || [];
      form.setValue(
        'nodeIds',
        currentNodeIds.filter(id => id !== nodeId),
      );
      const updatedNodesInfo = new Map(selectedNodesInfo);
      updatedNodesInfo.delete(nodeId);
      setSelectedNodesInfo(updatedNodesInfo);
    },
    [form, selectedNodesInfo],
  );

  const handleSubmit = async (values: z.infer<typeof createCodeSchema>) => {
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
          + Generate New Tour
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

        {/* <div className="mb-"> */}
        {isLoadingServerTime ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner size="small" />
            <span>Fetching server time...</span>
          </div>
        ) : serverTime ? (
          <div className="text-sm text-muted-foreground">
            Server Time: {serverTime.toLocaleString()}
          </div>
        ) : null}
        {/* </div> */}

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
                      {field.value.map(nodeId => {
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
                                    {filteredNodes.map(node => (
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

            <div className="flex gap-20">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="expiryDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={e =>
                            field.onChange(parseInt(e.target.value))
                          }
                          placeholder="Days"
                          className="w-20 h-7 p-2 text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          {...field}
                          onChange={e =>
                            field.onChange(parseInt(e.target.value))
                          }
                          placeholder="Hours"
                          className="w-20 h-7 p-2 text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
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
                          onChange={e =>
                            field.onChange(parseInt(e.target.value))
                          }
                          placeholder="Enter maximum users"
                          className="w-20 h-7 p-2 text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
