import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PositionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (position: number) => void;
  currentPosition?: number;
}

const PositionDialog: React.FC<PositionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPosition,
}) => {
  const [position, setPosition] = useState(currentPosition || 999);

  const handleSave = () => {
    onSave(position);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Image Position</DialogTitle>
        </DialogHeader>
        <Input
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          placeholder="Enter position (e.g., 1,2)"
        />
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PositionDialog;
