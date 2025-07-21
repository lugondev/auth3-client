'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {Activity, FileText, Key, Shield, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, RefreshCw, Download, Database, Users} from 'lucide-react'

interface DIDAnalytics {
	overview: {
		total_dids_created: number
		dids_created_today: number
		active_dids: number
		did_operations_today: number
		success_rate: number
		avg_response_time: number
	}
	operations: {
		create_did: number
		resolve_did: number
		update_did: number
		deactivate_did: number
		verify_did: number
	}
	did_methods: {
		'did:web': number
		'did:key': number
		'did:ethr': number
		'did:ion': number
		'did:peer': number
	}
	credential_analytics: {
		credentials_issued: number
		credentials_verified: number
		presentations_created: number
		presentations_verified: number
		revocations: number
	}
	performance_metrics: {
		response_time_percentiles: {
			p50: number
			p75: number
			p90: number
			p95: number
			p99: number
		}
		throughput_ops_per_minute: number
		error_breakdown: {
			did_not_found: number
			invalid_signature: number
			malformed_did: number
			network_error: number
			timeout_error: number
		}
	}
	security_events: Array<{
		type: 'suspicious_resolution' | 'invalid_signature' | 'unauthorized_update' | 'malformed_request'
		count: number
		severity: 'low' | 'medium' | 'high' | 'critical'
		description: string
	}>
	top_did_documents: Array<{
		did: string
		method: string
		operations_count: number
		last_updated: string
		status: 'active' | 'deactivated' | 'compromised'
	}>
}

export default function DIDAnalyticsPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [analytics, setAnalytics] = useState<DIDAnalytics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

	const fetchDIDAnalytics = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			await new Promise((resolve) => setTimeout(resolve, 1100))

			const mockAnalytics: DIDAnalytics = {
				overview: {
					total_dids_created: 12300,
					dids_created_today: 47,
					active_dids: 11890,
					did_operations_today: 892,
					success_rate: 97.8,
					avg_response_time: 234.5,
				},
				operations: {
					create_did: 156,
					resolve_did: 445,
					update_did: 89,
					deactivate_did: 12,
					verify_did: 190,
				},
				did_methods: {
					'did:web': 5670,
					'did:key': 3420,
					'did:ethr': 1890,
					'did:ion': 890,
					'did:peer': 430,
				},
				credential_analytics: {
					credentials_issued: 3456,
					credentials_verified: 2890,
					presentations_created: 1234,
					presentations_verified: 1156,
					revocations: 23,
				},
				performance_metrics: {
					response_time_percentiles: {
						p50: 156.7,
						p75: 234.5,
						p90: 345.8,
						p95: 456.9,
						p99: 789.1,
					},
					throughput_ops_per_minute: 89.5,
					error_breakdown: {
						did_not_found: 15,
						invalid_signature: 8,
						malformed_did: 5,
						network_error: 3,
						timeout_error: 2,
					},
				},
				security_events: [
					{
						type: 'suspicious_resolution',
						count: 12,
						severity: 'medium',
						description: 'Suspicious DID resolution patterns',
					},
					{
						type: 'invalid_signature',
						count: 8,
						severity: 'high',
						description: 'Invalid signature verification attempts',
					},
					{
						type: 'unauthorized_update',
						count: 3,
						severity: 'critical',
						description: 'Unauthorized DID document update attempts',
					},
					{
						type: 'malformed_request',
						count: 25,
						severity: 'low',
						description: 'Malformed DID operation requests',
					},
				],
				top_did_documents: [
					{
						did: 'did:web:example.com:users:alice',
						method: 'did:web',
						operations_count: 234,
						last_updated: '2024-01-15T14:30:00Z',
						status: 'active',
					},
					{
						did: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
						method: 'did:key',
						operations_count: 189,
						last_updated: '2024-01-15T13:45:00Z',
						status: 'active',
					},
					{
						did: 'did:ethr:0x1234567890abcdef1234567890abcdef12345678',
						method: 'did:ethr',
						operations_count: 156,
						last_updated: '2024-01-15T12:30:00Z',
						status: 'active',
					},
					{
						did: 'did:ion:EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg',
						method: 'did:ion',
						operations_count: 123,
						last_updated: '2024-01-15T11:15:00Z',
						status: 'active',
					},
				],
			}

			setAnalytics(mockAnalytics)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch DID analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchDIDAnalytics()

		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchDIDAnalytics, 30000)
		return () => clearInterval(interval)
	}, [])

	const exportData = () => {
		if (analytics) {
			const dataStr = JSON.stringify(analytics, null, 2)
			const dataBlob = new Blob([dataStr], {type: 'application/json'})
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `did-analytics-${new Date().toISOString().split('T')[0]}.json`
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800'
			case 'deactivated':
				return 'bg-yellow-100 text-yellow-800'
			case 'compromised':
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
						<Activity className='h-8 w-8' />
						DID Analytics
					</h1>
					<p className='text-muted-foreground mt-2'>Decentralized Identity operations and performance metrics</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-sm text-muted-foreground'>Last updated: {lastRefresh.toLocaleTimeString()}</span>
					<Button variant='outline' size='sm' onClick={exportData}>
						<Download className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={fetchDIDAnalytics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Overview Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<FileText className='h-8 w-8 text-blue-600' />
							<Badge variant='outline'>Total DIDs</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.total_dids_created.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>DIDs Created</p>
							<p className='text-xs text-green-600 mt-1'>+{analytics?.overview.dids_created_today || 0} today</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Activity className='h-8 w-8 text-green-600' />
							<Badge variant='default'>Active</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.active_dids.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>Active DIDs</p>
							<p className='text-xs text-blue-600 mt-1'>{analytics?.overview.did_operations_today || 0} operations today</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<CheckCircle className='h-8 w-8 text-purple-600' />
							<Badge variant='secondary'>Success Rate</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.success_rate || 0}%</p>
							<p className='text-sm text-muted-foreground'>Operation Success</p>
							<p className='text-xs text-green-600 mt-1'>Above target (95%)</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Clock className='h-8 w-8 text-orange-600' />
							<Badge variant='outline'>Response Time</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.avg_response_time.toFixed(1) || 0}ms</p>
							<p className='text-sm text-muted-foreground'>Avg Response Time</p>
							<p className='text-xs text-muted-foreground mt-1'>P95: {analytics?.performance_metrics.response_time_percentiles.p95 || 0}ms</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* DID Operations & Methods */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Activity className='h-5 w-5' />
							DID Operations Today
						</CardTitle>
						<CardDescription>Breakdown of DID operations performed</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.operations || {}).map(([operation, count]) => (
								<div key={operation} className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
									<span className='text-sm font-medium capitalize'>{operation.replace('_', ' ')}</span>
									<span className='text-lg font-bold'>{count}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Key className='h-5 w-5' />
							DID Methods Distribution
						</CardTitle>
						<CardDescription>Usage by DID method type</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.did_methods || {}).map(([method, count]) => (
								<div key={method} className='flex items-center justify-between p-3 border rounded-lg'>
									<div className='flex items-center gap-2'>
										<Badge variant='outline' className='font-mono text-xs'>
											{method}
										</Badge>
									</div>
									<span className='text-lg font-bold'>{count.toLocaleString()}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Credential Analytics */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Verifiable Credentials Analytics
					</CardTitle>
					<CardDescription>Credential issuance, verification, and presentation metrics</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-5 gap-6'>
						<div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
							<FileText className='h-8 w-8 text-blue-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-blue-600'>{analytics?.credential_analytics.credentials_issued || 0}</p>
							<p className='text-sm text-muted-foreground'>Credentials Issued</p>
						</div>
						<div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
							<CheckCircle className='h-8 w-8 text-green-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-green-600'>{analytics?.credential_analytics.credentials_verified || 0}</p>
							<p className='text-sm text-muted-foreground'>Credentials Verified</p>
						</div>
						<div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
							<Database className='h-8 w-8 text-purple-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-purple-600'>{analytics?.credential_analytics.presentations_created || 0}</p>
							<p className='text-sm text-muted-foreground'>Presentations Created</p>
						</div>
						<div className='text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
							<Shield className='h-8 w-8 text-orange-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-orange-600'>{analytics?.credential_analytics.presentations_verified || 0}</p>
							<p className='text-sm text-muted-foreground'>Presentations Verified</p>
						</div>
						<div className='text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg'>
							<XCircle className='h-8 w-8 text-red-600 mx-auto mb-2' />
							<p className='text-2xl font-bold text-red-600'>{analytics?.credential_analytics.revocations || 0}</p>
							<p className='text-sm text-muted-foreground'>Revocations</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Top DID Documents & Security Events */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Most Active DIDs
						</CardTitle>
						<CardDescription>DIDs with highest operation counts</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{analytics?.top_did_documents.map((did, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
									<div>
										<p className='font-mono text-sm truncate max-w-[300px]'>{did.did}</p>
										<div className='flex items-center gap-2 mt-1'>
											<Badge variant='outline' className='text-xs'>
												{did.method}
											</Badge>
											<Badge className={getStatusColor(did.status)}>{did.status}</Badge>
										</div>
										<p className='text-xs text-muted-foreground mt-1'>Last updated: {formatTimeAgo(did.last_updated)}</p>
									</div>
									<div className='text-right'>
										<p className='text-lg font-bold'>{did.operations_count}</p>
										<p className='text-xs text-muted-foreground'>operations</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5' />
							Security Events
						</CardTitle>
						<CardDescription>DID-related security incidents</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{analytics?.security_events.map((event, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
									<div>
										<p className='font-medium'>{event.description}</p>
										<div className='flex items-center gap-2 mt-1'>
											<Badge className={getSeverityColor(event.severity)}>{event.severity.toUpperCase()}</Badge>
											<span className='text-sm text-muted-foreground capitalize'>{event.type.replace(/_/g, ' ')}</span>
										</div>
									</div>
									<span className='text-lg font-bold'>{event.count}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Performance Metrics & Error Breakdown */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5' />
							Response Time Percentiles
						</CardTitle>
						<CardDescription>Performance distribution metrics</CardDescription>
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
								<span className='font-bold text-blue-600'>{analytics?.performance_metrics.throughput_ops_per_minute || 0} ops/min</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<XCircle className='h-5 w-5' />
							Error Breakdown
						</CardTitle>
						<CardDescription>Types and frequencies of DID operation errors</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.performance_metrics.error_breakdown || {}).map(([error, count]) => (
								<div key={error} className='flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
									<span className='text-sm font-medium capitalize'>{error.replace(/_/g, ' ')}</span>
									<span className='text-lg font-bold text-red-600'>{count}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
