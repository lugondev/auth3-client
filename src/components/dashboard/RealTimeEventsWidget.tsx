'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Download, Filter, Search, RefreshCw, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown} from 'lucide-react'

interface AnalyticsEvent {
	id: string
	timestamp: string
	module: string
	event_type: string
	severity: 'info' | 'warning' | 'error' | 'success'
	message: string
	details?: Record<string, any>
	user_id?: string
	tenant_id?: string
}

interface EventFilter {
	module?: string
	severity?: string
	dateFrom?: string
	dateTo?: string
	searchTerm?: string
}

const mockEvents: AnalyticsEvent[] = [
	{
		id: '1',
		timestamp: new Date().toISOString(),
		module: 'OAuth2',
		event_type: 'authorization_success',
		severity: 'success',
		message: 'OAuth2 authorization completed successfully',
		details: {client_id: 'app123', scope: 'read write'},
		user_id: 'user123',
		tenant_id: 'tenant456',
	},
	{
		id: '2',
		timestamp: new Date(Date.now() - 5000).toISOString(),
		module: 'DID',
		event_type: 'did_creation_failed',
		severity: 'error',
		message: 'Failed to create DID due to invalid parameters',
		details: {error: 'missing_key_material', attempted_method: 'key'},
		user_id: 'user456',
		tenant_id: 'tenant123',
	},
	{
		id: '3',
		timestamp: new Date(Date.now() - 10000).toISOString(),
		module: 'KMS',
		event_type: 'key_rotation',
		severity: 'info',
		message: 'Scheduled key rotation executed',
		details: {key_id: 'key789', algorithm: 'RSA-2048'},
		tenant_id: 'tenant456',
	},
	{
		id: '4',
		timestamp: new Date(Date.now() - 15000).toISOString(),
		module: 'System',
		event_type: 'high_memory_usage',
		severity: 'warning',
		message: 'System memory usage exceeded 80% threshold',
		details: {usage_percent: 85, threshold: 80},
	},
	{
		id: '5',
		timestamp: new Date(Date.now() - 20000).toISOString(),
		module: 'Analytics',
		event_type: 'report_generated',
		severity: 'success',
		message: 'Monthly analytics report generated successfully',
		details: {report_type: 'monthly', records_processed: 15420},
	},
]

export function RealTimeEventsWidget() {
	const [events, setEvents] = useState<AnalyticsEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [filters, setFilters] = useState<EventFilter>({})
	const [showFilters, setShowFilters] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)

	const fetchEvents = async () => {
		try {
			setLoading(true)

			// In production, replace with actual API call:
			// const response = await EnhancedAnalyticsService.getRealTimeEvents(filters)
			await new Promise((resolve) => setTimeout(resolve, 500))

			setEvents(mockEvents)
		} catch (error) {
			console.error('Failed to fetch events:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchEvents()

		if (autoRefresh) {
			const interval = setInterval(fetchEvents, 10000) // Refresh every 10 seconds
			return () => clearInterval(interval)
		}
	}, [filters, autoRefresh])

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case 'success':
				return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'warning':
				return <AlertTriangle className='h-4 w-4 text-yellow-500' />
			case 'error':
				return <XCircle className='h-4 w-4 text-red-500' />
			default:
				return <TrendingUp className='h-4 w-4 text-blue-500' />
		}
	}

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'success':
				return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
			case 'warning':
				return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
			case 'error':
				return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
			default:
				return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
		}
	}

	const getModuleColor = (module: string) => {
		const colors = {
			'OAuth2': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
			'DID': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
			'KMS': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
			'Analytics': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
			'System': 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
		}
		return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-700'
	}

	const filteredEvents = events.filter((event) => {
		if (filters.module && event.module !== filters.module) return false
		if (filters.severity && event.severity !== filters.severity) return false
		if (filters.searchTerm && !event.message.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false
		if (filters.dateFrom && new Date(event.timestamp) < new Date(filters.dateFrom)) return false
		if (filters.dateTo && new Date(event.timestamp) > new Date(filters.dateTo)) return false
		return true
	})

	const exportEvents = () => {
		const dataStr = JSON.stringify(filteredEvents, null, 2)
		const dataBlob = new Blob([dataStr], {type: 'application/json'})
		const url = URL.createObjectURL(dataBlob)
		const link = document.createElement('a')
		link.href = url
		link.download = `events-${new Date().toISOString().split('T')[0]}.json`
		link.click()
		URL.revokeObjectURL(url)
	}

	if (loading && events.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<TrendingUp className='h-5 w-5' />
						Real-time Events
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className='h-16' />
						))}
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
						<TrendingUp className='h-5 w-5' />
						Real-time Events
						{autoRefresh && <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />}
					</CardTitle>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' onClick={() => setShowFilters(!showFilters)}>
							<Filter className='h-4 w-4' />
						</Button>
						<Button variant='outline' size='sm' onClick={() => setAutoRefresh(!autoRefresh)}>
							{autoRefresh ? <TrendingDown className='h-4 w-4' /> : <RefreshCw className='h-4 w-4' />}
						</Button>
						<Button variant='outline' size='sm' onClick={exportEvents}>
							<Download className='h-4 w-4' />
						</Button>
						<Button variant='outline' size='sm' onClick={fetchEvents} disabled={loading}>
							<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{/* Filters */}
				{showFilters && (
					<div className='mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div>
								<label className='text-sm font-medium'>Module</label>
								<select className='w-full mt-1 p-2 border rounded-md bg-background' value={filters.module || ''} onChange={(e) => setFilters({...filters, module: e.target.value || undefined})}>
									<option value=''>All Modules</option>
									<option value='OAuth2'>OAuth2</option>
									<option value='DID'>DID</option>
									<option value='KMS'>KMS</option>
									<option value='Analytics'>Analytics</option>
									<option value='System'>System</option>
								</select>
							</div>
							<div>
								<label className='text-sm font-medium'>Severity</label>
								<select className='w-full mt-1 p-2 border rounded-md bg-background' value={filters.severity || ''} onChange={(e) => setFilters({...filters, severity: e.target.value || undefined})}>
									<option value=''>All Severities</option>
									<option value='info'>Info</option>
									<option value='success'>Success</option>
									<option value='warning'>Warning</option>
									<option value='error'>Error</option>
								</select>
							</div>
							<div>
								<label className='text-sm font-medium'>Search</label>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
									<input type='text' className='w-full mt-1 pl-10 pr-4 py-2 border rounded-md bg-background' placeholder='Search events...' value={filters.searchTerm || ''} onChange={(e) => setFilters({...filters, searchTerm: e.target.value || undefined})} />
								</div>
							</div>
						</div>
						<div className='flex justify-end mt-3'>
							<Button variant='outline' size='sm' onClick={() => setFilters({})}>
								Clear Filters
							</Button>
						</div>
					</div>
				)}

				{/* Events Summary */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
					<div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
						<p className='text-2xl font-bold text-blue-600'>{filteredEvents.length}</p>
						<p className='text-sm text-blue-600'>Total Events</p>
					</div>
					<div className='text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
						<p className='text-2xl font-bold text-red-600'>{filteredEvents.filter((e) => e.severity === 'error').length}</p>
						<p className='text-sm text-red-600'>Errors</p>
					</div>
					<div className='text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
						<p className='text-2xl font-bold text-yellow-600'>{filteredEvents.filter((e) => e.severity === 'warning').length}</p>
						<p className='text-sm text-yellow-600'>Warnings</p>
					</div>
					<div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
						<p className='text-2xl font-bold text-green-600'>{filteredEvents.filter((e) => e.severity === 'success').length}</p>
						<p className='text-sm text-green-600'>Success</p>
					</div>
				</div>

				{/* Events List */}
				<div className='space-y-3 max-h-96 overflow-y-auto'>
					{filteredEvents.length === 0 ? (
						<Alert>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription>No events found matching the current filters.</AlertDescription>
						</Alert>
					) : (
						filteredEvents.map((event) => (
							<div key={event.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(event.severity)}`}>
								<div className='flex items-start justify-between'>
									<div className='flex items-start gap-3 flex-1'>
										{getSeverityIcon(event.severity)}
										<div className='flex-1'>
											<div className='flex items-center gap-2 mb-2'>
												<Badge variant='outline' className={getModuleColor(event.module)}>
													{event.module}
												</Badge>
												<Badge variant='secondary' className='text-xs'>
													{event.event_type}
												</Badge>
												<span className='text-xs text-gray-500'>{new Date(event.timestamp).toLocaleTimeString()}</span>
											</div>
											<p className='text-sm font-medium'>{event.message}</p>
											{event.details && (
												<div className='mt-2 text-xs text-gray-600 dark:text-gray-400'>
													<details>
														<summary className='cursor-pointer hover:text-gray-800 dark:hover:text-gray-200'>View Details</summary>
														<pre className='mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto'>{JSON.stringify(event.details, null, 2)}</pre>
													</details>
												</div>
											)}
											{(event.user_id || event.tenant_id) && (
												<div className='mt-2 text-xs text-gray-500 space-x-3'>
													{event.user_id && <span>User: {event.user_id}</span>}
													{event.tenant_id && <span>Tenant: {event.tenant_id}</span>}
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>

				{filteredEvents.length > 10 && (
					<div className='mt-4 text-center'>
						<Button variant='outline' size='sm'>
							Load More Events
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
