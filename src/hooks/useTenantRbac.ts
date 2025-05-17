'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
// import apiClient from '@/lib/apiClient' // Not directly used, API calls are in rbacService
import {
	getTenantRoles,
	getTenantRolePermissions,
	assignPermissionToTenantRole,
	revokePermissionFromTenantRole,
	deleteTenantRole,
} from '@/services/rbacService'
import {
	TenantRbacState,
	TenantRbacActions,
	UseTenantRbacReturn,
	TenantRbacLoadingState,
} from '@/types/tenantRbac'
import { PermissionInput } from '@/types/rbac'

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

const initialStateFactory = (tenantId: string | null): TenantRbacState => ({
	tenantId: tenantId,
	roles: [],
	rolePermissionsMap: {},
	loading: {
		initialRoles: true,
		rolePermissions: false,
		action: false,
	},
	error: null,
	createRoleError: null,
	selectedRole: null,
	isRolePermsModalOpen: false,
	isCreateRoleModalOpen: false,
	newPermObject: '',
	newPermAction: '',
})

export function useTenantRbac(initialTenantId: string | null): UseTenantRbacReturn {
	const [state, setState] = useState<TenantRbacState>(initialStateFactory(initialTenantId))

	const setLoading = useCallback((loadingState: Partial<TenantRbacLoadingState>) => {
		setState((prev) => ({ ...prev, loading: { ...prev.loading, ...loadingState } }))
	}, [])

	const setError = useCallback((error: string | null) => {
		setState((prev) => ({ ...prev, error }))
	}, [])

	const setCreateRoleError = useCallback((error: string | null) => {
		setState((prev) => ({ ...prev, createRoleError: error }))
	}, [])

	const setTenantIdInternal = useCallback((tenantId: string | null) => {
		setState(initialStateFactory(tenantId)); // Reset state when tenantId changes
	}, []);

	// --- Data Fetching ---
	const fetchTenantRolesInternal = useCallback(async (tenantId: string) => {
		if (!tenantId) {
			setState(prev => ({ ...prev, roles: [], loading: { ...prev.loading, initialRoles: false } }));
			return;
		}
		setLoading({ initialRoles: true })
		setError(null)
		try {
			const rolesRes = await getTenantRoles(tenantId)
			setState((prev) => ({
				...prev,
				roles: rolesRes.roles || [],
				rolePermissionsMap: {}, // Reset permissions when roles are refetched for a new tenant
			}))
		} catch (err) {
			console.error(`Error fetching roles for tenant ${tenantId}:`, err)
			let errorMessage = 'Unknown error'
			if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to load tenant roles: ${errorMessage}`)
			setState(prev => ({ ...prev, roles: [] }));
		} finally {
			setLoading({ initialRoles: false })
		}
	}, [])

	useEffect(() => {
		if (state.tenantId) {
			fetchTenantRolesInternal(state.tenantId);
		} else {
			setState(prev => ({ ...prev, roles: [], loading: { ...prev.loading, initialRoles: false } }));
		}
	}, [state.tenantId, fetchTenantRolesInternal]); // fetchTenantRolesInternal is stable due to its own useCallback([])

	const fetchTenantRolePermissionsInternal = useCallback(
		async (tenantId: string, roleName: string) => {
			if (!tenantId || !roleName) return
			setLoading({ rolePermissions: true }) // setLoading is stable
			setError(null)
			try {
				const res = await getTenantRolePermissions(tenantId, roleName)
				setState((prev) => ({
					...prev,
					rolePermissionsMap: { ...prev.rolePermissionsMap, [roleName]: res.permissions || [] },
				}))
			} catch (err) {
				console.error(`Error fetching permissions for role ${roleName} in tenant ${tenantId}:`, err)
				let errorMessage = 'Unknown error'
				if (err instanceof Error) errorMessage = err.message
				else if (typeof err === 'string') errorMessage = err
				setError(`Role Permissions Error: ${errorMessage}`)
				setState((prev) => ({
					...prev,
					rolePermissionsMap: { ...prev.rolePermissionsMap, [roleName]: [] },
				}))
			} finally {
				setLoading({ rolePermissions: false })
			}
		},
		[setLoading, setError], // Dependencies for fetchTenantRolePermissionsInternal
	)

	// --- Modal Management ---
	const openRolePermsModal = useCallback((roleName: string) => {
		if (!state.tenantId) return
		setState((prev) => ({
			...prev,
			selectedRole: roleName,
			isRolePermsModalOpen: true,
			newPermObject: '',
			newPermAction: '',
		}))
		// fetchTenantRolePermissionsInternal is stable, state.tenantId is a value
		fetchTenantRolePermissionsInternal(state.tenantId, roleName)
	}, [state.tenantId, fetchTenantRolePermissionsInternal])

	const closeRolePermsModal = useCallback(() => {
		setState((prev) => ({ ...prev, isRolePermsModalOpen: false, selectedRole: null, error: null }))
	}, [])

	const openCreateRoleModal = useCallback(() => {
		setState((prev) => ({ ...prev, isCreateRoleModalOpen: true, createRoleError: null }))
	}, [])

	const closeCreateRoleModal = useCallback(() => {
		setState((prev) => ({ ...prev, isCreateRoleModalOpen: false, createRoleError: null }))
	}, [])

	const clearModalErrors = useCallback(() => {
		setError(null) // setError is stable
		setCreateRoleError(null) // setCreateRoleError is stable
	}, [setError, setCreateRoleError])

	// --- Action Handlers ---
	const handleAddPermissionToTenantRole = useCallback(async (roleName: string | null, object: string, action: string) => {
		if (!state.tenantId || !roleName || !object || !action) {
			setError('Tenant ID, Role, Object, and Action cannot be empty.') // setError is stable
			return
		}
		if (state.rolePermissionsMap[roleName]?.some((p) => p[0] === object && p[1] === action)) {
			return // Permission already exists
		}

		const payload: PermissionInput = { object, action }
		setLoading({ action: true })
		setError(null)
		try {
			await assignPermissionToTenantRole(state.tenantId, roleName, [payload])
			setState((prev) => ({
				...prev,
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: [...(prev.rolePermissionsMap[roleName] || []), [object, action]].filter((p, i, a) => a.findIndex((p2) => p2[0] === p[0] && p2[1] === p[1]) === i),
				},
				newPermObject: '',
				newPermAction: '',
			}))
		} catch (err) {
			console.error(`Error adding permission [${object}, ${action}] to role ${roleName} in tenant ${state.tenantId}:`, err)
			let errorMessage = 'Unknown error'
			if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to add permission: ${errorMessage}`) // setError is stable
		} finally {
			setLoading({ action: false }) // setLoading is stable
		}
	}, [state.tenantId, state.rolePermissionsMap, setLoading, setError])

	const handleRemovePermissionFromTenantRole = useCallback(async (roleName: string | null, object: string, action: string) => {
		if (!state.tenantId || !roleName) return
		setLoading({ action: true }) // setLoading is stable
		setError(null)
		try {
			await revokePermissionFromTenantRole(state.tenantId, roleName, object, action)
			setState((prev) => ({
				...prev,
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: (prev.rolePermissionsMap[roleName] || []).filter((p) => !(p[0] === object && p[1] === action)),
				},
			}))
		} catch (err) {
			console.error(`Error removing permission [${object}, ${action}] from role ${roleName} in tenant ${state.tenantId}:`, err)
			let errorMessage = 'Unknown error'
			if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to remove permission: ${errorMessage}`) // setError is stable
		} finally {
			setLoading({ action: false }) // setLoading is stable
		}
	}, [state.tenantId, setLoading, setError])

	const handleCreateTenantRole = useCallback(async (roleNameValue: string, firstPermissionObject: string, firstPermissionAction: string) => {
		if (!state.tenantId) {
			setCreateRoleError('Tenant ID is not set.') // setCreateRoleError is stable
			return
		}
		const roleName = roleNameValue.trim()
		if (!roleName || !firstPermissionObject || !firstPermissionAction) {
			setCreateRoleError('Role name, permission object, and action are required.')
			return
		}

		setLoading({ action: true })
		setCreateRoleError(null)
		setError(null)

		try {
			// Create role by assigning its first permission
			const permissionPayload: PermissionInput = { object: firstPermissionObject, action: firstPermissionAction }
			await assignPermissionToTenantRole(state.tenantId, roleName, [permissionPayload])

			setState((prev) => ({
				...prev,
				roles: [...prev.roles, roleName].sort().filter((v, i, a) => a.indexOf(v) === i),
				rolePermissionsMap: {
					...prev.rolePermissionsMap,
					[roleName]: [[firstPermissionObject, firstPermissionAction]],
				},
				isCreateRoleModalOpen: false,
			}))
		} catch (err) {
			console.error(`Error creating role "${roleName}" in tenant ${state.tenantId}:`, err)
			let errorMessage = 'Unknown error'
			if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setCreateRoleError(`Failed to create role: ${errorMessage}`) // setCreateRoleError is stable
		} finally {
			setLoading({ action: false }) // setLoading is stable
		}
	}, [state.tenantId, setLoading, setError, setCreateRoleError])

	const handleDeleteTenantRoleInternal = useCallback(async (roleName: string) => {
		if (!state.tenantId || !roleName) return;
		setLoading({ action: true }); // setLoading is stable
		setError(null); // setError is stable
		try {
			await deleteTenantRole(state.tenantId, roleName);
			setState((prev) => {
				const newRoles = prev.roles.filter((r) => r !== roleName);
				const newRolePermissionsMap = { ...prev.rolePermissionsMap };
				delete newRolePermissionsMap[roleName];
				return {
					...prev,
					roles: newRoles,
					rolePermissionsMap: newRolePermissionsMap,
					selectedRole: prev.selectedRole === roleName ? null : prev.selectedRole,
				};
			});
		} catch (err) {
			console.error(`Error deleting role ${roleName} in tenant ${state.tenantId}:`, err);
			let errorMessage = 'Unknown error'
			if (err instanceof Error) errorMessage = err.message
			else if (typeof err === 'string') errorMessage = err
			setError(`Failed to delete role: ${errorMessage}`); // setError is stable
		} finally {
			setLoading({ action: false }); // setLoading is stable
		}
	}, [state.tenantId, setLoading, setError]);

	// --- Derived State ---
	const groupedPermissions = useCallback(
		(roleName: string | null) => {
			if (!roleName) return {}
			return groupPermissionsByObject(state.rolePermissionsMap[roleName])
		},
		[state.rolePermissionsMap],
	)

	const setNewPermObject = useCallback((value: string) => setState((prev) => ({ ...prev, newPermObject: value })), []);
	const setNewPermAction = useCallback((value: string) => setState((prev) => ({ ...prev, newPermAction: value })), []);

	// --- Actions Object ---
	const actions: TenantRbacActions = useMemo(() => ({
		fetchTenantRoles: fetchTenantRolesInternal,
		fetchTenantRolePermissions: fetchTenantRolePermissionsInternal,
		openRolePermsModal,
		closeRolePermsModal,
		openCreateRoleModal,
		closeCreateRoleModal,
		handleAddPermissionToTenantRole,
		handleRemovePermissionFromTenantRole,
		handleCreateTenantRole,
		handleDeleteTenantRole: handleDeleteTenantRoleInternal,
		setNewPermObject,
		setNewPermAction,
		setError,
		clearModalErrors,
		setTenantId: setTenantIdInternal,
	}), [
		fetchTenantRolesInternal, fetchTenantRolePermissionsInternal, openRolePermsModal, closeRolePermsModal,
		openCreateRoleModal, closeCreateRoleModal, handleAddPermissionToTenantRole, handleRemovePermissionFromTenantRole,
		handleCreateTenantRole, handleDeleteTenantRoleInternal, setNewPermObject, setNewPermAction, setError,
		clearModalErrors, setTenantIdInternal
	]);

	return {
		...state,
		actions,
		groupedPermissions,
	}
}
