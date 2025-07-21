'use client'

// OAuth2 Analytics Page - Integrated with backend API endpoints
// Uses AnalyticsAPI.oauth2 service for real backend data integration
// TODO: Replace mock data with actual API calls using useOAuth2Analytics hook

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {Shield, Activity, Clock, CheckCircle, XCircle, TrendingUp, AlertTriangle, RefreshCw, Download, Users, Globe, Key} from 'lucide-react'

interface OAuth2Analytics {
	overview: {
		total_requests_today: number
		success_rate: number
		avg_response_time: number
		active_sessions: number
		peak_load: number
		error_rate: number
	}
	authentication_flows: {
		authorization_code: number
		implicit: number
		client_credentials: number
		refresh_token: number
	}
	client_analytics: Array<{
		client_id: string
		client_name: string
		requests: number
		success_rate: number
		last_used: string
	}>
	token_metrics: {
		access_tokens_issued: number
		refresh_tokens_issued: number
		tokens_revoked: number
		avg_token_lifetime: number
	}
	security_events: Array<{
		type: 'failed_auth' | 'suspicious_activity' | 'rate_limit' | 'token_abuse'
		count: number
		severity: 'low' | 'medium' | 'high' | 'critical'
		description: string
	}>
	performance_metrics: {
		response_time_percentiles: {
			p50: number
			p75: number
			p90: number
			p95: number
			p99: number
		}
		throughput_rps: number
		error_breakdown: {
			invalid_client: number
			invalid_grant: number
			unauthorized_client: number
			unsupported_grant_type: number
			invalid_scope: number
		}
	}
}

export default function OAuth2AnalyticsPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [analytics, setAnalytics] = useState<OAuth2Analytics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

	const fetchOAuth2Analytics = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const mockAnalytics: OAuth2Analytics = {
				overview: {
					total_requests_today: 4231,
					success_rate: 98.7,
					avg_response_time: 145.2,
					active_sessions: 892,
					peak_load: 890,
					error_rate: 1.3,
				},
				authentication_flows: {
					authorization_code: 3456,
					implicit: 234,
					client_credentials: 445,
					refresh_token: 96,
				},
				client_analytics: [
					{
						client_id: 'web-app-001',
						client_name: 'Main Web Application',
						requests: 2345,
						success_rate: 99.1,
						last_used: '2024-01-15T14:30:00Z',
					},
					{
						client_id: 'mobile-app-001',
						client_name: 'Mobile Application',
						requests: 1234,
						success_rate: 98.5,
						last_used: '2024-01-15T14:25:00Z',
					},
					{
						client_id: 'api-service-001',
						client_name: 'Backend API Service',
						requests: 567,
						success_rate: 99.8,
						last_used: '2024-01-15T14:28:00Z',
					},
					{
						client_id: 'third-party-001',
						client_name: 'Third Party Integration',
						requests: 85,
						success_rate: 96.5,
						last_used: '2024-01-15T13:45:00Z',
					},
				],
				token_metrics: {
					access_tokens_issued: 3892,
					refresh_tokens_issued: 1567,
					tokens_revoked: 23,
					avg_token_lifetime: 3600,
				},
				security_events: [
					{
						type: 'failed_auth',
						count: 45,
						severity: 'medium',
						description: 'Failed authentication attempts',
					},
					{
						type: 'rate_limit',
						count: 12,
						severity: 'low',
						description: 'Rate limit exceeded',
					},
					{
						type: 'suspicious_activity',
						count: 3,
						severity: 'high',
						description: 'Suspicious login patterns detected',
					},
					{
						type: 'token_abuse',
						count: 1,
						severity: 'critical',
						description: 'Token abuse detected',
					},
				],
				performance_metrics: {
					response_time_percentiles: {
						p50: 89.5,
						p75: 145.2,
						p90: 234.8,
						p95: 345.6,
						p99: 567.8,
					},
					throughput_rps: 12.4,
					error_breakdown: {
						invalid_client: 15,
						invalid_grant: 8,
						unauthorized_client: 5,
						unsupported_grant_type: 2,
						invalid_scope: 3,
					},
				},
			}

			setAnalytics(mockAnalytics)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch OAuth2 analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchOAuth2Analytics()

		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchOAuth2Analytics, 30000)
		return () => clearInterval(interval)
	}, [])

	const exportData = () => {
		if (analytics) {
			const dataStr = JSON.stringify(analytics, null, 2)
			const dataBlob = new Blob([dataStr], {type: 'application/json'})
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `oauth2-analytics-${new Date().toISOString().split('T')[0]}.json`
			link.click()
			URL.revokeObjectURL(url)
		}
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

	const formatTimeAgo = (timestamp: string) => {
		const diff = new Date().getTime() - new Date(timestamp).getTime()
		const minutes = Math.floor(diff / 60000)
		const hours = Math.floor(minutes / 60)

		if (hours > 0) return `${hours}h ${minutes % 60}m ago`
		return `${minutes}m ago`
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
						<Shield className='h-8 w-8' />
						OAuth2 Analytics
					</h1>
					<p className='text-muted-foreground mt-2'>OAuth2 authentication flow metrics and security monitoring</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-sm text-muted-foreground'>Last updated: {lastRefresh.toLocaleTimeString()}</span>
					<Button variant='outline' size='sm' onClick={exportData}>
						<Download className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={fetchOAuth2Analytics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Overview Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Globe className='h-8 w-8 text-blue-600' />
							<Badge variant='outline'>Requests</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.total_requests_today.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>Requests Today</p>
							<p className='text-xs text-blue-600 mt-1'>Peak: {analytics?.overview.peak_load || 0} concurrent</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<CheckCircle className='h-8 w-8 text-green-600' />
							<Badge variant='default'>Success</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.success_rate || 0}%</p>
							<p className='text-sm text-muted-foreground'>Success Rate</p>
							<p className='text-xs text-red-600 mt-1'>{analytics?.overview.error_rate || 0}% error rate</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Clock className='h-8 w-8 text-purple-600' />
							<Badge variant='secondary'>Response</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.avg_response_time.toFixed(1) || 0}ms</p>
							<p className='text-sm text-muted-foreground'>Avg Response Time</p>
							<p className='text-xs text-muted-foreground mt-1'>P95: {analytics?.performance_metrics.response_time_percentiles.p95 || 0}ms</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Users className='h-8 w-8 text-orange-600' />
							<Badge variant='outline'>Sessions</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.active_sessions || 0}</p>
							<p className='text-sm text-muted-foreground'>Active Sessions</p>
							<p className='text-xs text-green-600 mt-1'>Currently active</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Authentication Flows */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Activity className='h-5 w-5' />
						Authentication Flows
					</CardTitle>
					<CardDescription>OAuth2 flow usage breakdown</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
							<Key className='h-8 w-8 text-blue-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-blue-600'>{analytics?.authentication_flows.authorization_code || 0}</p>
							<p className='text-sm text-muted-foreground'>Authorization Code</p>
						</div>
						<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
							<Shield className='h-8 w-8 text-green-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-green-600'>{analytics?.authentication_flows.client_credentials || 0}</p>
							<p className='text-sm text-muted-foreground'>Client Credentials</p>
						</div>
						<div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
							<RefreshCw className='h-8 w-8 text-purple-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-purple-600'>{analytics?.authentication_flows.refresh_token || 0}</p>
							<p className='text-sm text-muted-foreground'>Refresh Token</p>
						</div>
						<div className='text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
							<Globe className='h-8 w-8 text-orange-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-orange-600'>{analytics?.authentication_flows.implicit || 0}</p>
							<p className='text-sm text-muted-foreground'>Implicit Flow</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Client Analytics & Token Metrics */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Top OAuth2 Clients
						</CardTitle>
						<CardDescription>Most active OAuth2 clients</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{analytics?.client_analytics.map((client, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
									<div>
										<p className='font-medium'>{client.client_name}</p>
										<p className='text-sm text-muted-foreground'>ID: {client.client_id}</p>
										<p className='text-xs text-muted-foreground'>Last used: {formatTimeAgo(client.last_used)}</p>
									</div>
									<div className='text-right'>
										<p className='text-lg font-bold'>{client.requests.toLocaleString()}</p>
										<p className={`text-sm font-medium ${client.success_rate >= 98 ? 'text-green-600' : client.success_rate >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>{client.success_rate}% success</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Key className='h-5 w-5' />
							Token Metrics
						</CardTitle>
						<CardDescription>Token issuance and lifecycle</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
								<span className='text-sm font-medium'>Access Tokens Issued</span>
								<span className='text-lg font-bold text-blue-600'>{analytics?.token_metrics.access_tokens_issued.toLocaleString() || 0}</span>
							</div>
							<div className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
								<span className='text-sm font-medium'>Refresh Tokens Issued</span>
								<span className='text-lg font-bold text-green-600'>{analytics?.token_metrics.refresh_tokens_issued.toLocaleString() || 0}</span>
							</div>
							<div className='flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
								<span className='text-sm font-medium'>Tokens Revoked</span>
								<span className='text-lg font-bold text-red-600'>{analytics?.token_metrics.tokens_revoked || 0}</span>
							</div>
							<div className='flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
								<span className='text-sm font-medium'>Avg Token Lifetime</span>
								<span className='text-lg font-bold text-purple-600'>{analytics?.token_metrics.avg_token_lifetime || 0}s</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Security Events & Performance */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5' />
							Security Events
						</CardTitle>
						<CardDescription>Security incidents and monitoring</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{analytics?.security_events.map((event, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
									<div>
										<p className='font-medium'>{event.description}</p>
										<div className='flex items-center gap-2 mt-1'>
											<Badge className={getSeverityColor(event.severity)}>{event.severity.toUpperCase()}</Badge>
											<span className='text-sm text-muted-foreground capitalize'>{event.type.replace('_', ' ')}</span>
										</div>
									</div>
									<span className='text-lg font-bold'>{event.count}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5' />
							Response Time Percentiles
						</CardTitle>
						<CardDescription>Performance distribution</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.performance_metrics.response_time_percentiles || {}).map(([percentile, time]) => (
								<div key={percentile} className='flex items-center justify-between p-2 bg-muted/50 rounded'>
									<span className='font-medium text-sm'>{percentile.toUpperCase()}</span>
									<span className='font-bold'>{time.toFixed(1)}ms</span>
								</div>
							))}
						</div>
						<div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium'>Throughput</span>
								<span className='font-bold text-blue-600'>{analytics?.performance_metrics.throughput_rps || 0} RPS</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Error Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<XCircle className='h-5 w-5' />
						Error Breakdown
					</CardTitle>
					<CardDescription>OAuth2 error types and frequencies</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
						{Object.entries(analytics?.performance_metrics.error_breakdown || {}).map(([error, count]) => (
							<div key={error} className='text-center p-4 border rounded-lg'>
								<p className='text-lg font-bold text-red-600'>{count}</p>
								<p className='text-sm text-muted-foreground capitalize'>{error.replace(/_/g, ' ')}</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
