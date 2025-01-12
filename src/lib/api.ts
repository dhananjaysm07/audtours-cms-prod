// src/lib/api.ts
import { config } from "@/config/config";
import type {
  ApiResponse,
  Node,
  Repository,
  NodeType,
  RepositoryFile,
  UploadFiledata,
} from "@/types";

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
  deleteNode: (id: string) => Promise<void>;
  renameNode: (id: string, newName: string) => Promise<ApiResponse<Node>>;
  uploadFile: (
    uploadFileData: UploadFiledata
  ) => Promise<ApiResponse<Repository>>;
}

class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

const getHeaders = () => {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.message || "API request failed",
      response.status,
      errorData
    );
  }
  return response.json();
}

export const contentApi: ContentApi = {
  async fetchRootNodes() {
    try {
      const response = await fetch(`${config.API_URL}/nodes/parent-nodes`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to fetch root nodes");
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
      throw new ApiError("Failed to fetch children");
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
      throw new ApiError("Failed to fetch repository files");
    }
  },

  async createNode(name, type, parentId) {
    const body = parentId ? { name, type, parentId } : { name, type };
    try {
      const response = await fetch(`${config.API_URL}/nodes`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to create node");
    }
  },

  async deleteNode(id) {
    try {
      const response = await fetch(`${config.API_URL}/nodes/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.message || "Failed to delete node",
          response.status,
          errorData
        );
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to delete node");
    }
  },

  async renameNode(id, newName) {
    try {
      const response = await fetch(`${config.API_URL}/nodes/${id}/rename`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ name: newName }),
      });
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to rename node");
    }
  },

  async uploadFile(uploadFiledata) {
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("file", uploadFiledata.file);
      formData.append("name", uploadFiledata.name);
      formData.append("position", String(uploadFiledata.position));
      formData.append("force_position", String(uploadFiledata.force_position));
      const response = await fetch(
        `${config.API_URL}/repo/${uploadFiledata.repoId}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      return handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Failed to upload file");
    }
  },
};
