/**
 * Type definitions for Verifiable Credentials
 */

// Core credential types
export enum CredentialStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum PresentationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  PRESENTATION_EXPIRED = 'presentation_expired',
}

export enum VerificationStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

export interface VerifiableCredential {
  '@context': string[] | Record<string, unknown>;
  id: string;
  type: string[];
  issuer: string | Issuer;
  issuedAt: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  credentialSchema?: CredentialSchema;
  subjectDID: string;
  refreshService?: RefreshService;
  termsOfUse?: TermsOfUse[];
  evidence?: Evidence[];
  proof?: Proof;
}

export interface Issuer {
  id: string;
  name?: string;
  image?: string;
  url?: string;
}

export interface CredentialSubject {
  id?: string;
  [key: string]: unknown;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws?: string;
  proofValue?: string;
  domain?: string;
  challenge?: string;
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
  prohibition?: Prohibition[];
}

export interface Prohibition {
  type: string;
  value: string;
}

export interface Evidence {
  id?: string;
  type: string[];
  verifier: string;
  evidenceDocument?: string;
  subjectPresence?: string;
  documentPresence?: string;
  licenseNumber?: string;
}

export interface VerifiablePresentation {
  '@context': string[] | Record<string, unknown>;
  id?: string;
  type: string[];
  verifiableCredential: VerifiableCredential[];
  holder: string;
  proof?: Proof;
}

// Issued credential result type
export interface IssuedCredential {
  id: string;
  status: string;
  issuedAt: string;
  expiresAt?: string;
  recipientDid?: string;
  recipientEmail?: string;
  templateName: string;
  templateVersion: string;
  credentialTypes: string[];
  credentialSubject: Record<string, unknown>;
}

// API Input/Output types
export interface IssueCredentialInput {
  credential: Omit<VerifiableCredential, 'proof'>;
  options?: {
    format?: string;
    proofType?: string;
    proofPurpose?: string;
  };
}

export interface IssueCredentialOutput {
  credential: VerifiableCredential;
  credentialId: string;
}

export interface VerifyCredentialInput {
  credential: VerifiableCredential;
  verifySignature?: boolean;
  verifyExpiration?: boolean;
  verifyRevocation?: boolean;
  verifyIssuer?: boolean;
  challenge?: string;
  domain?: string;
}

// Nested verification results structure from backend
export interface VerificationResults {
  signatureValid: boolean;
  notExpired: boolean;
  notRevoked: boolean;
  issuerTrusted: boolean;
  schemaValid: boolean;
  proofValid: boolean;
  message?: string;
}

// Main verification response structure from backend
export interface VerifyCredentialOutput {
  valid: boolean;
  verificationResults: VerificationResults;
  errors?: string[];
  warnings?: string[];
  verifiedAt: string;
}

export interface VerificationCheck {
  check: string;
  status: VerificationStatus;
  message?: string;
}

export interface RevokeCredentialInput {
  credentialId: string;
  issuerDID: string;
  reason?: string;
}

export interface RevocationStatusResponse {
  credentialId: string;
  revoked: boolean;
  revokedAt?: string;
  reason?: string;
  checkedAt: string;
}

export interface RevokeCredentialOutput {
  credentialId: string;
  status: CredentialStatus;
  statusReason?: string;
  lastUpdated: string;
}

export interface GetCredentialInput {
  credentialId: string;
  format?: string;
}

export interface GetCredentialOutput extends VerifiableCredential {
}

export interface CredentialMetadata {
  id: string;
  issuer: string | Issuer;
  issuerDID: string;
  subjectDID: string;
  type: string[];
  issuanceDate: string;
  expirationDate?: string;
  status: CredentialStatus;
  statusReason?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ListCredentialsInput {
  page?: number;
  limit?: number;
  status?: CredentialStatus;
  type?: string;
  issuer?: string;
  subject?: string;
  search?: string;
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
  options?: {
    checks?: string[];
    domain?: string;
    challenge?: string;
    purpose?: string;
    skipRevocationCheck?: boolean;
  };
}

export interface VerifyPresentationOutput {
  verified: boolean;
  status: VerificationStatus;
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

export interface ListTemplatesInput {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: string;
  search?: string;
  status?: string;
}

export interface ValidateSchemaInput {
  schema_url: string;
  credential_data: unknown;
}

export interface ValidateSchemaOutput {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  schema_info?: {
    id: string;
    name: string;
    version: string;
  };
}

// ============ Bulk Credential Operations ============

export interface BulkCredentialRecipient {
  recipientDid?: string;
  recipientEmail?: string;
  credentialSubject: Record<string, unknown>;
  customClaims?: Record<string, unknown>;
}

export interface BulkIssueCredentialRequest {
  templateId: string;
  issuerDid: string;
  recipients: BulkCredentialRecipient[];
  template?: Record<string, unknown>;
  issuanceDate?: string;
  expirationDate?: string;
  metadata?: Record<string, unknown>;
}

export interface BulkCredentialResult {
  credentialId: string;
  recipientDid?: string;
  recipientEmail?: string;
  status: 'success' | 'failed';
  error?: string;
  issuedAt?: string;
  jwt?: string;
}

export interface BulkCredentialFailure {
  recipientDid?: string;
  recipientEmail?: string;
  error: string;
  index: number;
}

export interface BulkIssueCredentialResponse {
  batchId: string;
  totalRequested: number;
  successCount: number;
  failureCount: number;
  credentials: BulkCredentialResult[];
  failures: BulkCredentialFailure[];
  processedAt: string;
  message: string;
  status: 'processing' | 'completed' | 'partial' | 'failed';
}

export interface BulkIssueStatusRequest {
  batchId: string;
}

// CSV Upload types
export interface BulkIssueCSVUploadRequest {
  templateId: string;
  issuerDid: string;
  file: File;
}

export interface CSVRecipientData {
  recipient_did?: string;
  recipient_email?: string;
  name?: string;
  additional_field_1?: string;
  additional_field_2?: string;
  additional_field_3?: string;
  custom_claims?: string; // JSON string
}

// Bulk operation progress tracking
export interface BulkOperationProgress {
  batchId: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  errors?: BulkCredentialFailure[];
}