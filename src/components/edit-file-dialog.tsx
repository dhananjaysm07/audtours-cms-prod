import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useContentStore } from '@/store/useContentStore';
import { toast } from 'sonner';
import { ContentItem } from '@/types';

interface EditFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem;
}

const EditFileDialog = ({ isOpen, onClose, item }: EditFileDialogProps) => {
  const [formData, setFormData] = useState({
    name: item.name,
    position: item.position,
    languageId: item.languageId || null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const { editFile, error, error_status } = useContentStore();

  useEffect(() => {
    if (isEditing && error_status == 409 && error) {
      handleSubmitAnyway();
    } else if (isEditing && error_status == null && error == null) {
      toast.success('File updated successfully');
      onClose();
      setIsEditing(false);
    }
  }, [error_status, error]);

  const handleSubmit = async (forcePosition: boolean = false) => {
    setIsEditing(true);
    try {
      await editFile(item.repoId as number, item.id, formData, forcePosition);
    } catch (error) {
      toast.error('Failed to update file');
    }
  };

  async function handleSubmitAnyway() {
    const shouldForce = await new Promise(resolve => {
      toast.error(error, {
        action: {
          label: 'Add Anyway',
          onClick: () => {
            resolve(true);
            return false;
          },
        },
        onDismiss: () => resolve(false),
        duration: 6000,
      });
    });
    if (shouldForce) {
      handleSubmit(true);
    } else {
      onClose();
      setIsEditing(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Position</Label>
            <Input
              type="number"
              value={formData.position}
              onChange={e =>
                setFormData({ ...formData, position: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => handleSubmit(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFileDialog;
