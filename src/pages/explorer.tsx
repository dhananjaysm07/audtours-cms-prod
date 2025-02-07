// ContentExplorer.tsx
import { useEffect, useState } from 'react';
import AudioPlayer from '@/components/audio-player';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContentStore } from '@/store/useContentStore';
import FlexiContainer from '@/components/flexi-container';
import FolderItem from '@/components/folder-item';
import {
  FolderUp,
  Home,
  ChevronDown,
  FileUp,
  MapIcon,
  Globe,
  MapPin,
  Compass,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContentItem,
  NodeType,
  FolderItemType,
  REPOSITORY_KINDS,
  UploadDialogPropsType,
  NODE_TYPES,
} from '@/types';
import LoadingSpinner from '@/components/spinner';
import { toast } from 'sonner';
import { capitalize } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguageStore } from '@/store/useLanguageStore';
import LanguageManagementDialog from '@/components/LanguageManagementDialog';
import ArtistManagementDialog from '@/components/artist-management-dialog';
import { useArtistStore } from '@/store/useArtistStore';
import { useSearchParams } from 'react-router';

interface PathSegment {
  id: string;
  name: string;
  type: FolderItemType;
  nodeType?: string;
  repoType?: string;
}

const UploadDialogSchema = z.object({
  file: z.instanceof(File).optional(),
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  languageId: z.union([z.number(), z.null()]).optional(),
});

type UploadDialogFormState = z.infer<typeof UploadDialogSchema>;

const getBreadcrumb = (
  currentPath: PathSegment[],
  onBreadcrumbClick: (segment: PathSegment, index: number) => void
) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {currentPath.map((segment, index) => (
          <BreadcrumbItem key={segment.id}>
            {index === currentPath.length - 1 ? (
              <BreadcrumbPage>
                {segment.name}
                {/* {segment.nodeType ? ` (${capitalize(segment.nodeType)})` : ''} */}
              </BreadcrumbPage>
            ) : (
              <>
                <button
                  className="hover:text-foreground"
                  onClick={() => onBreadcrumbClick(segment, index)}
                >
                  {segment.name}
                  {/* {segment.nodeType ? ` (${capitalize(segment.nodeType)})` : ''} */}
                </button>
                {index < currentPath.length - 1 && <BreadcrumbSeparator />}
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const getNodeBadge = (nodeType: NodeType) => {
  const node = capitalize(nodeType);
  switch (nodeType) {
    case 'location':
      return (
        <span className="flex items-center bg-cyan-50 text-cyan-600 px-2 gap-1">
          <Globe size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );
    case 'map':
      return (
        <span className="flex items-center bg-green-50 text-green-600 px-2 gap-1">
          <MapIcon size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );

    case 'spot':
      return (
        <span className="flex items-center bg-purple-50 text-purple-600 px-2 gap-1">
          <Compass size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );
    case 'stop':
      return (
        <span className="flex items-center bg-orange-50 text-orange-600 px-2 gap-1">
          <MapPin size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );
  }
};

const isFileUploadAvailable = ({ type }: { type: FolderItemType }) => {
  return type === 'repository';
};

const UploadDialog = ({
  allowedTypes = ['image', 'audio'],
  isOpen,
  setIsOpen,
}: UploadDialogPropsType) => {
  const form = useForm<UploadDialogFormState>({
    resolver: zodResolver(UploadDialogSchema),
    defaultValues: {
      file: undefined,
      name: '',
      position: '',
      languageId: null,
    },
  });

  const {
    uploadFile,
    isProcessing,
    isLoading,
    currentPath,
    error_status,
    error,
    display_toast,
  } = useContentStore();
  // console.log("Current path:-", currentPath[currentPath.length - 1]);
  const { languages, fetchLanguages } = useLanguageStore();
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (error_status === 409 && error) {
      setConflictMessage(error);
      setShowConflictDialog(true);
    } else if (error == null && display_toast) {
      setIsOpen(false);
      form.reset();
      toast.success('File uploaded successfully');
    }
  }, [error_status, error, display_toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (
      selectedFile &&
      allowedTypes.some((type) => selectedFile.type.startsWith(`${type}/`))
    ) {
      form.setValue('file', selectedFile);
    } else {
      toast.error('Invalid file type. Please select an image or audio file.');
    }
  };

  const handleUpload = async (
    data: UploadDialogFormState,
    forcePosition = false
  ) => {
    if (!data.file) return;
    try {
      const currentNodeId = currentPath[currentPath.length - 1].id;

      const position = data.position ? parseInt(data.position) : null;
      const uploadData = {
        file: data.file,
        name: data.name,
        position,
        repoId: currentNodeId.split(':')[1],
        force_position: forcePosition,
        languageId: data.languageId,
      };

      await uploadFile(uploadData);
    } catch (error) {
      if ((error as { status: number }).status === 409) {
        setConflictMessage((error as { message: string }).message);
        setShowConflictDialog(true);
        form.reset(data);
        return;
      }
      console.error(error);
      toast.error('Failed to upload file');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => handleUpload(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={handleFileChange}
                        accept={allowedTypes
                          .map((type) => `${type}/*`)
                          .join(',')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (optional)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {currentPath[currentPath.length - 1].repoType ==
                REPOSITORY_KINDS.AUDIO && (
                <FormField
                  control={form.control}
                  name="languageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <div className="flex justify-between items-center">
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) =>
                              field.onChange(value ? Number(value) : null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {languages
                                .filter((lang) => lang.isActive)
                                .map((lang) => (
                                  <SelectItem
                                    key={lang.id}
                                    value={lang.id.toString()}
                                  >
                                    {lang.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAddLanguageOpen(true)}
                          >
                            Manage Languages
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button
                type="submit"
                disabled={!form.watch('file') || isProcessing || isLoading}
              >
                Upload
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <LanguageManagementDialog
        isOpen={isAddLanguageOpen}
        onOpenChange={setIsAddLanguageOpen}
      />

      <AlertDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Position Conflict</AlertDialogTitle>
            <AlertDialogDescription>{conflictMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConflictDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConflictDialog(false);
                handleUpload(form.getValues(), true);
              }}
            >
              Add Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const isFolderCreationAvailable = ({
  type,
  nodeType,
}: {
  type: FolderItemType;
  nodeType: NodeType | undefined;
}) => {
  if (type !== 'folder') return false;
  if (nodeType === 'stop') return false;
  return true;
};

const CreateFolderDialog = () => {
  const { createNode, isProcessing, isLoading, currentPath } =
    useContentStore();
  const { artists, fetchArtists } = useArtistStore();
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderType, setFolderType] = useState('');
  const [code, setCode] = useState('');
  const [artistId, setArtistId] = useState<number | null>(null);
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (folderName && folderType) {
      const parentId = currentPath[currentPath.length - 1].id;
      try {
        await createNode(
          folderName,
          folderType as NodeType,
          parentId,
          folderType === NODE_TYPES.STOP ? code : null,
          folderType === NODE_TYPES.STOP ? artistId : null
        );
        setIsOpen(false);
        setFolderName('');
        setFolderType('');
        setCode('');
        setArtistId(null);
      } catch (error) {
        console.error(error);
        // toast.error('Failed to create folder');
      }
    }
  };

  const lastSegment = currentPath[currentPath.length - 1];

  const getAvailableTypes = () => {
    switch (lastSegment.nodeType?.toLowerCase()) {
      case 'location':
        return ['map', 'spot', 'stop'];
      case 'map':
        return ['spot', 'stop'];
      case 'spot':
        return ['stop'];
      case 'stop':
        return [];
      default:
        return ['location', 'map', 'spot', 'stop'];
    }
  };

  // Fetch artists when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchArtists();
    }
  }, [isOpen, fetchArtists]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            disabled={
              isLoading ||
              isProcessing ||
              !isFolderCreationAvailable({
                nodeType: lastSegment.nodeType,
                type: lastSegment.type,
              })
            }
          >
            + Create
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <Select onValueChange={setFolderType}>
            <SelectTrigger>
              <SelectValue placeholder="Select folder type" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableTypes().map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Conditionally render code and artist fields for 'stop' type */}
          {folderType === NODE_TYPES.STOP && (
            <>
              <Input
                placeholder="Code (optional)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex gap-2">
                <Select onValueChange={(value) => setArtistId(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select artist (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists
                      .filter((artist) => artist.isActive)
                      .map((artist) => (
                        <SelectItem key={artist.id} value={String(artist.id)}>
                          {artist.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsArtistDialogOpen(true)}>
                  Manage Artists
                </Button>
              </div>
            </>
          )}

          <Button
            onClick={handleCreate}
            disabled={!folderName || !folderType || isProcessing}
          >
            Create
          </Button>
        </DialogContent>
      </Dialog>

      {/* Artist Management Dialog */}
      <ArtistManagementDialog
        isOpen={isArtistDialogOpen}
        onOpenChange={setIsArtistDialogOpen}
      />
    </>
  );
};

const SortDropdown = () => {
  const { setSortBy, setSortOrder, sortBy, sortOrder } = useContentStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="secondary">
          Sort <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setSortBy('name')}>
          By Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy('date')}>
          By Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy('size')}>
          By Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FolderView = () => {
  const { isLoading, sortedItems, selectedItems, toggleItemSelection } =
    useContentStore();
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const acceptedFiles = files.filter((file) =>
      ['image/', 'audio/'].some((type) => file.type.startsWith(type))
    );

    if (acceptedFiles.length) {
      // const currentNodeId = currentPath[currentPath.length - 1].id;
      for (const file of acceptedFiles) {
        try {
          // await uploadFile(file, currentNodeId);
        } catch (error) {
          console.error(error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
    } else {
      toast.error('Only image or audio files are allowed!');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <FlexiContainer
      onDrop={handleDrop}
      onDragEnd={handleDrop}
      onDragOver={handleDragOver}
      className="cursor-auto"
      onKeyDownCapture={(e) =>
        e.key === 'Escape' &&
        selectedItems.forEach((item) => toggleItemSelection(item))
      }
      onClick={() => selectedItems.forEach((item) => toggleItemSelection(item))}
    >
      <div className="flex-1 flex flex-wrap gap-6 p-2 overflow-y-auto scroll-smooth h-full justify-start items-start rounded-lg">
        {isLoading ? (
          <div className="grid h-full w-full place-items-center pb-16">
            <LoadingSpinner size="medium" />
          </div>
        ) : (
          sortedItems.map((item: ContentItem) => (
            <FolderItem item={item} key={item.id} />
          ))
        )}
      </div>
    </FlexiContainer>
  );
};

const ContentExplorer = () => {
  const [isOpenUploadDialog, setIsOpenUploadDialog] = useState(false);
  const [searchParams] = useSearchParams();
  const parentNodeId = searchParams.get('parentNodeId');
  const {
    isLoading,
    setIsLoading,
    currentPath,
    navigateTo,
    sortedItems,
    error,
    display_toast,
    getHierarchy,
  } = useContentStore();
  useEffect(() => {
    const initializeStore = async () => {
      setIsLoading(true);
      try {
        await navigateTo('root');
      } catch (error) {
        console.error(error);
        toast.error('Failed to initialize content');
      } finally {
        setIsLoading(false);
      }
    };
    if (!parentNodeId) initializeStore();
    else getHierarchy(Number(parentNodeId));
  }, [parentNodeId]);

  const handleBreadcrumbClick = async (segment: PathSegment, index: number) => {
    try {
      // Navigate to the clicked segment
      await navigateTo(segment.id, index);
    } catch (error) {
      console.error(error);
      toast.error('Failed to navigate');
    }
  };

  const handleUpLevel = () => {
    if (currentPath.length > 1) {
      const parentIndex = currentPath.length - 2;
      const parentSegment = currentPath[parentIndex];
      handleBreadcrumbClick(parentSegment, parentIndex);
    }
  };
  console.log('Current Path....', currentPath);
  const canNavigateUp = currentPath.length > 1;
  const currentSegment = currentPath[currentPath.length - 1];
  const isRoot = currentPath.length === 1;

  useEffect(() => {
    if (error && display_toast) toast.error(error);
  }, [error]);

  return (
    <div className="flex flex-col bg-white p-4 rounded-lg gap-4 flex-1">
      <div className="bg-neutral-100 w-full rounded-md p-2">
        {getBreadcrumb(currentPath, handleBreadcrumbClick)}
      </div>

      <div className="grow w-full rounded-lg relative">
        <div className="flex p-2 justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {isLoading ? (
                <Skeleton className="w-12 h-2 bg-neutral-200" />
              ) : (
                currentSegment.name
              )}
            </h2>
            <span>
              {isLoading ? (
                <Skeleton className="w-4 h-2 bg-neutral-200" />
              ) : (
                `${sortedItems.length} items`
              )}
            </span>
            {currentSegment.nodeType && (
              <span className="ml-1">
                {getNodeBadge(currentSegment.nodeType)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="min-w-0"
              disabled={isLoading || !canNavigateUp}
              onClick={handleUpLevel}
            >
              <FolderUp size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isLoading || isRoot}
              onClick={() => navigateTo('root')}
            >
              <Home size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="min-w-0"
              onClick={() => setIsOpenUploadDialog(true)}
            >
              <FileUp size={16} />
            </Button>
            {isOpenUploadDialog ? (
              <UploadDialog
                isOpen={isOpenUploadDialog}
                setIsOpen={setIsOpenUploadDialog}
              />
            ) : (
              ''
            )}

            <CreateFolderDialog />
            <SortDropdown />
          </div>
        </div>
        <FolderView />
        {currentPath.slice(-1)?.[0]?.repoType == REPOSITORY_KINDS.AUDIO ? (
          <AudioPlayer />
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default ContentExplorer;
