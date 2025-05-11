'use client'

import React, {useEffect, useState, FormEvent} from 'react'
import {useParams} from 'next/navigation'
import {listUsersInTenant, addUserToTenant, updateUserInTenant, removeUserFromTenant} from '@/services/tenantService'
import {getAllRoles} from '@/services/rbacService'
import {TenantUserResponse, PaginatedTenantUsersResponse, AddUserToTenantRequest, UpdateTenantUserRequest} from '@/types/tenant'
import {RoleListOutput} from '@/types/rbac'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose} from '@/components/ui/dialog'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Checkbox} from '@/components/ui/checkbox'
import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from '@/components/ui/table'
import {Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis} from '@/components/ui/pagination'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Skeleton} from '@/components/ui/skeleton'

export default function TenantUsersPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const [users, setUsers] = useState<TenantUserResponse[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [totalPages, setTotalPages] = useState(0)
	const [totalTenantUsers, setTotalTenantUsers] = useState(0)

	const [showAddUserModal, setShowAddUserModal] = useState(false)
	const [newUserEmail, setNewUserEmail] = useState('')
	const [newUserRoles, setNewUserRoles] = useState<string[]>([])
	const [availableRoles, setAvailableRoles] = useState<string[]>([])
	const [isAddingUser, setIsAddingUser] = useState(false)

	const [editingUser, setEditingUser] = useState<TenantUserResponse | null>(null)
	const [showEditUserModal, setShowEditUserModal] = useState(false)
	const [editUserRoles, setEditUserRoles] = useState<string[]>([])
	const [isUpdatingUser, setIsUpdatingUser] = useState(false)

	const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false)
	const [userToRemove, setUserToRemove] = useState<{userId: string; email: string} | null>(null)

	const fetchTenantUsers = async () => {
		setLoading(true)
		setError(null)
		try {
			const offset = (currentPage - 1) * pageSize
			const result: PaginatedTenantUsersResponse = await listUsersInTenant(tenantId, pageSize, offset)
			setUsers(result.users || [])
			setTotalPages(result.total_pages || 0)
			setTotalTenantUsers(result.total || 0)
			if ((result.users || []).length === 0 && currentPage === 1) {
				toast.info('No users found in this tenant.')
			}
		} catch (err) {
			console.error(`Failed to fetch users for tenant ${tenantId}:`, err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			setError(errorMessage)
			toast.error(`Failed to load tenant users: ${errorMessage}`)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!tenantId) {
			setError('Tenant ID is missing.')
			setLoading(false)
			return
		}
		fetchTenantUsers()
	}, [tenantId, currentPage, pageSize])

	useEffect(() => {
		const fetchRoles = async () => {
			try {
				const result: RoleListOutput = await getAllRoles()
				setAvailableRoles(result.roles || [])
			} catch (err) {
				console.error('Failed to fetch available roles:', err)
				toast.error('Could not load roles for assignment.')
			}
		}
		fetchRoles()
	}, [])

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1))
	}

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages))
	}

	const handleAddUserSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!newUserEmail.trim() || newUserRoles.length === 0) {
			toast.error('Please provide an email and select at least one role.')
			return
		}
		setIsAddingUser(true)
		try {
			const addUserRequest: AddUserToTenantRequest = {
				email: newUserEmail,
				role_names: newUserRoles,
			}
			await addUserToTenant(tenantId, addUserRequest)
			toast.success(`User ${newUserEmail} invited/added to tenant.`)
			setNewUserEmail('')
			setNewUserRoles([])
			setShowAddUserModal(false) // Close modal
			fetchTenantUsers()
		} catch (err) {
			console.error('Failed to add user to tenant:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			toast.error(`Failed to add user: ${errorMessage}`)
		} finally {
			setIsAddingUser(false)
		}
	}

	const handleRoleSelection = (roleName: string) => {
		setNewUserRoles((prev) => (prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]))
	}

	const handleOpenEditUserForm = (userToEdit: TenantUserResponse) => {
		setEditingUser(userToEdit)
		setEditUserRoles(userToEdit.roles || [])
		setShowEditUserModal(true)
		setShowAddUserModal(false) // Ensure add modal is closed if edit is opened
	}

	const handleEditUserRoleSelection = (roleName: string) => {
		setEditUserRoles((prev) => (prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]))
	}

	const handleEditUserSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!editingUser) {
			toast.error('No user selected for editing.')
			return
		}
		if (editUserRoles.length === 0) {
			toast.error('User must have at least one role.')
			return
		}
		setIsUpdatingUser(true)
		try {
			const updateData: UpdateTenantUserRequest = {
				role_names: editUserRoles,
			}
			await updateUserInTenant(tenantId, editingUser.user_id, updateData)
			toast.success(`User ${editingUser.email} roles updated successfully!`)
			setShowEditUserModal(false)
			setEditingUser(null)
			fetchTenantUsers()
		} catch (err) {
			console.error('Failed to update user in tenant:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			toast.error(`Failed to update user: ${errorMessage}`)
		} finally {
			setIsUpdatingUser(false)
		}
	}

	const handleRemoveUserConfirmation = (userId: string, userEmail: string) => {
		setUserToRemove({userId, email: userEmail})
		setShowRemoveConfirmDialog(true)
	}

	const confirmRemoveUser = async () => {
		if (!userToRemove) return
		try {
			await removeUserFromTenant(tenantId, userToRemove.userId)
			toast.success(`User ${userToRemove.email} removed from tenant successfully!`)
			fetchTenantUsers() // Refresh the list
		} catch (err) {
			console.error(`Failed to remove user ${userToRemove.userId} from tenant:`, err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			toast.error(`Failed to remove user: ${errorMessage}`)
		} finally {
			setShowRemoveConfirmDialog(false)
			setUserToRemove(null)
		}
	}

	if (loading && users.length === 0) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Manage Users in Tenant ({tenantId || 'N/A'})</h1>
				<div className='space-y-2 mt-4'>
					<Skeleton className='h-12 w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Tenant Users ({tenantId || 'N/A'})</h1>
				<Alert variant='destructive'>
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-semibold'>Manage Users in Tenant ({tenantId})</h1>
				<Dialog
					open={showAddUserModal}
					onOpenChange={(isOpen) => {
						setShowAddUserModal(isOpen)
						if (isOpen) {
							setShowEditUserModal(false) // Close edit modal if open
							setEditingUser(null)
						} else {
							// Reset add user form fields when dialog closes
							setNewUserEmail('')
							setNewUserRoles([])
						}
					}}>
					<DialogTrigger asChild>
						<Button onClick={() => setShowAddUserModal(true)}>Add User to Tenant</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Add New User to Tenant</DialogTitle>
							<DialogDescription>Enter the email and assign roles for the new user.</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleAddUserSubmit}>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor='newUserEmail' className='text-right'>
										User Email
									</Label>
									<Input id='newUserEmail' type='email' value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className='col-span-3' placeholder='user@example.com' required />
								</div>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label className='text-right'>Assign Roles</Label>
									<div className='col-span-3'>
										{availableRoles.length > 0 ? (
											<div className='space-y-2 max-h-32 overflow-y-auto border p-2 rounded'>
												{availableRoles.map((role) => (
													<div key={`add-role-${role}`} className='flex items-center space-x-2'>
														<Checkbox id={`add-role-${role}`} checked={newUserRoles.includes(role)} onCheckedChange={() => handleRoleSelection(role)} />
														<Label htmlFor={`add-role-${role}`} className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
															{role}
														</Label>
													</div>
												))}
											</div>
										) : (
											<p className='text-sm text-gray-500'>No roles available to assign.</p>
										)}
									</div>
								</div>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button type='button' variant='outline'>
										Cancel
									</Button>
								</DialogClose>
								<Button type='submit' disabled={isAddingUser}>
									{isAddingUser ? 'Adding User...' : 'Add User'}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Dialog
				open={showEditUserModal && !!editingUser}
				onOpenChange={(isOpen) => {
					setShowEditUserModal(isOpen)
					if (!isOpen) {
						setEditingUser(null) // Clear editing user when dialog closes
					}
				}}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>Edit User: {editingUser?.email}</DialogTitle>
						<DialogDescription>
							Manage roles for {editingUser?.first_name} {editingUser?.last_name} (ID: {editingUser?.user_id}).
						</DialogDescription>
					</DialogHeader>
					{editingUser && (
						<form onSubmit={handleEditUserSubmit}>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label className='text-right'>Manage Roles</Label>
									<div className='col-span-3'>
										{availableRoles.length > 0 ? (
											<div className='space-y-2 max-h-32 overflow-y-auto border p-2 rounded'>
												{availableRoles.map((role) => (
													<div key={`edit-role-${role}`} className='flex items-center space-x-2'>
														<Checkbox id={`edit-role-${role}`} checked={editUserRoles.includes(role)} onCheckedChange={() => handleEditUserRoleSelection(role)} />
														<Label htmlFor={`edit-role-${role}`} className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
															{role}
														</Label>
													</div>
												))}
											</div>
										) : (
											<p className='text-sm text-gray-500'>No roles available.</p>
										)}
									</div>
								</div>
								{/* TODO: Add status editing if required */}
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button type='button' variant='outline'>
										Cancel
									</Button>
								</DialogClose>
								<Button type='submit' disabled={isUpdatingUser} variant='default'>
									{isUpdatingUser ? 'Updating...' : 'Update Roles'}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{userToRemove && (
				<AlertDialog open={showRemoveConfirmDialog} onOpenChange={setShowRemoveConfirmDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action will remove user {userToRemove.email} (ID: {userToRemove.userId}) from this tenant. This cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={() => setUserToRemove(null)}>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={confirmRemoveUser}>Remove User</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			{users.length === 0 && !loading && !showAddUserModal && !showEditUserModal ? (
				<p>No users found in this tenant. You can add users using the button above.</p>
			) : (
				<div className='overflow-x-auto mt-4 bg-white shadow rounded'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User ID</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Roles in Tenant</TableHead>
								<TableHead>Status in Tenant</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.user_id}>
									<TableCell>{user.user_id}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										{user.first_name} {user.last_name}
									</TableCell>
									<TableCell>{user.roles.join(', ')}</TableCell>
									<TableCell>{user.status_in_tenant}</TableCell>
									<TableCell className='space-x-2'>
										<Button variant='outline' size='sm' onClick={() => handleOpenEditUserForm(user)}>
											Edit
										</Button>
										<AlertDialogTrigger asChild>
											<Button variant='destructive' size='sm' onClick={() => handleRemoveUserConfirmation(user.user_id, user.email)}>
												Remove
											</Button>
										</AlertDialogTrigger>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className='mt-6 flex flex-col sm:flex-row justify-between items-center gap-4'>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href='#'
									onClick={(e) => {
										e.preventDefault()
										handlePreviousPage()
									}}
									className={currentPage === 1 || loading ? 'pointer-events-none opacity-50' : ''}
								/>
							</PaginationItem>
							{/* Basic pagination, can be enhanced with page numbers */}
							<PaginationItem>
								<PaginationLink href='#' isActive>
									{currentPage}
								</PaginationLink>
							</PaginationItem>
							{totalPages > currentPage && (
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
							)}
							{/* Display last page if not current and totalPages > 1 */}
							{totalPages > 1 && currentPage !== totalPages && (
								<PaginationItem>
									<PaginationLink
										href='#'
										onClick={(e) => {
											e.preventDefault()
											setCurrentPage(totalPages)
										}}>
										{totalPages}
									</PaginationLink>
								</PaginationItem>
							)}
							<PaginationItem>
								<PaginationNext
									href='#'
									onClick={(e) => {
										e.preventDefault()
										handleNextPage()
									}}
									className={currentPage === totalPages || loading ? 'pointer-events-none opacity-50' : ''}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>

					<span className='text-sm text-gray-600'>
						Page {currentPage} of {totalPages} (Total Users: {totalTenantUsers})
					</span>

					<div className='flex items-center space-x-2'>
						<Label htmlFor='pageSize' className='text-sm text-gray-600'>
							Items per page:
						</Label>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value))
								setCurrentPage(1) // Reset to first page on page size change
							}}
							disabled={loading}>
							<SelectTrigger id='pageSize' className='w-[70px]'>
								<SelectValue placeholder={String(pageSize)} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='5'>5</SelectItem>
								<SelectItem value='10'>10</SelectItem>
								<SelectItem value='20'>20</SelectItem>
								<SelectItem value='50'>50</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</div>
	)
}
