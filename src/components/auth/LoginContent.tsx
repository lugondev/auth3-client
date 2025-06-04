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

	useEffect(() => {
		if (!loading && isAuthenticated) {
			// If OAuth2 flow, handle the callback
			if (oauth2Params && oauth2Params.client_id && oauth2Params.redirect_uri) {
				// For OAuth2 flow, we need to redirect to the authorization endpoint
				// with an authorization code after successful authentication
				const authParams = new URLSearchParams(oauth2Params)
				router.replace(`/api/v1/oauth2/authorize?${authParams.toString()}`)
				return
			}

			const redirectPath = searchParams.get('redirect')
			if (redirectPath) {
				router.replace(redirectPath)
			} else {
				router.replace('/dashboard/profile')
			}
		}
	}, [isAuthenticated, loading, router, searchParams, oauth2Params])

	if (loading || isAuthenticated) {
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
