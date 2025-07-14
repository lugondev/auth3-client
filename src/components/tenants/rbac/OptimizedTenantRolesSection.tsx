'use client'

import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Loader2, Trash2, Settings, Shield, Plus, Lock} from 'lucide-react'
import {TenantRbacLoadingState} from '@/types/tenantRbac'
import {DeleteRoleConfirmationModal} from './DeleteRoleConfirmationModal'

interface OptimizedTenantRolesSectionProps {
	roles: {
		custom: string[]
		default: string[]
	}
	loading: TenantRbacLoadingState
	error: string | null
	selectedRole: string | null
	canManageRoles: boolean
	onOpenCreateRoleModal: () => void
	onOpenRolePermsModal: (roleName: string) => void
	onDeleteRole: (roleName: string) => Promise<void>
}

const SYSTEM_ROLES = ['TenantOwner', 'TenantAdmin', 'TenantMember', 'TenantViewer']

const ROLE_DESCRIPTIONS: Record<string, string> = {
	TenantOwner: 'Full control over tenant including ownership transfer and deletion',
	TenantAdmin: 'Administrative access to manage users, roles, and tenant settings',
	TenantMember: 'Standard user with basic access to tenant resources',
	TenantViewer: 'Read-only access to tenant information and resources',
}

export const OptimizedTenantRolesSection: React.FC<OptimizedTenantRolesSectionProps> = ({
	roles,
	loading,
	error,
	selectedRole,
	canManageRoles,
	onOpenCreateRoleModal,
	onOpenRolePermsModal,
	onDeleteRole,
}) => {
	const [roleToDelete, setRoleToDelete] = useState<string | null>(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	// Separate system and custom roles - use the structured format from useTenantRbac
	const systemRoles = roles.default || []
	const customRoles = roles.custom || []

	const isSystemRole = (roleName: string) => SYSTEM_ROLES.includes(roleName)

	const totalRoles = systemRoles.length + customRoles.length

	const handleDeleteClick = (roleName: string) => {
		if (isSystemRole(roleName)) return // Extra safety check
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

	const RoleCard = ({roleName, isSystem}: {roleName: string; isSystem: boolean}) => (
		<Card key={roleName} className={`transition-all duration-200 hover:shadow-md ${
			selectedRole === roleName ? 'ring-2 ring-primary' : ''
		} ${isSystem ? 'bg-muted/30' : 'bg-background'}`}>
			<CardHeader className='pb-2'>
				<div className='flex items-start justify-between'>
					<div className='space-y-1 min-w-0 flex-1'>
						<CardTitle className='text-base font-medium truncate' title={roleName}>
							{roleName}
						</CardTitle>
						{isSystem && ROLE_DESCRIPTIONS[roleName] && (
							<p className='text-xs text-muted-foreground line-clamp-2'>
								{ROLE_DESCRIPTIONS[roleName]}
							</p>
						)}
					</div>
					<div className='flex flex-col items-end gap-1 ml-2'>
						{isSystem ? (
							<Badge variant='secondary' className='text-xs'>
								<Lock className='h-3 w-3 mr-1' />
								System
							</Badge>
						) : (
							<Badge variant='outline' className='text-xs'>
								<Settings className='h-3 w-3 mr-1' />
								Custom
							</Badge>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				<div className='space-y-2'>
					<Button 
						variant='outline' 
						size='sm' 
						className='w-full' 
						onClick={() => onOpenRolePermsModal(roleName)} 
						disabled={loading.rolePermissions && selectedRole === roleName}
					>
						{loading.rolePermissions && selectedRole === roleName ? (
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
						) : (
							<Shield className='mr-2 h-4 w-4' />
						)}
						{canManageRoles ? 'Manage Permissions' : 'View Permissions'}
					</Button>
					
					{!isSystem && canManageRoles && (
						<Button
							variant='destructive'
							size='sm'
							className='w-full'
							onClick={() => handleDeleteClick(roleName)}
							disabled={loading.action}
						>
							{loading.action && selectedRole === roleName ? (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							) : (
								<Trash2 className='mr-2 h-4 w-4' />
							)}
							Delete Role
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	)

	if (loading.initialRoles) {
		return (
			<div className='flex justify-center items-center py-8'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>Loading roles...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className='text-center py-8'>
				<div className='text-destructive bg-destructive/10 p-4 rounded-lg inline-block'>
					<p className='font-medium'>Error loading roles</p>
					<p className='text-sm mt-1'>{error}</p>
				</div>
			</div>
		)
	}

	if (totalRoles === 0) {
		return (
			<div className='text-center py-12'>
				<Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
				<h3 className='text-lg font-semibold mb-2'>No roles found</h3>
				<p className='text-muted-foreground mb-4'>
					No roles have been defined for this tenant yet.
				</p>
				{canManageRoles && (
					<Button onClick={onOpenCreateRoleModal}>
						<Plus className='h-4 w-4 mr-2' />
						Create Your First Role
					</Button>
				)}
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Header with Create Button */}
			<div className='flex justify-between items-center'>
				<div>
					<h3 className='text-lg font-semibold'>Role Management</h3>
					<p className='text-sm text-muted-foreground'>
						System roles are predefined, custom roles can be modified
					</p>
				</div>
				{canManageRoles && (
					<Button onClick={onOpenCreateRoleModal} disabled={loading.action}>
						{loading.action ? (
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
						) : (
							<Plus className='mr-2 h-4 w-4' />
						)}
						Create Role
					</Button>
				)}
			</div>

			{/* System Roles Section */}
			{systemRoles.length > 0 && (
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Lock className='h-4 w-4 text-muted-foreground' />
						<h4 className='font-medium text-sm text-muted-foreground uppercase tracking-wide'>
							System Roles ({systemRoles.length})
						</h4>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
						{systemRoles.map((roleName) => (
							<RoleCard key={roleName} roleName={roleName} isSystem={true} />
						))}
					</div>
				</div>
			)}

			{/* Separator if both sections exist */}
			{systemRoles.length > 0 && customRoles.length > 0 && <Separator />}

			{/* Custom Roles Section */}
			{customRoles.length > 0 && (
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Settings className='h-4 w-4 text-muted-foreground' />
						<h4 className='font-medium text-sm text-muted-foreground uppercase tracking-wide'>
							Custom Roles ({customRoles.length})
						</h4>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
						{customRoles.map((roleName) => (
							<RoleCard key={roleName} roleName={roleName} isSystem={false} />
						))}
					</div>
				</div>
			)}

			{/* Show create button if no custom roles exist but system roles do */}
			{systemRoles.length > 0 && customRoles.length === 0 && canManageRoles && (
				<div className='text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg'>
					<Settings className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
					<p className='text-sm text-muted-foreground mb-4'>
						No custom roles created yet. Create custom roles to fit your organization's needs.
					</p>
					<Button variant='outline' onClick={onOpenCreateRoleModal}>
						<Plus className='h-4 w-4 mr-2' />
						Create Custom Role
					</Button>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteRoleConfirmationModal 
				isOpen={isDeleteModalOpen} 
				onClose={handleCancelDelete} 
				onConfirm={handleConfirmDelete} 
				roleName={roleToDelete || ''} 
				isLoading={loading.action && selectedRole === roleToDelete} 
			/>
		</div>
	)
}
