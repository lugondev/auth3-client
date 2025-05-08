'use client' // This page uses hooks like useParams and useEffect

import * as React from 'react'
import {useParams, useRouter} from 'next/navigation'
import {AxiosError} from 'axios' // Import AxiosError
import {TenantUserDataTable} from '@/components/admin/tenants/TenantUserDataTable'
import {tenantUserColumns} from '@/components/admin/tenants/TenantUserColumns'
import {getTenantById, addUserToTenant, getTenantRoles, Role} from '@/services/tenantService' // Added getTenantRoles, Role
import {TenantResponse, AddUserToTenantRequest} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Checkbox} from '@/components/ui/checkbox' // Added Checkbox
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {toast} from 'sonner'
// TODO: Add a multi-select component for roles if available, or use multiple checkboxes. - Partially addressed with checkboxes

const addUserFormSchema = z.object({
	email: z.string().email('Invalid email address.'),
	role_ids: z.array(z.string().uuid()).min(1, 'At least one role must be selected.'),
})

type AddUserFormValues = z.infer<typeof addUserFormSchema>

export default function TenantUsersPage() {
	const params = useParams()
	const router = useRouter()
	const tenantId = params.tenantId as string

	const [tenant, setTenant] = React.useState<TenantResponse | null>(null)
	const [isLoadingTenant, setIsLoadingTenant] = React.useState(true)
	const [availableRoles, setAvailableRoles] = React.useState<Role[]>([])
	const [isLoadingRoles, setIsLoadingRoles] = React.useState(true)
	const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false)

	const addUserForm = useForm<AddUserFormValues>({
		resolver: zodResolver(addUserFormSchema),
		defaultValues: {
			email: '',
			role_ids: [],
		},
	})

	React.useEffect(() => {
		if (tenantId) {
			const fetchTenantDetailsAndRoles = async () => {
				setIsLoadingTenant(true)
				setIsLoadingRoles(true)
				try {
					const tenantData = await getTenantById(tenantId)
					setTenant(tenantData)
				} catch (error) {
					console.error('Failed to fetch tenant details:', error)
					toast.error('Failed to load tenant details.')
				} finally {
					setIsLoadingTenant(false)
				}

				try {
					const rolesData = await getTenantRoles(tenantId) // Assuming no pagination needed for roles list in form
					setAvailableRoles(rolesData.roles)
				} catch (error) {
					console.error('Failed to fetch tenant roles:', error)
					toast.error('Failed to load roles for selection.')
				} finally {
					setIsLoadingRoles(false)
				}
			}
			fetchTenantDetailsAndRoles()
		}
	}, [tenantId, router])

	async function handleAddUser(data: AddUserFormValues) {
		if (!tenantId) return

		try {
			const requestData: AddUserToTenantRequest = {
				email: data.email,
				role_ids: data.role_ids, // Directly use the array of role IDs
			}
			await addUserToTenant(tenantId, requestData)
			toast.success(`User ${data.email} invited/added to tenant.`)
			setIsAddUserDialogOpen(false)
			addUserForm.reset()
			// TODO: Re-fetch or update user list in TenantUserDataTable
		} catch (error) {
			console.error('Failed to add user to tenant:', error)
			let errorMessage = 'Failed to add user.'
			if (error instanceof AxiosError) {
				errorMessage = error.response?.data?.message || error.message || errorMessage
			} else if (error instanceof Error) {
				errorMessage = error.message || errorMessage
			}
			toast.error(`Error: ${errorMessage}`)
		}
	}

	if (isLoadingTenant) {
		return <div className='container mx-auto py-10'>Loading tenant details...</div>
	}

	if (!tenant) {
		return <div className='container mx-auto py-10'>Tenant not found.</div>
	}

	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-4'>
				<div>
					<Button variant='outline' size='sm' onClick={() => router.back()} className='mb-2'>
						&larr; Back to Tenants
					</Button>
					<h1 className='text-3xl font-bold'>Users for Tenant: {tenant.name}</h1>
					<p className='text-sm text-muted-foreground'>Tenant ID: {tenant.id}</p>
				</div>
				<Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
					<DialogTrigger asChild>
						<Button>Add User to Tenant</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Add New User to {tenant.name}</DialogTitle>
							<DialogDescription>Enter the email and assign roles for the new user in this tenant.</DialogDescription>
						</DialogHeader>
						<Form {...addUserForm}>
							<form onSubmit={addUserForm.handleSubmit(handleAddUser)} className='space-y-4 py-4'>
								<FormField
									control={addUserForm.control}
									name='email'
									render={({field}) => (
										<FormItem>
											<FormLabel>User Email</FormLabel>
											<FormControl>
												<Input placeholder='user@example.com' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={addUserForm.control}
									name='role_ids'
									render={() => (
										// Remove unused fieldState
										<FormItem>
											<FormLabel>Roles</FormLabel>
											{isLoadingRoles ? (
												<p>Loading roles...</p>
											) : availableRoles.length === 0 ? (
												<p>No roles available for this tenant.</p>
											) : (
												<div className='space-y-2'>
													{availableRoles.map((role) => (
														<FormField
															key={role.id}
															control={addUserForm.control}
															name='role_ids'
															render={({field: itemField}) => {
																return (
																	<FormItem className='flex flex-row items-start space-x-3 space-y-0'>
																		<FormControl>
																			<Checkbox
																				checked={itemField.value?.includes(role.id)}
																				onCheckedChange={(checked) => {
																					return checked ? itemField.onChange([...(itemField.value || []), role.id]) : itemField.onChange((itemField.value || []).filter((value) => value !== role.id))
																				}}
																			/>
																		</FormControl>
																		<FormLabel className='font-normal'>{role.name}</FormLabel>
																	</FormItem>
																)
															}}
														/>
													))}
												</div>
											)}
											<FormDescription>Select one or more roles for the user.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<DialogFooter>
									<Button type='button' variant='outline' onClick={() => setIsAddUserDialogOpen(false)}>
										Cancel
									</Button>
									<Button type='submit' disabled={addUserForm.formState.isSubmitting || isLoadingRoles}>
										{addUserForm.formState.isSubmitting ? 'Adding...' : 'Add User'}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>

			<TenantUserDataTable columns={tenantUserColumns} tenantId={tenantId} />
		</div>
	)
}
