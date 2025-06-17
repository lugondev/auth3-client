'use client'

import React from 'react'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {usePermissions} from '@/contexts/PermissionContext'

interface PermissionTooltipProps {
	children: React.ReactNode
	permission?: string
	permissions?: string[]
	requireAll?: boolean
	role?: string
	roles?: string[]
	requireAllRoles?: boolean
	customMessage?: string
	showTooltip?: boolean // Force show/hide tooltip
}

export function PermissionTooltip({children, permission, permissions = [], requireAll = false, role, roles = [], requireAllRoles = false, customMessage, showTooltip = true}: PermissionTooltipProps) {
	const {hasPermission, hasRole} = usePermissions()

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

		if (requireAllRoles) {
			return roleChecks.every((r) => hasRole(r))
		} else {
			return roleChecks.some((r) => hasRole(r))
		}
	}, [roleChecks, requireAllRoles, hasRole])

	// Overall access check
	const hasAccess = hasRequiredPermissions && hasRequiredRoles

	// Generate tooltip message
	const tooltipMessage = React.useMemo(() => {
		if (customMessage) return customMessage
		if (hasAccess) return ''

		const missingPermissions: string[] = []
		const missingRoles: string[] = []

		if (!hasRequiredPermissions) {
			if (requireAll) {
				missingPermissions.push(...permissionChecks.filter((perm) => !hasPermission(perm)))
			} else {
				missingPermissions.push(...permissionChecks)
			}
		}

		if (!hasRequiredRoles) {
			if (requireAllRoles) {
				missingRoles.push(...roleChecks.filter((r) => !hasRole(r)))
			} else {
				missingRoles.push(...roleChecks)
			}
		}

		const messages: string[] = []
		if (missingPermissions.length > 0) {
			if (requireAll) {
				messages.push(`Missing permissions: ${missingPermissions.join(', ')}`)
			} else {
				messages.push(`Requires any of: ${missingPermissions.join(', ')}`)
			}
		}
		if (missingRoles.length > 0) {
			if (requireAllRoles) {
				messages.push(`Missing roles: ${missingRoles.join(', ')}`)
			} else {
				messages.push(`Requires any role: ${missingRoles.join(', ')}`)
			}
		}

		return messages.join(' | ')
	}, [customMessage, hasAccess, hasRequiredPermissions, hasRequiredRoles, requireAll, requireAllRoles, permissionChecks, roleChecks, hasPermission, hasRole])

	// Don't show tooltip if access is granted or showTooltip is false
	if (!showTooltip || hasAccess || !tooltipMessage) {
		return children
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>
				<p className='text-sm'>{tooltipMessage}</p>
			</TooltipContent>
		</Tooltip>
	)
}
