'use client' // Make it a client component

import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {LoginButtons} from '@/components/auth/LoginButtons'
import {LoginForm} from '@/components/auth/LoginForm'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Skeleton} from '@/components/ui/skeleton' // Import Skeleton for loading state

export default function Home() {
	const {isAuthenticated, loading} = useAuth()
	const router = useRouter()

	useEffect(() => {
		// Redirect if authenticated and not loading
		if (!loading && isAuthenticated) {
			router.replace('/protected/profile') // Use replace to avoid adding login page to history
		}
	}, [isAuthenticated, loading, router])

	// Show loading skeleton while checking auth state or redirecting
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

	// Only render login form if not authenticated and not loading
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<CardTitle>Login</CardTitle>
					<CardDescription>Choose a provider to sign in</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{' '}
					{/* Add spacing */}
					<LoginButtons />
					<div className='relative my-4'>
						{' '}
						{/* Divider with text */}
						<Separator />
						<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-card px-2 text-xs text-muted-foreground'>OR CONTINUE WITH</span>
					</div>
					<LoginForm /> {/* Add LoginForm */}
				</CardContent>
			</Card>
		</div>
	)
}
