// next/src/components/venues/tables/DeleteTableDialog.tsx
'use client'

import React, {useState, useEffect} from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	// AlertDialogTrigger, // Trigger handled externally
} from '@/components/ui/alert-dialog'
// import {Button} from '@/components/ui/button'; // Removed unused import
import venueService from '@/services/venueService'
import {toast} from 'sonner'

interface DeleteTableDialogProps {
	tableId: string | null // ID of the table to delete, null when closed
	tableName: string | null // Name for display in confirmation
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void // Callback after successful deletion to refresh list
}

export function DeleteTableDialog({tableId, tableName, open, onOpenChange, onSuccess}: DeleteTableDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false)

	// Reset deleting state when dialog closes or table changes
	useEffect(() => {
		if (!open) {
			setIsDeleting(false)
		}
	}, [open])

	const handleDelete = async () => {
		if (!tableId) return

		setIsDeleting(true)
		try {
			await venueService.deleteTable(tableId)
			toast.success(`Table "${tableName || 'ID: ' + tableId}" deleted successfully!`)
			onSuccess() // Refresh list
			onOpenChange(false) // Close dialog
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
			console.error(`Failed to delete table ${tableId}:`, error)
			toast.error(`Failed to delete table: ${errorMessage}`)
			// Keep dialog open on error
		} finally {
			// Only set isDeleting false if dialog is still intended to be open (e.g., on error)
			// If success, the useEffect hook handles it when `open` changes to false.
			// However, setting it here is generally safe.
			setIsDeleting(false)
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the table
						<strong className='px-1'>{tableName || 'this table'}</strong>
						and remove its data from the servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>
						Cancel
					</AlertDialogCancel>
					{/* Use onClick for the action */}
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault() // Prevent default dialog closing behavior if API call fails
							handleDelete()
						}}
						disabled={isDeleting}
						// Optional: Add custom styling via className if needed, Shadcn applies some defaults
						// className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? 'Deleting...' : 'Yes, delete table'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
