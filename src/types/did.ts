// DID Types for Auth3 Client - Based on Backend DTOs

export type DIDMethod = 'key' | 'web' | 'ethr' | 'ion' | 'peer';

export enum DIDStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
  REVOKED = 'revoked',
}

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
  serviceEndpoint: string | object; // camelCase for DID document
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

// DID Creation - Based on CreateDIDRequest backend DTO
// Supports all DID methods: key, web, ethr, ion, peer
export interface CreateDIDInput {
  method: DIDMethod;
  key_type?: 'Ed25519' | 'secp256k1' | 'P-256';

  // Web method specific fields (did:web)
  domain?: string;           // Domain for did:web method (required for web)
  path?: string;             // Optional path for did:web method

  // Ethereum method specific fields (did:ethr)
  ethereumAddress?: string;  // Ethereum address for did:ethr method
  networkId?: string;        // Ethereum network (mainnet, goerli, sepolia, polygon, etc.)

  // Peer method specific fields (did:peer)
  peerEndpoint?: string;     // DIDComm endpoint for did:peer method

  // Common fields for all methods
  service_endpoints?: ServiceEndpointInput[]; // Service endpoints to add to DID document
  options?: Record<string, unknown>;          // Additional method-specific options
  metadata?: Record<string, unknown>;         // Additional metadata
}

// Service endpoint input for DID creation
export interface ServiceEndpointInput {
  id: string;
  type: string;
  service_endpoint: string; // snake_case to match backend DTO
  description?: string;
}

export interface DIDOutput {
  id: string;
  did: string;
  method: string;
  document: DIDDocument;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CreateDIDOutput {
  did: DIDOutput;
  created_at: string;
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
export interface DIDData {
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
export interface DIDResponse {
  did: DIDData;
  id: string;
  user_id: string;
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
  document: DIDDocument;
  resolution_metadata: DIDResolutionMetadata;
  document_metadata: DIDDocumentMetadata;
}

export interface DIDResolutionMetadata {
  contentType: string;
  resolved: string;
  error?: string;
}

export interface DIDDocumentMetadata {
  created: string;
  updated: string;
  version_id?: string;
  next_update?: string;
  next_version_id?: string;
  equivalent_id?: string[];
  canonical_id?: string;
}

// List DIDs - Based on ListDIDsRequest/Response
export interface ListDIDsInput {
  page?: number;
  limit?: number;
  offset?: number; // Giữ lại để tương thích ngược
  user_id?: string;
  status?: DIDStatus;
  method?: string;
}

export interface ListDIDsOutput {
  dids: DIDResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats?: DIDStatisticsOutput;
  error?: unknown
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
  did: string;
  user_id?: string;
}

export interface ValidateOwnershipOutput {
  valid: boolean;
  did: string;
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
  total_dids: number;
  active_dids: number;
  deactivated_dids: number;
  revoked_dids: number;
  dids_by_method: Record<string, number>;
  dids_created_today: number;
  dids_created_week: number;
  dids_created_month: number;
}

export interface DIDActivity {
  did: string;
  action: string;
  timestamp: string;
  user_id: string;
  versionId?: string;
}

// Authenticate DID - Based on AuthenticateDIDRequest/Response
export interface AuthenticateDIDInput {
  did: string;
  verification_method_id: string;
  data: Uint8Array;
  signature: Uint8Array;
}

export interface AuthenticateDIDOutput {
  did: string;
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

export type EthereumNetwork = 'mainnet' | 'goerli' | 'sepolia' | 'polygon' | 'local';

// DID Settings types
export interface DIDSettingsResponse {
  // General Settings
  defaultMethod: 'key' | 'web' | 'ethr' | 'ion' | 'peer';
  enableNotifications: boolean;
  notificationEmail: string;
  maxDIDsPerUser: number;

  // Security Settings
  requireMFA: boolean;
  allowWeakKeys: boolean;
  requireApprovalForRevocation: boolean;

  // Network Settings
  ethereumNetwork: EthereumNetwork;
  ethereumRpcUrl: string;
  ionNodeUrl: string;
  ipfsGateway: string;

  // Advanced Settings
  customResolvers: string[];
  enableBatchOperations: boolean;
  maxBatchSize: number;

  // Metadata
  updatedAt: string;
}

export interface UpdateDIDSettingsRequest {
  // General Settings
  defaultMethod?: 'key' | 'web' | 'ethr' | 'ion' | 'peer';
  enableNotifications?: boolean;
  notificationEmail?: string;
  maxDIDsPerUser?: number;

  // Security Settings
  requireMFA?: boolean;
  allowWeakKeys?: boolean;
  requireApprovalForRevocation?: boolean;

  // Network Settings
  ethereumNetwork?: EthereumNetwork;
  ethereumRpcUrl?: string;
  ionNodeUrl?: string;
  ipfsGateway?: string;

  // Advanced Settings
  customResolvers?: string[];
  enableBatchOperations?: boolean;
  maxBatchSize?: number;
}

// DID-002: Enhanced Document Management Types

// Update DID Document - Enhanced full document update
export interface UpdateDIDDocumentRequest {
  context?: string[];
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  assertionMethod?: (string | VerificationMethod)[];
  keyAgreement?: (string | VerificationMethod)[];
  capabilityInvocation?: (string | VerificationMethod)[];
  capabilityDelegation?: (string | VerificationMethod)[];
  service?: ServiceEndpoint[];
  alsoKnownAs?: string[];
  controller?: string[];
  metadata?: Record<string, unknown>;
}

// Service Endpoint Management Types
export interface AddServiceEndpointRequest {
  id: string;
  type: string;
  serviceEndpoint: string | object;
  description?: string;
  routingKeys?: string[];
  accept?: string[];
  priority?: number;
  properties?: Record<string, unknown>;
}

export interface UpdateServiceEndpointRequest {
  type?: string;
  serviceEndpoint?: string | object;
  description?: string;
  routingKeys?: string[];
  accept?: string[];
  priority?: number;
  properties?: Record<string, unknown>;
}

export interface ServiceEndpointResponse {
  id: string;
  type: string;
  serviceEndpoint: string | object;
  description?: string;
  routingKeys?: string[];
  accept?: string[];
  priority?: number;
  properties?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceEndpointsListResponse {
  services: ServiceEndpointResponse[];
  total: number;
}

// Verification Method Management Types
export interface AddVerificationMethodRequest {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: JWK;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
  ethereumAddress?: string;
  properties?: Record<string, unknown>;
}

export interface UpdateVerificationMethodRequest {
  type?: string;
  controller?: string;
  publicKeyJwk?: JWK;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
  ethereumAddress?: string;
  properties?: Record<string, unknown>;
}

export interface VerificationMethodResponse {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: JWK;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
  ethereumAddress?: string;
  properties?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationMethodsListResponse {
  verificationMethods: VerificationMethodResponse[];
  total: number;
}

// Universal DID Resolution Types
export interface ResolutionOptions {
  accept?: string;
  noCache?: boolean;
  versionId?: string;
  versionTime?: string;
}

export interface UniversalResolutionResponse {
  '@context'?: string[];
  didDocument?: DIDDocument;
  didResolutionMetadata: DIDResolutionMetadata;
  didDocumentMetadata: DIDDocumentMetadata;
  resolutionResult: string;
  resolutionTime: string;
  resolver: string;
  cacheInfo: CacheInfo;
  methodSpecificResolution?: Record<string, unknown>;
}

export interface CacheInfo {
  cached: boolean;
  cacheHit: boolean;
  cacheExpiry?: string;
  cacheSource?: string;
}

// Enhanced DID Document Editor Types
export interface DIDDocumentEditContext {
  originalDocument: DIDDocument;
  workingDocument: DIDDocument;
  hasChanges: boolean;
  validationErrors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// DID Editor UI State Types
export interface DIDEditorTab {
  id: string;
  label: string;
  icon?: string;
  component: React.ComponentType<any>;
  badge?: number;
  disabled?: boolean;
}

export interface DIDEditorAction {
  id: string;
  label: string;
  icon?: string;
  variant: 'default' | 'secondary' | 'destructive' | 'link' | 'outline' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// Advanced Resolution Interface Types
export interface DIDResolutionHistory {
  did: string;
  timestamp: string;
  result: UniversalResolutionResponse;
  options?: ResolutionOptions;
  duration: number;
  status: 'success' | 'error' | 'cached';
}

export interface DIDResolutionComparison {
  did: string;
  baseline: UniversalResolutionResponse;
  current: UniversalResolutionResponse;
  differences: DIDDocumentDifference[];
  comparedAt: string;
}

export interface DIDDocumentDifference {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
  field: string;
}

// DID Document Validation Types
export interface DIDDocumentValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  score: number; // 0-100 quality score
  compliance: ComplianceCheck[];
}

export interface ValidationSuggestion {
  field: string;
  message: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ComplianceCheck {
  standard: string; // W3C DID Core, DIF standards, etc.
  compliant: boolean;
  version: string;
  issues: string[];
}

// DID Document Preview Types
export interface DIDDocumentPreview {
  format: 'json' | 'json-ld' | 'yaml' | 'turtle';
  content: string;
  highlighted: boolean;
  downloadable: boolean;
}

// Service Endpoint UI Types
export interface ServiceEndpointFormData {
  id: string;
  type: string;
  serviceEndpoint: string;
  description: string;
  routingKeys: string[];
  accept: string[];
  priority: number;
  properties: Record<string, string>;
}

// Verification Method UI Types
export interface VerificationMethodFormData {
  id: string;
  type: string;
  controller: string;
  keyFormat: 'jwk' | 'multibase' | 'base58' | 'pem' | 'blockchain';
  publicKeyJwk?: JWK;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
  ethereumAddress?: string;
  properties: Record<string, string>;
}