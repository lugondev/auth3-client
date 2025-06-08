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
	checkPermission: (object: string, action: string) => Promise<boolean>
	refreshPermissions: () => Promise<void>
	clearCache: () => void
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

				// If not in cache, make API call (this would require a check permission endpoint)
				// For now, return false if not in cached permissions
				return false
			} catch (error) {
				console.error('Permission check failed:', error)
				return false
			}
		},
		[permissions, isAuthenticated, user?.id],
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
		checkPermission,
		refreshPermissions,
		clearCache,
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
