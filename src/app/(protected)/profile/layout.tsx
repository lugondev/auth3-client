'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import {useAuth} from '@/contexts/AuthContext'

export default function ProfileLayout({children}: {children: React.ReactNode}) {
	const {isSystemAdmin, loading: authLoading} = useAuth()

	// Wait for auth loading to complete before deciding sidebar type
	if (authLoading || isSystemAdmin === null) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='animate-pulse space-y-4'>
					<div className='h-4 w-[200px] rounded bg-muted'></div>
					<div className='h-4 w-[160px] rounded bg-muted'></div>
				</div>
			</div>
		)
	}

	// For the profile page, if the user is a system admin, show the system sidebar.
	// Otherwise, no specific admin sidebar is shown (AppShell will handle default).
	const sidebarType = isSystemAdmin ? 'system' : undefined

	return (
		<AppShell sidebarType={sidebarType} tenantId={undefined} tenantName={undefined}>
			{children}
		</AppShell>
	)
}
