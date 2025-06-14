'use client'

import React from 'react'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'
import {Button, buttonVariants} from '@/components/ui/button'
import {VariantProps} from 'class-variance-authority'
import {Loader2, Lock} from 'lucide-react'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {ContextMode} from '@/types/dual-context'

type ButtonProps = React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}

export interface PermissionButtonProps extends Omit<ButtonProps, 'disabled'> {
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
	// Context management
	context?: ContextMode // Specify which context to check permissions in
	fallbackToGlobal?: boolean // If tenant context check fails, fallback to global
	// System admin bypass
	allowSystemAdmin?: boolean
	// Behavior options
	hideOnDenied?: boolean // Hide button instead of disabling
	showTooltip?: boolean // Show tooltip explaining why disabled
	customTooltip?: string // Custom tooltip message
	loadingText?: string // Text to show while loading permissions
	disabledText?: string // Text to show when disabled due to permissions
	// Override disabled state
	forceDisabled?: boolean
	// Callbacks
	onAccessDenied?: (reason: string) => void
	onPermissionCheck?: (hasAccess: boolean, reason?: string) => void
}

interface AccessCheckResult {
	hasAccess: boolean
	reason?: string
}

export function PermissionButton({children, permission, permissions, role, roles, requireAll = false, requireTenant = false, tenantId, context, fallbackToGlobal = true, allowSystemAdmin = true, hideOnDenied = false, showTooltip = true, customTooltip, loadingText, disabledText, forceDisabled = false, onAccessDenied, onPermissionCheck, onClick, ...buttonProps}: PermissionButtonProps) {
	const {isAuthenticated, user, currentTenantId, currentMode} = useAuth()
	const {hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles, isSystemAdmin, loading, error} = usePermissions()

	// Use a stable check for system admin to prevent hydration mismatches
	const [isSystemAdminStable, setIsSystemAdminStable] = React.useState<boolean | null>(null)

	React.useEffect(() => {
		if (!loading && isAuthenticated) {
			setIsSystemAdminStable(isSystemAdmin())
		} else if (!isAuthenticated) {
			setIsSystemAdminStable(false)
		}
	}, [loading, isAuthenticated, isSystemAdmin])

	// Determine the context to check permissions in
	const effectiveContext = React.useMemo(() => {
		if (context) return context
		if (requireTenant) return 'tenant'
		return currentMode || 'auto'
	}, [context, requireTenant, currentMode])

	// Check access permissions
	const checkAccess = React.useCallback((): AccessCheckResult => {
		// Check authentication
		if (!isAuthenticated || !user) {
			return {hasAccess: false, reason: 'Authentication required'}
		}

		// Check tenant requirements
		if (requireTenant && !currentTenantId) {
			return {hasAccess: false, reason: 'Tenant context required'}
		}

		if (tenantId && currentTenantId !== tenantId) {
			return {hasAccess: false, reason: 'Wrong tenant context'}
		}

		// System admin bypass - use stable check to prevent hydration mismatches
		if (allowSystemAdmin && isSystemAdminStable === true) {
			return {hasAccess: true}
		}

		// Helper function to check permissions in a specific context
		const checkInContext = (checkContext: ContextMode): AccessCheckResult => {
			// Check permissions
			if (permission && !hasPermission(permission, checkContext)) {
				return {hasAccess: false, reason: `Missing permission: ${permission} in ${checkContext} context`}
			}

			if (permissions && permissions.length > 0) {
				const hasRequiredPermissions = requireAll 
					? hasAllPermissions(permissions, checkContext) 
					: hasAnyPermission(permissions, checkContext)

				if (!hasRequiredPermissions) {
					const operator = requireAll ? 'all' : 'any'
					return {
						hasAccess: false,
						reason: `Missing ${operator} of permissions: ${permissions.join(', ')} in ${checkContext} context`,
					}
				}
			}

			// Check roles
			if (role && !hasRole(role, checkContext)) {
				return {hasAccess: false, reason: `Missing role: ${role} in ${checkContext} context`}
			}

			if (roles && roles.length > 0) {
				const hasRequiredRoles = requireAll 
					? hasAllRoles(roles, checkContext) 
					: hasAnyRole(roles, checkContext)

				if (!hasRequiredRoles) {
					const operator = requireAll ? 'all' : 'any'
					return {
						hasAccess: false,
						reason: `Missing ${operator} of roles: ${roles.join(', ')} in ${checkContext} context`,
					}
				}
			}

			return {hasAccess: true}
		}

		// Check permissions in the effective context
		const primaryResult = checkInContext(effectiveContext)
		
		// If primary check fails and fallback is enabled, try global context
		if (!primaryResult.hasAccess && fallbackToGlobal && effectiveContext !== 'global') {
			const fallbackResult = checkInContext('global')
			if (fallbackResult.hasAccess) {
				return {hasAccess: true, reason: 'Access granted via global context fallback'}
			}
		}

		return primaryResult
	}, [isAuthenticated, user, currentTenantId, requireTenant, tenantId, allowSystemAdmin, isSystemAdminStable, permission, permissions, role, roles, requireAll, effectiveContext, fallbackToGlobal, hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles])

	// Handle access check result
	const accessResult = checkAccess()
	// Include isSystemAdminStable null check to prevent hydration mismatches during initial load
	const isDisabled = forceDisabled || !accessResult.hasAccess || loading || !!error || (allowSystemAdmin && isSystemAdminStable === null)

	// Execute callbacks
	React.useEffect(() => {
		if (loading || error) return

		onPermissionCheck?.(accessResult.hasAccess, accessResult.reason)

		if (!accessResult.hasAccess) {
			onAccessDenied?.(accessResult.reason || 'Access denied')
		}
	}, [accessResult, loading, error, onPermissionCheck, onAccessDenied])

	// Handle click with permission check
	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			if (isDisabled) {
				event.preventDefault()
				return
			}

			if (accessResult.hasAccess) {
				onClick?.(event)
			} else {
				event.preventDefault()
				onAccessDenied?.(accessResult.reason || 'Access denied')
			}
		},
		[isDisabled, accessResult, onClick, onAccessDenied],
	)

	// Determine button content
	const getButtonContent = () => {
		if (loading) {
			return (
				<>
					<Loader2 className='mr-2 h-4 w-4 animate-spin' />
					{loadingText || 'Loading...'}
				</>
			)
		}

		if (isDisabled && !accessResult.hasAccess && disabledText) {
			return (
				<>
					<Lock className='mr-2 h-4 w-4' />
					{disabledText}
				</>
			)
		}

		return children
	}

	// Determine tooltip message
	const getTooltipMessage = () => {
		if (customTooltip) return customTooltip
		if (loading) return 'Checking permissions...'
		if (error) return `Permission error: ${error}`
		if (forceDisabled) return 'This action is currently disabled'
		if (!accessResult.hasAccess) return accessResult.reason || 'Access denied'
		return ''
	}

	// Hide button if access denied and hideOnDenied is true
	if (hideOnDenied && !loading && !accessResult.hasAccess) {
		return null
	}

	// Render button with optional tooltip
	const button = (
		<Button {...buttonProps} disabled={isDisabled} onClick={handleClick} aria-label={isDisabled ? getTooltipMessage() : buttonProps['aria-label']}>
			{getButtonContent()}
		</Button>
	)

	// Wrap with tooltip if needed
	if (showTooltip && isDisabled && getTooltipMessage()) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{button}</TooltipTrigger>
					<TooltipContent>
						<p>{getTooltipMessage()}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return button
}

// Convenience components for common use cases
export function PermissionActionButton({permission, children, ...props}: Omit<PermissionButtonProps, 'permission'> & {permission: string}) {
	return (
		<PermissionButton permission={permission} {...props}>
			{children}
		</PermissionButton>
	)
}

export function RoleActionButton({role, children, ...props}: Omit<PermissionButtonProps, 'role'> & {role: string}) {
	return (
		<PermissionButton role={role} {...props}>
			{children}
		</PermissionButton>
	)
}

export function AdminActionButton({children, ...props}: Omit<PermissionButtonProps, 'role'>) {
	return (
		<PermissionButton role='SystemSuperAdmin' allowSystemAdmin={true} {...props}>
			{children}
		</PermissionButton>
	)
}

export function TenantActionButton({children, ...props}: Omit<PermissionButtonProps, 'role' | 'requireTenant'>) {
	return (
		<PermissionButton role='TenantAdmin' requireTenant={true} {...props}>
			{children}
		</PermissionButton>
	)
}

// Specialized buttons for common actions
export function CreateButton(props: Omit<PermissionButtonProps, 'permission'> & {resource?: string}) {
	const permission = props.resource ? `${props.resource}.create` : '*.create'
	return (
		<PermissionButton permission={permission} {...props}>
			{props.children || 'Create'}
		</PermissionButton>
	)
}

export function EditButton(props: Omit<PermissionButtonProps, 'permission'> & {resource?: string}) {
	const permission = props.resource ? `${props.resource}.update` : '*.update'
	return (
		<PermissionButton permission={permission} {...props}>
			{props.children || 'Edit'}
		</PermissionButton>
	)
}

export function DeleteButton(props: Omit<PermissionButtonProps, 'permission'> & {resource?: string}) {
	const permission = props.resource ? `${props.resource}.delete` : '*.delete'
	return (
		<PermissionButton permission={permission} {...props}>
			{props.children || 'Delete'}
		</PermissionButton>
	)
}

export function ViewButton(props: Omit<PermissionButtonProps, 'permission'> & {resource?: string}) {
	const permission = props.resource ? `${props.resource}.read` : '*.read'
	return (
		<PermissionButton permission={permission} {...props}>
			{props.children || 'View'}
		</PermissionButton>
	)
}

// Admin button with multiple role support
export function AdminButton(props: Omit<PermissionButtonProps, 'roles'>) {
	return (
		<PermissionButton roles={['admin', 'system_admin', 'SystemSuperAdmin']} allowSystemAdmin={true} customTooltip={props.customTooltip || 'Admin access required'} {...props}>
			{props.children}
		</PermissionButton>
	)
}

// Simple wrapper for basic use cases (compatible with permissions/PermissionButton API)
export interface SimplePermissionButtonProps extends Omit<PermissionButtonProps, 'showTooltip' | 'allowSystemAdmin' | 'hideOnDenied'> {
	hideWhenNoAccess?: boolean
	showLoadingState?: boolean
	disabledTooltip?: string
	checkPermissionOnClick?: boolean
}

export function SimplePermissionButton({hideWhenNoAccess = false, showLoadingState = true, disabledTooltip, ...props}: SimplePermissionButtonProps) {
	return <PermissionButton {...props} hideOnDenied={hideWhenNoAccess} showTooltip={false} allowSystemAdmin={true} customTooltip={disabledTooltip} loadingText={showLoadingState ? 'Loading...' : undefined} />
}

// Context-aware convenience components
export function GlobalPermissionButton(props: Omit<PermissionButtonProps, 'context'>) {
	return <PermissionButton {...props} context='global' fallbackToGlobal={false} />
}

export function TenantPermissionButton(props: Omit<PermissionButtonProps, 'context' | 'requireTenant'>) {
	return <PermissionButton {...props} context='tenant' requireTenant={true} fallbackToGlobal={props.fallbackToGlobal ?? true} />
}

export function AutoPermissionButton(props: Omit<PermissionButtonProps, 'context'>) {
	return <PermissionButton {...props} context='auto' fallbackToGlobal={props.fallbackToGlobal ?? true} />
}
