'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EnhancedAnalyticsService } from '@/services/enhancedAnalyticsService'
import { AlertTriangle, CheckCircle, XCircle, Clock, Activity } from 'lucide-react'

interface SystemHealth {
	overall_status: 'healthy' | 'warning' | 'critical'
	uptime: number
	response_time: number
	error_rate: number
	active_sessions: number
	last_updated: string
}

interface ServiceStatus {
	service: string
	status: 'up' | 'down' | 'degraded'
	response_time: number
	last_check: string
	error_count: number
}

const mockSystemHealth: SystemHealth = {
	overall_status: 'healthy',
	uptime: 99.8,
	response_time: 145,
	error_rate: 0.2,
	active_sessions: 1247,
	last_updated: new Date().toISOString()
}

const mockServiceStatuses: ServiceStatus[] = [
	{
		service: 'Auth Service',
		status: 'up',
		response_time: 120,
		last_check: new Date().toISOString(),
		error_count: 0
	},
	{
		service: 'DID Service',
		status: 'up',
		response_time: 95,
		last_check: new Date().toISOString(),
		error_count: 0
	},
	{
		service: 'KMS Service',
		status: 'degraded',
		response_time: 380,
		last_check: new Date().toISOString(),
		error_count: 2
	},
	{
		service: 'Analytics Service',
		status: 'up',
		response_time: 67,
		last_check: new Date().toISOString(),
		error_count: 0
	},
	{
		service: 'Database',
		status: 'up',
		response_time: 12,
		last_check: new Date().toISOString(),
		error_count: 0
	},
	{
		service: 'Redis Cache',
		status: 'up',
		response_time: 8,
		last_check: new Date().toISOString(),
		error_count: 0
	}
]

export function SystemHealthDashboard() {
	const [loading, setLoading] = useState(true)
	const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
	const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([])
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

	const fetchSystemHealth = async () => {
		try {
			setLoading(true)
			
			// In real implementation, this would call:
			// const response = await EnhancedAnalyticsService.getSystemHealth()
			// For now, using mock data
			await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
			
			setSystemHealth(mockSystemHealth)
			setServiceStatuses(mockServiceStatuses)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch system health:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchSystemHealth()
		
		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchSystemHealth, 30000)
		return () => clearInterval(interval)
	}, [])

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'up':
			case 'healthy':
				return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'degraded':
			case 'warning':
				return <AlertTriangle className='h-4 w-4 text-yellow-500' />
			case 'down':
			case 'critical':
				return <XCircle className='h-4 w-4 text-red-500' />
			default:
				return <Clock className='h-4 w-4 text-gray-500' />
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'up':
			case 'healthy':
				return 'text-green-600 dark:text-green-400'
			case 'degraded':
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400'
			case 'down':
			case 'critical':
				return 'text-red-600 dark:text-red-400'
			default:
				return 'text-gray-600 dark:text-gray-400'
		}
	}

	const getResponseTimeColor = (responseTime: number) => {
		if (responseTime < 100) return 'text-green-600 dark:text-green-400'
		if (responseTime < 300) return 'text-yellow-600 dark:text-yellow-400'
		return 'text-red-600 dark:text-red-400'
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						System Health
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<Skeleton className='h-20' />
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className='h-16' />
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						System Health
					</CardTitle>
					<div className='text-sm text-gray-500 dark:text-gray-400'>
						Last updated: {lastRefresh.toLocaleTimeString()}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{/* Overall System Status */}
				{systemHealth && (
					<div className={`mb-6 p-6 rounded-lg border-2 ${
						systemHealth.overall_status === 'healthy' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
						systemHealth.overall_status === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
						'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
					}`}>
						<div className='flex items-center gap-3 mb-4'>
							{getStatusIcon(systemHealth.overall_status)}
							<h3 className={`text-lg font-semibold ${getStatusColor(systemHealth.overall_status)}`}>
								Overall System Status: {systemHealth.overall_status.charAt(0).toUpperCase() + systemHealth.overall_status.slice(1)}
							</h3>
						</div>
						
						<div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
							<div className='text-center'>
								<div className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>Uptime</div>
								<div className='text-2xl font-bold text-green-600 dark:text-green-400'>{systemHealth.uptime}%</div>
							</div>
							<div className='text-center'>
								<div className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>Response Time</div>
								<div className={`text-2xl font-bold ${getResponseTimeColor(systemHealth.response_time)}`}>
									{systemHealth.response_time}ms
								</div>
							</div>
							<div className='text-center'>
								<div className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>Error Rate</div>
								<div className={`text-2xl font-bold ${systemHealth.error_rate > 1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
									{systemHealth.error_rate}%
								</div>
							</div>
							<div className='text-center'>
								<div className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>Active Sessions</div>
								<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{systemHealth.active_sessions.toLocaleString()}</div>
							</div>
						</div>
					</div>
				)}

				{/* Service Status Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{serviceStatuses.map((service) => (
						<Card key={service.service} className={`border-l-4 ${
							service.status === 'up' ? 'border-l-green-500' :
							service.status === 'degraded' ? 'border-l-yellow-500' :
							'border-l-red-500'
						} hover:shadow-md transition-shadow`}>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between mb-3'>
									<h3 className='font-semibold text-gray-900 dark:text-gray-100'>{service.service}</h3>
									{getStatusIcon(service.status)}
								</div>
								
								<div className='space-y-3'>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-gray-600 dark:text-gray-400'>Status</span>
										<span className={`text-sm font-semibold px-2 py-1 rounded-full ${
											service.status === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
											service.status === 'degraded' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
											'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
										}`}>
											{service.status.charAt(0).toUpperCase() + service.status.slice(1)}
										</span>
									</div>
									
									<div className='flex justify-between items-center'>
										<span className='text-sm text-gray-600 dark:text-gray-400'>Response Time</span>
										<span className={`text-sm font-semibold ${getResponseTimeColor(service.response_time)}`}>
											{service.response_time}ms
										</span>
									</div>
									
									{service.error_count > 0 && (
										<div className='flex justify-between items-center'>
											<span className='text-sm text-gray-600 dark:text-gray-400'>Errors (24h)</span>
											<span className='text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded'>
												{service.error_count}
											</span>
										</div>
									)}
									
									<div className='flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700'>
										<span className='text-xs text-gray-500 dark:text-gray-500'>Last Check</span>
										<span className='text-xs text-gray-500 dark:text-gray-500'>
											{new Date(service.last_check).toLocaleTimeString()}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Critical Issues Alert */}
				{serviceStatuses.some(s => s.status === 'down' || s.status === 'degraded') && (
					<Alert variant='destructive' className='mt-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'>
						<AlertTriangle className='h-4 w-4' />
						<AlertDescription>
							<div className='flex items-center gap-2'>
								<strong>🚨 Attention Required:</strong>
								<span>Some services are experiencing issues.</span>
							</div>
							<div className='mt-2 text-sm'>
								{serviceStatuses.filter(s => s.status === 'down').length > 0 && (
									<div className='text-red-700 dark:text-red-300'>
										• {serviceStatuses.filter(s => s.status === 'down').length} service(s) are down
									</div>
								)}
								{serviceStatuses.filter(s => s.status === 'degraded').length > 0 && (
									<div className='text-yellow-700 dark:text-yellow-300'>
										• {serviceStatuses.filter(s => s.status === 'degraded').length} service(s) are degraded
									</div>
								)}
							</div>
						</AlertDescription>
					</Alert>
				)}

				{/* Refresh Button */}
				<div className='flex justify-center mt-6'>
					<button
						onClick={fetchSystemHealth}
						disabled={loading}
						className='px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md'
					>
						<Activity className='h-4 w-4' />
						{loading ? 'Refreshing...' : 'Refresh Status'}
					</button>
				</div>
			</CardContent>
		</Card>
	)
}
