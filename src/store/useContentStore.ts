import { create } from 'zustand';
import { FolderItemProps, FolderKindSpecific, FileKind } from '@/types';

interface ContentState {
  items: FolderItemProps[];
  selectedItems: string[];
  sortedItems: FolderItemProps[];
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  isProcessing: boolean;
  error: string | null;
  isAudioAvailable: boolean;
  isImageAvailable: boolean;
  isLoading: boolean;
  currentPath: { itemId: string; name: string }[];
  sortingTypes: Array<{ value: 'name' | 'date' | 'size'; label: string }>;
}

interface ContentActions {
  setIsLoading: (loading: boolean) => void;
  navigateTo: (itemId: string) => Promise<void>;
  createFolder: (name: string, folderKind: FolderKindSpecific) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  renameItem: (id: string, newName: string) => Promise<void>;
  setPosition: (id: string, newPosition: number) => Promise<void>;
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  toggleItemSelection: (id: string) => void;
}

const dummyData: FolderItemProps[] = [
  { itemId: 'root', name: 'Home', kind: 'folder', parentId: null },
  { itemId: '1', name: 'Folder 1', kind: 'folder', parentId: 'root' },
  { itemId: '2', name: 'Folder 2', kind: 'folder', parentId: 'root' },
  {
    itemId: '3',
    name: 'Audio 1',
    kind: 'file',
    parentId: 'root',
    fileKind: 'audio',
    audioMetadata: { duration: 180, size: '3.5 MB', createdAt: '2023-06-15' },
  },
  {
    itemId: '4',
    name: 'Image 1',
    kind: 'file',
    parentId: 'root',
    fileKind: 'image',
    imageMetadata: {
      url: 'https://picsum.photos/200',
      position: 0,
      createdAt: '2023-06-16',
    },
  },
  { itemId: '5', name: 'Subfolder 1', kind: 'folder', parentId: '1' },
  {
    itemId: '6',
    name: 'Audio 2',
    kind: 'file',
    parentId: '1',
    fileKind: 'audio',
    audioMetadata: { duration: 240, size: '4.2 MB', createdAt: '2023-06-17' },
  },
  {
    itemId: '7',
    name: 'Image 2',
    kind: 'file',
    parentId: '2',
    fileKind: 'image',
    imageMetadata: {
      url: 'https://picsum.photos/200',
      position: 1,
      createdAt: '2023-06-18',
    },
  },
  { itemId: '8', name: 'Subfolder 2', kind: 'folder', parentId: '2' },
  {
    itemId: '9',
    name: 'Audio 3',
    kind: 'file',
    parentId: '5',
    fileKind: 'audio',
    audioMetadata: { duration: 300, size: '5.1 MB', createdAt: '2023-06-19' },
  },
  {
    itemId: '10',
    name: 'Image 3',
    kind: 'file',
    parentId: '5',
    fileKind: 'image',
    imageMetadata: {
      url: 'https://picsum.photos/800',
      position: 2,
      createdAt: '2023-06-20',
    },
  },
];

const useContentStore = create<ContentState & ContentActions>((set, get) => ({
  items: dummyData,
  selectedItems: [],
  sortedItems: [],
  sortBy: 'name',
  sortOrder: 'asc',
  isProcessing: false,
  error: null,
  isAudioAvailable: true,
  isImageAvailable: true,
  isLoading: false,
  currentPath: [{ itemId: '', name: 'Home' }],
  sortingTypes: [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date' },
    { value: 'size', label: 'Size' },
  ],

  setIsLoading: (loading) => set({ isLoading: loading }),

  navigateTo: async (itemId) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newPath = [];
    let currentId = itemId;
    while (currentId) {
      const item = get().items.find((i) => i.itemId === currentId);
      if (item) {
        newPath.unshift({ itemId: item.itemId, name: item.name });
        currentId = item.parentId;
      } else {
        break;
      }
    }

    set({
      currentPath: newPath,
      sortedItems: get().items.filter((item) => item.parentId === itemId),
      isLoading: false,
    });
  },

  createFolder: async (name, folderKind) => {
    set({ isProcessing: true, error: null });
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newFolder: FolderItemProps = {
        itemId: Date.now().toString(),
        name,
        kind: 'folder',
        parentId: get().currentPath[get().currentPath.length - 1].itemId,
        folderKind,
      };
      set((state) => ({
        items: [...state.items, newFolder],
        sortedItems: [...state.sortedItems, newFolder],
        isProcessing: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create folder', isProcessing: false });
    }
  },

  uploadFile: async (file) => {
    set({ isProcessing: true, error: null });
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const fileKind: FileKind = file.type.startsWith('audio/')
        ? 'audio'
        : 'image';
      const newFile: FolderItemProps = {
        itemId: Date.now().toString(),
        name: file.name,
        kind: 'file',
        parentId: get().currentPath[get().currentPath.length - 1].itemId,
        fileKind,
        ...(fileKind === 'audio'
          ? {
              audioMetadata: {
                duration: 0, // You'd get this from the actual file
                size: `${file.size} bytes`,
                createdAt: new Date().toISOString(),
              },
            }
          : {
              imageMetadata: {
                url: URL.createObjectURL(file),
                position: get().items.filter(
                  (item) => item.fileKind === 'image'
                ).length,
                createdAt: new Date().toISOString(),
              },
            }),
      };
      set((state) => ({
        items: [...state.items, newFile],
        sortedItems: [...state.sortedItems, newFile],
        isProcessing: false,
        isAudioAvailable: state.isAudioAvailable || fileKind === 'audio',
        isImageAvailable: state.isImageAvailable || fileKind === 'image',
      }));
    } catch (error) {
      set({ error: 'Failed to upload file', isProcessing: false });
    }
  },

  deleteItem: async (id) => {
    set({ isProcessing: true, error: null });
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      set((state) => ({
        items: state.items.filter((item) => item.itemId !== id),
        sortedItems: state.sortedItems.filter((item) => item.itemId !== id),
        selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
        isProcessing: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete item', isProcessing: false });
    }
  },

  renameItem: async (id, newName) => {
    set({ isProcessing: true, error: null });
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      set((state) => ({
        items: state.items.map((item) =>
          item.itemId === id ? { ...item, name: newName } : item
        ),
        sortedItems: state.sortedItems.map((item) =>
          item.itemId === id ? { ...item, name: newName } : item
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({ error: 'Failed to rename item', isProcessing: false });
    }
  },

  setPosition: async (id, newPosition) => {
    set({ isProcessing: true, error: null });
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const itemToMove = get().items.find((item) => item.itemId === id);
      if (
        !itemToMove ||
        itemToMove.kind !== 'file' ||
        itemToMove.fileKind !== 'image'
      ) {
        throw new Error('Invalid item or not an image');
      }
      const imageItems = get().items.filter(
        (item) => item.kind === 'file' && item.fileKind === 'image'
      );
      if (newPosition < 0 || newPosition >= imageItems.length) {
        throw new Error('Invalid position');
      }
      set((state) => ({
        items: state.items.map((item) =>
          item.itemId === id &&
          item.kind === 'file' &&
          item.fileKind === 'image'
            ? {
                ...item,
                imageMetadata: {
                  ...item.imageMetadata!,
                  position: newPosition,
                },
              }
            : item
        ),
        sortedItems: state.sortedItems.map((item) =>
          item.itemId === id &&
          item.kind === 'file' &&
          item.fileKind === 'image'
            ? {
                ...item,
                imageMetadata: {
                  ...item.imageMetadata!,
                  position: newPosition,
                },
              }
            : item
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to set position',
        isProcessing: false,
      });
    }
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().sortItems();
  },

  setSortOrder: (sortOrder) => {
    set({ sortOrder });
    get().sortItems();
  },

  sortItems: () => {
    const { sortedItems, sortBy, sortOrder } = get();
    const sorted = [...sortedItems].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'date') {
        const aDate =
          a.kind === 'file'
            ? a.fileKind === 'audio'
              ? a.audioMetadata?.createdAt
              : a.imageMetadata?.createdAt
            : '';
        const bDate =
          b.kind === 'file'
            ? b.fileKind === 'audio'
              ? b.audioMetadata?.createdAt
              : b.imageMetadata?.createdAt
            : '';
        return sortOrder === 'asc'
          ? aDate.localeCompare(bDate)
          : bDate.localeCompare(aDate);
      } else if (sortBy === 'size') {
        const aSize =
          a.kind === 'file' && a.fileKind === 'audio'
            ? parseInt(a.audioMetadata?.size || '0')
            : 0;
        const bSize =
          b.kind === 'file' && b.fileKind === 'audio'
            ? parseInt(b.audioMetadata?.size || '0')
            : 0;
        return sortOrder === 'asc' ? aSize - bSize : bSize - aSize;
      }
      return 0;
    });
    set({ sortedItems: sorted });
  },

  toggleItemSelection: (id) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(id)
        ? state.selectedItems.filter((itemId) => itemId !== id)
        : [...state.selectedItems, id],
    }));
  },
}));

export { useContentStore };
