'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { EnhancedAnalyticsService, EnhancedSystemAnalytics } from '@/services/enhancedAnalyticsService'
import {
	Activity,
	AlertTriangle,
	CheckCircle,
	Clock,
	Cpu,
	Database,
	HardDrive,
	MemoryStick,
	RefreshCw,
	Server,
	Shield,
	TrendingUp,
	Wifi,
	Zap
} from 'lucide-react'

interface SystemAnalyticsDashboardProps {
	onRefresh?: () => void
}

export function SystemAnalyticsDashboard({ onRefresh }: SystemAnalyticsDashboardProps) {
	const [loading, setLoading] = useState(true)
	const [systemData, setSystemData] = useState<EnhancedSystemAnalytics | null>(null)
	const [error, setError] = useState<string | null>(null)

	const fetchData = async () => {
		try {
			setLoading(true)
			setError(null)
			
			const data = await EnhancedAnalyticsService.getEnhancedSystemAnalytics()
			setSystemData(data)
		} catch (err) {
			console.error('Failed to fetch system analytics:', err)
			setError('Failed to load system analytics data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handleRefresh = () => {
		fetchData()
		onRefresh?.()
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
			case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
			case 'critical': return 'text-red-600 bg-red-50 border-red-200'
			default: return 'text-gray-600 bg-gray-50 border-gray-200'
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'healthy': return <CheckCircle className='h-4 w-4' />
			case 'warning': return <AlertTriangle className='h-4 w-4' />
			case 'critical': return <AlertTriangle className='h-4 w-4' />
			default: return <Activity className='h-4 w-4' />
		}
	}

	const getServiceStatusIcon = (status: string) => {
		switch (status) {
			case 'online': return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'offline': return <AlertTriangle className='h-4 w-4 text-red-500' />
			case 'degraded': return <AlertTriangle className='h-4 w-4 text-yellow-500' />
			default: return <Activity className='h-4 w-4 text-gray-500' />
		}
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<div className='flex items-center justify-between'>
					<h2 className='text-2xl font-semibold'>System Analytics</h2>
					<Skeleton className='h-10 w-24' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className='h-32' />
					))}
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<Skeleton className='h-64' />
					<Skeleton className='h-64' />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<Card className='border-red-200'>
				<CardContent className='p-6'>
					<div className='flex items-center gap-3 text-red-600'>
						<AlertTriangle className='h-5 w-5' />
						<span>{error}</span>
						<Button variant='outline' size='sm' onClick={handleRefresh}>
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>System Analytics</h2>
				<Button variant='outline' size='sm' onClick={handleRefresh} className='gap-2'>
					<RefreshCw className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* System Overview */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Server className='h-8 w-8 text-blue-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>System Health</p>
								<div className='flex items-center gap-2'>
									{getStatusIcon(systemData?.system_health || 'unknown')}
									<Badge className={getStatusColor(systemData?.system_health || 'unknown')}>
										{systemData?.system_health || 'Unknown'}
									</Badge>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<Activity className='h-8 w-8 text-green-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Active Users</p>
								<p className='text-2xl font-bold'>{systemData?.active_users?.toLocaleString() || 0}</p>
								<p className='text-xs text-muted-foreground'>of {systemData?.total_users?.toLocaleString() || 0} total</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center gap-3'>
							<TrendingUp className='h-8 w-8 text-purple-600' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>User Growth</p>
								<p className='text-2xl font-bold text-purple-600'>+{systemData?.user_growth_percentage?.toFixed(1) || 0}%</p>
								<p className='text-xs text-muted-foreground'>this month</p>
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
								<p className='text-2xl font-bold'>{systemData?.security_events?.toLocaleString() || 0}</p>
								<p className='text-xs text-muted-foreground'>recent alerts</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Performance Metrics */}
			{systemData?.performance_metrics && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Zap className='h-5 w-5' />
							Performance Metrics
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Clock className='h-4 w-4 text-blue-500' />
									<span className='text-sm font-medium'>Response Time</span>
								</div>
								<p className='text-2xl font-bold text-blue-600'>
									{systemData.performance_metrics.avg_response_time}ms
								</p>
							</div>

							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Activity className='h-4 w-4 text-green-500' />
									<span className='text-sm font-medium'>Throughput</span>
								</div>
								<p className='text-2xl font-bold text-green-600'>
									{systemData.performance_metrics.throughput}/s
								</p>
							</div>

							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<AlertTriangle className='h-4 w-4 text-red-500' />
									<span className='text-sm font-medium'>Error Rate</span>
								</div>
								<p className='text-2xl font-bold text-red-600'>
									{systemData.performance_metrics.error_rate.toFixed(2)}%
								</p>
							</div>

							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<MemoryStick className='h-4 w-4 text-purple-500' />
									<span className='text-sm font-medium'>Memory</span>
								</div>
								<p className='text-2xl font-bold text-purple-600'>
									{systemData.performance_metrics.memory_usage.toFixed(1)}%
								</p>
								<Progress value={systemData.performance_metrics.memory_usage} className='h-2' />
							</div>

							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Cpu className='h-4 w-4 text-orange-500' />
									<span className='text-sm font-medium'>CPU</span>
								</div>
								<p className='text-2xl font-bold text-orange-600'>
									{systemData.performance_metrics.cpu_usage.toFixed(1)}%
								</p>
								<Progress value={systemData.performance_metrics.cpu_usage} className='h-2' />
							</div>

							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<HardDrive className='h-4 w-4 text-gray-500' />
									<span className='text-sm font-medium'>Disk</span>
								</div>
								<p className='text-2xl font-bold text-gray-600'>
									{systemData.performance_metrics.disk_usage.toFixed(1)}%
								</p>
								<Progress value={systemData.performance_metrics.disk_usage} className='h-2' />
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Module Health & Integration Status */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{/* Module Health */}
				{systemData?.module_health && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Database className='h-5 w-5' />
								Module Health
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{Object.entries(systemData.module_health).map(([moduleName, moduleData]) => (
								<div key={moduleName} className='flex items-center justify-between p-3 border rounded-lg'>
									<div className='flex items-center gap-3'>
										{getStatusIcon(moduleData.status)}
										<div>
											<h4 className='font-medium capitalize'>{moduleName}</h4>
											<p className='text-sm text-muted-foreground'>
												Uptime: {('uptime' in moduleData) ? moduleData.uptime.toFixed(1) : 'N/A'}%
											</p>
										</div>
									</div>
									<Badge className={getStatusColor(moduleData.status)}>
										{moduleData.status}
									</Badge>
								</div>
							))}
						</CardContent>
					</Card>
				)}

				{/* Integration Health */}
				{systemData?.integration_health && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Wifi className='h-5 w-5' />
								Integration Health
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{systemData.integration_health.map((integration, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
									<div className='flex items-center gap-3'>
										{getServiceStatusIcon(integration.status)}
										<div>
											<h4 className='font-medium'>{integration.service_name}</h4>
											<p className='text-sm text-muted-foreground'>
												Response: {integration.response_time}ms
											</p>
										</div>
									</div>
									<div className='text-right'>
										<Badge variant={integration.status === 'online' ? 'default' : 'destructive'}>
											{integration.status}
										</Badge>
										<p className='text-xs text-muted-foreground mt-1'>
											{new Date(integration.last_check).toLocaleTimeString()}
										</p>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				)}
			</div>

			{/* System Statistics */}
			<Card>
				<CardHeader>
					<CardTitle>System Statistics</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center'>
						<div className='space-y-2'>
							<Database className='h-8 w-8 text-blue-600 mx-auto' />
							<h3 className='font-medium'>Total Users</h3>
							<p className='text-3xl font-bold text-blue-600'>
								{systemData?.total_users?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-muted-foreground'>
								+{systemData?.new_users_today || 0} today
							</p>
						</div>

						<div className='space-y-2'>
							<Server className='h-8 w-8 text-green-600 mx-auto' />
							<h3 className='font-medium'>Total Tenants</h3>
							<p className='text-3xl font-bold text-green-600'>
								{systemData?.total_tenants?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-muted-foreground'>
								{systemData?.active_tenants || 0} active
							</p>
						</div>

						<div className='space-y-2'>
							<Activity className='h-8 w-8 text-purple-600 mx-auto' />
							<h3 className='font-medium'>Total Logins</h3>
							<p className='text-3xl font-bold text-purple-600'>
								{systemData?.total_logins?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-muted-foreground'>
								{systemData?.failed_logins || 0} failed
							</p>
						</div>

						<div className='space-y-2'>
							<Shield className='h-8 w-8 text-orange-600 mx-auto' />
							<h3 className='font-medium'>Security Events</h3>
							<p className='text-3xl font-bold text-orange-600'>
								{systemData?.security_events?.toLocaleString() || 0}
							</p>
							<p className='text-sm text-muted-foreground'>
								Recent alerts
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
