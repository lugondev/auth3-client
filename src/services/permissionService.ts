import { withErrorHandling } from './errorHandlingService';
import apiClient from '../lib/apiClient';
import {
  PermissionCheckResponse,
  BulkPermissionCheckRequest,
  BulkPermissionCheckResponse,
  UserPermissionsResponse
} from '@/types/permission';

// Permission cache with context-aware storage
interface PermissionCache {
  global?: {
    permissions: UserPermissionsResponse;
    timestamp: number;
  };
  tenant?: {
    [tenantId: string]: {
      permissions: UserPermissionsResponse;
      timestamp: number;
    };
  };
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const permissionCache: PermissionCache = {};

// Helper function to get cache key
const getCacheKey = (tenantId?: string): 'global' | string => {
  return tenantId || 'global';
}

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
}

// Helper function to get cached permissions
const getCachedPermissions = (tenantId?: string): UserPermissionsResponse | null => {
  const cacheKey = getCacheKey(tenantId);
  
  if (cacheKey === 'global') {
    if (permissionCache.global && isCacheValid(permissionCache.global.timestamp)) {
      return permissionCache.global.permissions;
    }
  } else {
    if (permissionCache.tenant?.[cacheKey] && isCacheValid(permissionCache.tenant[cacheKey].timestamp)) {
      return permissionCache.tenant[cacheKey].permissions;
    }
  }
  
  return null;
}

// Helper function to set cached permissions
const setCachedPermissions = (permissions: UserPermissionsResponse, tenantId?: string): void => {
  const cacheKey = getCacheKey(tenantId);
  const cacheEntry = {
    permissions,
    timestamp: Date.now()
  };
  
  if (cacheKey === 'global') {
    permissionCache.global = cacheEntry;
  } else {
    if (!permissionCache.tenant) {
      permissionCache.tenant = {};
    }
    permissionCache.tenant[cacheKey] = cacheEntry;
  }
}

/**
 * Get all permissions for the current user with caching
 * @param tenantId - Optional tenant ID. If not provided, gets global permissions
 * @param forceRefresh - Force refresh cache
 */
export const getUserPermissions = withErrorHandling(async (
  tenantId?: string, 
  forceRefresh: boolean = false
): Promise<UserPermissionsResponse> => {
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCachedPermissions(tenantId);
    if (cached) {
      console.log(`📋 Using cached permissions for ${tenantId || 'global'}`);
      return cached;
    }
  }

  console.log(`🔄 Fetching permissions from API for ${tenantId || 'global'}`);
  
  const endpoint = tenantId
    ? `/api/v1/tenants/${tenantId}/permissions`
    : '/api/v1/tenants/global/permissions'

  const response = await apiClient.get<UserPermissionsResponse>(endpoint)
  
  // Cache the response
  setCachedPermissions(response.data, tenantId);
  
  return response.data
});

/**
 * Check if user has a specific permission (uses cached data)
 * @param object - The object/resource to check permission for
 * @param action - The action to check permission for
 * @param tenantId - Optional tenant ID for tenant-specific permission check
 */
export const checkPermission = withErrorHandling(async (
  object: string,
  action: string,
  tenantId?: string
): Promise<PermissionCheckResponse> => {
  // Use cached permissions - no need to fetch again
  const userPermissions = await getUserPermissions(tenantId, false);
  const hasPermission = userPermissions.permissions.some(
    ([permObject, permAction]) => permObject === object && permAction === action
  )

  return { hasPermission }
});

/**
 * Check multiple permissions at once (uses cached data)
 * @param permissions - Array of permissions to check
 * @param tenantId - Optional tenant ID for tenant-specific permission checks
 */
export const bulkCheckPermissions = withErrorHandling(async (
  permissions: Array<{ object: string; action: string }>,
  tenantId?: string
): Promise<BulkPermissionCheckResponse> => {
  // Use cached permissions - no need to fetch again
  const userPermissions = await getUserPermissions(tenantId, false);
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
 * Refresh user permissions cache (force refresh)
 * This is a utility function that can be used to force refresh permissions
 * @param tenantId - Optional tenant ID
 */
export const refreshUserPermissions = async (tenantId?: string): Promise<UserPermissionsResponse> => {
  console.log(`🔄 Force refreshing permissions for ${tenantId || 'global'}`);
  return getUserPermissions(tenantId, true); // Force refresh
}

/**
 * Clear permissions cache
 * @param tenantId - Optional tenant ID. If not provided, clears all cache
 */
export const clearPermissionsCache = (tenantId?: string): void => {
  if (tenantId) {
    // Clear specific tenant cache
    if (permissionCache.tenant?.[tenantId]) {
      delete permissionCache.tenant[tenantId];
      console.log(`🗑️ Cleared permissions cache for tenant ${tenantId}`);
    }
  } else {
    // Clear all cache
    permissionCache.global = undefined;
    permissionCache.tenant = {};
    console.log('🗑️ Cleared all permissions cache');
  }
}

/**
 * Preload permissions for better UX
 * @param tenantId - Optional tenant ID
 */
export const preloadPermissions = async (tenantId?: string): Promise<void> => {
  try {
    await getUserPermissions(tenantId, false);
    console.log(`✅ Preloaded permissions for ${tenantId || 'global'}`);
  } catch (error) {
    console.warn(`⚠️ Failed to preload permissions for ${tenantId || 'global'}:`, error);
  }
}

/**
 * Check if user has any of the specified permissions (OR logic) - uses cached data
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
 * Check if user has all of the specified permissions (AND logic) - uses cached data
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
 * Get user permissions in a more structured format - uses cached data
 * @param tenantId - Optional tenant ID
 */
export const getStructuredPermissions = async (tenantId?: string) => {
  const response = await getUserPermissions(tenantId, false); // Use cached data

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