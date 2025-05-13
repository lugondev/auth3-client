'use client'

import {useEffect, useState, Suspense} from 'react'
import {useSearchParams, useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {verifyLoginLink} from '@/services/authService' // Import specific function
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Loader2} from 'lucide-react'
import axios, {AxiosError} from 'axios' // Import axios and AxiosError

function VerifyLoginPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const {handleAuthSuccess} = useAuth() // Use handleAuthSuccess
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const token = searchParams.get('token')
		// const tenantSlug = searchParams.get('tenant_slug'); // Optional, currently unused

		if (!token) {
			setError('Login token not found in URL.')
			setIsLoading(false)
			return
		}

		const verifyToken = async () => {
			try {
				setMessage('Verifying your login link...')
				setIsLoading(true)
				const response = await verifyLoginLink({token}) // Use imported function

				if (response && response.auth) {
					// Check for auth object in LoginOutput
					await handleAuthSuccess(response.auth) // Pass AuthResult
					setMessage('Login successful! Redirecting...')
					router.push('/dashboard') // Adjust as needed
				} else {
					// This case might occur if LoginOutput is returned but auth is null (e.g. 2FA required, though not expected for verify-link)
					// Or if the response structure is not as expected.
					console.error('Login link verification response did not contain auth details:', response)
					throw new Error('Invalid response from server during login link verification.')
				}
			} catch (err: unknown) {
				// Use unknown for better type safety
				console.error('Login link verification failed:', err)
				let errorMessage = 'Login failed. The link might be invalid or expired.'
				if (axios.isAxiosError(err)) {
					const axiosError = err as AxiosError<{message?: string}> // More specific type
					if (axiosError.response?.data?.message) {
						errorMessage = axiosError.response.data.message
					}
				} else if (err instanceof Error) {
					errorMessage = err.message
				}
				setError(errorMessage)
				setMessage(null)
			} finally {
				setIsLoading(false)
			}
		}

		verifyToken()
	}, [searchParams, router, handleAuthSuccess])

	return (
		<div className='flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle className='text-center text-2xl'>Verifying Login</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{isLoading && (
						<div className='flex flex-col items-center justify-center space-y-2'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
							<p className='text-muted-foreground'>{message || 'Processing...'}</p>
						</div>
					)}
					{!isLoading && error && (
						<Alert variant='destructive'>
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{!isLoading && !error && message && (
						<Alert variant='default'>
							<AlertTitle>Status</AlertTitle>
							<AlertDescription>{message}</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

export default function VerifyLoginPage() {
	return (
		<Suspense
			fallback={
				<div className='flex items-center justify-center min-h-screen'>
					<Loader2 className='h-12 w-12 animate-spin text-primary' />
				</div>
			}>
			<VerifyLoginPageContent />
		</Suspense>
	)
}
