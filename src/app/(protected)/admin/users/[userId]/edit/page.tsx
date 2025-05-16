'use client'

import React, {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {getUserById, updateUserStatus} from '@/services/userService' // Assuming service functions exist
import {UserOutput, UpdateUserRequest, UserStatus} from '@/lib/apiClient' // Assuming necessary types and adding UserStatus
import {toast} from 'sonner'
import {Card, CardHeader, CardTitle, CardContent, CardFooter} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import Link from 'next/link'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '@/components/ui/select'

export default function EditUserPage() {
	const params = useParams()
	const userId = params.userId as string

	const [user, setUser] = useState<UserOutput | null>(null)
	const [formData, setFormData] = useState<UpdateUserRequest>({})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
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
				const userData = await getUserById(userId)
				setUser(userData)
				// Initialize form data with existing user data
				setFormData({
					first_name: userData.first_name || '',
					last_name: userData.last_name || '',
					status: userData.status, // Set default status
					// Add other fields you want to be editable
				})
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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const {id, value} = e.target
		setFormData((prev: UpdateUserRequest) => ({...prev, [id]: value}))
	}

	const handleStatusChange = (value: string) => {
		setFormData((prev: UpdateUserRequest) => ({...prev, status: value as UserStatus}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!userId) {
			toast.error('User ID is missing, cannot save.')
			return
		}

		setSaving(true)
		setError(null)
		try {
			// Only update status using the new endpoint
			await updateUserStatus(userId, formData.status as string)
			toast.success('User status updated successfully!')
			// No redirect needed, stay on the edit page to allow other edits if necessary
		} catch (err) {
			console.error(`Failed to update user status ${userId}:`, err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			setError(errorMessage)
			toast.error(`Failed to update user status: ${errorMessage}`)
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Edit User</h1>
				<p>Loading user details for editing...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Edit User</h1>
				<p className='text-red-500'>Error loading user details: {error}</p>
			</div>
		)
	}

	if (!user) {
		return (
			<div>
				<h1 className='text-2xl font-semibold mb-4'>Edit User</h1>
				<p className='text-muted-foreground'>User not found.</p>
			</div>
		)
	}

	return (
		<div>
			<h1 className='text-2xl font-semibold mb-4'>Edit User</h1>
			<Card>
				<CardHeader>
					<CardTitle>
						Edit {user.first_name} {user.last_name} (ID: {user.id})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='grid gap-4'>
						<div className='grid grid-cols-2 items-center gap-4'>
							<Label htmlFor='first_name'>First Name</Label>
							<Input id='first_name' value={formData.first_name || ''} onChange={handleInputChange} />
						</div>
						<div className='grid grid-cols-2 items-center gap-4'>
							<Label htmlFor='last_name'>Last Name</Label>
							<Input id='last_name' value={formData.last_name || ''} onChange={handleInputChange} />
						</div>
						<div className='grid grid-cols-2 items-center gap-4'>
							<Label htmlFor='status'>Status</Label>
							<Select value={formData.status || ''} onValueChange={handleStatusChange}>
								<SelectTrigger id='status'>
									<SelectValue placeholder='Select status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='pending'>Pending</SelectItem>
									<SelectItem value='active'>Active</SelectItem>
									<SelectItem value='suspended'>Suspended</SelectItem>
									<SelectItem value='deleted'>Deleted</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{/* Add more editable fields here */}
						<CardFooter className='flex justify-between p-0 pt-4'>
							<Link href={`/admin/users/${user.id}`} passHref>
								<Button variant='outline'>Cancel</Button>
							</Link>
							<Button type='submit' disabled={saving}>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						</CardFooter>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
