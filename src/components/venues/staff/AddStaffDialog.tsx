// next/src/components/venues/staff/AddStaffDialog.tsx
'use client'

import React, {useState} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	// DialogTrigger, // Unused
	DialogClose,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import venueService from '@/services/venueService'
import {staffRoles} from '@/types/venue' // Removed AddStaffDto, StaffRole
import {toast} from 'sonner'
import {Loader2} from 'lucide-react'

// Schema for the add staff form
const addStaffSchema = z.object({
	email: z.string().email('Invalid email address'),
	role: z.enum(staffRoles, {required_error: 'Role is required'}), // Use the enum from types
})

type AddStaffFormData = z.infer<typeof addStaffSchema>

interface AddStaffDialogProps {
	venueId: string
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onStaffAdded: () => void // Callback after successful addition
}

export const AddStaffDialog: React.FC<AddStaffDialogProps> = ({venueId, isOpen, onOpenChange, onStaffAdded}) => {
	const [isSaving, setIsSaving] = useState(false)

	const form = useForm<AddStaffFormData>({
		resolver: zodResolver(addStaffSchema),
		defaultValues: {
			email: '',
			role: 'staff', // Default role
		},
	})

	const onSubmit = async (data: AddStaffFormData) => {
		setIsSaving(true)
		console.log('Adding staff:', data)
		try {
			await venueService.addStaffMember(venueId, data)
			toast.success('Staff Added', {
				description: `${data.email} has been invited as ${data.role}.`,
			})
			form.reset() // Reset form on success
			onStaffAdded() // Trigger callback to refresh list
			// onOpenChange(false); // Close dialog is handled by DialogClose or externally
		} catch (err: unknown) {
			console.error('Failed to add staff:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
			toast.error('Failed to Add Staff', {
				description: errorMessage,
			})
		} finally {
			setIsSaving(false)
		}
	}

	// Reset form when dialog opens/closes
	React.useEffect(() => {
		if (!isOpen) {
			form.reset()
		}
	}, [isOpen, form])

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add New Staff Member</DialogTitle>
					<DialogDescription>Invite a user by email and assign them a role.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-4'>
						<FormField
							control={form.control}
							name='email'
							render={({field}) => (
								<FormItem>
									<FormLabel>User Email</FormLabel>
									<FormControl>
										<Input placeholder='user@example.com' {...field} disabled={isSaving} />
									</FormControl>
									<FormDescription>The email address of the user to invite.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='role'
							render={({field}) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select a role' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{staffRoles
												.filter((role) => role !== 'owner') // Prevent assigning 'owner' directly
												.map((role) => (
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
						<DialogFooter>
							<DialogClose asChild>
								<Button type='button' variant='outline' disabled={isSaving}>
									Cancel
								</Button>
							</DialogClose>
							<Button type='submit' disabled={isSaving}>
								{isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
								Add Staff
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
