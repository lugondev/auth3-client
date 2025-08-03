'use client'

import React, {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {SystemAnalyticsService} from '@/services/analyticsService'
import type {SystemDashboardAnalytics} from '@/types/analytics'
import {Users, UserCheck, Building, Activity, Shield, TrendingUp} from 'lucide-react'
import {Skeleton} from '@/components/ui/skeleton'

export default function AdminDashboardPage() {
	const [analytics, setAnalytics] = useState<SystemDashboardAnalytics | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchData() {
			try {
				const systemData = await SystemAnalyticsService.getSystemDashboard()
				setAnalytics(systemData)
			} catch (error) {
				console.error('Failed to load admin analytics:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	if (loading) {
		return (
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold'>Admin Dashboard</h1>
					<p className='text-muted-foreground'>System analytics and administration overview</p>
				</div>

				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
					{Array.from({length: 8}).map((_, i) => (
						<Card key={i}>
							<CardHeader className='pb-2'>
								<Skeleton className='h-4 w-24' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-8 w-16' />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold'>Admin Dashboard</h1>
				<p className='text-muted-foreground'>System analytics and administration overview</p>
			</div>

			{/* System Metrics Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Users</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.total_users?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Active Users</CardTitle>
						<UserCheck className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{analytics?.active_users?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>New Users Today</CardTitle>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-blue-600'>{analytics?.new_users_today?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Active Tenants</CardTitle>
						<Building className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.active_tenants?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Tenants</CardTitle>
						<Building className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.total_tenants?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Sessions</CardTitle>
						<Activity className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.total_sessions?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Active Sessions</CardTitle>
						<Activity className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{analytics?.active_sessions?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>New Users This Week</CardTitle>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{analytics?.new_users_this_week?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts and Details */}
			<div className='grid gap-6 md:grid-cols-1 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>User Growth Overview</CardTitle>
					</CardHeader>
					<CardContent>
						{analytics?.user_growth_chart && analytics.user_growth_chart.length > 0 ? (
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Showing {analytics.user_growth_chart.length} data points</p>
								{/* TODO: Add chart component when ready */}
								<div className='p-4 bg-blue-50 rounded-lg'>
									<p className='text-sm text-blue-800'>📈 Chart visualization will be implemented with the chart components</p>
								</div>
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No user growth data available</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Login Activity Overview</CardTitle>
					</CardHeader>
					<CardContent>
						{analytics?.login_activity_chart && analytics.login_activity_chart.length > 0 ? (
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Showing {analytics.login_activity_chart.length} data points</p>
								{/* TODO: Add chart component when ready */}
								<div className='p-4 bg-green-50 rounded-lg'>
									<p className='text-sm text-green-800'>📊 Login activity chart will be implemented with the chart components</p>
								</div>
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No login activity data available</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Security Overview */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center space-x-2'>
						<Shield className='h-5 w-5' />
						<span>Security Overview</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{analytics?.security_overview ? (
						<div className='grid gap-4 md:grid-cols-3 lg:grid-cols-4'>
							<div className='text-center'>
								<div className='text-2xl font-bold text-red-600'>{analytics.security_overview.failed_logins_today || 0}</div>
								<p className='text-xs text-muted-foreground'>Failed Logins Today</p>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-orange-600'>{analytics.security_overview.failed_logins_this_week || 0}</div>
								<p className='text-xs text-muted-foreground'>Failed Logins This Week</p>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-blue-600'>{analytics.security_overview.users_2fa_enabled || 0}</div>
								<p className='text-xs text-muted-foreground'>Users with 2FA</p>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-green-600'>{analytics.security_overview.users_email_verified || 0}</div>
								<p className='text-xs text-muted-foreground'>Email Verified</p>
							</div>
						</div>
					) : (
						<p className='text-sm text-muted-foreground'>No security overview data available</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
