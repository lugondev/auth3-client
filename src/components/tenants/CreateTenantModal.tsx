'use client'

import React, {useState, useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
// import {createTenant} from '@/services/tenantService'
import {CreateTenantPayload} from '@/types/tenantManagement'
// import {toast} from '@/components/ui/toast' // Corrected import path - Commented out for now

const tenantFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
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
		watch,
		setValue,
	} = useForm<TenantFormData>({
		resolver: zodResolver(tenantFormSchema),
		mode: 'onChange', // To ensure watch updates correctly and for better UX with validation
	})

	const nameValue = watch('name')

	const generateSlug = (name: string): string => {
		if (!name) return ''
		return name
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/[^\w-]+/g, '') // Remove all non-word characters except hyphens
			.replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
			.substring(0, 50) // Ensure max length of 50 characters
	}

	useEffect(() => {
		if (nameValue) {
			const slug = generateSlug(nameValue)
			setValue('slug', slug, {shouldValidate: true, shouldDirty: true})
		}
		// else {
		//  setValue('slug', '', { shouldValidate: false, shouldDirty: true }); // Clear slug if name is cleared
		// }
	}, [nameValue, setValue])

	const mutation = useMutation({
		mutationFn: (data: CreateTenantPayload) => {
			// Placeholder for the actual API call
			// return createTenant(data)
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(data)
				}, 1000)
			})
		},
		onSuccess: () => {
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
