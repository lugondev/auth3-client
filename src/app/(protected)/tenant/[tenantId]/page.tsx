'use client'

import React, {useEffect, useState, useCallback} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {SubmitHandler} from 'react-hook-form' // useForm and zodResolver removed
// z import removed

// Button import removed as it's handled by PageHeader or other components
// Input, Label, Switch removed
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card' // CardFooter removed
import {Separator} from '@/components/ui/separator'
import {Loader2} from 'lucide-react' // Specific icons like ArrowLeft, Trash2 etc. are in shared components

import {getTenantById, updateTenant as updateTenantService, deleteTenant as deleteTenantService, listUsersInTenant, updateUserInTenant, removeUserFromTenant} from '@/services/tenantService' // checkEmailExists, transferTenantOwnership removed
import {TenantResponse, UpdateTenantRequest} from '@/types/tenant'
import {TenantUsersTable} from '@/components/tenants/TenantUsersTable'
import {DeleteTenantConfirmationModal} from '@/components/modals/DeleteTenantConfirmationModal'

import {useTenantRbac} from '@/hooks/useTenantRbac'
import {useAuth} from '@/contexts/AuthContext'
import {loginTenantContext} from '@/services/authService'
import {TenantRolesSection} from '@/components/tenants/rbac/TenantRolesSection'
import {TenantRolePermissionsModal} from '@/components/tenants/rbac/TenantRolePermissionsModal'
import {TenantCreateRoleModal} from '@/components/tenants/rbac/TenantCreateRoleModal'

// Import new shared components
import {PageHeader} from '@/components/layout/PageHeader'
import {TenantStaticInfo} from '@/components/tenants/management/TenantStaticInfo'
import {TenantDetailsForm, EditTenantFormData} from '@/components/tenants/management/TenantDetailsForm' // Import EditTenantFormData
import {TransferTenantOwnershipSection} from '@/components/tenants/management/TransferTenantOwnershipSection'
import {DeleteTenantSection} from '@/components/tenants/management/DeleteTenantSection'

// editTenantFormSchema and local EditTenantFormData type definition removed

interface TenantUsersQueryProps {
	tenantId: string
}

// TenantUsersQuery component remains largely the same
function TenantUsersQuery({tenantId}: TenantUsersQueryProps) {
	const queryClient = useQueryClient()
	const page = 1
	const limit = 10

	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['tenantUsers', tenantId, page],
		queryFn: () => listUsersInTenant(tenantId, limit, (page - 1) * limit),
	})

	const updateUserMutation = useMutation({
		mutationFn: ({userId, isActive}: {userId: string; isActive: boolean}) =>
			updateUserInTenant(tenantId, userId, {
				status_in_tenant: isActive ? 'active' : 'disabled',
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	const removeUserMutation = useMutation({
		mutationFn: (userId: string) => removeUserFromTenant(tenantId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	const handleUpdateUser = useCallback(
		(userId: string, isActive: boolean) => {
			updateUserMutation.mutate({userId, isActive})
		},
		[updateUserMutation],
	)

	const handleRemoveUser = useCallback(
		(userId: string) => {
			removeUserMutation.mutate(userId)
		},
		[removeUserMutation],
	)

	if (isLoading) {
		return (
			<div className='flex justify-center p-4'>
				<Loader2 className='h-6 w-6 animate-spin' />
			</div>
		)
	}

	if (error) {
		return <div className='text-destructive'>Error loading users: {error.message}</div>
	}

	return <TenantUsersTable users={usersData?.users || []} onUpdateUser={handleUpdateUser} onRemoveUser={handleRemoveUser} />
}

// transferOwnershipFormSchema and TransferOwnershipFormData type removed (handled in TransferTenantOwnershipSection)

export default function TenantSettingsPage() {
	const router = useRouter()
	const params = useParams()
	const tenantId = params.tenantId as string
	const queryClient = useQueryClient()
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const {handleAuthSuccess} = useAuth()
	const tenantRbac = useTenantRbac(tenantId)
	const [loginTenantDone, setLoginTenantDone] = useState(false)

	useEffect(() => {
		if (tenantId && tenantRbac && Array.isArray(tenantRbac.roles) && !tenantRbac.roles.includes('admin') && !loginTenantDone) {
			// Not admin, login-tenant
			loginTenantContext(tenantId)
				.then((authResult) => {
					handleAuthSuccess(authResult)
					setLoginTenantDone(true)
				})
				.catch(() => {
					setLoginTenantDone(true)
				})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId, tenantRbac.roles, loginTenantDone, handleAuthSuccess])

	// State for transferEmailCheckResult removed (handled in TransferTenantOwnershipSection)

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
	// useForm for TransferOwnershipFormData removed

	const updateTenantMutation = useMutation({
		// Renamed from 'mutation'
		mutationFn: (data: UpdateTenantRequest) => updateTenantService(tenantId, data),
		onSuccess: (updatedTenant) => {
			console.log(`Tenant "${updatedTenant.name}" has been updated successfully.`)
			queryClient.invalidateQueries({queryKey: ['tenantDetails', tenantId]})
			// queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']}) // This might not be relevant for a tenant-specific page
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
			// queryClient.invalidateQueries({queryKey: ['allTenantsForAdmin']})
			queryClient.invalidateQueries({queryKey: ['ownedTenants']})
			queryClient.removeQueries({queryKey: ['tenantDetails', tenantId]})
			router.push('/dashboard') // Redirect to dashboard or a relevant page for tenants
		},
		onError: (error: Error) => {
			console.error('Error Deleting Tenant:', error.message)
		},
	})

	const handleUpdateTenantSubmit: SubmitHandler<EditTenantFormData> = (data) => {
		updateTenantMutation.mutate(data)
	}

	const handleDeleteConfirm = () => {
		deleteTenantMutation.mutate()
	}

	useEffect(() => {
		if (tenantId) {
			tenantRbac.actions.setTenantId(tenantId)
		}
	}, [tenantId, tenantRbac.actions.setTenantId])

	if (isLoadingTenant || tenantRbac.loading.initialRoles) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>Loading Tenant Settings...</span>
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
				<PageHeader title='Tenant Not Found' description='The requested tenant could not be found.' backButton={{text: 'Back to Dashboard', href: '/dashboard'}} />
			</div>
		)
	}

	return (
		<div className='container mx-auto p-4 space-y-8'>
			<PageHeader title={`Tenant Settings: ${tenant.name}`} backButton={{text: 'Back to Dashboard', href: '/dashboard'}} />

			<Card>
				<CardHeader>
					<CardTitle>Tenant Information</CardTitle>
					<CardDescription>View and update your tenant details.</CardDescription>
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

			{/* Tenant Users Management */}
			<Card>
				<CardHeader>
					<CardTitle>Tenant Users</CardTitle>
					<CardDescription>Manage users in this tenant.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<TenantUsersQuery tenantId={tenantId} />
					</div>
				</CardContent>
			</Card>

			<Separator />

			<DeleteTenantSection tenant={tenant} onDeleteInitiated={() => setIsDeleteModalOpen(true)} isDeleting={deleteTenantMutation.isPending} />
		</div>
	)
}
