'use client'

import React, {useEffect, useState} from 'react'
import apiClient, {Venue, PaginatedVenues} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
// Import table components if you plan to use shadcn/ui table
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function VenuesPage() {
	const [venues, setVenues] = useState<Venue[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	// Add state for pagination if needed

	useEffect(() => {
		const fetchVenues = async () => {
			setLoading(true)
			setError(null)
			try {
				// Example: Using search endpoint - adjust query as needed
				const response = await apiClient.get<PaginatedVenues>('/venues/search', {
					params: {page: 1, limit: 20}, // Example pagination
				})
				// Note: The Go API returns 'total_count', adjust if needed based on actual response structure
				setVenues(response.data.venues)
			} catch (err: unknown) {
				let message = 'Failed to fetch venues'
				if (err instanceof Error) {
					message = err.message
				} else if (typeof err === 'string') {
					message = err
				}
				setError(message)
				console.error(err)
			} finally {
				setLoading(false)
			}
		}

		fetchVenues()
	}, [])

	return (
		<div className='p-6'>
			<Card>
				<CardHeader className='flex flex-row items-center justify-between'>
					<CardTitle>Venue Management</CardTitle>
					<Button>Add Venue</Button> {/* Add functionality later */}
				</CardHeader>
				<CardContent>
					{loading && <p>Loading venues...</p>}
					{error && <p className='text-red-500'>Error: {error}</p>}
					{!loading && !error && (
						<div>
							{/* Placeholder for venue list/table */}
							{venues.length > 0 ? (
								<ul>
									{venues.map((venue) => (
										<li key={venue.id}>
											{venue.name} {venue.address ? `- ${venue.address}` : ''}
										</li>
									))}
								</ul>
							) : (
								<p>No venues found.</p>
							)}
							{/* TODO: Implement a proper table using shadcn/ui Table */}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
