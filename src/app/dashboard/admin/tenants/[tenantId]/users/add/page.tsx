'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
// Removed Textarea import
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {addUserToTenant, getTenantById} from '@/services/tenantService'
import {toast} from 'sonner'
import {useRouter, useParams} from 'next/navigation'
import Link from 'next/link'
import {ArrowLeftIcon} from '@radix-ui/react-icons'
import {AxiosError} from 'axios'

// TODO: Fetch available roles for a dropdown/multi-select later
// Schema for the raw form input
const tenantUserRawFormSchema = z.object({
	email: z.string().email({message: 'Please enter a valid email address.'}),
	role_names_str: z.string().min(1, {message: 'Please enter at least one role name.'}), // Roles as a comma-separated string
})

// Schema for the transformed data (after Zod processing)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const addUserToTenantTransformedSchema = tenantUserRawFormSchema
	.extend({
		role_names: z.string().transform((val) =>
			val
				.split(',')
				.map((role) => role.trim())
				.filter((role) => role.length > 0),
		),
	})
	.omit({role_names_str: true}) // Omit the string version after transformation

// Type for the raw form values
type TenantUserRawFormValues = z.infer<typeof tenantUserRawFormSchema>
// Type for the values after Zod transformation (this is what onSubmit will receive)
type AddUserToTenantFormValues = z.infer<typeof addUserToTenantTransformedSchema>

const TENANT_USERS_QUERY_KEY = 'tenantUsers'
const TENANT_DETAIL_QUERY_KEY = 'tenantDetail'

export default function AddUserToTenantPage() {
	const router = useRouter()
	const params = useParams()
	const tenantId = params.tenantId as string
	const queryClient = useQueryClient()

	const {data: tenantData, isLoading: isLoadingTenantName} = useQuery({
		queryKey: [TENANT_DETAIL_QUERY_KEY, tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId,
	})

	// Form uses the raw values type
	const form = useForm<TenantUserRawFormValues>({
		resolver: zodResolver(tenantUserRawFormSchema.pick({email: true, role_names_str: true})), // Use the raw schema for validation
		defaultValues: {
			email: '',
			role_names_str: '',
		},
	})

	const addUserMutation = useMutation({
		// Mutation function expects the transformed data
		mutationFn: (data: AddUserToTenantFormValues) => addUserToTenant(tenantId, data),
		onSuccess: (data) => {
			toast.success(`User ${data.email} added to tenant successfully!`)
			queryClient.invalidateQueries({queryKey: [TENANT_USERS_QUERY_KEY, tenantId]})
			router.push(`/admin/tenants/${tenantId}/users`)
		},
		onError: (error: Error | AxiosError<{message?: string; error?: string}>) => {
			let errorMessage = 'Failed to add user to tenant.'
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

	// onSubmit receives the raw form values, then we parse them for the mutation
	function onSubmit(rawValues: TenantUserRawFormValues) {
		try {
			// Manually transform/parse here before sending to mutation
			const transformedValues: AddUserToTenantFormValues = {
				email: rawValues.email,
				role_names: rawValues.role_names_str
					.split(',')
					.map((role) => role.trim())
					.filter((role) => role.length > 0),
			}
			if (transformedValues.role_names.length === 0) {
				form.setError('role_names_str', {type: 'manual', message: 'Please enter at least one role name.'})
				return
			}
			addUserMutation.mutate(transformedValues)
		} catch (e) {
			// This catch is for potential errors during manual transformation if Zod doesn't catch it first
			// (though Zod resolver should handle schema validation)
			toast.error('Error processing form data.')
			console.error('Form data processing error:', e)
		}
	}

	const tenantName = tenantData?.name || 'Tenant'

	if (isLoadingTenantName) return <div className='container mx-auto py-8'>Loading...</div>

	return (
		<div className='container mx-auto py-8'>
			<div className='mb-4'>
				<Link href={`/admin/tenants/${tenantId}/users`} passHref>
					<Button variant='outline' size='sm'>
						<ArrowLeftIcon className='mr-2 h-4 w-4' />
						Back to Users in {tenantName}
					</Button>
				</Link>
			</div>
			<Card className='max-w-2xl mx-auto'>
				<CardHeader>
					<CardTitle>Add User to {tenantName}</CardTitle>
					<CardDescription>Enter the user&apos;s email and assign roles within this tenant.</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
							<FormField
								control={form.control}
								name='email'
								render={({field}) => (
									<FormItem>
										<FormLabel>User Email</FormLabel>
										<FormControl>
											<Input type='email' placeholder='user@example.com' {...field} />
										</FormControl>
										<FormDescription>The email of the user to add or invite.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='role_names_str' // Bind to the string field
								render={({field}) => (
									<FormItem>
										<FormLabel>Role Names</FormLabel>
										<FormControl>
											<Input placeholder='e.g., manager, editor, viewer' {...field} />
										</FormControl>
										<FormDescription>Comma-separated list of role names to assign to the user in this tenant.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type='submit' disabled={addUserMutation.isPending}>
								{addUserMutation.isPending ? 'Adding User...' : 'Add User to Tenant'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
