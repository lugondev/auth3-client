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
  DIDApiResponse,
} from '../types/did';

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
    const response = await apiClient.post<DIDApiResponse<CreateDIDOutput>>('/api/v1/dids', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create DID');
  }
);

/**
 * Updates an existing DID
 * @param input - DID update parameters
 * @returns Promise resolving to the updated DID information
 */
export const updateDID = withErrorHandling(
  async (input: UpdateDIDInput): Promise<UpdateDIDOutput> => {
    const response = await apiClient.put<DIDApiResponse<UpdateDIDOutput>>(`/api/v1/dids/${input.did}`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update DID');
  }
);

/**
 * Retrieves a specific DID by ID
 * @param did - DID identifier
 * @returns Promise resolving to the DID information
 */
export const getDID = withErrorHandling(
  async (did: string): Promise<DIDResponse> => {
    const response = await apiClient.get<DIDApiResponse<DIDResponse>>(`/api/v1/dids/${did}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get DID');
  }
);

/**
 * Retrieves a list of DIDs for the current user
 * @param input - Optional filtering and pagination parameters
 * @returns Promise resolving to the list of DIDs
 */
export const listDIDs = async (input?: ListDIDsInput): Promise<ListDIDsOutput> => {
  try {
    const params = new URLSearchParams();
    if (input?.method) params.append('method', input.method);
    if (input?.status) params.append('status', input.status);
    if (input?.limit) params.append('limit', input.limit.toString());
    if (input?.offset) params.append('offset', input.offset.toString());

    const response = await apiClient.get<DIDApiResponse<ListDIDsOutput>>(
      `/api/v1/dids?${params.toString()}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to list DIDs');
  } catch (error) {
    console.error('Failed to list DIDs:', error);
    throw error;
  }
};

/**
 * Resolves a DID to its DID document
 * @param did The DID string to resolve
 * @returns Promise<ResolveDIDResult> The resolved DID document with metadata
 */
export const resolveDID = withErrorHandling(
  async (did: string): Promise<ResolveDIDResult> => {
    const response = await apiClient.post<DIDApiResponse<ResolveDIDResult>>('/api/v1/dids/resolve', { did });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to resolve DID');
  }
);

/**
 * Deactivates a DID (reversible operation)
 * @param input Deactivation parameters including DID and optional reason
 * @returns Promise<DIDOperationResult> Result of the deactivation operation
 */
export const deactivateDID = withErrorHandling(
  async (input: DeactivateDIDInput): Promise<DIDOperationResult> => {
    const response = await apiClient.post<DIDApiResponse<DIDOperationResult>>(`/api/v1/dids/${input.did}/deactivate`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to deactivate DID');
  }
);

/**
 * Revokes a DID (permanent operation)
 * @param input Revocation parameters including DID and reason
 * @returns Promise<DIDOperationResult> Result of the revocation operation
 */
export const revokeDID = withErrorHandling(
  async (input: RevokeDIDInput): Promise<DIDOperationResult> => {
    const response = await apiClient.post<DIDApiResponse<DIDOperationResult>>(`/api/v1/dids/${input.did}/revoke`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to revoke DID');
  }
);

/**
 * Authenticates a DID
 * @param input Authentication parameters
 * @returns Promise<AuthenticateDIDOutput> Authentication result
 */
export const authenticateDID = withErrorHandling(
  async (input: AuthenticateDIDInput): Promise<AuthenticateDIDOutput> => {
    const response = await apiClient.post<DIDApiResponse<AuthenticateDIDOutput>>('/api/v1/dids/authenticate', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to authenticate DID');
  }
);

/**
 * Validates ownership of a DID
 * @param input Ownership validation parameters
 * @returns Promise<ValidateOwnershipOutput> Validation result
 */
export const validateOwnership = withErrorHandling(
  async (input: ValidateOwnershipInput): Promise<ValidateOwnershipOutput> => {
    const response = await apiClient.post<DIDApiResponse<ValidateOwnershipOutput>>(`/api/v1/dids/${input.did_string}/validate-ownership`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to validate ownership');
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

    const response = await apiClient.get<DIDApiResponse<DIDStatisticsOutput>>(
      `/api/v1/dids/statistics?${params.toString()}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get statistics');
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
    const response = await apiClient.post<DIDApiResponse<CreateChallengeOutput>>('/api/v1/auth/did/challenge', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create challenge');
  }
);

/**
 * Verifies a challenge response
 * @param input Challenge verification parameters
 * @returns Promise<VerifyChallengeOutput> Verification result
 */
export const verifyChallenge = withErrorHandling(
  async (input: VerifyChallengeInput): Promise<VerifyChallengeOutput> => {
    const response = await apiClient.post<DIDApiResponse<VerifyChallengeOutput>>('/api/v1/auth/did/verify', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to verify challenge');
  }
);

/**
 * Performs DID authentication
 * @param input DID authentication parameters
 * @returns Promise<DIDAuthOutput> Authentication result
 */
export const didAuth = async (input: DIDAuthInput): Promise<DIDAuthOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<DIDAuthOutput>>('/api/v1/auth/did', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to authenticate');
  } catch (error) {
    console.error('Failed to perform DID auth:', error);
    throw error;
  }
};

/**
 * Validates a signature
 * @param input Signature validation parameters
 * @returns Promise<ValidateSignatureOutput> Validation result
 */
export const validateSignature = withErrorHandling(
  async (input: ValidateSignatureInput): Promise<ValidateSignatureOutput> => {
    const response = await apiClient.post<DIDApiResponse<ValidateSignatureOutput>>('/api/v1/auth/did/validate-signature', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to validate signature');
  }
);

/**
 * Initiates DID authentication flow
 * @param input Authentication initiation parameters
 * @returns Promise<InitiateDIDAuthOutput> Initiation result
 */
export const initiateDIDAuth = withErrorHandling(
  async (input: InitiateDIDAuthInput): Promise<InitiateDIDAuthOutput> => {
    const response = await apiClient.post<DIDApiResponse<InitiateDIDAuthOutput>>('/api/v1/auth/did/init', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to initiate DID auth');
  }
);

/**
 * Completes DID authentication flow
 * @param input Authentication completion parameters
 * @returns Promise<CompleteDIDAuthOutput> Completion result
 */
export const completeDIDAuth = withErrorHandling(
  async (input: CompleteDIDAuthInput): Promise<CompleteDIDAuthOutput> => {
    const response = await apiClient.post<DIDApiResponse<CompleteDIDAuthOutput>>('/api/v1/auth/did/complete', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to complete DID auth');
  }
);