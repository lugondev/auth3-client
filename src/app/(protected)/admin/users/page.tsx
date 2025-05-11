'use client'

import React, {useEffect, useState} from 'react'
import {searchUsers} from '@/services/userService'
import {UserOutput, PaginatedUsers} from '@/lib/apiClient' // Assuming UserOutput is the correct type for individual users
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'

export default function AdminUsersPage() {
	const [users, setUsers] = useState<UserOutput[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10) // Default page size
	const [totalPages, setTotalPages] = useState(0)
	const [totalUsers, setTotalUsers] = useState(0)

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true)
			setError(null)
			try {
				const result: PaginatedUsers = await searchUsers({page_size: pageSize, page: currentPage})
				setUsers(result.users || [])
				setTotalPages(result.total_pages || 0)
				setTotalUsers(result.total || 0)
				if ((result.users || []).length === 0 && currentPage === 1) {
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
		}

		fetchUsers()
	}, [currentPage, pageSize])

	const handlePreviousPage = () => {
		setCurrentPage((prev) => Math.max(prev - 1, 1))
	}

	const handleNextPage = () => {
		setCurrentPage((prev) => Math.min(prev + 1, totalPages))
	}

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
			{users.length === 0 && !loading ? (
				<p className='text-muted-foreground'>No users found in the system.</p>
			) : (
				<div className='mt-4 rounded-md border'>
					{' '}
					{/* shadcn/ui table is often wrapped in a bordered div */}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>First Name</TableHead>
								<TableHead>Last Name</TableHead>
								<TableHead>Status</TableHead>
								{/* Add more columns as needed, e.g., Roles, Created At */}
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
