import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { useLanguageStore } from "@/store/useLanguageStore";

interface LanguageManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const LanguageManagementDialog = ({
  isOpen,
  onOpenChange,
}: LanguageManagementDialogProps) => {
  const { languages, createLanguage, toggleLanguageStatus } =
    useLanguageStore();
  const [newLanguageName, setNewLanguageName] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              <div key={lang.id} className="flex justify-between items-center">
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
  );
};

export default LanguageManagementDialog;
