'use client'

import React, {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsChart, MultiLineChart} from '@/components/analytics/AnalyticsChart'
import {AnalyticsService, SystemDashboardAnalytics, UserGrowthItem, LoginActivityItem, DeviceStatsItem, LocationStatsItem, TenantStatsItem} from '@/services/analyticsService'
import {Users, UserCheck, Building, Activity, Shield, AlertTriangle, TrendingUp} from 'lucide-react'
import {Skeleton} from '@/components/ui/skeleton'

export default function AdminDashboardPage() {
	const [analytics, setAnalytics] = useState<SystemDashboardAnalytics | null>(null)
	const [userGrowth, setUserGrowth] = useState<UserGrowthItem[]>([])
	const [loginActivity, setLoginActivity] = useState<LoginActivityItem[]>([])
	const [topDevices, setTopDevices] = useState<DeviceStatsItem[]>([])
	const [topLocations, setTopLocations] = useState<LocationStatsItem[]>([])
	const [tenantStats, setTenantStats] = useState<TenantStatsItem[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchAnalytics = async () => {
			try {
				setLoading(true)

				// Fetch all analytics data
				const [systemData, userGrowthData, loginData, devicesData, locationsData, tenantsData] = await Promise.all([AnalyticsService.getSystemDashboardAnalytics(), AnalyticsService.getUserGrowthData({interval: 'day', limit: 30}), AnalyticsService.getLoginActivityData({interval: 'day', limit: 30}), AnalyticsService.getTopDevices({limit: 10}), AnalyticsService.getTopLocations({limit: 10}), AnalyticsService.getTenantStats({limit: 10})])

				setAnalytics(systemData)
				setUserGrowth(userGrowthData)
				setLoginActivity(loginData)
				setTopDevices(devicesData)
				setTopLocations(locationsData)
				setTenantStats(tenantsData)
			} catch (error) {
				console.error('Failed to fetch analytics:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchAnalytics()
	}, [])

	const getSystemHealthColor = (health: string) => {
		switch (health) {
			case 'healthy':
				return 'text-green-600'
			case 'warning':
				return 'text-yellow-600'
			case 'critical':
				return 'text-red-600'
			default:
				return 'text-gray-600'
		}
	}

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold text-gray-800 dark:text-gray-100'>System Dashboard</h1>
				<p className='text-gray-600 dark:text-gray-400'>Monitor system performance and user analytics</p>
			</div>

			{/* System Overview Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<AnalyticsCard title='Total Users' value={analytics?.total_users || 0} description='Registered users' icon={Users} loading={loading} />
				<AnalyticsCard title='Active Users' value={analytics?.active_users || 0} description='Last 30 days' icon={UserCheck} loading={loading} />
				<AnalyticsCard title='Total Tenants' value={analytics?.total_tenants || 0} description='Organizations' icon={Building} loading={loading} />
				<AnalyticsCard title='New Users Today' value={analytics?.new_users_today || 0} description="Today's signups" icon={TrendingUp} loading={loading} />
			</div>

			{/* Login Activity Cards */}
			<div className='grid gap-4 md:grid-cols-3'>
				<AnalyticsCard title='Total Logins' value={analytics?.total_logins || 0} description='All time' icon={Activity} loading={loading} />
				<AnalyticsCard title='Failed Logins' value={analytics?.failed_logins || 0} description='Security attempts' icon={AlertTriangle} loading={loading} />
				<AnalyticsCard title='Security Events' value={analytics?.security_events || 0} description='Recent alerts' icon={Shield} loading={loading} />
			</div>

			{/* System Health */}
			<Card>
				<CardHeader>
					<CardTitle>System Health</CardTitle>
				</CardHeader>
				<CardContent>{loading ? <Skeleton className='h-6 w-32' /> : <div className={`text-lg font-semibold ${getSystemHealthColor(analytics?.system_health || 'unknown')}`}>{analytics?.system_health?.toUpperCase() || 'UNKNOWN'}</div>}</CardContent>
			</Card>

			{/* Charts Section */}
			<div className='grid gap-6 lg:grid-cols-2'>
				{/* User Growth Chart */}
				<AnalyticsChart
					title='User Growth (Last 30 Days)'
					data={userGrowth.map((item) => ({
						name: new Date(item.date).toLocaleDateString(),
						value: item.new_users,
					}))}
					type='area'
					dataKey='value'
					xAxisKey='name'
					loading={loading}
					height={300}
				/>

				{/* Login Activity Chart */}
				<MultiLineChart
					title='Login Activity (Last 30 Days)'
					data={loginActivity.map((item) => ({
						name: new Date(item.date).toLocaleDateString(),
						successful: item.successful_logins,
						failed: item.failed_logins,
					}))}
					lines={[
						{dataKey: 'successful', name: 'Successful Logins', color: '#22c55e'},
						{dataKey: 'failed', name: 'Failed Logins', color: '#ef4444'},
					]}
					xAxisKey='name'
					loading={loading}
					height={300}
				/>

				{/* Top Devices Chart */}
				<AnalyticsChart
					title='Top Devices'
					data={topDevices.map((item) => ({
						name: item.device_type,
						value: item.count,
					}))}
					type='pie'
					dataKey='value'
					loading={loading}
					height={300}
				/>

				{/* Top Locations Chart */}
				<AnalyticsChart
					title='Top Locations'
					data={topLocations.map((item) => ({
						name: item.country,
						value: item.count,
					}))}
					type='bar'
					dataKey='value'
					xAxisKey='name'
					loading={loading}
					height={300}
				/>
			</div>

			{/* Tenant Statistics Table */}
			<Card>
				<CardHeader>
					<CardTitle>Top Tenants</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='space-y-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-12 w-full' />
							))}
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='w-full text-sm'>
								<thead>
									<tr className='border-b'>
										<th className='text-left p-2'>Tenant</th>
										<th className='text-left p-2'>Users</th>
										<th className='text-left p-2'>Active Users</th>
										<th className='text-left p-2'>Total Logins</th>
										<th className='text-left p-2'>Status</th>
									</tr>
								</thead>
								<tbody>
									{tenantStats.map((tenant) => (
										<tr key={tenant.tenant_id} className='border-b'>
											<td className='p-2 font-medium'>{tenant.tenant_name}</td>
											<td className='p-2'>{tenant.user_count}</td>
											<td className='p-2'>{tenant.active_users}</td>
											<td className='p-2'>{tenant.total_logins}</td>
											<td className='p-2'>
												<span className={`px-2 py-1 rounded-full text-xs ${tenant.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{tenant.is_active ? 'Active' : 'Inactive'}</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
