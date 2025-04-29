// next/src/components/venues/events/DeleteEventDialog.tsx
'use client'

import React from 'react'
import {toast} from 'sonner'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
// Removed unused Button import
import venueService from '@/services/venueService'
import {Event} from '@/types/event'

interface DeleteEventDialogProps {
	event: Event | null // Event to delete, null if dialog shouldn't be shown
	isOpen: boolean
	onClose: () => void
	onEventDeleted: (eventId: string) => void // Callback after successful deletion
}

const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({event, isOpen, onClose, onEventDeleted}) => {
	const [isDeleting, setIsDeleting] = React.useState(false)

	const handleDelete = async () => {
		if (!event) return

		setIsDeleting(true)
		try {
			await venueService.deleteEvent(event.id)
			toast.success(`Event "${event.name}" deleted successfully.`)
			onEventDeleted(event.id) // Notify parent
			onClose() // Close dialog
		} catch (error) {
			console.error('Failed to delete event:', error)
			toast.error(`Failed to delete event "${event.name}". Please try again.`)
		} finally {
			setIsDeleting(false)
		}
	}

	if (!event) return null // Don't render if no event selected

	return (
		<AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>{`This action cannot be undone. This will permanently delete the event "${event.name}".`}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onClose} disabled={isDeleting}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Continue'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default DeleteEventDialog
