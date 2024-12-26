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
import { FolderUp, Home, Loader, ChevronDown, FileUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { FolderItemProps, FolderKindSpecific } from '@/types';

interface PathSegment {
  itemId: string;
  name: string;
}

const getBreadcrumb = (
  currentPath: PathSegment[],
  navigateTo: (itemId: string) => void
) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {currentPath.map((item, index) => (
          <BreadcrumbItem key={item.itemId}>
            {index === currentPath.length - 1 ? (
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            ) : (
              <>
                <button
                  // variant="ghost"
                  className="hover:text-foreground"
                  onClick={() => navigateTo(item.itemId)}
                >
                  {item.name}
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

const UploadDialog = ({ allowedTypes = ['image', 'audio'] }) => {
  const { uploadFile, isProcessing } = useContentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (
      selectedFile &&
      allowedTypes.some((type) => selectedFile.type.startsWith(`${type}/`))
    ) {
      setFile(selectedFile);
    } else {
      alert('Invalid file type. Please select an image or audio file.');
    }
  };

  const handleUpload = async () => {
    if (file) {
      await uploadFile(file);
      setIsOpen(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size={'sm'}
          variant={'secondary'}
          className="min-w-0"
          disabled={isProcessing}
        >
          <FileUp size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <Input
          type="file"
          onChange={handleFileChange}
          accept={allowedTypes.map((type) => `${type}/*`).join(',')}
        />
        <Button onClick={handleUpload} disabled={!file || isProcessing}>
          Upload
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const CreateFolderDialog = () => {
  const { createFolder, isProcessing, currentPath } = useContentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderType, setFolderType] = useState('');

  const handleCreate = async () => {
    if (folderName && folderType) {
      await createFolder(folderName, folderType as FolderKindSpecific);
      setIsOpen(false);
      setFolderName('');
      setFolderType('');
    }
  };

  const getAvailableTypes = () => {
    const lastSegment = currentPath[currentPath.length - 1];
    if (lastSegment.name.toLowerCase() === 'map') {
      return ['spot', 'stop'];
    }
    return ['location', 'map', 'spot', 'stop'];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
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
        <Button
          onClick={handleCreate}
          disabled={!folderName || !folderType || isProcessing}
        >
          Create
        </Button>
      </DialogContent>
    </Dialog>
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

const ContentExplorer = () => {
  const {
    isLoading,
    setIsLoading,
    currentPath,
    navigateTo,
    sortedItems,
    error,
  } = useContentStore();

  useEffect(() => {
    const initializeStore = async () => {
      setIsLoading(true);
      await navigateTo('root');
      setIsLoading(false);
    };

    initializeStore();
  }, [setIsLoading, navigateTo]);

  const handleUpLevel = () => {
    if (currentPath.length > 1) {
      navigateTo(currentPath[currentPath.length - 2].itemId);
    }
  };

  return (
    <div className="flex flex-col bg-white p-4 rounded-lg gap-4 flex-1">
      <div className="bg-neutral-100 w-full rounded-md p-2">
        {getBreadcrumb(currentPath, navigateTo)}
      </div>

      <div className="grow w-full rounded-lg relative">
        <div className="flex p-2 justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {isLoading ? (
                <Skeleton className="w-20 h-4 bg-neutral-200" />
              ) : (
                currentPath[currentPath.length - 1].name
              )}
            </h2>
            <span>
              {isLoading ? (
                <Skeleton className="w-20 h-4 bg-neutral-200" />
              ) : (
                `${sortedItems.length} items`
              )}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size={'sm'}
              variant={'secondary'}
              className="min-w-0"
              disabled={isLoading || currentPath.length === 1}
              onClick={handleUpLevel}
            >
              <FolderUp size={16} />
            </Button>
            <Button
              size={'sm'}
              variant={'secondary'}
              disabled={isLoading}
              onClick={() => navigateTo('root')}
            >
              <Home size={16} />
            </Button>
            <UploadDialog />
            <CreateFolderDialog />
            <SortDropdown />
          </div>
        </div>
        <FolderView />
        {error && <div className="text-red-500 mt-2">{error}</div>}
        <AudioPlayer />
      </div>
    </div>
  );
};

const FolderView = () => {
  const { isLoading, sortedItems } = useContentStore();

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const acceptedFiles = files.filter((file) =>
      ['image/', 'audio/'].some((type) => file.type.startsWith(type))
    );

    if (acceptedFiles.length) {
      alert(`${acceptedFiles.length} file(s) accepted!`);
      // Here you would typically call a function to upload these files
    } else {
      alert('Only image or audio files are allowed!');
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
    >
      <div className="flex-1 flex flex-wrap gap-6 p-2 overflow-y-auto scroll-smooth h-full justify-start items-start rounded-lg">
        {isLoading ? (
          <div className="grid h-full w-full place-items-center pb-16">
            <Loader className="h-10 w-10 text-neutral-400/90 animate-spin-ease" />
          </div>
        ) : (
          sortedItems.map((item: FolderItemProps) => (
            <FolderItem {...item} key={item.itemId} />
          ))
        )}
      </div>
    </FlexiContainer>
  );
};

export default ContentExplorer;
