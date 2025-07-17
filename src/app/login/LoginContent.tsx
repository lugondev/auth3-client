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

export function LoginContent() {
	const {isAuthenticated, loading} = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [showPasswordlessForm, setShowPasswordlessForm] = useState(false)
	const [isRedirecting, setIsRedirecting] = useState(false)

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

		console.log('LoginContent: Extracted OAuth2 params:', params)
		console.log('LoginContent: All searchParams:', Object.fromEntries(searchParams.entries()))

		return Object.keys(params).length > 0 ? params : null
	}, [searchParams])

	// Get all search parameters for preservation
	const allSearchParams = useMemo(() => {
		return Object.fromEntries(searchParams.entries())
	}, [searchParams])

	// Handle post-login redirect
	useEffect(() => {
		if (loading) {
			console.log('LoginContent: Still loading, skipping redirect logic')
			return
		}

		// Only redirect if user just became authenticated (not on initial load)
		if (isAuthenticated && !isRedirecting) {
			console.log('LoginContent: Authenticated user, checking redirect options')

			setIsRedirecting(true)
			const redirectPath = searchParams.get('redirect')

			// Add timeout to reset redirecting state if redirect fails
			setTimeout(() => {
				setIsRedirecting(false)
			}, 5000)

			if (redirectPath) {
				console.log('LoginContent: Found redirect path:', redirectPath)
				console.log('LoginContent: Redirecting to:', redirectPath)

				// Handle redirect path - should be a relative path with query parameters
				try {
					// If it's a relative path starting with /, construct full URL
					if (redirectPath.startsWith('/')) {
						const fullRedirectUrl = window.location.origin + redirectPath
						console.log('LoginContent: Constructed redirect URL:', fullRedirectUrl)
						window.location.href = fullRedirectUrl
					} else {
						// If it's already a full URL, use it directly
						console.log('LoginContent: Using redirect path as is:', redirectPath)
						window.location.href = redirectPath
					}
				} catch (error) {
					console.error('LoginContent: Error constructing redirect URL:', error)
					// Fallback to relative path
					window.location.href = redirectPath
				}
			} else if (oauth2Params && oauth2Params.client_id) {
				console.log('LoginContent: OAuth2 params detected, redirecting to authorization page')

				// Redirect to OAuth2 authorization page with ALL parameters preserved
				const authUrl = new URL('/oauth2/authorize', window.location.origin)
				Object.entries(allSearchParams).forEach(([key, value]) => {
					authUrl.searchParams.set(key, value)
				})

				console.log('LoginContent: Redirecting to authorize with URL:', authUrl.toString())
				window.location.href = authUrl.toString()
			} else {
				console.log('LoginContent: No redirect path, going to dashboard')
				router.replace('/dashboard/profile')
			}
		}
	}, [isAuthenticated, loading, router, oauth2Params, allSearchParams, searchParams, isRedirecting])

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
					<p className='text-muted-foreground'>Redirecting...</p>
				</div>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen items-center justify-center'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<CardTitle>Login</CardTitle>
					<CardDescription>Choose a provider to sign in</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<LoginButtons />
					<div className='relative my-4'>
						<Separator />
						<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-card px-2 text-xs text-muted-foreground'>OR CONTINUE WITH</span>
					</div>
					{showPasswordlessForm ? <PasswordlessLoginForm onLinkSent={() => setShowPasswordlessForm(false)} /> : <LoginForm />}
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
