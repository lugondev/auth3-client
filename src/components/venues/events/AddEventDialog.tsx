// next/src/components/venues/events/AddEventDialog.tsx
'use client'

import React, {useState} from 'react'
import {toast} from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	// Removed unused DialogFooter
} from '@/components/ui/dialog'
import EventForm from './EventForm'
import venueService from '@/services/venueService'
import {Event, CreateEventDto, UpdateEventDto} from '@/types/event' // Import UpdateEventDto

interface AddEventDialogProps {
	isOpen: boolean
	onClose: () => void
	venueId: string
	onEventAdded: (newEvent: Event) => void // Callback after successful addition
}

const AddEventDialog: React.FC<AddEventDialogProps> = ({isOpen, onClose, venueId, onEventAdded}) => {
	const [isLoading, setIsLoading] = useState(false)

	// Use the correct union type expected by the form's onSubmit prop
	const handleCreateEvent = async (data: CreateEventDto | UpdateEventDto) => {
		setIsLoading(true)
		try {
			// Ensure venueId is included if not automatically added by form logic
			const payload = {...data, venueId}
			const newEvent = await venueService.createEvent(venueId, payload as CreateEventDto)
			toast.success('Event created successfully!')
			onEventAdded(newEvent) // Notify parent component
			onClose() // Close the dialog
		} catch (error) {
			console.error('Failed to create event:', error)
			toast.error('Failed to create event. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	// Handle initial mount/unmount behavior for form reset if needed,
	// but react-hook-form usually handles this well within the form itself.

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='sm:max-w-[600px]'>
				{' '}
				{/* Adjust width as needed */}
				<DialogHeader>
					<DialogTitle>Add New Event</DialogTitle>
					<DialogDescription>Fill in the details for the new event. Click create when you&#39;re done.</DialogDescription>
				</DialogHeader>
				<div className='py-4'>
					<EventForm
						venueId={venueId}
						onSubmit={handleCreateEvent}
						onCancel={onClose}
						isLoading={isLoading}
						// No 'event' prop is passed for creation
					/>
				</div>
				{/* Footer can be removed if form handles buttons */}
				{/* <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                     <Button type="submit" form="event-form-id">Create Event</Button> // Example if form needs external submit
                </DialogFooter> */}
			</DialogContent>
		</Dialog>
	)
}

export default AddEventDialog
