'use client'

import React, {useCallback, useState} from 'react'
import {useParams, useRouter, useSearchParams} from 'next/navigation'
import dynamicImport from 'next/dynamic'
import {IssuedCredential} from '@/types/credentials'
import {BulkIssueCredentialResponse} from '@/types/credentials'
import {useToast} from '@/hooks/use-toast'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {FileText, Users, Shield, ArrowLeft} from 'lucide-react'

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

const BulkCredentialIssuance = dynamicImport(
	() =>
		import('@/components/credentials/BulkCredentialIssuance').then((mod) => ({
			default: mod.BulkCredentialIssuance,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading bulk credential issuance...</div>,
	},
)

const CredentialVerificationInterface = dynamicImport(
	() =>
		import('@/components/credentials/verify/CredentialVerificationInterface').then((mod) => ({
			default: mod.CredentialVerificationInterface,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading verification interface...</div>,
	},
)

export default function TenantCredentialActionsPage() {
	const params = useParams()
	const router = useRouter()
	const searchParams = useSearchParams()
	const {toast} = useToast()
	const tenantId = params.tenantId as string

	// Get the tab from URL param, using useRef to avoid re-renders
	const tabParamRef = React.useRef(searchParams.get('tab') || 'single')
	const validTabs = ['single', 'bulk', 'verify']
	const initialTab = validTabs.includes(tabParamRef.current) ? tabParamRef.current : 'single'

	// Use state with a stable initializer function to avoid dependency on URL params
	const [activeTab, setActiveTab] = useState(() => initialTab)

	// Handle tab change and update URL - but do not update state here to avoid loops
	const handleTabChange = useCallback(
		(newTab: string) => {
			// Only update state if the tab is actually changing
			if (newTab !== activeTab) {
				setActiveTab(newTab)

				// Update URL without causing a navigation
				const newUrl = new URL(window.location.href)
				newUrl.searchParams.set('tab', newTab)
				window.history.replaceState({}, '', newUrl.toString())
			}
		},
		[activeTab],
	)

	// Memoize callback functions to prevent unnecessary re-renders
	const handleComplete = useCallback(
		(credential: IssuedCredential) => {
			toast({
				title: 'Success',
				description: `Credential ${credential.id} issued successfully for tenant!`,
			})
			// Redirect to tenant credentials list
			router.push(`/dashboard/tenant/${tenantId}/credentials`)
		},
		[router, tenantId, toast],
	)

	const handleCancel = useCallback(() => {
		router.push(`/dashboard/tenant/${tenantId}/credentials`)
	}, [router, tenantId])

	const handleBulkComplete = useCallback(
		(result: BulkIssueCredentialResponse) => {
			toast({
				title: 'Bulk Issuance Complete',
				description: `${result.successCount} credentials issued successfully for tenant`,
			})
			// Redirect to tenant credentials list
			router.push(`/dashboard/tenant/${tenantId}/credentials`)
		},
		[router, tenantId, toast],
	)

	const handleVerificationComplete = useCallback(
		(result: {isValid: boolean; errors?: string[]}) => {
			toast({
				title: 'Verification Complete',
				description: result.isValid ? 'Credential is valid!' : 'Credential verification failed',
				variant: result.isValid ? 'default' : 'destructive',
			})
		},
		[toast],
	)

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-6xl mx-auto'>
				{/* Header with back button */}
				<div className='mb-6'>
					<div className='flex items-center gap-4 mb-4'>
						<Button variant='outline' onClick={handleCancel}>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to Credentials
						</Button>
					</div>
					<h1 className='text-2xl font-bold'>Tenant Credential Actions</h1>
					<p className='text-muted-foreground'>Create, issue, and verify credentials for tenant: {tenantId}</p>
				</div>

				<Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
					<TabsList className='grid w-full grid-cols-3'>
						<TabsTrigger value='single' className='flex items-center gap-2'>
							<FileText className='h-4 w-4' />
							Single Credential
						</TabsTrigger>
						<TabsTrigger value='bulk' className='flex items-center gap-2'>
							<Users className='h-4 w-4' />
							Bulk Issuance
						</TabsTrigger>
						<TabsTrigger value='verify' className='flex items-center gap-2'>
							<Shield className='h-4 w-4' />
							Verify Credential
						</TabsTrigger>
					</TabsList>

					<TabsContent value='single' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Single Credential Issuance</CardTitle>
								<CardDescription>Use the step-by-step wizard to issue a single credential for tenant {tenantId}</CardDescription>
							</CardHeader>
							<CardContent>
								<SimpleCredentialWizard onComplete={handleComplete} onCancel={handleCancel} className='w-full' tenantId={tenantId} />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='bulk' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Bulk Credential Issuance</CardTitle>
								<CardDescription>Upload a CSV file to issue multiple credentials at once for tenant {tenantId}</CardDescription>
							</CardHeader>
							<CardContent>
								<BulkCredentialIssuance tenantId={tenantId} onComplete={handleBulkComplete} onCancel={handleCancel} className='w-full' />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='verify' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Credential Verification</CardTitle>
								<CardDescription>Verify the authenticity and validity of a verifiable credential</CardDescription>
							</CardHeader>
							<CardContent>
								<CredentialVerificationInterface onComplete={handleVerificationComplete} className='w-full' tenantId={tenantId} />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
