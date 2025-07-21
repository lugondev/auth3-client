'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {AuthAnalyticsService} from '@/services/analyticsService'
import type {AuthDashboardResponse} from '@/types/analytics'
import {Activity, TrendingUp, Shield, CheckCircle, XCircle, RefreshCw} from 'lucide-react'
import {format} from 'date-fns'
import {toast} from 'sonner'

export default function AuthAnalyticsPage() {
	const [authData, setAuthData] = useState<AuthDashboardResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)

	const fetchData = async () => {
		try {
			setLoading(true)

			// Default to last 30 days
			const endTime = new Date()
			const startTime = new Date()
			startTime.setDate(startTime.getDate() - 30)

			const params = {
				start_time: startTime.toISOString(),
				end_time: endTime.toISOString(),
			}

			const dashboardData = await AuthAnalyticsService.getAuthDashboard(params)
			setAuthData(dashboardData)
		} catch (error) {
			console.error('Failed to fetch auth analytics:', error)
			toast.error('Failed to load authentication analytics data')
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	const handleRefresh = async () => {
		setRefreshing(true)
		await fetchData()
	}

	useEffect(() => {
		fetchData()
	}, [])

	if (loading) {
		return (
			<div className='space-y-6'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold'>Authentication Analytics</h1>
						<p className='text-muted-foreground'>Monitor authentication metrics and user login activity</p>
					</div>
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

	const summary = authData?.summary

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>Authentication Analytics</h1>
					<p className='text-muted-foreground'>Monitor authentication metrics and user login activity</p>
					{authData?.generated_at && <p className='text-xs text-muted-foreground mt-1'>Last updated: {format(new Date(authData.generated_at), 'MMM dd, yyyy HH:mm')}</p>}
				</div>

				<Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing}>
					<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			{/* Summary Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Logins</CardTitle>
						<Activity className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{summary?.total_logins_count?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{summary?.success_rate?.toFixed(1) || 0}%</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Successful Logins</CardTitle>
						<CheckCircle className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{summary?.successful_logins_count?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Failed Logins</CardTitle>
						<XCircle className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>{summary?.failed_logins_count?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Active Sessions</CardTitle>
						<Activity className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{summary?.active_sessions?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Total Sessions</CardTitle>
						<Activity className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{summary?.total_sessions?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Security Events</CardTitle>
						<Shield className='h-4 w-4 text-orange-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-orange-600'>{summary?.security_events?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
						<CardTitle className='text-sm font-medium'>Critical Events</CardTitle>
						<Shield className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>{summary?.critical_events?.toLocaleString() || 0}</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Login Data */}
			<div className='grid gap-6 md:grid-cols-1 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Login Analytics</CardTitle>
					</CardHeader>
					<CardContent>
						{authData?.login_analytics?.data ? (
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Found {authData.login_analytics.data.length} login records</p>
								{authData.login_analytics.data.length > 0 && (
									<div className='space-y-1'>
										{authData.login_analytics.data.slice(0, 5).map((login, index) => (
											<div key={index} className='flex items-center justify-between p-2 border rounded'>
												<div className='flex items-center space-x-2'>
													{login.success ? <CheckCircle className='h-4 w-4 text-green-600' /> : <XCircle className='h-4 w-4 text-red-600' />}
													<span className='text-sm'>{login.ip_address}</span>
												</div>
												<div className='text-xs text-muted-foreground'>{format(new Date(login.timestamp), 'MMM dd, HH:mm')}</div>
											</div>
										))}
									</div>
								)}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No login analytics data available</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Logins</CardTitle>
					</CardHeader>
					<CardContent>
						{authData?.recent_logins?.data ? (
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Found {authData.recent_logins.data.length} recent logins</p>
								{authData.recent_logins.data.length > 0 && (
									<div className='space-y-1'>
										{authData.recent_logins.data.slice(0, 5).map((login, index) => (
											<div key={index} className='flex items-center justify-between p-2 border rounded'>
												<div className='flex items-center space-x-2'>
													{login.success ? (
														<Badge variant='default' className='text-xs'>
															Success
														</Badge>
													) : (
														<Badge variant='destructive' className='text-xs'>
															Failed
														</Badge>
													)}
													<span className='text-sm'>{login.ip_address}</span>
												</div>
												<div className='text-xs text-muted-foreground'>{format(new Date(login.timestamp), 'MMM dd, HH:mm')}</div>
											</div>
										))}
									</div>
								)}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No recent login data available</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
