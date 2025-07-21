'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {Users, TrendingUp, UserPlus, Activity, Calendar, Clock, MapPin, Smartphone, AlertTriangle, RefreshCw, Download} from 'lucide-react'

interface UserAnalytics {
	overview: {
		total_users: number
		active_users_today: number
		active_users_week: number
		active_users_month: number
		new_registrations_today: number
		new_registrations_week: number
		new_registrations_month: number
		retention_rate_30d: number
	}
	demographics: {
		by_country: Array<{country: string; count: number; percentage: number}>
		by_device: Array<{device: string; count: number; percentage: number}>
		by_age_group: Array<{age_group: string; count: number; percentage: number}>
	}
	engagement: {
		average_session_duration: number
		sessions_per_user: number
		bounce_rate: number
		feature_usage: Array<{feature: string; usage_count: number; user_count: number}>
	}
	growth: {
		daily_active_users: Array<{date: string; count: number}>
		monthly_registrations: Array<{month: string; count: number}>
		churn_rate: number
	}
}

export default function UserAnalyticsPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

	const fetchUserAnalytics = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const mockAnalytics: UserAnalytics = {
				overview: {
					total_users: 15420,
					active_users_today: 3241,
					active_users_week: 8932,
					active_users_month: 12845,
					new_registrations_today: 47,
					new_registrations_week: 289,
					new_registrations_month: 1234,
					retention_rate_30d: 87.5,
				},
				demographics: {
					by_country: [
						{country: 'United States', count: 4523, percentage: 29.3},
						{country: 'Vietnam', count: 3421, percentage: 22.2},
						{country: 'Germany', count: 2134, percentage: 13.8},
						{country: 'Japan', count: 1876, percentage: 12.2},
						{country: 'Others', count: 3466, percentage: 22.5},
					],
					by_device: [
						{device: 'Desktop', count: 8934, percentage: 58.0},
						{device: 'Mobile', count: 5123, percentage: 33.2},
						{device: 'Tablet', count: 1363, percentage: 8.8},
					],
					by_age_group: [
						{age_group: '18-24', count: 2134, percentage: 13.8},
						{age_group: '25-34', count: 4523, percentage: 29.3},
						{age_group: '35-44', count: 3876, percentage: 25.1},
						{age_group: '45-54', count: 2890, percentage: 18.7},
						{age_group: '55+', count: 1997, percentage: 13.0},
					],
				},
				engagement: {
					average_session_duration: 24.5,
					sessions_per_user: 3.2,
					bounce_rate: 12.3,
					feature_usage: [
						{feature: 'Credential Management', usage_count: 8934, user_count: 5432},
						{feature: 'DID Operations', usage_count: 4521, user_count: 3210},
						{feature: 'OAuth2 Login', usage_count: 12340, user_count: 8901},
						{feature: 'Analytics Dashboard', usage_count: 2134, user_count: 1543},
					],
				},
				growth: {
					daily_active_users: [
						{date: '2024-01-01', count: 2890},
						{date: '2024-01-02', count: 3120},
						{date: '2024-01-03', count: 3241},
					],
					monthly_registrations: [
						{month: 'Jan 2024', count: 1234},
						{month: 'Feb 2024', count: 1456},
						{month: 'Mar 2024', count: 1123},
					],
					churn_rate: 4.2,
				},
			}

			setAnalytics(mockAnalytics)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch user analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchUserAnalytics()

		// Auto-refresh every 60 seconds
		const interval = setInterval(fetchUserAnalytics, 60000)
		return () => clearInterval(interval)
	}, [])

	const exportData = () => {
		if (analytics) {
			const dataStr = JSON.stringify(analytics, null, 2)
			const dataBlob = new Blob([dataStr], {type: 'application/json'})
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `user-analytics-${new Date().toISOString().split('T')[0]}.json`
			link.click()
			URL.revokeObjectURL(url)
		}
	}

	if (loading) {
		return (
			<div className='container mx-auto py-8'>
				<div className='mb-8'>
					<Skeleton className='h-8 w-64 mb-2' />
					<Skeleton className='h-4 w-96' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
					{[...Array(8)].map((_, i) => (
						<Skeleton key={i} className='h-32' />
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto py-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold flex items-center gap-2'>
						<Users className='h-8 w-8' />
						User Analytics
					</h1>
					<p className='text-muted-foreground mt-2'>User behavior, engagement, and demographic insights</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-sm text-muted-foreground'>Last updated: {lastRefresh.toLocaleTimeString()}</span>
					<Button variant='outline' size='sm' onClick={exportData}>
						<Download className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={fetchUserAnalytics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Overview Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Users className='h-8 w-8 text-blue-600' />
							<Badge variant='outline'>Total</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.total_users.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>Total Users</p>
							<p className='text-xs text-green-600 mt-1'>+{analytics?.overview.new_registrations_month || 0} this month</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Activity className='h-8 w-8 text-green-600' />
							<Badge variant='default'>Active</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.active_users_today.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>Active Today</p>
							<p className='text-xs text-muted-foreground mt-1'>{analytics?.overview.active_users_week.toLocaleString() || 0} this week</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<UserPlus className='h-8 w-8 text-purple-600' />
							<Badge variant='secondary'>New</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.new_registrations_today || 0}</p>
							<p className='text-sm text-muted-foreground'>New Today</p>
							<p className='text-xs text-blue-600 mt-1'>{analytics?.overview.new_registrations_week || 0} this week</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<TrendingUp className='h-8 w-8 text-orange-600' />
							<Badge variant='outline'>Retention</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.retention_rate_30d || 0}%</p>
							<p className='text-sm text-muted-foreground'>30-Day Retention</p>
							<p className='text-xs text-green-600 mt-1'>{analytics?.growth.churn_rate || 0}% churn rate</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Demographics */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				{/* Country Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<MapPin className='h-5 w-5' />
							Geographic Distribution
						</CardTitle>
						<CardDescription>Users by country</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{analytics?.demographics.by_country.map((country, index) => (
								<div key={index} className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold'>{index + 1}</div>
										<span className='text-sm font-medium'>{country.country}</span>
									</div>
									<div className='text-right'>
										<p className='text-sm font-semibold'>{country.count.toLocaleString()}</p>
										<p className='text-xs text-muted-foreground'>{country.percentage}%</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Device Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Smartphone className='h-5 w-5' />
							Device Distribution
						</CardTitle>
						<CardDescription>Users by device type</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{analytics?.demographics.by_device.map((device, index) => (
								<div key={index} className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${device.device === 'Desktop' ? 'bg-green-100 dark:bg-green-900/30' : device.device === 'Mobile' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
											<Smartphone className='h-4 w-4' />
										</div>
										<span className='text-sm font-medium'>{device.device}</span>
									</div>
									<div className='text-right'>
										<p className='text-sm font-semibold'>{device.count.toLocaleString()}</p>
										<p className='text-xs text-muted-foreground'>{device.percentage}%</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Engagement Metrics */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						Engagement Metrics
					</CardTitle>
					<CardDescription>User behavior and feature usage</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
						<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
							<Clock className='h-8 w-8 text-blue-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-blue-600'>{analytics?.engagement.average_session_duration || 0}m</p>
							<p className='text-sm text-muted-foreground'>Avg Session Duration</p>
						</div>
						<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
							<Activity className='h-8 w-8 text-green-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-green-600'>{analytics?.engagement.sessions_per_user || 0}</p>
							<p className='text-sm text-muted-foreground'>Sessions per User</p>
						</div>
						<div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
							<TrendingUp className='h-8 w-8 text-purple-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-purple-600'>{analytics?.engagement.bounce_rate || 0}%</p>
							<p className='text-sm text-muted-foreground'>Bounce Rate</p>
						</div>
					</div>

					<div>
						<h4 className='font-semibold mb-4'>Feature Usage</h4>
						<div className='space-y-3'>
							{analytics?.engagement.feature_usage.map((feature, index) => (
								<div key={index} className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
									<span className='text-sm font-medium'>{feature.feature}</span>
									<div className='text-right'>
										<p className='text-sm font-semibold'>{feature.usage_count.toLocaleString()} uses</p>
										<p className='text-xs text-muted-foreground'>{feature.user_count.toLocaleString()} users</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Age Groups */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Calendar className='h-5 w-5' />
						Age Distribution
					</CardTitle>
					<CardDescription>Users by age group</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
						{analytics?.demographics.by_age_group.map((group, index) => (
							<div key={index} className='text-center p-4 border rounded-lg'>
								<p className='text-lg font-bold'>{group.age_group}</p>
								<p className='text-2xl font-bold text-primary'>{group.count.toLocaleString()}</p>
								<p className='text-sm text-muted-foreground'>{group.percentage}%</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
