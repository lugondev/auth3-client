'use client'

import React, {useState, useEffect, useCallback, useRef} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious} from '@/components/ui/pagination'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {FileText, Settings, Search, Plus, Globe, AlertTriangle, Users, Key, Eye, Trash2, Power, MoreHorizontal, Coins, Network} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import type {AppRouterInstance} from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {useAuth} from '@/contexts/AuthContext'
import {toast} from '@/hooks/use-toast'

import {AdvancedDIDResolver} from '@/components'
import {DIDSkeleton} from '@/components/did'
import {DIDDocumentViewer} from '@/components/did/DIDDocumentViewer'

import * as didService from '@/services/didService'
import type {DIDDocument, UniversalResolutionResponse, DIDResponse, ListDIDsInput} from '@/types/did'
import {DIDStatus} from '@/types/did'

interface DIDManagementDashboardProps {
	userId?: string
	tenantId?: string
}

interface DIDStats {
	total: number
	active: number
	deactivated: number
	revoked: number
	updated24h: number
	methods: Record<string, number>
	byMethod: Record<string, number>
}

// Type based on actual API response - unified interface
interface DIDItem extends DIDResponse {
	document: DIDDocument
}

const DIDManagementDashboard: React.FC<DIDManagementDashboardProps> = ({userId: propUserId, tenantId: propTenantId}) => {
	const {user} = useAuth()
	const router = useRouter()

	// Use auth context user data or props
	const userId = propUserId || user?.id
	const tenantId = propTenantId || user?.tenant_id

	// Core state
	const [activeTab, setActiveTab] = useState('overview')
	const [userDIDs, setUserDIDs] = useState<DIDItem[]>([])
	const [selectedDID, setSelectedDID] = useState<DIDDocument | null>(null)
	const [stats, setStats] = useState<DIDStats>({
		total: 0,
		active: 0,
		deactivated: 0,
		revoked: 0,
		updated24h: 0,
		methods: {},
		byMethod: {},
	})
	const [loading, setLoading] = useState(true)
	const [initialLoad, setInitialLoad] = useState(true)
	
	// Modal state
	const [showModal, setShowModal] = useState(false)
	const [modalMode, setModalMode] = useState<'deactivate' | 'revoke'>('deactivate')
	const [selectedDIDForAction, setSelectedDIDForAction] = useState<DIDItem | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})

	// Modal state for confirmation dialogs
	
	// Use ref to prevent infinite loops
	const hasLoadedRef = useRef(false)

	// Pagination state
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalPages: 1,
		total: 0,
	})

	// Legacy pagination state for overview tab
	const [didsPage, setDidsPage] = useState(1)
	const [didsHasMore, setDidsHasMore] = useState(true)
	const [didsLoading, setDidsLoading] = useState(false)
	const [showAllDIDs, setShowAllDIDs] = useState(false)

	// Resolution state
	const [recentResolutions, setRecentResolutions] = useState<UniversalResolutionResponse[]>([])

	// Fetch DIDs with unified pagination approach
	const fetchDIDs = useCallback(
		async (page = 1, limitOverride?: number) => {
			// Prevent multiple simultaneous requests
			if (loading && !initialLoad) {
				return
			}

			try {
				if (initialLoad) {
					setLoading(true)
				}
				setError(null)

				const pageSize = limitOverride || 10 // Use fixed default instead of pagination.pageSize
				const params: ListDIDsInput = {
					limit: pageSize,
					page: page,
					sort: 'created_at_desc',
				}

				const didsResponse = await didService.listDIDs(params)
				const dids = didsResponse.dids || []

				// Ensure DIDs have document property
				const didsWithDocuments = dids.map((did) => ({
					...did,
					document: did.document || {
						'@context': ['https://www.w3.org/ns/did/v1'],
						id: did.did,
						verificationMethod: [],
						authentication: [],
						service: [],
					},
				})) as DIDItem[]

				setUserDIDs(didsWithDocuments)

				// Update pagination state
				setPagination({
					page: page,
					pageSize: pageSize,
					totalPages: Math.ceil((didsResponse.total || 0) / pageSize),
					total: didsResponse.total || 0,
				})

				// Update legacy pagination for overview
				const isShowingAll = limitOverride && limitOverride >= (didsResponse.total || 0)
				setDidsHasMore(dids.length === 5 && !isShowingAll && page * 5 < (didsResponse.total || 0))
				setDidsPage(page)
			} catch (err) {
				console.error('Error fetching DIDs:', err)
				setError('Failed to fetch DIDs')
			} finally {
				if (initialLoad) {
					setLoading(false)
					setInitialLoad(false)
				}
			}
		},
		[initialLoad, loading],
	)

	// Load statistics
	const loadStats = useCallback(async () => {
		try {
			const statsResponse = await didService.getDIDStatistics()

			const localStats: DIDStats = {
				total: statsResponse.total_dids || 0,
				active: statsResponse.active_dids || 0,
				deactivated: statsResponse.deactivated_dids || 0,
				revoked: statsResponse.revoked_dids || 0,
				updated24h: 0, // Will be calculated from userDIDs later if needed
				methods: statsResponse.dids_by_method || {},
				byMethod: statsResponse.dids_by_method || {},
			}

			setStats(localStats)
		} catch (err) {
			console.error('Failed to load stats:', err)
			// Fallback to minimal stats
			const fallbackStats: DIDStats = {
				total: 0,
				active: 0,
				deactivated: 0,
				revoked: 0,
				updated24h: 0,
				methods: {},
				byMethod: {},
			}

			setStats(fallbackStats)
		}
	}, []) // No dependencies to prevent loops

	// Load user DIDs function for overview tab (legacy support)
	const loadUserDIDs = useCallback(
		async (page: number = 1, append: boolean = false) => {
			try {
				if (page === 1) {
					setLoading(true)
				} else {
					setDidsLoading(true)
				}
				setError(null)

				const limit = showAllDIDs ? 100 : 5 // Use fixed value instead of totalDIDs

				const response = await didService.listDIDs({
					limit,
					page,
					sort: 'created_at_desc',
				})

				const newDIDs = (response.dids as unknown as DIDItem[]) || []

				if (append && page > 1) {
					setUserDIDs((prev) => [...prev, ...newDIDs])
				} else {
					setUserDIDs(newDIDs)
				}

				setDidsHasMore(newDIDs.length === 5 && !showAllDIDs)
				setDidsPage(page)
			} catch (err: unknown) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to load DIDs'
				setError(errorMessage)
				toast({
					title: 'Loading Failed',
					description: errorMessage,
					variant: 'destructive',
				})
			} finally {
				setLoading(false)
				setDidsLoading(false)
			}
		},
		[showAllDIDs],
	)

	// Load data on component mount
	useEffect(() => {
		if (userId && !hasLoadedRef.current) {
			hasLoadedRef.current = true
			fetchDIDs(1)
			loadStats()
		}
	}, [userId, tenantId, fetchDIDs, loadStats])

	// Utility functions from both pages
	const getStatusBadge = (status: string) => {
		switch (status) {
			case DIDStatus.ACTIVE:
				return (
					<Badge variant='default' className='bg-green-100 text-green-800'>
						Active
					</Badge>
				)
			case DIDStatus.DEACTIVATED:
				return <Badge variant='secondary'>Deactivated</Badge>
			case DIDStatus.REVOKED:
				return <Badge variant='destructive'>Revoked</Badge>
			default:
				return <Badge variant='outline'>Unknown</Badge>
		}
	}

	const getMethodIcon = (method: string) => {
		switch (method) {
			case 'key':
				return <Key className='h-4 w-4' />
			case 'web':
				return <Globe className='h-4 w-4' />
			case 'ethr':
				return <Coins className='h-4 w-4' />
			case 'ion':
				return <Network className='h-4 w-4' />
			case 'peer':
				return <Users className='h-4 w-4' />
			default:
				return <Key className='h-4 w-4' />
		}
	}

	// Action handlers
	const handleDeactivate = async (did: DIDItem) => {
		setSelectedDIDForAction(did)
		setModalMode('deactivate')
		setShowModal(true)
	}

	const performDeactivate = async (did: DIDItem) => {
		const actionKey = `deactivate-${did.id}`
		setActionLoading((prev) => ({...prev, [actionKey]: true}))

		try {
			await didService.deactivateDID({
				id: did.id,
				did: String(did.did),
				user_id: did.user_id,
				reason: 'User requested deactivation',
			})

			setUserDIDs((prevDids) => prevDids.map((d) => (d.id === did.id ? {...d, status: DIDStatus.DEACTIVATED} : d)))

			if (stats) {
				setStats({
					...stats,
					active: stats.active - 1,
					deactivated: stats.deactivated + 1,
				})
			}

			toast({
				title: 'Success',
				description: 'DID deactivated successfully',
			})
		} catch (err) {
			console.error('Error deactivating DID:', err)
			toast({
				title: 'Error',
				description: 'Failed to deactivate DID',
				variant: 'destructive',
			})
		} finally {
			setActionLoading((prev) => ({...prev, [actionKey]: false}))
		}
	}

	const handleRevoke = async (did: DIDItem) => {
		setSelectedDIDForAction(did)
		setModalMode('revoke')
		setShowModal(true)
	}

	const executeRevoke = async (did: DIDItem) => {
		const actionKey = `revoke-${did.id}`
		setActionLoading((prev) => ({...prev, [actionKey]: true}))

		try {
			await didService.revokeDID({
				id: did.id,
				did: String(did.did),
				user_id: did.user_id,
				reason: 'User requested revocation',
			})

			setUserDIDs((prevDids) => prevDids.map((d) => (d.id === did.id ? {...d, status: DIDStatus.REVOKED} : d)))

			if (stats) {
				const wasActive = did.status === DIDStatus.ACTIVE
				const wasDeactivated = did.status === DIDStatus.DEACTIVATED

				setStats({
					...stats,
					active: wasActive ? stats.active - 1 : stats.active,
					deactivated: wasDeactivated ? stats.deactivated - 1 : stats.deactivated,
					revoked: stats.revoked + 1,
				})
			}

			toast({
				title: 'Success',
				description: 'DID revoked successfully',
			})
		} catch (err) {
			console.error('Error revoking DID:', err)
			toast({
				title: 'Error',
				description: 'Failed to revoke DID',
				variant: 'destructive',
			})
		} finally {
			setActionLoading((prev) => ({...prev, [actionKey]: false}))
		}
	}

	const handlePageChange = (newPage: number) => {
		if (newPage > 0 && newPage <= pagination.totalPages) {
			fetchDIDs(newPage)
			// Scroll to the top of the table
			const tableElement = document.querySelector('.card-content-table')
			if (tableElement) {
				tableElement.scrollIntoView({behavior: 'smooth', block: 'start'})
			}
		}
	}

	const handleDIDSelected = async (didItem: DIDItem) => {
		try {
			if (didItem.document) {
				setSelectedDID(didItem.document)
			} else {
				const response = await didService.getDID(didItem.did)
				setSelectedDID(response.document)
			}

			setActiveTab('document') // Switch to document tab instead of editor
		} catch (error) {
			console.error('Failed to load DID document:', error)
			toast({
				title: 'Error',
				description: 'Failed to load DID document',
				variant: 'destructive',
			})
		}
	}

	const handleResolutionCompleted = (result: UniversalResolutionResponse) => {
		setRecentResolutions((prev) => [result, ...prev.slice(0, 4)])
	}

	const loadMoreDIDs = useCallback(async () => {
		if (didsLoading || !didsHasMore) return
		await loadUserDIDs(didsPage + 1, true)
	}, [didsLoading, didsHasMore, didsPage, loadUserDIDs])

	const loadAllDIDs = useCallback(async () => {
		setShowAllDIDs(true)
		await loadUserDIDs(1, false)
	}, [loadUserDIDs])

	// Loading state
	if (loading) {
		return (
			<div className='space-y-6'>
				{/* Skeleton for PageHeader */}
				<div className='flex justify-between items-center'>
					<div>
						<div className='h-8 w-48 bg-gray-800 rounded animate-pulse mb-2' />
						<div className='h-4 w-64 bg-gray-800 rounded animate-pulse' />
					</div>
					<div className='h-10 w-32 bg-gray-800 rounded animate-pulse' />
				</div>

				{/* Skeleton for Statistics Cards */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					{[...Array(4)].map((_, i) => (
						<Card key={i} className='border shadow-sm'>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<div className='h-4 w-24 bg-gray-800 rounded animate-pulse' />
								<div className='h-4 w-4 bg-gray-800 rounded-full animate-pulse' />
							</CardHeader>
							<CardContent>
								<div className='h-8 w-16 bg-gray-800 rounded animate-pulse' />
							</CardContent>
						</Card>
					))}
				</div>

				{/* DID List Skeleton */}
				<DIDSkeleton variant='list' count={5} />
			</div>
		)
	}

	if (!userId) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<AlertTriangle className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
					<h3 className='text-lg font-medium mb-2'>Authentication Required</h3>
					<p className='text-muted-foreground'>Please log in to access the DID management dashboard</p>
				</div>
			</div>
		)
	}

	if (error && !userDIDs.length) {
		return (
			<div className='text-center py-12'>
				<p className='text-red-600 mb-4'>{error}</p>
				<Button onClick={() => window.location.reload()}>Try Again</Button>
			</div>
		)
	}

	return (
		<div className='container mx-auto py-6 space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>DID Management</h1>
					<p className='text-muted-foreground'>Manage your Decentralized Identifiers (DIDs)</p>
					{selectedDID && (
						<p className='text-xs text-blue-600 mt-1'>
							Currently viewing: <span className='font-mono'>{selectedDID.id}</span>
						</p>
					)}
				</div>
				<div className='flex gap-2'>
					{selectedDID && (
						<>
							<Button variant='secondary' onClick={() => setActiveTab('document')} className='flex items-center gap-2'>
								<FileText className='h-4 w-4' />
								View Document
							</Button>
							<Button variant='outline' onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(selectedDID.id))}/edit`)} className='flex items-center gap-2'>
								<Settings className='h-4 w-4' />
								Edit Document
							</Button>
						</>
					)}
					<Link href='/dashboard/dids/create'>
						<Button variant='outline'>
							<Plus className='h-4 w-4 mr-2' />
							Create DID
						</Button>
					</Link>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<Alert variant='destructive'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.total}</div>
						<p className='text-xs text-muted-foreground'>Across all methods</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Active DIDs</CardTitle>
						<div className='h-2 w-2 bg-green-500 rounded-full' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{stats.active}</div>
						<p className='text-xs text-muted-foreground'>Currently active</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Deactivated</CardTitle>
						<div className='h-2 w-2 bg-gray-500 rounded-full' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-gray-600'>{stats.deactivated}</div>
						<p className='text-xs text-muted-foreground'>Not active</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Revoked</CardTitle>
						<div className='h-2 w-2 bg-red-500 rounded-full' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>{stats.revoked}</div>
						<p className='text-xs text-muted-foreground'>Permanently revoked</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Card>
				<CardContent className='p-0'>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<div className='border-b px-6 pt-6'>
							<TabsList className='grid w-full grid-cols-4'>
								<TabsTrigger value='overview' className='flex items-center gap-2'>
									<Users className='h-4 w-4' />
									Overview
								</TabsTrigger>
								<TabsTrigger value='table' className='flex items-center gap-2'>
									<FileText className='h-4 w-4' />
									Table View
								</TabsTrigger>
								<TabsTrigger value='document' className='flex items-center gap-2'>
									<FileText className='h-4 w-4' />
									Document
									{selectedDID && <Badge variant='secondary'>Active</Badge>}
								</TabsTrigger>
								<TabsTrigger value='resolver' className='flex items-center gap-2'>
									<Globe className='h-4 w-4' />
									Resolver
								</TabsTrigger>
							</TabsList>
						</div>

						<div className='p-6'>
							{/* Overview Tab - Card-based view */}
							<TabsContent value='overview' className='mt-0 space-y-6'>
								<OverviewContent userDIDs={userDIDs} recentResolutions={recentResolutions} onDIDSelected={handleDIDSelected} didsHasMore={didsHasMore} didsLoading={didsLoading} onLoadMoreDIDs={loadMoreDIDs} onLoadAllDIDs={loadAllDIDs} showAllDIDs={showAllDIDs} onDeactivate={handleDeactivate} onRevoke={handleRevoke} getStatusBadge={getStatusBadge} getMethodIcon={getMethodIcon} actionLoading={actionLoading} router={router} />
							</TabsContent>

							{/* Table View Tab - Full table with pagination */}
							<TabsContent value='table' className='mt-0'>
								<TableView userDIDs={userDIDs} pagination={pagination} onPageChange={handlePageChange} onDIDSelected={handleDIDSelected} onDeactivate={handleDeactivate} onRevoke={handleRevoke} getStatusBadge={getStatusBadge} getMethodIcon={getMethodIcon} actionLoading={actionLoading} router={router} />
							</TabsContent>

							{/* Document View Tab - DID Document Viewer */}
							<TabsContent value='document' className='mt-0'>
								{selectedDID ? (
									<div className='space-y-4'>
										<div className='flex items-center justify-between'>
											<div>
												<h3 className='text-lg font-semibold'>DID Document</h3>
												<p className='text-sm text-muted-foreground'>Formatted view of the selected DID document</p>
											</div>
											<div className='flex gap-2'>
												<Button variant='outline' onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(selectedDID.id))}/edit`)}>
													<Settings className='h-4 w-4 mr-2' />
													Edit Document
												</Button>
												<Button variant='outline' onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(selectedDID.id))}`)}>
													<Eye className='h-4 w-4 mr-2' />
													View Details Page
												</Button>
											</div>
										</div>
										<DIDDocumentViewer document={selectedDID} title='DID Document' showRawJson={true} allowCopy={true} allowDownload={true} />
									</div>
								) : (
									<div className='text-center py-12'>
										<FileText className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
										<h3 className='text-lg font-medium mb-2'>No Document Selected</h3>
										<p className='text-muted-foreground mb-4'>Select a DID from the overview or table view to view its document</p>
										<div className='flex gap-2 justify-center'>
											<Button variant='outline' onClick={() => setActiveTab('overview')}>
												View DIDs
											</Button>
										</div>
									</div>
								)}
							</TabsContent>

							{/* Resolver Tab */}
							<TabsContent value='resolver' className='mt-0'>
								<AdvancedDIDResolver initialDid={selectedDID?.id || ''} onResolved={handleResolutionCompleted} />
							</TabsContent>
						</div>
					</Tabs>
				</CardContent>
			</Card>

			{/* Confirmation Modal */}
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{modalMode === 'deactivate' ? 'Deactivate DID' : 'Revoke DID'}
						</DialogTitle>
						<DialogDescription>
							{modalMode === 'deactivate' ? (
								<>
									Are you sure you want to deactivate this DID?
									<br />
									<br />
									<strong>{selectedDIDForAction?.name || selectedDIDForAction?.id?.substring(0, 8) + '...'}</strong>
									<br />
									<br />
									This action can be reversed later.
								</>
							) : (
								<>
									Are you sure you want to revoke this DID?
									<br />
									<br />
									<strong>{selectedDIDForAction?.did}</strong>
									<br />
									<br />
									⚠️ <strong>WARNING:</strong> This action is PERMANENT and cannot be undone!
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowModal(false)}>
							Cancel
						</Button>
						<Button
							variant={modalMode === 'revoke' ? 'destructive' : 'default'}
							onClick={() => {
								if (selectedDIDForAction) {
									if (modalMode === 'deactivate') {
										performDeactivate(selectedDIDForAction)
									} else {
										executeRevoke(selectedDIDForAction)
									}
									setShowModal(false)
								}
							}}
						>
							{modalMode === 'deactivate' ? 'Deactivate' : 'Revoke'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default function DIDManagementPage() {
	return <DIDManagementDashboard />
}

// Sub-components
interface OverviewContentProps {
	userDIDs: DIDItem[]
	recentResolutions: UniversalResolutionResponse[]
	onDIDSelected: (didItem: DIDItem) => void
	didsHasMore: boolean
	didsLoading: boolean
	onLoadMoreDIDs: () => void
	onLoadAllDIDs: () => void
	showAllDIDs: boolean
	onDeactivate: (did: DIDItem) => void
	onRevoke: (did: DIDItem) => void
	getStatusBadge: (status: string) => JSX.Element
	getMethodIcon: (method: string) => JSX.Element
	actionLoading: {[key: string]: boolean}
	router: AppRouterInstance
}

const OverviewContent: React.FC<OverviewContentProps> = ({userDIDs, recentResolutions, onDIDSelected, didsHasMore, didsLoading, onLoadMoreDIDs, onLoadAllDIDs, showAllDIDs, onDeactivate, onRevoke, getStatusBadge, getMethodIcon, actionLoading, router}) => {
	return (
		<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
			{/* User DIDs */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center justify-between'>Your DIDs</CardTitle>
					<CardDescription>Manage your DID documents</CardDescription>
				</CardHeader>
				<CardContent>
					{userDIDs.length === 0 ? (
						<div className='text-center py-8'>
							<FileText className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
							<h3 className='text-lg font-medium mb-2'>No DIDs Created Yet</h3>
							<p className='text-sm text-muted-foreground mb-4'>Start by creating your first Decentralized Identifier to manage your digital identity</p>
						</div>
					) : (
						<div className='space-y-3'>
							{userDIDs.map((didItem, index) => (
								<div key={didItem.id || index} className='group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 mb-2'>
											{getMethodIcon(didItem.method)}
											<Badge variant='outline' className='text-xs'>
												{didItem.method}
											</Badge>
											{getStatusBadge(didItem.status)}
										</div>
										<p className='font-mono text-sm truncate cursor-pointer hover:text-primary' title={didItem.did} onClick={() => onDIDSelected(didItem)}>
											{didItem.did}
										</p>
										<p className='text-xs text-muted-foreground'>Created {new Date(didItem.created_at).toLocaleDateString()}</p>
									</div>
									<div className='flex items-center gap-2'>
										{didItem.metadata && typeof didItem.metadata === 'object' && 'keyType' in didItem.metadata && (
											<Badge variant='secondary' className='text-xs'>
												{String(didItem.metadata.keyType)}
											</Badge>
										)}
										<div className='opacity-0 group-hover:opacity-100 transition-opacity flex gap-1'>
											<Button variant='ghost' size='sm' onClick={() => onDIDSelected(didItem)} title='View Document'>
												<Eye className='h-4 w-4' />
											</Button>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant='ghost' size='sm'>
														<MoreHorizontal className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end'>
													<DropdownMenuItem onClick={() => onDIDSelected(didItem)}>
														<Eye className='h-4 w-4 mr-2' />
														View Document
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(didItem.did))}/edit`)}>
														<Settings className='h-4 w-4 mr-2' />
														Edit Document
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(didItem.did))}`)}>
														<Eye className='h-4 w-4 mr-2' />
														View Details Page
													</DropdownMenuItem>
													{didItem.status === DIDStatus.ACTIVE && (
														<DropdownMenuItem onClick={() => onDeactivate(didItem)} className='text-orange-600' disabled={actionLoading[`deactivate-${didItem.id}`]}>
															<Power className='h-4 w-4 mr-2' />
															{actionLoading[`deactivate-${didItem.id}`] ? 'Deactivating...' : 'Deactivate'}
														</DropdownMenuItem>
													)}
													{didItem.status !== DIDStatus.REVOKED && (
														<DropdownMenuItem onClick={() => onRevoke(didItem)} className='text-red-600' disabled={actionLoading[`revoke-${didItem.id}`]}>
															<Trash2 className='h-4 w-4 mr-2' />
															{actionLoading[`revoke-${didItem.id}`] ? 'Revoking...' : 'Revoke'}
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							))}

							{/* Action Buttons */}
							{(didsHasMore || !showAllDIDs) && (
								<div className='text-center pt-3'>
									<p className='text-sm text-muted-foreground mb-2'>{showAllDIDs ? `Showing all ${userDIDs.length} DID${userDIDs.length > 1 ? 's' : ''}` : `Showing ${userDIDs.length} DID${userDIDs.length > 1 ? 's' : ''}`}</p>
									<div className='flex gap-2 justify-center'>
										{didsHasMore && !showAllDIDs && (
											<Button variant='outline' size='sm' onClick={onLoadMoreDIDs} disabled={didsLoading}>
												{didsLoading ? 'Loading...' : 'View More (+5)'}
											</Button>
										)}
										{!showAllDIDs && (
											<Button variant='secondary' size='sm' onClick={onLoadAllDIDs} disabled={didsLoading}>
												{didsLoading ? 'Loading...' : 'Show All'}
											</Button>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recent Resolutions */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Resolutions</CardTitle>
					<CardDescription>Latest DID resolution activities</CardDescription>
				</CardHeader>
				<CardContent>
					{recentResolutions.length === 0 ? (
						<div className='text-center py-8'>
							<Search className='h-8 w-8 mx-auto text-muted-foreground mb-2' />
							<p className='text-sm text-muted-foreground'>No recent resolutions</p>
						</div>
					) : (
						<div className='space-y-3'>
							{recentResolutions.map((resolution, index) => (
								<div key={index} className='flex items-center justify-between p-3 border rounded'>
									<div className='flex-1'>
										<code className='text-sm'>{resolution.didDocument?.id || 'Unknown'}</code>
										<div className='flex items-center gap-2 mt-1'>
											<Badge variant={resolution.resolutionResult === 'success' ? 'default' : 'destructive'} className='text-xs'>
												{resolution.resolutionResult}
											</Badge>
											<span className='text-xs text-muted-foreground'>{resolution.resolutionTime}</span>
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

interface TableViewProps {
	userDIDs: DIDItem[]
	pagination: {
		page: number
		pageSize: number
		totalPages: number
		total: number
	}
	onPageChange: (page: number) => void
	onDIDSelected: (didItem: DIDItem) => void
	onDeactivate: (did: DIDItem) => void
	onRevoke: (did: DIDItem) => void
	getStatusBadge: (status: string) => JSX.Element
	getMethodIcon: (method: string) => JSX.Element
	actionLoading: {[key: string]: boolean}
	router: AppRouterInstance
}

const TableView: React.FC<TableViewProps> = ({userDIDs, pagination, onPageChange, onDIDSelected, onDeactivate, onRevoke, getStatusBadge, getMethodIcon, actionLoading, router}) => {
	const handleViewDetails = (did: DIDItem) => {
		router.push(`/dashboard/dids/${encodeURIComponent(String(did.did))}`)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='text-lg font-medium'>DID Table View</h3>
					<p className='text-sm text-muted-foreground'>Comprehensive table view with all DID management actions</p>
				</div>
				<Link href='/dashboard/dids/create'>
					<Button>
						<Plus className='h-4 w-4 mr-2' />
						Create DID
					</Button>
				</Link>
			</div>

			{userDIDs.length === 0 ? (
				<div className='text-center py-12'>
					<Key className='h-12 w-12 text-gray-400 mx-auto mb-4' />
					<h3 className='text-lg font-medium text-gray-900 mb-2'>No DIDs found</h3>
					<p className='text-gray-500 mb-4'>Get started by creating your first DID</p>
					<Link href='/dashboard/dids/create'>
						<Button>
							<Plus className='h-4 w-4 mr-2' />
							Create DID
						</Button>
					</Link>
				</div>
			) : (
				<div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>DID</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{userDIDs.map((did) => (
								<TableRow key={did.id}>
									<TableCell className='font-mono text-sm'>
										<div className='max-w-xs truncate' title={String(did.did)}>
											{String(did.did)}
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-2'>
											{getMethodIcon(did.method)}
											<span className='capitalize'>{did.method}</span>
										</div>
									</TableCell>
									<TableCell>{getStatusBadge(did.status)}</TableCell>
									<TableCell>{new Date(did.created_at).toLocaleDateString()}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' className='h-8 w-8 p-0'>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuItem onClick={() => onDIDSelected(did)}>
													<Eye className='h-4 w-4 mr-2' />
													View Document
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(did.did))}/edit`)}>
													<Settings className='h-4 w-4 mr-2' />
													Edit Document
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleViewDetails(did)}>
													<Eye className='h-4 w-4 mr-2' />
													View Details
												</DropdownMenuItem>
												{did.status === DIDStatus.ACTIVE && (
													<DropdownMenuItem onClick={() => onDeactivate(did)} className='text-orange-600' disabled={actionLoading[`deactivate-${did.id}`]}>
														<Power className='h-4 w-4 mr-2' />
														{actionLoading[`deactivate-${did.id}`] ? 'Deactivating...' : 'Deactivate'}
													</DropdownMenuItem>
												)}
												{did.status !== DIDStatus.REVOKED && (
													<DropdownMenuItem onClick={() => onRevoke(did)} className='text-red-600' disabled={actionLoading[`revoke-${did.id}`]}>
														<Trash2 className='h-4 w-4 mr-2' />
														{actionLoading[`revoke-${did.id}`] ? 'Revoking...' : 'Revoke'}
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<div className='mt-4'>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href='#'
											onClick={(e) => {
												e.preventDefault()
												if (pagination.page > 1) {
													onPageChange(pagination.page - 1)
												}
											}}
											className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
											aria-disabled={pagination.page <= 1}
										/>
									</PaginationItem>

									{/* First page */}
									<PaginationItem>
										<PaginationLink
											href='#'
											isActive={pagination.page === 1}
											onClick={(e) => {
												e.preventDefault()
												onPageChange(1)
											}}>
											1
										</PaginationLink>
									</PaginationItem>

									{/* Ellipsis for many pages */}
									{pagination.page > 3 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}

									{/* Current page and neighbors */}
									{pagination.page > 2 && (
										<PaginationItem>
											<PaginationLink
												href='#'
												onClick={(e) => {
													e.preventDefault()
													onPageChange(pagination.page - 1)
												}}>
												{pagination.page - 1}
											</PaginationLink>
										</PaginationItem>
									)}

									{pagination.page !== 1 && pagination.page !== pagination.totalPages && (
										<PaginationItem>
											<PaginationLink href='#' isActive={true} onClick={(e) => e.preventDefault()}>
												{pagination.page}
											</PaginationLink>
										</PaginationItem>
									)}

									{pagination.page < pagination.totalPages - 1 && (
										<PaginationItem>
											<PaginationLink
												href='#'
												onClick={(e) => {
													e.preventDefault()
													onPageChange(pagination.page + 1)
												}}>
												{pagination.page + 1}
											</PaginationLink>
										</PaginationItem>
									)}

									{/* Ellipsis for many pages */}
									{pagination.page < pagination.totalPages - 2 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}

									{/* Last page */}
									{pagination.totalPages > 1 && (
										<PaginationItem>
											<PaginationLink
												href='#'
												isActive={pagination.page === pagination.totalPages}
												onClick={(e) => {
													e.preventDefault()
													onPageChange(pagination.totalPages)
												}}>
												{pagination.totalPages}
											</PaginationLink>
										</PaginationItem>
									)}

									<PaginationItem>
										<PaginationNext
											href='#'
											onClick={(e) => {
												e.preventDefault()
												if (pagination.page < pagination.totalPages) {
													onPageChange(pagination.page + 1)
												}
											}}
											className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
											aria-disabled={pagination.page >= pagination.totalPages}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
							<div className='text-center text-sm text-muted-foreground mt-2'>
								Showing {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} DIDs
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
