'use client'

import React from 'react'
import {usePermissions} from '@/contexts/PermissionContext'

interface PermissionGuardProps {
	children: React.ReactNode
	permission?: string // Format: "object.action"
	permissions?: string[] // Multiple permissions (OR logic)
	requireAll?: boolean // If true, requires ALL permissions (AND logic)
	role?: string // Check for specific role
	roles?: string[] // Multiple roles (OR logic)
	requireAllRoles?: boolean // If true, requires ALL roles (AND logic)
	fallback?: React.ReactNode // What to show when access is denied
	loading?: React.ReactNode // What to show while loading
	showError?: boolean // Whether to show error state
	onAccessDenied?: () => void // Callback when access is denied
}

export function PermissionGuard({children, permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false, fallback = null, loading = null, showError = false, onAccessDenied}: PermissionGuardProps) {
	const {hasPermission, hasRole, loading: permissionsLoading, error} = usePermissions()

	// Build permission checks array
	const permissionChecks: string[] = []
	if (permission) permissionChecks.push(permission)
	if (permissions.length > 0) permissionChecks.push(...permissions)

	// Build role checks array
	const roleChecks: string[] = []
	if (role) roleChecks.push(role)
	if (roles.length > 0) roleChecks.push(...roles)

	// Check permissions
	let hasRequiredPermissions = true
	if (permissionChecks.length > 0) {
		if (requireAll) {
			// AND logic: user must have ALL permissions
			hasRequiredPermissions = permissionChecks.every((perm) => hasPermission(perm))
		} else {
			// OR logic: user must have at least ONE permission
			hasRequiredPermissions = permissionChecks.some((perm) => hasPermission(perm))
		}
	}

	// Check roles
	let hasRequiredRoles = true
	if (roleChecks.length > 0) {
		if (requireAllRoles) {
			// AND logic: user must have ALL roles
			hasRequiredRoles = roleChecks.every((r) => hasRole(r))
		} else {
			// OR logic: user must have at least ONE role
			hasRequiredRoles = roleChecks.some((r) => hasRole(r))
		}
	}

	// Final access decision
	const hasAccess = hasRequiredPermissions && hasRequiredRoles

	// Call onAccessDenied callback if access is denied - MOVED BEFORE EARLY RETURNS
	React.useEffect(() => {
		if (!hasAccess && onAccessDenied) {
			onAccessDenied()
		}
	}, [hasAccess, onAccessDenied])

	// Show loading state
	if (permissionsLoading) {
		return loading ? loading : null
	}

	// Show error state if requested
	if (error && showError) {
		return <div className='text-red-500 text-sm p-2 border border-red-200 rounded bg-red-50'>Permission check failed: {error}</div>
	}

	// Return children if access is granted, otherwise return fallback
	return hasAccess ? children : fallback
}

// Convenience component for simple permission checks
export function RequirePermission({permission, children, fallback = null}: {permission: string; children: React.ReactNode; fallback?: React.ReactNode}) {
	return (
		<PermissionGuard permission={permission} fallback={fallback}>
			{children}
		</PermissionGuard>
	)
}

// Convenience component for role checks
export function RequireRole({role, children, fallback = null}: {role: string; children: React.ReactNode; fallback?: React.ReactNode}) {
	return (
		<PermissionGuard role={role} fallback={fallback}>
			{children}
		</PermissionGuard>
	)
}

// Convenience component for admin-only content
export function AdminOnly({children, fallback = null}: {children: React.ReactNode; fallback?: React.ReactNode}) {
	return (
		<PermissionGuard roles={['admin', 'system_admin']} fallback={fallback}>
			{children}
		</PermissionGuard>
	)
}

// Higher-order component for permission-based rendering
export function withPermissionGuard<P extends object>(Component: React.ComponentType<P>, guardProps: Omit<PermissionGuardProps, 'children'>) {
	return function PermissionGuardedComponent(props: P) {
		return (
			<PermissionGuard {...guardProps}>
				<Component {...props} />
			</PermissionGuard>
		)
	}
}

// Hook for conditional rendering based on permissions
export function usePermissionGuard({permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false}: Omit<PermissionGuardProps, 'children' | 'fallback' | 'loading' | 'showError' | 'onAccessDenied'>) {
	const {hasPermission, hasRole, loading, error} = usePermissions()

	// Build permission checks array
	const permissionChecks: string[] = []
	if (permission) permissionChecks.push(permission)
	if (permissions.length > 0) permissionChecks.push(...permissions)

	// Build role checks array
	const roleChecks: string[] = []
	if (role) roleChecks.push(role)
	if (roles.length > 0) roleChecks.push(...roles)

	// Check permissions
	let hasRequiredPermissions = true
	if (permissionChecks.length > 0) {
		if (requireAll) {
			hasRequiredPermissions = permissionChecks.every((perm) => hasPermission(perm))
		} else {
			hasRequiredPermissions = permissionChecks.some((perm) => hasPermission(perm))
		}
	}

	// Check roles
	let hasRequiredRoles = true
	if (roleChecks.length > 0) {
		if (requireAllRoles) {
			hasRequiredRoles = roleChecks.every((r) => hasRole(r))
		} else {
			hasRequiredRoles = roleChecks.some((r) => hasRole(r))
		}
	}

	const hasAccess = hasRequiredPermissions && hasRequiredRoles

	return {
		hasAccess,
		loading,
		error,
		hasRequiredPermissions,
		hasRequiredRoles,
	}
}
