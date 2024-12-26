import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  Eye,
  FileAudio2,
  FileQuestion,
  Folder,
  FolderOpen,
  Info,
  Play,
  TextCursorInput,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileKind, FolderItemKind, FolderItemProps } from '@/types';
import ImageViewer from './image-viewer';
import PositionDialog from './position-dialog';
import { toast } from 'sonner';
import { useContentStore } from '@/store/useContentStore';

const getFolderItemIcon = (
  kind: FolderItemKind,
  fileKind?: FileKind,
  imageMetadata?: { url: string; position: number }
) => {
  switch (kind) {
    case 'folder':
      return (
        <Folder
          className="text-blue-400 cursor-pointer"
          fill="currentColor"
          size={64}
        />
      );
    case 'file':
      if (fileKind === 'image' && imageMetadata) {
        return (
          <img
            src={imageMetadata?.url}
            alt="Thumbnail"
            width={56}
            height={56}
            className="aspect-square select-none mb-2 object-cover rounded-xl cursor-pointer"
            loading="lazy"
          />
        );
      } else if (fileKind === 'audio') {
        return (
          <FileAudio2
            className="text-red-400 cursor-pointer"
            strokeWidth={1.5}
            size={64}
          />
        );
      }
      break;
    default:
      return (
        <FileQuestion
          className="text-neutral-400 cursor-pointer"
          strokeWidth={1.5}
          size={64}
        />
      );
  }
};

const FolderItem: React.FC<FolderItemProps> = ({
  itemId,
  name,
  kind,

  fileKind,
  folderKind,
  audioMetadata,
  imageMetadata,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState(name);
  const { navigateTo } = useContentStore();

  const handleDoubleClick = () => {
    if (kind === 'folder') {
      navigateTo(itemId);
      console.log('Opening folder:', itemId);
    } else if (kind === 'file' && fileKind === 'image') {
      setIsImageViewerOpen(true);
    } else if (kind === 'file' && fileKind === 'audio') {
      console.log('Playing audio:', itemId);
    }
  };

  const handleRename = () => {
    console.log('Renamed to:', newItemName);
    setIsRenameDialogOpen(false);
    toast.info('Renaming item');
  };

  const handleDelete = () => {
    console.log('Item deleted:', itemId);
    setIsDeleteDialogOpen(false);
    toast('Item deleted successfully!');
  };

  const handleOpen = () => {
    handleDoubleClick();
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={() => setIsSelected(true)}
            onDoubleClick={handleDoubleClick}
            className={cn(
              'h-28 aspect-square flex flex-col items-center focus-visible:outline hover:bg-blue-50 justify-center shrink-0 rounded-lg',
              isSelected && 'bg-blue-50 outline outline-blue-200'
            )}
            tabIndex={0}
          >
            {getFolderItemIcon(kind, fileKind, imageMetadata)}
            <span className="text-sm">{name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-40">
          <ContextMenuItem
            className="flex gap-2 justify-between"
            onSelect={handleOpen}
          >
            <span>
              {kind === 'folder'
                ? 'Open'
                : fileKind === 'image'
                ? 'View'
                : 'Play'}
            </span>
            {kind === 'folder' ? (
              <FolderOpen
                size={16}
                className="text-neutral-600"
                strokeWidth={1.5}
              />
            ) : fileKind === 'image' ? (
              <Eye size={16} className="text-neutral-600" strokeWidth={1.5} />
            ) : (
              <Play size={16} className="text-neutral-600" strokeWidth={1.5} />
            )}
          </ContextMenuItem>
          <ContextMenuItem
            className="flex gap-2 justify-between"
            onSelect={() => setIsRenameDialogOpen(true)}
          >
            <span>Rename</span>
            <TextCursorInput
              size={16}
              className="text-neutral-600"
              strokeWidth={1.5}
            />
          </ContextMenuItem>
          {kind === 'file' && fileKind === 'image' && (
            <ContextMenuItem
              className="flex gap-2 justify-between"
              onSelect={() => setIsPositionDialogOpen(true)}
            >
              <span>Position</span>
              <ArrowLeftRight
                size={16}
                className="text-neutral-600"
                strokeWidth={1.5}
              />
            </ContextMenuItem>
          )}
          <ContextMenuItem
            className="flex gap-2 justify-between group"
            onSelect={() => setIsDeleteDialogOpen(true)}
          >
            <span className="group-hover:text-destructive">Delete</span>
            <Trash2
              size={16}
              className="group-hover:text-destructive text-neutral-600"
              strokeWidth={1.5}
            />
          </ContextMenuItem>
          <ContextMenuItem
            className="flex gap-2 justify-between"
            onSelect={() => setIsPropertiesDialogOpen(true)}
          >
            <span>Properties</span>
            <Info size={16} className="text-neutral-600" strokeWidth={1.5} />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
            <DialogDescription>
              Enter a new name for the item.
            </DialogDescription>
          </DialogHeader>
          <Input
            id="name"
            value={newItemName}
            className="shadow-none"
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant={'ghost'}
              className="w-full"
              type="submit"
              onClick={handleRename}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Properties Dialog */}
      <Dialog
        open={isPropertiesDialogOpen}
        onOpenChange={setIsPropertiesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Properties</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col">
            <div className="flex gap-2 items-center">
              <Label>Name</Label>
              <span className="text-neutral-700 text-sm">{name}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Label>Kind</Label>
              <span className="text-neutral-700 text-sm">{kind}</span>
            </div>
            {fileKind && (
              <div className="flex gap-2 items-center">
                <Label>File Type</Label>
                <span className="text-neutral-700 text-sm">{fileKind}</span>
              </div>
            )}
            {folderKind && (
              <div className="flex gap-2 items-center">
                <Label>Folder Type</Label>
                <span className="text-neutral-700 text-sm">{folderKind}</span>
              </div>
            )}
            {audioMetadata && (
              <>
                <div className="flex gap-2 items-center">
                  <Label>Duration</Label>
                  <span className="text-neutral-700 text-sm">
                    {audioMetadata.duration}s
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Label>Size</Label>
                  <span className="text-neutral-700 text-sm">
                    {audioMetadata.size}
                  </span>
                </div>
              </>
            )}
            {imageMetadata && (
              <div className="flex gap-2 items-center">
                <Label>Created At</Label>
                <span className="text-neutral-700 text-sm">
                  {imageMetadata.createdAt}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      {kind === 'file' && fileKind === 'image' && imageMetadata && (
        <ImageViewer
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          imageUrl={imageMetadata.url}
          alt={name}
        />
      )}

      {/* Position Dialog */}
      {kind === 'file' && fileKind === 'image' && (
        <PositionDialog
          isOpen={isPositionDialogOpen}
          onClose={() => setIsPositionDialogOpen(false)}
          onSave={(position) => {
            console.log('New position:', position);
            setIsPositionDialogOpen(false);
          }}
          currentPosition={imageMetadata!.position as number}
        />
      )}
    </>
  );
};

export default FolderItem;
