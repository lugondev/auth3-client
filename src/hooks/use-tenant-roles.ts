import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useCallback} from 'react'

import {
	getTenantRoles,
	createTenantRole,
	deleteTenantRole,
	getTenantRolePermissions,
	addTenantRolePermission,
	removeTenantRolePermission,
} from '@/services/tenantService'

interface UseTenantRolesOptions {
	tenantId: string
	enabled?: boolean
}

export const useTenantRoles = ({tenantId, enabled = true}: UseTenantRolesOptions) => {
	const queryClient = useQueryClient()

	// Query for fetching roles
	const rolesQuery = useQuery({
		queryKey: ['tenantRoles', tenantId],
		queryFn: () => getTenantRoles(tenantId),
		enabled: enabled && !!tenantId,
	})

	// Query for fetching role permissions
	const getRolePermissions = useCallback(
		(roleName: string) => {
			return queryClient.fetchQuery({
				queryKey: ['tenantRolePermissions', tenantId, roleName],
				queryFn: () => getTenantRolePermissions(tenantId, roleName),
			})
		},
		[queryClient, tenantId],
	)

	// Mutation for creating role
	const createRoleMutation = useMutation({
		mutationFn: (roleName: string) => createTenantRole(tenantId, roleName),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['tenantRoles', tenantId]})
		},
	})

	// Mutation for deleting role
	const deleteRoleMutation = useMutation({
		mutationFn: (roleName: string) => deleteTenantRole(tenantId, roleName),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['tenantRoles', tenantId]})
		},
	})

	// Mutation for adding role permission
	const addPermissionMutation = useMutation({
		mutationFn: ({roleName, object, action}: {roleName: string; object: string; action: string}) =>
			addTenantRolePermission(tenantId, roleName, object, action),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({queryKey: ['tenantRolePermissions', tenantId, variables.roleName]})
		},
	})

	// Mutation for removing role permission
	const removePermissionMutation = useMutation({
		mutationFn: ({roleName, object, action}: {roleName: string; object: string; action: string}) =>
			removeTenantRolePermission(tenantId, roleName, object, action),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({queryKey: ['tenantRolePermissions', tenantId, variables.roleName]})
		},
	})

	// Handler functions
	const handleCreateRole = useCallback(
		(roleName: string) => {
			return createRoleMutation.mutateAsync(roleName)
		},
		[createRoleMutation],
	)

	const handleDeleteRole = useCallback(
		(roleName: string) => {
			return deleteRoleMutation.mutateAsync(roleName)
		},
		[deleteRoleMutation],
	)

	const handleAddPermission = useCallback(
		(roleName: string, object: string, action: string) => {
			return addPermissionMutation.mutateAsync({roleName, object, action})
		},
		[addPermissionMutation],
	)

	const handleRemovePermission = useCallback(
		(roleName: string, object: string, action: string) => {
			return removePermissionMutation.mutateAsync({roleName, object, action})
		},
		[removePermissionMutation],
	)

	return {
		// Data
		roles: {
			custom: rolesQuery.data?.custom_roles	|| [],
			default: rolesQuery.data?.default_roles || [],
		},

		// Query states
		isLoading: rolesQuery.isLoading,
		error: rolesQuery.error,
		isRefetching: rolesQuery.isRefetching,

		// Mutation states
		isCreating: createRoleMutation.isPending,
		isDeleting: deleteRoleMutation.isPending,
		isAddingPermission: addPermissionMutation.isPending,
		isRemovingPermission: removePermissionMutation.isPending,

		// Actions
		handleCreateRole,
		handleDeleteRole,
		handleAddPermission,
		handleRemovePermission,
		getRolePermissions,
		refetch: rolesQuery.refetch,
	}
}
