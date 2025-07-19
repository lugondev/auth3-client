'use client'

import React, {useState, useEffect} from 'react'
import {ClientInfo, ClientRegistrationRequest} from '@/types/oauth2'
import {Form} from '@/components/ui/form'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useForm} from 'react-hook-form'
import {useParams} from 'next/navigation'
import OAuth2ClientForm from '@/components/oauth2/OAuth2ClientForm'
import {getClient, updateClient} from '@/services/oauth2Service'

const OAuth2ClientEditPage: React.FC = () => {
	const [client, setClient] = useState<ClientInfo | null>(null)
	const [clientData, setClientData] = useState<ClientRegistrationRequest>({
		name: '',
		description: '',
		redirect_uris: [],
		grant_types: [],
		response_types: [],
		scopes: [],
		client_uri: '',
		logo_uri: '',
		tos_uri: '',
		policy_uri: '',
		token_endpoint_auth_method: '',
		contacts: [],
		is_qr_code_enabled: true,
	})
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const params = useParams()
	const clientId = params.clientId as string
	console.log(`Client ID from params: ${clientId}`)

	const form = useForm<ClientRegistrationRequest>({
		defaultValues: clientData,
		mode: 'onSubmit',
	})

	useEffect(() => {
		console.log(`Fetching OAuth2 client with ID: ${clientId}`)

		const fetchClient = async () => {
			if (!clientId || typeof clientId !== 'string') return
			try {
				const clientResponse = await getClient(clientId)
				setClient(clientResponse)
				setClientData({
					name: clientResponse.name,
					description: clientResponse.description || '',
					redirect_uris: clientResponse.redirect_uris,
					grant_types: clientResponse.grant_types,
					response_types: clientResponse.response_types || [],
					scopes: clientResponse.scopes,
					client_uri: clientResponse.client_uri || '',
					logo_uri: clientResponse.logo_uri || '',
					tos_uri: clientResponse.tos_uri || '',
					policy_uri: clientResponse.policy_uri || '',
					token_endpoint_auth_method: clientResponse.token_endpoint_auth_method || '',
					contacts: clientResponse.contacts || [],
					is_qr_code_enabled: clientResponse.is_qr_code_enabled ?? true,
				})
				setLoading(false)
			} catch (err: unknown) {
				setErrorMessage((err as Error).message || 'Failed to fetch OAuth2 client')
				setLoading(false)
			}
		}

		fetchClient()
	}, [clientId])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const {name, value} = e.target
		setClientData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleDataChange = (data: Partial<ClientRegistrationRequest>) => {
		setClientData((prev) => ({...prev, ...data}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!clientId || typeof clientId !== 'string') return
		try {
			await updateClient(clientId, clientData)
			setSuccessMessage('OAuth2 client updated successfully!')
			setErrorMessage(null)
		} catch (err: unknown) {
			setErrorMessage((err as Error).message || 'Failed to update OAuth2 client')
			setSuccessMessage(null)
		}
	}

	if (loading) {
		return (
			<CardContent>
				<div>Loading OAuth2 Client...</div>
			</CardContent>
		)
	}

	if (!client) {
		return (
			<CardContent>
				<div>OAuth2 Client not found.</div>
			</CardContent>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit OAuth2 Client</CardTitle>
				<CardDescription>Edit the details of an existing OAuth2 client.</CardDescription>
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
				<Form {...form}>
					<OAuth2ClientForm clientData={clientData} onSubmit={handleSubmit} onChange={handleChange} onDataChange={handleDataChange} submitLabel='Update Client' errorMessage={errorMessage} />
				</Form>
			</CardContent>
		</Card>
	)
}

export default OAuth2ClientEditPage
