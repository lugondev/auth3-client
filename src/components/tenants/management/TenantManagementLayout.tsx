'use client'

import React, {useEffect, useState} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {SubmitHandler} from 'react-hook-form'

import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Loader2} from 'lucide-react'

import {getTenantById, updateTenant as updateTenantService, deleteTenant as deleteTenantService} from '@/services/tenantService'
import {TenantResponse, UpdateTenantRequest} from '@/types/tenant'
import {DeleteTenantConfirmationModal} from '@/components/modals/DeleteTenantConfirmationModal'

import {useTenantRbac} from '@/hooks/useTenantRbac'
import {TenantRolesSection} from '@/components/tenants/rbac/TenantRolesSection'
import {TenantRolePermissionsModal} from '@/components/tenants/rbac/TenantRolePermissionsModal'
import {TenantCreateRoleModal} from '@/components/tenants/rbac/TenantCreateRoleModal'

import {PageHeader} from '@/components/layout/PageHeader'
import {TenantStaticInfo} from '@/components/tenants/management/TenantStaticInfo'
import {TenantDetailsForm, EditTenantFormData} from '@/components/tenants/management/TenantDetailsForm'
import {TransferTenantOwnershipSection} from '@/components/tenants/management/TransferTenantOwnershipSection'
import {DeleteTenantSection} from '@/components/tenants/management/DeleteTenantSection'

interface TenantManagementLayoutProps {
	/** Page title prefix (e.g., "Edit Tenant" or "Tenant Settings") */
	titlePrefix: string
	/** Description for the tenant information card */
	informationDescription: string
	/** Loading message text */
	loadingMessage: string
	/** Back button configuration */
	backButton: {
		text: string
		href?: string
		onClick?: () => void
	}
	/** Error page back button configuration */
	errorBackButton: {
		text: string
		href?: string
		onClick?: () => void
	}
	/** Not found page back button configuration */
	notFoundBackButton: {
		text: string
		href: string
	}
	/** Redirect path after successful deletion */
	deleteRedirectPath: string
	/** Additional query keys to invalidate on update */
	additionalUpdateQueryKeys?: string[]
	/** Additional query keys to invalidate on delete */
	additionalDeleteQueryKeys?: string[]
	/** Whether to show transfer ownership section */
	showTransferOwnership?: boolean
	/** Whether to show delete section */
	showDeleteSection?: boolean
	/** Additional content to render after role management */
	additionalContent?: React.ReactNode
	/** Conditional render function for ownership/delete sections */
	renderOwnershipSections?: (tenant: TenantResponse) => React.ReactNode
}

export function TenantManagementLayout({titlePrefix, informationDescription, loadingMessage, backButton, errorBackButton, notFoundBackButton, deleteRedirectPath, additionalUpdateQueryKeys = [], additionalDeleteQueryKeys = [], showTransferOwnership = true, showDeleteSection = true, additionalContent, renderOwnershipSections}: TenantManagementLayoutProps) {
	const router = useRouter()
	const params = useParams()
	const tenantId = params.tenantId as string
	const queryClient = useQueryClient()
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	// Tenant data query
	const {
		data: tenant,
		isLoading: isLoadingTenant,
		error: tenantError,
	} = useQuery<TenantResponse, Error>({
		queryKey: ['tenantDetails', tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId,
	})

	// Update tenant mutation
	const updateTenantMutation = useMutation({
		mutationFn: (data: UpdateTenantRequest) => updateTenantService(tenantId, data),
		onSuccess: (updatedTenant) => {
			console.log(`Tenant "${updatedTenant.name}" has been updated successfully.`)
			queryClient.invalidateQueries({queryKey: ['tenantDetails', tenantId]})
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
			// Invalidate additional query keys
			additionalUpdateQueryKeys.forEach((key) => {
				queryClient.invalidateQueries({queryKey: [key]})
			})
		},
		onError: (error: Error) => {
			console.error('Error Updating Tenant:', error.message)
		},
	})

	// Delete tenant mutation
	const deleteTenantMutation = useMutation({
		mutationFn: () => deleteTenantService(tenantId),
		onSuccess: () => {
			console.log(`Tenant "${tenant?.name}" has been deleted successfully.`)
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
			queryClient.removeQueries({queryKey: ['tenantDetails', tenantId]})
			// Invalidate additional query keys
			additionalDeleteQueryKeys.forEach((key) => {
				queryClient.invalidateQueries({queryKey: [key]})
			})
			router.push(deleteRedirectPath)
		},
		onError: (error: Error) => {
			console.error('Error Deleting Tenant:', error.message)
		},
	})

	// Tenant RBAC hook
	const tenantRbac = useTenantRbac(tenantId)

	useEffect(() => {
		if (tenantId) {
			tenantRbac.actions.setTenantId(tenantId)
		}
	}, [tenantId])

	// Event handlers
	const handleUpdateTenantSubmit: SubmitHandler<EditTenantFormData> = (data) => {
		updateTenantMutation.mutate(data)
	}

	const handleDeleteConfirm = () => {
		deleteTenantMutation.mutate()
	}

	// Loading state
	if (isLoadingTenant || tenantRbac.loading.initialRoles) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>{loadingMessage}</span>
			</div>
		)
	}

	// Error state
	if (tenantError) {
		return (
			<div className='container mx-auto p-4 text-center'>
				<PageHeader title='Error' description={tenantError.message} backButton={errorBackButton} />
			</div>
		)
	}

	// Not found state
	if (!tenant) {
		return (
			<div className='container mx-auto p-4 text-center'>
				<PageHeader title='Tenant Not Found' description='The requested tenant could not be found.' backButton={notFoundBackButton} />
			</div>
		)
	}

	return (
		<div className='container mx-auto p-4 space-y-8'>
			<PageHeader title={`${titlePrefix}: ${tenant.name}`} backButton={backButton} />

			{/* Tenant Information Card */}
			<Card>
				<CardHeader>
					<CardTitle>Tenant Information</CardTitle>
					<CardDescription>{informationDescription}</CardDescription>
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

			{/* Tenant Role Management Card */}
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

			{/* Additional Content */}
			{additionalContent && (
				<>
					<Separator />
					{additionalContent}
				</>
			)}

			{/* Ownership and Delete Sections */}
			{renderOwnershipSections ? (
				renderOwnershipSections(tenant)
			) : (
				<>
					{showTransferOwnership && (
						<>
							<Separator />
							<TransferTenantOwnershipSection tenantId={tenantId} currentTenantName={tenant.name} />
						</>
					)}

					{showDeleteSection && (
						<>
							<Separator />
							<DeleteTenantSection tenant={tenant} onDeleteInitiated={() => setIsDeleteModalOpen(true)} isDeleting={deleteTenantMutation.isPending} />
						</>
					)}
				</>
			)}
		</div>
	)
}
