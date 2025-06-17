'use client'

import React from 'react'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'

interface ConditionalRenderProps {
	children: React.ReactNode
	permission?: string // Format: "object.action"
	permissions?: string[] // Multiple permissions
	requireAll?: boolean // If true, requires ALL permissions (AND logic)
	role?: string // Check for specific role
	roles?: string[] // Multiple roles
	requireAllRoles?: boolean // If true, requires ALL roles (AND logic)
	fallback?: React.ReactNode // What to render when access is denied
	showFallback?: boolean // Whether to show fallback or nothing
	invert?: boolean // Invert the logic (show when NO access)
	loadingFallback?: React.ReactNode // What to show while loading
	onAccessGranted?: () => void // Callback when access is granted
	onAccessDenied?: () => void // Callback when access is denied
}

export function ConditionalRender({children, permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false, fallback = null, showFallback = true, invert = false, loadingFallback = null, onAccessGranted, onAccessDenied}: ConditionalRenderProps) {
	const {hasPermission, hasRole, loading} = usePermissions()
	const {isSystemAdmin} = useAuth()

	// Build permission checks array
	const permissionChecks: string[] = React.useMemo(() => {
		const checks: string[] = []
		if (permission) checks.push(permission)
		if (permissions.length > 0) checks.push(...permissions)
		return checks
	}, [permission, permissions])

	// Build role checks array
	const roleChecks: string[] = React.useMemo(() => {
		const checks: string[] = []
		if (role) checks.push(role)
		if (roles.length > 0) checks.push(...roles)
		return checks
	}, [role, roles])

	// Check permissions
	const hasRequiredPermissions = React.useMemo(() => {
		// System admin bypasses all permission checks
		if (isSystemAdmin) return true

		if (permissionChecks.length === 0) return true

		if (requireAll) {
			return permissionChecks.every((perm) => hasPermission(perm))
		} else {
			return permissionChecks.some((perm) => hasPermission(perm))
		}
	}, [permissionChecks, requireAll, hasPermission, isSystemAdmin])

	// Check roles
	const hasRequiredRoles = React.useMemo(() => {
		// System admin bypasses all role checks
		if (isSystemAdmin) return true

		if (roleChecks.length === 0) return true

		if (requireAllRoles) {
			return roleChecks.every((r) => hasRole(r))
		} else {
			return roleChecks.some((r) => hasRole(r))
		}
	}, [roleChecks, requireAllRoles, hasRole, isSystemAdmin])

	// Overall access check
	const hasAccess = hasRequiredPermissions && hasRequiredRoles

	// Apply invert logic
	const shouldRender = invert ? !hasAccess : hasAccess

	// Handle callbacks
	React.useEffect(() => {
		if (loading) return

		if (hasAccess && onAccessGranted) {
			onAccessGranted()
		} else if (!hasAccess && onAccessDenied) {
			onAccessDenied()
		}
	}, [hasAccess, loading, onAccessGranted, onAccessDenied])

	// Show loading state
	if (loading) {
		return loadingFallback ? loadingFallback : null
	}

	// Render based on access
	if (shouldRender) {
		return children
	}

	// Show fallback or nothing
	return showFallback ? fallback : null
}

// Convenience components for common use cases
export function ShowWithPermission({children, ...props}: Omit<ConditionalRenderProps, 'invert'>) {
	return (
		<ConditionalRender {...props} invert={false}>
			{children}
		</ConditionalRender>
	)
}

export function HideWithPermission({children, ...props}: Omit<ConditionalRenderProps, 'invert'>) {
	return (
		<ConditionalRender {...props} invert={true}>
			{children}
		</ConditionalRender>
	)
}

// Hook for conditional logic in components
export function useConditionalAccess({permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false}: Omit<ConditionalRenderProps, 'children' | 'fallback' | 'showFallback' | 'invert' | 'loadingFallback' | 'onAccessGranted' | 'onAccessDenied'>) {
	const {hasPermission, hasRole, loading} = usePermissions()
	const {isSystemAdmin} = useAuth()

	// Build permission checks array
	const permissionChecks: string[] = React.useMemo(() => {
		const checks: string[] = []
		if (permission) checks.push(permission)
		if (permissions.length > 0) checks.push(...permissions)
		return checks
	}, [permission, permissions])

	// Build role checks array
	const roleChecks: string[] = React.useMemo(() => {
		const checks: string[] = []
		if (role) checks.push(role)
		if (roles.length > 0) checks.push(...roles)
		return checks
	}, [role, roles])

	// Check permissions
	const hasRequiredPermissions = React.useMemo(() => {
		if (isSystemAdmin) return true
		if (permissionChecks.length === 0) return true

		if (requireAll) {
			return permissionChecks.every((perm) => hasPermission(perm))
		} else {
			return permissionChecks.some((perm) => hasPermission(perm))
		}
	}, [permissionChecks, requireAll, hasPermission, isSystemAdmin])

	// Check roles
	const hasRequiredRoles = React.useMemo(() => {
		if (isSystemAdmin) return true
		if (roleChecks.length === 0) return true

		if (requireAllRoles) {
			return roleChecks.every((r) => hasRole(r))
		} else {
			return roleChecks.some((r) => hasRole(r))
		}
	}, [roleChecks, requireAllRoles, hasRole, isSystemAdmin])

	// Overall access check
	const hasAccess = hasRequiredPermissions && hasRequiredRoles

	return {
		hasAccess,
		hasRequiredPermissions,
		hasRequiredRoles,
		loading,
		permissionChecks,
		roleChecks,
	}
}
