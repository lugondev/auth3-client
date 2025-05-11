'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import {useSystemAdminGuard} from '@/hooks/useSystemAdminGuard'
// import {useAuth} from '@/contexts/AuthContext' // To get user info for potential display

export default function AdminLayout({children}: {children: React.ReactNode}) {
	const {isChecking, isAuthorized} = useSystemAdminGuard()
	// const {user} = useAuth() // Optional: if you want to pass user info to AppShell or Header

	if (isChecking) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='animate-pulse space-y-4'>
					<div className='h-4 w-[200px] rounded bg-muted'></div>
					<div className='h-4 w-[160px] rounded bg-muted'></div>
				</div>
			</div>
		)
	}

	if (!isAuthorized) {
		// The guard already handles redirection, so this is a fallback or for cases
		// where rendering needs to be explicitly stopped.
		// Returning null might be appropriate if redirection is guaranteed by the hook.
		return null
	}

	// User is authenticated and authorized as a system admin
	return (
		<AppShell sidebarType='system' tenantId={undefined} tenantName={undefined}>
			{children}
		</AppShell>
	)
}
