// next/src/components/venues/events/EventForm.tsx
'use client'

import React from 'react' // Removed useState, useEffect
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {format} from 'date-fns'
import {CalendarIcon, Loader2} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
// Removed Label import
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Calendar} from '@/components/ui/calendar' // Assuming Calendar is installed
import {cn} from '@/lib/utils'
import {Event, EventCategory, EventStatus, CreateEventDto, UpdateEventDto} from '@/types/event'

// Zod schema for validation
const eventFormSchema = z
	.object({
		name: z.string().min(3, {message: 'Event name must be at least 3 characters.'}),
		description: z.string().optional(),
		startTime: z.date({required_error: 'Start date and time are required.'}),
		endTime: z.date({required_error: 'End date and time are required.'}),
		// Make numbers and boolean optional (undefined), not nullable
		capacity: z.number().positive().optional(),
		ticketPrice: z.number().positive().optional(),
		category: z.nativeEnum(EventCategory),
		status: z.nativeEnum(EventStatus),
		isFeatured: z.boolean().optional(), // Optional, no default in schema
		// recurringSettings: // Add later if needed
	})
	.refine((data) => data.endTime >= data.startTime, {
		message: 'End time cannot be earlier than start time.',
		path: ['endTime'], // Attach error to endTime field
	})

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormProps {
	venueId: string
	event?: Event // Optional: For editing existing event
	onSubmit: (data: CreateEventDto | UpdateEventDto) => Promise<void>
	onCancel: () => void
	isLoading: boolean
}

const EventForm: React.FC<EventFormProps> = ({venueId, event, onSubmit, onCancel, isLoading}) => {
	// Restore the resolver
	const form = useForm<EventFormValues>({
		resolver: zodResolver(eventFormSchema),
		// Explicitly define defaultValues matching the schema structure
		defaultValues: event
			? {
					name: event.name,
					description: event.description || '',
					startTime: new Date(event.startTime),
					endTime: new Date(event.endTime),
					capacity: event.capacity ?? undefined, // Match optional schema (undefined)
					ticketPrice: event.ticketPrice ?? undefined, // Match optional schema (undefined)
					category: event.category,
					status: event.status,
					isFeatured: event.isFeatured ?? false, // Provide default false if null/undefined from API
			  }
			: {
					name: '',
					description: '', // Keep empty string for optional string
					startTime: new Date(),
					endTime: new Date(),
					capacity: undefined, // Default optional number to undefined
					ticketPrice: undefined, // Default optional number to undefined
					category: EventCategory.Other,
					status: EventStatus.Draft,
					isFeatured: false, // Explicit default for new form state
			  },
	})

	// Restore original handleSubmit
	const handleSubmit = async (values: EventFormValues) => {
		const dto: CreateEventDto | UpdateEventDto = {
			...values,
			// Convert dates to ISO strings
			startTime: values.startTime.toISOString(),
			endTime: values.endTime.toISOString(),
			// Convert undefined numbers to null for API, handle boolean
			capacity: values.capacity ?? null,
			ticketPrice: values.ticketPrice ?? null,
			isFeatured: values.isFeatured ?? false, // Ensure boolean is sent
			// Add venueId for creation
			...(!event && {venueId: venueId}),
		}
		await onSubmit(dto)
	}

	// Remove dummy submit handler (or keep commented out)
	// const handleDummySubmit = (data: EventFormValues) => { // Use correct type
	// 	console.log('Dummy submit (validation skipped), data:', data)
	// }

	return (
        <Form {...form}>
            {/* Use original submit handler */}
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
				{/* Name */}
				<FormField
					control={form.control}
					name='name'
					render={({field}) => (
						<FormItem>
							<FormLabel>Event Name *</FormLabel>
							<FormControl>
								<Input placeholder='e.g., Summer Music Festival' {...field} />
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
								<Textarea placeholder='Describe the event...' {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Start Time */}
					<FormField
						control={form.control}
						name='startTime'
						render={({field}) => (
							<FormItem className='flex flex-col'>
								<FormLabel>Start Time *</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
												{field.value ? (
													(format(field.value, 'PPP HH:mm')) // Format includes time
												) : (
													<span>Pick a date and time</span>
												)}
												<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className='w-auto p-0' align='start'>
										<Calendar
											mode='single'
											selected={field.value}
											onSelect={field.onChange}
											disabled={
												(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) // Disable past dates
											}
											initialFocus
										/>
										{/* Basic Time Input - Consider a dedicated Time Picker component */}
										<div className='p-2 border-t'>
											<Input
												type='time'
												defaultValue={field.value ? format(field.value, 'HH:mm') : '00:00'}
												onChange={(e) => {
													const [hours, minutes] = e.target.value.split(':').map(Number)
													const newDate = new Date(field.value)
													newDate.setHours(hours, minutes)
													field.onChange(newDate)
												}}
											/>
										</div>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* End Time */}
					<FormField
						control={form.control}
						name='endTime'
						render={({field}) => (
							<FormItem className='flex flex-col'>
								<FormLabel>End Time *</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
												{field.value ? (
													(format(field.value, 'PPP HH:mm')) // Format includes time
												) : (
													<span>Pick a date and time</span>
												)}
												<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className='w-auto p-0' align='start'>
										<Calendar
											mode='single'
											selected={field.value}
											onSelect={field.onChange}
											disabled={
												(date) => date < (form.getValues('startTime') || new Date(new Date().setHours(0, 0, 0, 0))) // Disable dates before start time
											}
											initialFocus
										/>
										{/* Basic Time Input */}
										<div className='p-2 border-t'>
											<Input
												type='time'
												defaultValue={field.value ? format(field.value, 'HH:mm') : '00:00'}
												onChange={(e) => {
													const [hours, minutes] = e.target.value.split(':').map(Number)
													const newDate = new Date(field.value)
													newDate.setHours(hours, minutes)
													field.onChange(newDate)
												}}
											/>
										</div>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Capacity */}
					<FormField
						control={form.control}
						name='capacity'
						render={({field}) => (
							<FormItem>
								<FormLabel>Capacity</FormLabel>
								<FormControl>
									{/* Adjust onChange to pass number or undefined */}
									<Input type='number' placeholder='e.g., 500' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
								</FormControl>
								<FormDescription>Maximum number of attendees (optional).</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Ticket Price */}
					<FormField
						control={form.control}
						name='ticketPrice'
						render={({field}) => (
							<FormItem>
								<FormLabel>Ticket Price ($)</FormLabel>
								<FormControl>
									{/* Adjust onChange to pass number or undefined */}
									<Input type='number' step='0.01' placeholder='e.g., 25.50' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
								</FormControl>
								<FormDescription>Price per ticket (optional).</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Category */}
					<FormField
						control={form.control}
						name='category'
						render={({field}) => (
							<FormItem>
								<FormLabel>Category *</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select event category' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(EventCategory).map((category) => (
											<SelectItem key={category} value={category}>
												{category.charAt(0).toUpperCase() + category.slice(1)} {/* Capitalize */}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
											<SelectValue placeholder='Select event status' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(EventStatus).map((status) => (
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
				</div>

				{/* Is Featured */}
				<FormField
					control={form.control}
					name='isFeatured'
					render={({field}) => (
						<FormItem className='flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow'>
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className='space-y-1 leading-none'>
								<FormLabel>Feature this event?</FormLabel>
								<FormDescription>Featured events may be highlighted on the venue page.</FormDescription>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Action Buttons */}
				<div className='flex justify-end gap-2'>
					<Button type='button' variant='outline' onClick={onCancel} disabled={isLoading}>
						Cancel
					</Button>
					<Button type='submit' disabled={isLoading}>
						{isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
						{event ? 'Save Changes' : 'Create Event'}
					</Button>
				</div>
			</form>
        </Form>
    );
}

export default EventForm
