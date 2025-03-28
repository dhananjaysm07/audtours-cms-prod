// src/lib/api/template.ts
import { ApiResponse, Template } from '@/types';
import { ApiClient } from './client';
import { getHeaders, createApiUrl } from './utils';
import { ApiError } from './errors';

interface PdfResponse {
  filename: string;
  base64Pdf: string;
  contentType: string;
}

interface TemplateCheckResponse {
  complete: boolean;
  missingNodes?: string[];
}

interface GeneratePdfParams {
  codeId: number;
  responseType: 'base64' | 'file';
}

export default class TemplateApi extends ApiClient {
  async getTemplateByNodeId(
    nodeId: number,
  ): Promise<ApiResponse<Template | null>> {
    return this.request(`/templates/${nodeId}`);
  }

  // Check if all nodes in a code have templates
  async checkCodeTemplates(
    codeId: number,
  ): Promise<ApiResponse<TemplateCheckResponse>> {
    return this.request(`/templates/check-code/${codeId}`);
  }

  async upsertTemplate(
    nodeId: number,
    content: string,
    image?: File,
  ): Promise<ApiResponse<Template>> {
    try {
      const formData = new FormData();
      formData.append('nodeId', nodeId.toString());

      // Set empty string if content is undefined or null
      formData.append('content', content || '');

      if (image) {
        formData.append('image', image);
      }

      // Get auth headers
      const headers = getHeaders(true);

      // Using the native fetch API for FormData
      const response = await fetch(createApiUrl('/templates'), {
        method: 'POST',
        headers: {
          // Only include Authorization for FormData
          Authorization: headers.Authorization,
        },
        body: formData,
      });

      // Handle the response
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        throw new ApiError(
          errorData.message || 'Failed to save template',
          response.status,
          errorData,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Request failed',
      );
    }
  }

  // Method to get PDF as base64 - now only taking codeId
  async generatePdfAsBase64(codeId: number): Promise<ApiResponse<PdfResponse>> {
    const payload: GeneratePdfParams = {
      codeId,
      responseType: 'base64',
    };

    return this.request('/templates/generate-pdf', {
      method: 'POST',
      body: payload,
    });
  }

  // Method to download PDF directly - now only taking codeId
  async generatePdfForDownload(codeId: number): Promise<Response> {
    try {
      const payload: GeneratePdfParams = {
        codeId,
        responseType: 'file',
      };

      // Direct fetch API for blob response
      const response = await fetch(createApiUrl('/templates/generate-pdf'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to parse error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new ApiError(
            errorData.message || 'Failed to generate PDF',
            response.status,
            errorData,
          );
        } else {
          throw new ApiError('Failed to generate PDF', response.status);
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Request failed',
      );
    }
  }

  // Helper function to download base64 PDF
  downloadBase64Pdf(base64Data: string, filename: string): void {
    try {
      // Create a data URL
      const dataUrl = `data:application/pdf;base64,${base64Data}`;

      // Create a link element
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new ApiError('Failed to download PDF');
    }
  }
}

export const templateApi = new TemplateApi();
