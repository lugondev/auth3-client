'use client'

import React, { Suspense } from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowLeft} from 'lucide-react'

function SelectTenantContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const returnUrl = searchParams.get('returnUrl') || '/dashboard'

	const handleTenantSelected = () => {
		// After tenant is selected, redirect to return URL
		router.push(returnUrl)
	}

	const handleGoBack = () => {
		router.push('/dashboard')
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div className='text-center'>
					<h2 className='mt-6 text-3xl font-extrabold text-gray-900'>Select Tenant</h2>
					<p className='mt-2 text-sm text-gray-600'>You need to select a tenant to access this resource</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Choose Your Organization</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<TenantSelector variant='full' showGlobalOption={false} showCreateButton={true} showManageButton={false} onTenantChange={handleTenantSelected} />

						<div className='flex justify-between'>
							<Button variant='outline' onClick={handleGoBack} className='flex items-center gap-2'>
								<ArrowLeft className='h-4 w-4' />
								Back to Dashboard
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default function SelectTenantPage() {
	return (
		<Suspense fallback={
			<div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
				<div className='text-center'>
					<p className='text-gray-600'>Loading...</p>
				</div>
			</div>
		}>
			<SelectTenantContent />
		</Suspense>
	)
}
