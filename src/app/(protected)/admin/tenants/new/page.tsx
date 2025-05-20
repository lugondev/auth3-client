'use client'

import {useEffect} from 'react' // Added useEffect
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useMutation} from '@tanstack/react-query'
import {toast} from 'sonner'
import Link from 'next/link'
import {ArrowLeftIcon} from '@radix-ui/react-icons'

const tenantFormSchema = z.object({
	name: z.string().min(2, {message: 'Tenant name must be at least 2 characters.'}).max(100),
	slug: z
		.string()
		.min(3, {message: 'Slug must be at least 3 characters.'})
		.max(50)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
			message: 'Slug must be lowercase alphanumeric with optional hyphens and no leading/trailing hyphens.',
		}),
})

type TenantFormValues = z.infer<typeof tenantFormSchema>

export default function CreateTenantPage() {
	const form = useForm<TenantFormValues>({
		resolver: zodResolver(tenantFormSchema),
		defaultValues: {
			name: '',
			slug: '',
		},
		mode: 'onChange', // Added for better watch performance
	})

	const {watch, setValue, trigger} = form // Destructure watch and setValue
	const watchedName = watch('name')
	const watchedSlug = watch('slug') // Watch slug to prevent overwriting manual input

	// Function to generate slug
	const generateSlug = (name: string) => {
		return name
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/[^\w-]+/g, '') // Remove non-alphanumeric characters except hyphens
			.replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
	}

	useEffect(() => {
		if (watchedName) {
			const generatedSlug = generateSlug(watchedName)
			// Only update if the current slug is empty or was likely auto-generated from a previous name
			// This prevents overwriting a slug that the user has manually typed or corrected.
			// A simple check is if the current slug is an empty string or if it's the slugified version of a *previous* name.
			// For simplicity here, we'll update if the slug is empty or if the new generated slug is different from the current one,
			// implying the name changed and the slug should reflect that, unless the user has manually set it.
			// A more robust check might involve storing the "last auto-generated slug".
			if (watchedSlug === '' || generateSlug(watchedName.slice(0, -1)) === watchedSlug || watchedSlug !== generatedSlug) {
				setValue('slug', generatedSlug, {shouldValidate: true, shouldDirty: true})
				trigger('slug') // Trigger validation for slug
			}
		}
	}, [watchedName, setValue, watchedSlug, trigger])

	const createTenantMutation = useMutation({
		// mutationFn: createTenant,
		mutationFn: async (data: TenantFormValues) => {
			// Simulate API call
			console.log('Creating tenant with data:', data)
			await new Promise((resolve) => setTimeout(resolve, 1000))
		},
		onSuccess: (data) => {
			console.log('Tenant created successfully:', data)

			// toast.success(`Tenant "${data.name}" created successfully!`)
			// queryClient.invalidateQueries({queryKey: [TENANTS_QUERY_KEY]})
			// router.push('/admin/tenants') // Redirect to the tenants list
		},
		onError: (error: Error | import('axios').AxiosError<{message?: string; error?: string}>) => {
			let errorMessage = 'Failed to create tenant.'
			let errorDescription = 'Please check the details and try again.'
			if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
				const axiosError = error as import('axios').AxiosError<{message?: string; error?: string}>
				errorMessage = axiosError.response?.data?.message || axiosError.message
				errorDescription = axiosError.response?.data?.error || errorDescription
			} else if (error && error.message) {
				errorMessage = error.message
			}
			toast.error(errorMessage, {
				description: errorDescription,
			})
		},
	})

	function onSubmit(values: TenantFormValues) {
		createTenantMutation.mutate(values)
	}

	return (
		<div className='container mx-auto py-8'>
			<div className='mb-4'>
				<Link href='/admin/tenants' passHref>
					<Button variant='outline' size='sm'>
						<ArrowLeftIcon className='mr-2 h-4 w-4' />
						Back to Tenants
					</Button>
				</Link>
			</div>
			<Card className='max-w-2xl mx-auto'>
				<CardHeader>
					<CardTitle>Create New Tenant</CardTitle>
					<CardDescription>Fill in the details to create a new tenant/organization.</CardDescription>
				</CardHeader>
				<CardContent>
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
										<FormDescription>The official name of the tenant or organization.</FormDescription>
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
											<Input placeholder='acme-corp' {...field} />
										</FormControl>
										<FormDescription>A unique, URL-friendly identifier (e.g., acme-corp). Lowercase alphanumeric and hyphens only.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type='submit' disabled={createTenantMutation.isPending}>
								{createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
