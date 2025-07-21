'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useAuth} from '@/contexts/AuthContext'
import {Shield, Search, Filter, Download, RefreshCw, AlertTriangle, Calendar, Clock, User, Activity, Eye, Database} from 'lucide-react'

interface AuditLog {
	id: string
	timestamp: string
	user_id: string
	user_email: string
	action: string
	resource: string
	ip_address: string
	user_agent: string
	details: Record<string, unknown>
	status: 'success' | 'failed' | 'warning'
}

export default function AdminLogsPage() {
	const {user} = useAuth()
	const [loading, setLoading] = useState(true)
	const [logs, setLogs] = useState<AuditLog[]>([])
	const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [actionFilter, setActionFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day')

	const fetchAuditLogs = async () => {
		try {
			setLoading(true)

			// Mock data for demonstration
			const mockLogs: AuditLog[] = [
				{
					id: '1',
					timestamp: new Date().toISOString(),
					user_id: 'user-123',
					user_email: 'admin@example.com',
					action: 'login',
					resource: 'auth',
					ip_address: '192.168.1.100',
					user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
					details: {method: 'password'},
					status: 'success',
				},
				{
					id: '2',
					timestamp: new Date(Date.now() - 300000).toISOString(),
					user_id: 'user-456',
					user_email: 'user@example.com',
					action: 'failed_login',
					resource: 'auth',
					ip_address: '192.168.1.101',
					user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
					details: {error: 'invalid_credentials'},
					status: 'failed',
				},
				{
					id: '3',
					timestamp: new Date(Date.now() - 600000).toISOString(),
					user_id: 'user-789',
					user_email: 'tenant@example.com',
					action: 'create_tenant',
					resource: 'tenant',
					ip_address: '192.168.1.102',
					user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
					details: {tenant_name: 'New Company'},
					status: 'success',
				},
			]

			setLogs(mockLogs)
		} catch (error) {
			console.error('Failed to fetch audit logs:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAuditLogs()
	}, [timeRange])

	useEffect(() => {
		let filtered = logs

		if (searchTerm) {
			filtered = filtered.filter((log) => log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.resource.toLowerCase().includes(searchTerm.toLowerCase()) || log.ip_address.includes(searchTerm))
		}

		if (actionFilter !== 'all') {
			filtered = filtered.filter((log) => log.action === actionFilter)
		}

		if (statusFilter !== 'all') {
			filtered = filtered.filter((log) => log.status === statusFilter)
		}

		setFilteredLogs(filtered)
	}, [logs, searchTerm, actionFilter, statusFilter])

	const exportLogs = () => {
		const dataStr = JSON.stringify(filteredLogs, null, 2)
		const dataBlob = new Blob([dataStr], {type: 'application/json'})
		const url = URL.createObjectURL(dataBlob)
		const link = document.createElement('a')
		link.href = url
		link.download = `admin-logs-${new Date().toISOString().split('T')[0]}.json`
		link.click()
		URL.revokeObjectURL(url)
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'success':
				return (
					<Badge variant='default' className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
						Success
					</Badge>
				)
			case 'failed':
				return <Badge variant='destructive'>Failed</Badge>
			case 'warning':
				return (
					<Badge variant='secondary' className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
						Warning
					</Badge>
				)
			default:
				return <Badge variant='outline'>Unknown</Badge>
		}
	}

	const getActionIcon = (action: string) => {
		if (action.includes('login')) return <User className='h-4 w-4' />
		if (action.includes('create') || action.includes('delete') || action.includes('update')) return <Database className='h-4 w-4' />
		return <Activity className='h-4 w-4' />
	}

	return (
		<div className='container mx-auto py-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold flex items-center gap-2'>
						<Shield className='h-8 w-8' />
						Admin Logs
					</h1>
					<p className='text-muted-foreground mt-2'>System audit logs and administrative activity monitoring</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={fetchAuditLogs}>
						<RefreshCw className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='sm' onClick={exportLogs}>
						<Download className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Filters */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Filter className='h-5 w-5' />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<div className='relative'>
							<Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
							<Input placeholder='Search logs...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
						</div>
						<Select value={timeRange} onValueChange={(value: 'hour' | 'day' | 'week' | 'month') => setTimeRange(value)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='hour'>Last Hour</SelectItem>
								<SelectItem value='day'>Last 24 Hours</SelectItem>
								<SelectItem value='week'>Last Week</SelectItem>
								<SelectItem value='month'>Last Month</SelectItem>
							</SelectContent>
						</Select>
						<Select value={actionFilter} onValueChange={setActionFilter}>
							<SelectTrigger>
								<SelectValue placeholder='Filter by action' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Actions</SelectItem>
								<SelectItem value='login'>Login</SelectItem>
								<SelectItem value='failed_login'>Failed Login</SelectItem>
								<SelectItem value='create_tenant'>Create Tenant</SelectItem>
								<SelectItem value='delete_user'>Delete User</SelectItem>
							</SelectContent>
						</Select>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder='Filter by status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Status</SelectItem>
								<SelectItem value='success'>Success</SelectItem>
								<SelectItem value='failed'>Failed</SelectItem>
								<SelectItem value='warning'>Warning</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Total Logs</p>
								<p className='text-2xl font-bold'>{filteredLogs.length}</p>
							</div>
							<Activity className='h-8 w-8 text-blue-600' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Success Rate</p>
								<p className='text-2xl font-bold'>{filteredLogs.length > 0 ? Math.round((filteredLogs.filter((l) => l.status === 'success').length / filteredLogs.length) * 100) : 0}%</p>
							</div>
							<Shield className='h-8 w-8 text-green-600' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Failed Actions</p>
								<p className='text-2xl font-bold'>{filteredLogs.filter((l) => l.status === 'failed').length}</p>
							</div>
							<AlertTriangle className='h-8 w-8 text-red-600' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Unique Users</p>
								<p className='text-2xl font-bold'>{new Set(filteredLogs.map((l) => l.user_id)).size}</p>
							</div>
							<User className='h-8 w-8 text-purple-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Logs Table */}
			<Card>
				<CardHeader>
					<CardTitle>Audit Logs</CardTitle>
					<CardDescription>Detailed audit trail of all administrative actions and system events</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='space-y-4'>
							{[...Array(5)].map((_, i) => (
								<div key={i} className='flex items-center space-x-4'>
									<Skeleton className='h-12 w-12 rounded-full' />
									<div className='space-y-2 flex-1'>
										<Skeleton className='h-4 w-full' />
										<Skeleton className='h-4 w-3/4' />
									</div>
								</div>
							))}
						</div>
					) : filteredLogs.length === 0 ? (
						<div className='text-center py-8'>
							<p className='text-muted-foreground'>No logs found matching your filters.</p>
						</div>
					) : (
						<div className='space-y-4'>
							{filteredLogs.map((log) => (
								<div key={log.id} className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'>
									<div className='flex items-start justify-between'>
										<div className='flex items-start space-x-3'>
											<div className='flex-shrink-0 mt-1'>{getActionIcon(log.action)}</div>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center space-x-2 mb-1'>
													<p className='text-sm font-medium text-gray-900 dark:text-white'>{log.action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</p>
													{getStatusBadge(log.status)}
												</div>
												<p className='text-sm text-muted-foreground mb-2'>
													<span className='font-medium'>{log.user_email}</span> performed this action on <span className='font-medium'>{log.resource}</span>
												</p>
												<div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground'>
													<div className='flex items-center space-x-1'>
														<Calendar className='h-3 w-3' />
														<span>{new Date(log.timestamp).toLocaleDateString()}</span>
													</div>
													<div className='flex items-center space-x-1'>
														<Clock className='h-3 w-3' />
														<span>{new Date(log.timestamp).toLocaleTimeString()}</span>
													</div>
													<div className='flex items-center space-x-1'>
														<span>IP: {log.ip_address}</span>
													</div>
												</div>
												{log.details && Object.keys(log.details).length > 0 && (
													<div className='mt-2 p-2 bg-muted rounded text-xs'>
														<strong>Details:</strong> {JSON.stringify(log.details, null, 2)}
													</div>
												)}
											</div>
										</div>
										<div className='flex-shrink-0'>
											<Button variant='ghost' size='sm'>
												<Eye className='h-4 w-4' />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
