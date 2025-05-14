'use client'

import {useAuth} from '@/contexts/AuthContext'
import {useRouter, usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'

export default function ProtectedLayout({children}: {children: React.ReactNode}) {
	const {user, loading, isAuthenticated, isSystemAdmin} = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const [isCheckingAuth, setIsCheckingAuth] = useState(true)

	useEffect(() => {
		// If the main AuthContext is still loading, keep showing the skeleton.
		if (loading) {
			setIsCheckingAuth(true)
			return
		}

		// AuthContext loading is complete. isSystemAdmin should be resolved.
		// Now, check if the user is authenticated.
		if (!isAuthenticated || !user) {
			setIsCheckingAuth(false) // Finished checking, user is not authenticated.
			// Redirect to login if not on a public page already
			if (pathname !== '/login' && pathname !== '/') {
				// Adjust public routes as needed
				router.push('/login?redirect=' + encodeURIComponent(pathname))
			}
			return
		}

		// If authenticated, allow rendering.
		setIsCheckingAuth(false) // Finished checking, user is authenticated.
		console.log(`[ProtectedLayout] User ${user.id} is authenticated. isSystemAdmin: ${isSystemAdmin}. Access granted for path ${pathname}.`)
	}, [user, loading, isAuthenticated, isSystemAdmin, router, pathname])

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

	return <>{children}</>
}
