'use client'

import React, {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {getClient, getClientSecret} from '@/services/oauth2Service'
import {ClientInfo} from '@/types/oauth2'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {ArrowLeft, Key, Globe, Lock, Unlock, Calendar, Copy, CheckCircle, Eye, ExternalLink, Shield, Users, Settings, QrCode} from 'lucide-react'
import {PermissionButton} from '@/components/guards'
import Link from 'next/link'

interface OAuth2ClientDetailProps {
	clientId: string
}

/**
 * Component for displaying detailed OAuth2 client information
 */
const OAuth2ClientDetailComponent: React.FC<OAuth2ClientDetailProps> = ({clientId}) => {
	const [client, setClient] = useState<ClientInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [copiedField, setCopiedField] = useState<string | null>(null)
	const [clientSecret, setClientSecret] = useState<string | null>(null)
	const [secretLoading, setSecretLoading] = useState(false)
	const [secretVisible, setSecretVisible] = useState(false)
	const router = useRouter()

	useEffect(() => {
		const fetchClient = async () => {
			try {
				const response = await getClient(clientId)
				setClient(response)
				setLoading(false)
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to fetch OAuth2 client details'
				setError(message)
				setLoading(false)
			}
		}

		if (clientId) {
			fetchClient()
		}
	}, [clientId])

	const copyToClipboard = async (text: string, fieldName: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopiedField(fieldName)
			setTimeout(() => setCopiedField(null), 2000)
		} catch (err) {
			console.error('Failed to copy to clipboard:', err)
		}
	}

	const loadClientSecret = async () => {
		if (clientSecret) {
			setSecretVisible(!secretVisible)
			return
		}

		setSecretLoading(true)
		try {
			const secretData = await getClientSecret(clientId)
			setClientSecret(secretData.client_secret)
			setSecretVisible(true)
		} catch (err) {
			console.error('Failed to load client secret:', err)
			setError('Failed to load client secret. You may not have sufficient permissions.')
		} finally {
			setSecretLoading(false)
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString()
	}

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-[400px]'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
					<p>Loading OAuth2 client details...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='space-y-4'>
				<Button variant='ghost' onClick={() => router.back()}>
					<ArrowLeft className='mr-2 h-4 w-4' />
					Back
				</Button>
				<Alert variant='destructive'>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	if (!client) {
		return (
			<div className='space-y-4'>
				<Button variant='ghost' onClick={() => router.back()}>
					<ArrowLeft className='mr-2 h-4 w-4' />
					Back
				</Button>
				<Alert>
					<AlertDescription>OAuth2 client not found</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-4'>
					<Button variant='ghost' onClick={() => router.back()}>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back
					</Button>
					<div>
						<h1 className='text-2xl font-bold'>{client.name}</h1>
						<p className='text-sm text-muted-foreground'>OAuth2 Client Details</p>
					</div>
				</div>
				<div className='flex items-center space-x-2'>
					<PermissionButton asChild variant='outline' permission='admin:oauth2:update'>
						<Link href={`/dashboard/admin/oauth2/${clientId}/edit`}>
							<Settings className='mr-2 h-4 w-4' />
							Edit Client
						</Link>
					</PermissionButton>
				</div>
			</div>

			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center'>
						<Key className='mr-2 h-5 w-5' />
						Basic Information
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Client Name</label>
							<p className='text-sm font-mono bg-muted p-2 rounded'>{client.name}</p>
						</div>
						{client.description && (
							<div>
								<label className='text-sm font-medium text-muted-foreground'>Description</label>
								<p className='text-sm bg-muted p-2 rounded'>{client.description}</p>
							</div>
						)}
					</div>

					<Separator />

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Client ID</label>
							<div className='flex items-center space-x-2'>
								<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{client.client_id}</p>
								<Button size='sm' variant='outline' onClick={() => copyToClipboard(client.client_id, 'client_id')}>
									{copiedField === 'client_id' ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<label className='text-sm font-medium text-muted-foreground'>Client Secret</label>
								<Button size='sm' variant='outline' onClick={loadClientSecret} disabled={secretLoading} className='h-6 px-2'>
									{secretLoading ? (
										<>
											<div className='h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600' />
											<span className='ml-1 text-xs'>Loading...</span>
										</>
									) : (
										<>
											<Eye className='h-3 w-3' />
											<span className='ml-1 text-xs'>{secretVisible ? 'Hide' : 'Show'} Secret</span>
										</>
									)}
								</Button>
							</div>
							{secretVisible && clientSecret && <div className='mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800'>⚠️ Client secret is sensitive information. Store it securely and never expose it in client-side code.</div>}
							<div className='flex items-center space-x-2'>
								<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{secretVisible && clientSecret ? clientSecret : '••••••••••••••••••••••••••••••••••••••••••••••••••'}</p>
								{secretVisible && clientSecret && (
									<Button size='sm' variant='outline' onClick={() => copyToClipboard(clientSecret, 'client_secret')}>
										{copiedField === 'client_secret' ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
									</Button>
								)}
							</div>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Client Type</label>
							<div className='mt-1'>
								<Badge variant={client.is_public ? 'secondary' : 'outline'}>
									{client.is_public ? (
										<>
											<Unlock className='mr-1 h-3 w-3' />
											Public Client
										</>
									) : (
										<>
											<Lock className='mr-1 h-3 w-3' />
											Confidential Client
										</>
									)}
								</Badge>
							</div>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>QR Code Authentication</label>
							<div className='mt-1'>
								<Badge variant={client.is_qr_code_enabled ? 'default' : 'secondary'}>
									<QrCode className='mr-1 h-3 w-3' />
									{client.is_qr_code_enabled ? 'Enabled' : 'Disabled'}
								</Badge>
							</div>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Created At</label>
							<p className='text-sm bg-muted p-2 rounded'>
								<Calendar className='inline mr-1 h-3 w-3' />
								{formatDate(client.created_at)}
							</p>
						</div>
						{!!client.client_secret_expires_at && client.client_secret_expires_at !== 0 && (
							<div>
								<label className='text-sm font-medium text-muted-foreground'>Secret Expires At</label>
								<p className='text-sm bg-muted p-2 rounded'>
									<Calendar className='inline mr-1 h-3 w-3' />
									{new Date(client.client_secret_expires_at * 1000).toLocaleString()}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* OAuth2 Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center'>
						<Shield className='mr-2 h-5 w-5' />
						OAuth2 Configuration
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Grant Types</label>
							<div className='flex flex-wrap gap-1 mt-1'>
								{client.grant_types?.map((grantType: string) => (
									<Badge key={grantType} variant='outline'>
										{grantType}
									</Badge>
								)) || <span className='text-sm text-muted-foreground'>None specified</span>}
							</div>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Response Types</label>
							<div className='flex flex-wrap gap-1 mt-1'>
								{client.response_types?.map((responseType: string) => (
									<Badge key={responseType} variant='outline'>
										{responseType}
									</Badge>
								)) || <span className='text-sm text-muted-foreground'>None specified</span>}
							</div>
						</div>
					</div>

					<div>
						<label className='text-sm font-medium text-muted-foreground'>Scopes</label>
						<div className='flex flex-wrap gap-1 mt-1'>
							{client.scopes?.map((scope: string) => (
								<Badge key={scope} variant='secondary'>
									{scope}
								</Badge>
							)) || <span className='text-sm text-muted-foreground'>None specified</span>}
						</div>
					</div>

					<div>
						<label className='text-sm font-medium text-muted-foreground'>Redirect URIs</label>
						<div className='space-y-2 mt-1'>
							{client.redirect_uris?.map((uri: string, index: number) => (
								<div key={index} className='flex items-center space-x-2'>
									<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{uri}</p>
									<Button size='sm' variant='outline' onClick={() => copyToClipboard(uri, `redirect_uri_${index}`)}>
										{copiedField === `redirect_uri_${index}` ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
									</Button>
								</div>
							)) || <span className='text-sm text-muted-foreground'>None specified</span>}
						</div>
					</div>

					{client.token_endpoint_auth_method && (
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Token Endpoint Auth Method</label>
							<p className='text-sm bg-muted p-2 rounded mt-1'>{client.token_endpoint_auth_method}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Additional Information */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center'>
						<Globe className='mr-2 h-5 w-5' />
						Additional Information
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{client.client_uri && (
							<div>
								<label className='text-sm font-medium text-muted-foreground'>Client URI</label>
								<div className='flex items-center space-x-2 mt-1'>
									<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{client.client_uri}</p>
									<Button size='sm' variant='outline' asChild>
										<a href={client.client_uri} target='_blank' rel='noopener noreferrer'>
											<ExternalLink className='h-4 w-4' />
										</a>
									</Button>
								</div>
							</div>
						)}
						{client.logo_uri && (
							<div>
								<label className='text-sm font-medium text-muted-foreground'>Logo URI</label>
								<div className='flex items-center space-x-2 mt-1'>
									<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{client.logo_uri}</p>
									<Button size='sm' variant='outline' asChild>
										<a href={client.logo_uri} target='_blank' rel='noopener noreferrer'>
											<ExternalLink className='h-4 w-4' />
										</a>
									</Button>
								</div>
							</div>
						)}
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{client.tos_uri && (
							<div>
								<label className='text-sm font-medium text-muted-foreground'>Terms of Service URI</label>
								<div className='flex items-center space-x-2 mt-1'>
									<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{client.tos_uri}</p>
									<Button size='sm' variant='outline' asChild>
										<a href={client.tos_uri} target='_blank' rel='noopener noreferrer'>
											<ExternalLink className='h-4 w-4' />
										</a>
									</Button>
								</div>
							</div>
						)}
						{client.policy_uri && (
							<div>
								<label className='text-sm font-medium text-muted-foreground'>Policy URI</label>
								<div className='flex items-center space-x-2 mt-1'>
									<p className='text-sm font-mono bg-muted p-2 rounded flex-1'>{client.policy_uri}</p>
									<Button size='sm' variant='outline' asChild>
										<a href={client.policy_uri} target='_blank' rel='noopener noreferrer'>
											<ExternalLink className='h-4 w-4' />
										</a>
									</Button>
								</div>
							</div>
						)}
					</div>

					{client.contacts && client.contacts.length > 0 && (
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Contacts</label>
							<div className='flex flex-wrap gap-1 mt-1'>
								{client.contacts.map((contact: string, index: number) => (
									<Badge key={index} variant='outline'>
										<Users className='mr-1 h-3 w-3' />
										{contact}
									</Badge>
								))}
							</div>
						</div>
					)}

					{client.subject_type && (
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Subject Type</label>
							<p className='text-sm bg-muted p-2 rounded mt-1'>{client.subject_type}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Integration Information */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center'>
						<Settings className='mr-2 h-5 w-5' />
						Integration Setup
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<Alert>
						<Settings className='h-4 w-4' />
						<AlertDescription>Use the following information to configure your application to integrate with this OAuth2 client.</AlertDescription>
					</Alert>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Authorization Endpoint</label>
							<div className='flex items-center space-x-2 mt-1'>
								<code className='text-sm bg-muted p-2 rounded flex-1 break-all'>{`${window.location.origin}/api/v1/oauth2/authorize`}</code>
								<Button size='sm' variant='outline' onClick={() => copyToClipboard(`${window.location.origin}/api/v1/oauth2/authorize`, 'auth_endpoint')}>
									{copiedField === 'auth_endpoint' ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>Token Endpoint</label>
							<div className='flex items-center space-x-2 mt-1'>
								<code className='text-sm bg-muted p-2 rounded flex-1 break-all'>{`${window.location.origin}/api/v1/oauth2/token`}</code>
								<Button size='sm' variant='outline' onClick={() => copyToClipboard(`${window.location.origin}/api/v1/oauth2/token`, 'token_endpoint')}>
									{copiedField === 'token_endpoint' ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>User Info Endpoint</label>
							<div className='flex items-center space-x-2 mt-1'>
								<code className='text-sm bg-muted p-2 rounded flex-1 break-all'>{`${window.location.origin}/api/v1/oauth2/userinfo`}</code>
								<Button size='sm' variant='outline' onClick={() => copyToClipboard(`${window.location.origin}/api/v1/oauth2/userinfo`, 'userinfo_endpoint')}>
									{copiedField === 'userinfo_endpoint' ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>JWKS Endpoint</label>
							<div className='flex items-center space-x-2 mt-1'>
								<code className='text-sm bg-muted p-2 rounded flex-1 break-all'>{`${window.location.origin}/api/v1/oauth2/jwks`}</code>
								<Button size='sm' variant='outline' onClick={() => copyToClipboard(`${window.location.origin}/api/v1/oauth2/jwks`, 'jwks_endpoint')}>
									{copiedField === 'jwks_endpoint' ? <CheckCircle className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default OAuth2ClientDetailComponent
