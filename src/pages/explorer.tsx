// ContentExplorer.tsx
import { useEffect, useState } from "react";
import AudioPlayer from "@/components/audio-player";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContentStore } from "@/store/useContentStore";
import FlexiContainer from "@/components/flexi-container";
import FolderItem from "@/components/folder-item";
import {
  FolderUp,
  Home,
  ChevronDown,
  FileUp,
  MapIcon,
  Globe,
  MapPin,
  Compass,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentItem, NodeType, FolderItemType } from "@/types";
import LoadingSpinner from "@/components/spinner";
import { toast } from "sonner";
import { capitalize } from "@/lib/utils";

interface PathSegment {
  id: string;
  name: string;
  type: FolderItemType;
  nodeType?: string;
  repoType?: string;
}

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
    case "location":
      return (
        <span className="flex items-center bg-cyan-50 text-cyan-600 px-2 gap-1">
          <Globe size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );
    case "map":
      return (
        <span className="flex items-center bg-green-50 text-green-600 px-2 gap-1">
          <MapIcon size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );

    case "spot":
      return (
        <span className="flex items-center bg-purple-50 text-purple-600 px-2 gap-1">
          <Compass size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );
    case "stop":
      return (
        <span className="flex items-center bg-orange-50 text-orange-600 px-2 gap-1">
          <MapPin size={15} strokeWidth={1.5} />
          <span>{node}</span>
        </span>
      );
  }
};

const UploadDialog = ({ allowedTypes = ["image", "audio"] }) => {
  const { uploadFile, isProcessing, isLoading, currentPath } =
    useContentStore();
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
      toast.error("Invalid file type. Please select an image or audio file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const currentNodeId = currentPath[currentPath.length - 1].id;
      await uploadFile(file, currentNodeId.split(":")[1]);
      setIsOpen(false);
      setFile(null);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="min-w-0"
          disabled={isProcessing || isLoading}
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
          accept={allowedTypes.map((type) => `${type}/*`).join(",")}
        />
        <Button onClick={handleUpload} disabled={!file || isProcessing}>
          Upload
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const CreateFolderDialog = () => {
  const { createNode, isProcessing, isLoading, currentPath } =
    useContentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderType, setFolderType] = useState("");

  const handleCreate = async () => {
    if (folderName && folderType) {
      const parentId = currentPath[currentPath.length - 1].id;
      try {
        await createNode(folderName, folderType as NodeType, parentId);
        setIsOpen(false);
        setFolderName("");
        setFolderType("");
      } catch (error) {
        console.error(error);
        // toast.error('Failed to create folder');
      }
    }
  };

  const getAvailableTypes = () => {
    const lastSegment = currentPath[currentPath.length - 1];
    if (lastSegment.nodeType?.toLowerCase() === "map") {
      return ["spot", "stop"];
    }
    return ["location", "map", "spot", "stop"];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          disabled={isLoading || isProcessing}
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
        <DropdownMenuItem onClick={() => setSortBy("name")}>
          By Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy("date")}>
          By Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy("size")}>
          By Size {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? "Descending" : "Ascending"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FolderView = () => {
  const {
    isLoading,
    sortedItems,
    selectedItems,
    toggleItemSelection,
    uploadFile,
    currentPath,
  } = useContentStore();

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const acceptedFiles = files.filter((file) =>
      ["image/", "audio/"].some((type) => file.type.startsWith(type))
    );

    if (acceptedFiles.length) {
      const currentNodeId = currentPath[currentPath.length - 1].id;
      for (const file of acceptedFiles) {
        try {
          await uploadFile(file, currentNodeId);
        } catch (error) {
          console.error(error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
    } else {
      toast.error("Only image or audio files are allowed!");
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
        e.key === "Escape" &&
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
      try {
        await navigateTo("root");
      } catch (error) {
        console.error(error);
        toast.error("Failed to initialize content");
      } finally {
        setIsLoading(false);
      }
    };

    initializeStore();
  }, [setIsLoading, navigateTo]);

  const handleBreadcrumbClick = async (segment: PathSegment, index: number) => {
    try {
      // Navigate to the clicked segment
      await navigateTo(segment.id, index);
    } catch (error) {
      console.error(error);
      toast.error("Failed to navigate");
    }
  };

  const handleUpLevel = () => {
    if (currentPath.length > 1) {
      const parentIndex = currentPath.length - 2;
      const parentSegment = currentPath[parentIndex];
      handleBreadcrumbClick(parentSegment, parentIndex);
    }
  };

  const canNavigateUp = currentPath.length > 1;
  const currentSegment = currentPath[currentPath.length - 1];
  const isRoot = currentPath.length === 1;

  useEffect(() => {
    if (error) toast.error(error);
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
              onClick={() => navigateTo("root")}
            >
              <Home size={16} />
            </Button>
            <UploadDialog />
            <CreateFolderDialog />
            <SortDropdown />
          </div>
        </div>
        <FolderView />
        <AudioPlayer />
      </div>
    </div>
  );
};

export default ContentExplorer;
