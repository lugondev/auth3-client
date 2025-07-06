'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Search, Filter, Plus, RefreshCw} from 'lucide-react'
import {DIDResponse, DIDMethod, DIDStatus, DIDManagementFilters, DIDActivity, DIDData} from '@/types/did'
import {DIDCard} from './DIDCard'
import {toast} from 'sonner'
import * as didService from '@/services/didService'

interface DIDListProps {
	onCreateNew?: () => void
	onViewDetails?: (did: DIDData) => void
	onDeactivate?: (did: DIDData) => void
	onDelete?: (did: DIDData) => void
	className?: string
}

interface DIDListStats {
	total: number
	active: number
	deactivated: number
	revoked: number
	by_method: Record<string, number>
	recent_activity?: DIDActivity[]
	user_count?: number
	timestamp?: string
}

/**
 * DIDList component displays a filterable and searchable list of DIDs
 * with management actions and statistics
 */
export function DIDList({onCreateNew, onViewDetails, onDeactivate, onDelete, className}: DIDListProps) {
	const [dids, setDids] = useState<DIDResponse[]>([])
	const [stats, setStats] = useState<DIDListStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [filters, setFilters] = useState<DIDManagementFilters>({})
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize] = useState(10)

	/**
	 * Fetch DIDs from the API with current filters and pagination
	 */
	const fetchDIDs = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			const response = await didService.listDIDs({
				method: filters.method,
				status: filters.status,
				limit: pageSize,
				offset: (currentPage - 1) * pageSize,
			})
			setDids(response.dids)
			if (response.stats) {
				setStats({
					total: response.stats.total_dids,
					active: response.stats.active_dids,
					deactivated: response.stats.deactivated_dids,
					revoked: response.stats.revoked_dids,
					by_method: response.stats.dids_by_method,
				})
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch DIDs')
			toast.error('Failed to load DIDs')
		} finally {
			setLoading(false)
		}
	}, [filters.method, filters.status])

	/**
	 * Handle search input change with debouncing
	 */
	const handleSearchChange = (value: string) => {
		setSearchTerm(value)
		setCurrentPage(1)
	}

	/**
	 * Handle filter changes
	 */
	const handleFilterChange = (key: keyof DIDManagementFilters, value: string | DIDMethod | DIDStatus | undefined) => {
		setFilters((prev) => ({
			...prev,
			[key]: value === 'all' ? undefined : value,
		}))
		setCurrentPage(1)
	}

	/**
	 * Handle refresh action
	 */
	const handleRefresh = () => {
		fetchDIDs()
	}

	/**
	 * Filter DIDs based on search term and filters
	 */
	const filteredDIDs = dids.filter((did) => {
		const matchesSearch = !searchTerm || did.did.toLowerCase().includes(searchTerm.toLowerCase()) || did.method.toLowerCase().includes(searchTerm.toLowerCase())

		const matchesMethod = !filters.method || did.method === filters.method
		const matchesStatus = !filters.status || did.status === filters.status

		return matchesSearch && matchesMethod && matchesStatus
	})

	// Load DIDs on component mount and when filters change
	useEffect(() => {
		fetchDIDs()
	}, [currentPage, filters, fetchDIDs])

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchTerm !== '') {
				fetchDIDs()
			}
		}, 500)

		return () => clearTimeout(timer)
	}, [searchTerm, fetchDIDs])

	if (error) {
		return (
			<Card className={className}>
				<CardContent className='p-6'>
					<div className='text-center text-red-600'>
						<p>Error loading DIDs: {error}</p>
						<Button onClick={handleRefresh} className='mt-2'>
							<RefreshCw className='h-4 w-4 mr-2' />
							Retry
						</Button>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className={className}>
			{/* Header with stats */}
			<div className='mb-6'>
				<div className='flex items-center justify-between mb-4'>
					<div>
						<h2 className='text-2xl font-bold'>DID Management</h2>
						<p className='text-muted-foreground'>Manage your decentralized identifiers</p>
					</div>
					<div className='flex gap-2'>
						<Button onClick={handleRefresh} variant='outline' size='sm'>
							<RefreshCw className='h-4 w-4 mr-2' />
							Refresh
						</Button>
						{onCreateNew && (
							<Button onClick={onCreateNew}>
								<Plus className='h-4 w-4 mr-2' />
								Create DID
							</Button>
						)}
					</div>
				</div>

				{/* Stats cards */}
				{stats && (
					<div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold'>{stats.total}</div>
								<div className='text-sm text-muted-foreground'>Total DIDs</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold text-green-600'>{stats.active}</div>
								<div className='text-sm text-muted-foreground'>Active</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold text-yellow-600'>{stats.deactivated}</div>
								<div className='text-sm text-muted-foreground'>Deactivated</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-2xl font-bold text-red-600'>{stats.revoked}</div>
								<div className='text-sm text-muted-foreground'>Revoked</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className='p-4'>
								<div className='text-sm text-muted-foreground mb-1'>By Method</div>
								<div className='flex flex-wrap gap-1'>
									{Object.entries(stats.by_method).map(
										([method, count]) =>
											count > 0 && (
												<Badge key={method} variant='secondary' className='text-xs'>
													{method}: {count}
												</Badge>
											),
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Filters and search */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Filter className='h-5 w-5' />
						Filters & Search
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<div className='relative'>
							<Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
							<Input placeholder='Search DIDs...' value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className='pl-10' />
						</div>
						<Select value={filters.method || 'all'} onValueChange={(value) => handleFilterChange('method', value)}>
							<SelectTrigger>
								<SelectValue placeholder='All Methods' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Methods</SelectItem>
								<SelectItem value='key'>DID:Key</SelectItem>
								<SelectItem value='web'>DID:Web</SelectItem>
								<SelectItem value='ethr'>DID:Ethr</SelectItem>
								<SelectItem value='VBSN'>DID:VBSN</SelectItem>
								<SelectItem value='peer'>DID:Peer</SelectItem>
							</SelectContent>
						</Select>
						<Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
							<SelectTrigger>
								<SelectValue placeholder='All Statuses' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Statuses</SelectItem>
								<SelectItem value='active'>Active</SelectItem>
								<SelectItem value='deactivated'>Deactivated</SelectItem>
								<SelectItem value='revoked'>Revoked</SelectItem>
							</SelectContent>
						</Select>
						<Button
							variant='outline'
							onClick={() => {
								setSearchTerm('')
								setFilters({})
								setCurrentPage(1)
							}}>
							Clear Filters
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* DID List */}
			<div className='space-y-4'>
				{loading ? (
					// Loading skeletons
					Array.from({length: 3}).map((_, i) => (
						<Card key={i}>
							<CardContent className='p-6'>
								<div className='space-y-3'>
									<Skeleton className='h-4 w-3/4' />
									<Skeleton className='h-4 w-1/2' />
									<div className='flex gap-2'>
										<Skeleton className='h-6 w-16' />
										<Skeleton className='h-6 w-20' />
									</div>
								</div>
							</CardContent>
						</Card>
					))
				) : filteredDIDs.length === 0 ? (
					<Card>
						<CardContent className='p-12 text-center'>
							<div className='text-muted-foreground'>
								{searchTerm || Object.keys(filters).length > 0 ? (
									<div>
										<p className='text-lg mb-2'>No DIDs found</p>
										<p>Try adjusting your search or filters</p>
									</div>
								) : (
									<div>
										<p className='text-lg mb-2'>No DIDs yet</p>
										<p>Create your first DID to get started</p>
										{onCreateNew && (
											<Button onClick={onCreateNew} className='mt-4'>
												<Plus className='h-4 w-4 mr-2' />
												Create Your First DID
											</Button>
										)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				) : (
					filteredDIDs.map((did) => <DIDCard key={did.id} did={did} onView={onViewDetails} onDeactivate={onDeactivate} onDelete={onDelete} />)
				)}
			</div>

			{/* Pagination */}
			{filteredDIDs.length > pageSize && (
				<div className='flex justify-center mt-6'>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
							Previous
						</Button>
						<span className='text-sm text-muted-foreground'>
							Page {currentPage} of {Math.ceil(filteredDIDs.length / pageSize)}
						</span>
						<Button variant='outline' size='sm' onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage >= Math.ceil(filteredDIDs.length / pageSize)}>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
