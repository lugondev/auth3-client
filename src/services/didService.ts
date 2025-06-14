import apiClient from '../lib/apiClient';
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
export const createDID = async (input: CreateDIDInput): Promise<CreateDIDOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<CreateDIDOutput>>('/api/v1/dids', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create DID');
  } catch (error) {
    console.error('Failed to create DID:', error);
    throw error;
  }
};

/**
 * Updates an existing DID
 * @param input - DID update parameters
 * @returns Promise resolving to the updated DID information
 */
export const updateDID = async (input: UpdateDIDInput): Promise<UpdateDIDOutput> => {
  try {
    const response = await apiClient.put<DIDApiResponse<UpdateDIDOutput>>(`/api/v1/dids/${input.did}`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update DID');
  } catch (error) {
    console.error('Failed to update DID:', error);
    throw error;
  }
};

/**
 * Retrieves a specific DID by ID
 * @param did - DID identifier
 * @returns Promise resolving to the DID information
 */
export const getDID = async (did: string): Promise<DIDResponse> => {
  try {
    const response = await apiClient.get<DIDApiResponse<DIDResponse>>(`/api/v1/dids/${did}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get DID');
  } catch (error) {
    console.error('Failed to get DID:', error);
    throw error;
  }
};

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
export const resolveDID = async (did: string): Promise<ResolveDIDResult> => {
  try {
    const response = await apiClient.post<DIDApiResponse<ResolveDIDResult>>('/api/v1/dids/resolve', { did });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to resolve DID');
  } catch (error) {
    console.error('Failed to resolve DID:', error);
    throw error;
  }
};

/**
 * Deactivates a DID (reversible operation)
 * @param input Deactivation parameters including DID and optional reason
 * @returns Promise<DIDOperationResult> Result of the deactivation operation
 */
export const deactivateDID = async (input: DeactivateDIDInput): Promise<DIDOperationResult> => {
  try {
    const response = await apiClient.put<DIDApiResponse<DIDOperationResult>>(`/api/v1/dids/${input.did}/deactivate`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to deactivate DID');
  } catch (error) {
    console.error('Failed to deactivate DID:', error);
    throw error;
  }
};

/**
 * Revokes a DID (permanent operation)
 * @param input Revocation parameters including DID and reason
 * @returns Promise<DIDOperationResult> Result of the revocation operation
 */
export const revokeDID = async (input: RevokeDIDInput): Promise<DIDOperationResult> => {
  try {
    const response = await apiClient.put<DIDApiResponse<DIDOperationResult>>(`/api/v1/dids/${input.did}/revoke`, input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to revoke DID');
  } catch (error) {
    console.error('Failed to revoke DID:', error);
    throw error;
  }
};

/**
 * Authenticates a DID
 * @param input Authentication parameters
 * @returns Promise<AuthenticateDIDOutput> Authentication result
 */
export const authenticateDID = async (input: AuthenticateDIDInput): Promise<AuthenticateDIDOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<AuthenticateDIDOutput>>('/api/v1/dids/authenticate', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to authenticate DID');
  } catch (error) {
    console.error('Failed to authenticate DID:', error);
    throw error;
  }
};

/**
 * Validates ownership of a DID
 * @param input Ownership validation parameters
 * @returns Promise<ValidateOwnershipOutput> Validation result
 */
export const validateOwnership = async (input: ValidateOwnershipInput): Promise<ValidateOwnershipOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<ValidateOwnershipOutput>>('/api/v1/dids/validate-ownership', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to validate ownership');
  } catch (error) {
    console.error('Failed to validate ownership:', error);
    throw error;
  }
};

/**
 * Gets DID statistics
 * @param input Statistics parameters
 * @returns Promise<DIDStatisticsOutput> Statistics data
 */
export const getDIDStatistics = async (input?: DIDStatisticsInput): Promise<DIDStatisticsOutput> => {
  try {
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
  } catch (error) {
    console.error('Failed to get DID statistics:', error);
    throw error;
  }
};

// DID Authentication Challenge Functions

/**
 * Creates a challenge for DID authentication
 * @param input Challenge creation parameters
 * @returns Promise<CreateChallengeOutput> The generated challenge
 */
export const createChallenge = async (input: CreateChallengeInput): Promise<CreateChallengeOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<CreateChallengeOutput>>('/api/v1/auth/did/challenge', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create challenge');
  } catch (error) {
    console.error('Failed to create challenge:', error);
    throw error;
  }
};

/**
 * Verifies a challenge response
 * @param input Challenge verification parameters
 * @returns Promise<VerifyChallengeOutput> Verification result
 */
export const verifyChallenge = async (input: VerifyChallengeInput): Promise<VerifyChallengeOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<VerifyChallengeOutput>>('/api/v1/auth/did/verify', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to verify challenge');
  } catch (error) {
    console.error('Failed to verify challenge:', error);
    throw error;
  }
};

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
export const validateSignature = async (input: ValidateSignatureInput): Promise<ValidateSignatureOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<ValidateSignatureOutput>>('/api/v1/auth/did/validate-signature', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to validate signature');
  } catch (error) {
    console.error('Failed to validate signature:', error);
    throw error;
  }
};

/**
 * Initiates DID authentication flow
 * @param input Authentication initiation parameters
 * @returns Promise<InitiateDIDAuthOutput> Initiation result
 */
export const initiateDIDAuth = async (input: InitiateDIDAuthInput): Promise<InitiateDIDAuthOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<InitiateDIDAuthOutput>>('/api/v1/auth/did/init', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to initiate DID auth');
  } catch (error) {
    console.error('Failed to initiate DID auth:', error);
    throw error;
  }
};

/**
 * Completes DID authentication flow
 * @param input Authentication completion parameters
 * @returns Promise<CompleteDIDAuthOutput> Completion result
 */
export const completeDIDAuth = async (input: CompleteDIDAuthInput): Promise<CompleteDIDAuthOutput> => {
  try {
    const response = await apiClient.post<DIDApiResponse<CompleteDIDAuthOutput>>('/api/v1/auth/did/complete', input);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to complete DID auth');
  } catch (error) {
    console.error('Failed to complete DID auth:', error);
    throw error;
  }
};