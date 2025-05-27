'use client'

import React, {useState} from 'react'
import apiClient from '@/lib/apiClient'
import {useRouter} from 'next/router'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'

const OAuth2ClientDelete: React.FC = () => {
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const router = useRouter()
	const {clientId} = router.query

	const handleDelete = async () => {
		if (!clientId || typeof clientId !== 'string') return
		try {
			await apiClient.delete(`/api/v1/oauth2/clients/${clientId}`)
			setSuccessMessage('OAuth2 client deleted successfully!')
			setErrorMessage(null)
			router.push('/api/v1/oauth2/clients') // Redirect to the list page
		} catch (err: unknown) {
			setErrorMessage((err as Error).message || 'Failed to delete OAuth2 client')
			setSuccessMessage(null)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Delete OAuth2 Client</CardTitle>
				<CardDescription>Are you sure you want to delete this OAuth2 client?</CardDescription>
			</CardHeader>
			<CardContent>
				{successMessage && (
					<Alert>
						<AlertDescription>{successMessage}</AlertDescription>
					</Alert>
				)}
				{errorMessage && (
					<Alert variant='destructive'>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}
				<Button onClick={handleDelete}>Delete Client</Button>
			</CardContent>
		</Card>
	)
}

export default OAuth2ClientDelete
