// next/src/components/venues/tables/AddTableDialog.tsx
'use client'

import React, {useState} from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	// DialogFooter, // Footer buttons are handled by TableForm
	// DialogTrigger, // Removed unused import
} from '@/components/ui/dialog'
// import {Button} from '@/components/ui/button'; // Removed unused import
import {TableForm, TableFormData} from './TableForm'
import venueService from '@/services/venueService'
import {CreateTableDto, UpdateTableDto} from '@/types/venue' // Import UpdateTableDto for casting
import {toast} from 'sonner'

interface AddTableDialogProps {
	venueId: string
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void // Callback after successful creation to refresh list
}

export function AddTableDialog({venueId, open, onOpenChange, onSuccess}: AddTableDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleAddTable = async (data: TableFormData) => {
		setIsSubmitting(true)
		try {
			const createDto: CreateTableDto = {
				...data,
				// Capacity is already a number due to zod coerce
			}
			await venueService.createTable(venueId, createDto)
			toast.success('Table created successfully!')
			onSuccess() // Trigger refresh
			onOpenChange(false) // Close dialog
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
			console.error('Failed to create table:', error)
			toast.error(`Failed to create table: ${errorMessage}`)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* Trigger is usually outside, but can be passed as child */}
			{/* <DialogTrigger asChild><Button>Add Table</Button></DialogTrigger> */}
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add New Table</DialogTitle>
					<DialogDescription>Enter the details for the new table. Click save when done.</DialogDescription>
				</DialogHeader>
				<div className='py-4'>
					<TableForm
						// Cast handleAddTable to satisfy the prop type.
						// In the 'add' context, the data passed will match CreateTableDto structure after validation.
						onSubmit={handleAddTable as (data: CreateTableDto | UpdateTableDto) => Promise<void>}
						isSubmitting={isSubmitting}
						onCancel={() => onOpenChange(false)} // Add cancel handler to form
					/>
				</div>
				{/* DialogFooter might be redundant if form handles buttons */}
				{/* <DialogFooter>
					<Button type="submit" form="table-form-id">Save changes</Button>
				</DialogFooter> */}
			</DialogContent>
		</Dialog>
	)
}
