'use client'

import React, {useCallback, useState} from 'react'
import dynamicImport from 'next/dynamic'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {IssuedCredential, BulkIssueCredentialResponse} from '@/types/credentials'
import {CredentialTemplate} from '@/types/template'
import {toast} from 'sonner'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {FileText, Users, Building} from 'lucide-react'

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

// Dynamically import personal bulk issuance
const PersonalBulkIssuance = dynamicImport(
	() =>
		import('@/components/credentials/issue/PersonalBulkIssuance').then((mod) => ({
			default: mod.PersonalBulkIssuance,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading personal bulk issuance...</div>,
	},
)

// Dynamically import template selector for bulk operations
const TemplateSelector = dynamicImport(
	() =>
		import('@/components/credentials/templates/TemplateSelector').then((mod) => ({
			default: mod.TemplateSelector,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading template selector...</div>,
	},
)

// Dynamically import bulk template issuance
const BulkTemplateIssuance = dynamicImport(
	() =>
		import('@/components/credentials/templates/BulkTemplateIssuance').then((mod) => ({
			default: mod.BulkTemplateIssuance,
		})),
	{
		ssr: false,
		loading: () => <div className='p-8 text-center'>Loading bulk template issuance...</div>,
	},
)

export default function IssueCredentialPage() {
	const router = useRouter()
	const {user, currentTenantId, currentMode} = useAuth()
	const [activeTab, setActiveTab] = useState('single')

	// Bulk template operations state
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate>()
	const [selectedTemplatesForBulk, setSelectedTemplatesForBulk] = useState<CredentialTemplate[]>([])
	const [showBulkIssuanceModal, setShowBulkIssuanceModal] = useState(false)

	// Check context mode
	const isPersonalMode = currentMode === 'global' // personal/global mode
	const isTenantMode = currentMode === 'tenant'
	const tenantId = currentTenantId || user?.tenant_id
	const hasValidTenantContext = Boolean(tenantId && isTenantMode)

	// Personal users can always issue credentials, tenant users need tenant context
	const canIssueCredentials = isPersonalMode || hasValidTenantContext

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
		(result: BulkIssueCredentialResponse) => {
			const successCount = result.successCount || 0
			toast.success(`Bulk issuance completed: ${successCount} credentials issued successfully`)
			// Optionally redirect to credentials list or show detailed results
			router.push('/dashboard/credentials')
		},
		[router],
	)

	// Handlers for template bulk operations
	const handleTemplateSelect = useCallback((template: CredentialTemplate | null) => {
		setSelectedTemplate(template || undefined)
	}, [])

	const handleBulkSelectionChange = useCallback((templates: CredentialTemplate[]) => {
		setSelectedTemplatesForBulk(templates)
	}, [])

	const handleBulkIssuanceComplete = useCallback(() => {
		setShowBulkIssuanceModal(false)
		setSelectedTemplatesForBulk([])
		toast.success('Bulk template issuance completed successfully!')
	}, [])

	// If user doesn't have proper context, show appropriate message
	if (!canIssueCredentials) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='max-w-4xl mx-auto'>
					<div className='mb-6'>
						<h1 className='text-2xl font-bold'>Issue Credentials</h1>
						<p className='text-muted-foreground'>Create and issue verifiable credentials to recipients</p>
					</div>

					<Alert>
						<Building className='h-4 w-4' />
						<AlertTitle>Tenant Context Required</AlertTitle>
						<AlertDescription>{isTenantMode ? 'To issue credentials in tenant mode, you need to select a tenant context. Please use the tenant selector in the header to choose a tenant.' : 'Unable to determine your current context. Please refresh the page or contact support.'}</AlertDescription>
					</Alert>

					<div className='mt-6 flex gap-4'>
						<Button onClick={() => router.push('/dashboard/tenant-management')} variant='outline'>
							<Building className='mr-2 h-4 w-4' />
							Manage Tenants
						</Button>
						<Button onClick={() => router.push('/dashboard')} variant='outline'>
							Back to Dashboard
						</Button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-6xl mx-auto'>
				<div className='mb-6'>
					<h1 className='text-2xl font-bold'>Issue Credentials</h1>
					<p className='text-muted-foreground'>
						Create and issue verifiable credentials to recipients
						{isPersonalMode && ' (Personal Mode)'}
						{isTenantMode && tenantId && ` (Tenant: ${tenantId})`}
					</p>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className={`grid w-full ${isPersonalMode ? 'grid-cols-2' : 'grid-cols-3'}`}>
						<TabsTrigger value='single' className='flex items-center gap-2'>
							<FileText className='h-4 w-4' />
							Single Credential
						</TabsTrigger>
						<TabsTrigger value='bulk' className='flex items-center gap-2'>
							<Users className='h-4 w-4' />
							Bulk Issuance
						</TabsTrigger>
						{isTenantMode && (
							<TabsTrigger value='template-bulk' className='flex items-center gap-2'>
								<FileText className='h-4 w-4' />
								Template Bulk Issue
							</TabsTrigger>
						)}
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
								<CardDescription>
									Upload a CSV file to issue multiple credentials at once
									{isPersonalMode && ' in personal mode'}
									{isTenantMode && ' for your tenant'}
								</CardDescription>
							</CardHeader>
							<CardContent>{isPersonalMode ? <PersonalBulkIssuance onComplete={handleBulkComplete} className='w-full' /> : <BulkIssuanceInterface tenantId={tenantId!} onComplete={handleBulkComplete} className='w-full' />}</CardContent>
						</Card>
					</TabsContent>

					{isTenantMode && (
						<TabsContent value='template-bulk' className='mt-6'>
							<div className='space-y-6'>
								{/* Template Selection */}
								<Card>
									<CardHeader>
										<CardTitle>Template Selection for Bulk Operations</CardTitle>
										<CardDescription>Select templates with bulk selection capabilities for mass credential issuance</CardDescription>
									</CardHeader>
									<CardContent>
										<TemplateSelector selectedTemplate={selectedTemplate} onTemplateSelect={handleTemplateSelect} showAnalytics={true} enableBulkSelection={true} selectedTemplates={selectedTemplatesForBulk} onBulkSelectionChange={handleBulkSelectionChange} />
									</CardContent>
								</Card>

								{/* Selected Templates for Bulk Operations */}
								{selectedTemplatesForBulk.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle>Selected Templates ({selectedTemplatesForBulk.length})</CardTitle>
											<CardDescription>Templates selected for bulk credential issuance</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4'>
												{selectedTemplatesForBulk.map((template) => (
													<Card key={template.id} className='p-3'>
														<h5 className='font-medium text-sm truncate' title={template.name}>
															{template.name}
														</h5>
														<p className='text-xs text-muted-foreground truncate' title={template.description}>
															{template.description}
														</p>
														<div className='flex gap-1 mt-2'>
															{template.type.slice(0, 2).map((type) => (
																<span key={type} className='text-xs bg-muted px-1 py-0.5 rounded'>
																	{type}
																</span>
															))}
															{template.type.length > 2 && <span className='text-xs text-muted-foreground'>+{template.type.length - 2}</span>}
														</div>
													</Card>
												))}
											</div>

											<div className='flex gap-2 flex-wrap'>
												<Button onClick={() => setShowBulkIssuanceModal(true)}>
													<Users className='h-4 w-4 mr-2' />
													Bulk Credential Issuance
												</Button>
												<Button variant='outline' onClick={() => setSelectedTemplatesForBulk([])}>
													Clear Selection
												</Button>
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						</TabsContent>
					)}

					{/* Bulk Issuance Modal */}
					<Dialog open={showBulkIssuanceModal} onOpenChange={setShowBulkIssuanceModal}>
						<DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
							<DialogHeader>
								<DialogTitle>Bulk Template-based Credential Issuance</DialogTitle>
								<DialogDescription>Issue credentials to multiple recipients using selected templates</DialogDescription>
							</DialogHeader>
							<BulkTemplateIssuance selectedTemplates={selectedTemplatesForBulk} onComplete={handleBulkIssuanceComplete} onCancel={() => setShowBulkIssuanceModal(false)} />
						</DialogContent>
					</Dialog>
				</Tabs>
			</div>
		</div>
	)
}
