'use client'

import {useAuth} from '@/contexts/AuthContext'
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'
import {Sidebar} from '@/components/layout/Sidebar'
import {MobileHeader} from '@/components/layout/MobileHeader'
import {Footer} from '@/components/layout/Footer' // Import Footer

export default function ProtectedLayout({children}: {children: React.ReactNode}) {
	const {user, loading} = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) {
			router.push('/')
		}
	}, [user, loading, router])

	if (loading) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='animate-pulse space-y-4'>
					<div className='h-4 bg-muted rounded w-[200px]'></div>
					<div className='h-4 bg-muted rounded w-[160px]'></div>
				</div>
			</div>
		)
	}

	if (!user) return null

	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
			<Sidebar />
			{/* Main content */}
			{/* Main content */}
			<div className='flex flex-1 flex-col overflow-hidden'>
				{' '}
				{/* Added overflow-hidden */}
				<MobileHeader />
				<main className='flex-1 overflow-y-auto p-4 md:p-6'>{children}</main> {/* Added padding and main tag */}
				<Footer /> {/* Add Footer */}
			</div>
		</div>
	)
}
