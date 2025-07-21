'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {EnhancedAnalyticsService, TenantUsageMetrics, TenantDashboardData} from '@/services/enhancedAnalyticsService'
import {Users, Building2, Activity, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock, Download, RefreshCw} from 'lucide-react'

export default function TenantAnalyticsPage() {
	const params = useParams()
	const {user} = useAuth()
	const tenantId = params.tenantId as string

	const [loading, setLoading] = useState(true)
	const [usageMetrics, setUsageMetrics] = useState<TenantUsageMetrics | null>(null)
	const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null)
	const [timeRange, setTimeRange] = useState<'week' | 'month'>('month')

	const fetchTenantAnalytics = useCallback(async () => {
		try {
			setLoading(true)

			const endDate = new Date()
			const startDate = new Date()
			const days = timeRange === 'week' ? 7 : 30
			startDate.setDate(endDate.getDate() - days)

			const query = {
				time_range: {
					start_date: startDate.toISOString().split('T')[0],
					end_date: endDate.toISOString().split('T')[0],
				},
				interval: timeRange,
			}

			const [dashboardResponse, usageResponse] = await Promise.allSettled([EnhancedAnalyticsService.getTenantDashboardData(), EnhancedAnalyticsService.getTenantUsageMetrics(query)])

			if (dashboardResponse.status === 'fulfilled') {
				setDashboardData(dashboardResponse.value)
			}
			if (usageResponse.status === 'fulfilled') {
				setUsageMetrics(usageResponse.value)
			}
		} catch (error) {
			console.error('Failed to fetch tenant analytics:', error)
		} finally {
			setLoading(false)
		}
	}, [timeRange])

	useEffect(() => {
		if (tenantId) {
			fetchTenantAnalytics()
		}
	}, [tenantId, timeRange, fetchTenantAnalytics])

	const exportData = () => {
		const data = {
			tenant_id: tenantId,
			dashboard: dashboardData,
			usage: usageMetrics,
			exported_at: new Date().toISOString(),
		}

		const dataStr = JSON.stringify(data, null, 2)
		const dataBlob = new Blob([dataStr], {type: 'application/json'})
		const url = URL.createObjectURL(dataBlob)
		const link = document.createElement('a')
		link.href = url
		link.download = `tenant-${tenantId}-analytics-${new Date().toISOString().split('T')[0]}.json`
		link.click()
		URL.revokeObjectURL(url)
	}

	if (loading) {
		return (
			<div className='container mx-auto py-8'>
				<div className='mb-8'>
					<Skeleton className='h-8 w-64 mb-2' />
					<Skeleton className='h-4 w-96' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className='h-32' />
					))}
				</div>
				<Skeleton className='h-96' />
			</div>
		)
	}

	return (
		<div className='container mx-auto py-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold'>Tenant Analytics</h1>
					<p className='text-muted-foreground mt-2'>
						Analytics for tenant: <span className='font-mono text-sm'>{tenantId}</span>
					</p>
				</div>
				<div className='flex items-center gap-2'>
					{/* Time Range Selector */}
					<div className='flex gap-1'>
						{['week', 'month'].map((range) => (
							<Button key={range} variant={timeRange === range ? 'default' : 'outline'} size='sm' onClick={() => setTimeRange(range as 'week' | 'month')}>
								{range === 'week' ? '7d' : '30d'}
							</Button>
						))}
					</div>
					<Button variant='outline' size='sm' onClick={fetchTenantAnalytics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={exportData}>
						<Download className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Overview Cards */}
			{dashboardData && (
				<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Total Tenants</p>
									<p className='text-3xl font-bold'>{dashboardData.overview.total_tenants}</p>
								</div>
								<Building2 className='h-8 w-8 text-blue-600' />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Active Tenants</p>
									<p className='text-3xl font-bold'>{dashboardData.overview.active_tenants}</p>
								</div>
								<Users className='h-8 w-8 text-green-600' />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Growth Rate</p>
									<p className='text-3xl font-bold'>{dashboardData.overview.growth_rate}%</p>
								</div>
								{dashboardData.overview.growth_rate > 0 ? <TrendingUp className='h-8 w-8 text-green-600' /> : <TrendingDown className='h-8 w-8 text-red-600' />}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Revenue</p>
									<p className='text-3xl font-bold'>${dashboardData.overview.revenue_this_month}</p>
								</div>
								<DollarSign className='h-8 w-8 text-purple-600' />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Usage Analytics */}
			{usageMetrics && (
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
					<Card>
						<CardHeader>
							<CardTitle>Usage Overview</CardTitle>
							<CardDescription>Current tenant resource usage metrics</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-2 gap-4'>
								<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
									<p className='text-2xl font-bold text-blue-600'>{usageMetrics.total_tenants}</p>
									<p className='text-sm text-blue-600'>Total Tenants</p>
								</div>
								<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
									<p className='text-2xl font-bold text-green-600'>{usageMetrics.active_tenants}</p>
									<p className='text-sm text-green-600'>Active Tenants</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Resource Consumption</CardTitle>
							<CardDescription>Detailed resource usage statistics</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								<div className='flex justify-between'>
									<span>API Calls</span>
									<span className='font-semibold'>{usageMetrics.resource_usage.total_api_calls.toLocaleString()}</span>
								</div>
								<div className='flex justify-between'>
									<span>Storage</span>
									<span className='font-semibold'>{usageMetrics.resource_usage.total_storage}</span>
								</div>
								<div className='flex justify-between'>
									<span>Avg Users/Tenant</span>
									<span className='font-semibold'>{usageMetrics.resource_usage.avg_users_per_tenant}</span>
								</div>
								<div className='flex justify-between'>
									<span>Peak Usage</span>
									<span className='font-semibold'>{usageMetrics.resource_usage.peak_usage_time}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Activity Summary */}
			<Card>
				<CardHeader>
					<CardTitle>Activity Summary</CardTitle>
					<CardDescription>Recent tenant activity and engagement metrics for the selected time period.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
							<Activity className='h-8 w-8 text-blue-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-blue-600'>2,456</p>
							<p className='text-sm text-blue-600'>Total Sessions</p>
							<p className='text-xs text-muted-foreground mt-1'>+12.5% from last period</p>
						</div>
						<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
							<Users className='h-8 w-8 text-green-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-green-600'>184</p>
							<p className='text-sm text-green-600'>Active Users</p>
							<p className='text-xs text-muted-foreground mt-1'>+8.2% from last period</p>
						</div>
						<div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
							<Clock className='h-8 w-8 text-purple-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-purple-600'>4m 32s</p>
							<p className='text-sm text-purple-600'>Avg. Session Duration</p>
							<p className='text-xs text-muted-foreground mt-1'>+15.3% from last period</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
