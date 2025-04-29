// next/src/components/venues/tables/TableForm.tsx
'use client'

import React from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
// Removed unused TableType, TableStatus imports
import {VenueTable, CreateTableDto, UpdateTableDto, tableTypes, tableStatuses} from '@/types/venue'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {capitalize} from '@/lib/utils' // Assuming capitalize exists in utils

// Validation Schema
// status is required on create, optional on update, but we need it in the form always.
// Let's make a schema suitable for the form, onSubmit can handle DTO conversion.
const tableFormSchema = z.object({
	name: z.string().min(2, {message: 'Table name must be at least 2 characters.'}).max(50),
	capacity: z.coerce // Use coerce for number inputs from string
		.number({invalid_type_error: 'Capacity must be a number.'})
		.int()
		.positive({message: 'Capacity must be a positive number.'})
		.min(1, {message: 'Capacity must be at least 1.'}),
	type: z.enum(tableTypes, {required_error: 'Table type is required.'}),
	location: z.string().max(100).optional().or(z.literal('')), // Allow empty string
	status: z.enum(tableStatuses, {required_error: 'Status is required.'}),
	minSpend: z.coerce // Coerce optional number
		.number({invalid_type_error: 'Minimum spend must be a number.'})
		.nonnegative({message: 'Minimum spend cannot be negative.'})
		.optional(),
	description: z.string().max(255).optional().or(z.literal('')), // Allow empty string
})

export type TableFormData = z.infer<typeof tableFormSchema>

interface TableFormProps {
	initialData?: VenueTable // Provided when editing
	onSubmit: (data: CreateTableDto | UpdateTableDto) => Promise<void> // Handles API call
	isSubmitting: boolean // To disable button during submission
	onCancel?: () => void // Optional cancel handler
}

export function TableForm({initialData, onSubmit, isSubmitting, onCancel}: TableFormProps) {
	const form = useForm<TableFormData>({
		resolver: zodResolver(tableFormSchema),
		defaultValues: {
			name: initialData?.name || '',
			capacity: initialData?.capacity || 1,
			type: initialData?.type || tableTypes[0], // Default to first type
			location: initialData?.location || '',
			status: initialData?.status || tableStatuses[0], // Default to first status
			minSpend: initialData?.minSpend || undefined, // Ensure undefined for optional number
			description: initialData?.description || '',
		},
	})

	const handleFormSubmit = async (values: TableFormData) => {
		// Clean up optional fields that might be empty strings
		const dataToSubmit = {
			...values,
			location: values.location?.trim() || undefined, // Use undefined if empty
			description: values.description?.trim() || undefined, // Use undefined if empty
			// minSpend is already handled correctly by zod schema (number | undefined)
		}
		await onSubmit(dataToSubmit)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4'>
				{/* Name */}
				<FormField
					control={form.control}
					name='name'
					render={({field}) => (
						<FormItem>
							<FormLabel>Table Name *</FormLabel>
							<FormControl>
								<Input placeholder='e.g., Table 10, Patio Booth' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Capacity */}
				<FormField
					control={form.control}
					name='capacity'
					render={({field}) => (
						<FormItem>
							<FormLabel>Capacity *</FormLabel>
							<FormControl>
								<Input type='number' min='1' placeholder='e.g., 4' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Type */}
				<FormField
					control={form.control}
					name='type'
					render={({field}) => (
						<FormItem>
							<FormLabel>Type *</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder='Select table type' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{tableTypes.map((type) => (
										<SelectItem key={type} value={type}>
											{capitalize(type)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Location */}
				<FormField
					control={form.control}
					name='location'
					render={({field}) => (
						<FormItem>
							<FormLabel>Location</FormLabel>
							<FormControl>
								<Input placeholder='e.g., Main Dining, Patio, Bar Area' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Status */}
				<FormField
					control={form.control}
					name='status'
					render={({field}) => (
						<FormItem>
							<FormLabel>Status *</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder='Select current status' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{tableStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{capitalize(status)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Minimum Spend */}
				<FormField
					control={form.control}
					name='minSpend'
					render={({field}) => (
						<FormItem>
							<FormLabel>Minimum Spend ($)</FormLabel>
							<FormControl>
								{/* Ensure value is handled correctly for optional number */}
								<Input
									type='number'
									min='0'
									step='0.01'
									placeholder='e.g., 50.00'
									{...field}
									value={field.value ?? ''} // Use empty string if undefined
									onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Description */}
				<FormField
					control={form.control}
					name='description'
					render={({field}) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder='Optional notes about the table (e.g., near window, requires reservation)' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className='flex justify-end space-x-2 pt-4'>
					{onCancel && (
						<Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
							Cancel
						</Button>
					)}
					<Button type='submit' disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Table'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
