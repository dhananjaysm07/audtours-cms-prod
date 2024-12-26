export const FOLDER_TYPES = {
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

export type FolderKind = keyof typeof FOLDER_TYPES;
export type FileKind = keyof typeof FILE_KINDS;
export type FolderKindSpecific = keyof typeof FOLDER_KINDS;

export interface FolderItem {
  id: string;
  name: string;
  kind: FolderKind; // 'folder', 'file', or 'root'
  parentId: string | null;
  fileKind?: FileKind; // Optional: 'audio' or 'image' if it's a file
  folderKind?: FolderKindSpecific; // Optional: Specific folder type ('map', 'location', etc.)
}

export interface FolderState {
  items: FolderItem[];
  selectedItems: string[];
  currentFolderId: string | null;
  currentFolderName: string;
}

export interface FolderActions {
  addItem: (item: FolderItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<FolderItem>) => void;
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
