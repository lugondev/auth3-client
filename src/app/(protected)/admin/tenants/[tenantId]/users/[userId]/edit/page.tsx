'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
// import {Switch} from '@/components/ui/switch' // For status if it were boolean - REMOVED
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select' // For status dropdown
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {getTenantUserDetails, updateUserInTenant, getTenantById} from '@/services/tenantService'
import {toast} from 'sonner'
import {useRouter, useParams} from 'next/navigation'
import Link from 'next/link'
import {ArrowLeftIcon} from '@radix-ui/react-icons'
import {useEffect} from 'react'
import {AxiosError} from 'axios'
// import {TenantUserResponse} from '@/types/tenant' - REMOVED

// Schema for updating user in tenant
// Roles are comma-separated string, status is one of the allowed values
const updateUserInTenantRawSchema = z.object({
	role_names_str: z.string().optional(), // Optional: if not provided, roles are not updated
	status_in_tenant: z.enum(['active', 'invited', 'suspended']).optional(),
})

// Transformed schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateUserInTenantTransformedSchema = updateUserInTenantRawSchema
	.extend({
		role_names: z
			.string()
			.optional()
			.transform((val) =>
				val
					? val
							.split(',')
							.map((role) => role.trim())
							.filter((role) => role.length > 0)
					: undefined,
			),
	})
	.omit({role_names_str: true})

type UpdateUserInTenantRawFormValues = z.infer<typeof updateUserInTenantRawSchema>
type UpdateUserInTenantFormValues = z.infer<typeof updateUserInTenantTransformedSchema>

const TENANT_USERS_QUERY_KEY = 'tenantUsers'
const TENANT_USER_DETAIL_QUERY_KEY = 'tenantUserDetail'
const TENANT_DETAIL_QUERY_KEY = 'tenantDetail'

export default function EditTenantUserPage() {
	const router = useRouter()
	const params = useParams()
	const tenantId = params.tenantId as string
	const userId = params.userId as string
	const queryClient = useQueryClient()

	const {data: tenantData, isLoading: isLoadingTenant} = useQuery({
		queryKey: [TENANT_DETAIL_QUERY_KEY, tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId,
	})

	const {
		data: userDetails,
		isLoading: isLoadingUserDetails,
		error: userDetailsError,
	} = useQuery({
		queryKey: [TENANT_USER_DETAIL_QUERY_KEY, tenantId, userId],
		queryFn: () => getTenantUserDetails(tenantId, userId),
		enabled: !!tenantId && !!userId,
	})

	const form = useForm<UpdateUserInTenantRawFormValues>({
		resolver: zodResolver(updateUserInTenantRawSchema),
		defaultValues: {
			role_names_str: '',
			status_in_tenant: 'active',
		},
	})

	useEffect(() => {
		if (userDetails) {
			form.reset({
				role_names_str: userDetails.roles?.join(', ') || '',
				status_in_tenant: (userDetails.status_in_tenant as 'active' | 'invited' | 'suspended') || 'active',
			})
		}
	}, [userDetails, form])

	const updateUserMutation = useMutation({
		mutationFn: (data: UpdateUserInTenantFormValues) => updateUserInTenant(tenantId, userId, data),
		onSuccess: (data) => {
			toast.success(`User ${data.email} updated successfully in tenant.`)
			queryClient.invalidateQueries({queryKey: [TENANT_USERS_QUERY_KEY, tenantId]})
			queryClient.invalidateQueries({queryKey: [TENANT_USER_DETAIL_QUERY_KEY, tenantId, userId]})
			router.push(`/admin/tenants/${tenantId}/users`)
		},
		onError: (error: Error | AxiosError<{message?: string; error?: string}>) => {
			let errorMessage = 'Failed to update user in tenant.'
			let errorDescription = 'Please check the details and try again.'
			if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
				const axiosError = error as AxiosError<{message?: string; error?: string}>
				errorMessage = axiosError.response?.data?.message || axiosError.message
				errorDescription = axiosError.response?.data?.error || errorDescription
			} else if (error && error.message) {
				errorMessage = error.message
			}
			toast.error(errorMessage, {description: errorDescription})
		},
	})

	function onSubmit(rawValues: UpdateUserInTenantRawFormValues) {
		const payload: UpdateUserInTenantFormValues = {}

		if (rawValues.role_names_str !== undefined && rawValues.role_names_str !== (userDetails?.roles?.join(', ') || '')) {
			payload.role_names = rawValues.role_names_str
				.split(',')
				.map((r) => r.trim())
				.filter((r) => r.length > 0)
			if (payload.role_names.length === 0 && rawValues.role_names_str.trim() !== '') {
				// if string was not empty but resulted in empty array (e.g. ", ,") treat as explicit empty array
				payload.role_names = []
			} else if (payload.role_names.length === 0 && rawValues.role_names_str.trim() === '') {
				// if string was empty, don't send role_names to indicate no change
				delete payload.role_names
			}
		}

		if (rawValues.status_in_tenant && rawValues.status_in_tenant !== userDetails?.status_in_tenant) {
			payload.status_in_tenant = rawValues.status_in_tenant
		}

		if (Object.keys(payload).length === 0) {
			toast.info('No changes detected.')
			return
		}
		updateUserMutation.mutate(payload)
	}

	const tenantName = tenantData?.name || 'Tenant'
	const userEmail = userDetails?.email || 'User'

	if (isLoadingTenant || isLoadingUserDetails) return <div className='container mx-auto py-8'>Loading...</div>
	if (userDetailsError) return <div className='container mx-auto py-8'>Error fetching user details: {userDetailsError.message}</div>
	if (!userDetails) return <div className='container mx-auto py-8'>User not found in this tenant.</div>

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
					<CardTitle>Edit User: {userEmail}</CardTitle>
					<CardDescription>
						Update roles and status for {userEmail} in tenant {tenantName}.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{userDetails && (
						<div className='mb-8 space-y-3 p-4 border rounded-md bg-slate-50 dark:bg-slate-800'>
							<h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>User Information</h3>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm'>
								{userDetails.avatar && (
									<div className='md:col-span-2 flex items-center space-x-3'>
										<span className='font-medium text-gray-700 dark:text-gray-300'>Avatar:</span>
										<img src={userDetails.avatar} alt={`${userDetails.first_name || ''} ${userDetails.last_name || ''}'s avatar`} className='h-16 w-16 rounded-full object-cover border' />
									</div>
								)}
								<div>
									<span className='font-medium text-gray-700 dark:text-gray-300'>First Name:</span>
									<span className='ml-2 text-gray-900 dark:text-gray-100'>{userDetails.first_name || 'N/A'}</span>
								</div>
								<div>
									<span className='font-medium text-gray-700 dark:text-gray-300'>Last Name:</span>
									<span className='ml-2 text-gray-900 dark:text-gray-100'>{userDetails.last_name || 'N/A'}</span>
								</div>
								<div>
									<span className='font-medium text-gray-700 dark:text-gray-300'>Global Status:</span>
									<span className={`ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full ${userDetails.global_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : userDetails.global_status === 'suspended' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : userDetails.global_status === 'invited' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : userDetails.global_status === 'disabled' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>{userDetails.global_status ? userDetails.global_status.charAt(0).toUpperCase() + userDetails.global_status.slice(1) : 'N/A'}</span>
								</div>
								<div>
									<span className='font-medium text-gray-700 dark:text-gray-300'>Joined Tenant At:</span>
									<span className='ml-2 text-gray-900 dark:text-gray-100'>{userDetails.joined_at ? new Date(userDetails.joined_at).toLocaleString() : 'N/A'}</span>
								</div>
							</div>
						</div>
					)}
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
							<FormField
								control={form.control}
								name='role_names_str'
								render={({field}) => (
									<FormItem>
										<FormLabel>Role Names</FormLabel>
										<FormControl>
											<Input placeholder='e.g., manager, editor' {...field} />
										</FormControl>
										<FormDescription>Comma-separated list of role names. Leave empty if no change to roles.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='status_in_tenant'
								render={({field}) => (
									<FormItem>
										<FormLabel>Status in Tenant</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Select status' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value='active'>Active</SelectItem>
												<SelectItem value='invited'>Invited</SelectItem>
												<SelectItem value='suspended'>Suspended</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>The user&apos;s status within this specific tenant.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type='submit' disabled={updateUserMutation.isPending}>
								{updateUserMutation.isPending ? 'Updating User...' : 'Save Changes'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
