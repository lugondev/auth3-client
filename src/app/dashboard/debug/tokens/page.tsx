'use client'

import React from 'react'
import {DashboardLayout} from '@/components/layout/DashboardLayout'
import {TokenDebugPanel} from '@/components/debug/TokenDebugPanel'

export default function TokenDebugPage() {
	return (
		<DashboardLayout
			title="Token Debug"
			description="Debug and inspect authentication tokens and context"
			showContextControls={true}
			allowedRoles={['admin', 'system_admin']}
		>
			<TokenDebugPanel />
		</DashboardLayout>
	)
}
