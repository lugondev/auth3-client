'use client'

import {useEffect, useState} from 'react'
import {useAuth} from '@/contexts/AuthContext'
// Import user functions from userService now
import {getCurrentUser, getUserProfile} from '@/services/userService'
import {UserOutput, UserProfile} from '@/lib/apiClient'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar' // Assuming shadcn Avatar component exists

// Helper function to get initials
const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
	if (firstName && lastName) {
		return `${firstName[0]}${lastName[0]}`.toUpperCase()
	}
	if (firstName) {
		return firstName.substring(0, 2).toUpperCase()
	}
	if (email) {
		return email.substring(0, 2).toUpperCase()
	}
	return 'U'
}

export default function ProfilePage() {
	const {user: authUser, loading: authLoading} = useAuth() // Get basic user info from context
	const [userData, setUserData] = useState<UserOutput | null>(null)
	const [profileData, setProfileData] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			if (!authLoading && authUser) {
				try {
					setLoading(true)
					setError(null)
					// Fetch detailed user data and profile data
					// Using Promise.all for parallel fetching
					// Fetch detailed user data and profile data using userService
					// getUserProfile now requires the user ID
					const [fetchedUser, fetchedProfile] = await Promise.all([
						getCurrentUser(), // Gets UserOutput (/users/me)
						getUserProfile(authUser.id), // Gets UserProfile (/users/profile/:id)
					])
					setUserData(fetchedUser)
					setProfileData(fetchedProfile)
				} catch (err: unknown) {
					console.error('Error fetching profile data:', err)
					let message = 'Failed to load profile information.'
					if (err instanceof Error) {
						message = err.message
					}
					setError(message)
					// Optionally show a toast notification here as well
					// toast.error(message);
				} finally {
					setLoading(false)
				}
			} else if (!authLoading && !authUser) {
				// Handle case where user is not authenticated (should be handled by layout/middleware ideally)
				setError('User not authenticated.')
				setLoading(false)
			}
		}

		fetchData()
	}, [authUser, authLoading])

	const isLoading = loading || authLoading

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-4'>User Profile</h1>
			{isLoading ? (
				<Card>
					<CardHeader className='flex flex-row items-center space-x-4'>
						<Skeleton className='h-12 w-12 rounded-full' />
						<div className='space-y-2'>
							<Skeleton className='h-4 w-[200px]' />
							<Skeleton className='h-4 w-[150px]' />
						</div>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-3/4' />
						<Skeleton className='h-4 w-1/2' />
					</CardContent>
				</Card>
			) : error ? (
				<Card>
					<CardHeader>
						<CardTitle>Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-destructive'>{error}</p>
					</CardContent>
				</Card>
			) : userData ? (
				<Card>
					<CardHeader className='flex flex-row items-center space-x-4 pb-2'>
						<Avatar className='h-12 w-12'>
							{/* Use userData.avatar if available */}
							<AvatarImage src={userData.avatar || undefined} alt='User Avatar' />
							<AvatarFallback>{getInitials(userData.first_name, userData.last_name, userData.email)}</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle>{`${userData.first_name || ''} ${userData.last_name || ''}`.trim()}</CardTitle>
							<CardDescription>{userData.email}</CardDescription>
						</div>
					</CardHeader>
					<CardContent className='space-y-2 pt-4'>
						<p>
							<strong>Role:</strong> {userData.role?.name || 'N/A'}
						</p>
						<p>
							<strong>Status:</strong> <span className={`capitalize ${userData.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{userData.status}</span>
						</p>
						<p>
							<strong>Phone:</strong> {userData.phone || 'Not provided'}
						</p>
						<p>
							<strong>Joined:</strong> {new Date(userData.created_at).toLocaleDateString()}
						</p>
						<hr className='my-4' />
						<h3 className='font-semibold text-lg'>Profile Details</h3>
						{profileData ? (
							<div className='space-y-1 text-sm text-muted-foreground'>
								<p>
									<strong>Bio:</strong> {profileData.bio || 'Not set'}
								</p>
								<p>
									<strong>Date of Birth:</strong> {profileData.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : 'Not set'}
								</p>
								<p>
									<strong>Address:</strong> {profileData.address || 'Not set'}
								</p>
								<p>
									<strong>Interests:</strong> {profileData.interests?.join(', ') || 'None'}
								</p>
								{/* Display preferences if needed */}
								{/* <p><strong>Theme:</strong> {profileData.preferences?.theme || 'Default'}</p> */}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No profile details found.</p>
						)}
						{/* TODO: Add Edit Profile Button/Form */}
					</CardContent>
				</Card>
			) : (
				<p>No user data found.</p> // Fallback if no error but no data
			)}
		</div>
	)
}
