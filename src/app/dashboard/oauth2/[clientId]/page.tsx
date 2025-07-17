'use client'

import React from 'react'
import {useParams} from 'next/navigation'
import OAuth2ClientDetailComponent from '@/components/oauth2/OAuth2ClientDetailComponent'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

/**
 * Page for viewing OAuth2 client details
 */
export default function OAuth2ClientDetailPage() {
	const params = useParams()
	const clientId = params.clientId as string

	if (!clientId) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Invalid Client ID</CardTitle>
				</CardHeader>
				<CardContent>
					<p>No client ID provided.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className='container mx-auto py-6'>
			<OAuth2ClientDetailComponent clientId={clientId} />
		</div>
	)
}
