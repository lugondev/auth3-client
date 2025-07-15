import apiClient from "@/lib/apiClient";
import { withErrorHandling } from './errorHandlingService';
import { 
	CreateGlobalTemplateRolesRequest, 
	CreateGlobalTemplateRolesResponse,
	GlobalTemplateRoleListResponse,
	UpdateGlobalTemplateRoleRequest,
	UpdateGlobalTemplateRoleResponse
} from '@/types/rbac';

const GLOBAL_TEMPLATE_ROLE_API_PREFIX = "/api/v1/admin/global-template-roles";

// --- Global Template Role Management ---

export const createGlobalTemplateRoles = withErrorHandling(async (roles?: string[]): Promise<CreateGlobalTemplateRolesResponse> => {
	const request: CreateGlobalTemplateRolesRequest = {
		template_roles: roles || ['TenantAdmin', 'TenantManager', 'TenantMember', 'TenantViewer']
	};
	
	const response = await apiClient.post<CreateGlobalTemplateRolesResponse>(
		GLOBAL_TEMPLATE_ROLE_API_PREFIX, 
		request
	);
	return response.data;
});

export const getGlobalTemplateRoles = withErrorHandling(async (): Promise<string[]> => {
	const response = await apiClient.get<GlobalTemplateRoleListResponse>(GLOBAL_TEMPLATE_ROLE_API_PREFIX);
	return response.data.roles;
});

export const updateGlobalTemplateRole = withErrorHandling(async (
	roleName: string,
	permissions?: [string, string][]
): Promise<UpdateGlobalTemplateRoleResponse> => {
	const request: UpdateGlobalTemplateRoleRequest = {
		role_name: roleName,
		permissions
	};
	
	const response = await apiClient.put<UpdateGlobalTemplateRoleResponse>(
		GLOBAL_TEMPLATE_ROLE_API_PREFIX, 
		request
	);
	return response.data;
});

export const deleteGlobalTemplateRole = withErrorHandling(async (roleName: string): Promise<void> => {
	await apiClient.delete(`${GLOBAL_TEMPLATE_ROLE_API_PREFIX}/${roleName}`);
});
