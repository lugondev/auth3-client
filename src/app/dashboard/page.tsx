'use client'

import React, {useEffect, useState} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsService, PersonalDashboardAnalytics} from '@/services/analyticsService'
import {Activity, Shield, Clock, CheckCircle, AlertTriangle, Smartphone} from 'lucide-react'

export default function UserDashboardPage() {
	const {user, isSystemAdmin, loading} = useAuth()
	const [analytics, setAnalytics] = useState<PersonalDashboardAnalytics | null>(null)
	const [analyticsLoading, setAnalyticsLoading] = useState(true)

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
	}, [user, loading])

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

	// ProtectedWrapper ensures user is available
	if (!user) return null

	return (
		<div className='container mx-auto p-4 md:p-6'>
			<h1 className='mb-8 text-3xl font-bold text-gray-800 dark:text-gray-100'>User Dashboard</h1>

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
