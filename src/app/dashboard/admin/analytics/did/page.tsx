'use client'

import {useState, useEffect, useCallback} from 'react'
import {format} from 'date-fns'
import {toast} from 'sonner'

// Component imports
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Skeleton} from '@/components/ui/skeleton'

// Icon imports
import {FileText, Shield, Clock, TrendingUp, RefreshCw, CheckCircle, AlertTriangle, Key, Database, Activity} from 'lucide-react'

// Service and type imports
import {DIDAnalyticsService} from '@/services/analyticsService'
import {AnalyticsCard} from '@/components/analytics/AnalyticsCard'
import {AnalyticsChart} from '@/components/analytics/AnalyticsChart'
import type {DIDDashboardResponse, TimeRangeRequest} from '@/types/analytics'

// Types
type TimeRange = '24h' | '7d' | '30d' | '90d'

// Utils
const TIME_RANGES = [
	{value: '24h' as TimeRange, label: 'Last 24 Hours', days: 1},
	{value: '7d' as TimeRange, label: 'Last 7 Days', days: 7},
	{value: '30d' as TimeRange, label: 'Last 30 Days', days: 30},
	{value: '90d' as TimeRange, label: 'Last 90 Days', days: 90},
] as const

const formatTimeRange = (days: number): TimeRangeRequest => {
	const endTime = new Date()
	const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000)
	return {
		start_time: startTime.toISOString(),
		end_time: endTime.toISOString(),
	}
}

const handleApiError = (error: unknown): string => {
	if (error && typeof error === 'object' && 'response' in error) {
		const axiosError = error as {response?: {data?: {message?: string}}; message?: string}
		if (axiosError.response?.data?.message) {
			return axiosError.response.data.message
		}
		if (axiosError.message) {
			return axiosError.message
		}
	}
	return 'An unexpected error occurred'
}

export default function DIDAnalyticsPage() {
	// State management
	const [didDashboard, setDIDDashboard] = useState<DIDDashboardResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('7d')

	const fetchAnalyticsData = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const timeRange = formatTimeRange(TIME_RANGES.find((r) => r.value === selectedTimeRange)?.days || 7)
			const dashboardData = await DIDAnalyticsService.getDIDDashboard(timeRange)
			setDIDDashboard(dashboardData)
		} catch (error) {
			console.error('Failed to fetch DID analytics data:', error)
			setError(handleApiError(error))
			toast.error('Failed to load DID analytics data')
		} finally {
			setLoading(false)
		}
	}, [selectedTimeRange])

	useEffect(() => {
		fetchAnalyticsData()
	}, [fetchAnalyticsData])

	if (loading) {
		return (
			<div className='container mx-auto py-8'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
					{[...Array(8)].map((_, i) => (
						<Skeleton key={i} className='h-32' />
					))}
				</div>
				<Skeleton className='h-64 mb-6' />
				<Skeleton className='h-96' />
			</div>
		)
	}

	return (
		<div className='container mx-auto py-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold flex items-center gap-2'>
						<FileText className='h-8 w-8' />
						DID Analytics
					</h1>
					<p className='text-muted-foreground mt-2'>Monitor DID operations, credential management, and identity verification activities</p>
				</div>
				<div className='flex items-center gap-2'>
					<Select value={selectedTimeRange} onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}>
						<SelectTrigger className='w-40'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TIME_RANGES.map((range) => (
								<SelectItem key={range.value} value={range.value}>
									{range.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button variant='outline' size='sm' onClick={fetchAnalyticsData} disabled={loading}>
						<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
						Refresh
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

			{/* Main Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<AnalyticsCard title='Total DIDs' value={didDashboard?.overview.total_dids || 0} icon={FileText} loading={loading} />
				<AnalyticsCard title='Active DIDs' value={didDashboard?.overview.active_dids || 0} icon={Activity} loading={loading} />
				<AnalyticsCard title='Success Rate' value={`${didDashboard?.performance_metrics.success_rate?.toFixed(1) || 0}%`} icon={TrendingUp} loading={loading} />
				<AnalyticsCard title='Avg Response Time' value={`${didDashboard?.performance_metrics.average_resolution_time || 0}ms`} icon={Clock} loading={loading} />
			</div>

			{/* Secondary Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<AnalyticsCard title='DIDs Created Today' value={didDashboard?.overview.dids_created_today || 0} icon={CheckCircle} loading={loading} />
				<AnalyticsCard title='DIDs Resolved Today' value={didDashboard?.overview.dids_resolved_today || 0} icon={Shield} loading={loading} />
				<AnalyticsCard title='Total Created' value={didDashboard?.creation_metrics.total_created || 0} icon={Key} loading={loading} />
				<AnalyticsCard title='Error Rate' value={`${didDashboard?.performance_metrics.error_rate?.toFixed(1) || 0}%`} icon={AlertTriangle} loading={loading} />
			</div>

			{/* Analytics Tabs */}
			<Tabs defaultValue='overview' className='space-y-6'>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='performance'>Performance</TabsTrigger>
					<TabsTrigger value='activity'>Recent Activity</TabsTrigger>
				</TabsList>

				<TabsContent value='overview' className='space-y-6'>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Database className='h-5 w-5' />
									Creation Metrics
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex items-center justify-between'>
										<span>Total Created</span>
										<Badge variant='default'>{didDashboard?.creation_metrics.total_created || 0}</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span>Created Today</span>
										<Badge variant='secondary'>{didDashboard?.creation_metrics.created_today || 0}</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span>Success Rate</span>
										<Badge variant='outline'>{didDashboard?.creation_metrics.success_rate?.toFixed(1) || 0}%</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span>Trend</span>
										<Badge variant={didDashboard?.creation_metrics.trend_direction === 'up' ? 'default' : 'secondary'}>{didDashboard?.creation_metrics.trend_direction || 'stable'}</Badge>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									System Health
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-center'>
									<div className='text-3xl font-bold text-green-600 mb-2'>{didDashboard?.overview.system_health || 'Unknown'}</div>
									<p className='text-sm text-gray-500 mb-4'>System Status</p>
									<div className='text-sm text-gray-600'>
										<div>Last Updated: {didDashboard?.overview.last_updated ? format(new Date(didDashboard.overview.last_updated), 'MMM dd, HH:mm') : 'N/A'}</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value='performance' className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle>Creation Time</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-blue-600'>{didDashboard?.performance_metrics.average_creation_time || 0}ms</div>
								<p className='text-sm text-gray-500'>Average creation time</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Resolution Time</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-green-600'>{didDashboard?.performance_metrics.average_resolution_time || 0}ms</div>
								<p className='text-sm text-gray-500'>Average resolution time</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Throughput</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-purple-600'>{didDashboard?.performance_metrics.throughput_per_second || 0}</div>
								<p className='text-sm text-gray-500'>Operations per second</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>P95 Response Time</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-orange-600'>{didDashboard?.performance_metrics.p95_response_time || 0}ms</div>
								<p className='text-sm text-gray-500'>95th percentile</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>P99 Response Time</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-red-600'>{didDashboard?.performance_metrics.p99_response_time || 0}ms</div>
								<p className='text-sm text-gray-500'>99th percentile</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Verify Time</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-indigo-600'>{didDashboard?.performance_metrics.average_verify_time || 0}ms</div>
								<p className='text-sm text-gray-500'>Average verify time</p>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value='activity' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Activity className='h-5 w-5' />
								Recent DID Activity
							</CardTitle>
						</CardHeader>
						<CardContent>
							{!didDashboard?.recent_activity?.length ? (
								<div className='text-center py-8 text-muted-foreground'>
									<FileText className='h-12 w-12 mx-auto mb-4 opacity-50' />
									<p>No recent DID activity found</p>
								</div>
							) : (
								<div className='space-y-3'>
									{didDashboard.recent_activity.slice(0, 10).map((activity, index) => (
										<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
											<div className='flex items-center gap-3'>
												<div className='flex-shrink-0'>
													{activity.type === 'create' && <CheckCircle className='h-4 w-4 text-green-600' />}
													{activity.type === 'resolve' && <Database className='h-4 w-4 text-blue-600' />}
													{activity.type === 'verify' && <Shield className='h-4 w-4 text-purple-600' />}
													{activity.type === 'update' && <Activity className='h-4 w-4 text-orange-600' />}
												</div>
												<div>
													<div className='font-medium capitalize'>{activity.type}</div>
													<div className='text-sm text-gray-500'>{activity.did}</div>
													<div className='text-xs text-gray-400'>{activity.description}</div>
												</div>
											</div>
											<div className='text-right'>
												<div className='text-sm font-medium'>{activity.status}</div>
												<div className='text-xs text-gray-500'>{format(new Date(activity.timestamp), 'MMM dd, HH:mm')}</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
