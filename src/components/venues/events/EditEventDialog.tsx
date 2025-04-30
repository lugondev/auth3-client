// next/src/components/venues/events/EditEventDialog.tsx
'use client'

import React, {useState} from 'react' // Removed useEffect import
import {toast} from 'sonner'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import EventForm from './EventForm'
import venueService from '@/services/venueService'
import {Event, UpdateEventDto, CreateEventDto} from '@/types/event' // Need both DTOs for the form prop type

interface EditEventDialogProps {
	event: Event | null // Event to edit, or null to close/hide dialog
	isOpen: boolean
	onClose: () => void
	venueId: string // Needed for context, though update API uses eventId directly
	onEventUpdated: (updatedEvent: Event) => void // Callback after successful update
}

const EditEventDialog: React.FC<EditEventDialogProps> = ({event, isOpen, onClose, venueId, onEventUpdated}) => {
	const [isLoading, setIsLoading] = useState(false)

	// Reset form state when the event prop changes (e.g., opening for a different event)
	// The form component itself handles defaultValues, but explicit key prop might be needed if form state persists unexpectedly.

	const handleUpdateEvent = async (data: CreateEventDto | UpdateEventDto) => {
		if (!event) return // Should not happen if dialog is open with an event

		setIsLoading(true)
		try {
			// Create the payload as UpdateEventDto first
			const payload: UpdateEventDto = {...data}
			// Safeguard: delete venueId if it exists on the data object
			if ('venueId' in payload) {
				delete payload.venueId // Use 'any' assertion here for the deletion
			}

			const updatedEvent = await venueService.updateEvent(event.id, payload)
			toast.success('Event updated successfully!')
			onEventUpdated(updatedEvent) // Notify parent component
			onClose() // Close the dialog
		} catch (error) {
			console.error('Failed to update event:', error)
			toast.error('Failed to update event. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	if (!event) return null // Don't render the dialog if no event is provided

	return (
        // Using isOpen prop to control visibility, onOpenChange handles closing via overlay click/esc
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[600px]'>
				{' '}
				{/* Adjust width */}
				<DialogHeader>
					<DialogTitle>Edit Event: {event.name}</DialogTitle>
					<DialogDescription>Update the details for this event. Click save when you&#39;re done.</DialogDescription>
				</DialogHeader>
				<div className='py-4'>
					{/* Pass the event data to the form */}
					{/* Add a key based on event.id to ensure form resets when a different event is edited */}
					<EventForm
						key={event.id} // Force re-mount and state reset when event changes
						venueId={venueId} // Still needed by form props, though not used in update payload
						event={event} // Pass the event data
						onSubmit={handleUpdateEvent}
						onCancel={onClose}
						isLoading={isLoading}
					/>
				</div>
			</DialogContent>
        </Dialog>
    );
}

export default EditEventDialog
