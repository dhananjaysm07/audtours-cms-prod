import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { useArtistStore } from "@/store/useArtistStore";

interface ArtistManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ArtistManagementDialog = ({
  isOpen,
  onOpenChange,
}: ArtistManagementDialogProps) => {
  const { artists, createArtist, toggleArtistStatus } = useArtistStore();
  const [newArtistName, setNewArtistName] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Artists</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add New Artist */}
          <div className="flex gap-2">
            <Input
              value={newArtistName}
              onChange={(e) => setNewArtistName(e.target.value)}
              placeholder="New artist name"
            />
            <Button
              onClick={() => {
                createArtist(newArtistName);
                setNewArtistName("");
              }}
            >
              Add
            </Button>
          </div>

          {/* List of Artists */}
          <div className="space-y-2">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="flex justify-between items-center"
              >
                <span>{artist.name}</span>
                <Switch
                  checked={artist.isActive}
                  onCheckedChange={() => toggleArtistStatus(artist.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistManagementDialog;
