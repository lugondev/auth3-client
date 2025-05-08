'use client'

import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'

export default function ProtectedPage() {
	const {user, loading} = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) {
			router.push('/')
		}
	}, [user, loading, router])

	if (loading) {
		return (
			<div className='p-6'>
				<Card>
					<CardContent className='pt-6'>
						<div className='animate-pulse space-y-4'>
							<div className='h-4 bg-muted rounded w-3/4'></div>
							<div className='h-4 bg-muted rounded w-1/2'></div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!user) return null

	// Determine display name
	const displayName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.email

	return (
		<div className='container mx-auto p-6'>
			<Card>
				<CardHeader>
					<CardTitle>Dashboard</CardTitle>
					<CardDescription>Welcome to the AuthSys Management System.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>
						Hello, <span className='font-medium text-foreground'>{displayName}</span>! Use the sidebar to navigate the system.
					</p>
					{/* You can add more dashboard components here later, e.g., stats, charts, quick links */}
				</CardContent>
			</Card>
		</div>
	)
}
