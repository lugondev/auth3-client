'use client'

import React, {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react'
import {useAuth} from './AuthContext'
import apiClient from '@/lib/apiClient'

interface Permission {
	object: string
	action: string
}

interface PermissionContextType {
	permissions: Permission[]
	roles: string[]
	loading: boolean
	error: string | null
	hasPermission: (permission: string) => boolean
	hasRole: (role: string) => boolean
	hasAnyPermission: (permissions: string[]) => boolean
	hasAllPermissions: (permissions: string[]) => boolean
	hasAnyRole: (roles: string[]) => boolean
	hasAllRoles: (roles: string[]) => boolean
	checkPermission: (object: string, action: string) => Promise<boolean>
	checkPermissions: (permissions: string[]) => Promise<Record<string, boolean>>
	refreshPermissions: () => Promise<void>
	clearCache: () => void
	isSystemAdmin: () => boolean
	isTenantAdmin: () => boolean
	getUserPermissions: () => Permission[]
	getUserRoles: () => string[]
}

interface PermissionCache {
	permissions: Permission[]
	roles: string[]
	timestamp: number
	tenantId: string | null
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY = 'permission_cache'

export function PermissionProvider({children}: {children: React.ReactNode}) {
	const {user, currentTenantId, isAuthenticated} = useAuth()
	const [permissions, setPermissions] = useState<Permission[]>([])
	const [roles, setRoles] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const cacheRef = useRef<PermissionCache | null>(null)
	const fetchingRef = useRef<boolean>(false)

	// Load cache from localStorage
	const loadCache = useCallback((): PermissionCache | null => {
		try {
			const cached = localStorage.getItem(CACHE_KEY)
			if (!cached) return null

			const cache: PermissionCache = JSON.parse(cached)
			const now = Date.now()

			// Check if cache is expired or for different tenant
			if (now - cache.timestamp > CACHE_TTL || cache.tenantId !== currentTenantId) {
				localStorage.removeItem(CACHE_KEY)
				return null
			}

			return cache
		} catch (error) {
			console.error('Failed to load permission cache:', error)
			localStorage.removeItem(CACHE_KEY)
			return null
		}
	}, [currentTenantId])

	// Save cache to localStorage
	const saveCache = useCallback(
		(permissions: Permission[], roles: string[]) => {
			try {
				const cache: PermissionCache = {
					permissions,
					roles,
					timestamp: Date.now(),
					tenantId: currentTenantId,
				}
				localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
				cacheRef.current = cache
			} catch (error) {
				console.error('Failed to save permission cache:', error)
			}
		},
		[currentTenantId],
	)

	// Clear cache
	const clearCache = useCallback(() => {
		localStorage.removeItem(CACHE_KEY)
		cacheRef.current = null
	}, [])

	// Fetch permissions from API
	const fetchPermissions = useCallback(async (): Promise<{permissions: Permission[]; roles: string[]}> => {
		if (!user?.id || !isAuthenticated) {
			return {permissions: [], roles: []}
		}

		try {
			// Determine the endpoint based on tenant context
			const endpoint = currentTenantId ? `/api/v1/tenants/${currentTenantId}/permissions` : '/api/v1/tenants/global/permissions'

			const response = await apiClient.get(endpoint)
			const permissionData = response.data.permissions || []

			// Convert permission arrays to objects
			const permissions: Permission[] = permissionData.map((perm: string[]) => ({
				object: perm[0],
				action: perm[1],
			}))

			// Get roles from user data
			const roles = user.roles || []

			return {permissions, roles}
		} catch (error) {
			console.error('Failed to fetch permissions:', error)
			throw error
		}
	}, [user, currentTenantId, isAuthenticated])

	// Refresh permissions
	const refreshPermissions = useCallback(async () => {
		if (fetchingRef.current) return

		setLoading(true)
		setError(null)
		fetchingRef.current = true

		try {
			const {permissions: newPermissions, roles: newRoles} = await fetchPermissions()
			setPermissions(newPermissions)
			setRoles(newRoles)
			saveCache(newPermissions, newRoles)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch permissions'
			setError(errorMessage)
			console.error('Permission refresh failed:', error)
		} finally {
			setLoading(false)
			fetchingRef.current = false
		}
	}, [fetchPermissions, saveCache])

	// Check if user has a specific permission (string format: "object.action")
	const hasPermission = useCallback(
		(permission: string): boolean => {
			if (!permission || !isAuthenticated) return false

			// Handle both dot and colon separators
			let object: string, action: string
			if (permission.includes(':')) {
				;[object, action] = permission.split(':')
			} else {
				;[object, action] = permission.split('.')
			}
			if (!object || !action) return false

			return permissions.some((p) => {
				// Check for exact match
				if (p.object === object && p.action === action) return true

				// Check for wildcard permissions
				if (p.object === '*' && p.action === '*') return true // Full wildcard (*.*)
				if (p.object === '*' && p.action === '.*') return true // SystemSuperAdmin pattern (*..*)
				if (p.object === '*' && p.action === action) return true // Object wildcard (*.action)
				if (p.object === object && p.action === '*') return true // Action wildcard (object.*)
				if (p.object === object && p.action === '.*') return true // Action regex wildcard (object..*)

				// Check for full regex-like patterns
				if (p.object === '.*' && p.action === '.*') return true // Full regex wildcard (.*..*)
				if (p.object === '.*') return true // Object regex wildcard (.*.action)
				if (p.action === '.*') return true // Action regex wildcard (object..*)

				return false
			})
		},
		[permissions, isAuthenticated],
	)

	// Check if user has a specific role
	const hasRole = useCallback(
		(role: string): boolean => {
			if (!role || !isAuthenticated) return false
			return roles.includes(role)
		},
		[roles, isAuthenticated],
	)

	// Check if user has any of the specified permissions
	const hasAnyPermission = useCallback(
		(permissionList: string[]): boolean => {
			if (!permissionList || permissionList.length === 0 || !isAuthenticated) return false
			return permissionList.some(permission => hasPermission(permission))
		},
		[hasPermission, isAuthenticated],
	)

	// Check if user has all of the specified permissions
	const hasAllPermissions = useCallback(
		(permissionList: string[]): boolean => {
			if (!permissionList || permissionList.length === 0 || !isAuthenticated) return false
			return permissionList.every(permission => hasPermission(permission))
		},
		[hasPermission, isAuthenticated],
	)

	// Check if user has any of the specified roles
	const hasAnyRole = useCallback(
		(roleList: string[]): boolean => {
			if (!roleList || roleList.length === 0 || !isAuthenticated) return false
			return roleList.some(role => hasRole(role))
		},
		[hasRole, isAuthenticated],
	)

	// Check if user has all of the specified roles
	const hasAllRoles = useCallback(
		(roleList: string[]): boolean => {
			if (!roleList || roleList.length === 0 || !isAuthenticated) return false
			return roleList.every(role => hasRole(role))
		},
		[hasRole, isAuthenticated],
	)

	// Check if user is system admin
	const isSystemAdmin = useCallback((): boolean => {
		if (!isAuthenticated) return false
		return hasRole('SystemSuperAdmin') || hasRole('SystemAdmin') || hasPermission('*.*')
	}, [hasRole, hasPermission, isAuthenticated])

	// Check if user is tenant admin
	const isTenantAdmin = useCallback((): boolean => {
		if (!isAuthenticated || !currentTenantId) return false
		return hasRole('TenantAdmin') || hasRole('Admin') || hasPermission('tenant.*')
	}, [hasRole, hasPermission, isAuthenticated, currentTenantId])

	// Get user permissions (for debugging/display)
	const getUserPermissions = useCallback((): Permission[] => {
		return [...permissions]
	}, [permissions])

	// Get user roles (for debugging/display)
	const getUserRoles = useCallback((): string[] => {
		return [...roles]
	}, [roles])

	// Dynamic permission check via API
	const checkPermission = useCallback(
		async (object: string, action: string): Promise<boolean> => {
			if (!object || !action || !isAuthenticated || !user?.id) {
				return false
			}

			try {
				// First check local cache
				const hasLocal = permissions.some((p) => p.object === object && p.action === action)
				if (hasLocal) return true

				// If not in cache, make API call to backend check endpoint
				const endpoint = currentTenantId 
					? `/api/v1/tenants/${currentTenantId}/rbac/check`
					: '/api/v1/rbac/check'
				
				const response = await apiClient.get(endpoint, {
					params: { object, action }
				})
				
				return response.data?.hasPermission || false
			} catch (error) {
				console.error('Permission check failed:', error)
				return false
			}
		},
		[permissions, isAuthenticated, user?.id, currentTenantId],
	)

	// Bulk permission check via API
	const checkPermissions = useCallback(
		async (permissionList: string[]): Promise<Record<string, boolean>> => {
			if (!permissionList || permissionList.length === 0 || !isAuthenticated || !user?.id) {
				return {}
			}

			const results: Record<string, boolean> = {}

			try {
				// First check local cache for all permissions
				const uncachedPermissions: string[] = []
				
				permissionList.forEach(permission => {
					const hasLocal = hasPermission(permission)
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

				// Make API call for uncached permissions
				const endpoint = currentTenantId 
					? `/api/v1/tenants/${currentTenantId}/rbac/check-bulk`
					: '/api/v1/rbac/check-bulk'
				
				const response = await apiClient.post(endpoint, {
					permissions: uncachedPermissions
				})
				
				const apiResults = response.data?.results || {}
				
				// Merge API results with cached results
				uncachedPermissions.forEach(permission => {
					results[permission] = apiResults[permission] || false
				})
				
				return results
			} catch (error) {
				console.error('Bulk permission check failed:', error)
				// Return false for all uncached permissions on error
				permissionList.forEach(permission => {
					if (!(permission in results)) {
						results[permission] = false
					}
				})
				return results
			}
		},
		[hasPermission, isAuthenticated, user?.id, currentTenantId],
	)

	// Load permissions on mount and when dependencies change
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			setPermissions([])
			setRoles([])
			setError(null)
			return
		}

		// Try to load from cache first
		const cached = loadCache()
		if (cached) {
			setPermissions(cached.permissions)
			setRoles(cached.roles)
			cacheRef.current = cached
			return
		}

		// If no valid cache, fetch from API
		refreshPermissions()
	}, [isAuthenticated, user?.id, currentTenantId, loadCache, refreshPermissions])

	// Refresh permissions when tenant changes
	useEffect(() => {
		if (isAuthenticated && user?.id && currentTenantId !== cacheRef.current?.tenantId) {
			clearCache()
			refreshPermissions()
		}
	}, [currentTenantId, isAuthenticated, user?.id, clearCache, refreshPermissions])

	const value: PermissionContextType = {
		permissions,
		roles,
		loading,
		error,
		hasPermission,
		hasRole,
		hasAnyPermission,
		hasAllPermissions,
		hasAnyRole,
		hasAllRoles,
		checkPermission,
		checkPermissions,
		refreshPermissions,
		clearCache,
		isSystemAdmin,
		isTenantAdmin,
		getUserPermissions,
		getUserRoles,
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
export function usePermissionCheck(permission: string) {
	const {hasPermission, loading, error} = usePermissions()
	const [hasAccess, setHasAccess] = useState(false)

	useEffect(() => {
		if (loading || error) {
			setHasAccess(false)
		} else {
			setHasAccess(hasPermission(permission))
		}
	}, [permission, hasPermission, loading, error])

	return {
		hasAccess,
		loading,
		error,
	}
}

// Convenience hook for checking multiple permissions
export function usePermissionChecks(permissions: string[]) {
	const {hasPermission, loading, error} = usePermissions()
	const [results, setResults] = useState<Record<string, boolean>>({})

	useEffect(() => {
		if (!loading && !error) {
			const newResults: Record<string, boolean> = {}
			permissions.forEach((permission) => {
				newResults[permission] = hasPermission(permission)
			})
			setResults(newResults)
		}
	}, [permissions, hasPermission, loading, error])

	return {
		results,
		loading,
		error,
	}
}
