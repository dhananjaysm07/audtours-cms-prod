import { useLanguageStore } from "@/store/useLanguageStore";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { useContentStore } from "@/store/useContentStore";
import { toast } from "sonner";

const EditFileDialog = ({ isOpen, onClose, item }) => {
  const { languages, fetchLanguages } = useLanguageStore();
  const [formData, setFormData] = useState({
    name: item.name,
    position: item.position,
    languageId: item.languageId || null,
  });
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { createLanguage, toggleLanguageStatus } = useLanguageStore();
  const { editFile, error, error_status } = useContentStore();
  useEffect(() => {
    fetchLanguages();
  }, []);
  useEffect(() => {
    if (isEditing && error_status == 409 && error) {
      handleSubmitAnyway();
    } else if (isEditing && error_status == null && error == null) {
      toast.success("File updated successfully");
      onClose();
      setIsEditing(false);
    }
  }, [error_status, error]);

  const handleSubmit = async (forcePosition: boolean = false) => {
    setIsEditing(true);
    try {
      await editFile(item.repoId, item.id, formData, forcePosition);
    } catch (error) {
      toast.error("Failed to update file");
    }
  };

  async function handleSubmitAnyway() {
    const shouldForce = await new Promise((resolve) => {
      toast.error(error, {
        action: {
          label: "Add Anyway",
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Position</Label>
            <Input
              type="number"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: Number(e.target.value) })
              }
            />
          </div>
          {item.mimeType?.startsWith("audio") && (
            <div>
              <div className="flex justify-between items-center">
                <Label>Language</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddLanguageOpen(true)}
                >
                  Manage Languages
                </Button>
              </div>
              <Select
                value={formData.languageId?.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    languageId: value ? Number(value) : null,
                  })
                }
                defaultValue={item.languageId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages
                    .filter((lang) => lang.isActive)
                    .map((lang) => (
                      <SelectItem key={lang.id} value={lang.id.toString()}>
                        {lang.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => handleSubmit(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>

      {/* Language Management Dialog */}
      <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Languages</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newLanguageName}
                onChange={(e) => setNewLanguageName(e.target.value)}
                placeholder="New language name"
              />
              <Button
                onClick={() => {
                  createLanguage(newLanguageName);
                  setNewLanguageName("");
                }}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className="flex justify-between items-center"
                >
                  <span>{lang.name}</span>
                  <Switch
                    checked={lang.isActive}
                    onCheckedChange={() => toggleLanguageStatus(lang.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default EditFileDialog;
