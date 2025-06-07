'use client'

import React, {useCallback} from 'react'
import {useParams} from 'next/navigation'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Loader2} from 'lucide-react'

import {listUsersInTenant, updateUserInTenant, removeUserFromTenant} from '@/services/tenantService'
import {TenantUsersTable} from '@/components/tenants/TenantUsersTable'
import {TenantManagementLayout} from '@/components/tenants/management/TenantManagementLayout'
import {useAuth} from '@/contexts/AuthContext'
import {TransferTenantOwnershipSection} from '@/components/tenants/management/TransferTenantOwnershipSection'
import {TenantResponse} from '@/types/tenant'

interface TenantUsersQueryProps {
	tenantId: string
	roles: string[]
}

// TenantUsersQuery component for managing tenant users
function TenantUsersQuery({tenantId, roles}: TenantUsersQueryProps) {
	const queryClient = useQueryClient()
	const page = 1
	const limit = 10

	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['tenantUsers:', tenantId, page],
		queryFn: () => listUsersInTenant(tenantId, limit, (page - 1) * limit),
	})

	const updateUserMutation = useMutation({
		mutationFn: ({userId, status}: {userId: string; status: string}) =>
			updateUserInTenant(tenantId, userId, {
				status_in_tenant: status,
			}),
		onMutate: async ({userId, status}) => {
			await queryClient.cancelQueries({queryKey: ['tenantUsers:', tenantId, 1]})
			const previousData = queryClient.getQueryData(['tenantUsers:', tenantId, 1])
			queryClient.setQueryData(['tenantUsers:', tenantId, 1], (old: import('@/types/tenant').PaginatedTenantUsersResponse | undefined) => {
				if (!old?.users) return old
				return {
					...old,
					users: old.users.map((u: import('@/types/tenant').TenantUserResponse) => (u.user_id === userId ? {...u, status_in_tenant: status} : u)),
				}
			})
			return {previousData}
		},
		onError: (_err, _vars, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(['tenantUsers:', tenantId, 1], context.previousData)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	const updateUserRoleMutation = useMutation({
		mutationFn: ({userId, role}: {userId: string; role: string}) => import('@/services/tenantService').then((m) => m.updateUserRoleInTenant(tenantId, userId, role)),
		onMutate: async ({userId, role}) => {
			await queryClient.cancelQueries({queryKey: ['tenantUsers:', tenantId, 1]})
			const previousData = queryClient.getQueryData(['tenantUsers:', tenantId, 1])
			queryClient.setQueryData(['tenantUsers:', tenantId, 1], (old: import('@/types/tenant').PaginatedTenantUsersResponse | undefined) => {
				if (!old?.users) return old
				return {
					...old,
					users: old.users.map((u: import('@/types/tenant').TenantUserResponse) => (u.user_id === userId ? {...u, roles: [role]} : u)),
				}
			})
			return {previousData}
		},
		onError: (_err, _vars, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(['tenantUsers:', tenantId, 1], context.previousData)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	const removeUserMutation = useMutation({
		mutationFn: (userId: string) => removeUserFromTenant(tenantId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['tenantUsers', tenantId]})
		},
	})

	const handleRemoveUser = useCallback(
		(userId: string) => {
			removeUserMutation.mutate(userId)
		},
		[removeUserMutation],
	)

	if (isLoading) {
		return (
			<div className='flex justify-center p-4'>
				<Loader2 className='h-6 w-6 animate-spin' />
			</div>
		)
	}

	if (error) {
		return <div className='text-destructive'>Error loading users: {error.message}</div>
	}

	return (
		<TenantUsersTable
			users={usersData?.users || []}
			roles={roles}
			onChangeUserRole={(userId, role) => {
				updateUserRoleMutation.mutate({userId, role})
			}}
			onChangeUserStatus={(userId, status) => {
				updateUserMutation.mutate({userId, status})
			}}
			onRemoveUser={handleRemoveUser}
		/>
	)
}

export default function TenantSettingsPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const {user} = useAuth()

	// Tenant Users Management Card as additional content
	const tenantUsersContent = (
		<Card>
			<CardHeader>
				<CardTitle>Tenant Users</CardTitle>
				<CardDescription>Manage users in this tenant.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					{/* We'll need to pass roles from the layout component */}
					<TenantUsersQuery tenantId={tenantId} roles={[]} />
				</div>
			</CardContent>
		</Card>
	)

	// Custom render function for ownership sections with role-based access
	const renderOwnershipSections = (tenant: TenantResponse) => {
		if (!user?.roles?.includes('TenantOwner')) {
			return null
		}

		return (
			<>
				<Separator />
				{/* We'll need to import these components */}
				<TransferTenantOwnershipSection tenantId={tenantId} currentTenantName={tenant.name} />
				<Separator />
			</>
		)
	}

	return (
		<TenantManagementLayout
			titlePrefix='Tenant Settings'
			informationDescription='View and update your tenant details.'
			loadingMessage='Loading Tenant Settings...'
			backButton={{
				text: 'Back to Dashboard',
				href: '/dashboard',
			}}
			errorBackButton={{
				text: 'Go Back',
				onClick: () => window.history.back(),
			}}
			notFoundBackButton={{
				text: 'Back to Dashboard',
				href: '/dashboard',
			}}
			deleteRedirectPath='/dashboard'
			additionalContent={tenantUsersContent}
			renderOwnershipSections={renderOwnershipSections}
		/>
	)
}
