'use client'

import React, {useEffect, useState} from 'react'
import apiClient, {UserOutput, PaginatedUsers} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Checkbox} from '@/components/ui/checkbox'
import {DotsHorizontalIcon} from '@radix-ui/react-icons'

export default function UsersPage() {
	const [users, setUsers] = useState<UserOutput[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({}) // Added state for selected rows

	// Placeholder action handlers
	const handleEditUser = (userId: string) => {
		console.log('Edit user:', userId)
		// TODO: Implement edit logic (e.g., open modal, navigate to edit page)
	}

	const handleDeleteUser = (userId: string) => {
		console.log('Delete user:', userId)
		// TODO: Implement delete logic (e.g., show confirmation, call API)
	}

	const handleChangeUserStatus = (userId: string, status: 'active' | 'inactive' | 'pending') => {
		console.log('Change status for user:', userId, 'to', status)
		// TODO: Implement status change logic (e.g., call API, update state)
	}

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true)
			setError(null)
			try {
				// Example: Using search endpoint - adjust query as needed
				const response = await apiClient.get<PaginatedUsers>('/users/search', {
					params: {page: 1, page_size: 20}, // Example pagination
				})
				setUsers(response.data.users)
			} catch (err: unknown) {
				let message = 'Failed to fetch users'
				if (err instanceof Error) {
					message = err.message
				} else if (typeof err === 'string') {
					message = err
				}
				setError(message)
				console.error(err)
			} finally {
				setLoading(false)
			}
		}

		fetchUsers()
	}, [])

	return (
		<div className='p-6'>
			<Card>
				<CardHeader className='flex flex-row items-center justify-between'>
					<CardTitle>User Management</CardTitle>
					<Button>XxX</Button>
				</CardHeader>
				<CardContent>
					{loading && <p>Loading users...</p>}
					{error && <p className='text-red-500'>Error: {error}</p>}
					{!loading && !error && (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[40px]'>
										<Checkbox
											checked={users.length > 0 && Object.keys(selectedRows).length === users.length}
											onCheckedChange={(checked) => {
												const newSelectedRows: Record<string, boolean> = {} // Explicitly type here
												if (checked) {
													users.forEach((user) => {
														newSelectedRows[user.id] = true
													})
												}
												setSelectedRows(newSelectedRows)
											}}
											aria-label='Select all rows'
										/>
									</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>Roles</TableHead> {/* Added Roles Header */}
									<TableHead>Status</TableHead>
									<TableHead className='text-right'>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.length > 0 ? (
									users.map((user) => (
										<TableRow key={user.id} data-state={selectedRows[user.id] && 'selected'}>
											<TableCell>
												<Checkbox
													checked={selectedRows[user.id] || false}
													onCheckedChange={(checked) => {
														setSelectedRows((prev) => ({
															...prev,
															[user.id]: !!checked,
														}))
													}}
													aria-label={`Select row for ${user.email}`}
												/>
											</TableCell>
											<TableCell className='font-medium'>{user.email}</TableCell>
											<TableCell>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}</TableCell>
											<TableCell>{user.phone ?? 'N/A'}</TableCell>
											<TableCell>{user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'N/A'}</TableCell> {/* Added Roles Cell */}
											<TableCell>{user.status}</TableCell>
											<TableCell className='text-right'>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant='ghost' className='h-8 w-8 p-0'>
															<span className='sr-only'>Open menu</span>
															<DotsHorizontalIcon className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align='end'>
														<DropdownMenuLabel>Actions</DropdownMenuLabel>
														<DropdownMenuItem onClick={() => handleEditUser(user.id)}>Edit</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleDeleteUser(user.id)}
															className='text-red-600' // Optional: Style delete differently
														>
															Delete
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuLabel>Change Status</DropdownMenuLabel>
														<DropdownMenuItem onClick={() => handleChangeUserStatus(user.id, 'active')} disabled={user.status === 'active'}>
															Set Active
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleChangeUserStatus(user.id, 'inactive')} disabled={user.status === 'inactive'}>
															Set Inactive
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleChangeUserStatus(user.id, 'pending')} disabled={user.status === 'pending'}>
															Set Pending
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={7} className='h-24 text-center'>
											{' '}
											{/* Updated colSpan */}
											No users found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
