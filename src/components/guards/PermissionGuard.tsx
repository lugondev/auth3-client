'use client'

import React from 'react'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'
import {Loader2, ShieldX, AlertTriangle} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {useRouter} from 'next/navigation'

export interface PermissionGuardProps {
	children: React.ReactNode
	// Permission requirements (at least one must be specified)
	permission?: string
	permissions?: string[]
	role?: string
	roles?: string[]
	// Logic operators
	requireAll?: boolean // For permissions/roles arrays: true = AND, false = OR (default)
	// Tenant requirements
	requireTenant?: boolean
	tenantId?: string
	// System admin bypass
	allowSystemAdmin?: boolean
	// Custom components
	loadingComponent?: React.ReactNode
	accessDeniedComponent?: React.ReactNode
	errorComponent?: React.ReactNode
	// Behavior options
	hideOnDenied?: boolean // Hide content instead of showing access denied
	redirectOnDenied?: string // Redirect URL on access denied
	silentFail?: boolean // Don't show any error, just hide content
	// Callbacks
	onAccessGranted?: () => void
	onAccessDenied?: (reason: string) => void
	onError?: (error: string) => void
}

interface AccessCheckResult {
	hasAccess: boolean
	reason?: string
}

export function PermissionGuard({children, permission, permissions, role, roles, requireAll = false, requireTenant = false, tenantId, allowSystemAdmin = true, loadingComponent, accessDeniedComponent, errorComponent, hideOnDenied = false, redirectOnDenied, silentFail = false, onAccessGranted, onAccessDenied, onError}: PermissionGuardProps) {
	const router = useRouter()
	const {isAuthenticated, user, currentTenantId} = useAuth()
	const {hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles, isSystemAdmin, loading, error} = usePermissions()

	// Check access permissions
	const checkAccess = React.useCallback((): AccessCheckResult => {
		// Check authentication
		if (!isAuthenticated || !user) {
			return {hasAccess: false, reason: 'not authenticated'}
		}

		// Check tenant requirements
		if (requireTenant && !currentTenantId) {
			return {hasAccess: false, reason: 'no tenant context'}
		}

		if (tenantId && currentTenantId !== tenantId) {
			return {hasAccess: false, reason: 'wrong tenant context'}
		}

		// System admin bypass
		if (allowSystemAdmin && isSystemAdmin()) {
			return {hasAccess: true}
		}

		// Check permissions
		if (permission && !hasPermission(permission)) {
			return {hasAccess: false, reason: `missing permission: ${permission}`}
		}

		if (permissions && permissions.length > 0) {
			const hasRequiredPermissions = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)

			if (!hasRequiredPermissions) {
				const operator = requireAll ? 'all' : 'any'
				return {
					hasAccess: false,
					reason: `missing ${operator} of permissions: ${permissions.join(', ')}`,
				}
			}
		}

		// Check roles
		if (role && !hasRole(role)) {
			return {hasAccess: false, reason: `missing role: ${role}`}
		}

		if (roles && roles.length > 0) {
			const hasRequiredRoles = requireAll ? hasAllRoles(roles) : hasAnyRole(roles)

			if (!hasRequiredRoles) {
				const operator = requireAll ? 'all' : 'any'
				return {
					hasAccess: false,
					reason: `missing ${operator} of roles: ${roles.join(', ')}`,
				}
			}
		}

		return {hasAccess: true}
	}, [isAuthenticated, user, currentTenantId, requireTenant, tenantId, allowSystemAdmin, isSystemAdmin, permission, permissions, role, roles, requireAll, hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles])

	// Handle access check result
	const accessResult = checkAccess()

	// Execute callbacks
	React.useEffect(() => {
		if (loading || error) return

		if (accessResult.hasAccess) {
			onAccessGranted?.()
		} else {
			onAccessDenied?.(accessResult.reason || 'access denied')

			// Handle redirect
			if (redirectOnDenied) {
				const url = new URL(redirectOnDenied, window.location.origin)
				url.searchParams.set('reason', accessResult.reason || 'access denied')
				if (typeof window !== 'undefined') {
					url.searchParams.set('path', window.location.pathname)
				}
				router.push(url.toString())
			}
		}
	}, [accessResult, loading, error, onAccessGranted, onAccessDenied, redirectOnDenied, router])

	// Handle error callback
	React.useEffect(() => {
		if (error) {
			onError?.(error)
		}
	}, [error, onError])

	// Loading state
	if (loading) {
		if (loadingComponent) {
			return <>{loadingComponent}</>
		}

		return (
			<div className='flex items-center justify-center p-8'>
				<div className='flex items-center space-x-2 text-gray-600'>
					<Loader2 className='h-5 w-5 animate-spin' />
					<span>Checking permissions...</span>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		if (errorComponent) {
			return <>{errorComponent}</>
		}

		if (silentFail) {
			return null
		}

		return (
			<Card className='max-w-md mx-auto mt-8'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-2 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
						<AlertTriangle className='h-6 w-6 text-red-600' />
					</div>
					<CardTitle className='text-lg'>Permission Error</CardTitle>
					<CardDescription>Failed to load permissions</CardDescription>
				</CardHeader>
				<CardContent className='text-center'>
					<p className='text-sm text-gray-600 mb-4'>{error}</p>
					<Button onClick={() => window.location.reload()} variant='outline' size='sm'>
						Retry
					</Button>
				</CardContent>
			</Card>
		)
	}

	// Access granted
	if (accessResult.hasAccess) {
		return <>{children}</>
	}

	// Access denied
	if (silentFail || hideOnDenied) {
		return null
	}

	if (accessDeniedComponent) {
		return <>{accessDeniedComponent}</>
	}

	return (
		<Card className='max-w-md mx-auto mt-8'>
			<CardHeader className='text-center'>
				<div className='mx-auto mb-2 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
					<ShieldX className='h-6 w-6 text-red-600' />
				</div>
				<CardTitle className='text-lg'>Access Denied</CardTitle>
				<CardDescription>You don&#39;t have permission to view this content</CardDescription>
			</CardHeader>
			<CardContent className='text-center'>
				<p className='text-sm text-gray-600 mb-4 capitalize'>{accessResult.reason}</p>
				<div className='flex space-x-2 justify-center'>
					<Button onClick={() => router.back()} variant='outline' size='sm'>
						Go Back
					</Button>
					<Button onClick={() => router.push('/dashboard')} variant='outline' size='sm'>
						Dashboard
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

// Convenience components for common use cases
export function RequirePermission({permission, children, ...props}: Omit<PermissionGuardProps, 'permission'> & {permission: string}) {
	return (
		<PermissionGuard permission={permission} {...props}>
			{children}
		</PermissionGuard>
	)
}

export function RequireRole({role, children, ...props}: Omit<PermissionGuardProps, 'role'> & {role: string}) {
	return (
		<PermissionGuard role={role} {...props}>
			{children}
		</PermissionGuard>
	)
}

export function RequireAnyPermission({permissions, children, ...props}: Omit<PermissionGuardProps, 'permissions' | 'requireAll'> & {permissions: string[]}) {
	return (
		<PermissionGuard permissions={permissions} requireAll={false} {...props}>
			{children}
		</PermissionGuard>
	)
}

export function RequireAllPermissions({permissions, children, ...props}: Omit<PermissionGuardProps, 'permissions' | 'requireAll'> & {permissions: string[]}) {
	return (
		<PermissionGuard permissions={permissions} requireAll={true} {...props}>
			{children}
		</PermissionGuard>
	)
}

export function RequireSystemAdmin({children, ...props}: Omit<PermissionGuardProps, 'role'>) {
	return (
		<PermissionGuard role='SystemSuperAdmin' allowSystemAdmin={true} {...props}>
			{children}
		</PermissionGuard>
	)
}

export function RequireTenantAdmin({children, ...props}: Omit<PermissionGuardProps, 'role' | 'requireTenant'>) {
	return (
		<PermissionGuard role='TenantAdmin' requireTenant={true} {...props}>
			{children}
		</PermissionGuard>
	)
}
