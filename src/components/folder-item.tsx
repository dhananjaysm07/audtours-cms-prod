import React, { useState } from 'react';
import { useContentStore } from '@/store/useContentStore';
import { ContentItem, FOLDER_ITEM_TYPE, NODE_TYPES } from '@/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  Eye,
  Play,
  TextCursorInput,
  Trash2,
  Info,
  File,
  Folder,
  Music,
  Image as ImageIcon,
  Edit,
  EyeOff,
  EyeIcon,
  Map,
  Upload,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import ImageViewer from './image-viewer';
import EditFileDialog from './edit-file-dialog';
import EditFolderDialog from './edit-folder-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FolderItemProps {
  item: ContentItem;
}

interface TemplateData {
  image: File | null;
  content: string;
  templateName: string;
}

const getFolderItemIcon = (item: ContentItem) => {
  // Apply reduced opacity if the item is inactive
  const iconStyle = {
    opacity: item.isActive ? 1 : 0.6, // Adjust opacity for inactive items
  };

  if (item.type === 'folder') {
    return (
      <Folder
        size={56}
        className="text-blue-500 fill-blue-500"
        strokeWidth={1.5}
        style={iconStyle} // Apply opacity style
      />
    );
  }

  // Handle repositories
  if (item.type === 'repository' && item.repoType === 'gallery') {
    return (
      <div className="relative" style={iconStyle}>
        {' '}
        {/* Apply opacity to the container */}
        <ImageIcon
          size={16}
          className="text-indigo-200 bottom-4 absolute right-2"
          strokeWidth={2}
        />
        <Folder
          size={56}
          className="text-indigo-500 fill-indigo-500 top-0 left-0"
          strokeWidth={1.5}
        />
      </div>
    );
  }
  if (item.type === 'repository' && item.repoType === 'audio') {
    return (
      <div className="relative" style={iconStyle}>
        {' '}
        {/* Apply opacity to the container */}
        <Music
          size={16}
          className="text-purple-300 bottom-4 absolute right-2"
          strokeWidth={2}
        />
        <Folder
          size={56}
          className="text-purple-500 fill-purple-500 top-0 left-0"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (item.type === 'repository' && item.repoType === 'map') {
    return (
      <div className="relative" style={iconStyle}>
        {' '}
        {/* Apply opacity to the container */}
        <Map
          size={16}
          className="text-violet-300 bottom-4 absolute right-2"
          strokeWidth={2}
        />
        <Folder
          size={56}
          className="text-violet-500 fill-violet-500 top-0 left-0"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (item.type === 'file' && item.mimeType?.startsWith('image')) {
    return (
      <img
        src={item.path}
        className="w-[100px] h-[100px] object-cover block"
        alt="uploaded"
      />
    );
  }

  return (
    <File
      size={56}
      className="text-gray-500"
      strokeWidth={1.5}
      style={iconStyle} // Apply opacity style
    />
  );
};

const FolderItem: React.FC<FolderItemProps> = ({ item }) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState(item.name);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData>({
    image: null,
    content: '',
    templateName: '',
  });

  const {
    navigateTo,
    selectedItems,
    toggleItemSelection,
    renameNode,
    deleteNode,
    playAudio,
    setNodeActivation,
  } = useContentStore();

  const handleDoubleClick = () => {
    selectedItems.forEach(id => toggleItemSelection(id));
    toggleItemSelection(item.id);
    // Navigate when using folder or repository
    if (item.type === 'folder' || item.type === 'repository')
      navigateTo(item.id);

    if (item.type === 'file' && item.mimeType?.startsWith('image')) {
      setIsImageViewerOpen(true);
    }

    if (item.type === 'file' && item.mimeType?.startsWith('audio'))
      playAudio(item.id);
  };

  const handleOpen = handleDoubleClick;
  const isItemSelected = selectedItems.includes(item.id);

  const handleSelection = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    toggleItemSelection(item.id);
  };

  const handleRename = async () => {
    try {
      await renameNode(item.id, newItemName);
      setIsRenameDialogOpen(false);
      toast.success('Item renamed successfully');
    } catch (error) {
      toast.error('Failed to rename item');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNode(item.id);
      setIsDeleteDialogOpen(false);
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleActivation = async () => {
    try {
      await setNodeActivation(item.id, !item.isActive);
    } catch (error) {
      toast.error('Failed to update item visibility');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateData({ ...templateData, image: file });

      // Set preview for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTemplateData({ ...templateData, content: e.target.value });
  };

  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateData({ ...templateData, templateName: e.target.value });
  };

  const handleTemplateSubmit = async () => {
    try {
      // Here you would typically call an API to save the template
      // For now, we'll just log the data and show a success message
      console.log('Template data to be submitted:', {
        nodeId: item.id,
        templateName: templateData.templateName,
        content: templateData.content,
        image: templateData.image,
      });

      // Reset form and close dialog
      setTemplateData({ image: null, content: '', templateName: '' });
      setTemplatePreview(null);
      setIsTemplateDialogOpen(false);

      toast.success('Template added successfully');
    } catch (error) {
      console.error('Template submission error:', error);
      toast.error('Failed to add template');
    }
  };

  // Check if the item is eligible for template addition
  const canAddTemplate =
    item.type === FOLDER_ITEM_TYPE.FOLDER &&
    (item.nodeType === NODE_TYPES.MAP ||
      item.nodeType === NODE_TYPES.SPOT ||
      item.nodeType === NODE_TYPES.STOP);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={handleSelection}
            onDoubleClick={handleDoubleClick}
            className={cn(
              'h-28 aspect-square flex flex-col items-center focus-visible:outline hover:bg-blue-50 justify-center shrink-0 rounded-lg',
              isItemSelected && 'bg-blue-50 outline outline-blue-200',
            )}
            tabIndex={0}
          >
            {getFolderItemIcon(item)}
            <div className="flex justify-center">
              <span className="text-sm truncate max-w-24 capitalize">
                {item.name}
                {item.language && ` (${item.language})`}
              </span>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-40">
          <ContextMenuItem
            className="flex gap-2 justify-between"
            onSelect={handleOpen}
          >
            <span>
              {item.type === 'file' && item.mimeType?.startsWith('audio')
                ? 'Play'
                : item.type === 'file' && item.mimeType?.startsWith('image')
                ? 'View'
                : 'Open'}
            </span>
            {item.type === 'file' && item.mimeType?.startsWith('audio') ? (
              <Play size={16} className="text-neutral-600" strokeWidth={1.5} />
            ) : item.type === 'file' && item.mimeType?.startsWith('image') ? (
              <Eye size={16} className="text-neutral-600" strokeWidth={1.5} />
            ) : (
              <FolderOpen
                size={16}
                className="text-neutral-600"
                strokeWidth={1.5}
              />
            )}
          </ContextMenuItem>

          {/* Add Template option - only for map/spot/stop folder types */}
          {canAddTemplate && (
            <ContextMenuItem
              className="flex gap-2 justify-between"
              onSelect={() => setIsTemplateDialogOpen(true)}
            >
              <span>Add Template</span>
              <FileText
                size={16}
                className="text-neutral-600"
                strokeWidth={1.5}
              />
            </ContextMenuItem>
          )}

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
          {item.nodeType == NODE_TYPES.STOP &&
          item.type == FOLDER_ITEM_TYPE.FOLDER ? (
            <ContextMenuItem
              className="flex gap-2 justify-between"
              onSelect={() => setIsEditFolderDialogOpen(true)}
            >
              <span>Edit</span>
              <Edit size={16} className="text-neutral-600" strokeWidth={1.5} />
            </ContextMenuItem>
          ) : (
            ''
          )}
          {item.type == FOLDER_ITEM_TYPE.FOLDER ? (
            <ContextMenuItem
              className="flex gap-2 justify-between"
              onSelect={handleToggleActivation}
            >
              {item.isActive ? (
                <>
                  <span>Hide</span>
                  <EyeOff
                    size={16}
                    className="text-neutral-600"
                    strokeWidth={1.5}
                  />
                </>
              ) : (
                <>
                  <span>Unhide</span>
                  <EyeIcon
                    size={16}
                    className="text-neutral-600"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </ContextMenuItem>
          ) : (
            ''
          )}

          {item.type == 'file' ? (
            <ContextMenuItem
              className="flex gap-2 justify-between"
              onSelect={() => setIsEditDialogOpen(true)}
            >
              <span>Edit</span>
              <Edit size={16} className="text-neutral-600" strokeWidth={1.5} />
            </ContextMenuItem>
          ) : (
            ''
          )}

          {item.type == FOLDER_ITEM_TYPE.FOLDER ? (
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
          ) : (
            ''
          )}

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
            onChange={e => setNewItemName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" className="w-full" onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Template</DialogTitle>
            <DialogDescription>
              Add a template to {item.nodeType?.toLowerCase()} "{item.name}".
              The template can include both an image and text content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateData.templateName}
                onChange={handleTemplateNameChange}
                placeholder="Enter template name"
              />
            </div>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="content" className="flex-1">
                  Content
                </TabsTrigger>
                <TabsTrigger value="image" className="flex-1">
                  Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-2">
                <Label htmlFor="content">Template Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={templateData.content}
                  onChange={handleContentChange}
                  placeholder="Enter your markdown content here..."
                  className="min-h-[200px] max-h-[200px] resize-none"
                />
              </TabsContent>

              <TabsContent value="image" className="space-y-2">
                <Label htmlFor="image">Template Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  {templatePreview ? (
                    <div className="relative">
                      <img
                        src={templatePreview}
                        alt="Template preview"
                        className="max-h-[180px] mx-auto"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 bg-white rounded-full p-1"
                        onClick={() => {
                          setTemplatePreview(null);
                          setTemplateData({ ...templateData, image: null });
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button
              onClick={handleTemplateSubmit}
              disabled={!templateData.templateName}
            >
              Add Template
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Label>Name</Label>
              <span className="text-neutral-700 text-sm">{item.name}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Label>Type</Label>
              <span className="text-neutral-700 text-sm">{item.nodeType}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Label>Path</Label>
              <span className="text-neutral-700 text-sm">{item.path}</span>
            </div>
            {item.nodeType == NODE_TYPES.STOP ? (
              <div className="flex gap-2 items-center">
                <Label>Artist</Label>
                <span className="text-neutral-700 text-sm">
                  {item.artistName}
                </span>
              </div>
            ) : (
              ''
            )}

            {item.nodeType == NODE_TYPES.STOP ? (
              <div className="flex gap-2 items-center">
                <Label>Code</Label>
                <span className="text-neutral-700 text-sm">{item.code}</span>
              </div>
            ) : (
              ''
            )}

            <div className="flex gap-2 items-center">
              <Label>Created</Label>
              <span className="text-neutral-700 text-sm">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            {item.type === 'repository' && item.repoType === 'gallery' && (
              <div className="flex gap-2 items-center">
                <Label>Repository</Label>
                <span className="text-neutral-700 text-sm">Gallery</span>
              </div>
            )}
            {item.type === 'repository' && item.repoType === 'audio' && (
              <div className="flex gap-2 items-center">
                <Label>Repository</Label>
                <span className="text-neutral-700 text-sm">Audio</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {item.mimeType?.startsWith('image') && item.path && (
        <ImageViewer
          isOpen={isImageViewerOpen}
          imageUrl={item.path}
          onClose={() => setIsImageViewerOpen}
          alt={item.name}
        />
      )}

      {isEditDialogOpen ? (
        <EditFileDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          item={item}
        />
      ) : (
        ''
      )}

      {isEditFolderDialogOpen ? (
        <EditFolderDialog
          isOpen={isEditFolderDialogOpen}
          onClose={() => setIsEditFolderDialogOpen(false)}
          node={item}
        />
      ) : (
        ''
      )}
    </>
  );
};

export default FolderItem;
