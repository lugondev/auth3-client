'use client'

import React from 'react'
import {Button} from '@/components/ui/button'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'
import {cn} from '@/lib/utils'
import {Loader2} from 'lucide-react'

interface PermissionButtonProps extends React.ComponentProps<typeof Button> {
	permission?: string // Format: "object.action"
	permissions?: string[] // Multiple permissions (OR logic)
	requireAll?: boolean // If true, requires ALL permissions (AND logic)
	role?: string // Check for specific role
	roles?: string[] // Multiple roles (OR logic)
	requireAllRoles?: boolean // If true, requires ALL roles (AND logic)
	hideWhenNoAccess?: boolean // Hide button completely when no access
	showLoadingState?: boolean // Show loading spinner when permissions are loading
	disabledTooltip?: string // Tooltip to show when button is disabled due to permissions
	onAccessDenied?: () => void // Callback when button is clicked but access is denied
	checkPermissionOnClick?: boolean // If true, check permission dynamically on click
}

export function PermissionButton({permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false, hideWhenNoAccess = false, showLoadingState = true, disabledTooltip, onAccessDenied, checkPermissionOnClick = false, children, onClick, disabled, className, ...props}: PermissionButtonProps) {
	const {hasPermission, hasRole, loading, checkPermission} = usePermissions()
	const {isSystemAdmin} = useAuth()
	const [isChecking, setIsChecking] = React.useState(false)

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
		if (permissionChecks.length === 0) return true

		if (requireAll) {
			return permissionChecks.every((perm) => hasPermission(perm))
		} else {
			return permissionChecks.some((perm) => hasPermission(perm))
		}
	}, [permissionChecks, requireAll, hasPermission])

	// Check roles
	const hasRequiredRoles = React.useMemo(() => {
		if (roleChecks.length === 0) return true

		// Check if user is system admin for admin-related roles
		const adminRoles = ['admin', 'system_admin', 'SystemSuperAdmin']
		const hasAdminRole = roleChecks.some((role) => adminRoles.includes(role))

		if (hasAdminRole && isSystemAdmin === true) {
			return true
		}

		if (requireAllRoles) {
			return roleChecks.every((r) => hasRole(r))
		} else {
			return roleChecks.some((r) => hasRole(r))
		}
	}, [roleChecks, requireAllRoles, hasRole, isSystemAdmin])

	const hasAccess = hasRequiredPermissions && hasRequiredRoles
	const isLoading = loading || isChecking
	const isDisabled = disabled || (!hasAccess && !checkPermissionOnClick) || isLoading

	// Handle click with permission checking
	const handleClick = React.useCallback(
		async (event: React.MouseEvent<HTMLButtonElement>) => {
			if (checkPermissionOnClick && !hasAccess) {
				// Dynamic permission check
				if (permissionChecks.length > 0) {
					setIsChecking(true)
					try {
						let dynamicAccess = false

						if (requireAll) {
							// Check all permissions
							const results = await Promise.all(
								permissionChecks.map(async (perm) => {
									const [object, action] = perm.split('.')
									return await checkPermission(object, action)
								}),
							)
							dynamicAccess = results.every(Boolean)
						} else {
							// Check any permission
							for (const perm of permissionChecks) {
								const [object, action] = perm.split('.')
								const result = await checkPermission(object, action)
								if (result) {
									dynamicAccess = true
									break
								}
							}
						}

						if (!dynamicAccess) {
							onAccessDenied?.()
							return
						}
					} catch (error) {
						console.error('Dynamic permission check failed:', error)
						onAccessDenied?.()
						return
					} finally {
						setIsChecking(false)
					}
				} else {
					onAccessDenied?.()
					return
				}
			} else if (!hasAccess) {
				onAccessDenied?.()
				return
			}

			onClick?.(event)
		},
		[checkPermissionOnClick, hasAccess, permissionChecks, requireAll, checkPermission, onAccessDenied, onClick],
	)

	// Hide button if no access and hideWhenNoAccess is true
	if (hideWhenNoAccess && !hasAccess && !loading) {
		return null
	}

	// Show loading state
	if (showLoadingState && isLoading) {
		return (
			<Button {...props} disabled={true} className={cn(className)}>
				<Loader2 className='mr-2 h-4 w-4 animate-spin' />
				{children}
			</Button>
		)
	}

	return (
		<Button {...props} disabled={isDisabled} onClick={handleClick} className={cn(className, !hasAccess && 'opacity-50 cursor-not-allowed')} title={!hasAccess && disabledTooltip ? disabledTooltip : props.title}>
			{children}
		</Button>
	)
}

// Convenience components for common use cases
export function CreateButton(props: Omit<PermissionButtonProps, 'permission'> & {resource: string}) {
	return <PermissionButton {...props} permission={`${props.resource}.create`} disabledTooltip={props.disabledTooltip || `You don't have permission to create ${props.resource}`} />
}

export function EditButton(props: Omit<PermissionButtonProps, 'permission'> & {resource: string}) {
	return <PermissionButton {...props} permission={`${props.resource}.update`} disabledTooltip={props.disabledTooltip || `You don't have permission to edit ${props.resource}`} />
}

export function DeleteButton(props: Omit<PermissionButtonProps, 'permission'> & {resource: string}) {
	return <PermissionButton {...props} permission={`${props.resource}.delete`} disabledTooltip={props.disabledTooltip || `You don't have permission to delete ${props.resource}`} variant={props.variant || 'destructive'} />
}

export function ViewButton(props: Omit<PermissionButtonProps, 'permission'> & {resource: string}) {
	return <PermissionButton {...props} permission={`${props.resource}.read`} disabledTooltip={props.disabledTooltip || `You don't have permission to view ${props.resource}`} />
}

export function AdminButton(props: Omit<PermissionButtonProps, 'roles'>) {
	return <PermissionButton {...props} roles={['admin', 'system_admin', 'SystemSuperAdmin']} disabledTooltip={props.disabledTooltip || 'Admin access required'} />
}
