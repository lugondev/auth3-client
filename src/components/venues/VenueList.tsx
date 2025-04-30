'use client' // This component needs client-side interactivity

import React, {useState, useEffect, useCallback} from 'react'
import Link from 'next/link'
import venueService from '@/services/venueService'
import {VenueSearchParams, VenueSearchResult} from '@/types/venue' // Removed unused Venue import
import VenueCard from './VenueCard'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious} from '@/components/ui/pagination'
import {useDebouncedCallback} from 'use-debounce' // Need to install this

// TODO: Add filters for location, category

const DEBOUNCE_TIME = 300 // milliseconds for search debounce
const ITEMS_PER_PAGE = 12 // Number of venues per page

export default function VenueList() {
	const [searchParams, setSearchParams] = useState<VenueSearchParams>({
		query: '',
		page: 1,
		limit: ITEMS_PER_PAGE,
		// Add other filters like category, location later
	})
	const [data, setData] = useState<VenueSearchResult | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('') // Local state for input field

	const fetchVenues = useCallback(async (params: VenueSearchParams) => {
		setLoading(true)
		setError(null)
		try {
			const result = await venueService.searchVenues(params)
			setData(result)
		} catch (err) {
			console.error('Failed to fetch venues:', err)
			setError('Failed to load venues. Please try again later.')
			setData(null) // Clear data on error
		} finally {
			setLoading(false)
		}
	}, [])

	// Debounced search handler
	const debouncedSearch = useDebouncedCallback((query: string) => {
		setSearchParams((prev) => ({...prev, query: query, page: 1})) // Reset to page 1 on new search
	}, DEBOUNCE_TIME)

	// Handle input change
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newSearchTerm = event.target.value
		setSearchTerm(newSearchTerm)
		debouncedSearch(newSearchTerm)
	}

	// Fetch venues when searchParams change
	useEffect(() => {
		fetchVenues(searchParams)
	}, [searchParams, fetchVenues])

	// Handle pagination change
	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setSearchParams((prev) => ({...prev, page: newPage}))
		}
	}

	const totalPages = data ? Math.ceil(data.total / (searchParams.limit || ITEMS_PER_PAGE)) : 0

	// Helper to render pagination items compactly
	const renderPaginationItems = () => {
		const items = []
		const currentPage = searchParams.page || 1

		// Previous Button
		items.push(
			<PaginationItem key='prev'>
				<PaginationPrevious
					href='#'
					onClick={(e) => {
						e.preventDefault()
						handlePageChange(currentPage - 1)
					}}
					aria-disabled={currentPage <= 1}
					tabIndex={currentPage <= 1 ? -1 : undefined}
					className={currentPage <= 1 ? 'pointer-events-none opacity-50' : undefined}
				/>
			</PaginationItem>,
		)

		// Page numbers (simplified logic for brevity, could be more sophisticated)
		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) {
				items.push(
					<PaginationItem key={i}>
						<PaginationLink
							href='#'
							onClick={(e) => {
								e.preventDefault()
								handlePageChange(i)
							}}
							isActive={currentPage === i}>
							{i}
						</PaginationLink>
					</PaginationItem>,
				)
			}
		} else {
			// Always show first page
			items.push(
				<PaginationItem key={1}>
					<PaginationLink
						href='#'
						onClick={(e) => {
							e.preventDefault()
							handlePageChange(1)
						}}
						isActive={currentPage === 1}>
						1
					</PaginationLink>
				</PaginationItem>,
			)

			// Ellipsis or middle pages
			if (currentPage > 3) {
				items.push(
					<PaginationItem key='start-ellipsis'>
						<PaginationEllipsis />
					</PaginationItem>,
				)
			}

			const startPage = Math.max(2, currentPage - 1)
			const endPage = Math.min(totalPages - 1, currentPage + 1)

			for (let i = startPage; i <= endPage; i++) {
				items.push(
					<PaginationItem key={i}>
						<PaginationLink
							href='#'
							onClick={(e) => {
								e.preventDefault()
								handlePageChange(i)
							}}
							isActive={currentPage === i}>
							{i}
						</PaginationLink>
					</PaginationItem>,
				)
			}

			if (currentPage < totalPages - 2) {
				items.push(
					<PaginationItem key='end-ellipsis'>
						<PaginationEllipsis />
					</PaginationItem>,
				)
			}

			// Always show last page
			items.push(
				<PaginationItem key={totalPages}>
					<PaginationLink
						href='#'
						onClick={(e) => {
							e.preventDefault()
							handlePageChange(totalPages)
						}}
						isActive={currentPage === totalPages}>
						{totalPages}
					</PaginationLink>
				</PaginationItem>,
			)
		}

		// Next Button
		items.push(
			<PaginationItem key='next'>
				<PaginationNext
					href='#'
					onClick={(e) => {
						e.preventDefault()
						handlePageChange(currentPage + 1)
					}}
					aria-disabled={currentPage >= totalPages}
					tabIndex={currentPage >= totalPages ? -1 : undefined}
					className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : undefined}
				/>
			</PaginationItem>,
		)

		return items
	}

	return (
		<div>
			{/* Search Input */}
			<div className='mb-6'>
				<Input
					type='text'
					placeholder='Search venues by name...'
					value={searchTerm}
					onChange={handleSearchChange}
					className='max-w-sm' // Limit width
				/>
				{/* Filter dropdowns/buttons will go here */}
			</div>

			{/* Loading State */}
			{loading && (
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
					{Array.from({length: ITEMS_PER_PAGE}).map((_, index) => (
						<div key={index} className='flex flex-col space-y-3'>
							<Skeleton className='h-[192px] w-full rounded-xl' /> {/* Adjust height to match CardHeader h-48 */}
							<div className='space-y-2 p-4'>
								{' '}
								{/* Mimic CardContent padding */}
								<Skeleton className='h-4 w-3/4' />
								<Skeleton className='h-4 w-1/2' />
								<Skeleton className='h-4 w-1/4' />
							</div>
						</div>
					))}
				</div>
			)}

			{/* Error State */}
			{error && !loading && (
				<div className='text-center text-red-600 py-10'>
					<p>{error}</p>
					<Button onClick={() => fetchVenues(searchParams)} variant='outline' className='mt-4'>
						Try Again
					</Button>
				</div>
			)}

			{/* Data Display */}
			{!loading && !error && data && data.venues.length > 0 && (
				<>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8'>
						{data.venues.map((venue) => (
							<Link key={venue.id} href={`/venues/${venue.id}`} passHref>
								<a className='block'>
									{' '}
									{/* Wrap Card in link */}
									<VenueCard venue={venue} />
								</a>
							</Link>
						))}
					</div>

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<Pagination>
							<PaginationContent>{renderPaginationItems()}</PaginationContent>
						</Pagination>
					)}
				</>
			)}

			{/* No Results State */}
			{!loading && !error && data && data.venues.length === 0 && (
				<div className='text-center text-gray-500 py-10'>
					<p>No venues found matching your criteria.</p>
				</div>
			)}
		</div>
	)
}
