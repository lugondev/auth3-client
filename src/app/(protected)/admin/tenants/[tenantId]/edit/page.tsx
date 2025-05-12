'use client'

import React, {useEffect, useState} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useForm, SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Loader2, ArrowLeft, Trash2} from 'lucide-react'

import {getTenantById, updateTenant as updateTenantService, deleteTenant as deleteTenantService} from '@/services/tenantService'
import {TenantResponse, UpdateTenantRequest} from '@/types/tenant'
import {DeleteTenantConfirmationModal} from '@/components/modals/DeleteTenantConfirmationModal'

import {useTenantRbac} from '@/hooks/useTenantRbac'
import {TenantRolesSection} from '@/components/tenants/rbac/TenantRolesSection'
import {TenantRolePermissionsModal} from '@/components/tenants/rbac/TenantRolePermissionsModal'
import {TenantCreateRoleModal} from '@/components/tenants/rbac/TenantCreateRoleModal'

const editTenantFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
	is_active: z.boolean(),
})

type EditTenantFormData = z.infer<typeof editTenantFormSchema>

export default function EditTenantPage() {
	const router = useRouter()
	const params = useParams()
	const tenantId = params.tenantId as string
	const queryClient = useQueryClient()
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	const {
		data: tenant,
		isLoading: isLoadingTenant,
		error: tenantError,
	} = useQuery<TenantResponse, Error>({
		queryKey: ['tenantDetails', tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId,
	})

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch, // Added watch from useForm
		formState: {errors, isSubmitting: isSubmittingForm},
	} = useForm<EditTenantFormData>({
		resolver: zodResolver(editTenantFormSchema),
	})

	useEffect(() => {
		if (tenant) {
			reset({
				name: tenant.name,
				is_active: tenant.is_active,
			})
		}
	}, [tenant, reset])

	const mutation = useMutation({
		mutationFn: (data: UpdateTenantRequest) => updateTenantService(tenantId, data),
		onSuccess: (updatedTenant) => {
			console.log(`Tenant "${updatedTenant.name}" has been updated successfully.`)
			queryClient.invalidateQueries({queryKey: ['tenantDetails', tenantId]})
			queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']})
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
		},
		onError: (error: Error) => {
			console.error('Error Updating Tenant:', error.message)
		},
	})

	const deleteMutation = useMutation({
		mutationFn: () => deleteTenantService(tenantId),
		onSuccess: () => {
			console.log(`Tenant "${tenant?.name}" has been deleted successfully.`)
			queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']})
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
			queryClient.removeQueries({queryKey: ['tenantDetails', tenantId]})
			router.push('/admin/tenants') // Redirect after successful deletion
		},
		onError: (error: Error) => {
			console.error('Error Deleting Tenant:', error.message)
			// Optionally, show a toast notification for the error
		},
	})

	const onSubmit: SubmitHandler<EditTenantFormData> = (data) => {
		mutation.mutate(data)
	}

	const handleDeleteConfirm = () => {
		deleteMutation.mutate()
	}

	// --- Tenant RBAC Hook ---
	const tenantRbac = useTenantRbac(tenantId) // Initialize with tenantId

	// Effect to set tenantId for the hook once it's available
	useEffect(() => {
		if (tenantId) {
			tenantRbac.actions.setTenantId(tenantId)
		}
	}, [tenantId, tenantRbac.actions.setTenantId])

	if (isLoadingTenant || tenantRbac.loading.initialRoles) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>Loading Tenant Details...</span>
			</div>
		)
	}

	if (tenantError) {
		return (
			<div className='container mx-auto p-4 text-center'>
				<p className='text-destructive'>Error loading tenant: {tenantError.message}</p>
				<Button onClick={() => router.back()} variant='outline' className='mt-4'>
					Go Back
				</Button>
			</div>
		)
	}

	if (!tenant) {
		return (
			<div className='container mx-auto p-4 text-center'>
				<p>Tenant not found.</p>
				<Button onClick={() => router.push('/admin/tenants')} variant='outline' className='mt-4'>
					Back to Tenants List
				</Button>
			</div>
		)
	}
	const watchedIsActive = watch('is_active') // Watch the value for the Switch

	return (
		<div className='container mx-auto p-4 space-y-8'>
			<div>
				<Button variant='outline' size='sm' onClick={() => router.push('/admin/tenants')} className='mb-4'>
					<ArrowLeft className='mr-2 h-4 w-4' />
					Back to Tenants
				</Button>
				<h1 className='text-3xl font-bold'>Edit Tenant: {tenant.name}</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Tenant Details</CardTitle>
					<CardDescription>{`Update the tenant's name and status.`}</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
						<div>
							<Label htmlFor='name'>Tenant Name</Label>
							<Input id='name' {...register('name')} className='mt-1' />
							{errors.name && <p className='text-sm text-red-500 mt-1'>{errors.name.message}</p>}
						</div>
						<div className='flex items-center space-x-2'>
							<Switch id='is_active' {...register('is_active')} checked={watchedIsActive} onCheckedChange={(checked) => setValue('is_active', checked)} />
							<Label htmlFor='is_active'>Active Status</Label>
						</div>
						{errors.is_active && <p className='text-sm text-red-500 mt-1'>{errors.is_active.message}</p>}

						<Button type='submit' disabled={isSubmittingForm || mutation.isPending}>
							{(isSubmittingForm || mutation.isPending) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Save Changes
						</Button>
					</form>
				</CardContent>
				<CardFooter className='border-t pt-6'>
					<div className='flex flex-col space-y-2 w-full'>
						<h3 className='text-lg font-semibold text-destructive'>Danger Zone</h3>
						<p className='text-sm text-muted-foreground'>Deleting this tenant will permanently remove all its data, including users, roles, and permissions. This action cannot be undone.</p>
						<Button variant='destructive' onClick={() => setIsDeleteModalOpen(true)} className='self-start' disabled={deleteMutation.isPending}>
							{deleteMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
							Delete Tenant
						</Button>
					</div>
				</CardFooter>
			</Card>

			<Separator />

			{/* Tenant RBAC Section */}
			<TenantRolesSection roles={tenantRbac.roles} loading={tenantRbac.loading} error={tenantRbac.error} selectedRole={tenantRbac.selectedRole} onOpenCreateRoleModal={tenantRbac.actions.openCreateRoleModal} onOpenRolePermsModal={tenantRbac.actions.openRolePermsModal} onDeleteRole={tenantRbac.actions.handleDeleteTenantRole} />

			{/* Tenant RBAC Modals */}
			<TenantRolePermissionsModal
				isOpen={tenantRbac.isRolePermsModalOpen}
				onClose={tenantRbac.actions.closeRolePermsModal}
				role={tenantRbac.selectedRole}
				groupedPermissions={tenantRbac.groupedPermissions(tenantRbac.selectedRole)}
				loading={tenantRbac.loading}
				error={tenantRbac.error} // General error for modal operations
				newPermObject={tenantRbac.newPermObject}
				newPermAction={tenantRbac.newPermAction}
				onNewPermObjectChange={tenantRbac.actions.setNewPermObject}
				onNewPermActionChange={tenantRbac.actions.setNewPermAction}
				onAddPermission={tenantRbac.actions.handleAddPermissionToTenantRole}
				onRemovePermission={tenantRbac.actions.handleRemovePermissionFromTenantRole}
			/>

			<TenantCreateRoleModal
				isOpen={tenantRbac.isCreateRoleModalOpen}
				onClose={tenantRbac.actions.closeCreateRoleModal}
				loading={tenantRbac.loading}
				error={tenantRbac.createRoleError} // Specific error for create role
				onCreateRole={tenantRbac.actions.handleCreateTenantRole}
			/>

			{/* Delete Tenant Confirmation Modal */}
			{tenant && <DeleteTenantConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} tenantName={tenant.name} isLoading={deleteMutation.isPending} />}
		</div>
	)
}
