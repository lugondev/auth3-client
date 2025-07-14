'use client'

import React, {useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {Loader2, Trash2, Settings, Shield, Plus, Lock, Eye, Edit} from 'lucide-react'
import {TenantRbacLoadingState} from '@/types/tenantRbac'
import {DeleteRoleConfirmationModal} from './DeleteRoleConfirmationModal'

interface TenantRolesTableProps {
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
	rolePermissionsMap: Record<string, string[][]>
}

const SYSTEM_ROLES = ['TenantOwner', 'TenantAdmin', 'TenantMember', 'TenantViewer']

const ROLE_DESCRIPTIONS: Record<string, string> = {
	TenantOwner: 'Full control over tenant including ownership transfer and deletion',
	TenantAdmin: 'Administrative access to manage users, roles, and tenant settings',
	TenantMember: 'Standard user with basic access to tenant resources',
	TenantViewer: 'Read-only access to tenant information and resources',
}

export const TenantRolesTable: React.FC<TenantRolesTableProps> = ({
	roles,
	loading,
	error,
	selectedRole,
	canManageRoles,
	onOpenCreateRoleModal,
	onOpenRolePermsModal,
	onDeleteRole,
	rolePermissionsMap,
}) => {
	const [roleToDelete, setRoleToDelete] = useState<string | null>(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	// Combine and separate roles
	const systemRoles = roles.default || []
	const customRoles = roles.custom || []
	const allRoles = [...systemRoles, ...customRoles]

	const isSystemRole = (roleName: string) => SYSTEM_ROLES.includes(roleName)
	const getPermissionCount = (roleName: string) => rolePermissionsMap[roleName]?.length || 0

	const handleDeleteClick = (roleName: string) => {
		if (isSystemRole(roleName)) return
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

	if (loading.initialRoles) {
		return (
			<div className='flex justify-center items-center py-12'>
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

	if (allRoles.length === 0) {
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
		<TooltipProvider>
			<div className='space-y-4'>
				{/* Header with Create Button */}
				<div className='flex justify-between items-center'>
					<div>
						<h3 className='text-lg font-semibold'>Role Management</h3>
						<p className='text-sm text-muted-foreground'>
							{allRoles.length} role{allRoles.length !== 1 ? 's' : ''} • {systemRoles.length} system • {customRoles.length} custom
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

				{/* Roles Table */}
				<div className='border rounded-lg overflow-hidden'>
					<Table>
						<TableHeader>
							<TableRow className='bg-muted/50'>
								<TableHead className='w-[200px]'>Role Name</TableHead>
								<TableHead className='w-[120px]'>Type</TableHead>
								<TableHead className='w-[100px] text-center'>Permissions</TableHead>
								<TableHead className='hidden md:table-cell'>Description</TableHead>
								<TableHead className='w-[120px] text-right'>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{/* System Roles First */}
							{systemRoles.map((roleName) => (
								<TableRow 
									key={roleName} 
									className={`hover:bg-muted/30 transition-colors ${
										selectedRole === roleName ? 'bg-primary/5 border-l-4 border-primary' : ''
									}`}
								>
									<TableCell className='font-medium'>
										<div className='flex items-center gap-2'>
											<Lock className='h-4 w-4 text-muted-foreground' />
											{roleName}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant='secondary' className='text-xs'>
											<Lock className='h-3 w-3 mr-1' />
											System
										</Badge>
									</TableCell>
									<TableCell className='text-center'>
										<span className='text-sm font-mono bg-muted px-2 py-1 rounded'>
											{getPermissionCount(roleName)}
										</span>
									</TableCell>
									<TableCell className='hidden md:table-cell text-sm text-muted-foreground'>
										{ROLE_DESCRIPTIONS[roleName] || 'System role'}
									</TableCell>
									<TableCell className='text-right'>
										<div className='flex items-center justify-end gap-1'>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button 
														variant='ghost' 
														size='sm'
														onClick={() => onOpenRolePermsModal(roleName)}
														disabled={loading.rolePermissions && selectedRole === roleName}
													>
														{loading.rolePermissions && selectedRole === roleName ? (
															<Loader2 className='h-4 w-4 animate-spin' />
														) : (
															<Eye className='h-4 w-4' />
														)}
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{canManageRoles ? 'Manage permissions' : 'View permissions'}
												</TooltipContent>
											</Tooltip>
										</div>
									</TableCell>
								</TableRow>
							))}

							{/* Custom Roles */}
							{customRoles.map((roleName) => (
								<TableRow 
									key={roleName} 
									className={`hover:bg-muted/30 transition-colors ${
										selectedRole === roleName ? 'bg-primary/5 border-l-4 border-primary' : ''
									}`}
								>
									<TableCell className='font-medium'>
										<div className='flex items-center gap-2'>
											<Settings className='h-4 w-4 text-blue-600' />
											{roleName}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant='outline' className='text-xs'>
											<Settings className='h-3 w-3 mr-1' />
											Custom
										</Badge>
									</TableCell>
									<TableCell className='text-center'>
										<span className='text-sm font-mono bg-muted px-2 py-1 rounded'>
											{getPermissionCount(roleName)}
										</span>
									</TableCell>
									<TableCell className='hidden md:table-cell text-sm text-muted-foreground'>
										Custom role created by tenant
									</TableCell>
									<TableCell className='text-right'>
										<div className='flex items-center justify-end gap-1'>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button 
														variant='ghost' 
														size='sm'
														onClick={() => onOpenRolePermsModal(roleName)}
														disabled={loading.rolePermissions && selectedRole === roleName}
													>
														{loading.rolePermissions && selectedRole === roleName ? (
															<Loader2 className='h-4 w-4 animate-spin' />
														) : (
															<Shield className='h-4 w-4' />
														)}
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{canManageRoles ? 'Manage permissions' : 'View permissions'}
												</TooltipContent>
											</Tooltip>

											{canManageRoles && (
												<Tooltip>
													<TooltipTrigger asChild>
														<Button 
															variant='ghost' 
															size='sm'
															onClick={() => handleDeleteClick(roleName)}
															disabled={loading.action}
															className='text-destructive hover:text-destructive hover:bg-destructive/10'
														>
															{loading.action && selectedRole === roleName ? (
																<Loader2 className='h-4 w-4 animate-spin' />
															) : (
																<Trash2 className='h-4 w-4' />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														Delete role
													</TooltipContent>
												</Tooltip>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Empty state for custom roles */}
				{systemRoles.length > 0 && customRoles.length === 0 && canManageRoles && (
					<div className='text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/20'>
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
		</TooltipProvider>
	)
}
