'use client'

import {VerifyEmailHandler} from '@/components/auth/VerifyEmailHandler'
import {useSearchParams} from 'next/navigation'
import {Suspense} from 'react' // Needed for useSearchParams

function VerifyEmailContent() {
	const searchParams = useSearchParams()
	const token = searchParams.get('token')

	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900'>
			{/* Pass the token to the handler component */}
			<VerifyEmailHandler token={token} />
		</div>
	)
}

// Wrap the component using Suspense for useSearchParams
export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<div>Loading verification...</div>}>
			<VerifyEmailContent />
		</Suspense>
	)
}
