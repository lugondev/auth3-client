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

	return (
		<div className='container mx-auto p-6'>
			<Card>
				<CardHeader>
					<CardTitle>Protected Page</CardTitle>
					<CardDescription>This content is only visible to authenticated users</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground mb-4'>
						Welcome back, <span className='font-medium text-foreground'>{user.email}</span>! You can use the sidebar to navigate between different sections.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
