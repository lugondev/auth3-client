'use client'

import React, {useCallback, useState, useEffect} from 'react'
import {useParams, useRouter, useSearchParams} from 'next/navigation'
import dynamicImport from 'next/dynamic'
import {IssuedCredential} from '@/types/credentials'
import {BulkIssueResponse} from '@/services/credentialService'
import {useToast} from '@/hooks/use-toast'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {FileText, Users, Shield, ArrowLeft} from 'lucide-react'

// Disable static generation to prevent prerendering issues
export const dynamic = 'force-dynamic'

// Dynamically import the tenant-specific wizard
const TenantCredentialWizard = dynamicImport(
	() =>
		import('@/components/credentials/tenant/TenantCredentialWizard').then((mod) => ({
			default: mod.TenantCredentialWizard,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading tenant credential wizard...</div>,
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

// Dynamically import the verification interface
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
	const tabParam = searchParams.get('tab')
	const [activeTab, setActiveTab] = useState(tabParam || 'single')

	// Update tab when URL parameter changes
	useEffect(() => {
		if (tabParam && ['single', 'bulk', 'verify'].includes(tabParam)) {
			setActiveTab(tabParam)
		}
	}, [tabParam])

	const handleComplete = useCallback(
		(credential: IssuedCredential) => {
			toast({
				title: "Success",
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
		(results: BulkIssueResponse) => {
			toast({
				title: "Bulk Issuance Complete",
				description: `${results.successCount} credentials issued successfully for tenant`,
			})
			// Redirect to tenant credentials list
			router.push(`/dashboard/tenant/${tenantId}/credentials`)
		},
		[router, tenantId, toast],
	)

	const handleVerificationComplete = useCallback(
		(result: {isValid: boolean; errors?: string[]}) => {
			toast({
				title: "Verification Complete",
				description: result.isValid ? "Credential is valid!" : "Credential verification failed",
				variant: result.isValid ? "default" : "destructive",
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
						<Button variant="outline" onClick={handleCancel}>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to Credentials
						</Button>
					</div>
					<h1 className='text-2xl font-bold'>Tenant Credential Actions</h1>
					<p className='text-muted-foreground'>Create, issue, and verify credentials for tenant: {tenantId}</p>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
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
								<CardDescription>
									Use the step-by-step wizard to issue a single credential for tenant {tenantId}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<TenantCredentialWizard 
									tenantId={tenantId}
									onComplete={handleComplete} 
									onCancel={handleCancel} 
									className='w-full'
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='bulk' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Bulk Credential Issuance</CardTitle>
								<CardDescription>
									Upload a CSV file to issue multiple credentials at once for tenant {tenantId}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<BulkIssuanceInterface 
									onComplete={handleBulkComplete} 
									className='w-full'
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='verify' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle>Credential Verification</CardTitle>
								<CardDescription>
									Verify the authenticity and validity of a verifiable credential
								</CardDescription>
							</CardHeader>
							<CardContent>
								<CredentialVerificationInterface 
									onComplete={handleVerificationComplete}
									className='w-full'
									tenantId={tenantId}
								/>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
