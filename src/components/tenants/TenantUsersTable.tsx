'use client'

import React, {useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
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

	// Helper function to get status badge variant
	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default'
			case 'pending':
			case 'invited':
				return 'secondary'
			case 'suspended':
				return 'destructive'
			default:
				return 'outline'
		}
	}

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
		return (
			<div className='flex flex-col items-center justify-center py-8 text-center'>
				<p className='text-muted-foreground text-lg'>No users in this tenant.</p>
				<p className='text-muted-foreground text-sm mt-1'>Users will appear here once they are added to the tenant.</p>
			</div>
		)
	}

	return (
		<div className='w-full'>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='font-semibold'>Name</TableHead>
						<TableHead className='font-semibold'>Email</TableHead>
						<TableHead className='font-semibold'>Role</TableHead>
						<TableHead className='font-semibold'>Status</TableHead>
						<TableHead className='text-right font-semibold'>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{localUsers.map((user) => (
						<TableRow key={user.user_id} className='hover:bg-muted/50 transition-colors'>
							<TableCell className='font-medium'>{`${user.first_name} ${user.last_name}`}</TableCell>
							<TableCell className='text-muted-foreground'>{user.email}</TableCell>
							<TableCell>
								<div className='flex items-center gap-2'>
									<Badge variant='outline' className='text-xs'>
										{user.roles[0] || 'No Role'}
									</Badge>
									<Select 
										value={user.roles[0] || ''} 
										onValueChange={(value) => onChangeUserRole && onChangeUserRole(user.user_id, value)}
										disabled={!onChangeUserRole}
									>
										<SelectTrigger className='w-[140px] h-8'>
											<SelectValue placeholder='Change role' />
										</SelectTrigger>
										<SelectContent>
											{roles.map((role) => (
												<SelectItem key={role} value={role}>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</TableCell>
							<TableCell>
								<div className='flex items-center gap-2'>
									<Badge variant={getStatusBadgeVariant(user.status_in_tenant)} className='text-xs capitalize'>
										{user.status_in_tenant}
									</Badge>
									<Select 
										value={user.status_in_tenant} 
										onValueChange={(value) => onChangeUserStatus && onChangeUserStatus(user.user_id, value as TenantUserStatus)}
										disabled={!onChangeUserStatus}
									>
										<SelectTrigger className='w-[110px] h-8'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='active'>Active</SelectItem>
											<SelectItem value='pending'>Pending</SelectItem>
											<SelectItem value='invited'>Invited</SelectItem>
											<SelectItem value='suspended'>Suspended</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</TableCell>
							<TableCell className='text-right'>
								{onRemoveUser && (
									<Button 
										variant='destructive' 
										size='sm' 
										onClick={() => handleRemoveClick(user)}
										className='h-8'
									>
										<Trash2 className='h-3 w-3 mr-1' />
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
		</div>
	)
}
