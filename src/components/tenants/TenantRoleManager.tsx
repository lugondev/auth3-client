'use client'

import React, {useState} from 'react'
import {Loader2} from 'lucide-react'

import {TenantRolesTable} from './TenantRolesTable'
import {useTenantRoles} from '@/hooks/use-tenant-roles'
import {toast} from 'sonner'

interface TenantRoleManagerProps {
	tenantId: string
}

export const TenantRoleManager: React.FC<TenantRoleManagerProps> = ({tenantId}) => {
	const [selectedRole, setSelectedRole] = useState<string | null>(null)

	const {
		roles,
		isLoading,
		error,
		handleCreateRole,
		handleDeleteRole,
		isCreating,
		isDeleting,
	} = useTenantRoles({
		tenantId,
	})

	const handleCreateRoleWithToast = async (roleName: string) => {
		try {
			await handleCreateRole(roleName)
			toast.success(`Role "${roleName}" created successfully`)
		} catch (error) {
			toast.error(`Failed to create role: ${error instanceof Error ? error.message : 'Unknown error'}`)
			throw error
		}
	}

	const handleDeleteRoleWithToast = async (roleName: string) => {
		try {
			await handleDeleteRole(roleName)
			toast.success(`Role "${roleName}" deleted successfully`)
		} catch (error) {
			toast.error(`Failed to delete role: ${error instanceof Error ? error.message : 'Unknown error'}`)
			throw error
		}
	}

	const handleManagePermissions = (roleName: string) => {
		setSelectedRole(roleName)
		// TODO: Open permissions management dialog/panel
		toast.info(`Managing permissions for role "${roleName}" - Feature coming soon`)
	}

	if (isLoading) {
		return (
			<div className='flex justify-center p-4'>
				<Loader2 className='h-6 w-6 animate-spin' />
			</div>
		)
	}

	if (error) {
		return <div className='text-destructive'>Error loading roles: {error.message}</div>
	}

	return (
		<div className='space-y-6'>
			<TenantRolesTable
				customRoles={roles.custom}
				defaultRoles={roles.default}
				onCreateRole={handleCreateRoleWithToast}
				onDeleteRole={handleDeleteRoleWithToast}
				onManagePermissions={handleManagePermissions}
				isLoading={isCreating || isDeleting}
			/>

			{/* TODO: Add permissions management panel here when selectedRole is set */}
			{selectedRole && (
				<div className='mt-6 p-4 border rounded-lg bg-muted/50'>
					<h4 className='font-semibold mb-2'>Permissions for "{selectedRole}"</h4>
					<p className='text-sm text-muted-foreground'>
						Permission management interface will be implemented here.
						<br />
						This will allow you to view and modify permissions for the selected role.
					</p>
				</div>
			)}
		</div>
	)
}
