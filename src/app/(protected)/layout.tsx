'use client'

import {useAuth} from '@/contexts/AuthContext'
import {useRouter, usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
// import AppShell from '@/components/layout/AppShell' // AppShell will be rendered by specific layouts like AdminLayout or TenantLayout

export default function ProtectedLayout({children}: {children: React.ReactNode}) {
	const {user, loading, isAuthenticated, isSystemAdmin} = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const [isCheckingAuth, setIsCheckingAuth] = useState(true)

	useEffect(() => {
		// Wait for auth loading AND system admin status to be determined before making decisions
		// isSystemAdmin check here is mainly to ensure auth context is fully loaded.
		// Specific authorization for /admin or /tenant is handled by their respective layouts.
		if (loading || isSystemAdmin === null) {
			setIsCheckingAuth(true)
			return
		}

		if (!isAuthenticated || !user) {
			setIsCheckingAuth(false)
			// Redirect to login if not on a public page already
			if (pathname !== '/login' && pathname !== '/') {
				// Adjust public routes as needed
				router.push('/login?redirect=' + encodeURIComponent(pathname))
			}
			return
		}

		// If authenticated, allow rendering. Specific route guards will handle further authorization.
		setIsCheckingAuth(false)
		console.log(`[ProtectedLayout] User ${user.id} is authenticated. Access granted for path ${pathname}.`)
	}, [user, loading, isAuthenticated, router, pathname, isSystemAdmin])

	if (isCheckingAuth) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='animate-pulse space-y-4'>
					<div className='h-4 w-[200px] rounded bg-muted'></div>
					<div className='h-4 w-[160px] rounded bg-muted'></div>
				</div>
			</div>
		)
	}

	// If auth check is complete but user is not authenticated (e.g., redirection is happening)
	if (!isAuthenticated && !loading) {
		return null // Or a more specific non-authenticated loading/message
	}

	// If authenticated, render children. Specific layouts (AdminLayout, TenantLayout)
	// or pages themselves will provide their own AppShell.
	return <>{children}</>
}
