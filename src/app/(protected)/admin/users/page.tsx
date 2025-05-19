'use client'

import React, {useEffect, useState, useCallback} from 'react'
import {searchUsers} from '@/services/userService'
import {UserOutput, PaginatedUsers, UserStatus, UserSearchQuery} from '@/lib/apiClient' // Assuming UserOutput is the correct type for individual users
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {MoreHorizontal} from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
	const [users, setUsers] = useState<UserOutput[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10) // Default page size
	const [totalPages, setTotalPages] = useState(0)
	const [totalUsers, setTotalUsers] = useState(0)

	// Filter state
	const [searchQuery, setSearchQuery] = useState('')
	const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('')
	const [filterRoleName, setFilterRoleName] = useState('')

	const fetchUsers = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const query: UserSearchQuery = {
				limit: pageSize,
				offset: currentPage,
				query: searchQuery || undefined, // Only include if not empty
				status: filterStatus || undefined, // Only include if not empty
				role_name: filterRoleName || undefined, // Only include if not empty
			}
			const result: PaginatedUsers = await searchUsers(query)
			setUsers(result.users || [])
			setTotalPages(result.total_pages || 0)
			setTotalUsers(result.total || 0)
			if ((result.users || []).length === 0 && currentPage === 1 && !searchQuery && !filterStatus && !filterRoleName) {
				toast.info('No users found in the system.')
			}
		} catch (err) {
			console.error('Failed to fetch system users:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			setError(errorMessage)
			toast.error(`Failed to load users: ${errorMessage}`)
		} finally {
			setLoading(false)
		}
	}, [currentPage, pageSize, searchQuery, filterStatus, filterRoleName])

	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1))
	}

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages))
	}

	const handleFilterSearch = () => {
		setCurrentPage(1) // Reset to first page on new search
		fetchUsers() // Trigger fetch with current filter state
	}

	// Assuming UserStatus is an enum or union type available in apiClient
	const userStatuses: UserStatus[] = ['active', 'pending', 'suspended', 'deleted'] // Example statuses, replace with actual enum/union values

	if (loading && users.length === 0) {
		// Show initial loading only if no users are displayed yet
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>System Users</h1>
				<p>Loading users...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>System Users</h1>
				<p className='text-red-500'>Error loading users: {error}</p>
			</div>
		)
	}

	return (
		<div>
			<h1 className='text-2xl font-semibold mb-4'>System Users</h1>

			{/* Filter Section */}
			<div className='mb-4 p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4'>
				<div>
					<Input id='searchQuery' placeholder='Search by email, name...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
				</div>
				<div>
					<Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value !== 'all' ? (value as UserStatus) : '')}>
						<SelectTrigger id='filterStatus'>
							<SelectValue placeholder='Select status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Statuses</SelectItem>
							{userStatuses.map((status) => (
								<SelectItem key={status} value={status}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Input id='filterRoleName' placeholder='Enter role name' value={filterRoleName} onChange={(e) => setFilterRoleName(e.target.value)} />
				</div>
				<div className='md:col-span-3 flex justify-end'>
					<Button onClick={handleFilterSearch} disabled={loading}>
						Apply Filters
					</Button>
				</div>
			</div>

			{users.length === 0 && !loading ? (
				<p className='text-muted-foreground'>No users found matching the criteria.</p>
			) : (
				<div className='mt-4 rounded-md border'>
					{' '}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>First Name</TableHead>
								<TableHead>Last Name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>
									<span className='sr-only'>Actions</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.id}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.first_name || 'N/A'}</TableCell>
									<TableCell>{user.last_name || 'N/A'}</TableCell>
									<TableCell>{user.status || 'N/A'}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' className='h-8 w-8 p-0'>
													<span className='sr-only'>Open menu</span>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<Link href={`/admin/users/${user.id}`} passHref>
													<DropdownMenuItem asChild>
														<span>View Details</span>
													</DropdownMenuItem>
												</Link>
												<DropdownMenuSeparator />
												<Link href={`/admin/users/${user.id}/edit`} passHref>
													<DropdownMenuItem asChild>
														<span>Edit User</span>
													</DropdownMenuItem>
												</Link>
												<DropdownMenuItem onClick={() => toast.warning(`Attempting to delete user ${user.email}`)} className='text-red-600 focus:text-red-600 focus:bg-red-50'>
													Delete User
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className='mt-6 flex justify-between items-center'>
					<div className='flex gap-2'>
						<Button variant='outline' onClick={handlePreviousPage} disabled={currentPage === 1 || loading}>
							Previous
						</Button>
						<Button variant='outline' onClick={handleNextPage} disabled={currentPage === totalPages || loading}>
							Next
						</Button>
					</div>
					<span className='text-muted-foreground text-sm'>
						Page {currentPage} of {totalPages} (Total Users: {totalUsers})
					</span>
					<div className='flex items-center gap-2'>
						<Label htmlFor='pageSizeSelect' className='text-sm text-muted-foreground'>
							Items per page:
						</Label>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value))
								setCurrentPage(1)
							}}
							disabled={loading}>
							<SelectTrigger id='pageSizeSelect' className='w-[70px]'>
								<SelectValue placeholder={String(pageSize)} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='5'>5</SelectItem>
								<SelectItem value='10'>10</SelectItem>
								<SelectItem value='20'>20</SelectItem>
								<SelectItem value='50'>50</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</div>
	)
}
