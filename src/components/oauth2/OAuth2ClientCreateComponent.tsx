'use client'

import React, {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ClientRegistrationRequest} from '@/types/oauth2'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Form} from '@/components/ui/form'
import {Button} from '@/components/ui/button'
import {ArrowLeft} from 'lucide-react'
import {useForm} from 'react-hook-form'
import Link from 'next/link'
import OAuth2ClientForm from './OAuth2ClientForm'
import {registerClient} from '@/services/oauth2Service'

/**
 * Component for creating a new OAuth2 client
 */
const OAuth2ClientCreateComponent: React.FC = () => {
	const router = useRouter()
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
	const [createError, setCreateError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const form = useForm<ClientRegistrationRequest>({
		defaultValues: clientData,
		mode: 'onSubmit',
	})

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
		setIsLoading(true)
		try {
			await registerClient(clientData)
			// Redirect to the OAuth2 clients list page with success message
			router.push('/dashboard/oauth2?success=Client created successfully')
		} catch (err: unknown) {
			setCreateError((err as Error).message || 'Failed to create OAuth2 client')
			setIsLoading(false)
		}
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>Create OAuth2 Client</h2>
					<p className='text-muted-foreground'>Configure a new OAuth2 client for your application</p>
				</div>
				<Button variant='outline' asChild>
					<Link href='/dashboard/oauth2'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to Clients
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Client Details</CardTitle>
					<CardDescription>Fill in the details to create a new OAuth2 client.</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<OAuth2ClientForm
							clientData={clientData}
							onSubmit={handleSubmit}
							onChange={handleChange}
							onDataChange={handleDataChange}
							submitLabel='Create Client'
							errorMessage={createError}
							showCancel={true}
							onCancel={() => router.push('/dashboard/oauth2')}
							isLoading={isLoading}
						/>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}

export default OAuth2ClientCreateComponent