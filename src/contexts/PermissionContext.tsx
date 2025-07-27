'use client'

import React, {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react'
import {useAuth} from './AuthContext'
import apiClient from '@/lib/apiClient'
import {PermissionContextType} from '@/types/auth'
import {Permission, ContextMode} from '@/types/dual-context'
import {contextManager} from '@/lib/context-manager'
import {tokenManager} from '@/lib/token-storage'

interface PermissionCache {
	permissions: Permission[]
	roles: string[]
	timestamp: number
	tenantId: string | null
	contextMode: ContextMode
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY_PREFIX = 'permission_cache'

export function PermissionProvider({children}: {children: React.ReactNode}) {
	const {user, currentTenantId, isAuthenticated, currentMode, globalContext, tenantContext} = useAuth()

	// Current active permissions and roles
	const [permissions, setPermissions] = useState<Permission[]>([])
	const [roles, setRoles] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Context-specific permission states
	const [globalPermissions, setGlobalPermissions] = useState<Permission[]>([])
	const [globalRoles, setGlobalRoles] = useState<string[]>([])
	const [tenantPermissions, setTenantPermissions] = useState<Permission[]>([])
	const [tenantRoles, setTenantRoles] = useState<string[]>([])

	const cacheRef = useRef<Map<string, PermissionCache>>(new Map())
	const fetchingRef = useRef<Set<string>>(new Set())
	const tenantPermissionsCache = useRef<Map<string, {permissions: Permission[]; roles: string[]; timestamp: number}>>(new Map())
	const currentTenantPermissionsFetched = useRef<string | null>(null)
	const currentModeRef = useRef(currentMode)
	const currentTenantIdRef = useRef(currentTenantId)

	// Update refs when values change
	useEffect(() => {
		currentModeRef.current = currentMode
	}, [currentMode])

	useEffect(() => {
		currentTenantIdRef.current = currentTenantId
	}, [currentTenantId])

	// Generate cache key for specific context
	const getCacheKey = useCallback((context: ContextMode, tenantId?: string | null): string => {
		if (context === 'tenant' && tenantId) {
			return `${CACHE_KEY_PREFIX}_tenant_${tenantId}`
		}
		return `${CACHE_KEY_PREFIX}_global`
	}, [])

	// Load cache from localStorage for specific context
	const loadCache = useCallback(
		(context: ContextMode, tenantId?: string | null): PermissionCache | null => {
			try {
				const cacheKey = getCacheKey(context, tenantId)
				const cached = localStorage.getItem(cacheKey)
				if (!cached) return null

				const cache: PermissionCache = JSON.parse(cached)
				const now = Date.now()

				// Check if cache is expired or for different context
				if (now - cache.timestamp > CACHE_TTL || cache.contextMode !== context || cache.tenantId !== tenantId) {
					localStorage.removeItem(cacheKey)
					return null
				}

				return cache
			} catch (error) {
				console.error('Failed to load permission cache:', error)
				const cacheKey = getCacheKey(context, tenantId)
				localStorage.removeItem(cacheKey)
				return null
			}
		},
		[getCacheKey],
	)

	// Save cache to localStorage for specific context
	const saveCache = useCallback(
		(context: ContextMode, permissions: Permission[], roles: string[], tenantId?: string | null) => {
			try {
				const cacheKey = getCacheKey(context, tenantId)
				const cache: PermissionCache = {
					permissions,
					roles,
					timestamp: Date.now(),
					tenantId: tenantId || null,
					contextMode: context,
				}
				localStorage.setItem(cacheKey, JSON.stringify(cache))
				cacheRef.current.set(cacheKey, cache)
			} catch (error) {
				console.error('Failed to save permission cache:', error)
			}
		},
		[getCacheKey],
	)

	// Clear cache for specific context
	const clearCache = useCallback(
		(context?: ContextMode, tenantId?: string | null) => {
			if (context) {
				const cacheKey = getCacheKey(context, tenantId)
				localStorage.removeItem(cacheKey)
				cacheRef.current.delete(cacheKey)

				// Also clear in-memory tenant cache if clearing tenant context
				if (context === 'tenant' && tenantId) {
					tenantPermissionsCache.current.delete(tenantId)
					if (currentTenantPermissionsFetched.current === tenantId) {
						currentTenantPermissionsFetched.current = null
					}
				}
			} else {
				// Clear all caches
				cacheRef.current.forEach((_, key) => {
					localStorage.removeItem(key)
				})
				cacheRef.current.clear()
				tenantPermissionsCache.current.clear()
				currentTenantPermissionsFetched.current = null
			}
		},
		[getCacheKey],
	)

	// Fetch permissions from API for specific context
	const fetchPermissions = useCallback(async (context: ContextMode, tenantId?: string | null): Promise<{permissions: Permission[]; roles: string[]}> => {
		const contextState = contextManager.getContextState(context)
		const contextUser = contextState?.user

		if (!contextUser?.id || !contextState?.isAuthenticated) {
			return {permissions: [], roles: []}
		}

		try {
			// Get tokens for the specific context
			const tokens = tokenManager.getTokens(context)
			if (!tokens.accessToken) {
				throw new Error('No access token available for context')
			}

			// Temporarily set auth header for this request
			const originalAuth = apiClient.defaults.headers.Authorization
			apiClient.defaults.headers.Authorization = `Bearer ${tokens.accessToken}`

			// Determine the endpoint based on context
			const endpoint = context === 'tenant' && tenantId ? `/api/v1/tenants/${tenantId}/permissions` : '/api/v1/tenants/global/permissions'

			const response = await apiClient.get<{permissions?: string[][]}>(endpoint)
			const permissionData = response.data.permissions || []

			// Convert permission arrays to objects
			const permissions: Permission[] = permissionData.map((perm: string[]) => ({
				object: perm[0],
				action: perm[1],
			}))

			// Get roles from user data
			const roles = contextUser.roles || []

			// Restore original auth header
			if (originalAuth) {
				apiClient.defaults.headers.Authorization = originalAuth
			} else {
				delete apiClient.defaults.headers.Authorization
			}

			return {permissions, roles}
		} catch (error) {
			console.error('Failed to fetch permissions:', error)
			// Restore original auth header on error
			const originalAuth = apiClient.defaults.headers.Authorization
			if (originalAuth) {
				apiClient.defaults.headers.Authorization = originalAuth
			} else {
				delete apiClient.defaults.headers.Authorization
			}
			throw error
		}
	}, [])

	// Refresh permissions for specific context
	const refreshPermissions = useCallback(
		async (context?: ContextMode, tenantId?: string | null) => {
			const targetContext = context || currentModeRef.current
			const targetTenantId = tenantId || (targetContext === 'tenant' ? currentTenantIdRef.current : null)
			const fetchKey = `${targetContext}_${targetTenantId || 'global'}`

			if (fetchingRef.current.has(fetchKey)) return

			// For tenant context, check if we already have cached data for this tenant
			if (targetContext === 'tenant' && targetTenantId) {
				const cached = tenantPermissionsCache.current.get(targetTenantId)
				if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
					// Use cached data if still valid
					setTenantPermissions(cached.permissions)
					setTenantRoles(cached.roles)
					return
				}
			}

			setLoading(true)
			setError(null)
			fetchingRef.current.add(fetchKey)

			try {
				const {permissions: newPermissions, roles: newRoles} = await fetchPermissions(targetContext, targetTenantId)

				// Update context-specific state
				if (targetContext === 'global') {
					setGlobalPermissions(newPermissions)
					setGlobalRoles(newRoles)
				} else if (targetContext === 'tenant' && targetTenantId) {
					setTenantPermissions(newPermissions)
					setTenantRoles(newRoles)

					// Cache tenant permissions for reuse
					tenantPermissionsCache.current.set(targetTenantId, {
						permissions: newPermissions,
						roles: newRoles,
						timestamp: Date.now(),
					})

					// Track current tenant as fetched
					currentTenantPermissionsFetched.current = targetTenantId
				}

				saveCache(targetContext, newPermissions, newRoles, targetTenantId)
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to fetch permissions'
				setError(errorMessage)
				console.error('Permission refresh failed:', error)
			} finally {
				setLoading(false)
				fetchingRef.current.delete(fetchKey)
			}
		},
		[fetchPermissions, saveCache],
	)

	// Switch permissions to match current context
	const switchPermissionContext = useCallback(
		(newMode: ContextMode) => {
			if (newMode === 'global') {
				setPermissions(globalPermissions)
				setRoles(globalRoles)
			} else if (newMode === 'tenant') {
				setPermissions(tenantPermissions)
				setRoles(tenantRoles)
			} else if (newMode === 'auto') {
				// Auto mode: use tenant permissions if in tenant context, otherwise global
				if (currentTenantId) {
					setPermissions(tenantPermissions)
					setRoles(tenantRoles)
				} else {
					setPermissions(globalPermissions)
					setRoles(globalRoles)
				}
			}
		},
		[globalPermissions, globalRoles, tenantPermissions, tenantRoles, currentTenantId],
	)

	// Get permissions for specific context
	const getPermissionsForContext = useCallback(
		(context?: ContextMode): string[] => {
			const targetContext = context || currentModeRef.current

			if (targetContext === 'global') {
				return globalPermissions.map((p) => `${p.object}.${p.action}`)
			} else if (targetContext === 'tenant') {
				return tenantPermissions.map((p) => `${p.object}.${p.action}`)
			} else if (targetContext === 'auto') {
				// Auto mode: use tenant permissions if in tenant context, otherwise global
				if (currentTenantIdRef.current) {
					return tenantPermissions.map((p) => `${p.object}.${p.action}`)
				} else {
					return globalPermissions.map((p) => `${p.object}.${p.action}`)
				}
			}

			return permissions.map((p) => `${p.object}.${p.action}`)
		},
		[globalPermissions, tenantPermissions, permissions],
	)

	// Check if user is system admin
	const isSystemAdmin = useCallback(
		(context?: ContextMode): boolean => {
			const targetContext = context || currentModeRef.current
			const contextState = contextManager.getContextState(targetContext)

			if (!contextState?.isAuthenticated) return false

			// Check roles directly from context-specific state
			let targetRoles: string[]
			if (context === 'global') {
				targetRoles = globalRoles
			} else if (context === 'tenant') {
				targetRoles = tenantRoles
			} else {
				targetRoles = roles
			}

			return targetRoles.includes('SystemSuperAdmin') || targetRoles.includes('SystemAdmin')
		},
		[roles, globalRoles, tenantRoles],
	)

	// Check if user has a specific permission (string format: "object.action")
	const hasPermission = useCallback(
		(permission: string, context?: ContextMode): boolean => {
			if (!permission) return false

			// Check if user is authenticated
			if (!isAuthenticated || !user) {
				return false
			}

			// Check if user is system admin (bypass all permission checks)
			if (isSystemAdmin(context)) {
				return true
			}

			// Get permissions based on context
			const permsToCheck = getPermissionsForContext(context)

			// Special case for system admin with wildcard permissions
			if (permsToCheck.some((p) => p === '*.*' || p === '*:*' || p === '.*:.*')) {
				return true
			}

			// Parse permission format (object:action or object.action)
			const [object, action] = permission.includes(':') ? permission.split(':') : permission.split('.')

			if (!object || !action) {
				return false
			}

			// Check exact match first
			if (permsToCheck.includes(permission)) {
				return true
			}

			// Check wildcard patterns
			if (permsToCheck.includes('*.*')) {
				return true
			}

			if (permsToCheck.includes('*.*')) {
				return true
			}

			if (permsToCheck.includes(`*.${action}`)) {
				return true
			}

			if (permsToCheck.includes(`${object}.*`)) {
				return true
			}

			if (permsToCheck.includes(`${object}.*`)) {
				return true
			}

			// Check regex patterns
			if (permsToCheck.includes('.*.*')) {
				return true
			}

			if (permsToCheck.includes(`.*${action}`)) {
				return true
			}

			if (permsToCheck.includes(`${object}.*`)) {
				return true
			}

			return false
		},
		[isAuthenticated, user, getPermissionsForContext, isSystemAdmin],
	)

	// Check if user has a specific role
	const hasRole = useCallback(
		(role: string, context?: ContextMode): boolean => {
			const targetContext = context || currentModeRef.current
			const contextState = contextManager.getContextState(targetContext)

			if (!role || !contextState?.isAuthenticated) return false

			// Get roles for the target context
			let targetRoles: string[]
			if (context) {
				// Use context-specific roles
				targetRoles = context === 'global' ? globalRoles : tenantRoles
			} else {
				// Use current active roles
				targetRoles = roles
			}

			return targetRoles.includes(role)
		},
		[roles, globalRoles, tenantRoles],
	)

	// Check if user has any of the specified permissions
	const hasAnyPermission = useCallback(
		(permissionList: string[], context?: ContextMode): boolean => {
			if (!permissionList || permissionList.length === 0) return false
			return permissionList.some((permission) => hasPermission(permission, context))
		},
		[hasPermission],
	)

	// Check if user has all of the specified permissions
	const hasAllPermissions = useCallback(
		(permissionList: string[], context?: ContextMode): boolean => {
			if (!permissionList || permissionList.length === 0) return false
			return permissionList.every((permission) => hasPermission(permission, context))
		},
		[hasPermission],
	)

	// Check if user has any of the specified roles
	const hasAnyRole = useCallback(
		(roleList: string[], context?: ContextMode): boolean => {
			if (!roleList || roleList.length === 0) return false
			return roleList.some((role) => hasRole(role, context))
		},
		[hasRole],
	)

	// Check if user has all of the specified roles
	const hasAllRoles = useCallback(
		(roleList: string[], context?: ContextMode): boolean => {
			if (!roleList || roleList.length === 0) return false
			return roleList.every((role) => hasRole(role, context))
		},
		[hasRole],
	)

	// Check if user is tenant admin
	const isTenantAdmin = useCallback(
		(context?: ContextMode): boolean => {
			const targetContext = context || currentModeRef.current
			const contextState = contextManager.getContextState(targetContext)

			if (!contextState?.isAuthenticated) return false

			// For tenant admin check, prefer tenant context if available
			const checkContext = targetContext === 'auto' && currentTenantIdRef.current ? 'tenant' : targetContext
			return hasRole('TenantAdmin', checkContext) || hasRole('Admin', checkContext)
		},
		[hasRole],
	)

	// Get user permissions (for debugging/display)
	const getUserPermissions = useCallback(
		(context?: ContextMode): Permission[] => {
			if (context === 'global') return [...globalPermissions]
			if (context === 'tenant') return [...tenantPermissions]
			return [...permissions]
		},
		[permissions, globalPermissions, tenantPermissions],
	)

	// Get user roles (for debugging/display)
	const getUserRoles = useCallback(
		(context?: ContextMode): string[] => {
			if (context === 'global') return [...globalRoles]
			if (context === 'tenant') return [...tenantRoles]
			return [...roles]
		},
		[roles, globalRoles, tenantRoles],
	)

	// Dynamic permission check via API
	const checkPermission = useCallback(
		async (object: string, action: string, context?: ContextMode): Promise<boolean> => {
			const targetContext = context || currentModeRef.current
			const contextState = contextManager.getContextState(targetContext)

			if (!object || !action || !contextState?.isAuthenticated || !contextState.user?.id) {
				return false
			}

			try {
				// First check local cache
				const hasLocal = hasPermission(`${object}.${action}`, context)
				if (hasLocal) return true

				// Get tokens for the specific context
				const tokens = tokenManager.getTokens(targetContext)
				if (!tokens.accessToken) {
					return false
				}

				// Temporarily set auth header for this request
				const originalAuth = apiClient.defaults.headers.Authorization
				apiClient.defaults.headers.Authorization = `Bearer ${tokens.accessToken}`

				// If not in cache, make API call to backend check endpoint
				const tenantId = targetContext === 'tenant' ? contextState.tenantId || currentTenantIdRef.current : null
				const endpoint = tenantId ? `/api/v1/tenants/${tenantId}/rbac/check` : '/api/v1/rbac/check'

				const response = await apiClient.get<{hasPermission?: boolean}>(endpoint, {
					params: {object, action},
				})

				// Restore original auth header
				if (originalAuth) {
					apiClient.defaults.headers.Authorization = originalAuth
				} else {
					delete apiClient.defaults.headers.Authorization
				}

				return response.data?.hasPermission || false
			} catch (error) {
				console.error('Permission check failed:', error)
				// Restore original auth header on error
				const originalAuth = apiClient.defaults.headers.Authorization
				if (originalAuth) {
					apiClient.defaults.headers.Authorization = originalAuth
				} else {
					delete apiClient.defaults.headers.Authorization
				}
				return false
			}
		},
		[hasPermission],
	)

	// Bulk permission check via API
	const checkPermissions = useCallback(
		async (permissionList: string[], context?: ContextMode): Promise<Record<string, boolean>> => {
			const targetContext = context || currentModeRef.current
			const contextState = contextManager.getContextState(targetContext)

			if (!permissionList || permissionList.length === 0 || !contextState?.isAuthenticated || !contextState.user?.id) {
				return {}
			}

			const results: Record<string, boolean> = {}

			try {
				// First check local cache for all permissions
				const uncachedPermissions: string[] = []

				permissionList.forEach((permission) => {
					const hasLocal = hasPermission(permission, context)
					if (hasLocal) {
						results[permission] = true
					} else {
						uncachedPermissions.push(permission)
					}
				})

				// If all permissions are cached, return results
				if (uncachedPermissions.length === 0) {
					return results
				}

				// Get tokens for the specific context
				const tokens = tokenManager.getTokens(targetContext)
				if (!tokens.accessToken) {
					// Return false for all uncached permissions if no token
					uncachedPermissions.forEach((permission) => {
						results[permission] = false
					})
					return results
				}

				// Temporarily set auth header for this request
				const originalAuth = apiClient.defaults.headers.Authorization
				apiClient.defaults.headers.Authorization = `Bearer ${tokens.accessToken}`

				// Make API call for uncached permissions
				const tenantId = targetContext === 'tenant' ? contextState.tenantId || currentTenantIdRef.current : null
				const endpoint = tenantId ? `/api/v1/tenants/${tenantId}/rbac/check-bulk` : '/api/v1/rbac/check-bulk'

				const response = await apiClient.post<{results?: Record<string, boolean>}>(endpoint, {
					permissions: uncachedPermissions,
				})

				const apiResults = response.data?.results || {}

				// Merge API results with cached results
				uncachedPermissions.forEach((permission) => {
					results[permission] = apiResults[permission] || false
				})

				// Restore original auth header
				if (originalAuth) {
					apiClient.defaults.headers.Authorization = originalAuth
				} else {
					delete apiClient.defaults.headers.Authorization
				}

				return results
			} catch (error) {
				console.error('Bulk permission check failed:', error)
				// Restore original auth header on error
				const originalAuth = apiClient.defaults.headers.Authorization
				if (originalAuth) {
					apiClient.defaults.headers.Authorization = originalAuth
				} else {
					delete apiClient.defaults.headers.Authorization
				}
				// Return false for all uncached permissions on error
				permissionList.forEach((permission) => {
					if (!(permission in results)) {
						results[permission] = false
					}
				})
				return results
			}
		},
		[hasPermission],
	)

	// Load permissions on mount and when dependencies change
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			setPermissions([])
			setRoles([])
			setGlobalPermissions([])
			setGlobalRoles([])
			setTenantPermissions([])
			setTenantRoles([])
			setError(null)
			// Clear tenant cache when user logs out
			tenantPermissionsCache.current.clear()
			currentTenantPermissionsFetched.current = null
			return
		}

		// Load permissions for both contexts
		const loadContextPermissions = async () => {
			// Load global context permissions
			if (globalContext.isAuthenticated) {
				const globalCache = loadCache('global')
				if (globalCache) {
					setGlobalPermissions(globalCache.permissions)
					setGlobalRoles(globalCache.roles)
				} else {
					await refreshPermissions('global')
				}
			}

			// Load tenant context permissions - only if not already fetched for this tenant
			if (tenantContext.isAuthenticated && tenantContext.tenantId) {
				// Check if we already have this tenant's permissions cached
				const cached = tenantPermissionsCache.current.get(tenantContext.tenantId)
				if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
					// Use in-memory cache
					setTenantPermissions(cached.permissions)
					setTenantRoles(cached.roles)
					currentTenantPermissionsFetched.current = tenantContext.tenantId
				} else {
					// Check localStorage cache first
					const tenantCache = loadCache('tenant', tenantContext.tenantId)
					if (tenantCache) {
						setTenantPermissions(tenantCache.permissions)
						setTenantRoles(tenantCache.roles)
						// Also update in-memory cache
						tenantPermissionsCache.current.set(tenantContext.tenantId, {
							permissions: tenantCache.permissions,
							roles: tenantCache.roles,
							timestamp: tenantCache.timestamp,
						})
						currentTenantPermissionsFetched.current = tenantContext.tenantId
					} else if (currentTenantPermissionsFetched.current !== tenantContext.tenantId) {
						// Only fetch if we haven't fetched for this tenant yet
						await refreshPermissions('tenant', tenantContext.tenantId)
					}
				}
			}
		}

		loadContextPermissions()
	}, [isAuthenticated, user?.id, globalContext.isAuthenticated, tenantContext.isAuthenticated, tenantContext.tenantId, loadCache, refreshPermissions])

	// Switch permissions when context mode changes or permissions load
	useEffect(() => {
		if (currentMode === 'global') {
			setPermissions(globalPermissions)
			setRoles(globalRoles)
		} else if (currentMode === 'tenant') {
			setPermissions(tenantPermissions)
			setRoles(tenantRoles)
		} else if (currentMode === 'auto') {
			// Auto mode: use tenant permissions if in tenant context, otherwise global
			if (currentTenantId) {
				setPermissions(tenantPermissions)
				setRoles(tenantRoles)
			} else {
				setPermissions(globalPermissions)
				setRoles(globalRoles)
			}
		}
	}, [currentMode, globalPermissions, globalRoles, tenantPermissions, tenantRoles, currentTenantId])

	// Refresh permissions when tenant changes (only if not already cached)
	useEffect(() => {
		if (isAuthenticated && user?.id && currentTenantId) {
			// Check if we already have permissions for this tenant
			const inMemoryCache = tenantPermissionsCache.current.get(currentTenantId)
			if (inMemoryCache && Date.now() - inMemoryCache.timestamp < CACHE_TTL) {
				// Use in-memory cache
				setTenantPermissions(inMemoryCache.permissions)
				setTenantRoles(inMemoryCache.roles)
				currentTenantPermissionsFetched.current = currentTenantId
			} else {
				// Check localStorage cache
				const tenantCache = loadCache('tenant', currentTenantId)
				if (tenantCache) {
					// Update in-memory cache
					tenantPermissionsCache.current.set(currentTenantId, {
						permissions: tenantCache.permissions,
						roles: tenantCache.roles,
						timestamp: tenantCache.timestamp,
					})
					setTenantPermissions(tenantCache.permissions)
					setTenantRoles(tenantCache.roles)
					currentTenantPermissionsFetched.current = currentTenantId
				} else if (currentTenantPermissionsFetched.current !== currentTenantId) {
					// Only fetch if we haven't fetched for this tenant yet
					refreshPermissions('tenant', currentTenantId)
				}
			}
		}
	}, [currentTenantId, isAuthenticated, user?.id, loadCache, refreshPermissions])

	const value: PermissionContextType = {
		// Current active state
		permissions,
		roles,
		loading,
		error,

		// Context-specific state
		globalPermissions,
		globalRoles,
		tenantPermissions,
		tenantRoles,
		currentMode,

		// Permission checking methods
		hasPermission,
		hasRole,
		hasAnyPermission,
		hasAllPermissions,
		hasAnyRole,
		hasAllRoles,
		checkPermission,
		checkPermissions,

		// Utility methods
		refreshPermissions,
		clearCache,
		isSystemAdmin,
		isTenantAdmin,
		getUserPermissions,
		getUserRoles,

		// Context management
		switchPermissionContext,

		// Smart permission resolution
		resolvePermission: (permission: string) => {
			// Default implementation - check current context first, fallback to global
			const mode = currentModeRef.current
			if (hasPermission(permission, mode)) {
				return true
			}
			return mode === 'tenant' ? hasPermission(permission, 'global') : false
		},

		resolveRole: (role: string) => {
			// Default implementation - check current context first, fallback to global
			const mode = currentModeRef.current
			if (hasRole(role, mode)) {
				return true
			}
			return mode === 'tenant' ? hasRole(role, 'global') : false
		},

		// Context synchronization
		syncPermissions: async () => {
			await refreshPermissions(currentModeRef.current)
		},

		invalidateContext: (context: ContextMode) => {
			clearCache(context)
		},
	}

	return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions() {
	const context = useContext(PermissionContext)
	if (context === undefined) {
		throw new Error('usePermissions must be used within a PermissionProvider')
	}
	return context
}

// Convenience hook for checking a single permission
export function usePermissionCheck(permission: string, context?: ContextMode) {
	const {hasPermission, loading, error} = usePermissions()
	const [hasAccess, setHasAccess] = useState(false)

	useEffect(() => {
		if (loading || error) {
			setHasAccess(false)
		} else {
			setHasAccess(hasPermission(permission, context))
		}
	}, [permission, context, hasPermission, loading, error])

	return {
		hasAccess,
		loading,
		error,
	}
}

// Convenience hook for checking multiple permissions
export function usePermissionChecks(permissions: string[], context?: ContextMode) {
	const {hasPermission, loading, error} = usePermissions()
	const [results, setResults] = useState<Record<string, boolean>>({})

	useEffect(() => {
		if (!loading && !error) {
			const newResults: Record<string, boolean> = {}
			permissions.forEach((permission) => {
				newResults[permission] = hasPermission(permission, context)
			})
			setResults(newResults)
		}
	}, [permissions, context, hasPermission, loading, error])

	return {
		results,
		loading,
		error,
	}
}
