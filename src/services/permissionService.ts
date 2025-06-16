import { withErrorHandling } from './errorHandlingService';
import apiClient from '../lib/apiClient';

export interface PermissionCheckResponse {
  hasPermission: boolean
}

export interface BulkPermissionCheckRequest {
  permissions: Array<{
    object: string
    action: string
  }>
  tenantId?: string
}

export interface BulkPermissionCheckResponse {
  results: Array<{
    object: string
    action: string
    hasPermission: boolean
  }>
}

export interface UserPermissionsResponse {
  permissions: string[][] // Array of [object, action] pairs
}

/**
 * Get all permissions for the current user
 * @param tenantId - Optional tenant ID. If not provided, gets global permissions
 */
export const getUserPermissions = withErrorHandling(async (tenantId?: string): Promise<UserPermissionsResponse> => {
  const endpoint = tenantId
    ? `/api/v1/tenants/${tenantId}/permissions`
    : '/api/v1/tenants/global/permissions'

  const response = await apiClient.get<UserPermissionsResponse>(endpoint)
  return response.data
});

/**
 * Check if user has a specific permission
 * Note: This would require a backend endpoint for individual permission checks
 * For now, this is a placeholder that would need to be implemented on the backend
 * @param object - The object/resource to check permission for
 * @param action - The action to check permission for
 * @param tenantId - Optional tenant ID for tenant-specific permission check
 */
export const checkPermission = withErrorHandling(async (
  object: string,
  action: string,
  tenantId?: string
): Promise<PermissionCheckResponse> => {
  // This endpoint would need to be implemented on the backend
  // For now, we'll use the existing permissions endpoint and check locally
  const userPermissions = await getUserPermissions(tenantId)
  const hasPermission = userPermissions.permissions.some(
    ([permObject, permAction]) => permObject === object && permAction === action
  )

  return { hasPermission }
});

/**
 * Check multiple permissions at once
 * @param permissions - Array of permissions to check
 * @param tenantId - Optional tenant ID for tenant-specific permission checks
 */
export const bulkCheckPermissions = withErrorHandling(async (
  permissions: Array<{ object: string; action: string }>,
  tenantId?: string
): Promise<BulkPermissionCheckResponse> => {
  const userPermissions = await getUserPermissions(tenantId)
  const userPermsSet = new Set(
    userPermissions.permissions.map(([object, action]) => `${object}.${action}`)
  )

  const results = permissions.map(({ object, action }) => ({
    object,
    action,
    hasPermission: userPermsSet.has(`${object}.${action}`)
  }))

  return { results }
});

/**
 * Refresh user permissions cache
 * This is a utility function that can be used to force refresh permissions
 * @param tenantId - Optional tenant ID
 */
export const refreshUserPermissions = async (tenantId?: string): Promise<UserPermissionsResponse> => {
  // Add cache-busting parameter
  const endpoint = tenantId
    ? `/api/v1/tenants/${tenantId}/permissions`
    : '/api/v1/tenants/global/permissions'

  const response = await apiClient.get<UserPermissionsResponse>(endpoint, {
    params: {
      _t: Date.now() // Cache busting
    }
  })
  return response.data
}

/**
 * Check if user has any of the specified permissions (OR logic)
 * @param permissions - Array of permissions to check
 * @param tenantId - Optional tenant ID
 */
export const hasAnyPermission = async (
  permissions: Array<{ object: string; action: string }>,
  tenantId?: string
): Promise<boolean> => {
  const result = await bulkCheckPermissions(permissions, tenantId)
  return result.results.some(r => r.hasPermission)
}

/**
 * Check if user has all of the specified permissions (AND logic)
 * @param permissions - Array of permissions to check
 * @param tenantId - Optional tenant ID
 */
export const hasAllPermissions = async (
  permissions: Array<{ object: string; action: string }>,
  tenantId?: string
): Promise<boolean> => {
  const result = await bulkCheckPermissions(permissions, tenantId)
  return result.results.every(r => r.hasPermission)
}

/**
 * Get user permissions in a more structured format
 * @param tenantId - Optional tenant ID
 */
export const getStructuredPermissions = async (tenantId?: string) => {
  const response = await getUserPermissions(tenantId)

  // Group permissions by object
  const permissionsByObject: Record<string, string[]> = {}

  response.permissions.forEach(([object, action]) => {
    if (!permissionsByObject[object]) {
      permissionsByObject[object] = []
    }
    permissionsByObject[object].push(action)
  })

  return {
    raw: response.permissions,
    byObject: permissionsByObject,
    total: response.permissions.length
  }
}