'use client'

import React, {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {getUserById} from '@/services/userService' // Assuming a service function exists to fetch a single user
import {UserOutput} from '@/lib/apiClient'
import {toast} from 'sonner'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Button} from '@/components/ui/button'
import Link from 'next/link'

export default function UserDetailsPage() {
	const params = useParams()
	const userId = params.userId as string

	const [user, setUser] = useState<UserOutput | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!userId) {
			setError('User ID is missing.')
			setLoading(false)
			return
		}

		const fetchUserDetails = async () => {
			setLoading(true)
			setError(null)
			try {
				const userData = await getUserById(userId) // Assuming this function exists
				setUser(userData)
			} catch (err) {
				console.error(`Failed to fetch user details for ${userId}:`, err)
				const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
				setError(errorMessage)
				toast.error(`Failed to load user details: ${errorMessage}`)
			} finally {
				setLoading(false)
			}
		}

		fetchUserDetails()
	}, [userId])

	if (loading) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>User Details</h1>
				<p>Loading user details...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>User Details</h1>
				<p className='text-red-500'>Error loading user details: {error}</p>
			</div>
		)
	}

	if (!user) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>User Details</h1>
				<p className='text-muted-foreground'>User not found.</p>
			</div>
		)
	}

	return (
		<div>
			<h1 className='text-2xl font-semibold mb-4'>User Details</h1>
			<Card>
				<CardHeader>
					<CardTitle>
						{user.first_name} {user.last_name}
					</CardTitle>
					<CardDescription>Details for user ID: {user.id}</CardDescription>
				</CardHeader>
				<CardContent className='grid gap-4'>
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Email</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{user.email}</span>
					</div>
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Status</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{user.status || 'N/A'}</span>
					</div>
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Email Verified</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{user.is_email_verified ? 'Yes' : 'No'}</span>
					</div>
					{user.email_verified_at && (
						<div className='grid grid-cols-2 items-center gap-4'>
							<Label>Email Verified At</Label>
							<span className='col-span-1 text-sm text-muted-foreground'>{new Date(user.email_verified_at).toLocaleString()}</span>
						</div>
					)}
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Phone Verified</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{user.is_phone_verified ? 'Yes' : 'No'}</span>
					</div>
					{user.phone_verified_at && (
						<div className='grid grid-cols-2 items-center gap-4'>
							<Label>Phone Verified At</Label>
							<span className='col-span-1 text-sm text-muted-foreground'>{new Date(user.phone_verified_at).toLocaleString()}</span>
						</div>
					)}
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>2FA Enabled</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{user.is_two_factor_enabled ? 'Yes' : 'No'}</span>
					</div>
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Roles</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{user.roles?.join(', ') || 'N/A'}</span>
					</div>
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Created At</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{new Date(user.created_at).toLocaleString()}</span>
					</div>
					<div className='grid grid-cols-2 items-center gap-4'>
						<Label>Updated At</Label>
						<span className='col-span-1 text-sm text-muted-foreground'>{new Date(user.updated_at).toLocaleString()}</span>
					</div>
				</CardContent>
			</Card>
			<div className='mt-4'>
				<Link href={`/admin/users/${user.id}/edit`} passHref>
					<Button>Edit User</Button>
				</Link>
			</div>
		</div>
	)
}
