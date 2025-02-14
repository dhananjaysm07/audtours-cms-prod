import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useCallback, useEffect } from 'react';
import { Node } from '@/types';
import { contentApi } from '@/lib/api';
import { debounce } from 'lodash';

// Separate schemas for create and edit modes
const createStoreSchema = z.object({
  bokunId: z.string().min(1, 'Bokun ID is required'),
  heading: z.string().min(1, 'Heading is required'),
  description: z.string().min(1, 'Description is required'),
  nodeIds: z.array(z.number()).min(1, 'At least one node must be selected'),
  file: z.any().optional(),
});

const editStoreSchema = z.object({
  bokunId: z.string().min(1, 'Bokun ID is required'),
  heading: z.string().min(1, 'Heading is required'),
  description: z.string().min(1, 'Description is required'),
  file: z.any().optional(),
});

type CreateStoreType = z.infer<typeof createStoreSchema>;
type EditStoreType = z.infer<typeof editStoreSchema>;

interface StoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStoreType | EditStoreType) => Promise<void>;
  initialData?: Partial<CreateStoreType | EditStoreType>;
  mode: 'create' | 'edit';
  isLoading: boolean;
}

export function StoreDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  isLoading,
}: StoreDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNodeSearch, setShowNodeSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [selectedNodesInfo, setSelectedNodesInfo] = useState<Map<number, Node>>(
    new Map(),
  );

  // Use different form types based on mode
  const form = useForm<CreateStoreType | EditStoreType>({
    resolver: zodResolver(
      mode === 'create' ? createStoreSchema : editStoreSchema,
    ),
    defaultValues: {
      bokunId: '',
      heading: '',
      description: '',
      ...(mode === 'create' ? { nodeIds: [] } : {}),
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({ bokunId: '', heading: '', description: '', nodeIds: [] });
    }
  }, [initialData, form]);

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
    }, 300),
    [],
  );

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setIsSearching(true);
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };

  const handleNodeSelect = (node: Node) => {
    if (mode === 'create') {
      const currentNodeIds = (form.getValues() as CreateStoreType).nodeIds;
      form.setValue('nodeIds', [...currentNodeIds, node.id] as any);
      setSelectedNodesInfo(new Map(selectedNodesInfo.set(node.id, node)));
    }
    setShowNodeSearch(false);
    setSearchTerm('');
  };

  const handleRemoveNode = (nodeId: number) => {
    if (mode === 'create') {
      const currentNodeIds = (form.getValues() as CreateStoreType).nodeIds;
      form.setValue(
        'nodeIds',
        currentNodeIds.filter(id => id !== nodeId) as any,
      );
      const updatedNodesInfo = new Map(selectedNodesInfo);
      updatedNodesInfo.delete(nodeId);
      setSelectedNodesInfo(updatedNodesInfo);
    }
  };

  const selectedNodeIds =
    mode === 'create' ? (form.watch('nodeIds') as number[]) : [];
  const filteredNodes = searchResults.filter(
    node => !selectedNodeIds.includes(node.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Store' : 'Edit Store'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bokunId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bokun ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Bokun ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heading</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter heading" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="nodeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nodes</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {field?.value?.map(nodeId => {
                        const nodeInfo = selectedNodesInfo.get(nodeId);
                        return (
                          <Badge
                            key={nodeId}
                            variant="secondary"
                            className="h-7 px-2"
                          >
                            {nodeInfo ? nodeInfo.path : nodeId}
                            <button
                              type="button"
                              onClick={() => handleRemoveNode(nodeId)}
                              className="ml-2 hover:text-destructive"
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
                            className="h-7"
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
                            <ScrollArea className="h-[200px]">
                              <CommandList>
                                <CommandEmpty>No nodes found</CommandEmpty>
                                <CommandGroup>
                                  {filteredNodes.map(node => (
                                    <CommandItem
                                      key={node.id}
                                      onSelect={() => handleNodeSelect(node)}
                                    >
                                      {node.path}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </ScrollArea>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {mode === 'create' ? 'Create Store' : 'Update Store'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
