'use client'

import React, {useEffect} from 'react'
import {useForm, SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Loader2} from 'lucide-react'
import {TenantResponse} from '@/types/tenant'

const editTenantFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
	is_active: z.boolean(),
})

export type EditTenantFormData = z.infer<typeof editTenantFormSchema> // Export the type

interface TenantDetailsFormProps {
	tenant: TenantResponse
	onSubmit: SubmitHandler<EditTenantFormData>
	isSubmitting: boolean // Renamed from isLoading for clarity with react-hook-form's isSubmitting
}

export function TenantDetailsForm({tenant, onSubmit, isSubmitting}: TenantDetailsFormProps) {
	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: {errors, isSubmitting: formIsSubmitting}, // formIsSubmitting from useForm
	} = useForm<EditTenantFormData>({
		resolver: zodResolver(editTenantFormSchema),
		defaultValues: {
			name: tenant?.name || '',
			is_active: tenant?.is_active || false,
		},
	})

	useEffect(() => {
		if (tenant) {
			reset({
				name: tenant.name,
				is_active: tenant.is_active,
			})
		}
	}, [tenant, reset])

	const watchedIsActive = watch('is_active')

	// Combine external isSubmitting with internal formIsSubmitting
	const trulySubmitting = isSubmitting || formIsSubmitting

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
			<div>
				<Label htmlFor='name'>Tenant Name</Label>
				<Input id='name' {...register('name')} className='mt-1' />
				{errors.name && <p className='text-sm text-red-500 mt-1'>{errors.name.message}</p>}
			</div>
			<div className='flex items-center space-x-2'>
				<Switch id='is_active' {...register('is_active')} checked={watchedIsActive} onCheckedChange={(checked) => setValue('is_active', checked, {shouldValidate: true})} />
				<Label htmlFor='is_active'>Active Status</Label>
			</div>
			{errors.is_active && <p className='text-sm text-red-500 mt-1'>{errors.is_active.message}</p>}

			<Button type='submit' disabled={trulySubmitting}>
				{trulySubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
				Save Changes
			</Button>
		</form>
	)
}
