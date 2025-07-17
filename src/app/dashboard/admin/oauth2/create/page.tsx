'use client'

import React from 'react'
import OAuth2ClientCreateComponent from '@/components/oauth2/OAuth2ClientCreateComponent'

/**
 * Page component for creating a new OAuth2 client
 */
export default function CreateOAuth2ClientPage() {
	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-2xl font-bold tracking-tight'>Create OAuth2 Client</h2>
				<p className='text-muted-foreground'>Create a new OAuth2 client for your application</p>
			</div>
			<OAuth2ClientCreateComponent />
		</div>
	)
}
