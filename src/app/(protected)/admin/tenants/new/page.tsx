'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {toast} from 'sonner' // Changed to sonner
import {createTenant} from '@/services/tenantService'
import {useRouter} from 'next/navigation' // Corrected import for App Router

const tenantFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
	slug: z
		.string()
		.min(3, 'Slug must be at least 3 characters.')
		.max(50)
		.regex(/^[a-zA-Z0-9]+$/, 'Slug must be alphanumeric.'),
	owner_email: z.string().email('Invalid email address.'),
})

type TenantFormValues = z.infer<typeof tenantFormSchema>

export default function NewTenantPage() {
	// const {toast} = useToast(); // Removed useToast hook
	const router = useRouter()
	const form = useForm<TenantFormValues>({
		resolver: zodResolver(tenantFormSchema),
		defaultValues: {
			name: '',
			slug: '',
			owner_email: '',
		},
	})

	async function onSubmit(data: TenantFormValues) {
		try {
			await createTenant(data)
			toast.success(`Tenant "${data.name}" has been successfully created.`)
			router.push('/admin/tenants') // Redirect to the tenants list page
		} catch (error) {
			console.error('Failed to create tenant:', error)
			toast.error('Failed to create tenant. Please try again.')
		}
	}

	return (
		<div className='container mx-auto py-10'>
			<h1 className='text-3xl font-bold mb-6'>Create New Tenant</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
					<FormField
						control={form.control}
						name='name'
						render={({field}) => (
							<FormItem>
								<FormLabel>Tenant Name</FormLabel>
								<FormControl>
									<Input placeholder='Acme Corporation' {...field} />
								</FormControl>
								<FormDescription>The official name of the tenant.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='slug'
						render={({field}) => (
							<FormItem>
								<FormLabel>Tenant Slug</FormLabel>
								<FormControl>
									<Input placeholder='acmecorp' {...field} />
								</FormControl>
								<FormDescription>A unique, URL-friendly identifier (alphanumeric).</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='owner_email'
						render={({field}) => (
							<FormItem>
								<FormLabel>Owner's Email</FormLabel>
								<FormControl>
									<Input placeholder='owner@example.com' {...field} />
								</FormControl>
								<FormDescription>The email address of the primary owner for this tenant.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type='submit' disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? 'Creating...' : 'Create Tenant'}
					</Button>
				</form>
			</Form>
		</div>
	)
}
