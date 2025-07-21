'use client'

import { Suspense } from 'react'
import {useEffect, useState, useMemo, useCallback} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Shield, AlertTriangle, ExternalLink, CheckCircle} from 'lucide-react'
import Image from 'next/image'
import {getClient, authorizeOAuth2, type AuthorizeRequest} from '@/services/oauth2Service'

interface AuthorizationDetails {
	clientName?: string
	requestedScopes: string[]
	clientLogo?: string
}

function OAuth2AuthorizeContent() {
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

		console.log('OAuth2Authorize: Extracted params:', params)
		console.log('OAuth2Authorize: All searchParams:', Object.fromEntries(searchParams.entries()))

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
				const client = await getClient(oauth2Params.client_id)
				setAuthorizationDetails({
					clientName: client.name || oauth2Params.client_id,
					requestedScopes: scopes,
					clientLogo: client.logo_uri,
				})
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
			// Call backend authorization endpoint using service
			const authRequest: AuthorizeRequest = {
				response_type: oauth2Params.response_type || 'code',
				client_id: oauth2Params.client_id,
				redirect_uri: oauth2Params.redirect_uri,
				scope: oauth2Params.scope || 'openid profile email',
				state: oauth2Params.state,
				code_challenge: oauth2Params.code_challenge,
				code_challenge_method: oauth2Params.code_challenge_method,
				nonce: oauth2Params.nonce,
			}

			const result = await authorizeOAuth2(authRequest)

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
			} else if (result.error) {
				throw new Error(result.error_description || result.error || 'Authorization failed')
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
		console.log('OAuth2Authorize: Checking authentication status and redirect logic')

		if (loading || !oauth2Params) {
			return
		}

		// If user is not authenticated, redirect to login with current params
		if (!isAuthenticated) {
			console.log('OAuth2Authorize: User not authenticated, redirecting to login')

			// Get all current parameters to preserve them
			const allParams = Object.fromEntries(searchParams.entries())
			console.log('OAuth2Authorize: Current params to preserve:', allParams)

			const loginUrl = new URL('/login', window.location.origin)

			// Build redirect URL with all current parameters
			const fullCurrentUrl = window.location.href
			const currentUrl = new URL(fullCurrentUrl)
			const redirectPath = currentUrl.pathname + currentUrl.search

			console.log('OAuth2Authorize: Full current URL:', fullCurrentUrl)
			console.log('OAuth2Authorize: Current pathname:', currentUrl.pathname)
			console.log('OAuth2Authorize: Current search:', currentUrl.search)
			console.log('OAuth2Authorize: Redirect path to preserve:', redirectPath)

			// Set the redirect parameter - do not double encode as the login page will handle it
			loginUrl.searchParams.set('redirect', redirectPath)

			console.log('OAuth2Authorize: Final login URL:', loginUrl.toString())

			// Use window.location.href for navigation to preserve all parameters
			window.location.href = loginUrl.toString()
			return
		}

		// Validate redirect_uri to prevent loops
		const redirectUri = oauth2Params.redirect_uri

		if (redirectUri && (redirectUri.includes('/login') || redirectUri.includes('/oauth2/authorize'))) {
			console.warn('OAuth2Authorize: redirect_uri points to auth pages, potential loop detected')
			setRedirectError('Invalid redirect URI: cannot redirect back to authentication pages')
			return
		}

		// Don't auto-authorize anymore - show authorization details first
		// This allows users to see what they're authorizing
	}, [isAuthenticated, loading, oauth2Params, searchParams])

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
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<Card className='w-full max-w-md shadow-lg'>
					<CardHeader>
						<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted border'>
							<Skeleton className='h-6 w-6 rounded' />
						</div>
						<Skeleton className='h-6 w-3/4 mx-auto rounded-lg' />
						<Skeleton className='h-4 w-full mx-auto mt-2 rounded-lg' />
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='bg-muted rounded-lg p-4'>
								<Skeleton className='h-4 w-20 mb-2 rounded' />
								<Skeleton className='h-5 w-48 rounded' />
							</div>
							<Skeleton className='h-4 w-full rounded' />
							<Skeleton className='h-4 w-2/3 rounded' />
							<div className='flex gap-3'>
								<Skeleton className='h-10 flex-1 rounded-lg' />
								<Skeleton className='h-10 flex-1 rounded-lg' />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Show error state
	if (redirectError) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<Card className='w-full max-w-md shadow-lg border-destructive/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 text-destructive'>
							<div className='p-2 rounded-full bg-destructive/10 border border-destructive/20'>
								<AlertTriangle className='h-5 w-5 text-destructive' />
							</div>
							Authorization Error
						</CardTitle>
						<CardDescription className='text-muted-foreground'>There was a problem with your authorization request</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert className='border-destructive/20 bg-destructive/5'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription className='text-destructive font-medium'>{redirectError}</AlertDescription>
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

	// Show authorization prompt
	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			<Card className='w-full max-w-md shadow-lg'>
				<CardHeader className='text-center'>
					<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20'>
						<Shield className='h-6 w-6 text-primary' />
					</div>
					<CardTitle className='text-xl'>Authorization Request</CardTitle>
					<CardDescription>{authorizationDetails?.clientName || 'An application'} wants to access your account</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* User Info */}
					<div className='rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4'>
						<p className='text-sm text-emerald-700 dark:text-emerald-300 font-medium'>Signed in as</p>
						<p className='font-semibold text-emerald-900 dark:text-emerald-100'>{user?.email}</p>
					</div>

					{/* Client Info */}
					{authorizationDetails && (
						<div className='space-y-4'>
							<div>
								<h3 className='font-semibold mb-3 text-foreground'>Application Details</h3>
								<div className='flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors'>
									{authorizationDetails.clientLogo ? (
										<Image src={authorizationDetails.clientLogo} alt={authorizationDetails.clientName || 'Client logo'} width={32} height={32} className='h-8 w-8 rounded' />
									) : (
										<div className='h-8 w-8 rounded bg-muted flex items-center justify-center'>
											<ExternalLink className='h-4 w-4 text-muted-foreground' />
										</div>
									)}
									<div>
										<p className='font-semibold text-foreground'>{authorizationDetails.clientName}</p>
										<p className='text-sm text-muted-foreground'>OAuth2 Application</p>
									</div>
								</div>
							</div>

							{/* Requested Permissions */}
							<div>
								<h3 className='font-semibold mb-3 text-foreground'>Requested Permissions</h3>
								<div className='space-y-2'>
									{authorizationDetails.requestedScopes.map((scope) => (
										<div key={scope} className='flex items-center gap-3 text-sm bg-primary/5 border border-primary/20 rounded-lg p-3'>
											<CheckCircle className='h-4 w-4 text-primary' />
											<span className='text-foreground font-medium'>{scope}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Redirect URI Info */}
					{oauth2Params?.redirect_uri && (
						<div className='text-xs text-muted-foreground bg-muted p-3 rounded-lg'>
							<p className='font-medium text-foreground mb-1'>Will redirect to:</p>
							<p className='text-muted-foreground break-all'>{oauth2Params.redirect_uri}</p>
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
					<div className='text-xs text-muted-foreground text-center bg-muted rounded-lg p-3'>
						<div className='flex items-center justify-center gap-2 mb-1'>
							<Shield className='h-3 w-3 text-muted-foreground' />
							<span className='font-medium text-foreground'>Security Notice</span>
						</div>
						By clicking Allow, you authorize this application to access your account information as specified above.
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function OAuth2AuthorizePage() {
	return (
		<Suspense fallback={
			<div className='flex min-h-screen items-center justify-center bg-background'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading authorization details...</p>
				</div>
			</div>
		}>
			<OAuth2AuthorizeContent />
		</Suspense>
	)
}
