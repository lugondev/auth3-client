// next/src/components/venues/VenueCard.tsx
import React from 'react'
import Image from 'next/image' // Using Next.js Image component
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card' // Assuming shadcn/ui Card

// Define the structure of a Venue based on API response/domain models
// This might need adjustment based on the actual API response in venueService.ts later
// Or ideally, we'd have shared types, maybe in next/src/types/venue.ts
export interface Venue {
	id: string
	name: string
	address: string // Assuming a simple string address for now
	mainPhotoUrl?: string // Optional main photo URL from API
	rating?: number // Optional rating
	// Add other relevant fields if needed from the API spec
}

interface VenueCardProps {
	venue: Venue
}

const VenueCard: React.FC<VenueCardProps> = ({venue}) => {
	return (
		<Card className='overflow-hidden transition-shadow hover:shadow-lg'>
			<CardHeader className='p-0 relative h-48'>
				{/* Using Next.js Image for optimization */}
				<Image
					src={venue.mainPhotoUrl || '/placeholder-venue.svg'} // Provide a fallback image path
					alt={`Photo of ${venue.name}`}
					layout='fill'
					objectFit='cover'
					className='rounded-t-lg'
					priority={false} // Lower priority for list images
				/>
			</CardHeader>
			<CardContent className='p-4'>
				<CardTitle className='text-lg font-semibold mb-1 truncate'>{venue.name}</CardTitle>
				<p className='text-sm text-muted-foreground mb-2 truncate'>{venue.address}</p>
				{/* Display Rating if available */}
				{venue.rating !== undefined && venue.rating !== null && (
					<div className='flex items-center text-sm'>
						{/* Simple star rating display - could be enhanced */}
						<span className='text-yellow-500 mr-1' aria-hidden='true'>
							⭐
						</span>
						<span className='text-muted-foreground'>{venue.rating.toFixed(1)}</span>
					</div>
				)}
			</CardContent>
			{/* Link to details page can be added here or by wrapping the whole card */}
		</Card>
	)
}

export default VenueCard
