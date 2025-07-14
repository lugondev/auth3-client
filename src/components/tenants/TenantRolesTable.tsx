'use client'

import React, {useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Loader2, Trash2, Plus, Settings, Edit} from 'lucide-react'

interface TenantRolesTableProps {
	customRoles: string[]
	defaultRoles: string[]
	onCreateRole?: (roleName: string) => Promise<void>
	onDeleteRole?: (roleName: string) => Promise<void>
	onEditRole?: (oldRoleName: string, newRoleName: string) => Promise<void>
	onManagePermissions?: (roleName: string) => void
	isLoading?: boolean
}

export const TenantRolesTable: React.FC<TenantRolesTableProps> = ({
	customRoles,
	defaultRoles,
	onCreateRole,
	onDeleteRole,
	onEditRole,
	onManagePermissions,
	isLoading = false,
}) => {
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedRole, setSelectedRole] = useState<string | null>(null)
	const [newRoleName, setNewRoleName] = useState('')
	const [editRoleName, setEditRoleName] = useState('')
	const [creating, setCreating] = useState(false)
	const [editing, setEditing] = useState(false)
	const [deleting, setDeleting] = useState(false)

	const handleCreateRole = async () => {
		if (!newRoleName.trim() || !onCreateRole) return

		setCreating(true)
		try {
			await onCreateRole(newRoleName.trim())
			setNewRoleName('')
			setCreateDialogOpen(false)
		} catch (error) {
			console.error('Error creating role:', error)
		} finally {
			setCreating(false)
		}
	}

	const handleEditRole = async () => {
		if (!editRoleName.trim() || !selectedRole || !onEditRole) return

		setEditing(true)
		try {
			await onEditRole(selectedRole, editRoleName.trim())
			setEditRoleName('')
			setEditDialogOpen(false)
			setSelectedRole(null)
		} catch (error) {
			console.error('Error editing role:', error)
		} finally {
			setEditing(false)
		}
	}

	const handleDeleteRole = async () => {
		if (!selectedRole || !onDeleteRole) return

		setDeleting(true)
		try {
			await onDeleteRole(selectedRole)
			setDeleteDialogOpen(false)
			setSelectedRole(null)
		} catch (error) {
			console.error('Error deleting role:', error)
		} finally {
			setDeleting(false)
		}
	}

	const openEditDialog = (roleName: string) => {
		setSelectedRole(roleName)
		setEditRoleName(roleName)
		setEditDialogOpen(true)
	}

	const openDeleteDialog = (roleName: string) => {
		setSelectedRole(roleName)
		setDeleteDialogOpen(true)
	}

	// Combine and sort roles: default roles first, then custom roles
	const allRoles = [...defaultRoles.sort(), ...customRoles.sort()]

	// Default/system roles that shouldn't be deleted or edited
	const isSystemRole = (roleName: string) => {
		return defaultRoles.includes(roleName) || ['TenantOwner', 'TenantAdmin', 'TenantMember', 'TenantViewer'].includes(roleName)
	}

	if (isLoading) {
		return (
			<div className='flex justify-center p-8'>
				<Loader2 className='h-8 w-8 animate-spin' />
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<h3 className='text-lg font-semibold'>Tenant Roles</h3>
				{onCreateRole && (
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className='h-4 w-4 mr-2' />
						Create Role
					</Button>
				)}
			</div>

			{allRoles.length === 0 ? (
				<p className='text-muted-foreground text-center py-8'>No roles found for this tenant.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Role Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead className='text-right'>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{allRoles.map((role: string) => (
							<TableRow key={role}>
								<TableCell className='font-medium'>{role}</TableCell>
								<TableCell>
									{isSystemRole(role) ? (
										<Badge variant='secondary'>Default Role</Badge>
									) : (
										<Badge variant='outline'>Custom Role</Badge>
									)}
								</TableCell>
								<TableCell className='text-right space-x-2'>
									{onManagePermissions && (
										<Button 
											variant='outline' 
											size='sm' 
											onClick={() => onManagePermissions(role)}
											title='Manage permissions'
										>
											<Settings className='h-4 w-4' />
										</Button>
									)}
									{onEditRole && !isSystemRole(role) && (
										<Button 
											variant='outline' 
											size='sm' 
											onClick={() => openEditDialog(role)}
											title='Edit role name'
										>
											<Edit className='h-4 w-4' />
										</Button>
									)}
									{onDeleteRole && !isSystemRole(role) && (
										<Button 
											variant='destructive' 
											size='sm' 
											onClick={() => openDeleteDialog(role)}
											title='Delete role'
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{/* Create Role Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Role</DialogTitle>
						<DialogDescription>Create a new custom role for this tenant.</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div>
							<Label htmlFor='roleName'>Role Name</Label>
							<Input
								id='roleName'
								value={newRoleName}
								onChange={(e) => setNewRoleName(e.target.value)}
								placeholder='Enter role name (e.g., ProjectManager)'
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setCreateDialogOpen(false)} disabled={creating}>
							Cancel
						</Button>
						<Button onClick={handleCreateRole} disabled={creating || !newRoleName.trim()}>
							{creating ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Plus className='h-4 w-4 mr-2' />}
							Create Role
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Role Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Role</DialogTitle>
						<DialogDescription>Edit the name of this custom role.</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div>
							<Label htmlFor='editRoleName'>Role Name</Label>
							<Input
								id='editRoleName'
								value={editRoleName}
								onChange={(e) => setEditRoleName(e.target.value)}
								placeholder='Enter new role name'
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setEditDialogOpen(false)} disabled={editing}>
							Cancel
						</Button>
						<Button onClick={handleEditRole} disabled={editing || !editRoleName.trim() || editRoleName === selectedRole}>
							{editing ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Edit className='h-4 w-4 mr-2' />}
							Update Role
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Role Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Role</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete the role "{selectedRole}"? This action cannot be undone and will remove
							this role from all users.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction asChild>
							<Button variant='destructive' onClick={handleDeleteRole} disabled={deleting}>
								{deleting ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Trash2 className='h-4 w-4 mr-2' />}
								Delete Role
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
