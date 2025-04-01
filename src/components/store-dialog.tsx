import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { X, Globe, MapPin } from 'lucide-react';
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
import { countries, getContinentByCountry } from '@/lib/country-data';

// Separate schemas for create and edit modes
const createStoreSchema = z.object({
  bokunId: z.string().min(1, 'Bokun ID is required'),
  heading: z.string().min(1, 'Heading is required'),
  description: z.string().min(1, 'Description is required'),
  country: z.string().min(1, 'Country is required'),
  continent: z.string().min(1, 'Continent is required'),
  nodeIds: z.array(z.number()).min(1, 'At least one node must be selected'),
  file: z.any().optional(),
});

const editStoreSchema = z.object({
  bokunId: z.string().min(1, 'Bokun ID is required'),
  heading: z.string().min(1, 'Heading is required'),
  description: z.string().min(1, 'Description is required'),
  country: z.string().min(1, 'Country is required'),
  continent: z.string().min(1, 'Continent is required'),
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
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [selectedNodesInfo, setSelectedNodesInfo] = useState<Map<number, Node>>(
    new Map(),
  );

  const [showCountrySearch, setShowCountrySearch] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countries);

  // Use different form types based on mode
  const form = useForm<CreateStoreType | EditStoreType>({
    resolver: zodResolver(
      mode === 'create' ? createStoreSchema : editStoreSchema,
    ),
    defaultValues: {
      bokunId: '',
      heading: '',
      description: '',
      country: '',
      continent: '',
      ...(mode === 'create' ? { nodeIds: [] } : {}),
    },
  });

  // Important: Reset the form when the dialog opens or initialData changes
  useEffect(() => {
    if (initialData) {
      // For create mode, handle nodeIds and populate selectedNodesInfo
      if (
        mode === 'create' &&
        'nodeIds' in initialData &&
        initialData.nodeIds
      ) {
        const nodeMap = new Map<number, Node>();
        (initialData.nodeIds as number[]).forEach(id => {
          nodeMap.set(id, { id, path: `Node ${id}` } as Node);
        });
        setSelectedNodesInfo(nodeMap);
      }

      // Reset the form with initialData
      form.reset({
        bokunId: initialData.bokunId || '',
        heading: initialData.heading || '',
        description: initialData.description || '',
        country: initialData.country || '',
        continent: initialData.continent || '',
        ...(mode === 'create' && 'nodeIds' in initialData
          ? { nodeIds: initialData.nodeIds || [] }
          : {}),
      });
    } else {
      // Reset to defaults
      form.reset({
        bokunId: '',
        heading: '',
        description: '',
        country: '',
        continent: '',
        ...(mode === 'create' ? { nodeIds: [] } : {}),
      });

      if (mode === 'create') {
        setSelectedNodesInfo(new Map());
      }
    }
  }, [initialData, form, mode, open]);

  // Filter countries based on search term
  useEffect(() => {
    if (countrySearchTerm) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()),
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [countrySearchTerm]);

  // Set continent automatically when country changes
  useEffect(() => {
    const countryValue = form.watch('country');
    if (countryValue) {
      const continent = getContinentByCountry(countryValue);
      if (continent) {
        form.setValue('continent', continent);
      }
    }
  }, [form.watch('country')]);

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await contentApi.searchNodes(term);
        if (response.status === 'success' && response.data) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Error searching nodes:', error);
      }
    }, 300),
    [],
  );

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };

  const handleNodeSelect = (node: Node) => {
    if (mode === 'create') {
      const createForm = form as ReturnType<typeof useForm<CreateStoreType>>;
      const currentNodeIds = createForm.getValues().nodeIds || [];
      createForm.setValue('nodeIds', [...currentNodeIds, node.id]);
      setSelectedNodesInfo(new Map(selectedNodesInfo.set(node.id, node)));
    }
    setShowNodeSearch(false);
    setSearchTerm('');
  };

  const handleCountrySelect = (countryName: string) => {
    form.setValue('country', countryName);
    const continent = getContinentByCountry(countryName);
    if (continent) {
      form.setValue('continent', continent);
    }
    setShowCountrySearch(false);
    setCountrySearchTerm('');
  };

  const handleRemoveNode = (nodeId: number) => {
    if (mode === 'create') {
      const createForm = form as ReturnType<typeof useForm<CreateStoreType>>;
      const currentNodeIds = createForm.getValues().nodeIds || [];
      createForm.setValue(
        'nodeIds',
        currentNodeIds.filter(id => id !== nodeId),
      );
      const updatedNodesInfo = new Map(selectedNodesInfo);
      updatedNodesInfo.delete(nodeId);
      setSelectedNodesInfo(updatedNodesInfo);
    }
  };

  const selectedNodeIds =
    mode === 'create' ? (form.watch('nodeIds') as number[]) || [] : [];

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
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new store.'
              : 'Edit the details of the existing store.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Heading and Bokun ID side by side */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

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

            {/* Country and Continent side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Country Field */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Popover
                      open={showCountrySearch}
                      onOpenChange={setShowCountrySearch}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span>{field.value || 'Select a country'}</span>
                            <MapPin className="h-4 w-4 opacity-50" />
                          </div>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search countries..."
                            value={countrySearchTerm}
                            onValueChange={setCountrySearchTerm}
                          />
                          <ScrollArea className="h-[300px]">
                            <CommandList>
                              <CommandEmpty>No countries found</CommandEmpty>
                              <CommandGroup>
                                {filteredCountries.map(country => (
                                  <CommandItem
                                    key={country.code}
                                    onSelect={() =>
                                      handleCountrySelect(country.name)
                                    }
                                  >
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </ScrollArea>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Continent Field (Read-only) */}
              <FormField
                control={form.control}
                name="continent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Continent</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                        <span>
                          {field.value || 'Auto-selected based on country'}
                        </span>
                        <Globe className="h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="nodeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nodes</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {field.value?.map(nodeId => {
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
                      onChange={e => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          field.onChange(files[0]);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? 'Processing...'
                : mode === 'create'
                ? 'Create Store'
                : 'Update Store'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
