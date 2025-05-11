'use client'

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import {useTenantAccessGuard} from '@/hooks/useTenantAccessGuard'

export default function TenantLayout({children}: {children: React.ReactNode}) {
	const {isChecking, isAuthorized, tenantId, tenantName} = useTenantAccessGuard()

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

	if (!isAuthorized || !tenantId) {
		// The guard handles redirection. If still not authorized or tenantId is missing,
		// returning null is appropriate as redirection should be in progress.
		return null
	}

	// User is authenticated and authorized for this tenant
	return (
		<AppShell sidebarType='tenant' tenantId={tenantId} tenantName={tenantName}>
			{children}
		</AppShell>
	)
}
