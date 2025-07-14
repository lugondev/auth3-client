'use client'

import React, {useEffect, useState} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Separator} from '@/components/ui/separator'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsService, PersonalDashboardAnalytics} from '@/services/analyticsService'
import {DIDWidget} from '@/components/dashboard/DIDWidget'
import {CredentialWidget} from '@/components/dashboard/CredentialWidget'
import {RecentActivityWidget} from '@/components/dashboard/RecentActivityWidget'
import {ContextDashboard} from '@/components/context/ContextDashboard'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'
import {
	Activity,
	Shield,
	Clock,
	CheckCircle,
	AlertTriangle,
	Smartphone,
	Building2,
	Globe,
	Users,
	Crown,
	Key,
	Database,
	ArrowRight,
	Star,
	Zap,
} from 'lucide-react'

const quickActions = [
	{
		title: 'Tenant Management',
		description: 'Create and manage your organizations',
		href: '/dashboard/admin/tenants',
		icon: Building2,
		color: 'text-green-600',
		roles: ['admin', 'system_admin'],
	},
	{
		title: 'User Management',
		description: 'Manage users across contexts',
		href: '/dashboard/admin/users',
		icon: Users,
		color: 'text-blue-600',
		roles: ['admin', 'system_admin'],
	},
	{
		title: 'Credentials',
		description: 'Issue and verify credentials',
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
]

export default function UserDashboardPage() {
	const {user, isSystemAdmin, loading, currentMode, currentTenantId, isAuthenticated} = useAuth()
	const [analytics, setAnalytics] = useState<PersonalDashboardAnalytics | null>(null)
	const [analyticsLoading, setAnalyticsLoading] = useState(true)

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
		const fetchAnalytics = async () => {
			try {
				setAnalyticsLoading(true)
				const data = await AnalyticsService.getPersonalDashboardAnalytics()
				setAnalytics(data)
			} catch (error) {
				console.error('Failed to fetch analytics:', error)
			} finally {
				setAnalyticsLoading(false)
			}
		}

		if (user && !loading) {
			fetchAnalytics()
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
				<Card className="max-w-md mx-auto">
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
						<CardDescription>Please sign in to access your dashboard</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full">
							<Link href="/auth/signin">Sign In</Link>
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
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className='text-3xl font-bold text-gray-800 dark:text-gray-100'>
						{getGreeting()}, {getDisplayName()}!
					</h1>
					<p className="text-muted-foreground mt-1">
						Welcome to your multi-tenant dashboard
					</p>
				</div>
				<div className="flex items-center gap-3">
					<TenantSelector variant="dropdown" showGlobalOption={true} />
					<ContextSwitcher variant="dropdown" size="sm" />
				</div>
			</div>

			{/* Quick Status Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							{currentMode === 'global' ? (
								<Globe className="h-8 w-8 text-blue-600" />
							) : (
								<Building2 className="h-8 w-8 text-green-600" />
							)}
							<div>
								<p className="text-sm font-medium text-muted-foreground">Current Context</p>
								<p className="text-2xl font-bold">
									{currentMode === 'global' ? 'Global' : 'Tenant'}
								</p>
								{currentMode === 'tenant' && currentTenantId && (
									<p className="text-xs text-muted-foreground font-mono">
										{currentTenantId}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							<Users className="h-8 w-8 text-purple-600" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">Active Roles</p>
								<p className="text-2xl font-bold">{user?.roles?.length || 0}</p>
								<div className="flex flex-wrap gap-1 mt-1">
									{user?.roles?.slice(0, 2).map((role) => (
										<Badge key={role} variant="outline" className="text-xs">
											{role}
										</Badge>
									))}
									{user?.roles && user.roles.length > 2 && (
										<Badge variant="outline" className="text-xs">
											+{user.roles.length - 2}
										</Badge>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							<Shield className="h-8 w-8 text-red-600" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">Account Status</p>
								<div className="flex items-center gap-2">
									<CheckCircle className="h-5 w-5 text-green-600" />
									<p className="text-lg font-bold">Active</p>
								</div>
								<p className="text-xs text-muted-foreground">
									{user?.roles?.includes('system_admin') ? 'System Admin' : 'Standard User'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							<Activity className="h-8 w-8 text-orange-600" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">Total Logins</p>
								<p className="text-2xl font-bold">{analytics?.total_logins || 0}</p>
								<p className="text-xs text-muted-foreground">All time</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>
						Common tasks and navigation shortcuts based on your role
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{quickActions
							.filter((action) => hasRole(action.roles))
							.map((action) => {
								const Icon = action.icon
								return (
									<Link key={action.href} href={action.href}>
										<Card className="transition-all hover:shadow-md hover:scale-105 cursor-pointer">
											<CardContent className="p-4">
												<div className="flex items-start gap-3">
													<Icon className={`h-6 w-6 ${action.color} mt-1`} />
													<div className="flex-1">
														<h3 className="font-medium">{action.title}</h3>
														<p className="text-sm text-muted-foreground mt-1">
															{action.description}
														</p>
														<ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
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

			{/* Context Management */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Context Management</CardTitle>
					<CardDescription>
						Manage your authentication contexts and switch between global and tenant modes
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ContextDashboard />
				</CardContent>
			</Card>

			<Separator className="my-8" />

			{/* Personal Information Section */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>Personal Information</CardTitle>
				</CardHeader>
				<CardContent>
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
						{isSystemAdmin && <p className='mt-2 rounded-md bg-blue-100 p-2 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-300'>You have System Administrator privileges.</p>}
					</div>
				</CardContent>
			</Card>

			{/* Personal Analytics Section */}
			<div className='mb-8'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>Your Analytics</h2>
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<AnalyticsCard title='Total Logins' value={analytics?.total_logins || 0} description='All time' icon={Activity} loading={analyticsLoading} />
					<AnalyticsCard title='Recent Logins' value={analytics?.recent_logins || 0} description='Last 30 days' icon={Clock} loading={analyticsLoading} />
					<AnalyticsCard title='Active Sessions' value={analytics?.active_sessions || 0} description='Currently active' icon={Smartphone} loading={analyticsLoading} />
					<AnalyticsCard title='Security Events' value={analytics?.security_events || 0} description='Recent alerts' icon={Shield} loading={analyticsLoading} />
				</div>
			</div>

			{/* DID and Credentials Overview */}
			<div className='mb-8'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200'>Identity & Credentials</h2>
				<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
					<DIDWidget className='lg:col-span-1' />
					<CredentialWidget className='lg:col-span-1' />
					<RecentActivityWidget className='lg:col-span-1' />
				</div>
			</div>

			{/* Account Security Status */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>Account Security</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 md:grid-cols-3'>
						<div className='flex items-center space-x-2'>
							{analytics?.email_verified ? <CheckCircle className='h-5 w-5 text-green-500' /> : <AlertTriangle className='h-5 w-5 text-yellow-500' />}
							<span className='text-sm'>Email {analytics?.email_verified ? 'Verified' : 'Not Verified'}</span>
						</div>
						<div className='flex items-center space-x-2'>
							{analytics?.phone_verified ? <CheckCircle className='h-5 w-5 text-green-500' /> : <AlertTriangle className='h-5 w-5 text-yellow-500' />}
							<span className='text-sm'>Phone {analytics?.phone_verified ? 'Verified' : 'Not Verified'}</span>
						</div>
						<div className='flex items-center space-x-2'>
							{analytics?.two_factor_enabled ? <CheckCircle className='h-5 w-5 text-green-500' /> : <AlertTriangle className='h-5 w-5 text-yellow-500' />}
							<span className='text-sm'>2FA {analytics?.two_factor_enabled ? 'Enabled' : 'Disabled'}</span>
						</div>
					</div>
					{analytics?.last_login && <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>Last login: {new Date(analytics.last_login).toLocaleString()}</div>}
				</CardContent>
			</Card>

			{/* System Administration Section (Conditional) */}
			{isSystemAdmin && (
				<Card className='mb-8'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>System Administration</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='mb-4 text-gray-600 dark:text-gray-400'>Access global system settings and management tools.</p>
						<Button asChild variant='default' size='lg'>
							<Link href='/dashboard/admin/dashboard'>Go to System Admin</Link>
						</Button>
					</CardContent>
				</Card>
			)}
			{isSystemAdmin && (
				<Card className='mb-8'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold text-gray-700 dark:text-gray-200'>OAuth2 Management</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='mb-4 text-gray-600 dark:text-gray-400'>Manage OAuth2 clients and settings.</p>
						<Button asChild variant='default' size='lg'>
							<Link href='/dashboard/oauth2'>Go to OAuth2 Management</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
