'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Skeleton} from '@/components/ui/skeleton'
import {Plus, Search, Eye, Key, Shield, CheckCircle, XCircle, RefreshCw, Copy, AlertTriangle, AlertCircle} from 'lucide-react'
import {toast} from 'sonner'
import {formatDistanceToNow} from 'date-fns'
import {DIDCard} from './DIDCard'
import {DIDCreate} from './DIDCreate'
import {DIDDetails} from './DIDDetails'
import {DIDStatusBadge} from './DIDStatusBadge'
import {DIDMethod, DIDStatus} from '@/types/did'
import * as didService from '@/services/didService'

/**
 * DID Management Dashboard Component
 *
 * Provides comprehensive DID management interface with:
 * - DID creation and management
 * - DID listing with filtering and search
 * - DID details and editing
 * - Status management and monitoring
 * - Bulk operations
 */

interface DID {
	id: string
	did: string
	method: DIDMethod
	status: DIDStatus
	created_at: string
	updated_at: string
	metadata?: Record<string, unknown>
}

interface DIDManagementDashboardProps {
	className?: string
	isAdmin?: boolean
}

interface DIDStats {
	total: number
	active: number
	deactivated: number
	revoked: number
	byMethod: Record<DIDMethod, number>
}

function getStatusIcon(status: DIDStatus) {
	switch (status) {
		case DIDStatus.ACTIVE:
			return CheckCircle
		case DIDStatus.DEACTIVATED:
			return XCircle
		case DIDStatus.REVOKED:
			return AlertTriangle
		default:
			return AlertCircle
	}
}

function getStatusColor(status: DIDStatus) {
	switch (status) {
		case DIDStatus.ACTIVE:
			return 'text-green-600'
		case DIDStatus.DEACTIVATED:
			return 'text-red-600'
		case DIDStatus.REVOKED:
			return 'text-red-800'
		default:
			return 'text-gray-600'
	}
}

export function DIDManagementDashboard({className = ''}: DIDManagementDashboardProps) {
	const [dids, setDids] = useState<DID[]>([])
	const [stats, setStats] = useState<DIDStats | null>(null)
	const [loading, setLoading] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [filters, setFilters] = useState({
		search: '',
		method: 'all',
		status: 'all',
	})
	const [selectedDids, setSelectedDids] = useState<string[]>([])
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showDetailsDialog, setShowDetailsDialog] = useState(false)
	const [selectedDid, setSelectedDid] = useState<DID | null>(null)
	const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

	const fetchDIDs = useCallback(async () => {
		try {
			setLoading(true)

			// Fetch DIDs from API
			const listDIDsInput = {
				method: filters.method !== 'all' ? (filters.method as DIDMethod) : undefined,
				status: filters.status !== 'all' ? (filters.status as DIDStatus) : undefined,
				limit: 100, // Adjust as needed
				offset: 0,
			}

			const didsResponse = await didService.listDIDs(listDIDsInput)
			let fetchedDIDs = didsResponse.dids || []

			// Apply search filter on frontend (since API might not support search)
			if (filters.search) {
				fetchedDIDs = fetchedDIDs.filter((did) => did.did.did.toLowerCase().includes(filters.search.toLowerCase()) || (did.metadata && JSON.stringify(did.metadata).toLowerCase().includes(filters.search.toLowerCase())))
			}

			// Convert API response to local DID format
			const convertedDIDs: DID[] = fetchedDIDs.map((apiDID) => ({
				id: apiDID.id,
				did: apiDID.did.did,
				method: apiDID.method as DIDMethod,
				status: apiDID.status as DIDStatus,
				created_at: apiDID.created_at,
				updated_at: apiDID.updated_at,
				metadata: apiDID.metadata,
			}))

			setDids(convertedDIDs)

			// Fetch statistics
			const statsResponse = await didService.getDIDStatistics()
			const convertedStats: DIDStats = {
				total: statsResponse.total_dids,
				active: statsResponse.active_dids,
				deactivated: statsResponse.deactivated_dids,
				revoked: statsResponse.revoked_dids,
				byMethod: statsResponse.dids_by_method,
			}
			setStats(convertedStats)
		} catch (error) {
			console.error('Failed to fetch DIDs:', error)
			toast.error('Failed to load DIDs')
		} finally {
			setLoading(false)
		}
	}, [filters.method, filters.status, filters.search])

	const handleRefresh = async () => {
		setRefreshing(true)
		await fetchDIDs()
		setRefreshing(false)
		toast.success('DIDs refreshed')
	}

	const handleDeleteDID = async (didId: string) => {
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500))

			setDids((prev) => prev.filter((did) => did.id !== didId))
			toast.success('DID deleted successfully')
		} catch (error) {
			console.error('Failed to delete DID:', error)
			toast.error('Failed to delete DID')
		}
	}

	const handleCopyDID = (did: string) => {
		navigator.clipboard.writeText(did)
		toast.success('DID copied to clipboard')
	}

	const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
		if (selectedDids.length === 0) {
			toast.error('No DIDs selected')
			return
		}

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000))

			if (action === 'delete') {
				setDids((prev) => prev.filter((did) => !selectedDids.includes(did.id)))
			} else {
				const newStatus = action === 'activate' ? DIDStatus.ACTIVE : DIDStatus.DEACTIVATED
				setDids((prev) => prev.map((did) => (selectedDids.includes(did.id) ? {...did, status: newStatus, updated_at: new Date().toISOString()} : did)))
			}

			setSelectedDids([])
			toast.success(`Bulk ${action} completed`)
		} catch (error) {
			console.error(`Failed to ${action} DIDs:`, error)
			toast.error(`Failed to ${action} DIDs`)
		}
	}

	const filteredDids = dids.filter((did) => {
		if (filters.status !== 'all' && did.status !== filters.status) return false
		if (filters.method !== 'all' && did.method !== filters.method) return false
		if (filters.search) {
			const searchLower = filters.search.toLowerCase()
			return did.did.toLowerCase().includes(searchLower) || did.method.toLowerCase().includes(searchLower) || (did.metadata?.purpose as string)?.toLowerCase().includes(searchLower) || (did.metadata?.description as string)?.toLowerCase().includes(searchLower)
		}
		return true
	})

	useEffect(() => {
		fetchDIDs()
	}, [fetchDIDs])

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>DID Management</h2>
					<p className='text-muted-foreground'>Manage your decentralized identifiers and their lifecycle</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing}>
						<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
					<Button variant='outline' size='sm' onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
						{viewMode === 'grid' ? 'Table View' : 'Grid View'}
					</Button>
					<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
						<DialogTrigger asChild>
							<Button>
								<Plus className='h-4 w-4 mr-2' />
								Create DID
							</Button>
						</DialogTrigger>
						<DialogContent className='max-w-2xl'>
							<DialogHeader>
								<DialogTitle>Create New DID</DialogTitle>
								<DialogDescription>Create a new decentralized identifier with your preferred method</DialogDescription>
							</DialogHeader>
							<DIDCreate
								onSuccess={() => {
									setShowCreateDialog(false)
									fetchDIDs()
								}}
								onCancel={() => setShowCreateDialog(false)}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
						<Key className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.total || 0}</div>
						<p className='text-xs text-muted-foreground'>Across all methods</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active DIDs</CardTitle>
						<CheckCircle className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.active || 0}</div>
						<p className='text-xs text-muted-foreground'>Ready for use</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Revoked DIDs</CardTitle>
						<AlertTriangle className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.revoked || 0}</div>
						<p className='text-xs text-muted-foreground'>Permanently revoked</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Methods Used</CardTitle>
						<Shield className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats?.byMethod ? Object.values(stats.byMethod).filter((count) => count > 0).length : 0}</div>
						<p className='text-xs text-muted-foreground'>Different DID methods</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardContent className='pt-6'>
					<div className='flex items-center gap-4'>
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
								<Input placeholder='Search DIDs...' value={filters.search || ''} onChange={(e) => setFilters((prev) => ({...prev, search: e.target.value}))} className='pl-10' />
							</div>
						</div>
						<Select
							value={filters.status || 'all'}
							onValueChange={(value) =>
								setFilters((prev) => ({
									...prev,
									status: value,
								}))
							}>
							<SelectTrigger className='w-40'>
								<SelectValue placeholder='Status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Status</SelectItem>
								<SelectItem value={DIDStatus.ACTIVE}>Active</SelectItem>
								<SelectItem value={DIDStatus.DEACTIVATED}>Deactivated</SelectItem>
								<SelectItem value={DIDStatus.REVOKED}>Revoked</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={filters.method || 'all'}
							onValueChange={(value) =>
								setFilters((prev) => ({
									...prev,
									method: value,
								}))
							}>
							<SelectTrigger className='w-40'>
								<SelectValue placeholder='Method' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Methods</SelectItem>
								<SelectItem value='key'>did:key</SelectItem>
								<SelectItem value='web'>did:web</SelectItem>
								<SelectItem value='ethr'>did:ethr</SelectItem>
								<SelectItem value='VBSN'>did:VBSN</SelectItem>
								<SelectItem value='sov'>did:sov</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{selectedDids.length > 0 && (
						<div className='flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg'>
							<span className='text-sm font-medium'>{selectedDids.length} DID(s) selected</span>
							<div className='flex items-center gap-2 ml-auto'>
								<Button variant='outline' size='sm' onClick={() => handleBulkAction('activate')}>
									Activate
								</Button>
								<Button variant='outline' size='sm' onClick={() => handleBulkAction('deactivate')}>
									Deactivate
								</Button>
								<Button variant='destructive' size='sm' onClick={() => handleBulkAction('delete')}>
									Delete
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* DID List */}
			{loading ? (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{[...Array(6)].map((_, i) => (
						<Skeleton key={i} className='h-48 w-full' />
					))}
				</div>
			) : viewMode === 'grid' ? (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{filteredDids.map((did) => {
					// Convert DID to DIDData format for DIDCard
					const didData = {
						id: did.id,
						user_id: '', // Not available in current DID interface
						did: did.did,
						method: did.method,
						identifier: did.did.split(':').slice(2).join(':'), // Extract identifier from DID
						document: {
							// Minimal document structure
							'@context': ['https://www.w3.org/ns/did/v1'],
							id: did.did,
							verificationMethod: [],
							authentication: [],
							assertionMethod: [],
							keyAgreement: [],
							capabilityInvocation: [],
							capabilityDelegation: [],
							service: [],
						},
						status: did.status,
						created_at: did.created_at,
						updated_at: did.updated_at,
						metadata: did.metadata,
					}

					return (
						<DIDCard
							key={did.did}
							did={didData}
							onView={() => {
								// Navigate to DID details
								window.location.href = `/dashboard/dids/${did.did}`
							}}
							onDeactivate={() => handleDeleteDID(did.did)}
							onRevoke={() => handleDeleteDID(did.did)}
							onDelete={() => handleDeleteDID(did.did)}
						/>
					)
				})}
				</div>
			) : (
				<Card>
					<CardContent className='p-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-12'>
										<input
											type='checkbox'
											checked={selectedDids.length === filteredDids.length && filteredDids.length > 0}
											onChange={(e) => {
												if (e.target.checked) {
													setSelectedDids(filteredDids.map((did) => did.id))
												} else {
													setSelectedDids([])
												}
											}}
										/>
									</TableHead>
									<TableHead>DID</TableHead>
									<TableHead>Method</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead className='w-12'>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredDids.map((did) => {
									const StatusIcon = getStatusIcon(did.status)
									return (
										<TableRow key={did.id}>
											<TableCell>
												<input
													type='checkbox'
													checked={selectedDids.includes(did.id)}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedDids((prev) => [...prev, did.id])
														} else {
															setSelectedDids((prev) => prev.filter((id) => id !== did.id))
														}
													}}
												/>
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-2'>
													<code className='text-xs bg-muted px-2 py-1 rounded max-w-xs truncate'>{did.did}</code>
													<Button variant='ghost' size='sm' onClick={() => handleCopyDID(did.did)}>
														<Copy className='h-3 w-3' />
													</Button>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant='outline'>did:{did.method}</Badge>
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-2'>
													<StatusIcon className={`h-4 w-4 ${getStatusColor(did.status)}`} />
													<DIDStatusBadge status={did.status} />
												</div>
											</TableCell>
											<TableCell>{formatDistanceToNow(new Date(did.created_at), {addSuffix: true})}</TableCell>
											<TableCell>{formatDistanceToNow(new Date(did.updated_at), {addSuffix: true})}</TableCell>
											<TableCell>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => {
														setSelectedDid(did)
														setShowDetailsDialog(true)
													}}>
													<Eye className='h-4 w-4' />
												</Button>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{filteredDids.length === 0 && !loading && (
				<Card>
					<CardContent className='text-center py-12'>
						<Key className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
						<h3 className='text-lg font-semibold mb-2'>No DIDs found</h3>
						<p className='text-muted-foreground mb-4'>{filters.search || filters.status !== 'all' || filters.method !== 'all' ? 'No DIDs match your current filters' : "You haven't created any DIDs yet"}</p>
						<Button onClick={() => setShowCreateDialog(true)}>
							<Plus className='h-4 w-4 mr-2' />
							Create Your First DID
						</Button>
					</CardContent>
				</Card>
			)}

			{/* DID Details Dialog */}
			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className='max-w-4xl'>
					<DialogHeader>
						<DialogTitle>DID Details</DialogTitle>
						<DialogDescription>View and manage DID information</DialogDescription>
					</DialogHeader>
					{selectedDid && (
						<DIDDetails
							didId={selectedDid.id}
							onEdit={() => {
								// Handle edit
								setShowDetailsDialog(false)
							}}
							onDeactivate={() => {
								handleDeleteDID(selectedDid.id)
								setShowDetailsDialog(false)
							}}
							onDelete={() => {
								handleDeleteDID(selectedDid.id)
								setShowDetailsDialog(false)
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default DIDManagementDashboard
