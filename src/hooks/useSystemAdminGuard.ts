'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function useSystemAdminGuard() {
	const { user, loading: authLoading, isAuthenticated, isSystemAdmin } = useAuth()
	const router = useRouter()
	const pathname = usePathname()

	const [isChecking, setIsChecking] = useState(true)
	const [isAuthorized, setIsAuthorized] = useState(false)

	useEffect(() => {
		console.log('[useSystemAdminGuard] Effect triggered. Pathname:', pathname, 'AuthLoading:', authLoading, 'IsSystemAdmin:', isSystemAdmin, 'IsAuthenticated:', isAuthenticated);

		// Ensure auth context loading is complete and isSystemAdmin status is determined
		if (authLoading || isSystemAdmin === null) {
			console.log('[useSystemAdminGuard] Still checking due to authLoading or isSystemAdmin being null.');
			setIsChecking(true) // Still checking
			setIsAuthorized(false)
			return
		}

		if (!isAuthenticated || !user) {
			setIsChecking(false)
			setIsAuthorized(false)
			// Redirect to login if not on a public page already (though this guard is for protected routes)
			// This check might be redundant if a general auth guard is already in place at a higher level.
			if (pathname !== '/login' && pathname !== '/') { // Adjust public routes as needed
				router.push('/login?redirect=' + encodeURIComponent(pathname))
			}
			return
		}

		if (isSystemAdmin === false) {
			console.warn(`[useSystemAdminGuard] User ${user.id} is not a system admin. Access denied for path ${pathname}. Redirecting to /dashboard.`)
			setIsChecking(false)
			setIsAuthorized(false)
			router.push('/dashboard')
		} else if (isSystemAdmin === true) {
			console.log(`[useSystemAdminGuard] User ${user.id} is a system admin. Access granted for path ${pathname}.`)
			setIsChecking(false)
			setIsAuthorized(true)
		} else {
			// Fallback for unexpected isSystemAdmin state, though null is handled above.
			console.error(`[useSystemAdminGuard] System admin status is indeterminate for path ${pathname}. Redirecting to /dashboard.`)
			setIsChecking(false)
			setIsAuthorized(false)
			router.push('/dashboard') // Or an error page
		}
	}, [user, authLoading, isAuthenticated, isSystemAdmin, router, pathname])

	return { isChecking, isAuthorized, isSystemAdmin }
}
