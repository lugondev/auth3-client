// next/src/components/venues/staff/EditStaffDialog.tsx
'use client'

import React, {useState, useEffect} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import venueService from '@/services/venueService'
import {StaffMember, UpdateStaffDto, staffRoles} from '@/types/venue'
import {toast} from 'sonner'
import {Loader2} from 'lucide-react'

// Schema for the edit staff form
const editStaffSchema = z.object({
	role: z.enum(staffRoles, {required_error: 'Role is required'}),
})

type EditStaffFormData = z.infer<typeof editStaffSchema>

interface EditStaffDialogProps {
	venueId: string
	staffMember: StaffMember
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onStaffUpdated: () => void // Callback after successful update
}

export const EditStaffDialog: React.FC<EditStaffDialogProps> = ({venueId, staffMember, isOpen, onOpenChange, onStaffUpdated}) => {
	const [isSaving, setIsSaving] = useState(false)

	const form = useForm<EditStaffFormData>({
		resolver: zodResolver(editStaffSchema),
		// Set default value when the dialog opens or staffMember changes
		defaultValues: {
			role: staffMember.role,
		},
	})

	// Update defaultValues if the selected staffMember changes while dialog might be open
	useEffect(() => {
		if (staffMember) {
			form.reset({
				role: staffMember.role,
			})
		}
	}, [staffMember, form])

	const onSubmit = async (data: EditStaffFormData) => {
		if (!staffMember) return // Should not happen if dialog is open

		// Only submit if the role has actually changed
		if (data.role === staffMember.role) {
			toast.info('No Changes Detected', {
				description: 'The selected role is the same as the current role.',
			})
			onOpenChange(false) // Close the dialog
			return
		}

		setIsSaving(true)
		console.log(`Updating staff ${staffMember.id} with role:`, data.role)
		try {
			const updateDto: UpdateStaffDto = {role: data.role}
			await venueService.updateStaffMember(venueId, staffMember.id, updateDto)
			toast.success('Staff Role Updated', {
				description: `${staffMember.name}'s role has been updated to ${data.role}.`,
			})
			onStaffUpdated() // Trigger callback to refresh list
			onOpenChange(false) // Explicitly close dialog on success
		} catch (err: unknown) {
			console.error('Failed to update staff role:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
			toast.error('Failed to Update Role', {
				description: errorMessage,
			})
		} finally {
			setIsSaving(false)
		}
	}

	// Reset form state when dialog closes
	useEffect(() => {
		if (!isOpen) {
			form.reset({role: staffMember.role}) // Reset to original role on close
		}
	}, [isOpen, form, staffMember.role])

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Edit Staff Role</DialogTitle>
					<DialogDescription>
						Update the role for {staffMember.name} ({staffMember.email}).
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-4'>
						<FormField
							control={form.control}
							name='role'
							render={({field}) => (
								<FormItem>
									<FormLabel>New Role</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || staffMember.role === 'owner'}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select a role' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{staffRoles
												.filter((role) => role !== 'owner') // Prevent changing TO 'owner'
												.map((role) => (
													<SelectItem key={role} value={role}>
														{role.charAt(0).toUpperCase() + role.slice(1)}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									<FormMessage />
									{staffMember.role === 'owner' && <p className='text-sm text-muted-foreground mt-1'>The venue owner&#39;s role cannot be changed here. Use Transfer Ownership instead.</p>}
								</FormItem>
							)}
						/>
						<DialogFooter>
							<DialogClose asChild>
								<Button type='button' variant='outline' disabled={isSaving}>
									Cancel
								</Button>
							</DialogClose>
							<Button type='submit' disabled={isSaving || staffMember.role === 'owner'}>
								{isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
								Update Role
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
