// Query param types for verification report service

export interface VerificationHistoryQuery {
	page?: number;
	limit?: number;
	type?: string;
	resource_type?: string;
	status?: string;
	verifier_did?: string;
	subject_did?: string;
	issuer_did?: string;
	ip_address?: string;
	resource_id?: string;
	date_from?: string;
	date_to?: string;
}

export interface VerificationDailyStatsQuery {
	date_from: string;
	date_to: string;
	type?: string;
	resource_type?: string;
	status?: string;
	verifier_did?: string;
	subject_did?: string;
	issuer_did?: string;
	ip_address?: string;
	resource_id?: string;
}

export interface ExportVerificationHistoryQuery {
	format: 'json' | 'csv' | 'xlsx';
	type?: string;
	resource_type?: string;
	status?: string;
	verifier_did?: string;
	subject_did?: string;
	issuer_did?: string;
	ip_address?: string;
	resource_id?: string;
	date_from?: string;
	date_to?: string;
}

export interface VerificationHistoryByResourceQuery {
	resource_type: string;
	page?: number;
	limit?: number;
}

export interface VerificationStatisticsQuery {
	type?: string;
	resource_type?: string;
	status?: string;
	verifier_did?: string;
	subject_did?: string;
	issuer_did?: string;
	ip_address?: string;
	resource_id?: string;
	date_from?: string;
	date_to?: string;
}

export interface TopVerifiersQuery {
	limit?: number;
	from?: string;
	to?: string;
}

export interface VerificationHistoryByVerifierQuery {
	page?: number;
	limit?: number;
}
