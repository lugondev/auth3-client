/**
 * Type definitions for Verifiable Presentations
 */

import { VerifiableCredential, CredentialStatus } from './credentials'

// Presentation Status
export enum PresentationStatus {
	DRAFT = 'draft',
	PENDING = 'pending',
	SUBMITTED = 'submitted',
	VERIFIED = 'verified',
	EXPIRED = 'expired',
	REJECTED = 'rejected',
	REVOKED = 'revoked',
}

// Verification Status
export enum VerificationStepStatus {
	PASSED = 'passed',
	FAILED = 'failed',
	WARNING = 'warning',
	SKIPPED = 'skipped',
}

// Core Presentation Types
export interface VerifiablePresentation {
	id: string
	'@context': string[]
	type: string[]
	holder: string
	challenge?: string
	domain?: string
	verifiableCredential: VerifiableCredential[]
	proof?: Proof
	status: PresentationStatus
	createdAt: string
	updatedAt: string
	expiresAt?: string
	metadata?: Record<string, any>
}

export interface Proof {
	type: string
	created: string
	verificationMethod: string
	proofPurpose: string
	jws?: string
	proofValue?: string
	challenge?: string
	domain?: string
}

// Presentation Creation
export interface CreatePresentationRequest {
	'@context': string[]
	challenge: string
	credentials: string[] // credential IDs (UUID strings)
	domain: string
	holderDID: string
	metadata: Record<string, any>
	type: string[]
}

export interface CreatePresentationResponse {
	presentationID: string
	presentation: VerifiablePresentation
	proof?: Proof
	createdAt: string
	expiresAt?: string
}

// Verification Types
export interface VerificationOptions {
	verifySignature: boolean
	verifyExpiration: boolean
	verifyRevocation: boolean
	verifyIssuerTrust: boolean
	verifySchema: boolean
	verifyChallenge: boolean
	verifyDomain: boolean
	strictMode: boolean
	recordVerification: boolean
}

export interface VerifyPresentationRequest {
	presentation: VerifiablePresentation
	challenge?: string
	domain?: string
	verifySignature: boolean
	verifyExpiration: boolean
	verifyRevocation: boolean
	verifyIssuerTrust: boolean
	verifySchema: boolean
}

export interface VerifyPresentationResponse {
	valid: boolean
	verificationResults: PresentationVerificationResults
	credentialResults?: CredentialVerificationResult[]
	errors?: string[]
	warnings?: string[]
	verifiedAt: string
	verificationRecordID?: string
}

export interface PresentationVerificationResults {
	signatureValid: boolean
	proofValid: boolean
	challengeValid: boolean
	domainValid: boolean
	holderVerified: boolean
	credentialsValid: boolean
	message?: string
}

export interface CredentialVerificationResult {
	credentialID: string
	valid: boolean
	results: VerificationResults
	errors?: string[]
	warnings?: string[]
}

export interface VerificationResults {
	signatureValid: boolean
	notExpired: boolean
	notRevoked: boolean
	issuerTrusted: boolean
	schemaValid: boolean
	proofValid: boolean
	message?: string
}

// Enhanced Verification
export interface EnhancedVerificationRequest {
	presentation: VerifiablePresentation
	challenge?: string
	domain?: string
	verifierDID?: string
	verificationOptions?: VerificationOptions
	trustFramework?: string
	policyID?: string
	metadata?: Record<string, any>
}

export interface EnhancedVerificationResponse {
	valid: boolean
	trustScore: number
	presentationResults: PresentationVerificationResults
	credentialResults?: CredentialVerificationResult[]
	policyResults?: PolicyVerificationResults
	errors?: string[]
	warnings?: string[]
	verifiedAt: string
	verificationRecordID?: string
	metadata?: Record<string, any>
}

export interface PolicyVerificationResults {
	policyID: string
	policyValid: boolean
	requiredFields?: string[]
	missingFields?: string[]
	policyMetadata?: Record<string, any>
}

// Verification Records
export interface VerificationRecord {
	id: string
	presentationID: string
	verifierDID?: string
	valid: boolean
	results: any // JSON data
	errors?: string[]
	warnings?: string[]
	verifiedAt: string
	challenge?: string
	domain?: string
	trustScore: number
	metadata?: Record<string, any>
}

// Verification History Response
export interface VerificationHistoryResponse {
	records: VerificationRecord[]
	pagination: PaginationResponse
	total: number
}

// Statistics and Lists
export interface PresentationStatistics {
	totalPresentations: number
	validPresentations: number
	invalidPresentations: number
	pendingPresentations: number
	createdToday: number
	createdThisWeek: number
	createdThisMonth: number
	verifiedToday: number
	verifiedThisWeek: number
	verifiedThisMonth: number
	generatedAt: string
}

export interface PaginationResponse {
	currentPage: number
	pageSize: number
	totalItems: number
	totalPages: number
	hasPrevious: boolean
	hasNext: boolean
}

export interface PresentationListResponse {
	presentations: VerifiablePresentation[]
	pagination: PaginationResponse
	total: number
}

export interface PresentationDetailResponse {
	presentation: VerifiablePresentation
	metadata: PresentationMetadata
	verificationHistory: VerificationRecord[]
}

export interface VerificationRecordListResponse {
	records: VerificationRecord[]
	pagination: PaginationResponse
	total: number
}

// Metadata
export interface PresentationMetadata {
	holderProfile?: HolderProfile
	verifierProfile?: VerifierProfile
	verificationCount: number
	lastVerified?: string
	trustScore: number
	credentialCount: number
	validCredentialCount: number
}

export interface HolderProfile {
	did: string
	name?: string
	email?: string
	verified: boolean
}

export interface VerifierProfile {
	did?: string
	name?: string
	description?: string
	website?: string
	logo?: string
	trusted: boolean
}

// Filter Options
export interface PresentationFilterOptions {
	holderDID?: string
	verifierDID?: string
	status?: PresentationStatus
	purpose?: string
	search?: string
	createdAfter?: string
	createdBefore?: string
	verifiedAfter?: string
	verifiedBefore?: string
	hasCredentials?: string[]
	trustScoreMin?: number
	trustScoreMax?: number
	page?: number
	limit?: number
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

// Service filter options with additional parameters
export interface PresentationFilters extends Omit<PresentationFilterOptions, 'page'> {
	offset?: number
}

// UI State Types
export interface PresentationUIState {
	loading: boolean
	error?: string
	selectedPresentation?: VerifiablePresentation
	showCreateModal: boolean
	showVerifyModal: boolean
	verificationInProgress: boolean
	filters: PresentationFilterOptions
}

// Component Props Types
export interface PresentationCardProps {
	presentation: VerifiablePresentation
	onView?: () => void
	onVerify?: () => void
	onShare?: () => void
	onDelete?: () => void
	showActions?: boolean
	className?: string
}

export interface VerificationResultsProps {
	results: VerifyPresentationResponse | EnhancedVerificationResponse
	presentation: VerifiablePresentation
	onClose?: () => void
	className?: string
}
