'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {Activity, Zap, Clock, AlertTriangle, CheckCircle, XCircle, Wifi, Users, MessageSquare, Bell, RefreshCw, Download, Radio, Eye} from 'lucide-react'

interface RealTimeEvent {
	id: string
	timestamp: string
	type: 'authentication' | 'user_action' | 'system' | 'error' | 'security'
	severity: 'low' | 'medium' | 'high' | 'critical'
	source: string
	message: string
	user_id?: string
	ip_address?: string
	metadata?: Record<string, unknown>
}

interface RealTimeAnalytics {
	current_connections: {
		websocket: number
		sse: number
		total: number
		peak_today: number
	}
	event_statistics: {
		total_events_today: number
		events_per_minute: number
		by_type: Record<string, number>
		by_severity: Record<string, number>
	}
	active_channels: Array<{
		channel: string
		subscribers: number
		events_sent: number
		last_activity: string
	}>
	recent_events: RealTimeEvent[]
	performance_metrics: {
		avg_delivery_time: number
		delivery_success_rate: number
		connection_uptime: number
		bandwidth_usage: number
	}
	geographic_connections: Array<{
		country: string
		connections: number
		avg_latency: number
	}>
	alerts: Array<{
		id: string
		type: 'warning' | 'error' | 'info'
		message: string
		timestamp: string
		acknowledged: boolean
	}>
}

export default function RealTimeEventsPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [analytics, setAnalytics] = useState<RealTimeAnalytics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
	const [autoRefresh, setAutoRefresh] = useState(true)

	const fetchRealTimeAnalytics = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			await new Promise((resolve) => setTimeout(resolve, 800))

			const mockAnalytics: RealTimeAnalytics = {
				current_connections: {
					websocket: 234,
					sse: 156,
					total: 390,
					peak_today: 567,
				},
				event_statistics: {
					total_events_today: 45672,
					events_per_minute: 78.5,
					by_type: {
						authentication: 15234,
						user_action: 18432,
						system: 8976,
						error: 2341,
						security: 689,
					},
					by_severity: {
						low: 38901,
						medium: 5234,
						high: 1342,
						critical: 195,
					},
				},
				active_channels: [
					{
						channel: 'user-notifications',
						subscribers: 234,
						events_sent: 12456,
						last_activity: '2024-01-15T14:30:25Z',
					},
					{
						channel: 'system-alerts',
						subscribers: 45,
						events_sent: 3421,
						last_activity: '2024-01-15T14:29:18Z',
					},
					{
						channel: 'analytics-updates',
						subscribers: 23,
						events_sent: 1876,
						last_activity: '2024-01-15T14:28:45Z',
					},
					{
						channel: 'security-events',
						subscribers: 12,
						events_sent: 567,
						last_activity: '2024-01-15T14:27:32Z',
					},
					{
						channel: 'audit-trail',
						subscribers: 8,
						events_sent: 2341,
						last_activity: '2024-01-15T14:26:15Z',
					},
				],
				recent_events: [
					{
						id: '1',
						timestamp: '2024-01-15T14:30:25Z',
						type: 'authentication',
						severity: 'low',
						source: 'auth-service',
						message: 'User logged in successfully',
						user_id: 'user_123',
						ip_address: '192.168.1.100',
					},
					{
						id: '2',
						timestamp: '2024-01-15T14:29:18Z',
						type: 'security',
						severity: 'high',
						source: 'security-monitor',
						message: 'Multiple failed login attempts detected',
						ip_address: '10.0.0.50',
					},
					{
						id: '3',
						timestamp: '2024-01-15T14:28:45Z',
						type: 'system',
						severity: 'medium',
						source: 'database',
						message: 'Connection pool threshold reached',
						metadata: {pool_size: 95, max_size: 100},
					},
					{
						id: '4',
						timestamp: '2024-01-15T14:27:32Z',
						type: 'user_action',
						severity: 'low',
						source: 'api-gateway',
						message: 'Credential created',
						user_id: 'user_456',
					},
					{
						id: '5',
						timestamp: '2024-01-15T14:26:15Z',
						type: 'error',
						severity: 'critical',
						source: 'payment-service',
						message: 'Payment processing failed',
						metadata: {error_code: 'PAYMENT_GATEWAY_TIMEOUT'},
					},
				],
				performance_metrics: {
					avg_delivery_time: 12.5,
					delivery_success_rate: 99.7,
					connection_uptime: 99.9,
					bandwidth_usage: 2.4,
				},
				geographic_connections: [
					{country: 'United States', connections: 156, avg_latency: 45.2},
					{country: 'Vietnam', connections: 89, avg_latency: 78.5},
					{country: 'Germany', connections: 67, avg_latency: 52.1},
					{country: 'Japan', connections: 45, avg_latency: 89.3},
					{country: 'United Kingdom', connections: 33, avg_latency: 48.7},
				],
				alerts: [
					{
						id: '1',
						type: 'warning',
						message: 'High connection count approaching limit',
						timestamp: '2024-01-15T14:25:00Z',
						acknowledged: false,
					},
					{
						id: '2',
						type: 'error',
						message: 'WebSocket connection failures increasing',
						timestamp: '2024-01-15T14:20:00Z',
						acknowledged: true,
					},
					{
						id: '3',
						type: 'info',
						message: 'Scheduled maintenance window starting soon',
						timestamp: '2024-01-15T14:15:00Z',
						acknowledged: false,
					},
				],
			}

			setAnalytics(mockAnalytics)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch real-time analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchRealTimeAnalytics()

		let interval: NodeJS.Timeout | null = null
		if (autoRefresh) {
			// Auto-refresh every 5 seconds for real-time data
			interval = setInterval(fetchRealTimeAnalytics, 5000)
		}

		return () => {
			if (interval) clearInterval(interval)
		}
	}, [autoRefresh])

	const exportData = () => {
		if (analytics) {
			const dataStr = JSON.stringify(analytics, null, 2)
			const dataBlob = new Blob([dataStr], {type: 'application/json'})
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `realtime-events-${new Date().toISOString().split('T')[0]}.json`
			link.click()
			URL.revokeObjectURL(url)
		}
	}

	const formatTimeAgo = (timestamp: string) => {
		const diff = new Date().getTime() - new Date(timestamp).getTime()
		const minutes = Math.floor(diff / 60000)
		const seconds = Math.floor((diff % 60000) / 1000)

		if (minutes > 0) return `${minutes}m ${seconds}s ago`
		return `${seconds}s ago`
	}

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'low':
				return 'bg-green-100 text-green-800'
			case 'medium':
				return 'bg-yellow-100 text-yellow-800'
			case 'high':
				return 'bg-orange-100 text-orange-800'
			case 'critical':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getTypeIcon = (type: string) => {
		switch (type) {
			case 'authentication':
				return <Users className='h-4 w-4' />
			case 'user_action':
				return <Activity className='h-4 w-4' />
			case 'system':
				return <Zap className='h-4 w-4' />
			case 'error':
				return <XCircle className='h-4 w-4' />
			case 'security':
				return <AlertTriangle className='h-4 w-4' />
			default:
				return <MessageSquare className='h-4 w-4' />
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
						<Radio className='h-8 w-8' />
						Real-time Events
					</h1>
					<p className='text-muted-foreground mt-2'>Live event monitoring and real-time system activity</p>
				</div>
				<div className='flex items-center gap-2'>
					<div className='flex items-center gap-2'>
						<Eye className='h-4 w-4' />
						<span className='text-sm'>Auto-refresh:</span>
						<Button variant={autoRefresh ? 'default' : 'outline'} size='sm' onClick={() => setAutoRefresh(!autoRefresh)}>
							{autoRefresh ? 'ON' : 'OFF'}
						</Button>
					</div>
					<span className='text-sm text-muted-foreground'>Last updated: {lastRefresh.toLocaleTimeString()}</span>
					<Button variant='outline' size='sm' onClick={exportData}>
						<Download className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={fetchRealTimeAnalytics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Connection Overview */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Wifi className='h-8 w-8 text-blue-600' />
							<Badge variant='default'>Live</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.current_connections.total || 0}</p>
							<p className='text-sm text-muted-foreground'>Active Connections</p>
							<p className='text-xs text-blue-600 mt-1'>Peak today: {analytics?.current_connections.peak_today || 0}</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Activity className='h-8 w-8 text-green-600' />
							<Badge variant='outline'>Events</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.event_statistics.events_per_minute.toFixed(1) || 0}</p>
							<p className='text-sm text-muted-foreground'>Events/Minute</p>
							<p className='text-xs text-green-600 mt-1'>{analytics?.event_statistics.total_events_today.toLocaleString() || 0} today</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Clock className='h-8 w-8 text-purple-600' />
							<Badge variant='secondary'>Performance</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.performance_metrics.avg_delivery_time || 0}ms</p>
							<p className='text-sm text-muted-foreground'>Avg Delivery Time</p>
							<p className='text-xs text-purple-600 mt-1'>{analytics?.performance_metrics.delivery_success_rate || 0}% success rate</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<CheckCircle className='h-8 w-8 text-orange-600' />
							<Badge variant='outline'>Uptime</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.performance_metrics.connection_uptime || 0}%</p>
							<p className='text-sm text-muted-foreground'>Connection Uptime</p>
							<p className='text-xs text-orange-600 mt-1'>{analytics?.performance_metrics.bandwidth_usage || 0} MB/s bandwidth</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Active Channels & Geographic Distribution */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<MessageSquare className='h-5 w-5' />
							Active Channels
						</CardTitle>
						<CardDescription>Real-time event channels and subscribers</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{analytics?.active_channels.map((channel, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
									<div>
										<p className='font-medium'>{channel.channel}</p>
										<p className='text-sm text-muted-foreground'>
											{channel.subscribers} subscribers • {channel.events_sent.toLocaleString()} events sent
										</p>
										<p className='text-xs text-muted-foreground'>Last activity: {formatTimeAgo(channel.last_activity)}</p>
									</div>
									<div className='flex items-center gap-2'>
										<div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
										<span className='text-sm font-semibold'>{channel.subscribers}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Wifi className='h-5 w-5' />
							Geographic Connections
						</CardTitle>
						<CardDescription>Real-time connections by location</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{analytics?.geographic_connections.map((geo, index) => (
								<div key={index} className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold'>{index + 1}</div>
										<span className='text-sm font-medium'>{geo.country}</span>
									</div>
									<div className='text-right'>
										<p className='text-sm font-semibold'>{geo.connections} connections</p>
										<p className='text-xs text-muted-foreground'>{geo.avg_latency.toFixed(1)}ms avg latency</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Event Statistics */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Activity className='h-5 w-5' />
							Events by Type
						</CardTitle>
						<CardDescription>Event distribution by category</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.event_statistics.by_type || {}).map(([type, count]) => (
								<div key={type} className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
									<div className='flex items-center gap-3'>
										{getTypeIcon(type)}
										<span className='text-sm font-medium capitalize'>{type.replace('_', ' ')}</span>
									</div>
									<span className='text-lg font-bold'>{count.toLocaleString()}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5' />
							Events by Severity
						</CardTitle>
						<CardDescription>Event distribution by severity level</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.event_statistics.by_severity || {}).map(([severity, count]) => (
								<div key={severity} className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
									<div className='flex items-center gap-3'>
										<Badge className={getSeverityColor(severity)}>{severity.toUpperCase()}</Badge>
									</div>
									<span className='text-lg font-bold'>{count.toLocaleString()}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Events */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Bell className='h-5 w-5' />
						Recent Events
					</CardTitle>
					<CardDescription>Latest real-time events across all systems</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{analytics?.recent_events.map((event) => (
							<div key={event.id} className='flex items-start gap-4 p-4 border rounded-lg'>
								<div className='flex items-center gap-2 min-w-0 flex-1'>
									{getTypeIcon(event.type)}
									<Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
									<div className='min-w-0 flex-1'>
										<p className='text-sm font-medium truncate'>{event.message}</p>
										<div className='flex items-center gap-4 text-xs text-muted-foreground mt-1'>
											<span>Source: {event.source}</span>
											{event.user_id && <span>User: {event.user_id}</span>}
											{event.ip_address && <span>IP: {event.ip_address}</span>}
										</div>
									</div>
								</div>
								<div className='text-right'>
									<p className='text-xs text-muted-foreground'>{formatTimeAgo(event.timestamp)}</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* System Alerts */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<AlertTriangle className='h-5 w-5' />
						System Alerts
					</CardTitle>
					<CardDescription>Active system alerts and notifications</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{analytics?.alerts.map((alert) => (
							<div key={alert.id} className={`flex items-center justify-between p-4 border rounded-lg ${alert.acknowledged ? 'opacity-60' : ''}`}>
								<div className='flex items-center gap-3'>
									<div className={`w-3 h-3 rounded-full ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} ${!alert.acknowledged ? 'animate-pulse' : ''}`}></div>
									<div>
										<p className='text-sm font-medium'>{alert.message}</p>
										<p className='text-xs text-muted-foreground'>{formatTimeAgo(alert.timestamp)}</p>
									</div>
								</div>
								<Badge variant={alert.acknowledged ? 'outline' : 'default'}>{alert.acknowledged ? 'Acknowledged' : alert.type}</Badge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
