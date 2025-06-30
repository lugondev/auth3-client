// Types for Verification Report Service

export interface VerificationResult {
	issuerTrusted: boolean;
	message: string;
	notExpired: boolean;
	notRevoked: boolean;
	proofValid: boolean;
	schemaValid: boolean;
	signatureValid: boolean;
	valid: boolean;
	verificationTime: string;
	// Allow extra fields for flexibility
	[key: string]: unknown;
}

export interface VerificationHistory {
	id: string;
	resourceId: string;
	resourceType: string;
	verifierDID: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	verifiedAt: string;
	type: string;
	subjectDID: string;
	issuerDID: string;
	duration: number;
	errorCode: string;
	errorMessage: string;
	ipAddress: string;
	userAgent: string;
	challenge: string;
	nonce: string;
	domain: string;
	metadata: Record<string, unknown> | null;
	requestData: unknown;
	result: VerificationResult | null;
}

export interface VerificationHistoryListResponse {
	data: VerificationHistory[];
	total: number;
	limit?: number;
	page?: number;
	totalPages?: number;
}

export interface VerificationHistoryResponse {
	item: VerificationHistory;
}

export interface VerificationDailyStatsResponse {
	date: string;
	count: number;
}

export interface VerificationStatisticsResponse {
	total: number;
	success: number;
	failed: number;
}

export interface TopVerifier {
	verifierDID: string;
	count: number;
}

export interface TopVerifiersResponse {
	verifiers: TopVerifier[];
}
