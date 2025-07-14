import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useCallback} from 'react'

import {
	listUsersInTenant,
	updateUserInTenant,
	removeUserFromTenant,
	updateUserRoleInTenant,
} from '@/services/tenantService'
import {PaginatedTenantUsersResponse, TenantUserResponse} from '@/types/tenant'

interface UseTenantUsersOptions {
	tenantId: string
	page?: number
	limit?: number
	enabled?: boolean
}

export const useTenantUsers = ({tenantId, page = 1, limit = 10, enabled = true}: UseTenantUsersOptions) => {
	const queryClient = useQueryClient()

	// Query for fetching users
	const usersQuery = useQuery({
		queryKey: ['tenantUsers', tenantId, page],
		queryFn: () => listUsersInTenant(tenantId, limit, (page - 1) * limit),
		enabled: enabled && !!tenantId,
	})

	// Mutation for updating user status
	const updateUserStatusMutation = useMutation({
		mutationFn: ({userId, status}: {userId: string; status: string}) =>
			updateUserInTenant(tenantId, userId, {
				status_in_tenant: status,
			}),
		onMutate: async ({userId, status}) => {
			await queryClient.cancelQueries({queryKey: ['tenantUsers', tenantId, page]})
			const previousData = queryClient.getQueryData(['tenantUsers', tenantId, page])

			queryClient.setQueryData(['tenantUsers', tenantId, page], (old: PaginatedTenantUsersResponse | undefined) => {
				if (!old?.users) return old
				return {
					...old,
					users: old.users.map((user: TenantUserResponse) =>
						user.user_id === userId ? {...user, status_in_tenant: status} : user,
					),
				}
			})

			return {previousData}
		},
		onError: (_err, _vars, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(['tenantUsers', tenantId, page], context.previousData)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	// Mutation for updating user role
	const updateUserRoleMutation = useMutation({
		mutationFn: ({userId, role}: {userId: string; role: string}) => updateUserRoleInTenant(tenantId, userId, role),
		onMutate: async ({userId, role}) => {
			await queryClient.cancelQueries({queryKey: ['tenantUsers', tenantId, page]})
			const previousData = queryClient.getQueryData(['tenantUsers', tenantId, page])

			queryClient.setQueryData(['tenantUsers', tenantId, page], (old: PaginatedTenantUsersResponse | undefined) => {
				if (!old?.users) return old
				return {
					...old,
					users: old.users.map((user: TenantUserResponse) =>
						user.user_id === userId ? {...user, roles: [role]} : user,
					),
				}
			})

			return {previousData}
		},
		onError: (_err, _vars, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(['tenantUsers', tenantId, page], context.previousData)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	// Mutation for removing user
	const removeUserMutation = useMutation({
		mutationFn: (userId: string) => removeUserFromTenant(tenantId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	// Handler functions
	const handleRemoveUser = useCallback(
		(userId: string) => {
			removeUserMutation.mutate(userId)
		},
		[removeUserMutation],
	)

	const handleChangeUserRole = useCallback(
		(userId: string, role: string) => {
			updateUserRoleMutation.mutate({userId, role})
		},
		[updateUserRoleMutation],
	)

	const handleChangeUserStatus = useCallback(
		(userId: string, status: string) => {
			updateUserStatusMutation.mutate({userId, status})
		},
		[updateUserStatusMutation],
	)

	return {
		// Data
		users: usersQuery.data?.users || [],
		pagination: usersQuery.data ? {
			total: usersQuery.data.total,
			limit: usersQuery.data.limit,
			offset: usersQuery.data.offset,
			totalPages: usersQuery.data.total_pages,
			hasPrevious: usersQuery.data.has_previous,
			hasNext: usersQuery.data.has_next,
		} : null,
		
		// Query states
		isLoading: usersQuery.isLoading,
		error: usersQuery.error,
		isRefetching: usersQuery.isRefetching,
		
		// Mutation states
		isUpdatingStatus: updateUserStatusMutation.isPending,
		isUpdatingRole: updateUserRoleMutation.isPending,
		isRemoving: removeUserMutation.isPending,
		
		// Actions
		handleRemoveUser,
		handleChangeUserRole,
		handleChangeUserStatus,
		refetch: usersQuery.refetch,
	}
}
