// Types for Credential Template Management
// Based on backend DTOs from internal/application/dto/vc_dto.go

// JSON Schema value types
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export interface CredentialTemplate {
	id: string;
	name: string;
	description: string;
	type: string[];
	"@context": string[];
	schema: Record<string, JSONValue>;
	userID: string;
	issuerDID?: string;
	active: boolean;
	version: string;
	tags: string[];
	metadata: Record<string, JSONValue>;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}

export interface CreateTemplateRequest {
	name: string;
	description: string;
	type: string[];
	"@context"?: string[];
	schema: Record<string, JSONValue>;
	userID: string;
	issuerDID?: string;
	version: string;
	tags?: string[];
	metadata?: Record<string, JSONValue>;
}

export interface UpdateTemplateRequest {
	name?: string;
	description?: string;
	type?: string[];
	"@context"?: string[];
	schema?: Record<string, JSONValue>;
	active?: boolean;
	version?: string;
	tags?: string[];
	metadata?: Record<string, JSONValue>;
}

export interface ListTemplatesResponse {
	templates: CredentialTemplate[];
	total: number;
	page: number;
	limit: number;
}

export interface ValidationResponse {
	valid: boolean;
	message: string;
	errors?: string[];
}

export interface TemplateUsageStats {
	templateId: string;
	totalCredentials: number;
	activeCredentials: number;
	revokedCredentials: number;
	lastUsed?: string;
	usageThisMonth: number;
	usageThisWeek: number;
	usageToday: number;
}

export interface ValidateSchemaRequest {
	schema: Record<string, JSONValue>;
}

export interface ValidateSchemaResponse {
	valid: boolean;
	errors?: string[];
	warnings?: string[];
}

export interface ValidateCredentialDataRequest {
	templateID: string;
	data: Record<string, JSONValue>;
}

export interface TemplateExportResponse {
	template: CredentialTemplate;
	format: string;
	metadata?: Record<string, JSONValue>;
}

export interface TemplateImportRequest {
	template: CredentialTemplate;
	format?: string;
	overwriteID?: boolean;
	metadata?: Record<string, JSONValue>;
}

export interface TemplateVersionsResponse {
	versions: CredentialTemplate[];
	latest?: CredentialTemplate;
	total: number;
}

export interface TemplateFilters {
	page?: number;
	limit?: number;
	search?: string;
	type?: string;
	userID?: string;
	issuerDID?: string;
	active?: boolean;
	tags?: string[];
	category?: string;
	version?: string;
}

// JSON Schema Types for template schema building
export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

export interface JSONSchemaProperty {
	type: JSONSchemaType | JSONSchemaType[];
	title?: string;
	description?: string;
	enum?: JSONValue[];
	default?: JSONValue;
	minimum?: number;
	maximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: string;
	items?: JSONSchemaProperty;
	properties?: Record<string, JSONSchemaProperty>;
	required?: string[];
	additionalProperties?: boolean;
}

export interface JSONSchema {
	type: JSONSchemaType;
	title?: string;
	description?: string;
	properties: Record<string, JSONSchemaProperty>;
	required?: string[];
	additionalProperties?: boolean;
	$schema?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
	data: T;
	message?: string;
	success: boolean;
}

// Form validation types
export interface TemplateFormErrors {
	name?: string;
	description?: string;
	type?: string;
	schema?: string;
	issuerDID?: string;
	version?: string;
	tags?: string;
}

// Template management state
export interface TemplateManagementState {
	templates: CredentialTemplate[];
	selectedTemplate?: CredentialTemplate;
	loading: boolean;
	error?: string;
	filters: TemplateFilters;
	totalCount: number;
}
