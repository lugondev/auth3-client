/**
 * Types for Permission Service
 */

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