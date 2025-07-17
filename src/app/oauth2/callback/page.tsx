'use client'

import {useEffect, useState} from 'react'
import {useSearchParams, useRouter} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {handleOAuth2Callback} from '@/services/oauth2Service'
import {Loader2, CheckCircle, XCircle} from 'lucide-react'

export default function OAuth2CallbackPage() {
	const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('waiting')
	const [message, setMessage] = useState('Waiting for OAuth2 callback...')
	const [tokenInfo, setTokenInfo] = useState<{
		access_token: string
		token_type: string
		expires_in: string | number
		scope: string
		id_token: string
	} | null>(null)

	const searchParams = useSearchParams()
	const router = useRouter()

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Extract OAuth2 callback parameters
				const code = searchParams.get('code')
				const state = searchParams.get('state')
				const error = searchParams.get('error')
				const errorDescription = searchParams.get('error_description')

				// Check for OAuth2 error
				if (error) {
					setStatus('error')
					setMessage(`OAuth2 Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`)
					return
				}

				// If no code, just wait for callback
				if (!code) {
					setStatus('waiting')
					setMessage('Waiting for OAuth2 callback...')
					return
				}

				// Start processing
				setStatus('loading')
				setMessage('Processing OAuth2 callback...')

				// Validate required parameters
				if (!state) {
					setStatus('error')
					setMessage('Missing required OAuth2 callback parameters (state)')
					return
				}

				// Note: In a real implementation, these would come from your OAuth2 client registration
				// For testing purposes, these should match your OAuth2 client configuration
				const clientId = 'test-client-id' // Replace with actual client ID from your OAuth2 test
				const redirectUri = window.location.origin + '/oauth2/callback'
				const clientSecret = undefined // For public clients using PKCE

				console.log('🔙 Processing OAuth2 callback with:', {code, state, clientId, redirectUri})

				// Exchange authorization code for tokens
				const tokens = await handleOAuth2Callback(code, state, clientId, redirectUri, clientSecret)

				setStatus('success')
				setMessage('OAuth2 authorization successful! Tokens received.')
				setTokenInfo({
					access_token: tokens.access_token ? '***' + tokens.access_token.slice(-10) : 'N/A',
					token_type: tokens.token_type || 'N/A',
					expires_in: tokens.expires_in || 'N/A',
					scope: tokens.scope || 'N/A',
					id_token: tokens.id_token ? '***' + tokens.id_token.slice(-10) : 'N/A',
				})

				// Optionally redirect to a success page or back to the main app after delay
				// setTimeout(() => {
				//   router.push('/dashboard')
				// }, 3000)
			} catch (error) {
				console.error('❌ OAuth2 callback error:', error)
				setStatus('error')
				setMessage(error instanceof Error ? error.message : 'Unknown error during OAuth2 callback')
			}
		}

		handleCallback()
	}, [searchParams, router])

	const handleRetry = () => {
		router.push('/oauth2/test')
	}

	const handleGoHome = () => {
		router.push('/')
	}

	const copyCode = () => {
		const code = searchParams.get('code')
		if (code) {
			navigator.clipboard.writeText(code)
		}
	}

	return (
		<div className='container mx-auto p-6 max-w-2xl'>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						{status === 'loading' && <Loader2 className='h-5 w-5 animate-spin' />}
						{status === 'success' && <CheckCircle className='h-5 w-5 text-green-600' />}
						{status === 'error' && <XCircle className='h-5 w-5 text-red-600' />}
						OAuth2 Callback
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='text-center'>
						<p className='text-lg mb-4'>{message}</p>

						{status === 'loading' && (
							<div className='flex justify-center'>
								<Loader2 className='h-8 w-8 animate-spin text-blue-600' />
							</div>
						)}

						{status === 'success' && tokenInfo && (
							<div className='bg-green-50 border border-green-200 rounded-lg p-4 mt-4'>
								<h3 className='font-semibold text-green-800 mb-2'>Token Information:</h3>
								<div className='text-left space-y-1 text-sm text-green-700'>
									<div>
										<strong>Access Token:</strong> {tokenInfo.access_token}
									</div>
									<div>
										<strong>Token Type:</strong> {tokenInfo.token_type}
									</div>
									<div>
										<strong>Expires In:</strong> {tokenInfo.expires_in} seconds
									</div>
									<div>
										<strong>Scope:</strong> {tokenInfo.scope}
									</div>
									<div>
										<strong>ID Token:</strong> {tokenInfo.id_token}
									</div>
								</div>
							</div>
						)}

						{status === 'error' && (
							<div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-4'>
								<h3 className='font-semibold text-red-800 mb-2'>Error Details:</h3>
								<p className='text-red-700 text-sm'>{message}</p>
							</div>
						)}

						{status === 'waiting' && searchParams.get('code') && (
							<Button onClick={copyCode} variant='outline' className='w-full mt-4'>
								📋 Copy Authorization Code
							</Button>
						)}
					</div>

					<div className='flex gap-2 justify-center'>
						{status === 'error' && (
							<Button onClick={handleRetry} variant='outline'>
								Try Again
							</Button>
						)}
						<Button onClick={handleGoHome} variant={status === 'success' ? 'default' : 'secondary'}>
							{status === 'success' ? 'Continue to App' : 'Go Home'}
						</Button>
					</div>

					{/* Debug Information */}
					<details className='mt-6'>
						<summary className='cursor-pointer text-sm text-gray-600 hover:text-gray-800'>Debug Information</summary>
						<div className='mt-2 p-3 bg-gray-50 rounded text-xs font-mono'>
							<div>
								<strong>URL Parameters:</strong>
							</div>
							<div>code: {searchParams.get('code') || 'N/A'}</div>
							<div>state: {searchParams.get('state') || 'N/A'}</div>
							<div>error: {searchParams.get('error') || 'N/A'}</div>
							<div>error_description: {searchParams.get('error_description') || 'N/A'}</div>
						</div>
					</details>
				</CardContent>
			</Card>
		</div>
	)
}
