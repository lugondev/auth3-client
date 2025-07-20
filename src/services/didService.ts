import apiClient from '../lib/apiClient';
import { withErrorHandling } from './errorHandlingService';
import type {
  CreateDIDInput,
  CreateDIDOutput,
  UpdateDIDInput,
  UpdateDIDOutput,
  DIDResponse,
  ListDIDsInput,
  ListDIDsOutput,
  ResolveDIDResult,
  DeactivateDIDInput,
  RevokeDIDInput,
  DIDOperationResult,
  CreateChallengeInput,
  CreateChallengeOutput,
  VerifyChallengeInput,
  VerifyChallengeOutput,
  DIDAuthInput,
  DIDAuthOutput,
  AuthenticateDIDInput,
  AuthenticateDIDOutput,
  ValidateSignatureInput,
  ValidateSignatureOutput,
  InitiateDIDAuthInput,
  InitiateDIDAuthOutput,
  CompleteDIDAuthInput,
  CompleteDIDAuthOutput,
  ValidateOwnershipInput,
  ValidateOwnershipOutput,
  DIDStatisticsInput,
  DIDStatisticsOutput,
  DIDSettingsResponse,
  UpdateDIDSettingsRequest,
  // DID-002: Enhanced Document Management Types
  UpdateDIDDocumentRequest,
  AddServiceEndpointRequest,
  UpdateServiceEndpointRequest,
  ServiceEndpointResponse,
  ServiceEndpointsListResponse,
  AddVerificationMethodRequest,
  UpdateVerificationMethodRequest,
  VerificationMethodResponse,
  VerificationMethodsListResponse,
  ResolutionOptions,
  UniversalResolutionResponse,
} from '@/types';

/**
 * DID Service - Client-side service for managing Decentralized Identifiers
 * 
 * This service provides methods to interact with DID-related endpoints,
 * including creation, resolution, authentication, and management operations.
 * Based on the actual backend API structure.
 */

/**
 * Creates a new DID with the specified method and options
 * @param input - DID creation parameters
 * @returns Promise resolving to the created DID information
 */
export const createDID = withErrorHandling(
  async (input: CreateDIDInput): Promise<CreateDIDOutput> => {
    const response = await apiClient.post<CreateDIDOutput>('/api/v1/dids', input);
    return response.data;
  }
);

/**
 * Updates an existing DID
 * @param input - DID update parameters
 * @returns Promise resolving to the updated DID information
 */
export const updateDID = withErrorHandling(
  async (input: UpdateDIDInput): Promise<UpdateDIDOutput> => {
    const response = await apiClient.put<UpdateDIDOutput>(`/api/v1/dids/${input.did}`, input);
    return response.data;
  }
);

/**
 * Retrieves a specific DID by ID
 * @param did - DID identifier
 * @returns Promise resolving to the DID information
 */
export const getDID = withErrorHandling(
  async (did: string): Promise<DIDResponse> => {
    const response = await apiClient.get<DIDResponse>(`/api/v1/dids/${did}`);
    return response.data;
  }
);

/**
 * Retrieves a list of DIDs for the current user
 * @param input - Optional filtering and pagination parameters
 * @returns Promise resolving to the list of DIDs
 */
export const listDIDs = withErrorHandling(
  async (input?: ListDIDsInput): Promise<ListDIDsOutput> => {
    const params = new URLSearchParams();
    if (input?.method) params.append('method', input.method);
    if (input?.status) params.append('status', input.status);
    if (input?.limit) params.append('limit', input.limit.toString());
    if (input?.sort) params.append('sort', input.sort);

    if (input?.page) {
      // If page is provided, use it
      const limit = input.limit || 10; // Default to 10 if limit is not provided
      const offset = (input.page - 1) * limit;
      params.append('offset', offset.toString());
      params.append('page', input.page.toString()); // Add page to query params
    } else if (input?.offset !== undefined) {
      // If page is not provided but offset is, use offset
      params.append('offset', input.offset.toString());
    }

    const response = await apiClient.get<ListDIDsOutput>(
      `/api/v1/dids?${params.toString()}`
    );
    return response.data;
  }
);

/**
 * Resolves a DID to its DID document
 * @param did The DID string to resolve
 * @returns Promise<ResolveDIDResult> The resolved DID document with metadata
 */
export const resolveDID = withErrorHandling(
  async (did: string): Promise<ResolveDIDResult> => {
    const response = await apiClient.post<ResolveDIDResult>('/api/v1/dids/resolve', { did });
    return response.data;
  }
);

/**
 * Deactivates a DID (reversible operation)
 * @param input Deactivation parameters including DID and optional reason
 * @returns Promise<DIDOperationResult> Result of the deactivation operation
 */
export const deactivateDID = withErrorHandling(
  async (input: DeactivateDIDInput): Promise<void> => {
    await apiClient.post(`/api/v1/dids/${input.did}/deactivate`, input);
  }
);

/**
 * Revokes a DID (permanent operation)
 * @param input Revocation parameters including DID and reason
 * @returns Promise<void>
 */
export const revokeDID = withErrorHandling(
  async (input: RevokeDIDInput): Promise<void> => {
    await apiClient.post(`/api/v1/dids/${input.did}/revoke`, input);
  }
);

/**
 * Authenticates a DID
 * @param input Authentication parameters
 * @returns Promise<AuthenticateDIDOutput> Authentication result
 */
export const authenticateDID = withErrorHandling(
  async (input: AuthenticateDIDInput): Promise<AuthenticateDIDOutput> => {
    const response = await apiClient.post<AuthenticateDIDOutput>('/api/v1/dids/authenticate', input);
    return response.data;
  }
);

/**
 * Validates ownership of a DID
 * @param input Ownership validation parameters
 * @returns Promise<ValidateOwnershipOutput> Validation result
 */
export const validateOwnership = withErrorHandling(
  async (input: ValidateOwnershipInput): Promise<ValidateOwnershipOutput> => {
    const response = await apiClient.post<ValidateOwnershipOutput>(`/api/v1/dids/${input.did}/validate-ownership`, input);
    return response.data;
  }
);

/**
 * Gets DID statistics
 * @param input Statistics parameters
 * @returns Promise<DIDStatisticsOutput> Statistics data
 */
export const getDIDStatistics = withErrorHandling(
  async (input?: DIDStatisticsInput): Promise<DIDStatisticsOutput> => {
    const params = new URLSearchParams();
    if (input?.period) params.append('period', input.period);
    if (input?.method) params.append('method', input.method);

    const response = await apiClient.get<DIDStatisticsOutput>(
      `/api/v1/dids/statistics?${params.toString()}`
    );
    return response.data;
  }
);

// DID Authentication Challenge Functions

/**
 * Creates a challenge for DID authentication
 * @param input Challenge creation parameters
 * @returns Promise<CreateChallengeOutput> The generated challenge
 */
export const createChallenge = withErrorHandling(
  async (input: CreateChallengeInput): Promise<CreateChallengeOutput> => {
    const response = await apiClient.post<CreateChallengeOutput>('/api/v1/auth/did/challenge', input);
    return response.data;
  }
);

/**
 * Verifies a challenge response
 * @param input Challenge verification parameters
 * @returns Promise<VerifyChallengeOutput> Verification result
 */
export const verifyChallenge = withErrorHandling(
  async (input: VerifyChallengeInput): Promise<VerifyChallengeOutput> => {
    const response = await apiClient.post<VerifyChallengeOutput>('/api/v1/auth/did/verify', input);
    return response.data;
  }
);

/**
 * Performs DID authentication
 * @param input DID authentication parameters
 * @returns Promise<DIDAuthOutput> Authentication result
 */
export const didAuth = withErrorHandling(
  async (input: DIDAuthInput): Promise<DIDAuthOutput> => {
    const response = await apiClient.post<DIDAuthOutput>('/api/v1/auth/did', input);
    return response.data;
  }
);

/**
 * Validates a signature
 * @param input Signature validation parameters
 * @returns Promise<ValidateSignatureOutput> Validation result
 */
export const validateSignature = withErrorHandling(
  async (input: ValidateSignatureInput): Promise<ValidateSignatureOutput> => {
    const response = await apiClient.post<ValidateSignatureOutput>('/api/v1/auth/did/validate-signature', input);
    return response.data;
  }
);

/**
 * Initiates DID authentication flow
 * @param input Authentication initiation parameters
 * @returns Promise<InitiateDIDAuthOutput> Initiation result
 */
export const initiateDIDAuth = withErrorHandling(
  async (input: InitiateDIDAuthInput): Promise<InitiateDIDAuthOutput> => {
    const response = await apiClient.post<InitiateDIDAuthOutput>('/api/v1/auth/did/init', input);
    return response.data;
  }
);

/**
 * Completes DID authentication flow
 * @param input Authentication completion parameters
 * @returns Promise<CompleteDIDAuthOutput> Completion result
 */
export const completeDIDAuth = withErrorHandling(
  async (input: CompleteDIDAuthInput): Promise<CompleteDIDAuthOutput> => {
    const response = await apiClient.post<CompleteDIDAuthOutput>('/api/v1/auth/did/complete', input);
    return response.data;
  }
);

/**
 * Get DID settings for the authenticated user
 */
export const getDIDSettings = withErrorHandling(
  async (): Promise<DIDSettingsResponse> => {
    const response = await apiClient.get<DIDSettingsResponse>('/api/v1/dids/settings');
    return response.data;
  }
);

/**
 * Update DID settings for the authenticated user
 */
export const updateDIDSettings = withErrorHandling(
  async (settings: UpdateDIDSettingsRequest): Promise<DIDSettingsResponse> => {
    const response = await apiClient.put<DIDSettingsResponse>('/api/v1/dids/settings', settings);
    return response.data;
  }
);

// DID-002: Enhanced Document Management Services

/**
 * Update a complete DID document
 * @param did - DID identifier
 * @param request - DID document update request
 * @returns Promise<DIDResponse> Updated DID information
 */
export const updateDIDDocument = withErrorHandling(
  async (did: string, request: UpdateDIDDocumentRequest): Promise<DIDResponse> => {
    const response = await apiClient.put<DIDResponse>(`/api/v1/dids/${did}/document`, request);
    return response.data;
  }
);

/**
 * Add a service endpoint to a DID document
 * @param did - DID identifier
 * @param request - Service endpoint creation request
 * @returns Promise<ServiceEndpointResponse> Created service endpoint
 */
export const addServiceEndpoint = withErrorHandling(
  async (did: string, request: AddServiceEndpointRequest): Promise<ServiceEndpointResponse> => {
    const response = await apiClient.post<ServiceEndpointResponse>(`/api/v1/dids/${did}/services`, request);
    return response.data;
  }
);

/**
 * Update a service endpoint in a DID document
 * @param did - DID identifier
 * @param serviceId - Service endpoint identifier
 * @param request - Service endpoint update request
 * @returns Promise<ServiceEndpointResponse> Updated service endpoint
 */
export const updateServiceEndpoint = withErrorHandling(
  async (did: string, serviceId: string, request: UpdateServiceEndpointRequest): Promise<ServiceEndpointResponse> => {
    const response = await apiClient.put<ServiceEndpointResponse>(`/api/v1/dids/${did}/services/${serviceId}`, request);
    return response.data;
  }
);

/**
 * Remove a service endpoint from a DID document
 * @param did - DID identifier
 * @param serviceId - Service endpoint identifier
 * @returns Promise<void>
 */
export const removeServiceEndpoint = withErrorHandling(
  async (did: string, serviceId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/dids/${did}/services/${serviceId}`);
  }
);

/**
 * Get all service endpoints for a DID
 * @param did - DID identifier
 * @returns Promise<ServiceEndpointsListResponse> List of service endpoints
 */
export const getServiceEndpoints = withErrorHandling(
  async (did: string): Promise<ServiceEndpointsListResponse> => {
    const response = await apiClient.get<ServiceEndpointsListResponse>(`/api/v1/dids/${did}/services`);
    return response.data;
  }
);

/**
 * Add a verification method to a DID document
 * @param did - DID identifier
 * @param request - Verification method creation request
 * @returns Promise<VerificationMethodResponse> Created verification method
 */
export const addVerificationMethod = withErrorHandling(
  async (did: string, request: AddVerificationMethodRequest): Promise<VerificationMethodResponse> => {
    const response = await apiClient.post<VerificationMethodResponse>(`/api/v1/dids/${did}/verification-methods`, request);
    return response.data;
  }
);

/**
 * Update a verification method in a DID document
 * @param did - DID identifier
 * @param vmId - Verification method identifier
 * @param request - Verification method update request
 * @returns Promise<VerificationMethodResponse> Updated verification method
 */
export const updateVerificationMethod = withErrorHandling(
  async (did: string, vmId: string, request: UpdateVerificationMethodRequest): Promise<VerificationMethodResponse> => {
    const response = await apiClient.put<VerificationMethodResponse>(`/api/v1/dids/${did}/verification-methods/${vmId}`, request);
    return response.data;
  }
);

/**
 * Remove a verification method from a DID document
 * @param did - DID identifier
 * @param vmId - Verification method identifier
 * @returns Promise<void>
 */
export const removeVerificationMethod = withErrorHandling(
  async (did: string, vmId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/dids/${did}/verification-methods/${vmId}`);
  }
);

/**
 * Get all verification methods for a DID
 * @param did - DID identifier
 * @returns Promise<VerificationMethodsListResponse> List of verification methods
 */
export const getVerificationMethods = withErrorHandling(
  async (did: string): Promise<VerificationMethodsListResponse> => {
    const response = await apiClient.get<VerificationMethodsListResponse>(`/api/v1/dids/${did}/verification-methods`);
    return response.data;
  }
);

/**
 * Resolve a DID with enhanced universal resolution
 * @param did - DID identifier
 * @param options - Resolution options
 * @returns Promise<UniversalResolutionResponse> Enhanced resolution result
 */
export const resolveUniversalDID = withErrorHandling(
  async (did: string, options?: ResolutionOptions): Promise<UniversalResolutionResponse> => {
    const response = await apiClient.post<UniversalResolutionResponse>('/api/v1/dids/resolve/universal', {
      did,
      options
    });
    return response.data;
  }
);

/**
 * Admin: Lists all DIDs in the system (Admin only)
 * @param input - Optional filtering and pagination parameters
 * @returns Promise resolving to the list of all DIDs
 */
export const adminListDIDs = withErrorHandling(
  async (input?: ListDIDsInput): Promise<ListDIDsOutput> => {
    const params = new URLSearchParams();
    if (input?.method) params.append('method', input.method);
    if (input?.status) params.append('status', input.status);
    if (input?.limit) params.append('limit', input.limit.toString());
    if (input?.sort) params.append('sort', input.sort);

    if (input?.page) {
      // If page is provided, use it
      const limit = input.limit || 10;
      const offset = (input.page - 1) * limit;
      params.append('offset', offset.toString());
      params.append('page', input.page.toString());
    } else if (input?.offset !== undefined) {
      // If page is not provided but offset is, use offset
      params.append('offset', input.offset.toString());
    }

    const response = await apiClient.get<ListDIDsOutput>(
      `/api/v1/admin/dids?${params.toString()}`
    );
    return response.data;
  }
);

/**
 * Admin: Deactivates a DID (Admin only)
 * @param did DID string to deactivate
 * @param reason Optional reason for deactivation
 * @returns Promise<void>
 */
export const adminDeactivateDID = withErrorHandling(
  async (did: string, reason?: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/dids/${did}/deactivate`, {
      reason: reason,
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Admin: Revokes a DID (Admin only)
 * @param did DID string to revoke
 * @param reason Optional reason for revocation
 * @returns Promise<void>
 */
export const adminRevokeDID = withErrorHandling(
  async (did: string, reason?: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/dids/${did}/revoke`, {
      reason: reason,
      timestamp: new Date().toISOString(),
    });
  }
);

const didService = {
  createDID,
  updateDID,
  getDID,
  listDIDs,
  resolveDID,
  deactivateDID,
  revokeDID,
  authenticateDID,
  didAuth,
  getDIDStatistics,
  getDIDSettings,
  updateDIDSettings,
  // DID-002: Enhanced Document Management
  updateDIDDocument,
  addServiceEndpoint,
  updateServiceEndpoint,
  removeServiceEndpoint,
  getServiceEndpoints,
  addVerificationMethod,
  updateVerificationMethod,
  removeVerificationMethod,
  getVerificationMethods,
  resolveUniversalDID,
  // Admin functions
  adminListDIDs,
  adminDeactivateDID,
  adminRevokeDID,
};

export default didService;