'use client'

import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {LoginButtons} from '@/components/auth/LoginButtons'
import {LoginForm} from '@/components/auth/LoginForm'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {Skeleton} from '@/components/ui/skeleton'
import {Shield, Send, Plus, List} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
	const {isAuthenticated, loading} = useAuth()
	const router = useRouter()

	useEffect(() => {
		// Redirect if authenticated and not loading
		if (!loading && isAuthenticated) {
			router.replace('/dashboard/profile') // Use replace to avoid adding login page to history
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
		<div className='min-h-screen bg-gray-50'>
			{/* Hero Section */}
			<div className='container mx-auto px-4 py-16'>
				<div className='text-center mb-16'>
					<div className='flex items-center justify-center gap-2 mb-4'>
						<Shield className='h-12 w-12 text-primary' />
						<h1 className='text-4xl font-bold'>Auth3 Presentation Manager</h1>
					</div>
					<p className='text-xl text-gray-600 max-w-2xl mx-auto'>
						Complete system for managing verifiable credential presentations. 
						Create requests, share via QR codes, and verify submissions.
					</p>
				</div>

				{/* Quick Actions */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-16'>
					<Card className='border-2 hover:border-primary/20 transition-colors'>
						<CardHeader className='text-center'>
							<List className='h-8 w-8 text-primary mx-auto mb-2' />
							<CardTitle>Manage Requests</CardTitle>
							<CardDescription>
								View and manage your presentation requests
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full'>
								<Link href='/presentation-requests'>
									Go to Requests
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='border-2 hover:border-primary/20 transition-colors'>
						<CardHeader className='text-center'>
							<Plus className='h-8 w-8 text-primary mx-auto mb-2' />
							<CardTitle>Create Request</CardTitle>
							<CardDescription>
								Create a new presentation request
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full' variant='outline'>
								<Link href='/presentation-requests?view=create'>
									Create New
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='border-2 hover:border-primary/20 transition-colors'>
						<CardHeader className='text-center'>
							<Send className='h-8 w-8 text-primary mx-auto mb-2' />
							<CardTitle>Submit Presentation</CardTitle>
							<CardDescription>
								Submit a verifiable presentation
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full' variant='outline'>
								<Link href='/submit-presentation'>
									Submit Now
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='border-2 hover:border-green-500/20 transition-colors bg-gradient-to-br from-green-50 to-green-100'>
						<CardHeader className='text-center'>
							<div className='h-8 w-8 text-green-600 mx-auto mb-2 flex items-center justify-center text-lg font-bold'>
								🚀
							</div>
							<CardTitle className='text-green-800'>VP Demo</CardTitle>
							<CardDescription className='text-green-700'>
								Interactive presentation flow demo
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full bg-green-600 hover:bg-green-700 text-white'>
								<Link href='/demo/presentation'>
									Try Demo
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Login Section */}
				<div className='max-w-md mx-auto'>
					<Card>
						<CardHeader className='text-center'>
							<CardTitle>Login</CardTitle>
							<CardDescription>Choose a provider to sign in</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<LoginButtons />
							<div className='relative my-4'>
								<Separator />
								<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-card px-2 text-xs text-muted-foreground'>
									OR CONTINUE WITH
								</span>
							</div>
							<LoginForm />
							<div className='mt-4 text-center text-sm space-y-1'>
								<div>
									<Link href='/forgot-password' className='underline'>
										Forgot your password?
									</Link>
								</div>
								<div>
									Don{'\u0027'}t have an account?{' '}
									<Link href='/register' className='underline'>
										Register
									</Link>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
