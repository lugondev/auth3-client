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
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
			{/* Hero Section */}
			<div className='container mx-auto px-4 py-16'>
				<div className='text-center mb-16'>
					<div className='flex items-center justify-center gap-3 mb-6'>
						<div className='relative'>
							<Shield className='h-14 w-14 text-blue-600 dark:text-blue-400' />
							<div className='absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse' />
						</div>
						<h1 className='text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent'>Auth3 System</h1>
					</div>
					<p className='text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed'>
						Enterprise-grade authentication & identity management with
						<span className='font-semibold text-blue-600 dark:text-blue-400'> DID technology</span>,<span className='font-semibold text-purple-600 dark:text-purple-400'> OAuth2/OIDC</span>, and
						<span className='font-semibold text-cyan-600 dark:text-cyan-400'> multi-tenant RBAC</span>
					</p>
				</div>

				{/* Quick Actions */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16'>
					<Card className='group border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm'>
						<CardHeader className='text-center pb-4'>
							<div className='h-12 w-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
								<List className='h-6 w-6 text-blue-600 dark:text-blue-400' />
							</div>
							<CardTitle className='text-slate-800 dark:text-slate-200'>DID Management</CardTitle>
							<CardDescription className='text-slate-600 dark:text-slate-400'>Manage decentralized identities and credentials</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'>
								<Link href='/dashboard/did'>Manage DIDs</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='group border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100 dark:hover:shadow-purple-900/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm'>
						<CardHeader className='text-center pb-4'>
							<div className='h-12 w-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
								<Plus className='h-6 w-6 text-purple-600 dark:text-purple-400' />
							</div>
							<CardTitle className='text-slate-800 dark:text-slate-200'>OAuth2 Apps</CardTitle>
							<CardDescription className='text-slate-600 dark:text-slate-400'>Create and manage OAuth2 applications</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700'>
								<Link href='/dashboard/oauth2'>Manage Apps</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='group border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-100 dark:hover:shadow-cyan-900/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm'>
						<CardHeader className='text-center pb-4'>
							<div className='h-12 w-12 mx-auto mb-3 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
								<Send className='h-6 w-6 text-cyan-600 dark:text-cyan-400' />
							</div>
							<CardTitle className='text-slate-800 dark:text-slate-200'>Presentations</CardTitle>
							<CardDescription className='text-slate-600 dark:text-slate-400'>Submit verifiable presentations</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700'>
								<Link href='/presentation-requests'>Presentations</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className='group border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-teal-950/50 backdrop-blur-sm'>
						<CardHeader className='text-center pb-4'>
							<div className='h-12 w-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
								<div className='text-2xl'>🚀</div>
							</div>
							<CardTitle className='text-emerald-800 dark:text-emerald-200'>Live Demo</CardTitle>
							<CardDescription className='text-emerald-700 dark:text-emerald-300'>Try the interactive Auth3 demo</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild className='w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg'>
								<Link href='/demo/presentation'>Try Demo</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Login Section */}
				<div className='max-w-md mx-auto'>
					<Card className='border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50'>
						<CardHeader className='text-center pb-6'>
							<CardTitle className='text-2xl text-slate-800 dark:text-slate-200'>Welcome Back</CardTitle>
							<CardDescription className='text-slate-600 dark:text-slate-400'>Sign in to access your Auth3 dashboard</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<LoginButtons />
							<div className='relative my-6'>
								<Separator className='bg-slate-200 dark:bg-slate-700' />
								<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-white dark:bg-slate-800 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium'>OR CONTINUE WITH EMAIL</span>
							</div>
							<LoginForm />
							<div className='mt-6 text-center text-sm space-y-2'>
								<div>
									<Link href='/forgot-password' className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-colors'>
										Forgot your password?
									</Link>
								</div>
								<div className='text-slate-600 dark:text-slate-400'>
									Don{'\u0027'}t have an account?{' '}
									<Link href='/register' className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 font-medium transition-colors'>
										Create account
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
