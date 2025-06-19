/**
 * Additional types for Verifiable Credentials service
 */

import { CredentialMetadata, CredentialTemplate } from './credentials';

// API Response wrapper type
export interface CredentialApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

// Query parameters for listing credentials
export interface CredentialListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  issuer?: string;
  subject?: string;
  search?: string;
}

// Response for listing credentials
export interface CredentialListResponse {
  credentials: CredentialMetadata[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Response for getting credentials by subject
export interface CredentialsBySubjectResponse {
  credentials: CredentialMetadata[];
  total: number;
}

// Statistics for credentials
export interface CredentialStatistics {
  totalCredentials: number;
  activeCredentials: number;
  revokedCredentials: number;
  expiredCredentials: number;
  issuedToday: number;
  issuedThisWeek: number;
  issuedThisMonth: number;
}

// Template listing output
export interface ListTemplatesOutput {
  templates: CredentialTemplate[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}