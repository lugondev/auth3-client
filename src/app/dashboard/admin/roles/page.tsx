'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Loader2} from 'lucide-react'
import {useRbac} from '@/hooks/useRbac' // Keep for roles, permissions, modals
import {RolesSection} from '@/components/rbac/RolesSection'
import {UserRolesModal} from '@/components/rbac/modals/UserRolesModal'
import {RolePermissionsModal} from '@/components/rbac/modals/RolePermissionsModal'
import {CreateRoleModal} from '@/components/rbac/modals/CreateRoleModal'

import apiClient, {UserOutput, PaginatedUsers, UserSearchQuery, UserStatus} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {useDebounce} from 'use-debounce'
import {UserTable, ColumnDefinition} from '@/components/users/UserTable'
import {Role} from '@/types/rbac'

// Define initial filter state for users section
const initialUserFilters: Omit<UserSearchQuery, 'role_id' | 'role_name'> = {
	// Role filter removed for RBAC page
	query: '',
	status: undefined,
	offset: 1,
	limit: 10,
}

export default function RBACManagement() {
	// --- State from useRbac (Roles, Permissions, Modals) ---
	const {
		roles: rbacRoles,
		userRolesMap, // Keep for displaying roles in table/modal if needed
		rolePermissionsMap,
		loading: rbacLoading, // Rename to avoid conflict
		error: rbacError, // Rename to avoid conflict
		createRoleError,
		selectedUser, // Keep for modals
		selectedRole,
		isUserRolesModalOpen,
		isRolePermsModalOpen,
		isCreateRoleModalOpen,
		newPermObject,
		newPermAction,
		actions, // Keep RBAC actions
		groupedPermissions,
	} = useRbac()

	const [selectedDomain, setSelectedDomain] = useState<'tenant' | 'global'>('tenant')
	const [roles, setRoles] = useState<Role[]>(rbacRoles)
	useEffect(() => {
		setRoles(rbacRoles)
	}, [rbacRoles])

	// --- State for UserTable (Pagination, Filtering, Data) ---
	const [users, setUsers] = useState<UserOutput[]>([])
	const [userLoading, setUserLoading] = useState(true) // Separate loading state for users
	const [userError, setUserError] = useState<string | null>(null) // Separate error state for users
	const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})
	const [currentPage, setCurrentPage] = useState(initialUserFilters.offset || 1)
	const [pageSize, setPageSize] = useState(initialUserFilters.limit || 10)
	const [totalPages, setTotalPages] = useState(0)
	const [totalUsers, setTotalUsers] = useState(0)
	const [userFilters, setUserFilters] = useState(initialUserFilters)
	const [debouncedQuery] = useDebounce(userFilters.query, 500)

	// --- Fetch Users Logic (Adapted from users/page.tsx) ---
	const fetchUsers = useCallback(async () => {
		setUserLoading(true)
		setUserError(null)
		setSelectedRows({}) // Reset selections

		const queryParams: UserSearchQuery = {
			offset: currentPage,
			limit: pageSize,
			query: debouncedQuery || undefined,
			status: userFilters.status || undefined,
		}

		Object.keys(queryParams).forEach((key) => queryParams[key as keyof typeof queryParams] === undefined && delete queryParams[key as keyof typeof queryParams])

		try {
			const response = await apiClient.get<PaginatedUsers>('/api/v1/users/search', {params: queryParams})
			setUsers(response.data.users)
			setTotalUsers(response.data.total)
			setTotalPages(response.data.total_pages)
			if (response.data.page > response.data.total_pages && response.data.total_pages > 0) {
				setCurrentPage(response.data.total_pages)
			} else if (response.data.page < 1 && response.data.total > 0) {
				setCurrentPage(1)
			} else {
				setCurrentPage(response.data.page)
			}
			setPageSize(response.data.page_size)

			// Fetch roles for all users in the current page at once
			await actions.fetchUsersRoles(response.data.users.map((user) => user.id))
		} catch (err: unknown) {
			let message = 'Failed to fetch users'
			if (err instanceof Error) message = err.message
			else if (typeof err === 'string') message = err
			setUserError(message)
			console.error(err)
			setUsers([])
			setTotalUsers(0)
			setTotalPages(0)
		} finally {
			setUserLoading(false)
		}
	}, [currentPage, pageSize, debouncedQuery, userFilters.status])

	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

	// --- User Filter and Pagination Handlers ---
	const handleUserFilterChange = (key: keyof typeof userFilters, value: string | UserStatus | undefined) => {
		setUserFilters((prev) => ({
			...prev,
			[key]: value === 'all' || value === '' ? undefined : value,
		}))
		setCurrentPage(1) // Reset to first page
	}

	const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
	const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))

	// --- Define Columns for UserTable in RBAC Context ---
	const userColumns: ColumnDefinition<UserOutput>[] = [
		{
			accessorKey: 'email',
			header: 'Email',
			cell: ({row}) => <div className='font-medium'>{row.email}</div>, // Corrected: Use row.email
		},
		{
			accessorKey: 'name',
			header: 'Name',
			cell: ({row}) => `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'N/A', // Corrected: Use row.first_name/last_name
		},
		{
			accessorKey: 'roles',
			header: 'Roles',
			// Display roles fetched by useRbac if available, otherwise from user object
			cell: ({row}) => {
				const rolesForUser = userRolesMap[row.id] || row.roles || [] // Corrected: Use row.id and row.roles
				return rolesForUser.length > 0 ? rolesForUser.join(', ') : 'No Roles'
			},
		},
		{
			accessorKey: 'actions',
			header: () => <div className='text-right'>Actions</div>,
			cell: ({row}) => (
				<div className='text-right'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => actions.openUserRolesModal(row)} // Corrected: Pass the whole row object
					>
						Manage Roles
					</Button>
					{/* Example: Add other actions if needed */}
					{/*
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
                                <span className="sr-only">Open menu</span>
                                <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    */}
				</div>
			),
			size: 'w-[150px]', // Adjust size as needed
		},
	]

	// --- Render Logic ---
	if (rbacLoading.initial) {
		// Still use RBAC initial loading
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>Loading RBAC Data...</span>
			</div>
		)
	}

	// Combine page-level errors (consider how to display both if they occur)
	const pageError = (rbacError || userError) && !isUserRolesModalOpen && !isRolePermsModalOpen && !isCreateRoleModalOpen
	const errorMessage = rbacError ? `RBAC Error: ${rbacError}` : userError ? `User Fetch Error: ${userError}` : ''

	return (
		<div className='p-6 space-y-8'>
			<h1 className='text-3xl font-bold'>Role-Based Access Control</h1>
			{pageError && (
				<div className='p-4 text-center text-destructive bg-destructive/10 border border-destructive rounded-md'>
					<h2 className='text-lg font-semibold mb-2'>Error</h2>
					<p>{errorMessage}</p>
				</div>
			)}

			{/* Domain Tabs */}
			<div className='flex space-x-4 border-b border-gray-200'>
				<button onClick={() => setSelectedDomain('tenant')} className={`pb-2 px-4 ${selectedDomain === 'tenant' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}`}>
					Tenant Roles
				</button>
				<button onClick={() => setSelectedDomain('global')} className={`pb-2 px-4 ${selectedDomain === 'global' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}`}>
					Global Roles
				</button>
			</div>

			{/* Roles Section (from useRbac) */}
			<RolesSection
				roles={roles.filter((role) => role.domain === selectedDomain)}
				loading={rbacLoading}
				error={rbacError}
				selectedRole={selectedRole}
				onOpenCreateRoleModal={actions.openCreateRoleModal}
				onOpenRolePermsModal={actions.openRolePermsModal}
				onDeleteRole={async (roleName: Role) => {
					setRoles((prev) => prev.filter((r) => r !== roleName))
				}}
			/>
			{/* Users Section (using UserTable) */}
			<Card>
				<CardHeader>
					<CardTitle>Users ({totalUsers} users)</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Filter Controls for Users */}
					<div className='flex flex-col md:flex-row gap-4'>
						<Input
							placeholder='Search by name or email...'
							value={userFilters.query || ''}
							onChange={(e) => handleUserFilterChange('query', e.target.value)}
							className='md:flex-1' // Allow search to take more space
						/>
						<Select value={userFilters.status || 'all'} onValueChange={(value: string) => handleUserFilterChange('status', value as UserStatus | 'all')}>
							<SelectTrigger className='md:w-1/4'>
								<SelectValue placeholder='Filter by status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Statuses</SelectItem>
								<SelectItem value='active'>Active</SelectItem>
								<SelectItem value='pending'>Pending</SelectItem>
								<SelectItem value='suspended'>Suspended</SelectItem>
								<SelectItem value='deleted'>Deleted</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* User Table */}
					<UserTable
						data={users}
						columns={userColumns}
						loading={userLoading} // Use userLoading state
						error={userError} // Use userError state
						selectedRows={selectedRows}
						onSelectedRowsChange={setSelectedRows}
						getRowId={(user) => user.id}
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={totalUsers}
						onPreviousPage={handlePreviousPage}
						onNextPage={handleNextPage}
						// Optional: Add page size change handler if needed
						// pageSize={pageSize}
						// onPageSizeChange={setPageSize}
					/>
				</CardContent>
			</Card>
			{/* --- Modals (from useRbac) --- */}
			<UserRolesModal
				isOpen={isUserRolesModalOpen}
				onClose={actions.closeUserRolesModal}
				user={selectedUser} // selectedUser is managed by useRbac's openUserRolesModal
				roles={roles}
				userRolesMap={userRolesMap}
				loading={rbacLoading} // Use rbacLoading state for modal operations
				error={rbacError} // Use rbacError state for modal operations
				onAddRole={actions.handleAddRoleToUser}
				onRemoveRole={actions.handleRemoveRoleFromUser}
			/>
			<RolePermissionsModal
				isOpen={isRolePermsModalOpen}
				onClose={actions.closeRolePermsModal}
				role={selectedRole}
				rolePermissionsMap={rolePermissionsMap}
				groupedPermissions={groupedPermissions(selectedRole)}
				loading={rbacLoading} // Use rbacLoading state
				error={rbacError} // Use rbacError state
				newPermObject={newPermObject}
				newPermAction={newPermAction}
				onNewPermObjectChange={actions.setNewPermObject}
				onNewPermActionChange={actions.setNewPermAction}
				onAddPermission={actions.handleAddPermissionToRole}
				onRemovePermission={actions.handleRemovePermissionFromRole}
			/>
			<CreateRoleModal
				isOpen={isCreateRoleModalOpen}
				onClose={actions.closeCreateRoleModal}
				loading={rbacLoading} // Use rbacLoading state
				error={createRoleError} // Use specific create role error
				onCreateRole={actions.handleCreateRole}
				defaultDomain={selectedDomain}
			/>
		</div>
	)
}
