// next/src/components/venues/tables/EditTableDialog.tsx
'use client'

import React, {useState, useEffect} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog'
import {TableForm, TableFormData} from './TableForm'
import venueService from '@/services/venueService'
import {VenueTable, UpdateTableDto, CreateTableDto} from '@/types/venue' // Import CreateTableDto for casting
import {toast} from 'sonner'

interface EditTableDialogProps {
	table: VenueTable | null // Table data to edit, null when closed
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void // Callback after successful update to refresh list
}

export function EditTableDialog({table, open, onOpenChange, onSuccess}: EditTableDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Reset submitting state when dialog closes or table changes
	useEffect(() => {
		if (!open) {
			setIsSubmitting(false)
		}
	}, [open])

	const handleEditTable = async (data: TableFormData) => {
		if (!table) return // Should not happen if dialog is open with a table

		setIsSubmitting(true)
		try {
			// The data from TableForm already matches the structure needed for UpdateTableDto
			// (optional fields are handled by the form schema and submit handler)
			const updateDto: UpdateTableDto = data

			await venueService.updateTable(table.id, updateDto)
			toast.success(`Table "${table.name}" updated successfully!`)
			onSuccess() // Trigger refresh
			onOpenChange(false) // Close dialog
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
			console.error(`Failed to update table ${table.id}:`, error)
			toast.error(`Failed to update table: ${errorMessage}`)
		} finally {
			setIsSubmitting(false)
		}
	}

	// Ensure the form is only rendered when there's a table object
	if (!table) {
		return null
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Edit Table: {table.name}</DialogTitle>
					<DialogDescription>Modify the details for this table. Click save when done.</DialogDescription>
				</DialogHeader>
				<div className='py-4'>
					{/* Pass initialData to the form */}
					<TableForm
						initialData={table}
						// Cast handleEditTable to satisfy the prop type.
						onSubmit={handleEditTable as (data: CreateTableDto | UpdateTableDto) => Promise<void>}
						isSubmitting={isSubmitting}
						onCancel={() => onOpenChange(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
