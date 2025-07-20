'use client'

import React, {useEffect, useState} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {AnalyticsService, PersonalDashboardAnalytics} from '@/services/analyticsService'
import {getCurrentUser} from '@/services/userService'
import {UserOutput} from '@/types/user'
import {DIDWidget} from '@/components/dashboard/DIDWidget'
import {CredentialWidget} from '@/components/dashboard/CredentialWidget'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'
import {Activity, Shield, Clock, CheckCircle, AlertTriangle, Smartphone, Building2, Globe, Users, Database, Star, BarChart3} from 'lucide-react'

const quickActions = [
	{
		title: 'Analytics Dashboard',
		description: 'View detailed authentication analytics',
		href: '/dashboard/auth/analytics',
		icon: BarChart3,
		color: 'text-blue-600',
		roles: ['user', 'admin', 'system_admin'],
	},
	{
		title: 'Credentials',
		description: 'Manage your digital credentials',
		href: '/dashboard/credentials',
		icon: Database,
		color: 'text-purple-600',
		roles: ['user', 'admin', 'system_admin'],
	},
	{
		title: 'Templates',
		description: 'Credential templates library',
		href: '/dashboard/templates',
		icon: Star,
		color: 'text-yellow-600',
		roles: ['user', 'admin', 'system_admin'],
	},
	{
		title: 'QR Scanner',
		description: 'Scan QR codes for authentication',
		href: '/qr-scanner',
		icon: Smartphone,
		color: 'text-green-600',
		roles: ['user', 'admin', 'system_admin'],
	},
]

export default function UserDashboardPage() {
	const {user, isSystemAdmin, loading, currentMode, currentTenantId, isAuthenticated} = useAuth()
	const [analytics, setAnalytics] = useState<PersonalDashboardAnalytics | null>(null)
	const [userDetails, setUserDetails] = useState<UserOutput | null>(null)

	// Check if user has required role for action
	const hasRole = (requiredRoles: string[]) => {
		if (!user?.roles) return false
		return requiredRoles.some((role) => user.roles?.includes(role))
	}

	// Get greeting based on time of day
	const getGreeting = () => {
		const hour = new Date().getHours()
		if (hour < 12) return 'Good morning'
		if (hour < 17) return 'Good afternoon'
		return 'Good evening'
	}

	// Get user display name
	const getDisplayName = () => {
		if (user?.first_name) {
			return user.first_name
		}
		return user?.email?.split('@')[0] || 'User'
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Load user details for verification status
				const userResponse = await getCurrentUser()
				setUserDetails(userResponse)

				// Load analytics
				const data = await AnalyticsService.getPersonalDashboardAnalytics()
				setAnalytics(data)
			} catch (error) {
				console.error('Failed to fetch dashboard data:', error)
			}
		}

		if (user && !loading) {
			fetchData()
		}
	}, [user, loading, currentMode])

	if (loading) {
		return (
			<div className='container mx-auto p-4 md:p-6'>
				<Skeleton className='mb-8 h-10 w-48' />
				<Card className='mb-8'>
					<CardHeader>
						<Skeleton className='h-8 w-40' />
					</CardHeader>
					<CardContent className='space-y-4'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-3/4' />
						<Skeleton className='h-4 w-1/2' />
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!isAuthenticated) {
		return (
			<div className='container mx-auto p-4 md:p-6'>
				<Card className='max-w-md mx-auto'>
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
						<CardDescription>Please sign in to access your dashboard</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className='w-full'>
							<Link href='/auth/signin'>Sign In</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// ProtectedWrapper ensures user is available
	if (!user) return null

	return (
		<div className='container mx-auto p-4 md:p-6'>
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold text-gray-800 dark:text-gray-100'>
						{getGreeting()}, {getDisplayName()}!
					</h1>
					<p className='text-muted-foreground mt-1'>Your personal analytics and metrics dashboard</p>
				</div>
				<div className='flex items-center gap-3'>
					<TenantSelector variant='dropdown' showGlobalOption={true} />
					<ContextSwitcher variant='dropdown' size='sm' />
				</div>
			</div>

			{/* Key Metrics Overview */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Activity className='h-8 w-8 text-blue-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Total Logins</p>
								<p className='text-2xl font-bold'>{analytics?.total_logins || 0}</p>
								<p className='text-xs text-muted-foreground'>All time</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Clock className='h-8 w-8 text-green-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Recent Logins</p>
								<p className='text-2xl font-bold'>{analytics?.recent_logins || 0}</p>
								<p className='text-xs text-muted-foreground'>Last 30 days</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Smartphone className='h-8 w-8 text-purple-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Active Sessions</p>
								<p className='text-2xl font-bold'>{analytics?.active_sessions || 0}</p>
								<p className='text-xs text-muted-foreground'>Currently active</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Shield className='h-8 w-8 text-orange-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Security Events</p>
								<p className='text-2xl font-bold'>{analytics?.security_events || 0}</p>
								<p className='text-xs text-muted-foreground'>Recent alerts</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Account Status and Context */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							{currentMode === 'global' ? <Globe className='h-8 w-8 text-blue-600' /> : <Building2 className='h-8 w-8 text-green-600' />}
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Current Context</p>
								<p className='text-2xl font-bold'>{currentMode === 'global' ? 'Global' : 'Tenant'}</p>
								{currentMode === 'tenant' && currentTenantId && <p className='text-xs text-muted-foreground font-mono'>{currentTenantId}</p>}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Users className='h-8 w-8 text-purple-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Active Roles</p>
								<p className='text-2xl font-bold'>{user?.roles?.length || 0}</p>
								<div className='flex flex-wrap gap-1 mt-1'>
									{user?.roles?.slice(0, 2).map((role) => (
										<Badge key={role} variant='outline' className='text-xs'>
											{role}
										</Badge>
									))}
									{user?.roles && user.roles.length > 2 && (
										<Badge variant='outline' className='text-xs'>
											+{user.roles.length - 2}
										</Badge>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Shield className='h-8 w-8 text-red-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Account Status</p>
								<div className='flex items-center gap-2'>
									<CheckCircle className='h-5 w-5 text-green-600' />
									<p className='text-lg font-bold'>Active</p>
								</div>
								<p className='text-xs text-muted-foreground'>{user?.roles?.includes('system_admin') ? 'System Admin' : 'Standard User'}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			{quickActions.filter((action) => hasRole(action.roles)).length > 0 && (
				<Card className='mb-8'>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Access your most used features and tools</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							{quickActions
								.filter((action) => hasRole(action.roles))
								.map((action) => {
									const Icon = action.icon
									return (
										<Link key={action.href} href={action.href}>
											<Card className='transition-all hover:shadow-md hover:scale-105 cursor-pointer'>
												<CardContent className='p-4'>
													<div className='flex items-start gap-3'>
														<Icon className={`h-6 w-6 ${action.color} mt-1`} />
														<div className='flex-1'>
															<h3 className='font-medium'>{action.title}</h3>
															<p className='text-sm text-muted-foreground mt-1'>{action.description}</p>
														</div>
													</div>
												</CardContent>
											</Card>
										</Link>
									)
								})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Account Security Status */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle>Security Status</CardTitle>
					<CardDescription>Your account security metrics and verification status</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 md:grid-cols-3'>
						<div className='flex items-center space-x-2'>
							{userDetails?.is_email_verified ? <CheckCircle className='h-5 w-5 text-green-500' /> : <AlertTriangle className='h-5 w-5 text-yellow-500' />}
							<span className='text-sm'>Email {userDetails?.is_email_verified ? 'Verified' : 'Not Verified'}</span>
							{userDetails?.email_verified_at && (
								<span className='text-xs text-muted-foreground'>
									({new Date(userDetails.email_verified_at).toLocaleDateString()})
								</span>
							)}
						</div>
						<div className='flex items-center space-x-2'>
							{userDetails?.is_phone_verified ? <CheckCircle className='h-5 w-5 text-green-500' /> : <AlertTriangle className='h-5 w-5 text-yellow-500' />}
							<span className='text-sm'>Phone {userDetails?.is_phone_verified ? 'Verified' : 'Not Configured'}</span>
							{userDetails?.phone_verified_at && (
								<span className='text-xs text-muted-foreground'>
									({new Date(userDetails.phone_verified_at).toLocaleDateString()})
								</span>
							)}
						</div>
						<div className='flex items-center space-x-2'>
							{userDetails?.is_two_factor_enabled ? <CheckCircle className='h-5 w-5 text-green-500' /> : <AlertTriangle className='h-5 w-5 text-yellow-500' />}
							<span className='text-sm'>2FA {userDetails?.is_two_factor_enabled ? 'Enabled' : 'Not Configured'}</span>
						</div>
					</div>
					{!userDetails && (
						<div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md'>
							<p className='text-sm text-blue-700 dark:text-blue-300'>
								<strong>Loading verification status...</strong>
							</p>
						</div>
					)}
					{userDetails && (
						<div className='mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
								<div>
									<strong>Account Status:</strong> 
									<span className={`ml-2 capitalize ${userDetails.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
										{userDetails.status}
									</span>
								</div>
								<div>
									<strong>Phone Number:</strong> 
									<span className='ml-2 text-muted-foreground'>
										{userDetails.phone || 'Not provided'}
									</span>
								</div>
								<div>
									<strong>Account Created:</strong> 
									<span className='ml-2 text-muted-foreground'>
										{new Date(userDetails.created_at).toLocaleDateString()}
									</span>
								</div>
								<div>
									<strong>Last Updated:</strong> 
									<span className='ml-2 text-muted-foreground'>
										{new Date(userDetails.updated_at).toLocaleDateString()}
									</span>
								</div>
							</div>
						</div>
					)}
					{analytics?.last_login && <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>Last login: {new Date(analytics.last_login).toLocaleString()}</div>}
				</CardContent>
			</Card>

			{/* DID and Credentials Overview */}
			<div className='mb-8'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>Identity & Credentials</h2>
				<div className='grid gap-6 md:grid-cols-2'>
					<DIDWidget />
					<CredentialWidget />
				</div>
			</div>

			{/* Personal Information */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
					<CardDescription>Your personal account details and profile</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{userDetails ? (
							<>
								<div className='flex items-center gap-3 mb-4'>
									{userDetails.avatar && (
										<Image 
											src={userDetails.avatar} 
											alt="Profile Avatar"
											width={64}
											height={64}
											className='rounded-full object-cover border-2 border-gray-200 dark:border-gray-700'
											unoptimized
										/>
									)}
									<div>
										<p className='text-lg font-semibold'>
											{userDetails.first_name || userDetails.last_name ? 
												`${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() : 
												userDetails.email?.split('@')[0] || 'User'
											}
										</p>
										<p className='text-sm text-muted-foreground'>{userDetails.email}</p>
									</div>
								</div>
								
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
									<div>
										<strong>Full Name:</strong> 
										<span className='ml-2'>
											{userDetails.first_name || userDetails.last_name ? 
												`${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() : 
												'Not provided'
											}
										</span>
									</div>
									<div>
										<strong>Email:</strong> 
										<span className='ml-2'>{userDetails.email}</span>
									</div>
									<div>
										<strong>User ID:</strong> 
										<span className='ml-2 font-mono text-xs'>{userDetails.id}</span>
									</div>
									<div>
										<strong>Roles:</strong> 
										<span className='ml-2'>
											{userDetails.roles && userDetails.roles.length > 0 ? 
												userDetails.roles.join(', ') : 
												'No roles assigned'
											}
										</span>
									</div>
									<div>
										<strong>Phone:</strong> 
										<span className='ml-2'>{userDetails.phone || 'Not provided'}</span>
									</div>
									<div>
										<strong>Account Status:</strong> 
										<span className={`ml-2 capitalize ${userDetails.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
											{userDetails.status}
										</span>
									</div>
								</div>
								
								{userDetails.profile && (
									<div className='mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md'>
										<h4 className='font-medium mb-2'>Profile Details</h4>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
											{userDetails.profile.bio && (
												<div className='md:col-span-2'>
													<strong>Bio:</strong> 
													<span className='ml-2'>{userDetails.profile.bio}</span>
												</div>
											)}
											{userDetails.profile.address && (
												<div>
													<strong>Address:</strong> 
													<span className='ml-2'>{userDetails.profile.address}</span>
												</div>
											)}
											{userDetails.profile.date_of_birth && (
												<div>
													<strong>Date of Birth:</strong> 
													<span className='ml-2'>{new Date(userDetails.profile.date_of_birth).toLocaleDateString()}</span>
												</div>
											)}
										</div>
									</div>
								)}
							</>
						) : (
							<div className='space-y-2 text-gray-700 dark:text-gray-300'>
								<p>
									<strong>Name:</strong> {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || user.email || 'N/A'}
								</p>
								<p>
									<strong>Email:</strong> {user.email || 'N/A'}
								</p>
								<p>
									<strong>User ID:</strong> {user.id}
								</p>
							</div>
						)}
						
						{isSystemAdmin && (
							<div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
								<Badge variant='destructive' className='mr-2'>
									System Administrator
								</Badge>
								<Button asChild variant='outline' size='sm'>
									<Link href='/dashboard/admin/dashboard'>Admin Panel</Link>
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
