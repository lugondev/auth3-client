'use client'

import React, {useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, CreateTableDTO, UpdateTableDTO, TableStatus} from '@/types/table'
import {useCreateTable, useUpdateTable} from '@/features/venues/tables/hooks'

// Zod schema for validation
const tableFormSchema = z.object({
	name: z.string().min(1, 'Table name is required'),
	capacity: z.coerce.number().int().positive('Capacity must be a positive number'), // Coerce to number
	status: z.nativeEnum(TableStatus),
	groupId: z.string().uuid('Invalid Group ID format').optional().nullable(), // Optional UUID
})

type TableFormValues = z.infer<typeof tableFormSchema>

interface TableFormProps {
	venueId: string
	initialData?: Table | null // For editing
	onSuccess: () => void // Callback after successful submission
}

const TableForm: React.FC<TableFormProps> = ({venueId, initialData, onSuccess}) => {
	const isEditMode = !!initialData

	const form = useForm<TableFormValues>({
		resolver: zodResolver(tableFormSchema),
		defaultValues: {
			name: initialData?.name || '',
			capacity: initialData?.capacity || 0,
			status: initialData?.status || TableStatus.AVAILABLE,
			groupId: initialData?.groupId || null,
		},
	})

	// Reset form if initialData changes (e.g., opening edit modal for different table)
	useEffect(() => {
		if (initialData) {
			form.reset({
				name: initialData.name,
				capacity: initialData.capacity,
				status: initialData.status,
				groupId: initialData.groupId || null,
			})
		} else {
			form.reset({
				// Reset to defaults for create mode
				name: '',
				capacity: 0,
				status: TableStatus.AVAILABLE,
				groupId: null,
			})
		}
	}, [initialData, form])

	const createTableMutation = useCreateTable({
		onSuccess: () => {
			form.reset() // Reset form on success
			onSuccess() // Call the callback
		},
		// onError handled by hook's default toast
	})

	const updateTableMutation = useUpdateTable({
		onSuccess: () => {
			// Don't reset form here, keep modal open or let parent handle closing
			onSuccess() // Call the callback
		},
		// onError handled by hook's default toast
	})

	const onSubmit = (values: TableFormValues) => {
		const dataPayload = {
			...values,
			// Ensure groupId is sent as null if empty string or undefined, matching backend expectation if nullable
			groupId: values.groupId === '' ? null : values.groupId,
		}

		if (isEditMode && initialData) {
			updateTableMutation.mutate({
				tableId: initialData.id,
				data: dataPayload as UpdateTableDTO, // Cast might be needed if types differ slightly
				venueId: venueId, // Pass venueId for query invalidation
			})
		} else {
			createTableMutation.mutate({
				venueId: venueId,
				data: dataPayload as CreateTableDTO, // Cast might be needed
			})
		}
	}

	const isLoading = createTableMutation.isPending || updateTableMutation.isPending

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
				<FormField
					control={form.control}
					name='name'
					render={({field}) => (
						<FormItem>
							<FormLabel>Table Name</FormLabel>
							<FormControl>
								<Input placeholder='e.g., T1, Window Booth' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='capacity'
					render={({field}) => (
						<FormItem>
							<FormLabel>Capacity</FormLabel>
							<FormControl>
								<Input type='number' placeholder='e.g., 4' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='status'
					render={({field}) => (
						<FormItem>
							<FormLabel>Status</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder='Select status' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(TableStatus).map((status) => (
										<SelectItem key={status} value={status}>
											{status.charAt(0).toUpperCase() + status.slice(1)} {/* Capitalize */}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='groupId'
					render={({field}) => (
						<FormItem>
							<FormLabel>Group / Zone (Optional)</FormLabel>
							<FormControl>
								{/* TODO: Replace with a Select dropdown populated with actual groups/zones for the venue */}
								<Input placeholder='Enter Group ID (UUID)' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type='submit' disabled={isLoading}>
					{isLoading ? 'Saving...' : isEditMode ? 'Update Table' : 'Create Table'}
				</Button>
			</form>
		</Form>
	)
}

export default TableForm
