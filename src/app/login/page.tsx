'use client'

import {Suspense} from 'react'
import {LoginContent} from './LoginContent'
import {Skeleton} from '@/components/ui/skeleton'

function LoginPageSkeleton() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className='w-full max-w-md space-y-4'>
				<Skeleton className='h-10 w-full' />
				<Skeleton className='h-10 w-full' />
				<Skeleton className='h-px w-full' />
				<Skeleton className='h-10 w-full' />
				<Skeleton className='h-10 w-full' />
				<Skeleton className='h-10 w-full' />
			</div>
		</div>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={<LoginPageSkeleton />}>
			<LoginContent />
		</Suspense>
	)
}
