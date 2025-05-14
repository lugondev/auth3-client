'use client'

import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Loader2, Trash2} from 'lucide-react'
import {TenantRbacLoadingState} from '@/types/tenantRbac'
import {DeleteRoleConfirmationModal} from './DeleteRoleConfirmationModal'

interface TenantRolesSectionProps {
	roles: string[]
	loading: TenantRbacLoadingState
	error: string | null
	selectedRole: string | null
	onOpenCreateRoleModal: () => void
	onOpenRolePermsModal: (roleName: string) => void
	onDeleteRole: (roleName: string) => Promise<void> // Added delete handler
}

export const TenantRolesSection: React.FC<TenantRolesSectionProps> = ({roles, loading, error, selectedRole, onOpenCreateRoleModal, onOpenRolePermsModal, onDeleteRole}) => {
	const [roleToDelete, setRoleToDelete] = useState<string | null>(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	const handleDeleteClick = (roleName: string) => {
		setRoleToDelete(roleName)
		setIsDeleteModalOpen(true)
	}

	const handleConfirmDelete = async () => {
		if (roleToDelete) {
			await onDeleteRole(roleToDelete)
			setIsDeleteModalOpen(false)
			setRoleToDelete(null)
		}
	}

	const handleCancelDelete = () => {
		setIsDeleteModalOpen(false)
		setRoleToDelete(null)
	}

	return (
		<div>
			<section aria-labelledby='tenant-roles-heading'>
				<div className='flex justify-between items-center mb-4'>
					<h2 id='tenant-roles-heading' className='text-xl font-semibold'>
						Tenant Roles
					</h2>
					<Button onClick={onOpenCreateRoleModal} size='sm' disabled={loading.action || loading.initialRoles}>
						{(loading.action || loading.initialRoles) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Create New Role
					</Button>
				</div>
				{loading.initialRoles && <Loader2 className='mx-auto my-4 h-8 w-8 animate-spin text-primary' />}
				{!loading.initialRoles && error && <p className='text-destructive text-center py-4'>Error loading roles: {error}</p>}
				{!loading.initialRoles && !error && roles.length === 0 && <p className='text-muted-foreground text-center py-4'>No roles defined for this tenant yet.</p>}
				{!loading.initialRoles && !error && roles.length > 0 && (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
						{roles.map((roleName) => (
							<div key={roleName} className='border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between'>
								<div>
									<h3 className='font-medium text-lg mb-1 truncate' title={roleName}>
										{roleName}
									</h3>
								</div>
								<div className='mt-3 space-y-2'>
									<Button variant='outline' size='sm' className='w-full' onClick={() => onOpenRolePermsModal(roleName)} disabled={loading.rolePermissions && selectedRole === roleName}>
										{loading.rolePermissions && selectedRole === roleName ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
										Manage Permissions
									</Button>
									<Button
										variant='destructive'
										// outline prop removed
										size='sm'
										className='w-full'
										onClick={() => handleDeleteClick(roleName)}
										disabled={loading.action} // Disable while any action is in progress
									>
										{loading.action && selectedRole === roleName ? ( // Show spinner if this role is being acted upon, could be more specific
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										) : (
											<Trash2 className='mr-2 h-4 w-4' />
										)}
										Delete Role
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>
			<DeleteRoleConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} roleName={roleToDelete || ''} /* Provide empty string as fallback */ isLoading={loading.action && selectedRole === roleToDelete} />
		</div>
	)
}
