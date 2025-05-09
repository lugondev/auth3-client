'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Switch} from '@/components/ui/switch'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {getTenantById, updateTenant} from '@/services/tenantService'
import {toast} from 'sonner'
import {useRouter, useParams} from 'next/navigation'
import Link from 'next/link'
import {ArrowLeftIcon} from '@radix-ui/react-icons'
import {useEffect} from 'react'
import {useBreadcrumbLabelStore} from '@/lib/breadcrumbStore'
import {AxiosError} from 'axios'

// Schema for updating, name and is_active are optional
const tenantUpdateFormSchema = z.object({
	name: z.string().min(2, {message: 'Tenant name must be at least 2 characters.'}).max(100).optional(),
	is_active: z.boolean().optional(),
})

type TenantUpdateFormValues = z.infer<typeof tenantUpdateFormSchema>

const TENANTS_QUERY_KEY = 'tenants'
const TENANT_DETAIL_QUERY_KEY = 'tenantDetail'

export default function EditTenantPage() {
	const router = useRouter()
	const params = useParams()
	const tenantId = params.tenantId as string
	const queryClient = useQueryClient()

	const {
		data: tenantData,
		isLoading: isLoadingTenant,
		error: tenantError,
	} = useQuery({
		queryKey: [TENANT_DETAIL_QUERY_KEY, tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId, // Only run query if tenantId is available
	})

	const form = useForm<TenantUpdateFormValues>({
		resolver: zodResolver(tenantUpdateFormSchema),
		defaultValues: {
			name: '',
			is_active: true,
		},
	})

	useEffect(() => {
		if (tenantData) {
			form.reset({
				name: tenantData.name || '',
				is_active: tenantData.is_active,
			})
			// Update breadcrumb store with tenant name
			if (tenantData.name) {
				// Ensure name exists before setting
				useBreadcrumbLabelStore.getState().setLabel(tenantId, tenantData.name)
			}
		}
	}, [tenantData, form, tenantId]) // Added tenantId to dependency array

	const updateTenantMutation = useMutation({
		mutationFn: (values: TenantUpdateFormValues) => updateTenant(tenantId, values),
		onSuccess: (data) => {
			toast.success(`Tenant "${data.name}" updated successfully!`)
			queryClient.invalidateQueries({queryKey: [TENANTS_QUERY_KEY]})
			queryClient.invalidateQueries({queryKey: [TENANT_DETAIL_QUERY_KEY, tenantId]})
			router.push('/admin/tenants')
		},
		onError: (error: Error | AxiosError<{message?: string; error?: string}>) => {
			let errorMessage = 'Failed to update tenant.'
			let errorDescription = 'Please check the details and try again.'
			if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
				const axiosError = error as AxiosError<{message?: string; error?: string}>
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

	function onSubmit(values: TenantUpdateFormValues) {
		// Filter out undefined values so only provided fields are sent
		const payload: Partial<TenantUpdateFormValues> = {}
		if (values.name !== undefined && values.name !== tenantData?.name) {
			payload.name = values.name
		}
		if (values.is_active !== undefined && values.is_active !== tenantData?.is_active) {
			payload.is_active = values.is_active
		}

		if (Object.keys(payload).length === 0) {
			toast.info('No changes detected.')
			return
		}
		updateTenantMutation.mutate(payload)
	}

	if (isLoadingTenant) return <div className='container mx-auto py-8'>Loading tenant details...</div>
	if (tenantError) return <div className='container mx-auto py-8'>Error fetching tenant: {tenantError.message}</div>
	if (!tenantData) return <div className='container mx-auto py-8'>Tenant not found.</div>

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
					<CardTitle>Edit Tenant: {tenantData.name}</CardTitle>
					<CardDescription>Update the details for this tenant.</CardDescription>
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
								name='is_active'
								render={({field}) => (
									<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
										<div className='space-y-0.5'>
											<FormLabel className='text-base'>Active Status</FormLabel>
											<FormDescription>Controls whether the tenant is active and accessible.</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>
							<Button type='submit' disabled={updateTenantMutation.isPending}>
								{updateTenantMutation.isPending ? 'Updating...' : 'Save Changes'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
