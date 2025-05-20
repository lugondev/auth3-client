'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import {useAuth} from '@/contexts/AuthContext'

export default function DashboardLayout({children}: {children: React.ReactNode}) {
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

	// For the main dashboard page:
	// - If system admin and not in a specific tenant context, show system sidebar.
	// - If in a tenant context (currentTenantId is set), show tenant sidebar.
	// - Otherwise (e.g. regular user not in a tenant yet), no specific admin sidebar.
	let sidebarType: 'system' | 'user' | undefined = undefined

	if (isSystemAdmin) {
		sidebarType = 'system'
	} else {
		sidebarType = 'user'
	}

	return <AppShell sidebarType={sidebarType}>{children}</AppShell>
}
