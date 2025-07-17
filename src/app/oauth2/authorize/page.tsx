'use client'

import {useEffect, useState, useMemo, useCallback} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Shield, AlertTriangle, ExternalLink, CheckCircle} from 'lucide-react'
import Image from 'next/image'

interface AuthorizationDetails {
	clientName?: string
	requestedScopes: string[]
	clientLogo?: string
}

export default function OAuth2AuthorizePage() {
	const {isAuthenticated, loading, user} = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectError, setRedirectError] = useState<string | null>(null)
	const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetails | null>(null)

	// Extract OAuth2 parameters from URL
	const oauth2Params = useMemo(() => {
		const params: Record<string, string> = {}
		const oauth2Keys = ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'code_challenge', 'code_challenge_method', 'nonce']

		oauth2Keys.forEach((key) => {
			const value = searchParams.get(key)
			if (value) {
				params[key] = value
			}
		})

		return Object.keys(params).length > 0 ? params : null
	}, [searchParams])

	// Validate OAuth2 parameters and load client details
	useEffect(() => {
		if (!oauth2Params || !oauth2Params.client_id || !oauth2Params.redirect_uri) {
			setRedirectError('Missing required OAuth2 parameters (client_id, redirect_uri)')
			return
		}

		// Parse requested scopes
		const scopes = oauth2Params.scope ? oauth2Params.scope.split(' ') : ['openid']

		// Load client details
		const loadClientDetails = async () => {
			try {
				const response = await fetch(`http://localhost:8080/api/v1/oauth2/clients/${oauth2Params.client_id}`, {
					headers: {
						'Authorization': `Bearer ${localStorage.getItem('global_accessToken') || localStorage.getItem('tenant_accessToken')}`,
						'Content-Type': 'application/json',
					},
				})
				if (response.ok) {
					const client = await response.json()
					setAuthorizationDetails({
						clientName: client.name || oauth2Params.client_id,
						requestedScopes: scopes,
						clientLogo: client.logo_uri,
					})
				} else {
					setAuthorizationDetails({
						clientName: oauth2Params.client_id,
						requestedScopes: scopes,
					})
				}
			} catch (error) {
				console.error('Failed to load client details:', error)
				setAuthorizationDetails({
					clientName: oauth2Params.client_id,
					requestedScopes: scopes,
				})
			}
		}

		loadClientDetails()
	}, [oauth2Params])

	// Handle OAuth2 authorization flow - Updated for new backend logic
	const handleAuthorization = useCallback(async () => {
		if (!oauth2Params || !oauth2Params.client_id || !oauth2Params.redirect_uri) {
			setRedirectError('Missing required OAuth2 parameters')
			return
		}

		setIsRedirecting(true)
		setRedirectError(null)

		try {
			// Call backend authorization endpoint directly
			const response = await fetch('http://localhost:8080/api/v1/oauth2/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('global_accessToken')}`,
					'Accept': 'application/json',
				},
				body: JSON.stringify({
					response_type: oauth2Params.response_type || 'code',
					client_id: oauth2Params.client_id,
					redirect_uri: oauth2Params.redirect_uri,
					scope: oauth2Params.scope || 'openid profile email',
					state: oauth2Params.state,
					code_challenge: oauth2Params.code_challenge,
					code_challenge_method: oauth2Params.code_challenge_method,
					nonce: oauth2Params.nonce,
				}),
			})

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.message || 'Authorization failed')
			}

			// Check if consent is required
			if (result.consent_required) {
				console.log('Consent required, redirecting to consent page')

				// Build consent URL with all parameters
				const consentUrl = new URL('/oauth2/consent', window.location.origin)
				Object.entries(oauth2Params).forEach(([key, value]) => {
					consentUrl.searchParams.set(key, value)
				})

				router.push(consentUrl.toString())
				return
			}

			// Authorization successful, redirect with code
			if (result.code) {
				const redirectUrl = new URL(oauth2Params.redirect_uri)
				redirectUrl.searchParams.set('code', result.code)

				if (result.state || oauth2Params.state) {
					redirectUrl.searchParams.set('state', result.state || oauth2Params.state)
				}

				window.location.href = redirectUrl.toString()
			} else {
				throw new Error('No authorization code received')
			}
		} catch (error: unknown) {
			console.error('Error in OAuth2 authorization:', error)
			setIsRedirecting(false)

			const errorMessage = error instanceof Error ? error.message : String(error)
			setRedirectError(`Authorization failed: ${errorMessage}`)
		}
	}, [oauth2Params, router])

	// Check authentication and redirect logic
	useEffect(() => {
		if (loading || !oauth2Params) {
			return
		}

		// If user is not authenticated, redirect to login with current params
		if (!isAuthenticated) {
			console.log('OAuth2Authorize: User not authenticated, redirecting to login')
			const loginUrl = new URL('/login', window.location.origin)

			// Preserve all OAuth2 parameters in the login redirect
			Object.entries(oauth2Params).forEach(([key, value]) => {
				loginUrl.searchParams.set(key, value)
			})

			router.replace(loginUrl.toString())
			return
		}

		// Validate redirect_uri to prevent loops
		const redirectUri = oauth2Params.redirect_uri

		if (redirectUri.includes('/login') || redirectUri.includes('/oauth2/authorize')) {
			console.warn('OAuth2Authorize: redirect_uri points to auth pages, potential loop detected')
			setRedirectError('Invalid redirect URI: cannot redirect back to authentication pages')
			return
		}

		// Don't auto-authorize anymore - show authorization details first
		// This allows users to see what they're authorizing
	}, [isAuthenticated, loading, oauth2Params, router])

	const handleDenyAuthorization = () => {
		if (!oauth2Params?.redirect_uri) {
			setRedirectError('Cannot deny authorization: missing redirect URI')
			return
		}

		// Redirect back with error
		const redirectUrl = new URL(oauth2Params.redirect_uri)
		redirectUrl.searchParams.set('error', 'access_denied')
		redirectUrl.searchParams.set('error_description', 'User denied authorization')

		if (oauth2Params.state) {
			redirectUrl.searchParams.set('state', oauth2Params.state)
		}

		window.location.href = redirectUrl.toString()
	}

	// Add timeout for OAuth2 redirect to prevent infinite loading
	useEffect(() => {
		if (isRedirecting) {
			const timeout = setTimeout(() => {
				console.error('OAuth2 redirect timeout')
				setIsRedirecting(false)
				setRedirectError('Redirect timeout. Please try again.')
			}, 15000) // 15 seconds timeout

			return () => clearTimeout(timeout)
		}
	}, [isRedirecting])

	// Show loading skeleton while checking auth status
	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<Card className='w-full max-w-md'>
					<CardHeader>
						<Skeleton className='h-6 w-3/4' />
						<Skeleton className='h-4 w-full' />
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-2/3' />
							<Skeleton className='h-10 w-full' />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Show error state
	if (redirectError) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<Card className='w-full max-w-md'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 text-red-600'>
							<AlertTriangle className='h-5 w-5' />
							Authorization Error
						</CardTitle>
						<CardDescription>There was a problem with your authorization request</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert className='border-red-200 bg-red-50'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription className='text-red-800'>{redirectError}</AlertDescription>
						</Alert>
						<div className='mt-4 flex gap-2'>
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

	// Show authorization prompt
	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-50'>
			<Card className='w-full max-w-md shadow-lg'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
						<Shield className='h-6 w-6 text-blue-600' />
					</div>
					<CardTitle className='text-xl'>Authorization Request</CardTitle>
					<CardDescription>{authorizationDetails?.clientName || 'An application'} wants to access your account</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* User Info */}
					<div className='rounded-lg bg-gray-50 p-4'>
						<p className='text-sm text-gray-600'>Signed in as</p>
						<p className='font-medium'>{user?.email}</p>
					</div>

					{/* Client Info */}
					{authorizationDetails && (
						<div className='space-y-4'>
							<div>
								<h3 className='font-medium mb-2'>Application Details</h3>
								<div className='flex items-center gap-3 p-3 rounded-lg border'>
									{authorizationDetails.clientLogo ? (
										<Image src={authorizationDetails.clientLogo} alt={authorizationDetails.clientName || 'Client logo'} width={32} height={32} className='h-8 w-8 rounded' />
									) : (
										<div className='h-8 w-8 rounded bg-gray-200 flex items-center justify-center'>
											<ExternalLink className='h-4 w-4 text-gray-500' />
										</div>
									)}
									<div>
										<p className='font-medium'>{authorizationDetails.clientName}</p>
										<p className='text-sm text-gray-500'>OAuth2 Application</p>
									</div>
								</div>
							</div>

							{/* Requested Permissions */}
							<div>
								<h3 className='font-medium mb-2'>Requested Permissions</h3>
								<div className='space-y-2'>
									{authorizationDetails.requestedScopes.map((scope) => (
										<div key={scope} className='flex items-center gap-2 text-sm'>
											<CheckCircle className='h-4 w-4 text-green-500' />
											<span>{scope}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Redirect URI Info */}
					{oauth2Params?.redirect_uri && (
						<div className='text-xs text-gray-500 bg-gray-50 p-2 rounded'>
							<p>Will redirect to: {oauth2Params.redirect_uri}</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className='flex gap-3'>
						<Button variant='outline' onClick={handleDenyAuthorization} className='flex-1' disabled={isRedirecting}>
							Deny
						</Button>
						<Button onClick={handleAuthorization} className='flex-1' disabled={isRedirecting}>
							{isRedirecting ? 'Authorizing...' : 'Allow'}
						</Button>
					</div>

					{/* Security Notice */}
					<div className='text-xs text-gray-500 text-center'>By clicking Allow, you authorize this application to access your account information as specified above.</div>
				</CardContent>
			</Card>
		</div>
	)
}
