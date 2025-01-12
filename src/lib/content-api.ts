// src/lib/content-api.ts
import { config } from '@/config/config';
import type {
  ApiResponse,
  Node,
  Repository,
  NodeType,
  RepositoryFile,
} from '@/types';
import { ApiError, getHeaders, handleResponse } from './api-helpers';

type FetchChildrenResponse = {
  children: Node[];
  repositories: Repository[];
};

interface ContentApi {
  fetchRootNodes: () => Promise<ApiResponse<Node[]>>;
  fetchChildren: (
    nodeId: string
  ) => Promise<ApiResponse<FetchChildrenResponse>>;
  fetchRepositoryFiles: (
    repoId: string
  ) => Promise<ApiResponse<RepositoryFile[]>>;
  createNode: (
    name: string,
    type: NodeType,
    parentId?: number
  ) => Promise<ApiResponse<Node>>;
  searchNodes: (query: string) => Promise<ApiResponse<Node[]>>;
  deleteNode: (id: string) => Promise<void>;
  renameNode: (id: string, newName: string) => Promise<ApiResponse<Node>>;
  uploadFile: (file: File, nodeId: string) => Promise<ApiResponse<Repository>>;
}

export const _contentApi: ContentApi = {
  async fetchRootNodes() {
    try {
      const response = await fetch(`${config.API_URL}/nodes/parent-nodes`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch root nodes');
    }
  },

  async fetchChildren(nodeId) {
    try {
      const response = await fetch(
        `${config.API_URL}/nodes/${nodeId}/children`,
        {
          headers: getHeaders(),
        }
      );
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch children');
    }
  },

  async fetchRepositoryFiles(repoId) {
    try {
      const response = await fetch(`${config.API_URL}/repo/${repoId}/files`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch repository files');
    }
  },

  async createNode(name, type, parentId) {
    const body = parentId ? { name, type, parentId } : { name, type };
    try {
      const response = await fetch(`${config.API_URL}/nodes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create node');
    }
  },

  async deleteNode(id) {
    try {
      const response = await fetch(`${config.API_URL}/nodes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.message || 'Failed to delete node',
          response.status,
          errorData
        );
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete node');
    }
  },

  async renameNode(id, newName) {
    try {
      const response = await fetch(`${config.API_URL}/nodes/${id}/rename`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ name: newName }),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to rename node');
    }
  },

  async searchNodes(query: string): Promise<ApiResponse<Node[]>> {
    try {
      const response = await fetch(
        `${config.API_URL}/nodes/search?query=${encodeURIComponent(query)}`,
        {
          headers: getHeaders(),
        }
      );
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to search nodes');
    }
  },

  async uploadFile(file, nodeId) {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nodeId', nodeId);

      const response = await fetch(`${config.API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to upload file');
    }
  },
};
