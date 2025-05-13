import { useState, useEffect, useCallback, useMemo } from 'react'
import apiClient, { UserOutput, PaginatedUsers } from '@/lib/apiClient'
import {
	RbacActions,
	UseRbacReturn,
	RbacLoadingState,
	RoleListOutput,
	UserRolesOutput,
	UserRoleInput,
	RolePermissionsOutput,
	RolePermissionInput,
	CreateRoleWithPermissionInput,
	CreateRoleFormValues,
	RbacState, // Added RbacState import
} from '@/types/rbac'

// Helper function to extract error messages
const getErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') {
		return error
	}
	if (error instanceof Error) {
		return error.message
	}
	// Check for Axios-like error structure
	if (typeof error === 'object' && error !== null && 'response' in error) {
		const errResponse = error as { response?: { data?: { error?: string; message?: string } | string } }
		const data = errResponse.response?.data
		if (data) {
			if (typeof data === 'object' && data !== null) {
				if (typeof data.error === 'string' && data.error) {
					return data.error
				}
				if (typeof data.message === 'string' && data.message) {
					return data.message
				}
			} else if (typeof data === 'string' && data) {
				return data
			}
		}
	}
	// Fallback for other object errors that might have a message property
	if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: string }).message === 'string') {
		return (error as { message: string }).message
	}
	return 'An unknown error occurred'
}

// Helper function (can be kept here or moved to utils if used elsewhere)
const groupPermissionsByObject = (permissions: Array<[string, string]> | undefined): Record<string, string[]> => {
	if (!permissions) return {}
	return permissions.reduce((acc, pair: [string, string]) => { // Explicitly type pair
		if (pair?.length === 2) { // This check is technically redundant if pair is [string, string] but safe
			const [object, action] = pair
			if (!acc[object]) acc[object] = []
			if (!acc[object].includes(action)) acc[object].push(action)
		}
		return acc
	}, {} as Record<string, string[]>)
}

const initialState: RbacState = {
	roles: [],
	users: [],
	userRolesMap: {},
	rolePermissionsMap: {},
	loading: {
		initial: true,
		userRoles: false,
		rolePermissions: false,
		action: false,
	},
	error: null,
	createRoleError: null,
	selectedUser: null,
	selectedRole: null,
	isUserRolesModalOpen: false,
	isRolePermsModalOpen: false,
	isCreateRoleModalOpen: false,
	newPermObject: '',
	newPermAction: '',
	searchQuery: '',
}

export function useRbac(): UseRbacReturn {
	const [state, setState] = useState<RbacState>(initialState)

	const setLoading = (loadingState: Partial<RbacLoadingState>) => {
		setState((prev: RbacState) => ({ ...prev, loading: { ...prev.loading, ...loadingState } }))
	}

	const setError = (error: string | null) => {
		setState((prev: RbacState) => ({ ...prev, error }))
	}

	const setCreateRoleError = (error: string | null) => {
		setState((prev: RbacState) => ({ ...prev, createRoleError: error }))
	}

	// --- Data Fetching ---
	useEffect(() => {
		const fetchInitialData = async () => {
			setLoading({ initial: true })
			setError(null)
			try {
				const [rolesRes, usersRes] = await Promise.all([apiClient.get<RoleListOutput>('/api/v1/admin/rbac/roles'), apiClient.get<PaginatedUsers>('/api/v1/users/search')])
				setState((prev: RbacState) => ({
					...prev,
					roles: rolesRes.data.roles || [],
					users: usersRes.data.users || [],
				}))
			} catch (err) {
				console.error('Error fetching initial RBAC data:', err)
				setError(`Failed to load initial data: ${getErrorMessage(err)}`)
			} finally {
				setLoading({ initial: false })
			}
		}
		fetchInitialData()
	}, [])

	const fetchUserRoles = useCallback(
		async (userId: string) => {
			if (state.userRolesMap[userId]) return
			setLoading({ userRoles: true })
			setError(null)
			try {
				const res = await apiClient.get<UserRolesOutput>(`/api/v1/admin/rbac/users/${userId}/roles`)
				setState((prev: RbacState) => ({
					...prev,
					userRolesMap: { ...prev.userRolesMap, [userId]: res.data.roles || [] },
				}))
			} catch (err) {
				console.error(`Error fetching roles for user ${userId}:`, err)
				setError(`User Roles Error: ${getErrorMessage(err)}`)
				setState((prev: RbacState) => ({
					...prev,
					userRolesMap: { ...prev.userRolesMap, [userId]: [] }, // Set empty on error
				}))
			} finally {
				setLoading({ userRoles: false })
			}
		},
		[state.userRolesMap],
	)

	const fetchRolePermissions = useCallback(
		async (roleName: string) => {
			if (state.rolePermissionsMap[roleName]) return
			setLoading({ rolePermissions: true })
			setError(null)
			try {
				const res = await apiClient.get<RolePermissionsOutput>(`/api/v1/admin/rbac/roles/${roleName}/permissions`)
				setState((prev: RbacState) => ({
					...prev,
					rolePermissionsMap: { ...prev.rolePermissionsMap, [roleName]: res.data.permissions || [] },
				}))
			} catch (err) {
				console.error(`Error fetching permissions for role ${roleName}:`, err)
				setError(`Role Permissions Error: ${getErrorMessage(err)}`)
				setState((prev: RbacState) => ({
					...prev,
					rolePermissionsMap: { ...prev.rolePermissionsMap, [roleName]: [] }, // Set empty on error
				}))
			} finally {
				setLoading({ rolePermissions: false })
			}
		},
		[state.rolePermissionsMap],
	)

	// --- Modal Management ---
	const openUserRolesModal = (user: UserOutput) => {
		setState((prev: RbacState) => ({ ...prev, selectedUser: user, isUserRolesModalOpen: true }))
		fetchUserRoles(user.id)
	}

	const closeUserRolesModal = () => {
		setState((prev: RbacState) => ({ ...prev, isUserRolesModalOpen: false, selectedUser: null, error: null }))
	}

	const openRolePermsModal = (roleName: string) => {
		setState((prev: RbacState) => ({
			...prev,
			selectedRole: roleName,
			isRolePermsModalOpen: true,
			newPermObject: '',
			newPermAction: '',
		}))
		fetchRolePermissions(roleName)
	}

	const closeRolePermsModal = () => {
		setState((prev: RbacState) => ({ ...prev, isRolePermsModalOpen: false, selectedRole: null, error: null }))
	}

	const openCreateRoleModal = () => {
		setState((prev: RbacState) => ({ ...prev, isCreateRoleModalOpen: true, createRoleError: null }))
	}

	const closeCreateRoleModal = () => {
		setState((prev: RbacState) => ({ ...prev, isCreateRoleModalOpen: false, createRoleError: null }))
	}

	const clearModalErrors = () => {
		setError(null)
		setCreateRoleError(null)
	}

	// --- Action Handlers ---
	const handleAddRoleToUser = async (userId: string | undefined, roleName: string) => {
		if (!userId || state.userRolesMap[userId]?.includes(roleName)) return
		setLoading({ action: true })
		setError(null)
		try {
			const payload: UserRoleInput = { userId, role: roleName }
			await apiClient.post(`/api/v1/admin/rbac/users/roles`, payload)
			setState((prev: RbacState) => ({
				...prev,
				userRolesMap: {
					...prev.userRolesMap,
					[userId]: [...(prev.userRolesMap[userId] || []), roleName],
				},
			}))
		} catch (err) {
			console.error(`Error adding role ${roleName} to user ${userId}:`, err)
			setError(`Failed to add role: ${getErrorMessage(err)}`)
		} finally {
			setLoading({ action: false })
		}
	}

	const handleRemoveRoleFromUser = async (userId: string | undefined, roleName: string) => {
		if (!userId) return
		setLoading({ action: true })
		setError(null)
		try {
			await apiClient.delete(`/api/v1/admin/rbac/users/${userId}/roles/${encodeURIComponent(roleName)}`)
			setState((prev: RbacState) => ({
				...prev,
				userRolesMap: {
					...prev.userRolesMap,
					[userId]: (prev.userRolesMap[userId] || []).filter((r: string) => r !== roleName),
				},
			}))
		} catch (err) {
			console.error(`Error removing role ${roleName} from user ${userId}:`, err)
			setError(`Failed to remove role: ${getErrorMessage(err)}`)
		} finally {
			setLoading({ action: false })
		}
	}

	const handleAddPermissionToRole = async (roleName: string | null, object: string, action: string) => {
		if (!roleName || !object || !action) {
			setError('Object and Action cannot be empty.')
			return
		}
		if (state.rolePermissionsMap[roleName]?.some((p) => p[0] === object && p[1] === action)) {
			console.log(`Permission [${object}, ${action}] already exists for role ${roleName}`)
			return
		}

		const permission: [string, string] = [object, action] // Explicitly type as tuple
		const payload: RolePermissionInput = { role: roleName, permission }
		setLoading({ action: true })
		setError(null)
		try {
			await apiClient.post(`/api/v1/admin/rbac/roles/permissions`, payload)
			setState((prev: RbacState) => {
				const currentPermissions = prev.rolePermissionsMap[roleName as string] || []
				const newPermissions: Array<[string, string]> = [...currentPermissions, permission]
				return {
					...prev,
					rolePermissionsMap: {
						...prev.rolePermissionsMap,
						[roleName as string]: newPermissions,
					},
					newPermObject: '',
					newPermAction: '',
				}
			})
		} catch (err) {
			console.error(`Error adding permission [${object}, ${action}] to role ${roleName}:`, err)
			setError(`Failed to add permission: ${getErrorMessage(err)}`)
		} finally {
			setLoading({ action: false })
		}
	}

	const handleRemovePermissionFromRole = async (roleName: string | null, object: string, action: string) => {
		if (!roleName) return
		setLoading({ action: true })
		setError(null)
		try {
			await apiClient.delete(`/api/v1/admin/rbac/roles/${encodeURIComponent(roleName)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`)
			setState((prev: RbacState) => ({
				...prev,
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: (prev.rolePermissionsMap[roleName] || []).filter((p: [string, string]) => !(p[0] === object && p[1] === action)),
				},
			}))
		} catch (err) {
			console.error(`Error removing permission [${object}, ${action}] from role ${roleName}:`, err)
			setError(`Failed to remove permission: ${getErrorMessage(err)}`)
		} finally {
			setLoading({ action: false })
		}
	}

	const handleCreateRole = async (data: CreateRoleFormValues) => {
		setLoading({ action: true })
		setCreateRoleError(null)
		setError(null)
		const roleName = data.roleName.trim()
		const subject = data.subject.trim()
		const action = data.action.trim()

		if (!roleName || !subject || !action) {
			setCreateRoleError('Role name, subject, and action cannot be empty.')
			setLoading({ action: false })
			return
		}
		const permission: [string, string] = [subject, action] // Explicitly type as tuple

		try {
			const payload: CreateRoleWithPermissionInput = { role: roleName, permission }
			// Changed endpoint: Assuming POST to /roles creates a role and can accept initial permissions
			await apiClient.post('/api/v1/admin/rbac/roles', payload)

			setState((prev: RbacState) => {
				const newRolePermissions: Array<[string, string]> = [permission]
				return {
					...prev,
					roles: [...prev.roles, roleName].sort().filter((v: string, i: number, a: string[]) => a.indexOf(v) === i), // Keep roles unique and sorted
					rolePermissionsMap: {
						...prev.rolePermissionsMap,
						[roleName]: newRolePermissions, // Set initial permission for the new role
					},
					isCreateRoleModalOpen: false,
				}
			})
		} catch (err) {
			console.error(`Error creating role "${roleName}":`, err)
			setCreateRoleError(`Failed to create role: ${getErrorMessage(err)}`)
		} finally {
			setLoading({ action: false })
		}
	}

	// --- Derived State ---
	const filteredUsers = useMemo(() => {
		return state.users.filter((user: UserOutput) => (user.first_name + ' ' + user.last_name).toLowerCase().includes(state.searchQuery.toLowerCase()) || user.email.toLowerCase().includes(state.searchQuery.toLowerCase()))
	}, [state.users, state.searchQuery])

	const groupedPermissions = useCallback(
		(roleName: string | null) => {
			if (!roleName) return {}
			return groupPermissionsByObject(state.rolePermissionsMap[roleName])
		},
		[state.rolePermissionsMap],
	)

	// --- Actions Object ---
	const actions: RbacActions = {
		fetchUserRoles,
		fetchRolePermissions,
		openUserRolesModal,
		closeUserRolesModal,
		openRolePermsModal,
		closeRolePermsModal,
		openCreateRoleModal,
		closeCreateRoleModal,
		handleAddRoleToUser,
		handleRemoveRoleFromUser,
		handleAddPermissionToRole,
		handleRemovePermissionFromRole,
		handleCreateRole,
		setNewPermObject: (value: string) => setState((prev: RbacState) => ({ ...prev, newPermObject: value })),
		setNewPermAction: (value: string) => setState((prev: RbacState) => ({ ...prev, newPermAction: value })),
		setSearchQuery: (value: string) => setState((prev: RbacState) => ({ ...prev, searchQuery: value })),
		setError,
		clearModalErrors,
	}

	return {
		...state,
		actions,
		groupedPermissions,
		filteredUsers,
	}
}
