'use client'

import React, {useEffect, useState} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {SubmitHandler} from 'react-hook-form' // useForm removed as it's in TenantDetailsForm
// z import removed

// Button removed as it's no longer directly used here
// Input, Label, Switch removed (now in TenantDetailsForm)
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card' // CardFooter removed
import {Separator} from '@/components/ui/separator'
import {Loader2} from 'lucide-react' // ArrowLeft, Trash2, UserCheck, AlertCircle removed (in shared components)

import {
	getTenantById,
	updateTenant as updateTenantService,
	deleteTenant as deleteTenantService,
	// checkEmailExists, // Moved to TransferTenantOwnershipSection
	// transferTenantOwnership, // Moved to TransferTenantOwnershipSection
} from '@/services/tenantService'
import {TenantResponse, UpdateTenantRequest} from '@/types/tenant' // EditTenantFormData will be imported from form component
import {DeleteTenantConfirmationModal} from '@/components/modals/DeleteTenantConfirmationModal'

import {useTenantRbac} from '@/hooks/useTenantRbac'
import {TenantRolesSection} from '@/components/tenants/rbac/TenantRolesSection'
import {TenantRolePermissionsModal} from '@/components/tenants/rbac/TenantRolePermissionsModal'
import {TenantCreateRoleModal} from '@/components/tenants/rbac/TenantCreateRoleModal'

// Import new shared components
import {PageHeader} from '@/components/layout/PageHeader'
import {TenantStaticInfo} from '@/components/tenants/management/TenantStaticInfo'
import {TenantDetailsForm, EditTenantFormData} from '@/components/tenants/management/TenantDetailsForm' // Import EditTenantFormData
import {TransferTenantOwnershipSection} from '@/components/tenants/management/TransferTenantOwnershipSection'
import {DeleteTenantSection} from '@/components/tenants/management/DeleteTenantSection'

// Local EditTenantFormData type definition removed

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

	// useForm for EditTenantFormData is now within TenantDetailsForm
	// useEffect for resetting form is also within TenantDetailsForm

	const updateTenantMutation = useMutation({
		// Renamed from 'mutation' for clarity
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

	const deleteTenantMutation = useMutation({
		// Renamed from 'deleteMutation'
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
		},
	})

	// Transfer ownership logic is now within TransferTenantOwnershipSection
	// checkEmailMutation and transferOwnershipMutation are removed from here.
	// State for transferEmailCheckResult is removed.
	// onCheckEmailSubmit and handleTransferOwnership are removed.

	const handleUpdateTenantSubmit: SubmitHandler<EditTenantFormData> = (data) => {
		updateTenantMutation.mutate(data)
	}

	const handleDeleteConfirm = () => {
		deleteTenantMutation.mutate()
	}

	// --- Tenant RBAC Hook ---
	const tenantRbac = useTenantRbac(tenantId)

	useEffect(() => {
		if (tenantId) {
			tenantRbac.actions.setTenantId(tenantId)
		}
	}, [tenantId, tenantRbac.actions.setTenantId]) // tenantRbac.actions.setTenantId dependency might be stable, review if needed

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
				<PageHeader title='Error' description={tenantError.message} backButton={{text: 'Go Back', onClick: () => router.back()}} />
			</div>
		)
	}

	if (!tenant) {
		return (
			<div className='container mx-auto p-4 text-center'>
				<PageHeader title='Tenant Not Found' description='The requested tenant could not be found.' backButton={{text: 'Back to Tenants List', href: '/admin/tenants'}} />
			</div>
		)
	}

	return (
		<div className='container mx-auto p-4 space-y-8'>
			<PageHeader title={`Edit Tenant: ${tenant.name}`} backButton={{text: 'Back to Tenants', href: '/admin/tenants'}} />

			<Card>
				<CardHeader>
					<CardTitle>Tenant Information</CardTitle>
					<CardDescription>View and update tenant details.</CardDescription>
				</CardHeader>
				<CardContent>
					<TenantStaticInfo tenant={tenant} />
					<div className='pt-6'>
						<h3 className='text-lg font-semibold mb-4'>Edit Tenant Details</h3>
						<TenantDetailsForm tenant={tenant} onSubmit={handleUpdateTenantSubmit} isSubmitting={updateTenantMutation.isPending} />
					</div>
				</CardContent>
			</Card>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>Tenant Role Management</CardTitle>
					<CardDescription>Define roles and their permissions within this tenant.</CardDescription>
				</CardHeader>
				<CardContent>
					<TenantRolesSection roles={tenantRbac.roles} loading={tenantRbac.loading} error={tenantRbac.error} selectedRole={tenantRbac.selectedRole} onOpenCreateRoleModal={tenantRbac.actions.openCreateRoleModal} onOpenRolePermsModal={tenantRbac.actions.openRolePermsModal} onDeleteRole={tenantRbac.actions.handleDeleteTenantRole} />
				</CardContent>
			</Card>

			{/* Tenant RBAC Modals */}
			<TenantRolePermissionsModal isOpen={tenantRbac.isRolePermsModalOpen} onClose={tenantRbac.actions.closeRolePermsModal} role={tenantRbac.selectedRole} groupedPermissions={tenantRbac.groupedPermissions(tenantRbac.selectedRole)} loading={tenantRbac.loading} error={tenantRbac.error} newPermObject={tenantRbac.newPermObject} newPermAction={tenantRbac.newPermAction} onNewPermObjectChange={tenantRbac.actions.setNewPermObject} onNewPermActionChange={tenantRbac.actions.setNewPermAction} onAddPermission={tenantRbac.actions.handleAddPermissionToTenantRole} onRemovePermission={tenantRbac.actions.handleRemovePermissionFromTenantRole} />

			<TenantCreateRoleModal isOpen={tenantRbac.isCreateRoleModalOpen} onClose={tenantRbac.actions.closeCreateRoleModal} loading={tenantRbac.loading} error={tenantRbac.createRoleError} onCreateRole={tenantRbac.actions.handleCreateTenantRole} />

			{/* Delete Tenant Confirmation Modal */}
			{tenant && <DeleteTenantConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} tenantName={tenant.name} isLoading={deleteTenantMutation.isPending} />}

			<Separator />

			<TransferTenantOwnershipSection tenantId={tenantId} currentTenantName={tenant.name} />

			<Separator />

			<DeleteTenantSection tenant={tenant} onDeleteInitiated={() => setIsDeleteModalOpen(true)} isDeleting={deleteTenantMutation.isPending} />
		</div>
	)
}
