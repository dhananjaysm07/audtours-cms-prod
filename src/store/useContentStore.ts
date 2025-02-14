// useContentStore.ts
import { create } from 'zustand';
import { ApiError, contentApi } from '@/lib/api';
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
  EditFileData,
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
  isActive: node.isActive,
  code: node.code,
  artistId: node.artistId,
  artistName: node.artistName,
  path: node.path,
});

const transformRepositoryToContentItem = (repo: Repository): ContentItem => ({
  id: `_repo:${repo.id}`,
  name: repo.type,
  type: FOLDER_ITEM_TYPE.REPOSITORY,
  repoType: repo.type,
  createdAt: repo.createdAt,
  updatedAt: repo.updatedAt,
  isActive: repo.isActive,
  language: repo.language,
  languageId: repo.languageId,
});

const transformFileToContentItem = (file: RepositoryFile): ContentItem => ({
  id: file.id.toString(),
  name: file.name,
  type: FOLDER_ITEM_TYPE.FILE,
  path: file.path,
  repoId: file.repoId,
  filename: file.filename,
  size: file.size,
  mimeType: file.mimeType,
  position: file.position,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
  isActive: file.isActive,
});

const useContentStore = create<ContentState & ContentActions>((set, get) => ({
  items: [],
  selectedItems: [],
  sortedItems: [],
  sortBy: 'name',
  sortOrder: 'asc',
  isProcessing: false,
  error: null,
  error_status: null,
  display_toast: false,
  isLoading: false,
  currentAudioId: null,
  isAudioPlaying: false,
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
        console.log('Content items....', contentItems);
        // Only add to path if not clicking breadcrumb
        if (typeof pathIndex === 'undefined') {
          const repoItem = currentState.items.find(item => item.id === id);
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
        transformRepositoryToContentItem,
      );
      const contentItems = [...nodes, ...repositories];

      // Only add to path if not clicking breadcrumb
      if (typeof pathIndex === 'undefined') {
        const clickedItem = currentState.items.find(item => item.id === id);
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
        currentState.sortOrder,
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
        display_toast: true,
      });
    }
  },

  createNode: async (
    name: string,
    type: NodeType,
    parentId: string | null,
    code: string | null,
    artistId: number | null,
  ) => {
    set({ isProcessing: true, error: null });
    try {
      const isRoot = parentId === null || parentId === 'root';
      const parsedNumber = !isRoot ? Number.parseInt(parentId) : 0;

      const response = isRoot
        ? await contentApi.createNode(name, type, null, code, artistId)
        : await contentApi.createNode(name, type, parsedNumber, code, artistId);

      const newItem = transformNodeToContentItem(response.data);
      if (response.status === 'success') toast.success('Folder created');
      // Update items and maintain sort order
      set(state => {
        const newItems = [...state.items, newItem];
        const newSortedItems = sortItems(
          newItems,
          state.sortBy,
          state.sortOrder,
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
        display_toast: true,
      });
    }
  },

  createRepository: async (
    nodeId: number,
    type: (typeof REPOSITORY_KINDS)[keyof typeof REPOSITORY_KINDS],
    languageId?: number,
  ) => {
    set({ isProcessing: true, error: null });
    try {
      // Call the API to create the repository
      const response = await contentApi.createRepository(
        nodeId,
        type,
        languageId,
      );

      // Transform the repository into a ContentItem
      const newItem = transformRepositoryToContentItem(response.data);

      // Show success toast
      if (response.status === 'success') {
        toast.success(`Repository created: ${newItem.name}`);
      }

      // Update items and maintain sort order
      set(state => {
        const newItems = [...state.items, newItem];
        const newSortedItems = sortItems(
          newItems,
          state.sortBy,
          state.sortOrder,
        );

        return {
          items: newItems,
          sortedItems: newSortedItems,
          isProcessing: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create repository',
        isProcessing: false,
        display_toast: true,
      });
    }
  },
  uploadFile: async uploadFileData => {
    set({ isProcessing: true, error: null });
    try {
      await contentApi.uploadFile(uploadFileData);
      // Refresh current folder with current path index
      const currentState = get();
      const currentIndex = currentState.currentPath.length - 1;
      const currentId = currentState.currentPath[currentIndex].id;
      await get().navigateTo(currentId, currentIndex);
      set({
        isProcessing: false,
        error: null,
        error_status: null,
        display_toast: true,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Upload failed',
        error_status: error instanceof ApiError ? error.status : 500,
        isProcessing: false,
        display_toast: error instanceof ApiError ? error.status != 409 : true,
      });
    }
  },

  deleteNode: async (id: string) => {
    set({ isProcessing: true, error: null });
    try {
      await contentApi.deleteNode(id);
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        sortedItems: state.sortedItems.filter(item => item.id !== id),
        selectedItems: state.selectedItems.filter(itemId => itemId !== id),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Delete failed',
        isProcessing: false,
        display_toast: true,
      });
    }
  },

  renameNode: async (id: string, newName: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await contentApi.renameNode(id, newName);
      const updatedItem = transformNodeToContentItem(response.data);

      set(state => {
        // Update items
        const newItems = state.items.map(item =>
          item.id === id ? updatedItem : item,
        );

        // Update sorted items maintaining sort order
        const newSortedItems = sortItems(
          newItems,
          state.sortBy,
          state.sortOrder,
        );

        // Update path if item exists there
        const newPath = state.currentPath.map(segment =>
          segment.id === id ? { ...segment, name: newName } : segment,
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
        display_toast: true,
      });
    }
  },

  setSortBy: (sortBy: ContentState['sortBy']) => {
    set(state => {
      const sortedItems = sortItems(state.items, sortBy, state.sortOrder);
      return { sortBy, sortedItems };
    });
  },

  editFile: async (
    repoId: number,
    fileId: string,
    data: EditFileData,
    forcePosition: boolean = false,
  ) => {
    set({ isProcessing: true, error: null });
    try {
      await contentApi.editFile(repoId, fileId, {
        ...data,
        force_position: String(forcePosition),
      });

      // Refresh current folder
      const currentState = get();
      const currentIndex = currentState.currentPath.length - 1;
      const currentId = currentState.currentPath[currentIndex].id;
      await get().navigateTo(currentId, currentIndex);

      set({
        isProcessing: false,
        error: null,
        error_status: null,
        display_toast: true,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && !forcePosition) {
        set({
          error: error.message,
          error_status: error.status,
          isProcessing: false,
          display_toast: false,
        });
      } else {
        set({
          error: error instanceof Error ? error.message : 'Edit failed',
          error_status: error instanceof ApiError ? error.status : 500,
          isProcessing: false,
          display_toast: true,
        });
      }
    }
  },

  editFolder: async (
    nodeId: string,
    data: {
      name?: string;
      artistId?: number | null;
      code?: string | null;
    },
  ) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await contentApi.editFolder(nodeId, data);
      const updatedItem = transformNodeToContentItem(response.data);

      set(state => {
        const newItems = state.items.map(item =>
          item.id === nodeId ? updatedItem : item,
        );
        const newSortedItems = sortItems(
          newItems,
          state.sortBy,
          state.sortOrder,
        );

        return {
          items: newItems,
          sortedItems: newSortedItems,
          isProcessing: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Edit folder failed',
        isProcessing: false,
        display_toast: true,
      });
    }
  },

  setNodeActivation: async (nodeId: string, isActive: boolean) => {
    set({ isProcessing: true, error: null });
    try {
      await contentApi.setNodeActivation(nodeId, isActive);

      set(state => {
        const newItems = state.items.map(item =>
          item.id === nodeId ? { ...item, isActive } : item,
        );

        return {
          items: newItems,
          sortedItems: sortItems(newItems, state.sortBy, state.sortOrder),
          isProcessing: false,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Activation toggle failed',
        isProcessing: false,
        display_toast: true,
      });
    }
  },

  getHierarchy: async (nodeId: number) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await contentApi.getHierarchy(nodeId);
      const newpath = response.data.map(node => ({
        id: String(node.id),
        name: node.name,
        type: FOLDER_ITEM_TYPE.FOLDER,
        nodeType: node.type,
      }));

      set(() => {
        return {
          currentPath: [
            {
              id: 'root',
              name: 'Home',
              type: FOLDER_ITEM_TYPE.FOLDER,
            },
            ...newpath,
          ],
        };
      });
      await get().navigateTo(String(response.data.slice(-1)[0].id));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to fetch heirarchy nodes',
        isProcessing: false,
        display_toast: true,
      });
    }
  },

  setSortOrder: (sortOrder: ContentState['sortOrder']) => {
    set(state => {
      const sortedItems = sortItems(state.items, state.sortBy, sortOrder);
      return { sortOrder, sortedItems };
    });
  },

  toggleItemSelection: (id: string) => {
    set(state => ({
      selectedItems: state.selectedItems.includes(id)
        ? state.selectedItems.filter(itemId => itemId !== id)
        : [...state.selectedItems, id],
    }));
  },

  toggleDisplayToastStatus: () => {
    set(state => {
      return { display_toast: !state.display_toast };
    });
  },

  setCurrentAudio: (id: string) => {
    set({ currentAudioId: id });
  },

  setIsAudioPlaying: (isPlaying: boolean) => {
    set({ isAudioPlaying: isPlaying });
  },

  playAudio: (id: string) => {
    const { items } = get();
    const audioIndex = items.findIndex(item => item.id === id);
    if (audioIndex !== -1) {
      set({
        currentAudioId: id,
        isAudioPlaying: true,
      });
    }
  },
}));

// Helper function for sorting items
const sortItems = (
  items: ContentItem[],
  sortBy: ContentState['sortBy'],
  sortOrder: ContentState['sortOrder'],
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
