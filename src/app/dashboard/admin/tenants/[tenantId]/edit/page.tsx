'use client'

import React from 'react'
import {TenantManagementLayout} from '@/components/tenants/management/TenantManagementLayout'

export default function EditTenantPage() {
	return (
		<TenantManagementLayout
			titlePrefix="Edit Tenant"
			informationDescription="View and update tenant details."
			loadingMessage="Loading Tenant Details..."
			backButton={{
				text: 'Back to Tenants',
				href: '/dashboard/admin/tenants'
			}}
			errorBackButton={{
				text: 'Go Back',
				onClick: () => window.history.back()
			}}
			notFoundBackButton={{
				text: 'Back to Tenants List',
				href: '/dashboard/admin/tenants'
			}}
			deleteRedirectPath="/dashboard/admin/tenants"
			additionalUpdateQueryKeys={['allTenantsForAdmin']}
			additionalDeleteQueryKeys={['allTenantsForAdmin']}
			showTransferOwnership={true}
			showDeleteSection={true}
		/>
	)
}
