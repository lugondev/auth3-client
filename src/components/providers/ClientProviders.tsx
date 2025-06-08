'use client'

import {AuthProvider} from '@/components/providers/AuthProvider'
import {PermissionProvider} from '@/contexts/PermissionContext'
import {AuthStatus} from '@/components/auth/AuthStatus'
import {ThemeProvider} from '@/components/providers/theme-provider'
import {QueryProvider} from '@/components/providers/QueryProvider'
import {ModeToggle} from '@/components/ui/mode-toggle'
import Link from 'next/link'
import {Toaster as SonnerToaster} from '@/components/ui/sonner'
import {useEffect} from 'react'

export function ClientProviders({children}: {children: React.ReactNode}) {
	useEffect(() => {
		// Initialize OpenTelemetry on client side only
		if (typeof window !== 'undefined') {
			import('@/lib/telemetry')
		}
	}, [])

	return (
		<ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
			<QueryProvider>
				<AuthProvider>
					<PermissionProvider>
						{/* Updated Header Structure */}
						<header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
							<div className='container flex h-14 max-w-screen-2xl items-center'>
								{/* Left side: Logo/Brand */}
								<div className='mr-4 flex'>
									<Link href='/' className='mr-6 flex items-center space-x-2'>
										<span className='font-bold sm:inline-block'>AuthSys</span>
									</Link>
								</div>

								{/* Right side: Theme toggle and Auth Status */}
								<div className='flex flex-1 items-center justify-end space-x-2'>
									<ModeToggle />
									<AuthStatus />
								</div>
							</div>
						</header>
						{/* Main content area below the sticky header */}
						<main className='flex-1'>{children}</main>
						<SonnerToaster position='bottom-right' />
					</PermissionProvider>
				</AuthProvider>
			</QueryProvider>
		</ThemeProvider>
	)
}
