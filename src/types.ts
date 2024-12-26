export const FOLDER_ITEM_TYPE = {
  FOLDER: 'folder',
  FILE: 'file',
  ROOT: 'root',
} as const;

export const FILE_KINDS = {
  AUDIO: 'audio',
  IMAGE: 'image',
} as const;

export const FOLDER_KINDS = {
  MAP: 'map',
  LOCATION: 'location',
  SPOT: 'spot',
  STOP: 'stop',
} as const;

export type FolderItemKind = 'folder' | 'file' | 'root';

// export type FolderItemKind = keyof typeof FOLDER_ITEM_TYPE;
// export type FileKind = keyof typeof FILE_KINDS;
export type FileKind = 'audio' | 'image';
export type FolderKindSpecific = keyof typeof FOLDER_KINDS;

export interface FolderItemProps {
  itemId: string;
  name: string;
  kind: FolderItemKind; // 'folder', 'file', or 'root'
  parentId: string | null;
  fileKind?: FileKind; // Optional: 'audio' or 'image' if it's a file
  folderKind?: FolderKindSpecific; // Optional: Specific folder type ('map', 'location', etc.)
  audioMetadata?: {
    duration: number;
    size: string;
    createdAt: string;
  };
  imageMetadata?: {
    url: string;
    position: number;
    createdAt: string;
  };
}

export interface FolderState {
  items: FolderItemProps[];
  selectedItems: string[];
  currentFolderId: string | null;
  currentFolderName: string;
}

export interface FolderActions {
  addItem: (item: FolderItemProps) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<FolderItemProps>) => void;
  moveItem: (id: string, newParentId: string) => void;
  setSelectedId: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
}

export interface AudioTrack {
  id: string;
  title: string;
  language: string;
  createdAt: string;
  duration: number;
  url: string;
  size: string;
}

export interface AudioState {
  isLoading: boolean;
  error: string | null;
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  tracks: AudioTrack[];
  queue: string[]; // Array of track IDs in queue
}

export interface AudioActions {
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTrack: (track: AudioTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setTracks: (tracks: AudioTrack[]) => void;
  addToQueue: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
  playNext: () => void;
  playPrevious: () => void;
}
