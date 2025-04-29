// next/src/components/venues/staff/RemoveStaffDialog.tsx
'use client'

import React, {useState} from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	// AlertDialogTrigger, // Unused
} from '@/components/ui/alert-dialog' // Use AlertDialog for confirmation
// import {Button} from '@/components/ui/button'; // Unused
import venueService from '@/services/venueService'
import {StaffMember} from '@/types/venue'
import {toast} from 'sonner'
import {Loader2, Trash2} from 'lucide-react'

interface RemoveStaffDialogProps {
	venueId: string
	staffMember: StaffMember
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onStaffRemoved: () => void // Callback after successful removal
}

export const RemoveStaffDialog: React.FC<RemoveStaffDialogProps> = ({venueId, staffMember, isOpen, onOpenChange, onStaffRemoved}) => {
	const [isDeleting, setIsDeleting] = useState(false)

	const handleRemove = async () => {
		if (!staffMember) return

		// Double-check: Prevent removing the owner
		if (staffMember.role === 'owner') {
			toast.error('Cannot Remove Owner', {
				description: 'Venue ownership must be transferred before the owner can be removed.',
			})
			onOpenChange(false) // Close dialog
			return
		}

		setIsDeleting(true)
		console.log(`Removing staff ${staffMember.id}`)
		try {
			await venueService.removeStaffMember(venueId, staffMember.id)
			toast.success('Staff Removed', {
				description: `${staffMember.name} (${staffMember.email}) has been removed from the venue.`,
			})
			onStaffRemoved() // Trigger callback to refresh list
			onOpenChange(false) // Explicitly close dialog on success
		} catch (err: unknown) {
			console.error('Failed to remove staff:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
			toast.error('Failed to Remove Staff', {
				description: errorMessage,
			})
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			{/* AlertDialogTrigger could be used elsewhere if needed */}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently remove{' '}
						<strong>
							{staffMember.name} ({staffMember.email})
						</strong>{' '}
						from the venue staff. Their access will be revoked immediately.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleRemove}
						disabled={isDeleting || staffMember.role === 'owner'} // Disable if deleting or if it's the owner
						className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
						{isDeleting ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' /> Removing...
							</>
						) : (
							<>
								<Trash2 className='mr-2 h-4 w-4' /> Remove Staff
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
