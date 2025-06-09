// Permission Guards
export {
	PermissionGuard,
	RequirePermission,
	RequireRole,
	RequireAnyPermission,
	RequireAllPermissions,
	RequireSystemAdmin,
	RequireTenantAdmin,
} from './PermissionGuard';

// Role Guards
export {
	RoleGuard,
	RequireSystemAdmin as RequireSystemAdminRole,
	RequireTenantAdmin as RequireTenantAdminRole,
	RequireAdmin,
	RequireUser,
	RequireAnyRole,
	RequireAllRoles,
} from './RoleGuard';

// Permission Buttons
export {
	PermissionButton,
PermissionActionButton,
RoleActionButton,
AdminActionButton,
TenantActionButton,
CreateButton,
EditButton,
DeleteButton,
ViewButton,
AdminButton,
SimplePermissionButton,
GlobalPermissionButton,
TenantPermissionButton,
AutoPermissionButton,
} from './PermissionButton';

// HOCs
export {
	withPermissionGuard,
	withPermission,
	withRole,
	withAllPermissions,
	withAnyPermission,
	withTenantPermission,
	withSystemAdmin,
	withPermissionHide,
	withPermissionSilent,
} from '../hoc/withPermissionGuard';

// Re-export types for convenience
export type { PermissionGuardProps } from './PermissionGuard';
export type { RoleGuardProps } from './RoleGuard';
export type { PermissionButtonProps, SimplePermissionButtonProps } from './PermissionButton';