export interface CredentialRequirement {
  type: string;
  format?: string;
  schema?: string;
  issuer?: string;
  purpose?: string;
  essential?: boolean;
  constraints?: Record<string, any>;
}

export interface VerificationOptions {
  verify_signature: boolean;
  verify_expiration: boolean;
  verify_revocation: boolean;
  verify_issuer_trust: boolean;
  verify_schema: boolean;
}

export interface PresentationRequest {
  id: string;
  request_id: string;
  verifier_did: string;
  verifier_name?: string;
  title: string;
  description?: string;
  purpose?: string;
  required_credentials: CredentialRequirement[];
  challenge?: string;
  domain?: string;
  nonce?: string;
  expires_at?: string;
  valid_from?: string;
  valid_until?: string;
  status: 'active' | 'expired' | 'revoked';
  share_url?: string;
  qr_code_data?: string;
  response_count: number;
  max_responses?: number;
  verification_options: VerificationOptions;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePresentationRequestDTO {
  verifier_did: string;
  verifier_name?: string;
  title: string;
  description?: string;
  purpose?: string;
  required_credentials: CredentialRequirement[];
  challenge?: string;
  domain?: string;
  nonce?: string;
  expires_at?: string;
  valid_from?: string;
  valid_until?: string;
  max_responses?: number;
  verification_options?: VerificationOptions;
  metadata?: Record<string, any>;
}

export interface PresentationVerificationResult {
  verified: boolean;
  errors?: string[];
  warnings?: string[];
  credentialResults?: Array<{
    credentialId: string;
    verified: boolean;
    errors?: string[];
  }>;
  verificationMethod?: string;
  verifiedAt?: string;
}

export interface PresentationResponse {
  id: string;
  request_id: string;
  holder_did: string;
  presentation_id: string;
  status: 'submitted' | 'verified' | 'rejected';
  verification_result?: PresentationVerificationResult;
  submitted_at: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PresentationRequestListResponse {
  data: PresentationRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PresentationResponseListResponse {
  data: PresentationResponse[];
  total: number;
  page: number;
  pageSize: number;
}
