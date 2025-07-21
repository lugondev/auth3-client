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

interface OverviewMetrics {
	system_health: {
		status: 'healthy' | 'warning' | 'critical'
		uptime: number
		response_time: number
		error_rate: number
	}
	authentication: {
		total_logins_today: number
		failed_logins_today: number
		active_sessions: number
		success_rate: number
	}
	api: {
		requests_per_minute: number
		average_response_time: number
		error_rate: number
		peak_load: number
	}
	users: {
		total_users: number
		active_users_today: number
		new_registrations_today: number
		retention_rate: number
	}
	modules: {
		oauth2_requests: number
		did_operations: number
		kms_operations: number
		tenant_operations: number
	}
}

export default function AnalyticsOverviewPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

	const fetchOverviewMetrics = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const mockMetrics: OverviewMetrics = {
				system_health: {
					status: 'healthy',
					uptime: 99.8,
					response_time: 142,
					error_rate: 0.2,
				},
				authentication: {
					total_logins_today: 1247,
					failed_logins_today: 23,
					active_sessions: 892,
					success_rate: 98.2,
				},
				api: {
					requests_per_minute: 342,
					average_response_time: 95,
					error_rate: 1.2,
					peak_load: 1200,
				},
				users: {
					total_users: 15420,
					active_users_today: 3241,
					new_registrations_today: 47,
					retention_rate: 87.5,
				},
				modules: {
					oauth2_requests: 4231,
					did_operations: 892,
					kms_operations: 1543,
					tenant_operations: 234,
				},
			}

			setMetrics(mockMetrics)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch overview metrics:', error)
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
					<Button variant='outline' size='sm' onClick={fetchOverviewMetrics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* System Health Alert */}
			{metrics && metrics.system_health.status !== 'healthy' && (
				<Alert variant='destructive' className='mb-6'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>
						<strong>System Alert:</strong> System status is {metrics.system_health.status}. Response time: {metrics.system_health.response_time}ms, Error rate: {metrics.system_health.error_rate}%
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
									{getStatusIcon(metrics.system_health.status)}
									<span className={`font-semibold ${getStatusColor(metrics.system_health.status)}`}>{metrics.system_health.status.charAt(0).toUpperCase() + metrics.system_health.status.slice(1)}</span>
								</div>
								<p className='text-sm text-muted-foreground'>Overall Status</p>
							</div>
							<div className='text-center'>
								<p className='text-2xl font-bold text-green-600'>{metrics.system_health.uptime}%</p>
								<p className='text-sm text-muted-foreground'>Uptime</p>
							</div>
							<div className='text-center'>
								<p className='text-2xl font-bold text-blue-600'>{metrics.system_health.response_time}ms</p>
								<p className='text-sm text-muted-foreground'>Avg Response Time</p>
							</div>
							<div className='text-center'>
								<p className={`text-2xl font-bold ${metrics.system_health.error_rate > 1 ? 'text-red-600' : 'text-green-600'}`}>{metrics.system_health.error_rate}%</p>
								<p className='text-sm text-muted-foreground'>Error Rate</p>
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
								<p className='text-2xl font-bold'>{metrics?.authentication.total_logins_today || 0}</p>
								<p className='text-sm text-muted-foreground'>Logins Today</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='default' className='text-xs'>
										{metrics?.authentication.success_rate || 0}% Success
									</Badge>
									<span className='text-xs text-red-600'>{metrics?.authentication.failed_logins_today || 0} Failed</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>

				{/* API Metrics */}
				<Link href='/dashboard/admin/analytics/api'>
					<Card className='hover:shadow-md transition-shadow cursor-pointer'>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<Globe className='h-8 w-8 text-green-600' />
								<ArrowUpRight className='h-4 w-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-2xl font-bold'>{metrics?.api.requests_per_minute || 0}</p>
								<p className='text-sm text-muted-foreground'>Requests/min</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='secondary' className='text-xs'>
										{metrics?.api.average_response_time || 0}ms Avg
									</Badge>
									<span className='text-xs text-muted-foreground'>Peak: {metrics?.api.peak_load || 0}</span>
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
								<p className='text-2xl font-bold'>{metrics?.users.active_users_today || 0}</p>
								<p className='text-sm text-muted-foreground'>Active Users Today</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='outline' className='text-xs'>
										+{metrics?.users.new_registrations_today || 0} New
									</Badge>
									<span className='text-xs text-green-600'>{metrics?.users.retention_rate || 0}% Retention</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>

				{/* Database Metrics */}
				<Link href='/dashboard/admin/analytics/database'>
					<Card className='hover:shadow-md transition-shadow cursor-pointer'>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<Database className='h-8 w-8 text-orange-600' />
								<ArrowUpRight className='h-4 w-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-2xl font-bold'>{metrics?.users.total_users || 0}</p>
								<p className='text-sm text-muted-foreground'>Total Users</p>
								<div className='flex items-center gap-2 mt-2'>
									<Badge variant='secondary' className='text-xs'>
										Active DB
									</Badge>
									<span className='text-xs text-green-600'>Healthy</span>
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
						Module Performance
					</CardTitle>
					<CardDescription>Today's activity across core system modules</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
							<Shield className='h-8 w-8 text-blue-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-blue-600'>{metrics?.modules.oauth2_requests || 0}</p>
							<p className='text-sm text-muted-foreground'>OAuth2 Requests</p>
						</div>
						<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
							<Activity className='h-8 w-8 text-green-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-green-600'>{metrics?.modules.did_operations || 0}</p>
							<p className='text-sm text-muted-foreground'>DID Operations</p>
						</div>
						<div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
							<Database className='h-8 w-8 text-purple-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-purple-600'>{metrics?.modules.kms_operations || 0}</p>
							<p className='text-sm text-muted-foreground'>KMS Operations</p>
						</div>
						<div className='text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
							<Users className='h-8 w-8 text-orange-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-orange-600'>{metrics?.modules.tenant_operations || 0}</p>
							<p className='text-sm text-muted-foreground'>Tenant Operations</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
