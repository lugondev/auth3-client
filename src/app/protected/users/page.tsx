'use client'

import React, {useEffect, useState} from 'react'
import apiClient, {UserOutput, PaginatedUsers} from '@/lib/apiClient'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
// Import table components if you plan to use shadcn/ui table
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UsersPage() {
	const [users, setUsers] = useState<UserOutput[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	// Add state for pagination if needed

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
					<Button>Add User</Button> {/* Add functionality later */}
				</CardHeader>
				<CardContent>
					{loading && <p>Loading users...</p>}
					{error && <p className='text-red-500'>Error: {error}</p>}
					{!loading && !error && (
						<div>
							{/* Placeholder for user list/table */}
							{users.length > 0 ? (
								<ul>
									{users.map((user) => (
										<li key={user.id}>
											{user.email} {user.name ? `(${user.name})` : ''}
										</li>
									))}
								</ul>
							) : (
								<p>No users found.</p>
							)}
							{/* TODO: Implement a proper table using shadcn/ui Table */}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
