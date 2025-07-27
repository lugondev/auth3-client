'use client'

import React, {useCallback} from 'react'
import dynamicImport from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {IssuedCredential} from '@/types/credentials'
import {toast} from 'sonner'

// Disable static generation to prevent prerendering issues
export const dynamic = 'force-dynamic'

// Dynamically import the wizard to prevent SSR issues
const SimpleCredentialWizard = dynamicImport(
	() =>
		import('@/components/credentials/issue/SimpleCredentialWizard').then((mod) => ({
			default: mod.SimpleCredentialWizard,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading credential wizard...</div>,
	},
)

export default function IssueCredentialPage() {
	const router = useRouter()

	const handleComplete = useCallback(
		(credential: IssuedCredential) => {
			toast.success(`Credential ${credential.id} issued successfully!`)
			// Optionally redirect to view the credential or back to credentials list
			router.push(`/dashboard/credentials/${credential.id}`)
		},
		[router],
	)

	const handleCancel = useCallback(() => {
		router.push('/dashboard/credentials')
	}, [router])

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-6xl mx-auto'>
				<div className='mb-6'>
					<h1 className='text-2xl font-bold'>Issue Credentials</h1>
					<p className='text-muted-foreground'>Create and issue verifiable credentials to recipients</p>
				</div>

				<SimpleCredentialWizard onComplete={handleComplete} onCancel={handleCancel} className='w-full' />
			</div>
		</div>
	)
}
