// useContentStore.ts
import { create } from 'zustand';
import { contentApi } from '@/lib/api';
import {
  type ContentState,
  type ContentActions,
  type Node,
  type Repository,
  type RepositoryFile,
  type ContentItem,
  FOLDER_ITEM_TYPE,
  NodeType,
  REPOSITORY_KINDS,
} from '@/types';
import { toast } from 'sonner';

const transformNodeToContentItem = (node: Node): ContentItem => ({
  id: node.id.toString(),
  name: node.name,
  type: FOLDER_ITEM_TYPE.FOLDER,
  nodeType: node.type,
  level: node.level,
  parentId: node.parentId,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt,
});

const transformRepositoryToContentItem = (repo: Repository): ContentItem => ({
  id: `_repo:${repo.id}`,
  name: repo.type === REPOSITORY_KINDS.AUDIO ? 'Audio' : 'Gallery',
  type: FOLDER_ITEM_TYPE.REPOSITORY,
  repoType: repo.type,
  createdAt: repo.createdAt,
  updatedAt: repo.updatedAt,
});

const transformFileToContentItem = (file: RepositoryFile): ContentItem => ({
  id: file.id.toString(),
  name: file.name,
  type: FOLDER_ITEM_TYPE.FILE,
  repoId: file.repoId,
  filename: file.filename,
  size: file.size,
  mimeType: file.mimeType,
  position: file.position,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const useContentStore = create<ContentState & ContentActions>((set, get) => ({
  items: [],
  selectedItems: [],
  sortedItems: [],
  sortBy: 'name',
  sortOrder: 'asc',
  isProcessing: false,
  error: null,
  isLoading: false,
  currentPath: [
    {
      id: 'root',
      name: 'Home',
      type: FOLDER_ITEM_TYPE.FOLDER,
    },
  ],

  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  navigateTo: async (id: string, pathIndex?: number) => {
    set({ isLoading: true, error: null });
    try {
      // Handle root navigation
      if (id === 'root') {
        const response = await contentApi.fetchRootNodes();
        const contentItems = response.data.map(transformNodeToContentItem);
        set({
          items: contentItems,
          sortedItems: contentItems,
          currentPath: [
            { id: 'root', name: 'Home', type: FOLDER_ITEM_TYPE.FOLDER },
          ],
          isLoading: false,
        });
        return;
      }

      // Get current state
      const currentState = get();
      let newPath = [...currentState.currentPath];

      // If pathIndex is provided, truncate the path to that index
      if (typeof pathIndex === 'number') {
        newPath = newPath.slice(0, pathIndex + 1);
      }

      // Handle repository navigation
      if (id.startsWith('_repo:')) {
        const repoId = id.replace('_repo:', '');
        const response = await contentApi.fetchRepositoryFiles(repoId);
        const contentItems = response.data.map(transformFileToContentItem);

        // Only add to path if not clicking breadcrumb
        if (typeof pathIndex === 'undefined') {
          const repoItem = currentState.items.find((item) => item.id === id);
          if (repoItem) {
            newPath.push({
              id,
              name: repoItem.name,
              type: FOLDER_ITEM_TYPE.REPOSITORY,
              repoType: repoItem.repoType,
            });
          }
        }

        set({
          items: contentItems,
          sortedItems: contentItems,
          currentPath: newPath,
          isLoading: false,
        });
        return;
      }

      // Handle regular node navigation
      const response = await contentApi.fetchChildren(id);
      const nodes = response.data.children.map(transformNodeToContentItem);
      const repositories = response.data.repositories.map(
        transformRepositoryToContentItem
      );
      const contentItems = [...nodes, ...repositories];

      // Only add to path if not clicking breadcrumb
      if (typeof pathIndex === 'undefined') {
        const clickedItem = currentState.items.find((item) => item.id === id);
        if (clickedItem) {
          newPath.push({
            id: clickedItem.id,
            name: clickedItem.name,
            type: FOLDER_ITEM_TYPE.FOLDER,
            nodeType: clickedItem.nodeType,
          });
        }
      }

      // Apply current sorting
      const sortedItems = sortItems(
        contentItems,
        currentState.sortBy,
        currentState.sortOrder
      );

      set({
        items: contentItems,
        sortedItems,
        currentPath: newPath,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Navigation failed',
        isLoading: false,
      });
    }
  },

  createNode: async (name: string, type: NodeType, parentId: string | null) => {
    set({ isProcessing: true, error: null });
    try {
      const isRoot = parentId === null || parentId === 'root';
      const parsedNumber = !isRoot ? Number.parseInt(parentId) : 0;

      const response = isRoot
        ? await contentApi.createNode(name, type)
        : await contentApi.createNode(name, type, parsedNumber);

      const newItem = transformNodeToContentItem(response.data);
      toast.success('Folder created successfully');
      // Update items and maintain sort order
      set((state) => {
        const newItems = [...state.items, newItem];
        const newSortedItems = sortItems(
          newItems,
          state.sortBy,
          state.sortOrder
        );

        return {
          items: newItems,
          sortedItems: newSortedItems,
          isProcessing: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create node',
        isProcessing: false,
      });
    }
  },

  uploadFile: async (file: File, nodeId: string) => {
    set({ isProcessing: true, error: null });
    try {
      await contentApi.uploadFile(file, nodeId);
      // Refresh current folder with current path index
      const currentState = get();
      const currentIndex = currentState.currentPath.length - 1;
      const currentId = currentState.currentPath[currentIndex].id;
      await get().navigateTo(currentId, currentIndex);
      set({ isProcessing: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Upload failed',
        isProcessing: false,
      });
    }
  },

  deleteNode: async (id: string) => {
    set({ isProcessing: true, error: null });
    try {
      await contentApi.deleteNode(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        sortedItems: state.sortedItems.filter((item) => item.id !== id),
        selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Delete failed',
        isProcessing: false,
      });
    }
  },

  renameNode: async (id: string, newName: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await contentApi.renameNode(id, newName);
      const updatedItem = transformNodeToContentItem(response.data);

      set((state) => {
        // Update items
        const newItems = state.items.map((item) =>
          item.id === id ? updatedItem : item
        );

        // Update sorted items maintaining sort order
        const newSortedItems = sortItems(
          newItems,
          state.sortBy,
          state.sortOrder
        );

        // Update path if item exists there
        const newPath = state.currentPath.map((segment) =>
          segment.id === id ? { ...segment, name: newName } : segment
        );

        return {
          items: newItems,
          sortedItems: newSortedItems,
          currentPath: newPath,
          isProcessing: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Rename failed',
        isProcessing: false,
      });
    }
  },

  setSortBy: (sortBy: ContentState['sortBy']) => {
    set((state) => {
      const sortedItems = sortItems(state.items, sortBy, state.sortOrder);
      return { sortBy, sortedItems };
    });
  },

  setSortOrder: (sortOrder: ContentState['sortOrder']) => {
    set((state) => {
      const sortedItems = sortItems(state.items, state.sortBy, sortOrder);
      return { sortOrder, sortedItems };
    });
  },

  toggleItemSelection: (id: string) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(id)
        ? state.selectedItems.filter((itemId) => itemId !== id)
        : [...state.selectedItems, id],
    }));
  },
}));

// Helper function for sorting items
const sortItems = (
  items: ContentItem[],
  sortBy: ContentState['sortBy'],
  sortOrder: ContentState['sortOrder']
): ContentItem[] => {
  return [...items].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? (a.name || '').localeCompare(b.name || '')
        : (b.name || '').localeCompare(a.name || '');
    }

    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    }

    if (sortBy === 'size' && a.size && b.size) {
      return sortOrder === 'asc' ? a.size - b.size : b.size - a.size;
    }

    return 0;
  });
};

export { useContentStore };
