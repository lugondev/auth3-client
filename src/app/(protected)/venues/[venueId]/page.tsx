'use client'

import React from 'react'
import VenueDetails from '@/components/venues/VenueDetails' // Assuming VenueDetails component will be created later
import {notFound} from 'next/navigation' // For handling invalid IDs

interface VenueDetailsPageProps {
	params: {
		venueId: string
	}
}

export default function VenueDetailsPage({params}: VenueDetailsPageProps) {
	const {venueId} = params

	// Basic validation - ensure venueId looks like a plausible ID
	// More robust validation might be needed depending on ID format (e.g., UUID check)
	if (!venueId || typeof venueId !== 'string' || venueId.trim() === '') {
		console.error('Invalid venueId param:', venueId)
		notFound() // Use Next.js notFound helper
	}

	return (
		<div className='container mx-auto py-8'>
			{/* The VenueDetails component will handle fetching and displaying */}
			<VenueDetails venueId={venueId} />
		</div>
	)
}

// Optional: Add generateMetadata function if needed for SEO/title
// export async function generateMetadata({ params }: VenueDetailsPageProps): Promise<Metadata> {
//   try {
//     const venue = await venueService.getVenueById(params.venueId); // Fetch minimal data for title
//     return {
//       title: `${venue.name} | Venue Details`,
//       description: venue.description || `Details for ${venue.name}`,
//     };
//   } catch (error) {
//     console.error("Metadata generation failed for venue:", params.venueId, error);
//     return {
//       title: 'Venue Not Found',
//     };
//   }
// }
