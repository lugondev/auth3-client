'use client'

import React, {useEffect, useState, useCallback} from 'react'
import apiClient, {UserOutput, PaginatedUsers, UserSearchQuery, UserStatus} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
// Removed Table imports, Checkbox is used by UserTable internally now
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {DotsHorizontalIcon} from '@radix-ui/react-icons' // Removed pagination icons, handled by UserTable
import {useDebounce} from 'use-debounce'
// Import the new UserTable component and ColumnDefinition type
import {UserTable, ColumnDefinition} from '@/components/users/UserTable'

// Define initial filter state
const initialFilters: Omit<UserSearchQuery, 'role_id'> & {role_name?: string} = {
	// Use role_name instead of role_id
	query: '',
	status: undefined,
	role_name: undefined, // Changed from role_id
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
				const response = await apiClient.get<{roles: string[]}>('/rbac/roles')
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

	// Placeholder action handlers (keep existing)
	const handleEditUser = (userId: string) => {
		console.log('Edit user:', userId)
		// TODO: Implement edit logic (e.g., open modal, navigate to edit page)
	}

	const handleDeleteUser = (userId: string) => {
		console.log('Delete user:', userId)
		// TODO: Implement delete logic (e.g., show confirmation, call API)
	}

	const handleChangeUserStatus = (userId: string, status: 'active' | 'inactive' | 'pending') => {
		console.log('Change status for user:', userId, 'to', status)
		// TODO: Implement status change logic (e.g., call API, update state)
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
			const response = await apiClient.get<PaginatedUsers>('/users/search', {
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
			cell: ({row}) => (
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
							<DropdownMenuItem onClick={() => handleEditUser(row.id)}>Edit</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleDeleteUser(row.id)}
								className='text-red-600' // Optional: Style delete differently
							>
								Delete
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Change Status</DropdownMenuLabel>
							<DropdownMenuItem onClick={() => handleChangeUserStatus(row.id, 'active')} disabled={row.status === 'active'}>
								Set Active
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleChangeUserStatus(row.id, 'inactive')} disabled={row.status === 'inactive'}>
								Set Inactive
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleChangeUserStatus(row.id, 'pending')} disabled={row.status === 'pending'}>
								Set Pending
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
			size: 'w-[80px]', // Give actions column a bit more space if needed
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
		</div>
	)
}
// Removed extra closing parenthesis if any existed from merge conflict
