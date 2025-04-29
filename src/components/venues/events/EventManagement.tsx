// next/src/components/venues/events/EventManagement.tsx
'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {PlusIcon} from 'lucide-react'
import {toast} from 'sonner' // Import sonner
import {Button} from '@/components/ui/button'
// Remove useToast import
import venueService from '@/services/venueService'
import {Event} from '@/types/event'
// Import child components once created
import EventList from './EventList'
import AddEventDialog from './AddEventDialog'
import EditEventDialog from './EditEventDialog' // Import Edit Dialog
// import EventCalendarView from './EventCalendarView'; // Placeholder

interface EventManagementProps {
	venueId: string
}

const EventManagement: React.FC<EventManagementProps> = ({venueId}) => {
	const [events, setEvents] = useState<Event[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [editingEvent, setEditingEvent] = useState<Event | null>(null) // State for event being edited
	const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list') // Default view

	// Remove useToast hook

	const fetchEvents = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const fetchedEvents = await venueService.getVenueEvents(venueId)
			setEvents(fetchedEvents)
		} catch (err) {
			console.error('Error fetching events:', err)
			setError('Failed to load events. Please try again.')
			// Use sonner toast for error
			toast.error('Failed to load events.')
		} finally {
			setIsLoading(false)
		}
	}, [venueId, toast])

	useEffect(() => {
		if (venueId) {
			fetchEvents()
		}
	}, [venueId, fetchEvents])

	const handleEventAdded = (newEvent: Event) => {
		setEvents((prev) => [newEvent, ...prev]) // Add to the top or sort as needed
		fetchEvents() // Re-fetch to ensure consistency, or update state locally
	}

	const handleEventUpdated = (updatedEvent: Event) => {
		setEvents((prev) => prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
		fetchEvents() // Re-fetch or update state locally
	}

	const handleEventDeleted = (eventId: string) => {
		setEvents((prev) => prev.filter((event) => event.id !== eventId))
		// Use sonner toast for success
		toast.success('Event deleted successfully.')
	}

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h2 className='text-2xl font-semibold tracking-tight'>Event Management</h2>
				<div className='flex items-center space-x-2'>
					{/* View Toggle Buttons */}
					<Button variant={viewMode === 'list' ? 'default' : 'outline'} size='sm' onClick={() => setViewMode('list')}>
						List
					</Button>
					<Button variant={viewMode === 'calendar' ? 'default' : 'outline'} size='sm' onClick={() => setViewMode('calendar')}>
						Calendar
					</Button>
					{/* Add Event Button */}
					<Button onClick={() => setIsAddDialogOpen(true)} size='sm'>
						<PlusIcon className='mr-2 h-4 w-4' /> Add Event
					</Button>
				</div>
			</div>

			{isLoading && <p>Loading events...</p>}
			{error && <p className='text-red-500'>{error}</p>}

			{!isLoading && !error && (
				<>
					{/* Conditional Rendering based on viewMode */}
					{viewMode === 'list' ? (
						<EventList
							events={events}
							venueId={venueId}
							// Update onEdit to set the event to be edited
							onEdit={(event) => setEditingEvent(event)}
							onDelete={handleEventDeleted} // Pass the delete handler
						/>
					) : (
						// <EventCalendarView events={events} /> // Placeholder for calendar view
						<p>Calendar View Placeholder</p>
					)}
					{/* Remove placeholder paragraph */}
				</>
			)}

			{/* Dialogs */}
			{/* Uncomment AddEventDialog */}
			<AddEventDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} venueId={venueId} onEventAdded={handleEventAdded} />
			{/* Remove placeholder paragraph */}
			{/* {isAddDialogOpen && <p>Add Event Dialog would open here.</p>} */}

			{/* Render EditEventDialog */}
			<EditEventDialog
				event={editingEvent}
				isOpen={!!editingEvent} // Open if editingEvent is not null
				onClose={() => setEditingEvent(null)} // Close by setting editingEvent to null
				venueId={venueId}
				onEventUpdated={handleEventUpdated} // Pass update handler
			/>
		</div>
	)
}

export default EventManagement
