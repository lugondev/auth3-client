import { useState, useEffect, useCallback, useMemo } from 'react'
import apiClient, { UserOutput, PaginatedUsers } from '@/lib/apiClient'
import {
	RbacState,
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
} from '@/types/rbac' // Import types from the new file

// Helper function (can be kept here or moved to utils if used elsewhere)
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
		setState((prev) => ({ ...prev, loading: { ...prev.loading, ...loadingState } }))
	}

	const setError = (error: string | null) => {
		setState((prev) => ({ ...prev, error }))
	}

	const setCreateRoleError = (error: string | null) => {
		setState((prev) => ({ ...prev, createRoleError: error }))
	}

	// --- Data Fetching ---
	useEffect(() => {
		const fetchInitialData = async () => {
			setLoading({ initial: true })
			setError(null)
			try {
				const [rolesRes, usersRes] = await Promise.all([apiClient.get<RoleListOutput>('/api/v1/rbac/roles'), apiClient.get<PaginatedUsers>('/api/v1/users/search')]) // Assuming /users/search fetches all users for RBAC context
				setState((prev) => ({
					...prev,
					roles: rolesRes.data.roles || [],
					users: usersRes.data.users || [],
				}))
			} catch (err) {
				console.error('Error fetching initial RBAC data:', err)
				let errorMessage = 'Unknown error'
				if (err instanceof Error) errorMessage = err.message
				else if (typeof err === 'string') errorMessage = err
				setError(`Failed to load initial data: ${errorMessage}`)
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
				const res = await apiClient.get<UserRolesOutput>(`/api/v1/rbac/users/${userId}/roles`)
				setState((prev) => ({
					...prev,
					userRolesMap: { ...prev.userRolesMap, [userId]: res.data.roles || [] },
				}))
			} catch (err) {
				console.error(`Error fetching roles for user ${userId}:`, err)
				let errorMessage = 'Unknown error'
				if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
					errorMessage = String(err.response.data.error)
				} else if (err instanceof Error) errorMessage = err.message
				else if (typeof err === 'string') errorMessage = err
				setError(`User Roles Error: ${errorMessage}`)
				setState((prev) => ({
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
				const res = await apiClient.get<RolePermissionsOutput>(`/api/v1/rbac/roles/${roleName}/permissions`)
				setState((prev) => ({
					...prev,
					rolePermissionsMap: { ...prev.rolePermissionsMap, [roleName]: res.data.permissions || [] },
				}))
			} catch (err) {
				console.error(`Error fetching permissions for role ${roleName}:`, err)
				let errorMessage = 'Unknown error'
				if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
					errorMessage = String(err.response.data.error)
				} else if (err instanceof Error) errorMessage = err.message
				else if (typeof err === 'string') errorMessage = err
				setError(`Role Permissions Error: ${errorMessage}`)
				setState((prev) => ({
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
		setState((prev) => ({ ...prev, selectedUser: user, isUserRolesModalOpen: true }))
		fetchUserRoles(user.id)
	}

	const closeUserRolesModal = () => {
		setState((prev) => ({ ...prev, isUserRolesModalOpen: false, selectedUser: null, error: null })) // Clear error on close
	}

	const openRolePermsModal = (roleName: string) => {
		setState((prev) => ({
			...prev,
			selectedRole: roleName,
			isRolePermsModalOpen: true,
			newPermObject: '', // Reset form
			newPermAction: '', // Reset form
		}))
		fetchRolePermissions(roleName)
	}

	const closeRolePermsModal = () => {
		setState((prev) => ({ ...prev, isRolePermsModalOpen: false, selectedRole: null, error: null })) // Clear error on close
	}

	const openCreateRoleModal = () => {
		setState((prev) => ({ ...prev, isCreateRoleModalOpen: true, createRoleError: null })) // Clear specific error
	}

	const closeCreateRoleModal = () => {
		setState((prev) => ({ ...prev, isCreateRoleModalOpen: false, createRoleError: null })) // Clear specific error
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
			await apiClient.post(`/api/v1/rbac/users/roles`, payload)
			setState((prev) => ({
				...prev,
				userRolesMap: {
					...prev.userRolesMap,
					[userId]: [...(prev.userRolesMap[userId] || []), roleName].filter((v, i, a) => a.indexOf(v) === i),
				},
			}))
		} catch (err) {
			console.error(`Error adding role ${roleName} to user ${userId}:`, err)
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to add role: ${errorMessage}`)
		} finally {
			setLoading({ action: false })
		}
	}

	const handleRemoveRoleFromUser = async (userId: string | undefined, roleName: string) => {
		if (!userId) return
		setLoading({ action: true })
		setError(null)
		try {
			await apiClient.delete(`/api/v1/rbac/users/${userId}/roles/${encodeURIComponent(roleName)}`)
			setState((prev) => ({
				...prev,
				userRolesMap: {
					...prev.userRolesMap,
					[userId]: (prev.userRolesMap[userId] || []).filter((r) => r !== roleName),
				},
			}))
		} catch (err) {
			console.error(`Error removing role ${roleName} from user ${userId}:`, err)
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to remove role: ${errorMessage}`)
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

		const permission: string[] = [object, action]
		const payload: RolePermissionInput = { role: roleName, permission }
		setLoading({ action: true })
		setError(null)
		try {
			await apiClient.post(`/api/v1/rbac/roles/permissions`, payload)
			setState((prev) => ({
				...prev,
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: [...(prev.rolePermissionsMap[roleName] || []), permission].filter((p, i, a) => a.findIndex((p2) => p2[0] === p[0] && p2[1] === p[1]) === i),
				},
				newPermObject: '', // Clear input on success
				newPermAction: '', // Clear input on success
			}))
		} catch (err) {
			console.error(`Error adding permission [${object}, ${action}] to role ${roleName}:`, err)
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to add permission: ${errorMessage}`)
		} finally {
			setLoading({ action: false })
		}
	}

	const handleRemovePermissionFromRole = async (roleName: string | null, object: string, action: string) => {
		if (!roleName) return
		setLoading({ action: true })
		setError(null)
		try {
			await apiClient.delete(`/api/v1/rbac/roles/${encodeURIComponent(roleName)}/permissions/${encodeURIComponent(object)}/${encodeURIComponent(action)}`)
			setState((prev) => ({
				...prev,
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: (prev.rolePermissionsMap[roleName] || []).filter((p) => !(p[0] === object && p[1] === action)),
				},
			}))
		} catch (err) {
			console.error(`Error removing permission [${object}, ${action}] from role ${roleName}:`, err)
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to remove permission: ${errorMessage}`)
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
		const permission = [subject, action]

		try {
			const payload: CreateRoleWithPermissionInput = { role: roleName, permission }
			// Assuming endpoint remains /rbac/roles/permissions for creation based on original code
			await apiClient.post('/rbac/roles/permissions', payload)

			setState((prev) => ({
				...prev,
				roles: [...prev.roles, roleName].sort().filter((v, i, a) => a.indexOf(v) === i),
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: [...(prev.rolePermissionsMap[roleName] || []), permission].filter((p, i, a) => a.findIndex((p2) => p2[0] === p[0] && p2[1] === p[1]) === i),
				},
				isCreateRoleModalOpen: false, // Close modal on success
			}))
		} catch (err) {
			console.error(`Error creating role "${roleName}":`, err)
			let errorMessage = 'Unknown error'
			if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data) {
				errorMessage = String(err.response.data.error)
			} else if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setCreateRoleError(`Failed to create role: ${errorMessage}`)
		} finally {
			setLoading({ action: false })
		}
	}

	// --- Derived State ---
	const filteredUsers = useMemo(() => {
		return state.users.filter((user) => (user.first_name + ' ' + user.last_name).toLowerCase().includes(state.searchQuery.toLowerCase()) || user.email.toLowerCase().includes(state.searchQuery.toLowerCase()))
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
		setNewPermObject: (value: string) => setState((prev) => ({ ...prev, newPermObject: value })),
		setNewPermAction: (value: string) => setState((prev) => ({ ...prev, newPermAction: value })),
		setSearchQuery: (value: string) => setState((prev) => ({ ...prev, searchQuery: value })),
		setError, // Expose setError if needed externally
		clearModalErrors,
	}

	return {
		...state,
		actions,
		groupedPermissions,
		filteredUsers,
	}
}
