'use client'

import React, {useEffect} from 'react'
import {useForm, SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Loader2} from 'lucide-react'
import {CreateTenantRoleFormValues, TenantRbacLoadingState} from '@/types/tenantRbac' // Use Tenant specific types

// Define Zod schema for the create role form
const createTenantRoleSchema = z.object({
	roleName: z.string().min(1, {message: 'Role name cannot be empty'}).max(50, {message: 'Role name too long'}),
	subject: z.string().min(1, {message: 'Initial permission subject cannot be empty'}).max(100, {message: 'Subject too long'}), // Max length can be adjusted
	action: z.string().min(1, {message: 'Initial permission action cannot be empty'}).max(50, {message: 'Action too long'}),
})

interface TenantCreateRoleModalProps {
	isOpen: boolean
	onClose: () => void
	loading: TenantRbacLoadingState // Pass relevant loading state (action)
	error: string | null // Specific error for create role from useTenantRbac
	onCreateRole: (roleName: string, subject: string, action: string) => Promise<void>
}

export const TenantCreateRoleModal: React.FC<TenantCreateRoleModalProps> = ({isOpen, onClose, loading, error, onCreateRole}) => {
	const {
		register,
		handleSubmit,
		formState: {errors},
		reset,
	} = useForm<CreateTenantRoleFormValues>({
		resolver: zodResolver(createTenantRoleSchema),
		defaultValues: {
			roleName: '',
			subject: '', // No default subject for tenant roles, user should define
			action: '', // No default action
		},
	})

	// Reset form when modal opens or closes
	useEffect(() => {
		if (isOpen) {
			reset({roleName: '', subject: '', action: ''})
		}
	}, [isOpen, reset])

	const onSubmit: SubmitHandler<CreateTenantRoleFormValues> = async (data) => {
		await onCreateRole(data.roleName, data.subject, data.action)
		// The hook's handleCreateTenantRole should manage closing the modal on success
		// and resetting form is handled by useEffect on isOpen change.
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Create New Tenant Role</DialogTitle>
					<DialogDescription>Enter a name and an initial permission (subject/action) for the new role within this tenant.</DialogDescription>
				</DialogHeader>
				<form id='create-tenant-role-form' onSubmit={handleSubmit(onSubmit)} className='grid gap-4 py-4'>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='tenantRoleName' className='text-right'>
							Role Name
						</Label>
						<div className='col-span-3'>
							<Input id='tenantRoleName' className='w-full' placeholder='e.g., tenant-editor' {...register('roleName')} disabled={loading.action} />
							{errors.roleName && <p className='text-sm text-destructive mt-1'>{errors.roleName.message}</p>}
						</div>
					</div>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='tenantSubject' className='text-right'>
							Initial Subject
						</Label>
						<div className='col-span-3'>
							<Input id='tenantSubject' className='w-full' placeholder='e.g., /api/v1/items/*' {...register('subject')} disabled={loading.action} />
							{errors.subject && <p className='text-sm text-destructive mt-1'>{errors.subject.message}</p>}
						</div>
					</div>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='tenantAction' className='text-right'>
							Initial Action
						</Label>
						<div className='col-span-3'>
							<Input id='tenantAction' className='w-full' placeholder='e.g., GET or *' {...register('action')} disabled={loading.action} />
							{errors.action && <p className='text-sm text-destructive mt-1'>{errors.action.message}</p>}
						</div>
					</div>
					{error && <p className='col-span-4 text-sm text-destructive text-center mt-2'>{error}</p>}
				</form>
				<DialogFooter>
					<DialogClose asChild>
						<Button type='button' variant='secondary' onClick={onClose}>
							Cancel
						</Button>
					</DialogClose>
					<Button type='submit' form='create-tenant-role-form' disabled={loading.action}>
						{loading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
						Create Role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
