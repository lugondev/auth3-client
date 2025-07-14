'use client'

import React from 'react'
import {Loader2} from 'lucide-react'

import {TenantUsersTable} from './TenantUsersTable'
import {useTenantUsers} from '@/hooks/use-tenant-users'

interface TenantUsersManagerProps {
	tenantId: string
	roles: string[]
	page?: number
	limit?: number
}

export const TenantUsersManager: React.FC<TenantUsersManagerProps> = ({
	tenantId,
	roles,
	page = 1,
	limit = 10,
}) => {
	const {
		users,
		isLoading,
		error,
		handleRemoveUser,
		handleChangeUserRole,
		handleChangeUserStatus,
	} = useTenantUsers({
		tenantId,
		page,
		limit,
	})

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
			users={users}
			roles={roles}
			onChangeUserRole={handleChangeUserRole}
			onChangeUserStatus={handleChangeUserStatus}
			onRemoveUser={handleRemoveUser}
		/>
	)
}
