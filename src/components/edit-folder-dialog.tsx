import { useState, useEffect } from "react";
import { useContentStore } from "@/store/useContentStore";
import { useArtistStore } from "@/store/useArtistStore";
import { ContentItem, NODE_TYPES } from "@/types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ArtistManagementDialog from "./artist-management-dialog";

interface EditFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: ContentItem;
}

const EditFolderDialog = ({ node, isOpen, onClose }: EditFileDialogProps) => {
  const { editFolder, isProcessing } = useContentStore();
  const { artists, fetchArtists } = useArtistStore();
  const [folderName, setFolderName] = useState(node.name);
  const [code, setCode] = useState(node.code || "");
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false);
  const [artistId, setArtistId] = useState<number | null>(
    node.artistId || null
  );

  const handleEdit = async () => {
    if (folderName) {
      try {
        await editFolder(node.id.toString(), {
          name: folderName,
          code: code,
          artistId: artistId,
        });
        onClose();
      } catch (error) {
        console.error(error);
        // toast.error('Failed to update folder');
      }
    }
  };

  // Fetch artists when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchArtists();
    }
  }, [isOpen, fetchArtists]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary" disabled={isProcessing}>
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />

          {/* Conditionally render code and artist fields for 'stop' type */}
          {node.nodeType === NODE_TYPES.STOP && (
            <>
              <Input
                placeholder="Code (optional)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex gap-2">
                <Select
                  value={artistId ? String(artistId) : ""}
                  onValueChange={(value) => setArtistId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select artist (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists
                      .filter((artist) => artist.isActive)
                      .map((artist) => (
                        <SelectItem key={artist.id} value={String(artist.id)}>
                          {artist.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsArtistDialogOpen(true)}>
                  Manage Artists
                </Button>
              </div>
            </>
          )}

          <Button onClick={handleEdit} disabled={!folderName || isProcessing}>
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>
      <ArtistManagementDialog
        isOpen={isArtistDialogOpen}
        onOpenChange={setIsArtistDialogOpen}
      />
    </>
  );
};

export default EditFolderDialog;
