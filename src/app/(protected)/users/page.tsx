'use client'

import React, {useEffect, useState, useCallback} from 'react'
import apiClient, {UserOutput, PaginatedUsers, UserSearchQuery, UserStatus} from '@/lib/apiClient'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog' // Import AlertDialog components
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose} from '@/components/ui/dialog' // Import Dialog components (Removed DialogTrigger)
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label' // Import Label
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {DotsHorizontalIcon} from '@radix-ui/react-icons'
import {useDebounce} from 'use-debounce'
import {UserTable, ColumnDefinition} from '@/components/users/UserTable'
import {toast} from 'sonner' // Import toast from sonner

// Define initial filter state
const initialFilters: Omit<UserSearchQuery, 'role_name'> & {role_name?: string} = {
	query: '',
	status: undefined,
	role_name: undefined,
	page: 1,
	page_size: 10,
}

export default function UsersPage() {
	const [users, setUsers] = useState<UserOutput[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})
	const [currentPage, setCurrentPage] = useState(initialFilters.page || 1)
	const [pageSize, setPageSize] = useState(initialFilters.page_size || 10)
	const [totalPages, setTotalPages] = useState(0)
	const [totalUsers, setTotalUsers] = useState(0)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false) // State for delete confirmation dialog
	const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null) // State for user ID to delete
	const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false) // State for status change confirmation
	const [statusChangeDetails, setStatusChangeDetails] = useState<{userId: string; status: UserStatus} | null>(null) // State for pending status change details
	const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false) // State for reset password confirmation
	const [resetPasswordDetails, setResetPasswordDetails] = useState<{userId: string; email: string} | null>(null) // State for pending reset password details
	const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false) // State for change password dialog
	const [userToChangePassword, setUserToChangePassword] = useState<UserOutput | null>(null) // State for user whose password to change
	const [newPassword, setNewPassword] = useState('') // State for new password input
	const [confirmPassword, setConfirmPassword] = useState('') // State for confirm password input

	// Update filter state type
	const [filters, setFilters] = useState<Omit<UserSearchQuery, 'role_id'> & {role_name?: string}>(initialFilters)
	const [debouncedQuery] = useDebounce(filters.query, 500) // Debounce search query

	// Placeholder: Roles state - Fetch simple names now, or adapt if API changes
	// Using simple strings as GetAllRoles returns []string
	const [roles, setRoles] = useState<string[]>([]) // State to hold role names
	const [roleError, setRoleError] = useState<string | null>(null) // State for role fetching errors

	// Effect to fetch roles on component mount
	useEffect(() => {
		const fetchRoles = async () => {
			setRoleError(null)
			try {
				// Adjust if the actual response wraps the array, e.g., response.data.roles
				const response = await apiClient.get<{roles: string[]}>('/api/v1/rbac/roles')
				// Filter out potential duplicates if necessary, though GetAllRoles should return unique
				const uniqueRoles = Array.from(new Set(response.data.roles))
				setRoles(uniqueRoles)
			} catch (err) {
				console.error('Failed to fetch roles:', err)
				setRoleError('Could not load roles for filtering.')
				setRoles([]) // Clear roles on error
			}
		}
		fetchRoles()
	}, []) // Corrected closing braces/parentheses and added empty dependency array

	// Opens the delete confirmation dialog
	const handleDeleteUser = (userId: string) => {
		setUserToDeleteId(userId)
		setIsDeleteDialogOpen(true)
	}

	// Executes the delete action after confirmation
	const confirmDeleteUser = () => {
		if (userToDeleteId) {
			console.log('Confirmed delete user:', userToDeleteId)
			// TODO: Implement actual API call for deletion here
			toast.info('Delete action triggered', {
				description: `Would delete user ${userToDeleteId}. API call not yet implemented.`,
			})
			// Placeholder for API call:
			// try {
			//   await apiClient.delete(`/api/v1/users/${userToDeleteId}`);
			//   toast.success('User Deleted', { description: `User ${userToDeleteId} has been deleted.` });
			//   fetchUsers(); // Refresh list after deletion
			// } catch (err) {
			//   console.error('Failed to delete user:', err);
			//   toast.error('Delete Failed', { description: 'Could not delete the user.' });
			// }
		}
		// Close the dialog regardless of success/failure for now
		setIsDeleteDialogOpen(false)
		setUserToDeleteId(null)
	}

	// Closes the delete confirmation dialog without action
	const cancelDeleteUser = () => {
		setIsDeleteDialogOpen(false)
		setUserToDeleteId(null)
	}

	// --- Change Password ---
	// Opens the change password dialog
	const openChangePasswordDialog = (user: UserOutput) => {
		setUserToChangePassword(user)
		setNewPassword('') // Clear fields when opening
		setConfirmPassword('')
		setIsChangePasswordDialogOpen(true)
	}

	// Handles the submission of the change password form
	const handleSubmitChangePassword = async (event: React.FormEvent) => {
		event.preventDefault()
		if (!userToChangePassword) return
		if (newPassword !== confirmPassword) {
			toast.error('Passwords do not match.')
			return
		}
		if (newPassword.length < 6) {
			// Basic validation, adjust as needed
			toast.error('Password must be at least 6 characters long.')
			return
		}

		console.log('Attempting to change password for user:', userToChangePassword.id)
		try {
			// TODO: Implement actual API call for changing password
			// Example: await apiClient.patch(`/api/v1/users/${userToChangePassword.id}/password`, { newPassword });
			toast.success('Password Change Submitted', {
				description: `Password for ${userToChangePassword.email} would be changed (API call pending).`,
			})
			setIsChangePasswordDialogOpen(false) // Close dialog on success
		} catch (err) {
			console.error('Failed to change password:', err)
			toast.error('Password Change Failed', {
				description: 'Could not change the password.',
			})
			// Optionally keep dialog open on failure
		}
	}

	// --- Reset Password ---
	// Opens the reset password confirmation dialog
	const openResetPasswordDialog = (userId: string, email: string) => {
		setResetPasswordDetails({userId, email})
		setIsResetPasswordDialogOpen(true)
	}

	// Closes the reset password confirmation dialog
	const cancelResetPassword = () => {
		setIsResetPasswordDialogOpen(false)
		setResetPasswordDetails(null)
	}

	// Executes the password reset trigger after confirmation
	const confirmResetPassword = async () => {
		if (!resetPasswordDetails) return

		const {userId, email} = resetPasswordDetails
		console.log('Trigger reset password for user:', userId)
		// TODO: Implement API call to trigger password reset email
		try {
			// Example API call structure (adjust endpoint and payload as needed)
			// await apiClient.post(`/api/v1/users/${userId}/reset-password`);
			toast.success('Password Reset Triggered', {
				description: `A password reset link will be sent to ${email} if the feature is implemented.`,
			})
		} catch (err) {
			console.error('Failed to trigger password reset:', err)
			toast.error('Reset Failed', {
				description: 'Could not trigger password reset.',
			})
		} finally {
			cancelResetPassword() // Close dialog regardless of outcome
		}
	}

	// --- Status Change ---
	// Opens the status change confirmation dialog
	const openStatusChangeDialog = (userId: string, status: UserStatus) => {
		setStatusChangeDetails({userId, status})
		setIsStatusChangeDialogOpen(true)
	}

	// Closes the status change dialog without action
	const cancelChangeUserStatus = () => {
		setIsStatusChangeDialogOpen(false)
		setStatusChangeDetails(null)
	}

	// Executes the status change after confirmation
	const confirmChangeUserStatus = async () => {
		if (!statusChangeDetails) return

		const {userId, status} = statusChangeDetails
		console.log('Attempting to change status for user:', userId, 'to', status)
		// Consider adding a temporary loading state for the specific row or action
		try {
			await apiClient.patch(`/api/v1/users/${userId}/status`, {status}) // Using PATCH /users/{userId}/status
			toast.success('Status Updated', {
				description: `User status changed to ${status}.`, // Simplified description
			})
			fetchUsers() // Refresh the user list
		} catch (err) {
			console.error('Failed to change user status:', err)
			let message = `Failed to update status for user ${userId}.`

			// Type guard for AxiosError or similar structure
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
				message = String(err.response.data.message) // Safely access nested message
			} else if (err instanceof Error) {
				message = err.message // Fallback to standard error message
			}

			setError(message) // Update general error state
			toast.error('Update Failed', {
				description: message,
			})
		} finally {
			// Reset any temporary loading state here if implemented
			cancelChangeUserStatus() // Close the dialog regardless of outcome
		}
	}

	// Fetch users function with pagination and filtering
	const fetchUsers = useCallback(async () => {
		setLoading(true)
		setError(null)
		// Reset selections when fetching new data
		setSelectedRows({})

		// Construct query params, removing undefined values
		// Use the updated filter type
		const queryParams: Omit<UserSearchQuery, 'role_id'> & {role_name?: string} = {
			page: currentPage,
			page_size: pageSize,
			query: debouncedQuery || undefined,
			status: filters.status || undefined,
			role_name: filters.role_name || undefined, // Use role_name
		}

		// Remove undefined keys to keep the URL clean
		Object.keys(queryParams).forEach((key) => queryParams[key as keyof typeof queryParams] === undefined && delete queryParams[key as keyof typeof queryParams])

		try {
			const response = await apiClient.get<PaginatedUsers>('/api/v1/users/search', {
				params: queryParams,
			})
			setUsers(response.data.users)
			setTotalUsers(response.data.total)
			setTotalPages(response.data.total_pages)
			// Ensure currentPage is not out of bounds after filtering/deletion etc.
			if (response.data.page > response.data.total_pages && response.data.total_pages > 0) {
				setCurrentPage(response.data.total_pages)
			} else if (response.data.page < 1 && response.data.total > 0) {
				setCurrentPage(1)
			} else {
				setCurrentPage(response.data.page) // Update current page from response
			}
			setPageSize(response.data.page_size) // Update page size from response
		} catch (err: unknown) {
			let message = 'Failed to fetch users'
			if (err instanceof Error) {
				message = err.message
			} else if (typeof err === 'string') {
				message = err
			}
			setError(message)
			console.error(err)
			// Clear data on error
			setUsers([])
			setTotalUsers(0)
			setTotalPages(0)
		} finally {
			setLoading(false)
		}
	}, [currentPage, pageSize, debouncedQuery, filters.status, filters.role_name]) // Updated dependency to role_name

	// Effect to fetch users when dependencies change
	useEffect(() => {
		fetchUsers()
	}, [fetchUsers]) // fetchUsers is stable due to useCallback

	// Handler for filter changes
	// Update key type to match new filter state shape
	const handleFilterChange = (key: keyof typeof filters, value: string | number | UserStatus | undefined) => {
		setFilters((prev) => ({
			...prev,
			[key]: value === 'all' || value === '' ? undefined : value, // Reset if 'all' or empty
		}))
		setCurrentPage(1) // Reset to first page on filter change
	}

	// Handlers for pagination
	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1))
	}

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages))
	}

	// Define columns for the UserTable
	const columns: ColumnDefinition<UserOutput>[] = [
		{
			accessorKey: 'email',
			header: 'Email',
			cell: ({row}) => <div className='font-medium'>{row.email}</div>,
		},
		{
			accessorKey: 'name',
			header: 'Name',
			cell: ({row}) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'N/A',
		},
		{
			accessorKey: 'phone',
			header: 'Phone',
			cell: ({row}) => row.phone || 'N/A',
		},
		{
			accessorKey: 'roles',
			header: 'Roles',
			cell: ({row}) => (row.roles && row.roles.length > 0 ? row.roles.join(', ') : 'N/A'),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({row}) => row.status,
		},
		{
			accessorKey: 'actions',
			header: () => <div className='text-right'>Actions</div>,
			size: 'w-[80px]', // Give actions column a bit more space if needed
			cell: ({row}) => {
				const user = row // Get the full user object for context
				return (
					<div className='text-right'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='h-8 w-8 p-0'>
									<span className='sr-only'>Open menu</span>
									<DotsHorizontalIcon className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className='text-red-600'>
									Delete
								</DropdownMenuItem>
								{/* Corrected onClick handlers */}
								<DropdownMenuItem onClick={() => openChangePasswordDialog(user)}>Change Password</DropdownMenuItem>
								<DropdownMenuItem onClick={() => openResetPasswordDialog(user.id, user.email)}>Reset Password</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>Change Status</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => openStatusChangeDialog(user.id, 'active')} disabled={user.status === 'active'}>
									Set Active
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => openStatusChangeDialog(user.id, 'inactive')} disabled={user.status === 'inactive'}>
									Set Inactive
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => openStatusChangeDialog(user.id, 'pending')} disabled={user.status === 'pending'}>
									Set Pending
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => openStatusChangeDialog(user.id, 'blocked')} disabled={user.status === 'blocked'}>
									Set Blocked
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)
			},
		},
	]

	return (
		<div className='p-6 space-y-4'>
			{/* Filter Controls */}
			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent className='flex flex-col md:flex-row gap-4'>
					<Input placeholder='Search by name or email...' value={filters.query || ''} onChange={(e) => handleFilterChange('query', e.target.value)} className='md:w-1/3' />
					<Select value={filters.status || 'all'} onValueChange={(value: string) => handleFilterChange('status', value as UserStatus | 'all')}>
						<SelectTrigger className='md:w-1/4'>
							<SelectValue placeholder='Filter by status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Statuses</SelectItem>
							<SelectItem value='active'>Active</SelectItem>
							<SelectItem value='pending'>Pending</SelectItem>
							<SelectItem value='inactive'>Inactive</SelectItem>
							<SelectItem value='blocked'>Blocked</SelectItem>
						</SelectContent>
					</Select>
					{/* Update Role Select to use role_name */}
					<Select value={filters.role_name || 'all'} onValueChange={(value: string) => handleFilterChange('role_name', value)} disabled={roles.length === 0 || !!roleError}>
						<SelectTrigger className='md:w-1/4'>
							<SelectValue placeholder='Filter by role' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Roles</SelectItem>
							{roles.length > 0 ? (
								roles.map((roleName) => (
									<SelectItem key={roleName} value={roleName}>
										{roleName} {/* Display role name */}
									</SelectItem>
								))
							) : (
								<SelectItem value='loading' disabled>
									Loading roles...
								</SelectItem>
							)}
							{roleError && (
								<SelectItem value='error' disabled>
									{roleError}
								</SelectItem>
							)}
						</SelectContent>
					</Select>
					{/* Add Role Filter Here - Needs Role Data */}
					{/* Removed Role Filter Select, handled in the main Select */}
				</CardContent>
			</Card>

			{/* User Table using UserTable component */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between'>
					<CardTitle>User Management ({totalUsers} users)</CardTitle>
					{/* Optional: Add Button for creating new user */}
					{/* <Button>Create User</Button> */}
				</CardHeader>
				<CardContent>
					<UserTable
						data={users}
						columns={columns}
						loading={loading}
						error={error}
						selectedRows={selectedRows}
						onSelectedRowsChange={setSelectedRows}
						getRowId={(user) => user.id} // Provide function to get unique row ID
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={totalUsers} // Pass totalUsers as totalItems
						onPreviousPage={handlePreviousPage}
						onNextPage={handleNextPage}
					/>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>This action cannot be undone. This will permanently delete the user account.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={cancelDeleteUser}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDeleteUser} className='bg-red-600 hover:bg-red-700'>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Status Change Confirmation Dialog */}
			<AlertDialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
						<AlertDialogDescription>{statusChangeDetails ? `Are you sure you want to change the status of user ${statusChangeDetails.userId} to ${statusChangeDetails.status}?` : 'Are you sure you want to change the user status?'}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={cancelChangeUserStatus}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmChangeUserStatus}>Confirm</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reset Password Confirmation Dialog */}
			<AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
						<AlertDialogDescription>{resetPasswordDetails ? `Are you sure you want to trigger a password reset for ${resetPasswordDetails.email}? An email will be sent with instructions.` : 'Are you sure?'}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={cancelResetPassword}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmResetPassword}>Confirm Reset</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Change Password Dialog */}
			<Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>Change Password</DialogTitle>
						{/* Using double quotes outside, single quote inside */}
						<DialogDescription>{'Set a new password for ' + (userToChangePassword?.email || 'the selected user') + ". Click save when you're done."}</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmitChangePassword}>
						<div className='grid gap-4 py-4'>
							<div className='grid grid-cols-4 items-center gap-4'>
								<Label htmlFor='newPassword' className='text-right'>
									New Password
								</Label>
								<Input id='newPassword' type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='col-span-3' required minLength={6} />
							</div>
							<div className='grid grid-cols-4 items-center gap-4'>
								<Label htmlFor='confirmPassword' className='text-right'>
									Confirm Password
								</Label>
								<Input id='confirmPassword' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='col-span-3' required />
							</div>
							{newPassword && confirmPassword && newPassword !== confirmPassword && <p className='col-span-4 text-red-600 text-sm text-center'>Passwords do not match.</p>}
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button type='button' variant='outline'>
									Cancel
								</Button>
							</DialogClose>
							<Button type='submit' disabled={!newPassword || newPassword !== confirmPassword}>
								Save changes
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
// Removed extra closing parenthesis if any existed from merge conflict
