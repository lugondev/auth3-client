// Permission Context and Hooks
export {
  PermissionProvider,
  usePermissions,
  usePermissionCheck,
  usePermissionChecks
} from '@/contexts/PermissionContext'

// Permission Guard Components
export {
  PermissionGuard,
  RequirePermission,
  RequireRole,
  AdminOnly,
  withPermissionGuard,
  usePermissionGuard
} from './PermissionGuard'

// Permission Button Components - REMOVED
// Use @/components/guards/PermissionButton instead

// Permission Tooltip Components
export {
  PermissionTooltip
} from './PermissionTooltip'

// Conditional Rendering Components
export {
  ConditionalRender,
  ShowWithPermission,
  HideWithPermission,
  useConditionalAccess
} from './ConditionalRender'

// Permission Services
export {
  getUserPermissions,
  checkPermission,
  bulkCheckPermissions,
  refreshUserPermissions,
  hasAnyPermission,
  hasAllPermissions,
  getStructuredPermissions
} from '@/services/permissionService'

// Types
export type {
  PermissionCheckResponse,
  BulkPermissionCheckRequest,
  BulkPermissionCheckResponse,
  UserPermissionsResponse
} from '@/types/permission'