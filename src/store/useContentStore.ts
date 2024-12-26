import { create } from 'zustand';

interface ContentState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentPath: string[];
  folderContents: FolderItem[];
  navigateTo: (path: string[]) => void;
  createFolder: (name: string) => void;
  renameItem: (id: string, newName: string) => void;
  deleteItem: (id: string) => void;
}

export const useContentStore = create<ContentState>()((set) => ({
  isLoading: true,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  currentPath: [],
  folderContents: [
    { id: '1', name: 'Folder 1', type: 'folder' },
    { id: '2', name: 'Folder 2', type: 'folder' },
    { id: '3', name: 'File 1', type: 'file' },
  ],
  navigateTo: (path) => set({ currentPath: path }),
  createFolder: (name, folderKind) =>
    set((state) => ({
      folderContents: [
        ...state.folderContents,
        { id: Date.now().toString(), name, type: 'folder', folderKind },
      ],
    })),
  renameItem: (id, newName) =>
    set((state) => ({
      folderContents: state.folderContents.map((item) =>
        item.id === id ? { ...item, name: newName } : item
      ),
    })),
  deleteItem: (id) =>
    set((state) => ({
      folderContents: state.folderContents.filter((item) => item.id !== id),
    })),
}));
