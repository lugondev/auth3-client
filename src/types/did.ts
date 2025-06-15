// DID Types for Auth3 Client - Based on Backend DTOs

export type DIDMethod = 'key' | 'web' | 'ethr' | 'ion' | 'peer';
export type DIDStatus = 'active' | 'deactivated' | 'revoked';

// Core DID Document structure based on W3C DID Core v1.0
export interface DIDDocument {
  '@context': string[];
  id: string;
  controller?: string[];
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  assertionMethod?: (string | VerificationMethod)[];
  keyAgreement?: (string | VerificationMethod)[];
  capabilityInvocation?: (string | VerificationMethod)[];
  capabilityDelegation?: (string | VerificationMethod)[];
  service?: ServiceEndpoint[];
  alsoKnownAs?: string[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: JWK;
  publicKeyMultibase?: string;
  blockchainAccountId?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string | object;
  description?: string;
  routingKeys?: string[];
  accept?: string[];
}

export interface JWK {
  kty: string; // Key Type
  crv?: string; // Curve (for EC keys)
  x?: string; // X coordinate (for EC keys)
  y?: string; // Y coordinate (for EC keys)
  n?: string; // Modulus (for RSA keys)
  e?: string; // Exponent (for RSA keys)
  use?: string; // Public Key Use
  alg?: string; // Algorithm
  kid?: string; // Key ID
}

// DID Authentication Proof
export interface DIDAuthProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws: string;
}

// DID Creation - Based on CreateDIDRequest/Response
export interface CreateDIDInput {
  method: DIDMethod;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateDIDOutput {
  id: string;
  did: string;
  method: string;
  document: DIDDocument;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// Update DID - Based on UpdateDIDRequest/Response
export interface UpdateDIDInput {
  id: string;
  did: string;
  document?: DIDDocument;
  status?: DIDStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateDIDOutput {
  id: string;
  user_id: string;
  did: string;
  method: string;
  identifier: string;
  document: DIDDocument;
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// DID Response - Based on DIDResponse DTO
export interface DIDResponse {
  id: string;
  user_id: string;
  did: string;
  method: string;
  identifier: string;
  document: DIDDocument;
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// DID Resolution - Based on ResolveDIDResponse
export interface ResolveDIDResult {
  didDocument: DIDDocument;
  didResolutionMetadata: DIDResolutionMetadata;
  didDocumentMetadata: DIDDocumentMetadata;
}

export interface DIDResolutionMetadata {
  contentType: string;
  resolved: string;
  error?: string;
}

export interface DIDDocumentMetadata {
  created: string;
  updated: string;
  versionId?: string;
  nextUpdate?: string;
  nextVersionId?: string;
  equivalentId?: string[];
  canonicalId?: string;
}

// List DIDs - Based on ListDIDsRequest/Response
export interface ListDIDsInput {
  offset?: number;
  limit?: number;
  user_id?: string;
  status?: string;
  method?: string;
}

export interface ListDIDsOutput {
  dids: DIDResponse[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
  stats?: DIDStatisticsOutput;
}

// DID Authentication - Based on DID Auth DTOs
export interface CreateChallengeInput {
  did: string;
  nonce?: string;
  domain?: string;
}

export interface CreateChallengeOutput {
  challenge_id: string;
  challenge: string;
  challenge_message: string;
  did_document?: DIDDocument;
  expires_at: string;
}

export interface VerifyChallengeInput {
  challenge_id: string;
  signature: string;
  verification_method?: string;
}

export interface VerifyChallengeOutput {
  valid: boolean;
  did: string;
  did_document?: DIDDocument;
  verified_at: string;
}

export interface DIDAuthInput {
  challenge_id: string;
  signature: string;
  verification_method?: string;
}

// User interface for DID authentication
export interface DIDUser {
  id: string;
  email?: string;
  username?: string;
  profile?: Record<string, unknown>;
}

export interface DIDAuthOutput {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: DIDUser;
  did: string;
}

export interface ValidateSignatureInput {
  did: string;
  message: string;
  signature: string;
  verification_method?: string;
}

export interface ValidateSignatureOutput {
  valid: boolean;
  did: string;
  verification_method: string;
  verified_at: string;
}

// DID Authentication Flow
export interface InitiateDIDAuthInput {
  did: string;
  nonce?: string;
  domain?: string;
}

export interface InitiateDIDAuthOutput {
  challenge_id: string;
  challenge: string;
  challenge_message: string;
  did_document?: DIDDocument;
  expires_at: string;
  instructions: string;
}

export interface CompleteDIDAuthInput {
  challenge_id: string;
  signature: string;
  verification_method?: string;
}

export interface CompleteDIDAuthOutput {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: DIDUser;
  did: string;
}

// DID Operations
export interface DeactivateDIDInput {
  id: string;
  did: string;
  user_id: string;
  reason?: string;
}

export interface RevokeDIDInput {
  id: string;
  did: string;
  user_id: string;
  reason?: string;
}

export interface DIDOperationResult {
  success: boolean;
  message: string;
  did?: string;
  timestamp: string;
}

// DID Ownership Validation
export interface ValidateOwnershipInput {
  did_string: string;
  user_id?: string;
}

export interface ValidateOwnershipOutput {
  valid: boolean;
  did_string: string;
  user_id: string;
  message?: string;
}

// DID Statistics - Based on GetDIDStatisticsResponse
export interface DIDStatisticsInput {
  user_id?: string;
  period?: string;
  method?: string;
}

export interface DIDStatisticsOutput {
  total: number;
  active: number;
  deactivated: number;
  revoked: number;
  by_method: Record<string, number>;
  recent_activity: DIDActivity[];
  user_count?: number;
  timestamp: string;
}

export interface DIDActivity {
  did_string: string;
  action: string;
  timestamp: string;
  user_id: string;
}

// Authenticate DID - Based on AuthenticateDIDRequest/Response
export interface AuthenticateDIDInput {
  did_string: string;
  verification_method_id: string;
  data: Uint8Array;
  signature: Uint8Array;
}

export interface AuthenticateDIDOutput {
  did_string: string;
  authenticated: boolean;
  verification_method: string;
  timestamp: string;
}

// Additional utility types
export interface DIDError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DIDServiceConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

// API Response wrapper
export interface DIDApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Widget Types
export interface DIDSummary {
  total: number;
  active: number;
  deactivated: number;
  revoked: number;
  by_method: Record<DIDMethod, number>;
  recent_count: number;
}

export interface RecentDID {
  id: string;
  did: string;
  method: DIDMethod;
  status: DIDStatus;
  created_at: string;
  identifier: string;
}

export interface DIDMethodInfo {
  method: DIDMethod;
  name: string;
  description: string;
  supported: boolean;
  icon?: string;
  documentation_url?: string;
}

// DID Analytics Types
export interface DIDAnalytics {
  total_dids: number;
  active_dids: number;
  created_today: number;
  created_this_week: number;
  created_this_month: number;
  method_distribution: Record<DIDMethod, number>;
  status_distribution: Record<DIDStatus, number>;
  activity_timeline: DIDActivityPoint[];
}

export interface DIDActivityPoint {
  date: string;
  created: number;
  updated: number;
  deactivated: number;
}

// DID Management Types
export interface DIDManagementFilters {
  method?: DIDMethod;
  status?: DIDStatus;
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface DIDManagementSort {
  field: 'created_at' | 'updated_at' | 'method' | 'status' | 'did';
  direction: 'asc' | 'desc';
}

export interface DIDListParams {
  page?: number;
  limit?: number;
  filters?: DIDManagementFilters;
  sort?: DIDManagementSort;
}

// DID Backup and Recovery
export interface DIDBackup {
  id: string;
  did: string;
  document: DIDDocument;
  private_keys: Record<string, string>; // Encrypted private keys
  metadata: Record<string, unknown>;
  created_at: string;
  encrypted: boolean;
}

export interface DIDRecoveryOptions {
  backup_id?: string;
  recovery_phrase?: string;
  private_key?: string;
  verification_method?: string;
}

// DID Verification Types
export interface DIDVerificationResult {
  did: string;
  valid: boolean;
  document_valid: boolean;
  keys_valid: boolean;
  services_valid: boolean;
  errors: string[];
  warnings: string[];
  verified_at: string;
}

// DID Export/Import Types
export interface DIDExportOptions {
  include_private_keys: boolean;
  include_metadata: boolean;
  format: 'json' | 'jwk' | 'pem';
  encryption?: {
    enabled: boolean;
    password?: string;
    algorithm?: string;
  };
}

export interface DIDImportOptions {
  format: 'json' | 'jwk' | 'pem';
  overwrite_existing: boolean;
  validate_before_import: boolean;
  decryption?: {
    password?: string;
    algorithm?: string;
  };
}