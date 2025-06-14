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