'use client'

import React, {useCallback, useState} from 'react'
import dynamicImport from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {IssuedCredential} from '@/types/credentials'
import {BulkIssueResponse} from '@/services/credentialService'
import {toast} from 'sonner'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {FileText, Users} from 'lucide-react'

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

// Dynamically import the bulk issuance interface
const BulkIssuanceInterface = dynamicImport(
	() =>
		import('@/components/credentials/issue/BulkIssuanceInterface').then((mod) => ({
			default: mod.BulkIssuanceInterface,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading bulk issuance interface...</div>,
	},
)

export default function IssueCredentialPage() {
	const router = useRouter()
	const [activeTab, setActiveTab] = useState('single')

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

	const handleBulkComplete = useCallback(
		(results: BulkIssueResponse) => {
			toast.success(`Bulk issuance completed: ${results.successCount} credentials issued successfully`)
			// Optionally redirect to credentials list or show detailed results
			router.push('/dashboard/credentials')
		},
		[router],
	)

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-6xl mx-auto'>
				<div className='mb-6'>
					<h1 className='text-2xl font-bold'>Issue Credentials</h1>
					<p className='text-muted-foreground'>Create and issue verifiable credentials to recipients</p>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='single' className='flex items-center gap-2'>
							<FileText className='h-4 w-4' />
							Single Credential
						</TabsTrigger>
						<TabsTrigger value='bulk' className='flex items-center gap-2'>
							<Users className='h-4 w-4' />
							Bulk Issuance
						</TabsTrigger>
					</TabsList>

					<TabsContent value='single' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Single Credential Issuance</CardTitle>
								<CardDescription>Use the step-by-step wizard to issue a single credential to a recipient</CardDescription>
							</CardHeader>
							<CardContent>
								<SimpleCredentialWizard onComplete={handleComplete} onCancel={handleCancel} className='w-full' />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='bulk' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Bulk Credential Issuance</CardTitle>
								<CardDescription>Upload a CSV file to issue multiple credentials at once</CardDescription>
							</CardHeader>
							<CardContent>
								<BulkIssuanceInterface onComplete={handleBulkComplete} className='w-full' />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
