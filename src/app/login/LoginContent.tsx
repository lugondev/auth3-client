'use client'

import {useEffect, useState, useMemo} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {LoginButtons} from '@/components/auth/LoginButtons'
import {LoginForm} from '@/components/auth/LoginForm'
import {PasswordlessLoginForm} from '@/components/auth/PasswordlessLoginForm'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Skeleton} from '@/components/ui/skeleton'
import Link from 'next/link'
import {handleOAuth2Authorization} from '@/services/oauth2Service'

export function LoginContent() {
	const {isAuthenticated, loading} = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [showPasswordlessForm, setShowPasswordlessForm] = useState(false)
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [redirectError, setRedirectError] = useState<string | null>(null)

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

	// Handle post-login redirect only
	useEffect(() => {
		if (loading) {
			console.log('LoginContent: Still loading, skipping redirect logic')
			return
		}

		// Only redirect if user just became authenticated (not on initial load)
		// This prevents immediate redirect when user visits login page with query params
		if (isAuthenticated) {
			// Reset redirect error when starting new redirect attempt
			setRedirectError(null)

			console.log('LoginContent useEffect:', {
				isAuthenticated,
				loading,
				oauth2Params: !!oauth2Params,
				oauth2ParamsDetails: oauth2Params,
				hasRedirectParam: !!searchParams.get('redirect'),
				currentUrl: window.location.href,
				appUrl: process.env.NEXT_PUBLIC_APP_URL,
				origin: window.location.origin,
			})

			if (oauth2Params && oauth2Params.client_id && oauth2Params.redirect_uri) {
				// Handle OAuth2 authorization flow after successful login
				console.log('LoginContent: Authenticated user with OAuth2 params, redirecting to authorization')

				// Check if redirect_uri points back to login page to prevent loop
				const currentOrigin = window.location.origin
				const currentPath = window.location.pathname
				const redirectUri = oauth2Params.redirect_uri

				// If redirect_uri points to current login page, it would create a loop
				if (redirectUri.includes('/login') || redirectUri === `${currentOrigin}${currentPath}`) {
					console.warn('LoginContent: redirect_uri points to login page, potential loop detected')
					setRedirectError('Invalid redirect URI: cannot redirect back to login page')
					return
				}

				setIsRedirecting(true)

				// Use the original redirect_uri from OAuth2 params
				const originalRedirectUri = oauth2Params.redirect_uri

				// Handle OAuth2 authorization using service function
				handleOAuth2Authorization(oauth2Params, originalRedirectUri)
					.then((redirectUrl) => {
						window.location.href = redirectUrl
					})
					.catch((error) => {
						console.error('Error in OAuth2 authorization:', error)
						setIsRedirecting(false)
						setRedirectError('Failed to authorize. Please try again.')
					})
				return
			}

			// Regular authentication flow - redirect to dashboard or specified redirect path
			console.log('LoginContent: Authenticated user, redirecting to dashboard or redirect path')
			setIsRedirecting(true)
			const redirectPath = searchParams.get('redirect')
			if (redirectPath) {
				router.replace(redirectPath)
			} else {
				router.replace('/dashboard/profile')
			}
		}
	}, [isAuthenticated, loading, router, oauth2Params, searchParams])

	// Add timeout for OAuth2 redirect to prevent infinite loading
	useEffect(() => {
		if (isRedirecting && oauth2Params) {
			const timeout = setTimeout(() => {
				console.error('OAuth2 redirect timeout')
				setIsRedirecting(false)
				setRedirectError('Redirect timeout. Please try logging in again.')
			}, 10000) // 10 seconds timeout

			return () => clearTimeout(timeout)
		}
	}, [isRedirecting, oauth2Params])

	// Show loading skeleton while checking auth status
	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<div className='w-full max-w-md space-y-4'>
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-px w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
				</div>
			</div>
		)
	}

	// Show redirect loading only when actively redirecting
	if (isRedirecting) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
					<p className='text-muted-foreground'>{oauth2Params ? 'Redirecting to authorization...' : 'Redirecting...'}</p>
				</div>
			</div>
		)
	}

	// Show error if redirect failed
	if (redirectError) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center'>
						<CardTitle className='text-red-600'>Redirect Failed</CardTitle>
						<CardDescription>{redirectError}</CardDescription>
					</CardHeader>
					<CardContent>
						<button
							onClick={() => {
								setRedirectError(null)
								setIsRedirecting(false)
							}}
							className='w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md'>
							Try Again
						</button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// If authenticated and no query params, show login form (user can stay on login page)
	// Redirect only happens after successful login action, not on page load

	return (
		<div className='flex min-h-screen items-center justify-center'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<CardTitle>Login</CardTitle>
					<CardDescription>Choose a provider to sign in</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<LoginButtons oauth2Params={oauth2Params} />
					<div className='relative my-4'>
						<Separator />
						<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-card px-2 text-xs text-muted-foreground'>OR CONTINUE WITH</span>
					</div>
					{showPasswordlessForm ? <PasswordlessLoginForm onLinkSent={() => setShowPasswordlessForm(false)} oauth2Params={oauth2Params} /> : <LoginForm oauth2Params={oauth2Params} />}
					<div className='mt-4 text-center text-sm space-y-1'>
						<button onClick={() => setShowPasswordlessForm(!showPasswordlessForm)} className='text-sm underline hover:text-primary'>
							{showPasswordlessForm ? 'Login with Password' : 'Login with Email Link (Passwordless)'}
						</button>
						<div>
							<Link href='/forgot-password' className='underline'>
								Forgot your password?
							</Link>
						</div>
						<div>
							Don&apos;t have an account?{' '}
							<Link href='/register' className='underline'>
								Register
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}