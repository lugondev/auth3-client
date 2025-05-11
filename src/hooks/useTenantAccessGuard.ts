'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function useTenantAccessGuard() {
	const {
		user,
		loading: authLoading,
		isAuthenticated,
		currentTenantId,
		userTenants,
		switchTenant,
		isSystemAdmin, // System admins might have special access or need to be in tenant context
	} = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const params = useParams() // To get tenantId from the route

	const routeTenantId = params.tenantId as string | undefined

	const [isChecking, setIsChecking] = useState(true)
	const [isAuthorized, setIsAuthorized] = useState(false)
	const [tenantName, setTenantName] = useState<string | undefined>(undefined)

	useEffect(() => {
		if (authLoading || isSystemAdmin === null) {
			setIsChecking(true)
			setIsAuthorized(false)
			return
		}

		if (!isAuthenticated || !user) {
			setIsChecking(false)
			setIsAuthorized(false)
			if (pathname !== '/login' && pathname !== '/') {
				router.push('/login?redirect=' + encodeURIComponent(pathname))
			}
			return
		}

		if (!routeTenantId) {
			console.warn('Tenant ID missing in /tenant/ route. Redirecting to dashboard.')
			setIsChecking(false)
			setIsAuthorized(false)
			router.push('/dashboard')
			return
		}

		const targetTenant = userTenants?.find((t) => t.tenant_id === routeTenantId)

		if (!targetTenant) {
			// If user is not part of this tenant (and not a system admin overriding)
			// System admins might be allowed to view any tenant, or they might need to explicitly be a member.
			// Current logic: if not a member, redirect.
			console.warn(
				`User ${user.id} is not a member of tenant ${routeTenantId} or tenant not found. Redirecting to dashboard.`,
			)
			setIsChecking(false)
			setIsAuthorized(false)
			router.push('/dashboard')
			return
		}

		// User is a member of the tenant.
		setTenantName(targetTenant.tenant_name)

		if (currentTenantId !== routeTenantId) {
			console.log(
				`Current tenant context (${currentTenantId}) does not match route tenant (${routeTenantId}). Attempting to switch.`,
			)
			setIsChecking(true) // Keep checking while switch is in progress
			setIsAuthorized(false)
			switchTenant(routeTenantId)
				.then((switched) => {
					if (switched) {
						console.log(`Successfully switched to tenant ${routeTenantId}.`)
						// Authorization will be re-evaluated in the next effect run due to currentTenantId change
						// For now, we can assume it will be authorized if switch was successful
						setIsAuthorized(true)
					} else {
						console.warn(`Failed to switch to tenant ${routeTenantId}. Redirecting to dashboard.`)
						router.push('/dashboard')
					}
				})
				.catch((error) => {
					console.error(`Error switching to tenant ${routeTenantId}:`, error)
					router.push('/dashboard')
				})
				.finally(() => {
					// setIsChecking(false) // Moved to be set after switchTenant completes or if no switch needed
				})
			// Do not set isChecking to false here, wait for the re-render and re-evaluation
		} else {
			// Already in the correct tenant context
			console.log(`User ${user.id} authorized for tenant ${routeTenantId}.`)
			setIsAuthorized(true)
		}
		setIsChecking(false) // Set checking to false once initial checks/switch attempts are done for this render

	}, [
		user,
		authLoading,
		isAuthenticated,
		router,
		pathname,
		routeTenantId,
		currentTenantId,
		userTenants,
		switchTenant,
		isSystemAdmin,
	])

	return { isChecking, isAuthorized, tenantId: routeTenantId, tenantName }
}
