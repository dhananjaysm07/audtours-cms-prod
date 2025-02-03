// src/lib/api/content.ts
import { ApiClient } from "./client";
import type {
  ApiResponse,
  Node,
  RepositoryFile,
  FetchChildrenResponse,
  NodeType,
  UploadFiledata,
} from "@/types";

export default class ContentApi extends ApiClient {
  async fetchRootNodes(): Promise<ApiResponse<Node[]>> {
    return this.request("/nodes/parent-nodes");
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
    parentId: number | null,
    code: string | null,
    artistId: number | null
  ): Promise<ApiResponse<Node>> {
    const body =
      parentId !== null
        ? { name, type, parentId, code, artistId }
        : { name, type, code, artistId };
    return this.request("/nodes", {
      method: "POST",
      body,
    });
  }

  async deleteNode(id: string): Promise<void> {
    await this.request(`/nodes/${id}`, {
      method: "DELETE",
    });
  }

  async renameNode(id: string, newName: string): Promise<ApiResponse<Node>> {
    return this.request(`/nodes/${id}/rename`, {
      method: "PATCH",
      body: { name: newName },
    });
  }

  async searchNodes(query: string): Promise<ApiResponse<Node[]>> {
    return this.request(`/nodes/search?query=${encodeURIComponent(query)}`);
  }

  async uploadFile(
    uploadFiledata: UploadFiledata
  ): Promise<ApiResponse<RepositoryFile>> {
    const formData = new FormData();
    formData.append("file", uploadFiledata.file);
    formData.append("name", uploadFiledata.name);
    formData.append("position", String(uploadFiledata.position));
    formData.append("force_position", String(uploadFiledata.force_position));
    return this.request(`/repo/${uploadFiledata.repoId}/upload`, {
      method: "POST",
      body: formData,
    });
  }

  async editFile(
    repoId: number,
    fileId: string,
    data: {
      name: string;
      position: number | undefined;
      languageId?: number | null;
      force_position: string;
    }
  ): Promise<ApiResponse<RepositoryFile>> {
    return this.request(`/repo/${repoId}/files/basic-details/${fileId}`, {
      method: "PATCH",
      body: data,
    });
  }

  async editFolder(
    nodeId: string,
    data: {
      name?: string;
      artistId?: number | null;
      code?: string | null;
    }
  ): Promise<ApiResponse<Node>> {
    return this.request(`/nodes/${nodeId}/edit`, {
      method: "PATCH",
      body: data,
    });
  }

  async setNodeActivation(
    nodeId: string,
    isActive: boolean
  ): Promise<ApiResponse<void>> {
    return this.request(`/nodes/${nodeId}/activation`, {
      method: "PATCH",
      body: { isActive },
    });
  }
}
