'use client'

import React from 'react'
import {useParams} from 'next/navigation'
import {useTenantInfo} from '@/hooks/useTenantInfo'
import {TenantSpaceHeader} from '@/components/tenant/TenantSpaceHeader'
import {TenantGuard} from '@/components/guards/TenantGuard'
import {TenantSidebar} from '@/components/tenant/TenantSidebar'
import DashboardFooter from '@/components/dashboard/DashboardFooter'

interface TenantLayoutProps {
	children: React.ReactNode
}

export default function TenantLayout({children}: TenantLayoutProps) {
	const params = useParams()
	const tenantId = params.tenantId as string
	const {tenantName} = useTenantInfo(tenantId)

	return (
		<TenantGuard tenantId={tenantId}>
			{/* Full screen tenant space - no main sidebar */}
			<div className='flex min-h-screen bg-background'>
				{/* Tenant Sidebar - replaces main sidebar completely */}
				<div className='w-64 border-r bg-muted/10'>
					<TenantSidebar tenantId={tenantId} />
				</div>

				{/* Main Content Area */}
				<div className='flex-1 flex flex-col min-h-0'>
					{/* Tenant Header */}
					<TenantSpaceHeader tenantId={tenantId} tenantName={tenantName} />

					{/* Page Content */}
					<div className='flex-1 overflow-y-auto'>
						<div className='min-h-full flex flex-col'>
							<div className='flex-1 container mx-auto px-4 py-6'>{children}</div>
							<DashboardFooter variant='tenant' tenantName={tenantName} />
						</div>
					</div>
				</div>
			</div>
		</TenantGuard>
	)
}
