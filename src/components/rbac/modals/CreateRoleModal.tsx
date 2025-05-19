import React, {useEffect} from 'react'
import {useForm, SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Loader2} from 'lucide-react'
import {CreateRoleFormValues, RbacLoadingState} from '@/types/rbac'

// Define Zod schema for the create role form
const createRoleSchema = z.object({
	roleName: z.string().min(1, {message: 'Role name cannot be empty'}).max(50, {message: 'Role name too long'}),
	domain: z.enum(['global', 'tenant'], {
		required_error: 'Please select a domain',
	}),
	subject: z.string().min(1, {message: 'Subject cannot be empty'}).max(50, {message: 'Subject too long'}),
	action: z.string().min(1, {message: 'Action cannot be empty'}).max(50, {message: 'Action too long'}),
})

interface CreateRoleModalProps {
	isOpen: boolean
	onClose: () => void
	loading: RbacLoadingState // Pass relevant loading state (action)
	error: string | null // Specific error for create role
	onCreateRole: (data: CreateRoleFormValues) => Promise<void> // Use the specific type
	defaultDomain?: 'tenant' | 'global'
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({isOpen, onClose, loading, error, onCreateRole, defaultDomain = 'tenant'}) => {
	const {
		register,
		handleSubmit,
		setValue,
		formState: {errors},
		reset,
	} = useForm<CreateRoleFormValues>({
		resolver: zodResolver(createRoleSchema),
		defaultValues: {
			// Set default values for subject and action
			subject: '*',
			action: '.*',
		},
	})

	// Reset form when modal opens or closes
	useEffect(() => {
		if (isOpen) {
			reset()
			setValue('roleName', '')
			setValue('subject', '*')
			setValue('action', '.*')
			setValue('domain', defaultDomain) // Set initial domain when opening
		}
	}, [isOpen, reset, setValue, defaultDomain])

	const onSubmit: SubmitHandler<CreateRoleFormValues> = async (data) => {
		await onCreateRole(data)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Create New Role</DialogTitle>
					<DialogDescription>Enter a name and an initial permission (subject/action) for the new role.</DialogDescription>
				</DialogHeader>
				{/* Use form element with onSubmit */}
				<form id='create-role-form' onSubmit={handleSubmit(onSubmit)} className='grid gap-4 py-4'>
					{/* Role Name Input */}
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='roleName' className='text-right'>
							Role Name
						</Label>
						<div className='col-span-3'>
							<Input id='roleName' className='w-full' placeholder='e.g., editor' {...register('roleName')} disabled={loading.action} />
							{errors.roleName && <p className='text-sm text-destructive mt-1'>{errors.roleName.message}</p>}
						</div>
					</div>

					{/* Domain Selection */}
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='domain' className='text-right'>
							Domain
						</Label>
						<div className='col-span-3'>
							<Select defaultValue={defaultDomain} onValueChange={(value) => setValue('domain', value as 'tenant' | 'global')} disabled={loading.action}>
								<SelectTrigger>
									<SelectValue placeholder='Select domain' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='tenant'>Tenant</SelectItem>
									<SelectItem value='global'>Global</SelectItem>
								</SelectContent>
							</Select>
							{errors.domain && <p className='text-sm text-destructive mt-1'>{errors.domain.message}</p>}
						</div>
					</div>
					{/* Subject Input */}
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='subject' className='text-right'>
							Subject
						</Label>
						<div className='col-span-3'>
							<Input id='subject' className='w-full' placeholder='e.g., articles or *' {...register('subject')} disabled={loading.action} />
							{errors.subject && <p className='text-sm text-destructive mt-1'>{errors.subject.message}</p>}
						</div>
					</div>
					{/* Action Input */}
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='action' className='text-right'>
							Action
						</Label>
						<div className='col-span-3'>
							<Input id='action' className='w-full' placeholder='e.g., read or .*' {...register('action')} disabled={loading.action} />
							{errors.action && <p className='text-sm text-destructive mt-1'>{errors.action.message}</p>}
						</div>
					</div>
					{/* Display API call errors */}
					{error && <p className='col-span-4 text-sm text-destructive text-center mt-2'>{error}</p>}
				</form>
				<DialogFooter>
					<DialogClose asChild>
						<Button type='button' variant='secondary'>
							Cancel
						</Button>
					</DialogClose>
					{/* Submit button outside the form, triggers submit via form ID */}
					<Button type='submit' form='create-role-form' disabled={loading.action}>
						{loading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
						Create Role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
