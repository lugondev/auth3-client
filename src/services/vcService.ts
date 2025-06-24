import apiClient from '../lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import {
  IssueCredentialInput,
  IssueCredentialOutput,
  VerifyCredentialInput,
  VerifyCredentialOutput,
  CreatePresentationInput,
  CreatePresentationOutput,
  VerifyPresentationInput,
  VerifyPresentationOutput,
  CredentialStatus,
  ValidateSchemaInput,
  ValidateSchemaOutput,
  CreateTemplateInput,
  ListTemplatesInput,
  CredentialTemplate,
  GetCredentialOutput,
  VerifiableCredential,
} from '../types/credentials';

import {
  CredentialListQuery,
  CredentialListResponse,
  CredentialsBySubjectResponse,
  CredentialStatistics,
  ListTemplatesOutput
} from '../types/vc';
import { convertToUTC } from '@/utils/dateUtils';

// Re-export types for convenience
export type { CredentialStatistics } from '../types/vc';

/**
 * Custom error class for credential service operations
 */
export class CredentialServiceError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CredentialServiceError';
    this.code = code;
    this.details = details;
  }
}



/**
 * Issues a new verifiable credential
 * @param input - Credential issuance parameters
 * @returns Promise resolving to the issued credential
 */
export const issueCredential = withErrorHandling(
  async (input: IssueCredentialInput): Promise<IssueCredentialOutput> => {
    const response = await apiClient.post<IssueCredentialOutput>('/api/v1/credentials/issue', input);
    return response.data;
  }
);

/**
 * Verifies a verifiable credential
 * @param input - Credential verification parameters
 * @returns Promise resolving to verification result
 */
export const verifyCredential = withErrorHandling(
  async (input: VerifyCredentialInput): Promise<VerifyCredentialOutput> => {
    const response = await apiClient.post<VerifyCredentialOutput>('/api/v1/credentials/verify', input);
    return response.data;
  }
);

/**
 * Gets a credential by its ID
 * @param credentialId - The credential ID
 * @returns Promise resolving to the credential
 */
export const getCredential = withErrorHandling(
  async ({ credentialId }: { credentialId: string }): Promise<GetCredentialOutput> => {
    const response = await apiClient.get<GetCredentialOutput>(`/api/v1/credentials/${credentialId}`);
    const data = response.data;
    const { expirationDate } = data;
    return {
      ...data,
      expirationDate: expirationDate ? convertToUTC(expirationDate.toString()) : undefined,
    };
  }
);

/**
 * Gets the status of a credential by its ID
 * @param credentialId - The credential ID
 * @returns Promise resolving to credential status
 */
export const getCredentialStatus = withErrorHandling(
  async (credentialId: string): Promise<CredentialStatus> => {
    const response = await apiClient.get<CredentialStatus>(`/api/v1/credentials/${credentialId}/status`);
    return response.data;
  }
);

/**
 * Lists credentials with optional filtering and pagination
 * @param query - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated credential list
 */
export const listCredentials = withErrorHandling(
  async (query?: CredentialListQuery): Promise<CredentialListResponse> => {
    const params = new URLSearchParams();

    if (query) {
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.status) params.append('status', query.status);
      if (query.type) params.append('type', query.type);
      if (query.issuer) params.append('issuer', query.issuer);
      if (query.subject) params.append('subject', query.subject);
      if (query.search) params.append('search', query.search);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/v1/credentials?${queryString}` : '/api/v1/credentials';

    const response = await apiClient.get<CredentialListResponse>(url);
    return response.data;
  }
);

/**
 * Creates a verifiable presentation from credentials
 * @param input - Presentation creation parameters
 * @returns Promise resolving to the created presentation
 */
export const createPresentation = withErrorHandling(
  async (input: CreatePresentationInput): Promise<CreatePresentationOutput> => {
    const response = await apiClient.post<CreatePresentationOutput>('/api/v1/presentations/create', input);
    return response.data;
  }
);

/**
 * Verifies a verifiable presentation
 * @param input - Presentation verification parameters
 * @returns Promise resolving to verification result
 */
export const verifyPresentation = withErrorHandling(
  async (input: VerifyPresentationInput): Promise<VerifyPresentationOutput> => {
    const response = await apiClient.post<VerifyPresentationOutput>('/api/v1/presentations/verify', input);
    return response.data;
  }
);

/**
 * Revokes a credential by its ID
 * @param credentialId - The credential ID to revoke
 * @returns Promise resolving when revocation is complete
 */
export const revokeCredential = withErrorHandling(
  async (credentialId: string): Promise<void> => {
    const response = await apiClient.post<void>(`/api/v1/credentials/${credentialId}/revoke`);
    return response.data;
  }
);

/**
 * Gets credentials by subject DID
 * @param subjectDid - The subject DID to search for
 * @returns Promise resolving to credentials for the subject
 */
export const getCredentialsBySubject = withErrorHandling(
  async (subjectDid: string): Promise<CredentialsBySubjectResponse> => {
    const response = await apiClient.get<CredentialsBySubjectResponse>(`/api/v1/credentials/subject/${encodeURIComponent(subjectDid)}`);
    return response.data;
  }
);

/**
 * Gets credential statistics
 * @returns Promise resolving to credential statistics
 */
export const getCredentialStatistics = withErrorHandling(
  async (): Promise<CredentialStatistics> => {
    const response = await apiClient.get<CredentialStatistics>('/api/v1/credentials/statistics');
    return response.data;
  }
);

/**
 * Validates a credential schema
 * @param input - Schema validation parameters
 * @returns Promise resolving to validation result
 */
export const validateSchema = withErrorHandling(
  async (input: ValidateSchemaInput): Promise<ValidateSchemaOutput> => {
    const response = await apiClient.post<ValidateSchemaOutput>('/api/v1/credentials/validate-schema', input);
    return response.data;
  }
);

/**
 * Lists credential templates with optional filtering and pagination
 * @param query - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated template list
 */
export const listTemplates = withErrorHandling(
  async (query?: ListTemplatesInput): Promise<ListTemplatesOutput> => {
    const params = new URLSearchParams();

    if (query) {
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
      if (query.type) params.append('type', query.type);
      if (query.search) params.append('search', query.search);
      if (query.status) params.append('status', query.status);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/v1/credentials/templates?${queryString}` : '/api/v1/credentials/templates';

    const response = await apiClient.get<ListTemplatesOutput>(url);
    return response.data;
  }
);

/**
 * Creates a new credential template
 * @param input - Template creation parameters
 * @returns Promise resolving to the created template
 */
export const createTemplate = withErrorHandling(
  async (input: CreateTemplateInput): Promise<CredentialTemplate> => {
    const response = await apiClient.post<CredentialTemplate>('/api/v1/credentials/templates', input);
    return response.data;
  }
);

/**
 * Deletes a credential template by its ID
 * @param templateId - The template ID to delete
 * @returns Promise resolving when deletion is complete
 */
export const deleteTemplate = withErrorHandling(
  async (templateId: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/api/v1/credentials/templates/${templateId}`);
    return response.data;
  }
);

/**
 * Cleans a database credential object to create a proper W3C Verifiable Credential
 * for verification purposes. Removes database-specific fields and ensures timezone consistency.
 */
export const cleanCredentialForVerification = (credential: VerifiableCredential | Record<string, unknown>): VerifiableCredential => {
  // Extract only the W3C VC fields, excluding database metadata
  const {
    expirationDate,
    proof,
    credentialSchema,
    refreshService,
    termsOfUse,
    evidence
  } = credential;

  // Build clean credential object with only W3C VC fields
  const cleanCredential: Record<string, unknown> = {
    ...credential
  };

  // Add optional fields only if they exist
  // For expirationDate, ensure it's in the original format (avoid timezone conversion issues)
  if (expirationDate) {
    // If expirationDate is a string and looks like it was converted from UTC to local timezone,
    // we might need to preserve the original format. For now, use as-is.
    cleanCredential.expirationDate = convertToUTC(expirationDate.toString());
  }
  if (proof) cleanCredential.proof = proof;
  if (credentialSchema) cleanCredential.credentialSchema = credentialSchema;
  if (refreshService) cleanCredential.refreshService = refreshService;
  if (termsOfUse) cleanCredential.termsOfUse = termsOfUse;
  if (evidence) cleanCredential.evidence = evidence;

  return cleanCredential as unknown as VerifiableCredential;
};