// next/src/app/(protected)/venues/page.tsx
import React from 'react'
import VenueList from '@/components/venues/VenueList' // Assuming VenueList component will be created later
import {Button} from '@/components/ui/button' // Assuming shadcn/ui Button
import Link from 'next/link'

export default function VenuesPage() {
	return (
		<div className='container mx-auto py-8'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>Venues</h1>
				<Button asChild>
					<Link href='/venues/new'>Create New Venue</Link>
				</Button>
			</div>
			{/* We'll add search and filters here later */}
			<VenueList />
		</div>
	)
}
