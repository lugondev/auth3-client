'use client'

import {useEffect, useState} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {ConsentForm} from '@/components/oauth2/ConsentForm'
import {OAuth2ConsentErrorBoundary} from '@/components/oauth2/OAuth2ErrorBoundary'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {AlertTriangle} from 'lucide-react'
import {getClient} from '@/services/oauth2Service'
import {ConsentDetails, ConsentRequest} from '@/types/oauth2-consent'

function ConsentPageContent() {
	const {isAuthenticated, loading} = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [consentDetails, setConsentDetails] = useState<ConsentDetails | null>(null)
	const [consenting, setConsenting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (loading) return

		if (!isAuthenticated) {
			// Redirect to login with standard redirect parameter
			const loginUrl = new URL('/login', window.location.origin)
			loginUrl.searchParams.set('redirect', '/oauth2/consent')

			console.log('ConsentPage: Redirecting to login with URL:', loginUrl.toString())
			window.location.href = loginUrl.toString()
			return
		}

		const loadConsentDetails = async () => {
			try {
				const clientId = searchParams.get('client_id')
				const scope = searchParams.get('scope')
				const redirectUri = searchParams.get('redirect_uri')
				const state = searchParams.get('state')
				const responseType = searchParams.get('response_type')

				if (!clientId || !scope || !redirectUri) {
					setError('Missing required OAuth2 parameters')
					return
				}

				// Get client details
				const client = await getClient(clientId)

				setConsentDetails({
					clientId,
					clientName: client.name || clientId,
					clientLogoUri: client.logo_uri,
					requestedScopes: scope.split(' '),
					redirectUri,
					state: state || '',
					responseType: responseType || 'code',
					codeChallenge: searchParams.get('code_challenge') || undefined,
					codeChallengeMethod: searchParams.get('code_challenge_method') || undefined,
				})
			} catch (error) {
				console.error('Failed to load consent details:', error)
				setError('Failed to load application details')
			}
		}

		loadConsentDetails()
	}, [isAuthenticated, loading, router, searchParams])

	const handleConsent = async (action: 'allow' | 'deny') => {
		if (!consentDetails) return

		setConsenting(true)
		setError(null)

		try {
			const consentRequest: ConsentRequest = {
				action,
				client_id: consentDetails.clientId,
				scopes: consentDetails.requestedScopes,
				redirect_uri: consentDetails.redirectUri,
				state: consentDetails.state,
				response_type: consentDetails.responseType,
				code_challenge: consentDetails.codeChallenge,
				code_challenge_method: consentDetails.codeChallengeMethod,
			}

			const response = await fetch('http://localhost:8080/api/v1/oauth2/consent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('global_accessToken')}`,
				},
				body: JSON.stringify(consentRequest),
			})

			// Handle both redirect and JSON responses
			if (response.status === 302) {
				// Server returned redirect, follow it
				const location = response.headers.get('location')
				if (location) {
					window.location.href = location
				} else {
					// Fallback: redirect manually based on action
					const redirectUrl = new URL(consentDetails.redirectUri)
					if (action === 'deny') {
						redirectUrl.searchParams.set('error', 'access_denied')
						redirectUrl.searchParams.set('error_description', 'User denied authorization')
					}
					if (consentDetails.state) {
						redirectUrl.searchParams.set('state', consentDetails.state)
					}
					window.location.href = redirectUrl.toString()
				}
				return
			}

			if (response.ok) {
				// For successful responses, get JSON response
				try {
					const result = await response.json()

					// Check if server provided redirect_url (our new approach)
					if (result.redirect_url) {
						window.location.href = result.redirect_url
						return
					}

					// Fallback: build redirect URL manually (legacy)
					if (result.code) {
						// Authorization successful, redirect with code
						const redirectUrl = new URL(consentDetails.redirectUri)
						redirectUrl.searchParams.set('code', result.code)
						if (result.state || consentDetails.state) {
							redirectUrl.searchParams.set('state', result.state || consentDetails.state)
						}
						window.location.href = redirectUrl.toString()
					} else if (result.error) {
						// Error in response
						const redirectUrl = new URL(consentDetails.redirectUri)
						redirectUrl.searchParams.set('error', result.error)
						if (result.error_description) {
							redirectUrl.searchParams.set('error_description', result.error_description)
						}
						if (consentDetails.state) {
							redirectUrl.searchParams.set('state', consentDetails.state)
						}
						window.location.href = redirectUrl.toString()
					}
				} catch (parseError) {
					console.error('Failed to parse response:', parseError)
					setError('Failed to process consent response')
				}
			} else {
				const errorData = await response.text()
				throw new Error(errorData || 'Consent processing failed')
			}
		} catch (error) {
			console.error('Consent error:', error)
			setError('Failed to process consent. Please try again.')
		} finally {
			setConsenting(false)
		}
	}

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<Card className='w-full max-w-md'>
					<CardContent className='p-6'>
						<div className='animate-pulse space-y-4'>
							<div className='h-4 bg-muted rounded w-3/4'></div>
							<div className='h-4 bg-muted rounded w-full'></div>
							<div className='h-4 bg-muted rounded w-1/2'></div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<Card className='w-full max-w-md border-destructive/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 text-destructive'>
							<div className='p-2 rounded-full bg-destructive/10 border border-destructive/20'>
								<AlertTriangle className='h-5 w-5 text-destructive' />
							</div>
							Consent Error
						</CardTitle>
						<CardDescription className='text-muted-foreground'>There was a problem processing your consent</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert className='border-destructive/20 bg-destructive/5'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription className='text-destructive font-medium'>{error}</AlertDescription>
						</Alert>
						<div className='mt-6 flex gap-3'>
							<Button variant='outline' onClick={() => window.history.back()} className='flex-1'>
								Go Back
							</Button>
							<Button onClick={() => window.location.reload()} className='flex-1'>
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!consentDetails) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading consent details...</p>
				</div>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			<ConsentForm consentDetails={consentDetails} onConsent={handleConsent} loading={consenting} />
		</div>
	)
}

export default function ConsentPage() {
	return (
		<OAuth2ConsentErrorBoundary>
			<ConsentPageContent />
		</OAuth2ConsentErrorBoundary>
	)
}
