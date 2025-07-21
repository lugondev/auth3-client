'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {Key, Shield, Lock, Database, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw, Download, FileKey, Cpu, BarChart3} from 'lucide-react'

interface KMSAnalytics {
	overview: {
		total_keys: number
		active_keys: number
		keys_created_today: number
		encryption_operations_today: number
		decryption_operations_today: number
		signing_operations_today: number
		success_rate: number
		avg_response_time: number
	}
	key_management: {
		key_creation: number
		key_rotation: number
		key_revocation: number
		key_deletion: number
		key_import: number
		key_export: number
	}
	cryptographic_operations: {
		encryption: number
		decryption: number
		signing: number
		verification: number
		key_derivation: number
		hashing: number
	}
	algorithm_usage: {
		'AES-256-GCM': number
		'RSA-2048': number
		'RSA-4096': number
		'ECDSA-P256': number
		'ECDSA-P384': number
		'Ed25519': number
		'ChaCha20-Poly1305': number
	}
	key_types: {
		symmetric: number
		asymmetric: number
		signing: number
		encryption: number
		master_keys: number
		data_keys: number
	}
	security_metrics: {
		failed_operations: number
		unauthorized_access_attempts: number
		key_compromise_incidents: number
		policy_violations: number
		anomalous_usage_patterns: number
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
		cache_hit_rate: number
		hsm_utilization: number
	}
	compliance_metrics: {
		fips_140_2_compliant_operations: number
		common_criteria_operations: number
		audit_events_generated: number
		policy_compliance_rate: number
	}
	security_events: Array<{
		type: 'key_compromise' | 'unauthorized_access' | 'policy_violation' | 'anomalous_usage'
		count: number
		severity: 'low' | 'medium' | 'high' | 'critical'
		description: string
	}>
	top_performing_keys: Array<{
		key_id: string
		key_type: string
		algorithm: string
		operations_count: number
		last_used: string
		status: 'active' | 'inactive' | 'compromised' | 'revoked'
	}>
}

export default function KMSAnalyticsPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [analytics, setAnalytics] = useState<KMSAnalytics | null>(null)
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

	const fetchKMSAnalytics = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			await new Promise((resolve) => setTimeout(resolve, 1200))

			const mockAnalytics: KMSAnalytics = {
				overview: {
					total_keys: 8742,
					active_keys: 7893,
					keys_created_today: 23,
					encryption_operations_today: 12456,
					decryption_operations_today: 11890,
					signing_operations_today: 3456,
					success_rate: 99.4,
					avg_response_time: 45.7,
				},
				key_management: {
					key_creation: 67,
					key_rotation: 12,
					key_revocation: 3,
					key_deletion: 8,
					key_import: 15,
					key_export: 4,
				},
				cryptographic_operations: {
					encryption: 12456,
					decryption: 11890,
					signing: 3456,
					verification: 3234,
					key_derivation: 892,
					hashing: 15623,
				},
				algorithm_usage: {
					'AES-256-GCM': 45678,
					'RSA-2048': 12345,
					'RSA-4096': 8901,
					'ECDSA-P256': 6789,
					'ECDSA-P384': 3456,
					'Ed25519': 2345,
					'ChaCha20-Poly1305': 1234,
				},
				key_types: {
					symmetric: 5234,
					asymmetric: 3508,
					signing: 2145,
					encryption: 6597,
					master_keys: 156,
					data_keys: 8586,
				},
				security_metrics: {
					failed_operations: 45,
					unauthorized_access_attempts: 12,
					key_compromise_incidents: 0,
					policy_violations: 3,
					anomalous_usage_patterns: 8,
				},
				performance_metrics: {
					response_time_percentiles: {
						p50: 23.4,
						p75: 45.7,
						p90: 78.9,
						p95: 123.4,
						p99: 234.5,
					},
					throughput_ops_per_minute: 234.7,
					cache_hit_rate: 94.2,
					hsm_utilization: 67.8,
				},
				compliance_metrics: {
					fips_140_2_compliant_operations: 98765,
					common_criteria_operations: 87654,
					audit_events_generated: 156789,
					policy_compliance_rate: 99.7,
				},
				security_events: [
					{
						type: 'unauthorized_access',
						count: 12,
						severity: 'medium',
						description: 'Unauthorized key access attempts detected',
					},
					{
						type: 'policy_violation',
						count: 3,
						severity: 'high',
						description: 'Key usage policy violations',
					},
					{
						type: 'anomalous_usage',
						count: 8,
						severity: 'low',
						description: 'Unusual key usage patterns detected',
					},
				],
				top_performing_keys: [
					{
						key_id: 'key-abc123-encrypt-master',
						key_type: 'master_key',
						algorithm: 'AES-256-GCM',
						operations_count: 15678,
						last_used: '2024-01-15T14:30:00Z',
						status: 'active',
					},
					{
						key_id: 'key-def456-sign-rsa',
						key_type: 'signing',
						algorithm: 'RSA-4096',
						operations_count: 8901,
						last_used: '2024-01-15T13:45:00Z',
						status: 'active',
					},
					{
						key_id: 'key-ghi789-encrypt-data',
						key_type: 'data_key',
						algorithm: 'AES-256-GCM',
						operations_count: 6789,
						last_used: '2024-01-15T12:30:00Z',
						status: 'active',
					},
					{
						key_id: 'key-jkl012-sign-ecdsa',
						key_type: 'signing',
						algorithm: 'ECDSA-P384',
						operations_count: 4567,
						last_used: '2024-01-15T11:15:00Z',
						status: 'active',
					},
				],
			}

			setAnalytics(mockAnalytics)
			setLastRefresh(new Date())
		} catch (error) {
			console.error('Failed to fetch KMS analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchKMSAnalytics()

		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchKMSAnalytics, 30000)
		return () => clearInterval(interval)
	}, [])

	const exportData = () => {
		if (analytics) {
			const dataStr = JSON.stringify(analytics, null, 2)
			const dataBlob = new Blob([dataStr], {type: 'application/json'})
			const url = URL.createObjectURL(dataBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = `kms-analytics-${new Date().toISOString().split('T')[0]}.json`
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
			case 'inactive':
				return 'bg-yellow-100 text-yellow-800'
			case 'compromised':
				return 'bg-red-100 text-red-800'
			case 'revoked':
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
						<Database className='h-8 w-8' />
						KMS Analytics
					</h1>
					<p className='text-muted-foreground mt-2'>Key Management Service operations and cryptographic analytics</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-sm text-muted-foreground'>Last updated: {lastRefresh.toLocaleTimeString()}</span>
					<Button variant='outline' size='sm' onClick={exportData}>
						<Download className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={fetchKMSAnalytics}>
						<RefreshCw className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Overview Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between mb-4'>
							<Key className='h-8 w-8 text-blue-600' />
							<Badge variant='outline'>Total Keys</Badge>
						</div>
						<div>
							<p className='text-2xl font-bold'>{analytics?.overview.total_keys.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>Keys Managed</p>
							<p className='text-xs text-green-600 mt-1'>+{analytics?.overview.keys_created_today || 0} today</p>
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
							<p className='text-2xl font-bold'>{analytics?.overview.active_keys.toLocaleString() || 0}</p>
							<p className='text-sm text-muted-foreground'>Active Keys</p>
							<p className='text-xs text-blue-600 mt-1'>{(((analytics?.overview.active_keys || 0) / (analytics?.overview.total_keys || 1)) * 100).toFixed(1)}% of total</p>
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
							<p className='text-xs text-green-600 mt-1'>Above target (99%)</p>
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

			{/* Key Management & Cryptographic Operations */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Key className='h-5 w-5' />
							Key Management Operations
						</CardTitle>
						<CardDescription>Today's key lifecycle operations</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.key_management || {}).map(([operation, count]) => (
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
							<Lock className='h-5 w-5' />
							Cryptographic Operations
						</CardTitle>
						<CardDescription>Today's cryptographic operation breakdown</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.cryptographic_operations || {}).map(([operation, count]) => (
								<div key={operation} className='flex items-center justify-between p-3 border rounded-lg'>
									<span className='text-sm font-medium capitalize'>{operation.replace('_', ' ')}</span>
									<span className='text-lg font-bold'>{count.toLocaleString()}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Algorithm Usage & Key Types */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Cpu className='h-5 w-5' />
							Algorithm Usage
						</CardTitle>
						<CardDescription>Cryptographic algorithm distribution</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.algorithm_usage || {})
								.sort(([, a], [, b]) => b - a)
								.slice(0, 6)
								.map(([algorithm, count]) => (
									<div key={algorithm} className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
										<div className='flex items-center gap-2'>
											<Badge variant='outline' className='font-mono text-xs'>
												{algorithm}
											</Badge>
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
							<FileKey className='h-5 w-5' />
							Key Types Distribution
						</CardTitle>
						<CardDescription>Key types and their usage</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{Object.entries(analytics?.key_types || {}).map(([type, count]) => (
								<div key={type} className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
									<span className='text-sm font-medium capitalize'>{type.replace('_', ' ')}</span>
									<span className='text-lg font-bold'>{count.toLocaleString()}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Performance Metrics & Compliance */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5' />
							Performance Metrics
						</CardTitle>
						<CardDescription>System performance and utilization</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
									<p className='text-lg font-bold text-blue-600'>{analytics?.performance_metrics.throughput_ops_per_minute || 0}</p>
									<p className='text-xs text-muted-foreground'>Ops/min</p>
								</div>
								<div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
									<p className='text-lg font-bold text-green-600'>{analytics?.performance_metrics.cache_hit_rate || 0}%</p>
									<p className='text-xs text-muted-foreground'>Cache Hit Rate</p>
								</div>
							</div>
							<div className='space-y-2'>
								<h4 className='font-medium text-sm'>Response Time Percentiles</h4>
								{Object.entries(analytics?.performance_metrics.response_time_percentiles || {}).map(([percentile, time]) => (
									<div key={percentile} className='flex items-center justify-between p-2 bg-muted/50 rounded'>
										<span className='text-xs font-medium'>{percentile.toUpperCase()}</span>
										<span className='text-sm font-bold'>{time.toFixed(1)}ms</span>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5' />
							Compliance & Security
						</CardTitle>
						<CardDescription>Compliance metrics and security events</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
									<p className='text-lg font-bold text-purple-600'>{analytics?.compliance_metrics.policy_compliance_rate || 0}%</p>
									<p className='text-xs text-muted-foreground'>Policy Compliance</p>
								</div>
								<div className='text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
									<p className='text-lg font-bold text-orange-600'>{analytics?.compliance_metrics.audit_events_generated.toLocaleString() || 0}</p>
									<p className='text-xs text-muted-foreground'>Audit Events</p>
								</div>
							</div>
							<div className='space-y-2'>
								<h4 className='font-medium text-sm'>Security Events</h4>
								{analytics?.security_events.map((event, index) => (
									<div key={index} className='flex items-center justify-between p-2 border rounded'>
										<div className='flex items-center gap-2'>
											<Badge className={getSeverityColor(event.severity)}>{event.severity.toUpperCase()}</Badge>
										</div>
										<span className='text-sm font-bold'>{event.count}</span>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Top Performing Keys */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						Top Performing Keys
					</CardTitle>
					<CardDescription>Most frequently used keys and their status</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{analytics?.top_performing_keys.map((key, index) => (
							<div key={index} className='flex items-center justify-between p-4 border rounded-lg'>
								<div>
									<p className='font-mono text-sm font-medium'>{key.key_id}</p>
									<div className='flex items-center gap-2 mt-2'>
										<Badge variant='outline' className='text-xs'>
											{key.key_type.replace('_', ' ')}
										</Badge>
										<Badge variant='secondary' className='text-xs'>
											{key.algorithm}
										</Badge>
										<Badge className={getStatusColor(key.status)}>{key.status}</Badge>
									</div>
									<p className='text-xs text-muted-foreground mt-1'>Last used: {formatTimeAgo(key.last_used)}</p>
								</div>
								<div className='text-right'>
									<p className='text-xl font-bold'>{key.operations_count.toLocaleString()}</p>
									<p className='text-xs text-muted-foreground'>operations</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
