'use client'

import {useState, useEffect, useCallback} from 'react' // Removed Fragment
import apiClient, {UserOutput, PaginatedUsers /* Add other necessary types if any */} from '@/lib/apiClient' // Import apiClient and types
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose} from '@/components/ui/dialog'
import {Badge} from '@/components/ui/badge'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'
import {X, Loader2} from 'lucide-react' // Import Loader2

// --- Component Types ---
// Define types based on backend API structure
interface RoleListOutput {
	roles: string[]
}

// Used for POST request body when adding role to user
interface UserRoleInput {
	user_id: string
	role: string
}

interface UserRolesOutput {
	user_id: string // Go backend uses user_id, ensure consistency if needed
	roles: string[]
}

// Used for POST request body when adding permission to role
interface RolePermissionInput {
	role: string
	permission: string[] // [object, action]
}

interface RolePermissionsOutput {
	role: string
	permissions: string[][] // Array of [object, action]
}

// UserOutput is imported from apiClient, no need to redefine here.

// --- Helper Functions ---

const groupPermissionsByObject = (permissions: string[][] | undefined): Record<string, string[]> => {
	if (!permissions) return {}
	return permissions.reduce((acc, pair) => {
		if (pair?.length === 2) {
			const [object, action] = pair
			if (!acc[object]) acc[object] = []
			if (!acc[object].includes(action)) acc[object].push(action)
		}
		return acc
	}, {} as Record<string, string[]>)
}

// --- Main Component ---

export default function RBACManagement() {
	// --- State ---
	const [roles, setRoles] = useState<string[]>([])
	const [users, setUsers] = useState<UserOutput[]>([])
	const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({}) // userId -> roles[]
	const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[][]>>({}) // roleName -> permissions[][]
	const [isLoading, setIsLoading] = useState({
		initial: true, // Combined initial load state
		userRoles: false,
		rolePermissions: false,
		action: false, // For add/remove operations
	})
	const [error, setError] = useState<string | null>(null)

	// UI State
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedUser, setSelectedUser] = useState<UserOutput | null>(null)
	const [selectedRole, setSelectedRole] = useState<string | null>(null)
	const [isUserRolesModalOpen, setIsUserRolesModalOpen] = useState(false)
	const [isRolePermsModalOpen, setIsRolePermsModalOpen] = useState(false)
	// State for adding new permission in modal
	const [newPermObject, setNewPermObject] = useState('')
	const [newPermAction, setNewPermAction] = useState('')

	// --- Data Fetching & API Calls ---

	useEffect(() => {
		const fetchInitialData = async () => {
			// Use combined initial loading state
			setIsLoading((prev) => ({...prev, initial: true}))
			setError(null)
			try {
				// Use Promise.all for concurrent fetching
				const [rolesRes, usersRes] = await Promise.all([apiClient.get<RoleListOutput>('/rbac/roles'), apiClient.get<PaginatedUsers>('/users/search')])
				setRoles(rolesRes.data.roles || [])
				setUsers(usersRes.data.users || [])
			} catch (err) {
				console.error('Error fetching initial RBAC data:', err)
				let errorMessage = 'Unknown error'
				if (err instanceof Error) {
					errorMessage = err.message
				} else if (typeof err === 'string') {
					errorMessage = err
				}
				setError(`Failed to load initial data: ${errorMessage}`)
			} finally {
				// Update combined initial loading state
				setIsLoading((prev) => ({...prev, initial: false}))
			}
		}
		fetchInitialData()
	}, []) // Empty dependency array ensures this runs only once on mount
	const fetchUserRoles = useCallback(
		async (userId: string) => {
			if (userRolesMap[userId]) return // Skip if already fetched
			setIsLoading((prev) => ({...prev, userRoles: true}))
			setError(null) // Clear previous errors specific to this action
			try {
				const res = await apiClient.get<UserRolesOutput>(`/rbac/users/${userId}/roles`)
				setUserRolesMap((prev) => ({...prev, [userId]: res.data.roles || []}))
			} catch (err) {
				console.error(`Error fetching roles for user ${userId}:`, err)
				// Improved error handling (assuming apiClient throws axios-like errors)
				let errorMessage = 'Unknown error'
				if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
					errorMessage = String(err.response.data.error) // Extract specific error from response data if available
				} else if (err instanceof Error) {
					errorMessage = err.message
				} else if (typeof err === 'string') {
					errorMessage = err
				}
				setError(`User Roles Error: ${errorMessage}`)
				setUserRolesMap((prev) => ({...prev, [userId]: []})) // Set empty on error to avoid inconsistent state
			} finally {
				setIsLoading((prev) => ({...prev, userRoles: false}))
			}
		},
		[userRolesMap],
	) // Depend on the map itself

	const fetchRolePermissions = useCallback(
		async (roleName: string) => {
			if (rolePermissionsMap[roleName]) return // Skip if already fetched
			setIsLoading((prev) => ({...prev, rolePermissions: true}))
			setError(null) // Clear previous errors specific to this action
			try {
				const res = await apiClient.get<RolePermissionsOutput>(`/rbac/roles/${roleName}/permissions`)
				setRolePermissionsMap((prev) => ({...prev, [roleName]: res.data.permissions || []}))
			} catch (err) {
				console.error(`Error fetching permissions for role ${roleName}:`, err)
				// Improved error handling
				let errorMessage = 'Unknown error'
				if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
					errorMessage = String(err.response.data.error)
				} else if (err instanceof Error) {
					errorMessage = err.message
				} else if (typeof err === 'string') {
					errorMessage = err
				}
				setError(`Role Permissions Error: ${errorMessage}`)
				setRolePermissionsMap((prev) => ({...prev, [roleName]: []})) // Set empty on error
			} finally {
				setIsLoading((prev) => ({...prev, rolePermissions: false}))
			}
		},
		[rolePermissionsMap],
	) // Depend on the map itself

	// --- Modal Open/Close Handlers ---
	const openUserRolesModal = (user: UserOutput) => {
		setSelectedUser(user)
		fetchUserRoles(user.id) // Fetch data when opening
		setIsUserRolesModalOpen(true)
	}

	const openRolePermsModal = (roleName: string) => {
		setSelectedRole(roleName)
		fetchRolePermissions(roleName) // Fetch data when opening
		// Reset add permission form state
		setNewPermObject('')
		setNewPermAction('')
		setIsRolePermsModalOpen(true)
	}

	// --- Action Handlers (API Calls within Modals/UI) ---
	const handleAddRoleToUser = async (userId: string | undefined, roleName: string) => {
		if (!userId) return
		// Prevent adding if role already exists for the user
		if (userRolesMap[userId]?.includes(roleName)) {
			// Maybe show a message that the role is already assigned
			console.log(`Role "${roleName}" already assigned to user ${userId}`)
			return
		}
		setIsLoading((prev) => ({...prev, action: true}))
		setError(null)
		try {
			const payload: UserRoleInput = {user_id: userId, role: roleName}
			await apiClient.post(`/rbac/users/roles`, payload)
			// Update local state optimistically or re-fetch
			setUserRolesMap((prev) => ({
				...prev,
				[userId]: [...(prev[userId] || []), roleName].filter((v, i, a) => a.indexOf(v) === i), // Deduplicate just in case
			}))
			// Add success feedback (e.g., toast)
		} catch (err) {
			console.error(`Error adding role ${roleName} to user ${userId}:`, err)
			// Improved error handling
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) {
				errorMessage = err.message
			} else if (typeof err === 'string') {
				errorMessage = err
			}
			setError(`Failed to add role: ${errorMessage}`)
			// Add error feedback (e.g., toast)
		} finally {
			setIsLoading((prev) => ({...prev, action: false}))
		}
	}

	const handleRemoveRoleFromUser = async (userId: string | undefined, roleName: string) => {
		if (!userId) return
		setIsLoading((prev) => ({...prev, action: true}))
		setError(null)
		try {
			await apiClient.delete(`/rbac/users/${userId}/roles/${encodeURIComponent(roleName)}`)
			// Update local state optimistically
			setUserRolesMap((prev) => ({
				...prev,
				[userId]: (prev[userId] || []).filter((r) => r !== roleName),
			}))
			// Add success feedback
		} catch (err) {
			console.error(`Error removing role ${roleName} from user ${userId}:`, err)
			// Improved error handling
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) {
				errorMessage = err.message
			} else if (typeof err === 'string') {
				errorMessage = err
			}
			setError(`Failed to remove role: ${errorMessage}`)
			// Add error feedback
		} finally {
			setIsLoading((prev) => ({...prev, action: false}))
		}
	}

	const handleAddPermissionToRole = async (roleName: string | null, object: string, action: string) => {
		if (!roleName || !object || !action) {
			setError('Object and Action cannot be empty.')
			return // Basic validation
		}
		// Check if permission already exists
		if (rolePermissionsMap[roleName]?.some((p) => p[0] === object && p[1] === action)) {
			console.log(`Permission [${object}, ${action}] already exists for role ${roleName}`)
			return
		}

		const permission: string[] = [object, action]
		const payload: RolePermissionInput = {role: roleName, permission}
		setIsLoading((prev) => ({...prev, action: true}))
		setError(null)
		try {
			await apiClient.post(`/rbac/roles/permissions`, payload)
			// Update local state optimistically
			setRolePermissionsMap((prev) => ({
				...prev,
				[roleName]: [...(prev[roleName] || []), permission].filter((p, i, a) => a.findIndex((p2) => p2[0] === p[0] && p2[1] === p[1]) === i), // Deduplicate
			}))
			// Clear the input fields after successful addition
			setNewPermObject('')
			setNewPermAction('')
			// Add success feedback
		} catch (err) {
			console.error(`Error adding permission [${object}, ${action}] to role ${roleName}:`, err)
			// Improved error handling
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) {
				errorMessage = err.message
			} else if (typeof err === 'string') {
				errorMessage = err
			}
			setError(`Failed to add permission: ${errorMessage}`)
			// Add error feedback
		} finally {
			setIsLoading((prev) => ({...prev, action: false}))
		}
	}

	const handleRemovePermissionFromRole = async (roleName: string | null, object: string, action: string) => {
		if (!roleName) return
		setIsLoading((prev) => ({...prev, action: true}))
		setError(null)
		try {
			await apiClient.delete(`/rbac/roles/${encodeURIComponent(roleName)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`)
			// Update local state optimistically
			setRolePermissionsMap((prev) => ({
				...prev,
				[roleName]: (prev[roleName] || []).filter((p) => !(p[0] === object && p[1] === action)),
			}))
			// Add success feedback
		} catch (err) {
			console.error(`Error removing permission [${object}, ${action}] from role ${roleName}:`, err)
			// Improved error handling
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) {
				errorMessage = err.message
			} else if (typeof err === 'string') {
				errorMessage = err
			}
			setError(`Failed to remove permission: ${errorMessage}`)
			// Add error feedback
		} finally {
			setIsLoading((prev) => ({...prev, action: false}))
		}
	}

	// --- Rendering Logic ---

	const filteredUsers = users.filter((user) => (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase()))

	// Render loading state for initial data
	if (isLoading.initial) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>Loading RBAC Data...</span>
			</div>
		)
	}

	// Render page-level error state (only if modals are not open)
	// Also show modal-specific errors inside modals
	const pageError = error && !isUserRolesModalOpen && !isRolePermsModalOpen

	return (
		<div className='p-6 space-y-8'>
			<h1 className='text-3xl font-bold'>Role-Based Access Control</h1>

			{pageError && (
				<div className='p-4 text-center text-destructive bg-destructive/10 border border-destructive rounded-md'>
					<h2 className='text-lg font-semibold mb-2'>Error</h2>
					<p>{error}</p>
					{/* Optional: Add a retry button or clear error button */}
				</div>
			)}

			{/* Roles Management Section - Updated List */}
			<section aria-labelledby='roles-heading'>
				<div className='flex justify-between items-center mb-4'>
					<h2 id='roles-heading' className='text-2xl font-semibold'>
						Roles
					</h2>
					{/* "Add New Role" button removed */}
				</div>
				{roles.length === 0 && !isLoading.initial ? (
					<p className='text-muted-foreground text-center py-4'>No roles defined in the system yet.</p>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
						{/* Map over role names (strings) */}
						{roles.map((roleName) => (
							<div key={roleName} className='border bg-card p-4 rounded-lg shadow-sm flex flex-col justify-between'>
								<h3 className='font-medium text-lg mb-3 truncate'>{roleName}</h3>
								<Button
									variant='outline'
									size='sm'
									className='w-full mt-auto' // Ensure button is at the bottom
									onClick={() => openRolePermsModal(roleName)}
									disabled={isLoading.rolePermissions && selectedRole === roleName} // Disable while loading permissions for this role
								>
									{isLoading.rolePermissions && selectedRole === roleName ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
									Manage Permissions
								</Button>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Users Management Section - Updated Table */}
			<section aria-labelledby='users-heading'>
				{/* Updated header and search layout */}
				<div className='flex flex-col sm:flex-row justify-between items-center mb-4 gap-4'>
					<h2 id='users-heading' className='text-2xl font-semibold'>
						Users
					</h2>
					<div className='w-full sm:w-auto sm:max-w-xs'>
						<Input type='text' placeholder='Search users by name or email...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
					</div>
				</div>
				{/* Added border and bg-card for consistency */}
				<div className='border rounded-lg overflow-hidden bg-card'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Assigned Roles</TableHead> {/* Renamed header */}
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredUsers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className='text-center text-muted-foreground py-4'>
										No users found{searchQuery ? ' matching your search' : ''}.
									</TableCell>
								</TableRow>
							) : (
								// Use user.roles directly from the fetched user data
								filteredUsers.map((user) => (
									<TableRow key={user.id}>
										<TableCell className='font-medium'>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											{/* Display roles as badges directly from user.roles */}
											<div className='flex flex-wrap gap-1'>
												{user.roles && user.roles.length > 0 ? (
													user.roles.map((roleName) => (
														<Badge key={roleName} variant='secondary'>
															{roleName}
														</Badge>
													))
												) : (
													<span className='text-xs text-muted-foreground italic'>No roles</span>
												)}
											</div>
										</TableCell>
										{/* Corrected TableCell placement for the button */}
										<TableCell>
											{/* Manage Roles Button - Reverted to simple text, no loader */}
											<Button variant='outline' size='sm' onClick={() => openUserRolesModal(user)} disabled={isLoading.userRoles && selectedUser?.id === user.id}>
												Manage Roles
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>{' '}
				{/* Removed trailing comment */}
			</section>

			{/* --- Modals --- */}

			{/* User Roles Management Modal */}
			<Dialog open={isUserRolesModalOpen} onOpenChange={setIsUserRolesModalOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle>Manage Roles for {selectedUser?.email}</DialogTitle>
						<DialogDescription>Assign or remove roles for this user.</DialogDescription>
					</DialogHeader>
					{isLoading.userRoles ? (
						<div className='flex justify-center items-center p-8'>
							<Loader2 className='h-6 w-6 animate-spin' />
						</div>
					) : (
						<div className='grid gap-4 py-4'>
							<h4 className='font-medium mb-2'>Available Roles</h4>
							<ScrollArea className='h-[200px] border rounded p-2'>
								<div className='space-y-2'>
									{roles.map((roleName) => {
										const isAssigned = userRolesMap[selectedUser?.id || '']?.includes(roleName)
										return (
											<div key={roleName} className='flex items-center justify-between'>
												<Label htmlFor={`role-${roleName}`} className='flex-1 cursor-pointer'>
													{roleName}
												</Label>
												<Checkbox
													id={`role-${roleName}`}
													checked={isAssigned}
													onCheckedChange={(checked) => {
														if (checked) {
															handleAddRoleToUser(selectedUser?.id, roleName)
														} else {
															handleRemoveRoleFromUser(selectedUser?.id, roleName)
														}
													}}
													disabled={isLoading.action} // Disable checkbox during add/remove actions
												/>
											</div>
										)
									})}
									{roles.length === 0 && <p className='text-sm text-muted-foreground italic'>No roles defined.</p>}
								</div>
							</ScrollArea>
							{/* Display modal-specific errors - Added null check */}
							{error && (error.startsWith('Failed to add role:') || error.startsWith('Failed to remove role:')) ? <p className='text-sm text-destructive'>{error}</p> : null}
						</div>
					)}
					<DialogFooter>
						<DialogClose asChild>
							<Button type='button' variant='secondary' onClick={() => setError(null)}>
								{' '}
								{/* Clear error on close */}
								Close
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Role Permissions Management Modal */}
			<Dialog open={isRolePermsModalOpen} onOpenChange={setIsRolePermsModalOpen}>
				<DialogContent className='sm:max-w-[600px]'>
					<DialogHeader>
						<DialogTitle>Manage Permissions for Role: {selectedRole}</DialogTitle>
						<DialogDescription>Add or remove permissions (object-action pairs) for this role.</DialogDescription>
					</DialogHeader>
					{isLoading.rolePermissions ? (
						<div className='flex justify-center items-center p-8'>
							<Loader2 className='h-6 w-6 animate-spin' />
						</div>
					) : (
						<div className='py-4 space-y-4'>
							{/* Add New Permission Form */}
							<div className='flex gap-2 items-end border-b pb-4'>
								<div className='flex-1 space-y-1'>
									<Label htmlFor='new-perm-object'>Object</Label>
									<Input id='new-perm-object' placeholder='e.g., users' value={newPermObject} onChange={(e) => setNewPermObject(e.target.value)} disabled={isLoading.action} />
								</div>
								<div className='flex-1 space-y-1'>
									<Label htmlFor='new-perm-action'>Action</Label>
									<Input id='new-perm-action' placeholder='e.g., read' value={newPermAction} onChange={(e) => setNewPermAction(e.target.value)} disabled={isLoading.action} />
								</div>
								<Button onClick={() => handleAddPermissionToRole(selectedRole, newPermObject, newPermAction)} disabled={isLoading.action || !newPermObject || !newPermAction}>
									{isLoading.action ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
									Add
								</Button>
							</div>

							{/* Existing Permissions List */}
							<h4 className='font-medium'>Assigned Permissions</h4>
							<ScrollArea className='h-[250px] border rounded p-2'>
								{!rolePermissionsMap[selectedRole || ''] || rolePermissionsMap[selectedRole || ''].length === 0 ? (
									<p className='text-sm text-muted-foreground italic p-2'>No permissions assigned.</p>
								) : (
									Object.entries(groupPermissionsByObject(rolePermissionsMap[selectedRole || ''])).map(([object, actions]) => (
										<div key={object} className='mb-3 last:mb-0'>
											<h5 className='text-sm font-semibold capitalize mb-1 px-2'>{object === '_' ? 'Other' : object}</h5>
											<div className='space-y-1'>
												{actions.map((action) => (
													<div key={`${object}:${action}`} className='flex items-center justify-between p-2 rounded hover:bg-muted/50'>
														<span className='text-sm'>{action}</span>
														<Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground hover:text-destructive' onClick={() => handleRemovePermissionFromRole(selectedRole, object, action)} disabled={isLoading.action}>
															<X className='h-4 w-4' />
															<span className='sr-only'>Remove permission</span>
														</Button>
													</div>
												))}
											</div>
										</div>
									))
								)}
							</ScrollArea>
							{/* Display modal-specific errors - Added null checks */}
							{error && (error.startsWith('Failed to add permission:') || error.startsWith('Failed to remove permission:')) ? <p className='text-sm text-destructive'>{error}</p> : null}
							{error && error === 'Object and Action cannot be empty.' ? <p className='text-sm text-destructive'>{error}</p> : null}
						</div>
					)}
					<DialogFooter>
						<DialogClose asChild>
							<Button type='button' variant='secondary' onClick={() => setError(null)}>
								{' '}
								{/* Clear error on close */}
								Close
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
