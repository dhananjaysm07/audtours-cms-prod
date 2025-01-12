// src/lib/api/content.ts
import { ApiClient } from './client';
import type {
  ApiResponse,
  Node,
  Repository,
  RepositoryFile,
  FetchChildrenResponse,
  NodeType,
} from '@/types';

export default class ContentApi extends ApiClient {
  async fetchRootNodes(): Promise<ApiResponse<Node[]>> {
    return this.request('/nodes/parent-nodes');
  }

  async fetchChildren(
    nodeId: string
  ): Promise<ApiResponse<FetchChildrenResponse>> {
    return this.request(`/nodes/${nodeId}/children`);
  }

  async fetchRepositoryFiles(
    repoId: string
  ): Promise<ApiResponse<RepositoryFile[]>> {
    return this.request(`/repo/${repoId}/files`);
  }

  async createNode(
    name: string,
    type: NodeType,
    parentId: number | null
  ): Promise<ApiResponse<Node>> {
    const body = parentId !== null ? { name, type, parentId } : { name, type };
    return this.request('/nodes', {
      method: 'POST',
      body,
    });
  }

  async deleteNode(id: string): Promise<void> {
    await this.request(`/nodes/${id}`, {
      method: 'DELETE',
    });
  }

  async renameNode(id: string, newName: string): Promise<ApiResponse<Node>> {
    return this.request(`/nodes/${id}/rename`, {
      method: 'PATCH',
      body: { name: newName },
    });
  }

  async searchNodes(query: string): Promise<ApiResponse<Node[]>> {
    return this.request(`/nodes/search?query=${encodeURIComponent(query)}`);
  }

  async uploadFile(
    file: File,
    nodeId: string
  ): Promise<ApiResponse<Repository>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nodeId', nodeId);

    return this.request('/upload', {
      method: 'POST',
      headers: {
        // Remove default Content-Type to let browser set it with boundary
        // 'Content-Type': undefined,
      },
      body: formData as unknown as Record<string, unknown>,
    });
  }
}
