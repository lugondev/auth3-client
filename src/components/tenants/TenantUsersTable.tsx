'use client'

import React, {useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
import {Loader2, Trash2} from 'lucide-react'
import {TenantUserResponse} from '@/types/tenant'

type TenantUserStatus = 'active' | 'suspended' | 'pending' | 'invited'

interface TenantUsersTableProps {
	users: TenantUserResponse[]
	roles: string[]
	onRemoveUser?: (userId: string) => void
	onChangeUserRole?: (userId: string, role: string) => void
	onChangeUserStatus?: (userId: string, status: TenantUserStatus) => void
}

export const TenantUsersTable: React.FC<TenantUsersTableProps> = ({users, roles, onRemoveUser, onChangeUserRole, onChangeUserStatus}) => {
	const [localUsers, setLocalUsers] = useState(users)
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [selectedUser, setSelectedUser] = useState<TenantUserResponse | null>(null)
	const [loading, setLoading] = useState(false)

	// Keep localUsers in sync if users prop changes
	React.useEffect(() => {
		setLocalUsers(users)
	}, [users])

	const handleRemoveClick = (user: TenantUserResponse) => {
		setSelectedUser(user)
		setConfirmOpen(true)
	}

	const handleConfirmDelete = async () => {
		if (selectedUser && onRemoveUser) {
			setLoading(true)
			onRemoveUser(selectedUser.user_id)
			setLocalUsers((prev) => prev.filter((u) => u.user_id !== selectedUser.user_id))
			setLoading(false)
			setConfirmOpen(false)
			setSelectedUser(null)
		}
	}

	if (!localUsers || localUsers.length === 0) {
		return <p className='text-muted-foreground'>No users in this tenant.</p>
	}

	return (
		<>
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
					{localUsers.map((user) => (
						<TableRow key={user.user_id}>
							<TableCell className='font-medium'>{`${user.first_name} ${user.last_name}`}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>
								<select className='border rounded px-2 py-1' value={user.roles[0] || ''} onChange={(e) => onChangeUserRole && onChangeUserRole(user.user_id, e.target.value)} disabled={!onChangeUserRole}>
									<option value='' disabled>
										Select role
									</option>
									{roles.map((role) => (
										<option key={role} value={role}>
											{role}
										</option>
									))}
								</select>
							</TableCell>
							<TableCell>
								<select className='border rounded px-2 py-1' value={user.status_in_tenant} onChange={(e) => onChangeUserStatus && onChangeUserStatus(user.user_id, e.target.value as TenantUserStatus)} disabled={!onChangeUserStatus}>
									<option value='active'>active</option>
									<option value='pending'>pending</option>
									<option value='invited'>invited</option>
									<option value='suspended'>suspended</option>
								</select>
							</TableCell>
							<TableCell className='text-right space-x-2'>
								{onRemoveUser && (
									<Button variant='destructive' size='sm' onClick={() => handleRemoveClick(user)}>
										Remove
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<AlertDialog
				open={confirmOpen}
				onOpenChange={(open) => {
					if (!open) {
						setConfirmOpen(false)
						setSelectedUser(null)
					}
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm User Removal</AlertDialogTitle>
						<AlertDialogDescription>{selectedUser ? `Are you sure you want to remove "${selectedUser.first_name} ${selectedUser.last_name}" from this tenant? This action cannot be undone.` : ''}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => {
								setConfirmOpen(false)
								setSelectedUser(null)
							}}
							disabled={loading}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction asChild>
							<Button variant='destructive' onClick={handleConfirmDelete} disabled={loading}>
								{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
								Remove User
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
