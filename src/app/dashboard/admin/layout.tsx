'use client'

import React from 'react'
import {useSystemAdminGuard} from '@/hooks/useSystemAdminGuard'
import {AdminSpaceHeader} from '@/components/admin/AdminSpaceHeader'
import {AdminSidebar} from '@/components/admin/AdminSidebar'
import DashboardFooter from '@/components/dashboard/DashboardFooter'

export default function AdminLayout({children}: {children: React.ReactNode}) {
	const {isChecking, isAuthorized} = useSystemAdminGuard()

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
		<div className='flex min-h-screen bg-background'>
			{/* Admin Sidebar - replaces main sidebar completely */}
			<div className='w-64 border-r bg-muted/10'>
				<AdminSidebar />
			</div>

			{/* Main Content Area */}
			<div className='flex-1 flex flex-col min-h-0'>
				{/* Admin Header */}
				<AdminSpaceHeader />

				{/* Page Content */}
				<div className='flex-1 overflow-y-auto'>
					<div className='min-h-full flex flex-col'>
						<div className='flex-1 container mx-auto px-4 py-6'>{children}</div>
						<DashboardFooter variant='admin' />
					</div>
				</div>
			</div>
		</div>
	)
}
