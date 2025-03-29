// src/components/template-dialog.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload } from 'lucide-react';
import LoadingSpinner from '@/components/spinner';
import { templateApi } from '@/lib/api';
import { ContentItem } from '@/types';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';

// Character limit for the rich text editor
const CHARACTER_LIMIT = 5000;

interface TemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem;
}

interface TemplateData {
  image: File | null;
  content: string;
}

const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 mb-2 border-b">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`p-1 w-8 h-8 ${
          editor.isActive('bold') ? 'bg-secondary' : ''
        }`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`p-1 w-8 h-8 ${
          editor.isActive('italic') ? 'bg-secondary' : ''
        }`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`p-1 w-8 h-8 ${
          editor.isActive('bulletList') ? 'bg-secondary' : ''
        }`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`p-1 w-8 h-8 ${
          editor.isActive('orderedList') ? 'bg-secondary' : ''
        }`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`p-1 w-8 h-8 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-secondary' : ''
        }`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`p-1 w-8 h-8 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-secondary' : ''
        }`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </Button>
    </div>
  );
};

const CharacterCounter: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const percentage = Math.round((characterCount / CHARACTER_LIMIT) * 100);

  return (
    <div className="text-xs mt-2 text-right text-muted-foreground">
      <span className={percentage > 90 ? 'text-red-500 font-semibold' : ''}>
        {characterCount}/{CHARACTER_LIMIT} characters ({percentage}%)
      </span>
    </div>
  );
};

// Import the necessary Lucide icons
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from 'lucide-react';

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
}) => {
  const [templateData, setTemplateData] = useState<TemplateData>({
    image: null,
    content: '',
  });
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder: 'Enter tour info...' }),
      Link.configure({ openOnClick: false }),
      CharacterCount.configure({ limit: CHARACTER_LIMIT }),
    ],
    content: templateData.content,
    onUpdate: ({ editor }) => {
      setTemplateData(prev => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm focus:outline-none p-2 min-h-[200px] max-h-[250px] overflow-y-auto',
      },
    },
  });

  // Fetch existing template when dialog opens
  useEffect(() => {
    const fetchExistingTemplate = async () => {
      if (!isOpen || !item.id) return;

      try {
        setIsLoadingTemplate(true);
        const nodeId = parseInt(item.id.toString());

        if (isNaN(nodeId)) {
          throw new Error('Invalid node ID');
        }

        const response = await templateApi.getTemplateByNodeId(nodeId);

        if (response.status === 'success' && response.data) {
          setTemplateData({
            image: null,
            content: response.data.content || '',
          });

          if (response.data.imagePath) {
            setTemplatePreview(response.data.imagePath);
          }
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast.error('Failed to load template');
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    if (isOpen) {
      fetchExistingTemplate();
    }
  }, [isOpen, item.id]);

  // Update editor content when it changes externally
  useEffect(() => {
    if (editor && templateData.content !== editor.getHTML()) {
      editor.commands.setContent(templateData.content);
    }
  }, [editor, templateData.content]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      setTemplateData(prev => ({ ...prev, image: file }));

      // Set preview for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateSubmit = async () => {
    try {
      setIsSavingTemplate(true);
      const nodeId = parseInt(item.id.toString());

      if (isNaN(nodeId)) {
        throw new Error('Invalid node ID');
      }

      const response = await templateApi.upsertTemplate(
        nodeId,
        templateData.content,
        templateData.image || undefined,
      );

      if (response.status === 'success') {
        onOpenChange(false);
        toast.success('Template saved successfully');
      } else {
        toast.error(response.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Template submission error:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Tour Template</DialogTitle>
          <DialogDescription>
            Create a template for {item.nodeType?.toLowerCase()} "{item.name}".
            This template will be used to generate tour tickets.
          </DialogDescription>
        </DialogHeader>

        {isLoadingTemplate ? (
          <div className="flex justify-center items-center h-48">
            <LoadingSpinner />
            <span className="ml-2">Loading template...</span>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
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
                <Label htmlFor="content">Tour Information</Label>
                <div className="border rounded-md overflow-hidden">
                  {editor && <MenuBar editor={editor} />}
                  <style>{`
                    .ProseMirror {
                      min-height: 200px;
                      max-height: 250px;
                      overflow-y: auto;
                      padding: 8px;
                      outline: none !important;
                    }
                    
                    .ProseMirror p {
                      margin-bottom: 0.75em;
                    }
                    
                    .ProseMirror h1 {
                      font-size: 1.5em;
                      font-weight: 600;
                      margin-top: 0.5em;
                      margin-bottom: 0.5em;
                    }
                    
                    .ProseMirror h2 {
                      font-size: 1.25em;
                      font-weight: 600;
                      margin-top: 0.5em;
                      margin-bottom: 0.5em;
                    }
                    
                    .ProseMirror ul {
                      list-style-type: disc;
                      padding-left: 1.5em;
                      margin-bottom: 0.75em;
                    }
                    
                    .ProseMirror ol {
                      list-style-type: decimal;
                      padding-left: 1.5em;
                      margin-bottom: 0.75em;
                    }
                    
                    .ProseMirror a {
                      color: #6366f1;
                      text-decoration: underline;
                    }
                  `}</style>
                  <EditorContent editor={editor} className="px-3 pb-3" />
                  {editor && <CharacterCounter editor={editor} />}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground mt-1">
                    Format your content using the toolbar above. Content will be
                    preserved in the PDF.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum 5,000 characters. Add details about the tour,
                    important information, and highlights.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-2">
                <Label htmlFor="image">Template Image</Label>
                {templatePreview ? (
                  <div className="relative border rounded-md p-4 flex justify-center">
                    <img
                      src={templatePreview}
                      alt="Template preview"
                      className="max-h-[250px] mx-auto object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-100"
                      onClick={() => {
                        setTemplatePreview(null);
                        setTemplateData(prev => ({ ...prev, image: null }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer block hover:border-gray-400 transition-colors"
                    htmlFor="template-image-upload"
                  >
                    <div className="py-4">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG or WEBP (max 10MB)
                      </p>
                      <Input
                        id="template-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </label>
                )}
                <p className="text-xs text-muted-foreground">
                  The image will appear on the tour ticket. Recommended size:
                  800x400px.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleTemplateSubmit}
            disabled={
              (!templateData.content.trim() &&
                !templateData.image &&
                !templatePreview) ||
              isSavingTemplate ||
              isLoadingTemplate
            }
          >
            {isSavingTemplate ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              'Save Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
