import React from 'react'
import {Metadata} from 'next'
import {Suspense} from 'react'
import OAuth2ClientList from '@/components/oauth2/OAuth2ClientList'

export const metadata: Metadata = {
	title: 'OAuth2 Management - Auth3',
	description: 'Manage your OAuth2 clients and applications',
}

/**
 * Page component for OAuth2 client management dashboard
 */
export default function OAuth2DashboardPage() {
	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-2xl font-bold tracking-tight'>OAuth2 Management</h2>
				<p className='text-muted-foreground'>Manage your OAuth2 clients and applications</p>
			</div>
			<Suspense fallback={<div>Loading...</div>}>
				<OAuth2ClientList />
			</Suspense>
		</div>
	)
}
