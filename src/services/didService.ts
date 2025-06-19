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
  AuthenticateDIDInput,
  AuthenticateDIDOutput,
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
    const response = await apiClient.post<ValidateOwnershipOutput>(`/api/v1/dids/${input.did_string}/validate-ownership`, input);
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


// Export all functions as default service object
export const didService = {
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
};

export default didService;