'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {PageHeader} from '@/components/layout/PageHeader'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Plus, Eye, Trash2, Power, MoreHorizontal, Key, Globe, Coins, Network, Users} from 'lucide-react'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious} from '@/components/ui/pagination'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import * as didService from '@/services/didService'
import type {DIDResponse, ListDIDsInput} from '@/types/did'
import {DIDStatus} from '@/types/did'
import {DIDSkeleton} from '@/components/did'

// Types for DID data - using types from API
interface DIDStats {
	total: number
	active: number
	deactivated: number
	revoked: number
	byMethod: Record<string, number>
}

/**
 * DID Dashboard Page - Main page for managing DIDs
 * Displays user's DIDs with status indicators and quick actions
 */
export default function DIDDashboardPage() {
	const router = useRouter()
	const [dids, setDids] = useState<DIDResponse[]>([])
	const [stats, setStats] = useState<DIDStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [initialLoad, setInitialLoad] = useState(true) // Theo dõi lần tải đầu tiên
	const [error, setError] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 10,
		totalPages: 1,
		total: 0,
	})

	// Fetch DIDs and statistics
	const fetchDIDs = useCallback(
		async (page = 1) => {
			try {
				// Use different loading states for initial load and pagination
				if (initialLoad) {
					setLoading(true) // Show skeleton only on initial load
				}
				setError(null)

				// Prepare pagination parameters
				const pageSize = pagination.pageSize
				const params: ListDIDsInput = {
					limit: pageSize,
					page: page,
				}

				// Fetch user's DIDs with pagination
				const didsResponse = await didService.listDIDs(params)
				setDids(didsResponse.dids || [])

				// Update pagination state
				setPagination({
					page: page,
					pageSize: pageSize,
					totalPages: Math.ceil((didsResponse.total || 0) / pageSize),
					total: didsResponse.total || 0,
				})

				// Fetch DID statistics
				const statsResponse = await didService.getDIDStatistics()

				// Convert statistics to local format
				const convertedStats: DIDStats = {
					total: statsResponse.total_dids,
					active: statsResponse.active_dids,
					deactivated: statsResponse.deactivated_dids,
					revoked: statsResponse.revoked_dids,
					byMethod: statsResponse.dids_by_method,
				}

				setStats(convertedStats)
			} catch (err) {
				setError('Failed to fetch DIDs')
				console.error('Error fetching DIDs:', err)
			} finally {
				if (initialLoad) {
					setLoading(false)
					setInitialLoad(false)
				}
			}
		},
		[initialLoad, pagination.pageSize],
	)

	useEffect(() => {
		fetchDIDs(pagination.page)
	}, [pagination.page, pagination.pageSize, fetchDIDs])

	/**
	 * Get status badge variant based on DID status
	 */
	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'active':
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

	/**
	 * Get method icon based on DID method
	 */
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

	/**
	 * Handle DID deactivation
	 */
	const handleDeactivate = async (did: DIDResponse) => {
		try {
			// Call the deactivate API - it returns no content on success
			await didService.deactivateDID({
				id: did.id,
				did: String(did.did),
				user_id: did.user_id,
				reason: 'User requested deactivation',
			})

			// If we reach here, the operation was successful (no error thrown)
			// Update the DID status in the UI immediately
			setDids((prevDids) => prevDids.map((d) => (d.id === did.id ? {...d, status: DIDStatus.DEACTIVATED} : d)))

			// Update statistics
			if (stats) {
				setStats({
					...stats,
					active: stats.active - 1,
					deactivated: stats.deactivated + 1,
				})
			}
		} catch (err) {
			console.error('Error deactivating DID:', err)
			setError('Failed to deactivate DID')
		}
	}

	/**
	 * Handle DID revocation
	 */
	const handleRevoke = async (did: DIDResponse) => {
		try {
			// Call the revoke API - it returns no content on success
			await didService.revokeDID({
				id: did.id,
				did: String(did.did),
				user_id: did.user_id,
				reason: 'User requested revocation',
			})

			// If we reach here, the operation was successful (no error thrown)
			// Update the DID status in the UI immediately
			setDids((prevDids) => prevDids.map((d) => (d.id === did.id ? {...d, status: DIDStatus.REVOKED} : d)))

			// Update statistics
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
		} catch (err) {
			console.error('Error revoking DID:', err)
			setError('Failed to revoke DID')
		}
	}

	/**
	 * Handle page change
	 */
	const handlePageChange = (newPage: number) => {
		if (newPage > 0 && newPage <= pagination.totalPages) {
			console.log('Changing to page:', newPage)
			// Prevent scrolling to top by using preventDefault in the onClick handlers
			setPagination((prev) => ({
				...prev,
				page: newPage,
			}))
			// Scroll to the top of the table instead of the page
			const tableElement = document.querySelector('.card-content-table')
			if (tableElement) {
				tableElement.scrollIntoView({behavior: 'smooth', block: 'start'})
			}
		}
	}

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
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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

	if (error) {
		return (
			<div className='text-center py-12'>
				<p className='text-red-600 mb-4'>{error}</p>
				<Button onClick={() => window.location.reload()}>Try Again</Button>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='DID Management'
				description='Manage your Decentralized Identifiers (DIDs)'
				actions={
					<Link href='/dashboard/dids/create'>
						<Button>
							<Plus className='h-4 w-4 mr-2' />
							Create DID
						</Button>
					</Link>
				}
			/>

			{/* Statistics Cards */}
			{stats && (
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
							<Key className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent className='card-content-table'>
							<div className='text-2xl font-bold'>{stats.total}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active</CardTitle>
							<div className='h-2 w-2 bg-green-500 rounded-full' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-green-600'>{stats.active}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Deactivated</CardTitle>
							<div className='h-2 w-2 bg-gray-500 rounded-full' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-gray-600'>{stats.deactivated}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Revoked</CardTitle>
							<div className='h-2 w-2 bg-red-500 rounded-full' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-red-600'>{stats.revoked}</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* DIDs Table */}
			<Card>
				<CardHeader>
					<CardTitle>Your DIDs</CardTitle>
					<CardDescription>A list of all your Decentralized Identifiers</CardDescription>
				</CardHeader>
				<CardContent className='card-content-table relative'>
					{dids.length === 0 ? (
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
									{dids.map((did) => (
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
														<DropdownMenuItem onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(String(did.did))}`)}>
															<Eye className='h-4 w-4 mr-2' />
															View Details
														</DropdownMenuItem>
														{did.status === DIDStatus.ACTIVE && (
															<DropdownMenuItem onClick={() => handleDeactivate(did)} className='text-orange-600'>
																<Power className='h-4 w-4 mr-2' />
																Deactivate
															</DropdownMenuItem>
														)}
														{did.status !== DIDStatus.REVOKED && (
															<DropdownMenuItem onClick={() => handleRevoke(did)} className='text-red-600'>
																<Trash2 className='h-4 w-4 mr-2' />
																Revoke
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
															handlePageChange(pagination.page - 1)
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
														handlePageChange(1)
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
															handlePageChange(pagination.page - 1)
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
															handlePageChange(pagination.page + 1)
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
															handlePageChange(pagination.totalPages)
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
															handlePageChange(pagination.page + 1)
														}
													}}
													className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
													aria-disabled={pagination.page >= pagination.totalPages}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
									<div className='text-center text-sm text-muted-foreground mt-2'>
										Show {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} per {pagination.total} DIDs
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
