// Constants
export const FOLDER_ITEM_TYPE = {
  FOLDER: "folder",
  FILE: "file",
  REPOSITORY: "repository",
} as const;

export const REPOSITORY_KINDS = {
  AUDIO: "audio",
  GALLERY: "gallery",
} as const;

export const NODE_TYPES = {
  MAP: "map",
  LOCATION: "location",
  SPOT: "spot",
  STOP: "stop",
} as const;

// Type Utilities
export type FolderItemType =
  (typeof FOLDER_ITEM_TYPE)[keyof typeof FOLDER_ITEM_TYPE];
export type RepositoryKind =
  (typeof REPOSITORY_KINDS)[keyof typeof REPOSITORY_KINDS];
export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

// Base interfaces
interface BaseItem {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Main interfaces
export interface Repository extends BaseItem {
  nodeId: number;
  type: RepositoryKind;
}

export interface Node extends BaseItem {
  name: string;
  type: NodeType;
  level: number;
  path: string;
  parentId: number | null;
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
  repoId?: number;
  repoType?: RepositoryKind;
  filename?: string;
  size?: number;
  mimeType?: string;
  position?: number;
  createdAt: string;
  updatedAt: string;
};

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

// Store state interfaces
export interface ContentState {
  items: ContentItem[];
  selectedItems: string[];
  sortedItems: ContentItem[];
  sortBy: "name" | "date" | "size";
  sortOrder: "asc" | "desc";
  isProcessing: boolean;
  error: string | null;
  error_status: number | null;
  display_error: boolean;
  isLoading: boolean;
  currentPath: Array<{
    id: string;
    name: string;
    type: FolderItemType;
    repoType?: RepositoryKind;
    nodeType?: NodeType;
  }>;
}

export interface ContentActions {
  setIsLoading: (loading: boolean) => void;
  navigateTo: (id: string, pathIndex?: number) => Promise<void>;
  createNode: (
    name: string,
    type: NodeType,
    parentId: string | null
  ) => Promise<void>;
  uploadFile: (uploadFiledata: UploadFiledata) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  renameNode: (id: string, newName: string) => Promise<void>;
  setSortBy: (sortBy: ContentState["sortBy"]) => void;
  setSortOrder: (sortOrder: ContentState["sortOrder"]) => void;
  toggleItemSelection: (id: string) => void;
}

// API interfaces
export interface ApiResponse<T> {
  status: "success" | "error";
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
  role: "admin" | "user";
}

export interface AuthResponse
  extends ApiResponse<{
    token: string;
    user: User;
  }> {
  status: "success" | "error";
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
  validFrom: string; // ISO date string
  validTo: string; // ISO date string
  maxUsers: number;
};

export interface CodeNode {
  nodeId: number;
  name: string;
  path: string;
  type: string;
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

export type GetCodesResponse = CodeResponse[];
