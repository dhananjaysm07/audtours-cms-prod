// Constants
export const FOLDER_ITEM_TYPE = {
  FOLDER: 'folder',
  FILE: 'file',
  REPOSITORY: 'repository',
} as const;

export const REPOSITORY_KINDS = {
  AUDIO: 'audio',
  GALLERY: 'gallery',
  MAP: 'map',
} as const;

export const NODE_TYPES = {
  MAP: 'map',
  LOCATION: 'location',
  SPOT: 'spot',
  STOP: 'stop',
} as const;

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
  CONTENT_MANAGER: 'content_manager',
  OPERATION_MANAGER: 'operation_manager',
  STORE_MANAGER: 'store_manager',
} as const;

// Type Utilities
export type FolderItemType =
  (typeof FOLDER_ITEM_TYPE)[keyof typeof FOLDER_ITEM_TYPE];
export type RepositoryKind =
  (typeof REPOSITORY_KINDS)[keyof typeof REPOSITORY_KINDS];
export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// Upload File Dialog Box
export type UploadDialogPropsType = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  allowedTypes?: Array<'image' | 'audio' | 'application/pdf'>;
};

// Base interfaces
interface BaseItem {
  id: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Main interfaces
export interface Repository extends BaseItem {
  nodeId: number;
  type: RepositoryKind;
  language?: string | null;
  languageId?: number | null;
}

export interface Node extends BaseItem {
  name: string;
  type: NodeType;
  level: number;
  path: string;
  parentId: number | null;
  code: string | null;
  artistId: number | null;
  artistName: string | null;
}

export interface RepositoryFile extends BaseItem {
  name: string;
  repoId: number;
  type: string;
  filename: string;
  size: number;
  mimeType: string;
  position: number;
  path: string;
  languageId: number | null;
}

// Content item types
export type ContentItem = {
  id: string;
  name: string;
  type: FolderItemType;
  nodeType?: NodeType;
  level?: number;
  path?: string;
  parentId?: number | null;
  artistId?: number | null;
  artistName?: string | null;
  repoId?: number;
  languageId?: number | null;
  language?: string | null;
  repoType?: RepositoryKind;
  filename?: string;
  size?: number;
  mimeType?: string;
  position?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  code?: string | null;
};

export interface Artist {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Metadata interfaces
export interface AudioMetadata {
  duration: number;
  size: string;
  createdAt: string;
}

export interface ImageMetadata {
  url: string;
  position: number;
  createdAt: string;
}

export interface UploadFiledata {
  file: File;
  name: string;
  position: number | null;
  repoId: string;
  force_position: boolean;
}

export interface EditFileData {
  name: string;
  position: number | undefined;
}

// Store state interfaces
export interface ContentState {
  items: ContentItem[];
  selectedItems: string[];
  sortedItems: ContentItem[];
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  isProcessing: boolean;
  error: string | null;
  error_status: number | null;
  display_toast: boolean;
  isLoading: boolean;
  currentPath: Array<{
    id: string;
    name: string;
    type: FolderItemType;
    repoType?: RepositoryKind;
    nodeType?: NodeType;
  }>;
  currentAudioId: string | null;
  isAudioPlaying: boolean;
}

export interface ContentActions {
  setIsLoading: (loading: boolean) => void;
  navigateTo: (id: string, pathIndex?: number) => Promise<void>;
  createNode: (
    name: string,
    type: NodeType,
    parentId: string | null,
    code: string | null,
    artistId: number | null,
  ) => Promise<void>;
  uploadFile: (uploadFiledata: UploadFiledata) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  renameNode: (id: string, newName: string) => Promise<void>;
  setSortBy: (sortBy: ContentState['sortBy']) => void;
  setSortOrder: (sortOrder: ContentState['sortOrder']) => void;
  toggleItemSelection: (id: string) => void;
  toggleDisplayToastStatus: () => void;
  setCurrentAudio: (id: string) => void;
  setIsAudioPlaying: (isPlaying: boolean) => void;
  playAudio: (id: string) => void;
  editFile: (
    repoId: number,
    fileId: string,
    data: EditFileData,
    forcePosition: boolean,
  ) => Promise<void>;
  getHierarchy: (nodeId: number) => Promise<void>;
  editFolder: (
    nodeId: string,
    data: {
      name?: string;
      artistId?: number | null;
      code?: string | null;
    },
  ) => Promise<void>;
  setNodeActivation: (nodeId: string, isActive: boolean) => Promise<void>;
  createRepository: (
    nodeId: number,
    type: (typeof REPOSITORY_KINDS)[keyof typeof REPOSITORY_KINDS],
    languageId?: number,
  ) => Promise<void>;
}

// API interfaces
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  meta?: {
    pagination: PaginationMeta;
  };
  message?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse
  extends ApiResponse<{
    token: string;
    user: User;
  }> {
  status: 'success' | 'error';
  data: {
    token: string;
    user: User;
  };
  message: string;
}

export type FetchChildrenResponse = {
  children: Node[];
  repositories: Repository[];
};

export type CreateCodeData = {
  nodeIds: number[];
  expiryDays: number;
  expiryHours: number;
  maxUsers: number;
};

export interface User {
  userId: number;
  email: string;
  name: string;
  isEmailVerified: boolean;
  otp: string;
  resetPasswordOTP: string;
}

export interface CodeNode {
  nodeId: number;
  name: string;
  path: string;
  type: string;
}

export interface Language {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Store {
  id: number;
  bokunId: string;
  banner: string;
  heading: string;
  description: string;
  country: string; // New field
  continent: string; // New field
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: Node[];
}

export interface CodeResponse {
  codeId: number; // Using codeId instead of id
  code: string;
  validFrom: string;
  validTo: string;
  maxUsers: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: CodeNode[];
}

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export interface Template {
  id: number;
  nodeId: number;
  content: string | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GetCodesResponse = CodeResponse[];
