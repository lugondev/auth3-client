/**
 * Verifiable Credentials Types
 * Based on W3C Verifiable Credentials Data Model v1.1
 */

export type CredentialStatus = 'active' | 'revoked' | 'suspended' | 'expired';
export type PresentationStatus = 'valid' | 'invalid' | 'expired' | 'revoked';
export type VerificationStatus = 'verified' | 'failed' | 'pending' | 'error';

// Core Verifiable Credential structure
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  proof?: Proof | Proof[];
  credentialSchema?: CredentialSchema[];
  refreshService?: RefreshService;
  termsOfUse?: TermsOfUse[];
  evidence?: Evidence[];
}

export interface Issuer {
  id: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
}

export interface CredentialSubject {
  id?: string;
  [key: string]: unknown;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
  proofValue?: string;
  challenge?: string;
  domain?: string;
}

export interface CredentialSchema {
  id: string;
  type: string;
}

export interface RefreshService {
  id: string;
  type: string;
}

export interface TermsOfUse {
  type: string;
  id?: string;
  profile?: string;
  prohibition?: Prohibition[];
}

export interface Prohibition {
  assigner?: string;
  assignee?: string;
  target?: string;
  action?: string[];
}

export interface Evidence {
  id?: string;
  type: string[];
  verifier?: string;
  evidenceDocument?: string;
  subjectPresence?: string;
  documentPresence?: string;
}

// Verifiable Presentation
export interface VerifiablePresentation {
  '@context': string[];
  id?: string;
  type: string[];
  verifiableCredential: VerifiableCredential[];
  holder?: string;
  proof?: Proof | Proof[];
}

// API Input/Output Types
export interface IssueCredentialInput {
  credentialSubject: CredentialSubject;
  type: string[];
  expirationDate?: string;
  credentialSchema?: CredentialSchema[];
  evidence?: Evidence[];
  termsOfUse?: TermsOfUse[];
  refreshService?: RefreshService;
}

export interface IssueCredentialOutput {
  credential: VerifiableCredential;
  credentialId: string;
  status: CredentialStatus;
  issuanceDate: string;
}

export interface VerifyCredentialInput {
  credential: VerifiableCredential;
  options?: VerificationOptions;
}

export interface VerificationOptions {
  challenge?: string;
  domain?: string;
  checkStatus?: boolean;
  checkExpiration?: boolean;
  allowedIssuers?: string[];
}

export interface VerifyCredentialOutput {
  verified: boolean;
  status: VerificationStatus;
  checks: VerificationCheck[];
  warnings?: string[];
  errors?: string[];
  verifiedAt?: string;
}

export interface VerificationCheck {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  message?: string;
}

export interface RevokeCredentialInput {
  credentialId: string;
  reason?: string;
}

export interface RevokeCredentialOutput {
  credentialId: string;
  status: CredentialStatus;
  revokedAt: string;
  reason?: string;
}

export interface GetCredentialInput {
  credentialId: string;
}

export interface GetCredentialOutput {
  credential: VerifiableCredential;
  metadata: CredentialMetadata;
}

export interface CredentialMetadata {
  id: string;
  '@context': string[];
  status: CredentialStatus;
  issuedAt: string;
  issuanceDate: string;
  revokedAt?: string;
  expiresAt?: string;
  issuer: string;
  subject: string;
  type: string[];
  credentialSubject: CredentialSubject;
  schemaId?: string;
}

export interface ListCredentialsInput {
  page?: number;
  limit?: number;
  status?: CredentialStatus;
  type?: string;
  issuer?: string;
  subject?: string;
  sortBy?: 'issuedAt' | 'expiresAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ListCredentialsOutput {
  credentials: CredentialMetadata[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetCredentialStatusInput {
  credentialId: string;
}

export interface GetCredentialStatusOutput {
  credentialId: string;
  status: CredentialStatus;
  statusReason?: string;
  lastUpdated: string;
}

export interface CreatePresentationInput {
  credentials: VerifiableCredential[];
  holder?: string;
  challenge?: string;
  domain?: string;
}

export interface CreatePresentationOutput {
  presentation: VerifiablePresentation;
  presentationId: string;
}

export interface VerifyPresentationInput {
  presentation: VerifiablePresentation;
  options?: VerificationOptions;
}

export interface VerifyPresentationOutput {
  verified: boolean;
  status: VerificationStatus;
  checks: VerificationCheck[];
  credentialResults: VerifyCredentialOutput[];
  warnings?: string[];
  errors?: string[];
}

// JSON Schema interface for credential subject validation
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: string;
  description?: string;
  format?: string;
  enum?: (string | number | boolean)[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

// Credential Templates
export interface CredentialTemplate {
  id: string;
  name: string;
  description: string;
  type: string[];
  schema: CredentialSchema;
  subjectSchema: JSONSchema;
  issuer: string;
  expirationPeriod?: number; // in days
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
  tags?: string[];
  version?: string;
  issuanceCount?: number;
  context?: string | string[] | object;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  type: string[];
  schema: CredentialSchema;
  subjectSchema: JSONSchema;
  expirationPeriod?: number;
  isActive?: boolean;
}

export interface UpdateTemplateInput {
  templateId: string;
  name?: string;
  description?: string;
  type?: string[];
  schema?: CredentialSchema;
  subjectSchema?: JSONSchema;
  expirationPeriod?: number;
  isActive?: boolean;
}

export interface ListTemplatesInput {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: string;
  search?: string;
  status?: string;
}

export interface ListTemplatesOutput {
  templates: CredentialTemplate[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API Response wrapper
export interface CredentialApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Error types
export interface CredentialError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class CredentialServiceError extends Error {
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CredentialServiceError';
    this.code = code;
    this.details = details;
  }
}

// Dashboard Widget Types
export interface CredentialSummary {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  suspended: number;
  issued_today: number;
  issued_this_week: number;
  issued_this_month: number;
  expiring_soon: number;
  by_type: Record<string, number>;
  by_issuer: Record<string, number>;
}

export interface RecentCredential {
  id: string;
  type: string[];
  issuer: string | Issuer;
  subject: string;
  status: CredentialStatus;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
}

export interface CredentialAnalytics {
  total_issued: number;
  total_verified: number;
  total_revoked: number;
  issuance_by_day: CredentialActivityPoint[];
  verification_by_day: CredentialActivityPoint[];
  top_types: TypeStatistic[];
  top_issuers: IssuerStatistic[];
  expiration_timeline: ExpirationPoint[];
}

export interface CredentialActivityPoint {
  date: string;
  issued: number;
  verified: number;
  revoked: number;
}

export interface TypeStatistic {
  type: string;
  count: number;
  percentage: number;
}

export interface IssuerStatistic {
  issuer: string;
  issuer_name?: string;
  count: number;
  percentage: number;
}

export interface ExpirationPoint {
  date: string;
  expiring_count: number;
  expired_count: number;
}

// Advanced Credential Management Types
export interface CredentialFilters {
  status?: CredentialStatus[];
  type?: string[];
  issuer?: string[];
  subject?: string;
  issued_from?: string;
  issued_to?: string;
  expires_from?: string;
  expires_to?: string;
  search?: string;
  has_schema?: boolean;
  schema_id?: string;
}

export interface CredentialSort {
  field: 'issuanceDate' | 'expirationDate' | 'status' | 'type' | 'issuer';
  direction: 'asc' | 'desc';
}

export interface CredentialListParams {
  page?: number;
  limit?: number;
  filters?: CredentialFilters;
  sort?: CredentialSort;
}

// Credential Verification History
export interface VerificationHistory {
  id: string;
  credential_id: string;
  verifier: string;
  verification_date: string;
  status: VerificationStatus;
  checks_performed: VerificationCheck[];
  challenge?: string;
  domain?: string;
  errors?: string[];
  warnings?: string[];
}

export interface VerificationStatistics {
  total_verifications: number;
  successful_verifications: number;
  failed_verifications: number;
  verification_rate: number;
  average_verification_time: number;
  verifications_by_day: VerificationActivityPoint[];
  top_verifiers: VerifierStatistic[];
}

export interface VerificationActivityPoint {
  date: string;
  successful: number;
  failed: number;
  total: number;
}

export interface VerifierStatistic {
  verifier: string;
  verification_count: number;
  success_rate: number;
}

// Credential Schema Management
export interface SchemaRegistry {
  schemas: CredentialSchemaDefinition[];
  total: number;
  categories: string[];
}

export interface CredentialSchemaDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  schema: JSONSchema;
  context: string[];
  type: string[];
  author: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  is_public: boolean;
  category?: string;
  tags?: string[];
}

// Credential Backup and Export
export interface CredentialExportOptions {
  format: 'json' | 'jsonld' | 'jwt' | 'csv';
  include_proofs: boolean;
  include_metadata: boolean;
  filters?: CredentialFilters;
  encryption?: {
    enabled: boolean;
    password?: string;
    algorithm?: string;
  };
}

export interface CredentialBackup {
  id: string;
  created_at: string;
  credential_count: number;
  size_bytes: number;
  encrypted: boolean;
  format: string;
  download_url?: string;
  expires_at?: string;
  filters_applied?: CredentialFilters;
}

// Credential Notifications
export interface CredentialNotification {
  id: string;
  type: 'expiration_warning' | 'revocation_alert' | 'verification_failed' | 'issuance_complete';
  credential_id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationSettings {
  expiration_warnings: {
    enabled: boolean;
    days_before: number[];
  };
  revocation_alerts: {
    enabled: boolean;
    immediate: boolean;
  };
  verification_failures: {
    enabled: boolean;
    threshold: number;
  };
  issuance_confirmations: {
    enabled: boolean;
  };
}

// Credential Sharing and Presentation
export interface CredentialShareRequest {
  credential_ids: string[];
  recipient: string;
  purpose?: string;
  expires_at?: string;
  selective_disclosure?: Record<string, string[]>;
  challenge?: string;
  domain?: string;
}

export interface CredentialShareResponse {
  share_id: string;
  presentation: VerifiablePresentation;
  share_url?: string;
  qr_code?: string;
  expires_at?: string;
}

export interface PresentationRequest {
  id: string;
  requester: string;
  purpose: string;
  requested_credentials: RequestedCredential[];
  challenge?: string;
  domain?: string;
  created_at: string;
  expires_at?: string;
  status: 'pending' | 'fulfilled' | 'rejected' | 'expired';
}

export interface RequestedCredential {
  type: string[];
  issuer?: string[];
  schema?: string;
  required_fields?: string[];
  constraints?: Record<string, unknown>;
}

// Credential Wallet Integration
export interface WalletCredential {
  id: string;
  credential: VerifiableCredential;
  metadata: CredentialMetadata;
  display_info: CredentialDisplayInfo;
  sharing_history: CredentialShare[];
  verification_history: VerificationHistory[];
}

export interface CredentialDisplayInfo {
  name: string;
  description?: string;
  icon?: string;
  background_color?: string;
  text_color?: string;
  issuer_logo?: string;
  display_fields: DisplayField[];
}

export interface DisplayField {
  label: string;
  value: string;
  type: 'text' | 'date' | 'image' | 'url' | 'email';
  order: number;
  highlighted?: boolean;
}

export interface CredentialShare {
  id: string;
  shared_with: string;
  shared_at: string;
  purpose?: string;
  fields_shared: string[];
  presentation_id?: string;
}