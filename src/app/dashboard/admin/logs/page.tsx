'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Label} from '@/components/ui/label'
import {Search, Download, RefreshCw, Filter, Eye, AlertTriangle, Info, CheckCircle, XCircle} from 'lucide-react'
import {toast} from 'sonner'
import {formatDistanceToNow} from 'date-fns'
import {getAuditLogs, getSystemLogs, getSecurityEvents, exportAuditLogs} from '@/services/auditService'
import {AuditLog, AuditLogFilter, ActionType, ResourceType, AuditLogResponse, ActionTypes, ResourceTypes} from '@/types/audit'

export default function AdminLogsPage() {
	const [logs, setLogs] = useState<AuditLog[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(20)
	const [totalPages, setTotalPages] = useState(0)
	const [totalLogs, setTotalLogs] = useState(0)

	// Filter state
	const [searchQuery, setSearchQuery] = useState('')
	const [filterAction, setFilterAction] = useState<ActionType | ''>('')
	const [filterResource, setFilterResource] = useState<ResourceType | ''>('')
	const [filterUserId, setFilterUserId] = useState('')
	const [filterDateFrom, setFilterDateFrom] = useState('')
	const [filterDateTo, setFilterDateTo] = useState('')
	const [activeTab, setActiveTab] = useState('all')

	const fetchLogs = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const filter: AuditLogFilter = {
				limit: pageSize,
				offset: (currentPage - 1) * pageSize,
				search: searchQuery || undefined,
				action: filterAction || undefined,
				resource_type: filterResource || undefined,
				user_id: filterUserId || undefined,
				date_from: filterDateFrom || undefined,
				date_to: filterDateTo || undefined,
			}

			let result: AuditLogResponse

			switch (activeTab) {
				case 'system':
					result = await getSystemLogs(filter)
					break
				case 'security':
					result = await getSecurityEvents(filter)
					break
				default:
					result = await getAuditLogs(filter)
			}

			setLogs(result.logs || [])
			setTotalLogs(result.total || 0)
			// Calculate total pages from total and limit
			const calculatedTotalPages = Math.ceil((result.total || 0) / pageSize)
			setTotalPages(calculatedTotalPages)

			if ((result.logs || []).length === 0 && currentPage === 1) {
				toast.info('No logs found matching the criteria.')
			}
		} catch (err) {
			console.error('Failed to fetch logs:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			setError(errorMessage)
			toast.error(`Failed to load logs: ${errorMessage}`)
		} finally {
			setLoading(false)
		}
	}, [currentPage, pageSize, searchQuery, filterAction, filterResource, filterUserId, filterDateFrom, filterDateTo, activeTab])

	useEffect(() => {
		fetchLogs()
	}, [fetchLogs])

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1))
	}

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages))
	}

	const handleFilterSearch = () => {
		setCurrentPage(1)
		fetchLogs()
	}

	const handleExportLogs = async () => {
		try {
			const filter: AuditLogFilter = {
				search: searchQuery || undefined,
				action: filterAction || undefined,
				resource_type: filterResource || undefined,
				user_id: filterUserId || undefined,
				date_from: filterDateFrom || undefined,
				date_to: filterDateTo || undefined,
			}

			const blob = await exportAuditLogs(filter, 'csv')

			// Create download link
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.style.display = 'none'
			a.href = url
			a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)

			toast.success('Audit logs exported successfully')
		} catch (err) {
			toast.error('Failed to export audit logs')
			console.error('Error exporting logs:', err)
		}
	}

	const getActionBadgeVariant = (action: ActionType) => {
		switch (action) {
			case ActionTypes.USER_CREATE:
			case ActionTypes.TENANT_CREATE:
			case ActionTypes.DID_CREATE:
				return 'default'
			case ActionTypes.USER_UPDATE:
			case ActionTypes.TENANT_UPDATE:
			case ActionTypes.DID_UPDATE:
				return 'outline'
			case ActionTypes.USER_DELETE:
			case ActionTypes.TENANT_DELETE:
			case ActionTypes.DID_DELETE:
				return 'destructive'
			case ActionTypes.LOGIN:
			case ActionTypes.REGISTER:
				return 'default'
			case ActionTypes.LOGOUT:
				return 'secondary'
			case ActionTypes.PASSWORD_RESET:
				return 'outline'
			case ActionTypes.PERMISSION_GRANT:
			case ActionTypes.ROLE_ASSIGN:
				return 'default'
			case ActionTypes.PERMISSION_REVOKE:
			case ActionTypes.ROLE_REVOKE:
				return 'destructive'
			default:
				return 'secondary'
		}
	}

	const getActionIcon = (action: ActionType) => {
		switch (action) {
			case ActionTypes.USER_CREATE:
			case ActionTypes.TENANT_CREATE:
			case ActionTypes.DID_CREATE:
			case ActionTypes.REGISTER:
				return <CheckCircle className='h-3 w-3' />
			case ActionTypes.USER_DELETE:
			case ActionTypes.TENANT_DELETE:
			case ActionTypes.DID_DELETE:
				return <XCircle className='h-3 w-3' />
			case ActionTypes.LOGIN:
				return <CheckCircle className='h-3 w-3' />
			case ActionTypes.LOGOUT:
				return <Info className='h-3 w-3' />
			case ActionTypes.PERMISSION_REVOKE:
			case ActionTypes.ROLE_REVOKE:
				return <AlertTriangle className='h-3 w-3' />
			default:
				return <Info className='h-3 w-3' />
		}
	}

	if (loading && logs.length === 0) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>System Logs</h1>
				<p>Loading logs...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>System Logs</h1>
				<Alert>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>Error loading logs: {error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-semibold'>System Logs</h1>
				<div className='flex gap-2'>
					<Button onClick={fetchLogs} variant='outline' size='sm' disabled={loading}>
						<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
					<Button onClick={handleExportLogs} variant='outline' size='sm'>
						<Download className='h-4 w-4 mr-2' />
						Export
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
				<TabsList className='grid w-full grid-cols-5'>
					<TabsTrigger value='all'>All Logs</TabsTrigger>
					<TabsTrigger value='user'>User Logs</TabsTrigger>
					<TabsTrigger value='resource'>Resource Logs</TabsTrigger>
					<TabsTrigger value='action'>Action Logs</TabsTrigger>
					<TabsTrigger value='security'>Security Events</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className='space-y-4'>
					{/* Filter Section */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Filter className='h-4 w-4' />
								Filters
							</CardTitle>
							<CardDescription>Filter logs by various criteria to find specific events</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								<div>
									<Label htmlFor='searchQuery'>Search</Label>
									<Input id='searchQuery' placeholder='Search logs...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
								</div>

								<div>
									<Label htmlFor='filterAction'>Action</Label>
									<Select value={filterAction || 'all'} onValueChange={(value) => setFilterAction(value === 'all' ? '' : (value as ActionType))}>
										<SelectTrigger id='filterAction'>
											<SelectValue placeholder='Select action' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All Actions</SelectItem>
											{Object.values(ActionTypes).map((action) => (
												<SelectItem key={action} value={action}>
													{action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor='filterResource'>Resource</Label>
									<Select value={filterResource || 'all'} onValueChange={(value) => setFilterResource(value === 'all' ? '' : (value as ResourceType))}>
										<SelectTrigger id='filterResource'>
											<SelectValue placeholder='Select resource' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All Resources</SelectItem>
											{Object.values(ResourceTypes).map((resource) => (
												<SelectItem key={resource} value={resource}>
													{resource.charAt(0).toUpperCase() + resource.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor='filterUserId'>User ID</Label>
									<Input id='filterUserId' placeholder='Enter user ID' value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} />
								</div>

								<div>
									<Label htmlFor='filterDateFrom'>From Date</Label>
									<Input id='filterDateFrom' type='datetime-local' value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
								</div>

								<div>
									<Label htmlFor='filterDateTo'>To Date</Label>
									<Input id='filterDateTo' type='datetime-local' value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
								</div>

								<div>
									<Label htmlFor='pageSize'>Page Size</Label>
									<Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
										<SelectTrigger id='pageSize'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='10'>10</SelectItem>
											<SelectItem value='20'>20</SelectItem>
											<SelectItem value='50'>50</SelectItem>
											<SelectItem value='100'>100</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className='flex justify-end mt-4'>
								<Button onClick={handleFilterSearch} disabled={loading}>
									<Search className='h-4 w-4 mr-2' />
									Apply Filters
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Results Summary */}
					<div className='flex justify-between items-center'>
						<p className='text-sm text-muted-foreground'>
							Showing {logs.length} of {totalLogs} logs
						</p>
						<div className='flex items-center gap-2'>
							<Button onClick={handlePreviousPage} disabled={currentPage === 1 || loading} variant='outline' size='sm'>
								Previous
							</Button>
							<span className='text-sm'>
								Page {currentPage} of {totalPages}
							</span>
							<Button onClick={handleNextPage} disabled={currentPage === totalPages || loading} variant='outline' size='sm'>
								Next
							</Button>
						</div>
					</div>

					{/* Logs Table */}
					{logs.length === 0 && !loading ? (
						<Card>
							<CardContent className='flex items-center justify-center py-8'>
								<p className='text-muted-foreground'>No logs found matching the criteria.</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className='p-0'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Timestamp</TableHead>
											<TableHead>Action</TableHead>
											<TableHead>Resource</TableHead>
											<TableHead>User</TableHead>
											<TableHead>IP Address</TableHead>
											<TableHead>Details</TableHead>
											<TableHead>
												<span className='sr-only'>Actions</span>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{logs.map((log) => (
											<TableRow key={log.id}>
												<TableCell className='font-mono text-xs'>
													<div>{new Date(log.created_at).toLocaleString()}</div>
													<div className='text-muted-foreground'>{formatDistanceToNow(new Date(log.created_at), {addSuffix: true})}</div>
												</TableCell>
												<TableCell>
													<Badge variant={getActionBadgeVariant(log.action_type as ActionType)} className='flex items-center gap-1'>
														{getActionIcon(log.action_type as ActionType)}
														{log.action_type.replace('_', ' ')}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant='outline'>{log.resource_type}</Badge>
													{log.resource_id && <div className='text-xs text-muted-foreground mt-1 font-mono'>ID: {log.resource_id.slice(0, 8)}...</div>}
												</TableCell>
												<TableCell>{log.user_id ? <div className='font-mono text-xs'>{log.user_id.slice(0, 8)}...</div> : <span className='text-muted-foreground'>System</span>}</TableCell>
												<TableCell className='font-mono text-xs'>{log.ip_address || 'N/A'}</TableCell>
												<TableCell className='max-w-xs'>
													{log.description && <div className='text-xs text-muted-foreground truncate'>{log.description}</div>}
													{log.metadata && <div className='text-xs text-muted-foreground truncate mt-1'>{JSON.stringify(log.metadata)}</div>}
												</TableCell>
												<TableCell>
													<Button variant='ghost' size='sm'>
														<Eye className='h-4 w-4' />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}
