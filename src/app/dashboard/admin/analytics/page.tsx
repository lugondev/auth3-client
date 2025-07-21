'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {BarChart3, TrendingUp, Activity, Server, Shield, Users, Database, Globe, AlertTriangle, CheckCircle, Clock, Zap, RefreshCw, ArrowUpRight, ArrowDownRight} from 'lucide-react'
import Link from 'next/link'
import {SystemAnalyticsService, formatTimeRange, handleApiError} from '@/services/analyticsService'
import type {SystemDashboardAnalytics} from '@/types/analytics'

export default function AnalyticsOverviewPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [metrics, setMetrics] = useState<SystemDashboardAnalytics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
	const [error, setError] = useState<string | null>(null)

	const fetchOverviewMetrics = async () => {
		try {
			setLoading(true)
			setError(null)

			// Fetch system dashboard analytics from API
			const timeRange = formatTimeRange(7) // Last 7 days
			const data = await SystemAnalyticsService.getSystemDashboard(timeRange)

			setMetrics(data)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch overview metrics:', error)
			const apiError = handleApiError(error)
			setError(apiError.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchOverviewMetrics()

		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchOverviewMetrics, 30000)
		return () => clearInterval(interval)
	}, [])

	// Calculate derived metrics from SystemDashboardAnalytics
	const getSystemHealthStatus = () => {
		if (!metrics) return 'unknown'

		// Simple health calculation based on available metrics
		const errorRate = metrics.security_overview?.failed_login_attempts || 0
		const totalUsers = metrics.total_users || 1
		const failureRate = (errorRate / totalUsers) * 100

		if (failureRate > 5) return 'critical'
		if (failureRate > 2) return 'warning'
		return 'healthy'
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'healthy':
				return 'text-green-600 dark:text-green-400'
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400'
			case 'critical':
				return 'text-red-600 dark:text-red-400'
			default:
				return 'text-gray-600 dark:text-gray-400'
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'healthy':
				return <CheckCircle className='h-5 w-5 text-green-500' />
			case 'warning':
				return <AlertTriangle className='h-5 w-5 text-yellow-500' />
			case 'critical':
				return <AlertTriangle className='h-5 w-5 text-red-500' />
			default:
				return <Clock className='h-5 w-5 text-gray-500' />
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

	const systemStatus = getSystemHealthStatus()
	const totalLoginAttempts = (metrics?.security_overview?.failed_login_attempts || 0) + (metrics?.active_sessions || 0)
	const successRate = totalLoginAttempts > 0 ? ((metrics?.active_sessions || 0) / totalLoginAttempts) * 100 : 100

	return (
		<div className='container mx-auto py-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold flex items-center gap-2'>
						<BarChart3 className='h-8 w-8' />
						Analytics Overview
					</h1>
					<p className='text-muted-foreground mt-2'>Real-time system metrics and performance insights</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-sm text-muted-foreground'>Last updated: {lastRefresh.toLocaleTimeString()}</span>
					<Button variant='outline' size='sm' onClick={fetchOverviewMetrics} disabled={loading}>
						<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					</Button>
				</div>
			</div>

			{/* Error Alert */}
			{error && (
				<Alert variant='destructive' className='mb-6'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>
						<strong>Error:</strong> {error}
					</AlertDescription>
				</Alert>
			)}

			{/* System Health Alert */}
			{metrics && systemStatus !== 'healthy' && (
				<Alert variant='destructive' className='mb-6'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>
						<strong>System Alert:</strong> System status is {systemStatus}. Failed logins: {metrics.security_overview?.failed_login_attempts || 0}, Active sessions: {metrics.active_sessions || 0}
					</AlertDescription>
				</Alert>
			)}

			{/* System Health Overview */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Server className='h-5 w-5' />
						System Health Status
					</CardTitle>
				</CardHeader>
				<CardContent>
					{metrics && (
						<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
							<div className='text-center'>
								<div className='flex items-center justify-center gap-2 mb-2'>
									{getStatusIcon(systemStatus)}
									<span className={`font-semibold ${getStatusColor(systemStatus)}`}>{systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}</span>
								</div>
								<p className='text-sm text-muted-foreground'>Overall Status</p>
							</div>
							<div className='text-center'>
								<p className='text-2xl font-bold text-green-600'>{successRate.toFixed(1)}%</p>
								<p className='text-sm text-muted-foreground'>Success Rate</p>
							</div>
							<div className='text-center'>
								<p className='text-2xl font-bold text-blue-600'>{metrics.active_sessions || 0}</p>
								<p className='text-sm text-muted-foreground'>Active Sessions</p>
							</div>
							<div className='text-center'>
								<p className='text-2xl font-bold text-purple-600'>{metrics.total_users || 0}</p>
								<p className='text-sm text-muted-foreground'>Total Users</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Key Metrics Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				{/* Authentication Metrics */}
				<Link href='/dashboard/admin/analytics/auth'>
					<Card className='hover:shadow-md transition-shadow cursor-pointer'>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<Shield className='h-8 w-8 text-blue-600' />
								<ArrowUpRight className='h-4 w-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-2xl font-bold'>{metrics?.active_sessions || 0}</p>
								<p className='text-sm text-muted-foreground'>Active Sessions</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='default' className='text-xs'>
										{successRate.toFixed(1)}% Success
									</Badge>
									<span className='text-xs text-red-600'>{metrics?.security_overview?.failed_login_attempts || 0} Failed</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>

				{/* System Metrics */}
				<Link href='/dashboard/admin/analytics/system'>
					<Card className='hover:shadow-md transition-shadow cursor-pointer'>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<Globe className='h-8 w-8 text-green-600' />
								<ArrowUpRight className='h-4 w-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-2xl font-bold'>{metrics?.active_tenants || 0}</p>
								<p className='text-sm text-muted-foreground'>Active Tenants</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='secondary' className='text-xs'>
										{metrics?.total_tenants || 0} Total
									</Badge>
									<span className='text-xs text-muted-foreground'>Sessions: {metrics?.total_sessions || 0}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>

				{/* User Metrics */}
				<Link href='/dashboard/admin/analytics/users'>
					<Card className='hover:shadow-md transition-shadow cursor-pointer'>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<Users className='h-8 w-8 text-purple-600' />
								<ArrowUpRight className='h-4 w-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-2xl font-bold'>{metrics?.active_users || 0}</p>
								<p className='text-sm text-muted-foreground'>Active Users</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='outline' className='text-xs'>
										+{metrics?.new_users_today || 0} Today
									</Badge>
									<span className='text-xs text-green-600'>{metrics?.new_users_this_week || 0} This Week</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>

				{/* Security Metrics */}
				<Link href='/dashboard/admin/analytics/security'>
					<Card className='hover:shadow-md transition-shadow cursor-pointer'>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<Database className='h-8 w-8 text-orange-600' />
								<ArrowUpRight className='h-4 w-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-2xl font-bold'>{metrics?.security_overview?.total_security_events || 0}</p>
								<p className='text-sm text-muted-foreground'>Security Events</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='secondary' className='text-xs'>
										{metrics?.security_overview?.users_2fa_enabled || 0} 2FA Users
									</Badge>
									<span className='text-xs text-green-600'>{metrics?.security_overview?.users_email_verified || 0} Verified</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Module Analytics */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Zap className='h-5 w-5' />
						Top Devices & Locations
					</CardTitle>
					<CardDescription>Most active devices and locations in the system</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						{metrics?.top_devices?.slice(0, 2).map((device, index) => (
							<div key={index} className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
								<Activity className='h-8 w-8 text-blue-600 mx-auto mb-2' />
								<p className='text-2xl font-bold text-blue-600'>{device.count}</p>
								<p className='text-sm text-muted-foreground'>{device.device}</p>
							</div>
						)) || (
							<div className='text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg'>
								<Activity className='h-8 w-8 text-gray-600 mx-auto mb-2' />
								<p className='text-sm text-muted-foreground'>No device data</p>
							</div>
						)}
						{metrics?.top_locations?.slice(0, 2).map((location, index) => (
							<div key={index} className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
								<Globe className='h-8 w-8 text-green-600 mx-auto mb-2' />
								<p className='text-2xl font-bold text-green-600'>{location.count}</p>
								<p className='text-sm text-muted-foreground'>{location.location}</p>
							</div>
						)) || (
							<div className='text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg'>
								<Globe className='h-8 w-8 text-gray-600 mx-auto mb-2' />
								<p className='text-sm text-muted-foreground'>No location data</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
