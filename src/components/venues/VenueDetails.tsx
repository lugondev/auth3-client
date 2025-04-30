// next/src/components/venues/VenueDetails.tsx
'use client'

import React, {useState, useEffect} from 'react' // Remove unused useCallback
import Image from 'next/image'
import Link from 'next/link'
import {notFound, useRouter} from 'next/navigation' // Use router for actions
import venueService from '@/services/venueService'
import {Venue} from '@/types/venue'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from '@/components/ui/breadcrumb'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {MoreHorizontal} from 'lucide-react' // Icon for actions menu
import ProductList from './products/ProductList' // Import the ProductList component
// import {TableManagement} from './tables/TableManagement' // Remove old import
import TableManagementLayout from '@/features/table-management/components/TableManagementLayout' // Import the new layout

// Placeholder for Photo Gallery component
const VenuePhotoGallery = (
	{photos}: {photos: Venue['photos']}, // Removed unused venueId prop
) => (
	<div>
		<h3 className='text-xl font-semibold mb-4'>Photos</h3>
		{photos && photos.length > 0 ? (
			<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
				{photos.map((photo) => (
					<div key={photo.id} className='relative aspect-square'>
						<Image src={photo.url} alt={`Venue photo ${photo.id}`} layout='fill' objectFit='cover' className='rounded-md' />
						{/* Add delete button overlay later */}
					</div>
				))}
			</div>
		) : (
			<p className='text-muted-foreground'>No photos uploaded yet.</p>
		)}
		{/* Add photo upload UI later */}
	</div>
)

interface VenueDetailsProps {
	venueId: string
}

export default function VenueDetails({venueId}: VenueDetailsProps) {
	const [venue, setVenue] = useState<Venue | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<string>('overview') // State for active tab

	// Effect to load the stored tab value on component mount
	useEffect(() => {
		if (typeof window !== 'undefined' && venueId) {
			// Ensure localStorage is available and venueId is set
			const storedTab = localStorage.getItem(`venue_${venueId}_activeTab`)
			if (storedTab) {
				setActiveTab(storedTab)
			}
		}
	}, [venueId]) // Rerun if venueId changes, although typically it shouldn't on the same details page

	// Handler for changing tabs and saving to localStorage
	const handleTabChange = (value: string) => {
		setActiveTab(value)
		if (typeof window !== 'undefined' && venueId) {
			localStorage.setItem(`venue_${venueId}_activeTab`, value)
		}
	}

	// Effect to fetch venue data
	useEffect(() => {
		const fetchVenue = async () => {
			setLoading(true)
			setError(null)
			try {
				const data = await venueService.getVenueById(venueId)
				setVenue(data)
			} catch (err: unknown) {
				// Changed 'any' to 'unknown'
				console.error(`Failed to fetch venue ${venueId}:`, err)
				// Handle specific errors, e.g., 404 Not Found
				// Type guard to check if err is an object with response and status properties
				let isNotFoundError = false
				if (
					typeof err === 'object' &&
					err !== null &&
					'response' in err && // Check if 'response' property exists
					typeof (err as {response?: unknown}).response === 'object' && // Check if response is an object
					(err as {response?: object}).response !== null &&
					'status' in (err as {response: {status?: unknown}}).response && // Check if status exists on response
					(err as {response: {status?: unknown}}).response.status === 404
				) {
					isNotFoundError = true
				}

				if (isNotFoundError) {
					notFound() // Trigger Next.js 404 page
				} else {
					// Optionally, provide more specific error messages based on err type
					setError('Failed to load venue details. Please try again later.')
				}
				setVenue(null)
			} finally {
				setLoading(false)
			}
		}

		fetchVenue()
	}, [venueId])

	// --- Action Handlers (Placeholders) ---
	const handleEdit = () => {
		console.log('Navigate to edit page for venue:', venueId)
		// router.push(`/venues/${venueId}/edit`); // Implement edit route later
	}

	const handleDelete = async () => {
		if (window.confirm(`Are you sure you want to delete venue: ${venue?.name}? This cannot be undone.`)) {
			console.log('Attempting to delete venue:', venueId)
			try {
				// Optional: Add loading state for delete action
				await venueService.deleteVenue(venueId)
				alert('Venue deleted successfully.')
				router.push('/venues') // Redirect to venue list after deletion
			} catch (err) {
				console.error('Failed to delete venue:', err)
				alert('Failed to delete venue. Please try again.')
				// Optional: Reset loading state
			}
		}
	}

	const handleTransferOwnership = () => {
		console.log('Initiate ownership transfer for venue:', venueId)
		// Open a modal or navigate to a specific page later
	}

	// --- Render Logic ---
	if (loading) {
		return (
			<div>
				{/* Skeleton for Breadcrumbs */}
				<Skeleton className='h-6 w-1/4 mb-6' />
				{/* Skeleton for Header */}
				<div className='flex flex-col md:flex-row gap-6 mb-8'>
					<Skeleton className='w-full md:w-1/2 lg:w-1/3 h-64 rounded-lg' />
					<div className='flex-1 space-y-3'>
						<Skeleton className='h-8 w-3/4' />
						<Skeleton className='h-6 w-1/2' />
						<Skeleton className='h-6 w-full' />
						<Skeleton className='h-10 w-24 ml-auto' /> {/* Action button skeleton */}
					</div>
				</div>
				{/* Skeleton for Tabs */}
				<Skeleton className='h-10 w-1/3 mb-4' />
				<Skeleton className='h-64 w-full' />
			</div>
		)
	}

	if (error) {
		return (
			<div className='text-center text-red-600 py-10'>
				<p>{error}</p>
				<Button onClick={() => window.location.reload()} variant='outline' className='mt-4'>
					Try Again
				</Button>
			</div>
		)
	}

	if (!venue) {
		// Should have been caught by loading/error state or notFound()
		// This is a fallback, ideally not reached if notFound() works correctly
		return <p className='text-center text-muted-foreground py-10'>Venue data could not be loaded.</p>
	}

	// --- Venue Found - Render Details ---
	return (
		<div>
			{/* Breadcrumbs */}
			<Breadcrumb className='mb-6'>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href='/venues'>Venues</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{venue.name}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{/* Header Section */}
			<div className='flex flex-col md:flex-row gap-8 mb-8 items-start'>
				{/* Main Photo */}
				<div className='w-full md:w-1/2 lg:w-1/3 aspect-video relative rounded-lg overflow-hidden'>
					<Image
						src={venue.mainPhotoUrl || '/placeholder-venue.svg'} // Reuse placeholder
						alt={`Main photo of ${venue.name}`}
						layout='fill'
						objectFit='cover'
						priority // Prioritize loading main image on details page
					/>
				</div>

				{/* Info & Actions */}
				<div className='flex-1'>
					<div className='flex justify-between items-start mb-2'>
						<h1 className='text-3xl font-bold'>{venue.name}</h1>
						{/* Actions Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='h-8 w-8 p-0'>
									<span className='sr-only'>Open menu</span>
									<MoreHorizontal className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem onClick={handleEdit}>Edit Venue</DropdownMenuItem>
								<DropdownMenuItem onClick={handleTransferOwnership}>Transfer Ownership</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className='text-red-600 focus:text-red-700 focus:bg-red-50' onClick={handleDelete}>
									Delete Venue
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<p className='text-lg text-muted-foreground mb-4'>{venue.address}</p>
					{/* Add more header details if needed: rating, category badge, etc. */}
					{venue.description && <p className='text-muted-foreground'>{venue.description}</p>}
				</div>
			</div>

			{/* Tabs Section - Use activeTab state and handle changes */}
			<Tabs
				value={activeTab} // Control the active tab using state
				onValueChange={handleTabChange} // Update state and localStorage on change
				className='w-full'>
				<TabsList className='mb-4'>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='photos'>Photos</TabsTrigger>
					<TabsTrigger value='products'>Products</TabsTrigger>
					<TabsTrigger value='tables'>Tables</TabsTrigger> {/* Add Tables tab */}
					{/* Add more tabs as needed: Settings, Staff, Events etc. */}
					<TabsTrigger value='settings' disabled>
						Settings
					</TabsTrigger>
				</TabsList>

				<TabsContent value='overview'>
					<div className='p-4 border rounded-lg bg-card text-card-foreground'>
						<h3 className='text-xl font-semibold mb-4'>Details</h3>
						<p>
							<strong>Category:</strong> {venue.category?.name || 'N/A'} {/* Display category name */}
						</p>
						<p>
							<strong>Phone:</strong> {venue.phone || 'N/A'}
						</p>
						<p>
							<strong>Website:</strong>{' '}
							{venue.website ? (
								<a href={venue.website} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:underline'>
									{venue.website}
								</a>
							) : (
								'N/A'
							)}
						</p>
						<p>
							<strong>Rating:</strong> {venue.rating ? `${venue.rating.toFixed(1)} ⭐` : 'Not Rated'}
						</p>
						{/* Add more details here - opening hours, map, amenities etc. */}
					</div>
				</TabsContent>

				<TabsContent value='photos'>
					<div className='p-4 border rounded-lg bg-card text-card-foreground'>
						<VenuePhotoGallery photos={venue.photos} />
					</div>
				</TabsContent>

				<TabsContent value='settings'>
					<div className='p-4 border rounded-lg bg-card text-card-foreground'>
						<h3 className='text-xl font-semibold mb-4'>Venue Settings</h3>
						<p className='text-muted-foreground'>Settings management will be implemented here.</p>
					</div>
				</TabsContent>

				{/* Products Tab Content */}
				<TabsContent value='products'>
					<div className='p-4 border rounded-lg bg-card text-card-foreground'>
						{/* Render the ProductList component, passing the venueId */}
						<ProductList venueId={venue.id} />
					</div>
				</TabsContent>

				<TabsContent value='settings'>
					<div className='p-4 border rounded-lg bg-card text-card-foreground'>
						<h3 className='text-xl font-semibold mb-4'>Venue Settings</h3>
						<p className='text-muted-foreground'>Settings management will be implemented here.</p>
					</div>
				</TabsContent>

				{/* Tables Tab Content */}
				<TabsContent value='tables'>
					{/* Render the new TableManagementLayout component */}
					<TableManagementLayout venueId={venue.id} />
				</TabsContent>

				<TabsContent value='settings'>
					<div className='p-4 border rounded-lg bg-card text-card-foreground'>
						<h3 className='text-xl font-semibold mb-4'>Venue Settings</h3>
						<p className='text-muted-foreground'>Settings management will be implemented here.</p>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
