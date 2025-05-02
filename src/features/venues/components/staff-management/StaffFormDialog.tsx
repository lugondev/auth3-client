import React, {useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription, // For permissions
} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Checkbox} from '@/components/ui/checkbox' // For permissions
import {VenueStaff, AddStaffInput, UpdateStaffInput, StaffRole, StaffStatus, StaffPermission} from '@/types/staff'

// Define Zod schema for validation
const staffFormSchema = z.object({
	userId: z.string().uuid().optional(), // Only for adding new staff, potentially via search
	email: z.string().email({message: 'Invalid email address'}), // For adding new staff by email
	role: z.enum(['owner', 'manager', 'staff', 'hostess', 'waiter', 'bartender']),
	status: z.enum(['active', 'inactive', 'pending']).optional(), // Only for editing
	permissions: z.array(z.string()).optional(), // Array of permission strings
})

type StaffFormValues = z.infer<typeof staffFormSchema>

interface StaffFormDialogProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (data: AddStaffInput | UpdateStaffInput, staffId?: string) => void
	initialData?: VenueStaff | null // For editing
	isLoading: boolean
	venueId: string // Needed for AddStaffInput
}

// TODO: Fetch/provide actual user list for selection if adding by UserID
// TODO: Refine permission selection UI (e.g., MultiSelect or grouped checkboxes)

const staffRoles: StaffRole[] = ['manager', 'staff', 'hostess', 'waiter', 'bartender'] // Exclude 'owner' usually
const staffStatuses: StaffStatus[] = ['active', 'inactive', 'pending']
const allPermissions: StaffPermission[] = ['manage_venue', 'manage_staff', 'manage_settings', 'manage_tables', 'manage_events', 'manage_products', 'manage_reservation', 'manage_orders', 'manage_promotions', 'view_reports', 'view_settings']

const StaffFormDialog: React.FC<StaffFormDialogProps> = ({isOpen, onClose, onSubmit, initialData, isLoading, venueId}) => {
	const isEditing = !!initialData

	const form = useForm<StaffFormValues>({
		resolver: zodResolver(staffFormSchema),
		defaultValues: {
			email: '',
			role: 'staff', // Default role
			permissions: [],
			status: 'active', // Default status
			// userId will be handled separately if needed
		},
	})

	useEffect(() => {
		if (initialData) {
			// TODO: Need a way to get the user's email if initialData only has user_id
			form.reset({
				email: initialData.email || '', // Assuming email is available on VenueStaff now
				role: initialData.role,
				status: initialData.status,
				permissions: initialData.permissions || [],
			})
		} else {
			form.reset({
				// Reset for adding new staff
				email: '',
				role: 'staff',
				permissions: [],
				status: 'active',
			})
		}
	}, [initialData, form])

	const handleFormSubmit = (values: StaffFormValues) => {
		if (isEditing && initialData) {
			const updateData: UpdateStaffInput = {
				role: values.role as StaffRole, // Cast is safe due to zod enum
				status: values.status as StaffStatus, // Cast is safe due to zod enum
				permissions: values.permissions as StaffPermission[], // Cast needed
			}
			onSubmit(updateData, initialData.id)
		} else {
			// TODO: Need to resolve email to user_id before submitting.
			// This requires an API call or a user search component.
			// For now, we'll structure the call assuming user_id is magically available
			// or we adapt the backend to accept email initially.
			// Let's assume for now we need user_id. We'll need a user search input.
			console.warn('Need to implement user search/selection to get user_id from email:', values.email)

			// Placeholder: AddStaffInput requires user_id. We don't have it from email yet.
			// This part needs refinement based on how users are selected/invited.
			const addData: AddStaffInput = {
				venue_id: venueId,
				user_id: 'placeholder-user-id', // MUST BE REPLACED by actual user ID
				role: values.role as StaffRole,
				permissions: values.permissions as StaffPermission[],
			}
			onSubmit(addData)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[525px]'>
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4'>
						{!isEditing && (
							<FormField
								control={form.control}
								name='email'
								render={({field}) => (
									<FormItem>
										<FormLabel>Staff Email</FormLabel>
										<FormControl>
											{/* TODO: Replace with a user search/select component */}
											<Input placeholder="Enter user's email to invite/add" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{isEditing &&
							initialData?.email && ( // Show email when editing, but disable it
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input value={initialData.email} disabled />
									</FormControl>
									<FormDescription>Email cannot be changed.</FormDescription>
								</FormItem>
							)}

						<FormField
							control={form.control}
							name='role'
							render={({field}) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select a role' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{staffRoles.map((role) => (
												<SelectItem key={role} value={role}>
													{role.charAt(0).toUpperCase() + role.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{isEditing && ( // Status only editable when editing
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
												{staffStatuses.map((status) => (
													<SelectItem key={status} value={status}>
														{status.charAt(0).toUpperCase() + status.slice(1)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Permissions Selection - Needs a better UI, using simple checkboxes for now */}
						<FormField
							control={form.control}
							name='permissions'
							render={() => (
								<FormItem>
									<div className='mb-4'>
										<FormLabel className='text-base'>Permissions</FormLabel>
										<FormDescription>Select the permissions for this staff member.</FormDescription>
									</div>
									<div className='grid grid-cols-2 gap-4'>
										{allPermissions.map((permission) => (
											<FormField
												key={permission}
												control={form.control}
												name='permissions'
												render={({field}) => {
													return (
														<FormItem key={permission} className='flex flex-row items-start space-x-3 space-y-0'>
															<FormControl>
																<Checkbox
																	checked={field.value?.includes(permission)}
																	onCheckedChange={(checked) => {
																		return checked ? field.onChange([...(field.value || []), permission]) : field.onChange((field.value || []).filter((value) => value !== permission))
																	}}
																/>
															</FormControl>
															<FormLabel className='font-normal'>{permission.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</FormLabel>
														</FormItem>
													)
												}}
											/>
										))}
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<DialogClose asChild>
								<Button type='button' variant='outline' onClick={onClose}>
									Cancel
								</Button>
							</DialogClose>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Staff'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

export default StaffFormDialog
