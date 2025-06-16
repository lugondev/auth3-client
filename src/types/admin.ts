import { UserOutput, UserStatus } from './user';
import { PaginationMeta } from './common';

// Admin User Management Types
export interface UserListResponse {
	users: UserOutput[];
	meta: PaginationMeta;
}

export interface UserStatusUpdateRequest {
	status: UserStatus;
	reason?: string;
}

// System Statistics Types
export interface SystemStatsResponse {
	total_users: number;
	active_users: number;
	total_tenants: number;
	active_tenants: number;
	total_credentials: number;
	total_dids: number;
	system_uptime: string;
	last_backup: string;
}

// Audit Log Types
export interface AdminAuditLogResponse {
	logs: AuditLogEntry[];
	meta: PaginationMeta;
}

export interface AuditLogEntry {
	id: string;
	user_id?: string;
	tenant_id?: string;
	action: string;
	resource_type: string;
	resource_id: string;
	description: string;
	ip_address: string;
	user_agent: string;
	created_at: string;
	user?: {
		id: string;
		email: string;
		first_name?: string;
		last_name?: string;
	};
	tenant?: {
		id: string;
		name: string;
	};
}

// System Configuration Types
export interface SystemConfigResponse {
	config: SystemConfig;
}

export interface SystemConfig {
	max_users_per_tenant: number;
	max_credentials_per_user: number;
	max_dids_per_user: number;
	session_timeout: number;
	password_policy: PasswordPolicy;
	feature_flags: FeatureFlags;
}

export interface PasswordPolicy {
	min_length: number;
	require_uppercase: boolean;
	require_lowercase: boolean;
	require_numbers: boolean;
	require_special_chars: boolean;
	max_age_days: number;
}

export interface FeatureFlags {
	enable_registration: boolean;
	enable_oauth2: boolean;
	enable_did_creation: boolean;
	enable_credential_issuance: boolean;
	enable_audit_logs: boolean;
}

export interface SystemConfigUpdateRequest {
	config: Partial<SystemConfig>;
}

// Bulk Operations Types
export interface BulkUserActionRequest {
	user_ids: string[];
	action: 'activate' | 'suspend' | 'delete';
	reason?: string;
}

export interface BulkUserActionResponse {
	success_count: number;
	failed_count: number;
	failed_users: {
		user_id: string;
		error: string;
	}[];
}

// System Health Types
export interface SystemHealthResponse {
	status: 'healthy' | 'warning' | 'critical';
	services: Record<string, ServiceHealthStatus>;
	uptime: number;
	memory_usage: number;
	cpu_usage: number;
}

export interface ServiceHealthStatus {
	status: string;
	response_time?: number;
	error?: string;
}