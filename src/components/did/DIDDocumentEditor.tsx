'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {toast} from '@/hooks/use-toast'
import {FileEdit, Save, RotateCcw, AlertTriangle, CheckCircle, Eye, Settings, X} from 'lucide-react'

import type {DIDDocument, UpdateDIDDocumentRequest, DIDDocumentEditContext, DIDEditorTab, DIDEditorAction} from '@/types/did'

import didService from '@/services/didService'
import {DIDServiceEndpointsManager} from './DIDServiceEndpointsManager'
import {DIDVerificationMethodsManager} from './DIDVerificationMethodsManager'
import {DIDDocumentViewer} from './DIDDocumentViewer'
import {DIDDocumentValidator} from '@/utils/didDocumentValidator'

interface DIDDocumentEditorProps {
	did: string
	initialDocument?: DIDDocument
	readonly?: boolean
	onSave?: (document: DIDDocument) => void
	onCancel?: () => void
	className?: string
}

export const DIDDocumentEditor: React.FC<DIDDocumentEditorProps> = ({did, initialDocument, readonly = false, onSave, onCancel, className = ''}) => {
	// Create empty DID document with proper structure
	const createEmptyDocument = (): DIDDocument => ({
		'@context': ['https://www.w3.org/ns/did/v1'],
		id: did || '',
		verificationMethod: [],
		authentication: [],
		service: [],
	})

	// Core state
	const [editContext, setEditContext] = useState<DIDDocumentEditContext>({
		originalDocument: initialDocument || createEmptyDocument(),
		workingDocument: initialDocument || createEmptyDocument(),
		hasChanges: false,
		validationErrors: [],
		warnings: [],
	})

	const [loading, setLoading] = useState(!initialDocument)
	const [saving, setSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'verification' | 'preview'>('overview')

	const handleTabChange = (value: string) => {
		if (value === 'overview' || value === 'services' || value === 'verification' || value === 'preview') {
			setActiveTab(value)
		}
	}

	const loadDIDDocument = useCallback(async () => {
		if (!did) return

		try {
			setLoading(true)
			const response = await didService.getDID(did)
			const document = response.document

			setEditContext({
				originalDocument: document,
				workingDocument: {...document},
				hasChanges: false,
				validationErrors: [],
				warnings: [],
			})
		} catch (error) {
			console.error('Failed to load DID document:', error)
			toast({
				title: 'Error',
				description: 'Failed to load DID document',
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}, [did])

	// Load DID document if not provided
	useEffect(() => {
		if (!initialDocument && did) {
			loadDIDDocument()
		}
	}, [did, initialDocument, loadDIDDocument])

	// Validation
	const validateDocument = useCallback((document: DIDDocument) => {
		const result = DIDDocumentValidator.validate(document)

		setEditContext((prev) => ({
			...prev,
			validationErrors: result.errors,
			warnings: result.warnings,
		}))

		return result.valid
	}, [])

	// Save document
	const handleSave = useCallback(async () => {
		if (!editContext.hasChanges || readonly) return

		// Final validation
		if (!validateDocument(editContext.workingDocument)) {
			toast({
				title: 'Validation Error',
				description: 'Please fix validation errors before saving',
				variant: 'destructive',
			})
			return
		}

		try {
			setSaving(true)

			const updateRequest: UpdateDIDDocumentRequest = {
				context: editContext.workingDocument['@context'],
				verificationMethod: editContext.workingDocument.verificationMethod,
				authentication: editContext.workingDocument.authentication,
				assertionMethod: editContext.workingDocument.assertionMethod,
				keyAgreement: editContext.workingDocument.keyAgreement,
				capabilityInvocation: editContext.workingDocument.capabilityInvocation,
				capabilityDelegation: editContext.workingDocument.capabilityDelegation,
				service: editContext.workingDocument.service,
				alsoKnownAs: editContext.workingDocument.alsoKnownAs,
				controller: editContext.workingDocument.controller,
			}

			const response = await didService.updateDIDDocument(did, updateRequest)

			setEditContext((prev) => ({
				...prev,
				originalDocument: response.document,
				workingDocument: {...response.document},
				hasChanges: false,
				validationErrors: [],
				warnings: [],
			}))

			toast({
				title: 'Success',
				description: 'DID document updated successfully',
			})

			onSave?.(response.document)
		} catch (error) {
			console.error('Failed to save DID document:', error)
			toast({
				title: 'Error',
				description: 'Failed to save DID document',
				variant: 'destructive',
			})
		} finally {
			setSaving(false)
		}
	}, [did, editContext, readonly, onSave, validateDocument])

	// Reset changes
	const handleReset = useCallback(() => {
		setEditContext((prev) => ({
			...prev,
			workingDocument: {...prev.originalDocument},
			hasChanges: false,
			validationErrors: [],
			warnings: [],
		}))
	}, [])

	// Tab configuration
	const tabs: DIDEditorTab[] = [
		{
			id: 'overview',
			label: 'Overview',
			icon: 'FileEdit',
			component: () => <DIDDocumentOverview document={editContext.workingDocument} />,
		},
		{
			id: 'services',
			label: 'Service Endpoints',
			icon: 'Settings',
			component: () => <DIDServiceEndpointsManager did={did} readonly={readonly} onUpdate={() => loadDIDDocument()} />,
			badge: editContext.workingDocument.service?.length || 0,
		},
		{
			id: 'verification',
			label: 'Verification Methods',
			icon: 'CheckCircle',
			component: () => <DIDVerificationMethodsManager did={did} readonly={readonly} onUpdate={() => loadDIDDocument()} />,
			badge: editContext.workingDocument.verificationMethod?.length || 0,
		},
		{
			id: 'preview',
			label: 'Preview',
			icon: 'Eye',
			component: () => <DIDDocumentViewer document={editContext.workingDocument} showRawJson={false} />,
		},
	]

	// Actions
	const actions: DIDEditorAction[] = [
		{
			id: 'save',
			label: 'Save Changes',
			icon: 'Save',
			variant: 'default',
			onClick: handleSave,
			disabled: !editContext.hasChanges || readonly || editContext.validationErrors.length > 0,
			loading: saving,
		},
		{
			id: 'reset',
			label: 'Reset',
			icon: 'RotateCcw',
			variant: 'secondary',
			onClick: handleReset,
			disabled: !editContext.hasChanges || readonly,
		},
		...(onCancel
			? [
					{
						id: 'cancel' as const,
						label: 'Cancel',
						icon: 'X' as const,
						variant: 'outline' as const,
						onClick: onCancel,
						disabled: false,
					},
			  ]
			: []),
	]

	if (loading) {
		return (
			<Card className={className}>
				<CardContent className='p-6'>
					<div className='flex items-center justify-center h-64'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
						<span className='ml-2'>Loading DID document...</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	const hasErrors = editContext.validationErrors.length > 0
	const hasWarnings = editContext.warnings.length > 0

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<FileEdit className='h-5 w-5' />
								DID Document Editor
								{readonly && <Badge variant='secondary'>Read Only</Badge>}
							</CardTitle>
							<CardDescription>Manage your DID document structure, service endpoints, and verification methods</CardDescription>
							<div className='mt-2'>
								<code className='text-sm bg-muted px-2 py-1 rounded font-mono'>{did}</code>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							{actions.map((action) => (
								<Button key={action.id} variant={action.variant} size='sm' onClick={action.onClick} disabled={action.disabled} className='flex items-center gap-2'>
									{action.loading ? <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'></div> : action.icon === 'Save' ? <Save className='h-4 w-4' /> : action.icon === 'RotateCcw' ? <RotateCcw className='h-4 w-4' /> : action.icon === 'X' ? <X className='h-4 w-4' /> : null}
									{action.label}
								</Button>
							))}
						</div>
					</div>

					{/* Status indicators */}
					<div className='flex items-center gap-4 mt-4'>
						{editContext.hasChanges && (
							<Badge variant='outline' className='text-amber-600 border-amber-600'>
								Unsaved Changes
							</Badge>
						)}
						{hasErrors && (
							<Badge variant='destructive' className='flex items-center gap-1'>
								<AlertTriangle className='h-3 w-3' />
								{editContext.validationErrors.length} Errors
							</Badge>
						)}
						{hasWarnings && (
							<Badge variant='outline' className='text-yellow-600 border-yellow-600 flex items-center gap-1'>
								<AlertTriangle className='h-3 w-3' />
								{editContext.warnings.length} Warnings
							</Badge>
						)}
						{!hasErrors && !hasWarnings && (
							<Badge variant='outline' className='text-green-600 border-green-600 flex items-center gap-1'>
								<CheckCircle className='h-3 w-3' />
								Valid
							</Badge>
						)}
					</div>
				</CardHeader>
			</Card>

			{/* Validation alerts */}
			{hasErrors && (
				<Alert variant='destructive'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>
						<div className='space-y-1'>
							<div className='font-medium'>Validation Errors:</div>
							{editContext.validationErrors.map((error, index) => (
								<div key={index} className='text-sm'>
									• {error.field}: {error.message}
								</div>
							))}
						</div>
					</AlertDescription>
				</Alert>
			)}

			{hasWarnings && (
				<Alert>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>
						<div className='space-y-1'>
							<div className='font-medium'>Warnings:</div>
							{editContext.warnings.map((warning, index) => (
								<div key={index} className='text-sm'>
									• {warning.field}: {warning.message}
								</div>
							))}
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/* Editor Tabs */}
			<Card>
				<CardContent className='p-0'>
					<Tabs value={activeTab} onValueChange={handleTabChange}>
						<div className='border-b px-6 pt-6'>
							<TabsList className='grid w-full grid-cols-4'>
								{tabs.map((tab) => (
									<TabsTrigger key={tab.id} value={tab.id} className='flex items-center gap-2'>
										{tab.icon === 'FileEdit' && <FileEdit className='h-4 w-4' />}
										{tab.icon === 'Settings' && <Settings className='h-4 w-4' />}
										{tab.icon === 'CheckCircle' && <CheckCircle className='h-4 w-4' />}
										{tab.icon === 'Eye' && <Eye className='h-4 w-4' />}
										{tab.label}
										{tab.badge !== undefined && tab.badge > 0 && (
											<Badge variant='secondary' className='ml-1'>
												{tab.badge}
											</Badge>
										)}
									</TabsTrigger>
								))}
							</TabsList>
						</div>

						<div className='p-6'>
							{tabs.map((tab) => (
								<TabsContent key={tab.id} value={tab.id} className='mt-0'>
									<tab.component />
								</TabsContent>
							))}
						</div>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}

// Overview tab component
interface DIDDocumentOverviewProps {
	document: DIDDocument
	// onUpdate and readonly not currently implemented
}

const DIDDocumentOverview: React.FC<DIDDocumentOverviewProps> = ({document}) => {
	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<label className='text-sm font-medium'>DID Identifier</label>
							<code className='block text-sm bg-muted p-2 rounded mt-1 font-mono'>{document.id}</code>
						</div>

						<div>
							<label className='text-sm font-medium'>Context</label>
							<div className='mt-1'>
								{document['@context']?.map((context, index) => (
									<Badge key={index} variant='outline' className='mr-1 mb-1'>
										{context}
									</Badge>
								))}
							</div>
						</div>

						{document.controller && document.controller.length > 0 && (
							<div>
								<label className='text-sm font-medium'>Controllers</label>
								<div className='mt-1'>
									{document.controller.map((controller, index) => (
										<Badge key={index} variant='outline' className='mr-1 mb-1 font-mono text-xs'>
											{controller}
										</Badge>
									))}
								</div>
							</div>
						)}

						{document.alsoKnownAs && document.alsoKnownAs.length > 0 && (
							<div>
								<label className='text-sm font-medium'>Also Known As</label>
								<div className='mt-1'>
									{document.alsoKnownAs.map((aka, index) => (
										<Badge key={index} variant='outline' className='mr-1 mb-1'>
											{aka}
										</Badge>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Document Statistics</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='text-center p-3 bg-muted rounded'>
								<div className='text-2xl font-bold'>{document.verificationMethod?.length || 0}</div>
								<div className='text-sm text-muted-foreground'>Verification Methods</div>
							</div>
							<div className='text-center p-3 bg-muted rounded'>
								<div className='text-2xl font-bold'>{document.service?.length || 0}</div>
								<div className='text-sm text-muted-foreground'>Service Endpoints</div>
							</div>
						</div>

						<div className='space-y-2'>
							{['authentication', 'assertionMethod', 'keyAgreement', 'capabilityInvocation', 'capabilityDelegation'].map((purpose) => {
								const purposeKey = purpose as keyof Pick<DIDDocument, 'authentication' | 'assertionMethod' | 'keyAgreement' | 'capabilityInvocation' | 'capabilityDelegation'>
								const count = document[purposeKey]?.length || 0
								return (
									<div key={purpose} className='flex justify-between items-center'>
										<span className='text-sm capitalize'>{purpose.replace(/([A-Z])/g, ' $1')}</span>
										<Badge variant='secondary'>{count}</Badge>
									</div>
								)
							})}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default DIDDocumentEditor
