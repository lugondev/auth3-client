'use client'

import React, {useState, useEffect} from 'react'
import apiClient from '@/lib/apiClient'
import {ClientRegistrationResponse, ClientRegistrationRequest} from '@/types/oauth2'
import {Form} from '@/components/ui/form'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useForm} from 'react-hook-form'
import {useParams} from 'next/navigation'
import OAuth2ClientForm from '@/components/oauth2/OAuth2ClientForm'

const OAuth2ClientEditPage: React.FC = () => {
	const [client, setClient] = useState<ClientRegistrationResponse | null>(null)
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
				const response = await apiClient.get(`/api/v1/oauth2/clients/${clientId}`)
				setClient(response.data)
				setClientData({
					name: response.data.name,
					description: response.data.description || '',
					redirect_uris: response.data.redirect_uris,
					grant_types: response.data.grant_types,
					response_types: response.data.response_types,
					scopes: response.data.scopes,
					client_uri: response.data.client_uri || '',
					logo_uri: response.data.logo_uri || '',
					tos_uri: response.data.tos_uri || '',
					policy_uri: response.data.policy_uri || '',
					token_endpoint_auth_method: response.data.token_endpoint_auth_method || '',
					contacts: response.data.contacts || [],
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
			await apiClient.put(`/api/v1/oauth2/clients/${clientId}`, clientData)
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
