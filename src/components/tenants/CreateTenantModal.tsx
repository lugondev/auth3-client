'use client'

import React, {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {createTenant} from '@/services/tenantService'
import {CreateTenantPayload} from '@/types/tenantManagement'
// import {toast} from '@/components/ui/toast' // Corrected import path - Commented out for now

const tenantFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
	owner_email: z.string().email('Invalid email address'),
	slug: z
		.string()
		.min(3, 'Slug must be at least 3 characters')
		.max(50, 'Slug must be at most 50 characters')
		.regex(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/, 'Slug must be alphanumeric and can contain hyphens'),
})

type TenantFormData = z.infer<typeof tenantFormSchema>

interface CreateTenantModalProps {
	children: React.ReactNode // To use a custom button as DialogTrigger
	onTenantCreated?: () => void
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({children, onTenantCreated}) => {
	const [isOpen, setIsOpen] = useState(false)
	const queryClient = useQueryClient()

	const {
		register,
		handleSubmit,
		formState: {errors, isSubmitting},
		reset,
	} = useForm<TenantFormData>({
		resolver: zodResolver(tenantFormSchema),
	})

	const mutation = useMutation({
		mutationFn: (data: CreateTenantPayload) => createTenant(data),
		onSuccess: () => {
			// toast({
			// 	title: 'Tenant Created',
			// 	description: 'The new tenant has been created successfully.',
			// })
			console.log('Tenant created successfully') // Placeholder
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
			queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']})
			setIsOpen(false)
			reset()
			if (onTenantCreated) {
				onTenantCreated()
			}
		},
		onError: (error: Error) => {
			// Changed 'any' to 'Error'
			// toast({
			// 	title: 'Error',
			// 	description: error.message || 'Failed to create tenant. Please try again.',
			// 	variant: 'destructive',
			// })
			console.error('Failed to create tenant:', error.message) // Placeholder
		},
	})

	const onSubmit = (data: TenantFormData) => {
		mutation.mutate(data)
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Create New Tenant</DialogTitle>
					<DialogDescription>Fill in the details below to create a new tenant.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					<div>
						<Label htmlFor='name'>Tenant Name</Label>
						<Input id='name' {...register('name')} placeholder='Acme Corporation' />
						{errors.name && <p className='text-sm text-red-500 mt-1'>{errors.name.message}</p>}
					</div>
					<div>
						<Label htmlFor='owner_email'>Owner Email</Label>
						<Input id='owner_email' type='email' {...register('owner_email')} placeholder='owner@example.com' />
						{errors.owner_email && <p className='text-sm text-red-500 mt-1'>{errors.owner_email.message}</p>}
					</div>
					<div>
						<Label htmlFor='slug'>Tenant Slug</Label>
						<Input id='slug' {...register('slug')} placeholder='acme-corp' />
						{errors.slug && <p className='text-sm text-red-500 mt-1'>{errors.slug.message}</p>}
						<p className='text-xs text-gray-500 mt-1'>Alphanumeric, min 3, max 50. Hyphens allowed.</p>
					</div>
					<DialogFooter>
						<Button type='button' variant='outline' onClick={() => setIsOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Tenant'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
