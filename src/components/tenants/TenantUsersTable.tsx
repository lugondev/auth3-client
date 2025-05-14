'use client'

import React from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {UserCheck, UserX} from 'lucide-react'
import {TenantUserResponse} from '@/types/tenant'

interface TenantUsersTableProps {
	users: TenantUserResponse[]
	onRemoveUser?: (userId: string) => void
	onUpdateUser?: (userId: string, isActive: boolean) => void
}

export const TenantUsersTable: React.FC<TenantUsersTableProps> = ({users, onRemoveUser, onUpdateUser}) => {
	if (!users || users.length === 0) {
		return <p className='text-muted-foreground'>No users in this tenant.</p>
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className='text-right'>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map((user) => (
					<TableRow key={user.user_id}>
						<TableCell className='font-medium'>{`${user.first_name} ${user.last_name}`}</TableCell>
						<TableCell>{user.email}</TableCell>
						<TableCell>{user.roles.join(', ')}</TableCell>
						<TableCell>
							<Badge variant={user.status_in_tenant !== 'suspended' ? 'default' : 'destructive'}>{user.status_in_tenant}</Badge>
						</TableCell>
						<TableCell className='text-right space-x-2'>
							{onUpdateUser && (
								<Button variant='outline' size='sm' onClick={() => onUpdateUser(user.user_id, user.status_in_tenant !== 'active')}>
									{user.status_in_tenant === 'active' ? <UserX className='h-4 w-4 mr-2' /> : <UserCheck className='h-4 w-4 mr-2' />}
									{user.status_in_tenant !== 'suspended' ? 'Deactivate' : 'Activate'}
								</Button>
							)}
							{onRemoveUser && (
								<Button variant='destructive' size='sm' onClick={() => onRemoveUser(user.user_id)}>
									Remove
								</Button>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
