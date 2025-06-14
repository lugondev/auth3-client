import apiClient from '../lib/apiClient';
import type {
  IssueCredentialInput,
  IssueCredentialOutput,
  VerifyCredentialInput,
  VerifyCredentialOutput,
  RevokeCredentialInput,
  RevokeCredentialOutput,
  GetCredentialInput,
  GetCredentialOutput,
  ListCredentialsInput,
  ListCredentialsOutput,
  GetCredentialStatusInput,
  GetCredentialStatusOutput,
  CreatePresentationInput,
  CreatePresentationOutput,
  VerifyPresentationInput,
  VerifyPresentationOutput,
  CredentialTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  ListTemplatesInput,
  ListTemplatesOutput,
  CredentialApiResponse,
  JSONSchema,
} from '../types/credentials';
import { CredentialServiceError } from '../types/credentials';

// Schema validation result interface
export interface SchemaValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  schema?: JSONSchema;
}

// Credential statistics interface
export interface CredentialStatistics {
  totalCredentials: number;
  activeCredentials: number;
  revokedCredentials: number;
  expiredCredentials: number;
  issuedToday: number;
  issuedThisWeek: number;
  issuedThisMonth: number;
  generatedAt: string;
}

/**
 * Verifiable Credentials Service - Client-side service for managing Verifiable Credentials
 * 
 * This service provides methods to interact with VC-related endpoints,
 * including issuance, verification, revocation, and presentation operations.
 * Based on W3C Verifiable Credentials Data Model v1.1.
 */

/**
 * Issues a new verifiable credential
 * @param input - Credential issuance parameters
 * @returns Promise resolving to the issued credential information
 */
export const issueCredential = async (input: IssueCredentialInput): Promise<IssueCredentialOutput> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<IssueCredentialOutput>>('/api/v1/credentials/issue', input);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to issue credential',
        'ISSUE_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to issue credential',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Verifies a verifiable credential
 * @param input - Credential verification parameters
 * @returns Promise resolving to the verification result
 */
export const verifyCredential = async (input: VerifyCredentialInput): Promise<VerifyCredentialOutput> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<VerifyCredentialOutput>>('/api/v1/credentials/verify', input);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to verify credential',
        'VERIFY_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to verify credential',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Retrieves a specific credential by ID
 * @param input - Credential retrieval parameters
 * @returns Promise resolving to the credential information
 */
export const getCredential = async (input: GetCredentialInput): Promise<GetCredentialOutput> => {
  try {
    const response = await apiClient.get<CredentialApiResponse<GetCredentialOutput>>(`/api/v1/credentials/${input.credentialId}`);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to get credential',
        'GET_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to get credential',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Revokes a verifiable credential
 * @param input - Credential revocation parameters
 * @returns Promise resolving to the revocation result
 */
export const revokeCredential = async (input: RevokeCredentialInput): Promise<RevokeCredentialOutput> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<RevokeCredentialOutput>>(`/api/v1/credentials/${input.credentialId}/revoke`, {
      reason: input.reason
    });
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to revoke credential',
        'REVOKE_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to revoke credential',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Gets the status of a credential
 * @param input - Credential status check parameters
 * @returns Promise resolving to the credential status
 */
export const getCredentialStatus = async (input: GetCredentialStatusInput): Promise<GetCredentialStatusOutput> => {
  try {
    const response = await apiClient.get<CredentialApiResponse<GetCredentialStatusOutput>>(`/api/v1/credentials/${input.credentialId}/status`);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to get credential status',
        'STATUS_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to get credential status',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Lists credentials with filtering and pagination
 * @param input - List credentials parameters
 * @returns Promise resolving to the credentials list
 */
export const listCredentials = async (input: ListCredentialsInput = {}): Promise<ListCredentialsOutput> => {
  try {
    const params = new URLSearchParams();
    
    if (input.page) params.append('page', input.page.toString());
    if (input.limit) params.append('limit', input.limit.toString());
    if (input.status) params.append('status', input.status);
    if (input.type) params.append('type', input.type);
    if (input.issuer) params.append('issuer', input.issuer);
    if (input.subject) params.append('subject', input.subject);
    if (input.sortBy) params.append('sortBy', input.sortBy);
    if (input.sortOrder) params.append('sortOrder', input.sortOrder);
    
    const response = await apiClient.get<CredentialApiResponse<ListCredentialsOutput>>(`/api/v1/credentials?${params.toString()}`);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to list credentials',
        'LIST_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to list credentials',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Creates a verifiable presentation
 * @param input - Presentation creation parameters
 * @returns Promise resolving to the created presentation
 */
export const createPresentation = async (input: CreatePresentationInput): Promise<CreatePresentationOutput> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<CreatePresentationOutput>>('/api/v1/presentations/create', input);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to create presentation',
        'PRESENTATION_CREATE_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to create presentation',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Verifies a verifiable presentation
 * @param input - Presentation verification parameters
 * @returns Promise resolving to the verification result
 */
export const verifyPresentation = async (input: VerifyPresentationInput): Promise<VerifyPresentationOutput> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<VerifyPresentationOutput>>('/api/v1/presentations/verify', input);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to verify presentation',
        'PRESENTATION_VERIFY_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to verify presentation',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

// Credential Templates Management

/**
 * Creates a new credential template
 * @param input - Template creation parameters
 * @returns Promise resolving to the created template
 */
export const createTemplate = async (input: CreateTemplateInput): Promise<CredentialTemplate> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<CredentialTemplate>>('/api/v1/credentials/templates', input);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to create template',
        'TEMPLATE_CREATE_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to create template',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Updates an existing credential template
 * @param input - Template update parameters
 * @returns Promise resolving to the updated template
 */
export const updateTemplate = async (input: UpdateTemplateInput): Promise<CredentialTemplate> => {
  try {
    const { templateId, ...updateData } = input;
    const response = await apiClient.put<CredentialApiResponse<CredentialTemplate>>(`/api/v1/credentials/templates/${templateId}`, updateData);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to update template',
        'TEMPLATE_UPDATE_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to update template',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Lists credential templates with filtering and pagination
 * @param input - List templates parameters
 * @returns Promise resolving to the templates list
 */
export const listTemplates = async (input: ListTemplatesInput = {}): Promise<ListTemplatesOutput> => {
  try {
    const params = new URLSearchParams();
    
    if (input.page) params.append('page', input.page.toString());
    if (input.limit) params.append('limit', input.limit.toString());
    if (input.isActive !== undefined) params.append('isActive', input.isActive.toString());
    if (input.type) params.append('type', input.type);
    
    const response = await apiClient.get<CredentialApiResponse<ListTemplatesOutput>>(`/api/v1/credentials/templates?${params.toString()}`);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to list templates',
        'TEMPLATE_LIST_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to list templates',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Gets a specific credential template by ID
 * @param templateId - Template ID
 * @returns Promise resolving to the template
 */
export const getTemplate = async (templateId: string): Promise<CredentialTemplate> => {
  try {
    const response = await apiClient.get<CredentialApiResponse<CredentialTemplate>>(`/api/v1/credentials/templates/${templateId}`);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to get template',
        'TEMPLATE_GET_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to get template',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Deletes a credential template
 * @param templateId - Template ID to delete
 * @returns Promise resolving when deletion is complete
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const response = await apiClient.delete<CredentialApiResponse<void>>(`/api/v1/credentials/templates/${templateId}`);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to delete template',
        'TEMPLATE_DELETE_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to delete template',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Gets credentials by issuer DID with pagination
 * @param issuerDid - Issuer DID
 * @param page - Page number (optional)
 * @param limit - Items per page (optional)
 * @returns Promise resolving to the credentials list
 */
export const getCredentialsByIssuer = async (
  issuerDid: string,
  page?: number,
  limit?: number
): Promise<ListCredentialsOutput> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = queryString 
      ? `/api/v1/credentials/issuer/${issuerDid}?${queryString}`
      : `/api/v1/credentials/issuer/${issuerDid}`;
    
    const response = await apiClient.get<CredentialApiResponse<ListCredentialsOutput>>(url);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to get credentials by issuer',
        'GET_BY_ISSUER_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to get credentials by issuer',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Gets credentials by subject DID with pagination
 * @param subjectDid - Subject DID
 * @param page - Page number (optional)
 * @param limit - Items per page (optional)
 * @returns Promise resolving to the credentials list
 */
export const getCredentialsBySubject = async (
  subjectDid: string,
  page?: number,
  limit?: number
): Promise<ListCredentialsOutput> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = queryString 
      ? `/api/v1/credentials/subject/${subjectDid}?${queryString}`
      : `/api/v1/credentials/subject/${subjectDid}`;
    
    const response = await apiClient.get<CredentialApiResponse<ListCredentialsOutput>>(url);
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to get credentials by subject',
        'GET_BY_SUBJECT_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to get credentials by subject',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Gets credential statistics
 * @returns Promise resolving to the statistics data
 */
export const getCredentialStatistics = async (): Promise<CredentialStatistics> => {
  try {
    const response = await apiClient.get<CredentialApiResponse<CredentialStatistics>>('/api/v1/credentials/statistics');
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to get credential statistics',
        'STATISTICS_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to get credential statistics',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};

/**
 * Validates a credential schema
 * @param schema - Schema to validate
 * @returns Promise resolving to the validation result
 */
export const validateSchema = async (schema: JSONSchema): Promise<SchemaValidationResult> => {
  try {
    const response = await apiClient.post<CredentialApiResponse<SchemaValidationResult>>('/api/v1/credentials/validate-schema', { schema });
    
    if (!response.data.success) {
      throw new CredentialServiceError(
        response.data.message || 'Failed to validate schema',
        'SCHEMA_VALIDATION_FAILED',
        response.data.errors ? { errors: response.data.errors } : undefined
      );
    }
    
    return response.data.data;
  } catch (error: unknown) {
    if (error instanceof CredentialServiceError) {
      throw error;
    }
    
    const axiosError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
    throw new CredentialServiceError(
      axiosError.response?.data?.message || axiosError.message || 'Failed to validate schema',
      axiosError.response?.data?.code || 'NETWORK_ERROR',
      axiosError.response?.data
    );
  }
};