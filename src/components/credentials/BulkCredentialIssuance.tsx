'use client'

import React, {useState, useCallback, useRef} from 'react'
import {toast} from 'sonner'
import {Upload, Download, Users, Play, Pause, CheckCircle, AlertCircle, Plus, Trash2, Eye, FileText, Clock, RotateCcw} from 'lucide-react'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ScrollArea} from '@/components/ui/scroll-area'

import type {BulkCredentialRecipient, BulkIssueCredentialResponse} from '@/types/credentials'
import type {CredentialTemplate} from '@/types/template'
import {TemplateSelector} from '@/components/credentials/templates/TemplateSelector'
import {TenantDIDSelector} from '@/components/tenant/TenantDIDSelector'
import * as tenantCredentialService from '@/services/tenantCredentialService'
import type {TenantDIDDocument} from '@/services/tenantDIDService'

interface BulkCredentialIssuanceProps {
	tenantId: string
	selectedTemplates?: CredentialTemplate[]
	onComplete?: (result: BulkIssueCredentialResponse) => void
	onCancel?: () => void
	className?: string
}

interface BulkRecipient extends BulkCredentialRecipient {
	id: string
	status: 'pending' | 'processing' | 'success' | 'error'
	error?: string
	credentialId?: string
}

// Memoized RecipientCard component to prevent unnecessary re-renders
const RecipientCard = React.memo(({recipient, index, onUpdate, onRemove, isProcessing}: {recipient: BulkRecipient; index: number; onUpdate: (id: string, field: 'recipientDid' | 'recipientEmail', value: string) => void; onRemove: (id: string) => void; isProcessing: boolean}) => {
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'success':
				return <CheckCircle className='h-4 w-4 text-green-600' />
			case 'error':
				return <AlertCircle className='h-4 w-4 text-red-600' />
			case 'processing':
				return <Clock className='h-4 w-4 text-blue-600 animate-spin' />
			default:
				return <Clock className='h-4 w-4 text-gray-400' />
		}
	}

	const handleDIDChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onUpdate(recipient.id, 'recipientDid', e.target.value)
		},
		[recipient.id, onUpdate],
	)

	const handleEmailChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onUpdate(recipient.id, 'recipientEmail', e.target.value)
		},
		[recipient.id, onUpdate],
	)

	const handleRemove = useCallback(() => {
		onRemove(recipient.id)
	}, [recipient.id, onRemove])

	return (
		<Card className='p-4'>
			<div className='flex items-start justify-between mb-3'>
				<div className='flex items-center gap-2'>
					{getStatusIcon(recipient.status)}
					<span className='text-sm font-medium'>Recipient {index + 1}</span>
				</div>
				<Button onClick={handleRemove} variant='ghost' size='sm' disabled={isProcessing}>
					<Trash2 className='h-4 w-4' />
				</Button>
			</div>

			<div className='grid grid-cols-2 gap-3'>
				<div>
					<Label className='text-xs'>DID</Label>
					<Input placeholder='did:example:recipient123' value={recipient.recipientDid || ''} onChange={handleDIDChange} disabled={isProcessing} />
				</div>
				<div>
					<Label className='text-xs'>Email</Label>
					<Input placeholder='recipient@example.com' value={recipient.recipientEmail || ''} onChange={handleEmailChange} disabled={isProcessing} />
				</div>
			</div>

			{recipient.error && (
				<Alert className='mt-2'>
					<AlertCircle className='h-4 w-4' />
					<AlertDescription>{recipient.error}</AlertDescription>
				</Alert>
			)}
		</Card>
	)
})

RecipientCard.displayName = 'RecipientCard'

/**
 * BulkCredentialIssuance Component - Production-ready bulk credential issuance
 *
 * Features:
 * - Manual recipient entry and CSV import
 * - Template-based credential issuance
 * - Real-time progress tracking
 * - Error handling and retry mechanisms
 * - Batch processing with concurrent limits
 * - Result export and reporting
 * - Comprehensive validation
 */
export function BulkCredentialIssuance({tenantId, selectedTemplates = [], onComplete, onCancel, className = ''}: BulkCredentialIssuanceProps) {
	// State management
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(selectedTemplates[0] || null)
	const [issuerDID, setIssuerDID] = useState('')
	const [issuerDIDDocument, setIssuerDIDDocument] = useState<TenantDIDDocument | null>(null)
	const [recipients, setRecipients] = useState<BulkRecipient[]>([])
	const [template] = useState<Record<string, unknown>>({})
	const [issuanceDate, setIssuanceDate] = useState('')
	const [expirationDate, setExpirationDate] = useState('')
	const [metadata] = useState<Record<string, unknown>>({})

	// Processing state
	const [isProcessing, setIsProcessing] = useState(false)
	const [currentBatch, setCurrentBatch] = useState<BulkIssueCredentialResponse | null>(null)
	const [progress, setProgress] = useState(0)
	const [showResults, setShowResults] = useState(false)

	// CSV upload state
	const [csvFile, setCsvFile] = useState<File | null>(null)
	const [csvValidationErrors, setCsvValidationErrors] = useState<string[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Handle DID selection
	const handleDIDSelect = useCallback((didId: string, didDocument: TenantDIDDocument) => {
		setIssuerDID(didId)
		setIssuerDIDDocument(didDocument)
	}, [])

	// Add new recipient manually
	const addRecipient = useCallback(() => {
		const newRecipient: BulkRecipient = {
			id: `recipient_${Date.now()}`,
			recipientDid: '',
			recipientEmail: '',
			credentialSubject: {},
			customClaims: {},
			status: 'pending',
		}
		setRecipients((prev) => [...prev, newRecipient])
	}, [])

	// Remove recipient
	const removeRecipient = useCallback((id: string) => {
		setRecipients((prev) => prev.filter((r) => r.id !== id))
	}, [])

	// Update recipient
	const updateRecipient = useCallback((id: string, updates: Partial<BulkRecipient>) => {
		setRecipients((prev) => prev.map((r) => (r.id === id ? {...r, ...updates} : r)))
	}, [])

	// Memoize filterCapabilities to prevent unnecessary re-renders
	const filterCapabilities = React.useMemo(() => ['can_issue_credentials'], [])

	// Memoized handlers for input changes
	const handleRecipientFieldUpdate = useCallback(
		(id: string, field: 'recipientDid' | 'recipientEmail', value: string) => {
			updateRecipient(id, {[field]: value})
		},
		[updateRecipient],
	)

	// Handle CSV file selection
	const handleCSVFileSelect = useCallback(async (file: File | null) => {
		if (!file) {
			setCsvFile(null)
			setCsvValidationErrors([])
			return
		}

		// Validate CSV file
		const validation = await tenantCredentialService.validateCSVFile(file)
		if (!validation.valid) {
			setCsvValidationErrors(validation.errors)
			toast.error('CSV validation failed')
			return
		}

		setCsvFile(file)
		setCsvValidationErrors([])
		toast.success('CSV file validated successfully')
	}, [])

	// Download CSV template
	const downloadCSVTemplate = useCallback(() => {
		const template = tenantCredentialService.downloadCSVTemplate()
		const blob = new Blob([template], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'bulk-credential-template.csv'
		a.click()
		URL.revokeObjectURL(url)
		toast.success('CSV template downloaded')
	}, [])

	// Process bulk issuance
	const processBulkIssuance = useCallback(async () => {
		if (!selectedTemplate) {
			toast.error('Please select a template')
			return
		}

		if (!issuerDID.trim()) {
			toast.error('Please enter an issuer DID')
			return
		}

		if (recipients.length === 0 && !csvFile) {
			toast.error('Please add recipients or upload a CSV file')
			return
		}

		setIsProcessing(true)
		setProgress(0)

		try {
			let result: BulkIssueCredentialResponse

			if (csvFile) {
				// Process CSV upload
				result = await tenantCredentialService.bulkIssueFromCSV(tenantId, {
					templateId: selectedTemplate.id,
					issuerDid: issuerDID,
					file: csvFile,
				})
			} else {
				// Process manual recipients
				const validRecipients = recipients.filter((r) => r.recipientDid?.trim() || r.recipientEmail?.trim())

				if (validRecipients.length === 0) {
					toast.error('Please add valid recipients with DID or email')
					return
				}

				result = await tenantCredentialService.bulkIssueCredentials(tenantId, {
					templateId: selectedTemplate.id,
					issuerDid: issuerDID,
					recipients: validRecipients.map((r) => ({
						recipientDid: r.recipientDid,
						recipientEmail: r.recipientEmail,
						credentialSubject: r.credentialSubject,
						customClaims: r.customClaims,
					})),
					template,
					issuanceDate: issuanceDate || undefined,
					expirationDate: expirationDate || undefined,
					metadata,
				})
			}

			setCurrentBatch(result)
			setProgress(100)
			setShowResults(true)

			// Update recipient statuses based on results
			if (result.credentials) {
				result.credentials.forEach((cred) => {
					if (cred.recipientDid || cred.recipientEmail) {
						updateRecipient(recipients.find((r) => r.recipientDid === cred.recipientDid || r.recipientEmail === cred.recipientEmail)?.id || '', {
							status: cred.status === 'success' ? 'success' : 'error',
							credentialId: cred.credentialId,
							error: cred.error,
						})
					}
				})
			}

			if (result.failures) {
				result.failures.forEach((failure) => {
					const recipient = recipients.find((r) => r.recipientDid === failure.recipientDid || r.recipientEmail === failure.recipientEmail)
					if (recipient) {
						updateRecipient(recipient.id, {
							status: 'error',
							error: failure.error,
						})
					}
				})
			}

			toast.success(result.message || 'Bulk issuance completed')

			if (onComplete) {
				onComplete(result)
			}
		} catch (error) {
			console.error('Bulk issuance failed:', error)
			toast.error(error instanceof Error ? error.message : 'Bulk issuance failed')
		} finally {
			setIsProcessing(false)
		}
	}, [selectedTemplate, issuerDID, recipients, csvFile, tenantId, template, issuanceDate, expirationDate, metadata, onComplete, updateRecipient])

	// Check batch status
	const checkBatchStatus = useCallback(async () => {
		if (!currentBatch?.batchId) return

		try {
			const status = await tenantCredentialService.getBulkIssueStatus(tenantId, currentBatch.batchId)
			setCurrentBatch(status)
			toast.success('Status updated')
		} catch (error) {
			console.error('Failed to check batch status:', error)
			toast.error('Failed to check batch status')
		}
	}, [tenantId, currentBatch?.batchId])

	// Export results
	const exportResults = useCallback(() => {
		if (!currentBatch) return

		const data = {
			batchInfo: {
				batchId: currentBatch.batchId,
				totalRequested: currentBatch.totalRequested,
				successCount: currentBatch.successCount,
				failureCount: currentBatch.failureCount,
				status: currentBatch.status,
				processedAt: currentBatch.processedAt,
			},
			successes: currentBatch.credentials,
			failures: currentBatch.failures,
		}

		const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `bulk-issuance-results-${currentBatch.batchId}.json`
		a.click()
		URL.revokeObjectURL(url)
		toast.success('Results exported')
	}, [currentBatch])

	// Reset form
	const resetForm = useCallback(() => {
		setRecipients([])
		setCsvFile(null)
		setCsvValidationErrors([])
		setCurrentBatch(null)
		setProgress(0)
		setShowResults(false)
		setIsProcessing(false)
		setIssuerDID('')
		setIssuerDIDDocument(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}, [])

	const getStatusBadge = (status: string) => {
		const variants = {
			processing: 'secondary',
			completed: 'default',
			partial: 'destructive',
			failed: 'destructive',
		} as const

		return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
	}

	return (
		<div className={`space-y-6 ${className}`}>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
						Bulk Credential Issuance
					</CardTitle>
					<CardDescription>Issue multiple verifiable credentials efficiently using templates or CSV upload</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Template Selection */}
					<div className='space-y-2'>
						<Label htmlFor='template'>Credential Template</Label>
						<TemplateSelector selectedTemplate={selectedTemplate || undefined} onTemplateSelect={setSelectedTemplate} className='w-full' />
					</div>

					{/* Issuer DID Selection */}
					<div className='space-y-2'>
						<Label htmlFor='issuerDid'>Issuer DID</Label>
						<TenantDIDSelector tenantId={tenantId} selectedDID={issuerDID} onDIDSelect={handleDIDSelect} variant='select' showRefreshButton={true} showCreateButton={false} disabled={isProcessing} placeholder='Select tenant DID for issuing credentials...' filterActiveOnly={true} filterCapabilities={filterCapabilities} className='w-full' />
					</div>

					{/* Input Method Selection */}
					<Tabs defaultValue='manual' className='w-full'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='manual'>Manual Entry</TabsTrigger>
							<TabsTrigger value='csv'>CSV Upload</TabsTrigger>
						</TabsList>

						{/* Manual Entry Tab */}
						<TabsContent value='manual' className='space-y-4'>
							<div className='flex justify-between items-center'>
								<Label>Recipients ({recipients.length})</Label>
								<Button onClick={addRecipient} variant='outline' size='sm' disabled={isProcessing}>
									<Plus className='h-4 w-4 mr-1' />
									Add Recipient
								</Button>
							</div>

							<ScrollArea className='h-64 border rounded-md p-4'>
								{recipients.length === 0 ? (
									<div className='text-center text-gray-500 py-8'>No recipients added yet. Click "Add Recipient" to start.</div>
								) : (
									<div className='space-y-4'>
										{recipients.map((recipient, index) => (
											<RecipientCard key={recipient.id} recipient={recipient} index={index} onUpdate={handleRecipientFieldUpdate} onRemove={removeRecipient} isProcessing={isProcessing} />
										))}
									</div>
								)}
							</ScrollArea>
						</TabsContent>

						{/* CSV Upload Tab */}
						<TabsContent value='csv' className='space-y-4'>
							<div className='flex justify-between items-center'>
								<Label>CSV File Upload</Label>
								<Button onClick={downloadCSVTemplate} variant='outline' size='sm' disabled={isProcessing}>
									<Download className='h-4 w-4 mr-1' />
									Download Template
								</Button>
							</div>

							<div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
								<input ref={fileInputRef} type='file' accept='.csv' onChange={(e) => handleCSVFileSelect(e.target.files?.[0] || null)} className='hidden' disabled={isProcessing} />

								{csvFile ? (
									<div className='space-y-2'>
										<FileText className='h-12 w-12 mx-auto text-green-600' />
										<p className='text-sm font-medium'>{csvFile.name}</p>
										<p className='text-xs text-gray-500'>{(csvFile.size / 1024).toFixed(1)} KB</p>
										<Button onClick={() => fileInputRef.current?.click()} variant='outline' size='sm' disabled={isProcessing}>
											Change File
										</Button>
									</div>
								) : (
									<div className='space-y-2'>
										<Upload className='h-12 w-12 mx-auto text-gray-400' />
										<p className='text-sm font-medium'>Upload CSV File</p>
										<p className='text-xs text-gray-500'>Click to select a CSV file with recipient data</p>
										<Button onClick={() => fileInputRef.current?.click()} variant='outline' size='sm' disabled={isProcessing}>
											Select File
										</Button>
									</div>
								)}
							</div>

							{csvValidationErrors.length > 0 && (
								<Alert variant='destructive'>
									<AlertCircle className='h-4 w-4' />
									<AlertDescription>
										<div className='space-y-1'>
											<p className='font-medium'>CSV Validation Errors:</p>
											<ul className='list-disc list-inside space-y-1'>
												{csvValidationErrors.map((error, index) => (
													<li key={index} className='text-sm'>
														{error}
													</li>
												))}
											</ul>
										</div>
									</AlertDescription>
								</Alert>
							)}
						</TabsContent>
					</Tabs>

					{/* Advanced Options */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='issuanceDate'>Issuance Date (Optional)</Label>
							<Input id='issuanceDate' type='date' value={issuanceDate} onChange={(e) => setIssuanceDate(e.target.value)} disabled={isProcessing} />
						</div>
						<div className='space-y-2'>
							<Label htmlFor='expirationDate'>Expiration Date (Optional)</Label>
							<Input id='expirationDate' type='date' value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} disabled={isProcessing} />
						</div>
					</div>

					{/* Progress Bar */}
					{isProcessing && (
						<div className='space-y-2'>
							<div className='flex justify-between items-center'>
								<Label>Processing Progress</Label>
								<span className='text-sm text-gray-500'>{progress}%</span>
							</div>
							<Progress value={progress} className='w-full' />
						</div>
					)}

					{/* Action Buttons */}
					<div className='flex justify-between'>
						<div className='flex gap-2'>
							<Button onClick={resetForm} variant='outline' disabled={isProcessing}>
								<RotateCcw className='h-4 w-4 mr-1' />
								Reset
							</Button>
							{currentBatch && (
								<Button onClick={checkBatchStatus} variant='outline' disabled={isProcessing}>
									<Eye className='h-4 w-4 mr-1' />
									Check Status
								</Button>
							)}
						</div>
						<div className='flex gap-2'>
							{onCancel && (
								<Button onClick={onCancel} variant='outline' disabled={isProcessing}>
									Cancel
								</Button>
							)}
							<Button onClick={processBulkIssuance} disabled={isProcessing || (!recipients.length && !csvFile)}>
								{isProcessing ? (
									<>
										<Pause className='h-4 w-4 mr-1 animate-spin' />
										Processing...
									</>
								) : (
									<>
										<Play className='h-4 w-4 mr-1' />
										Start Bulk Issuance
									</>
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results Dialog */}
			<Dialog open={showResults} onOpenChange={setShowResults}>
				<DialogContent className='max-w-4xl max-h-[80vh]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Bulk Issuance Results
						</DialogTitle>
						<DialogDescription>
							{currentBatch && (
								<div className='flex items-center gap-4'>
									<span>Batch ID: {currentBatch.batchId}</span>
									{getStatusBadge(currentBatch.status)}
								</div>
							)}
						</DialogDescription>
					</DialogHeader>

					{currentBatch && (
						<div className='space-y-4'>
							{/* Summary Stats */}
							<div className='grid grid-cols-4 gap-4'>
								<Card className='p-4'>
									<div className='text-2xl font-bold'>{currentBatch.totalRequested}</div>
									<div className='text-sm text-gray-500'>Total Requested</div>
								</Card>
								<Card className='p-4'>
									<div className='text-2xl font-bold text-green-600'>{currentBatch.successCount}</div>
									<div className='text-sm text-gray-500'>Successful</div>
								</Card>
								<Card className='p-4'>
									<div className='text-2xl font-bold text-red-600'>{currentBatch.failureCount}</div>
									<div className='text-sm text-gray-500'>Failed</div>
								</Card>
								<Card className='p-4'>
									<div className='text-2xl font-bold'>{Math.round((currentBatch.successCount / currentBatch.totalRequested) * 100)}%</div>
									<div className='text-sm text-gray-500'>Success Rate</div>
								</Card>
							</div>

							{/* Results Tabs */}
							<Tabs defaultValue='successful' className='w-full'>
								<TabsList className='grid w-full grid-cols-2'>
									<TabsTrigger value='successful'>Successful ({currentBatch.successCount})</TabsTrigger>
									<TabsTrigger value='failed'>Failed ({currentBatch.failureCount})</TabsTrigger>
								</TabsList>

								<TabsContent value='successful' className='space-y-2'>
									<ScrollArea className='h-64'>
										{currentBatch.credentials.map((cred, index) => (
											<Card key={index} className='p-3 mb-2'>
												<div className='flex justify-between items-center'>
													<div className='space-y-1'>
														<div className='text-sm font-medium'>{cred.recipientDid || cred.recipientEmail}</div>
														<div className='text-xs text-gray-500'>ID: {cred.credentialId}</div>
													</div>
													<div className='flex items-center gap-2'>
														<CheckCircle className='h-4 w-4 text-green-600' />
														<Badge variant='default'>Success</Badge>
													</div>
												</div>
											</Card>
										))}
									</ScrollArea>
								</TabsContent>

								<TabsContent value='failed' className='space-y-2'>
									<ScrollArea className='h-64'>
										{currentBatch.failures.map((failure, index) => (
											<Card key={index} className='p-3 mb-2'>
												<div className='flex justify-between items-start'>
													<div className='space-y-1'>
														<div className='text-sm font-medium'>{failure.recipientDid || failure.recipientEmail}</div>
														<div className='text-xs text-red-600'>{failure.error}</div>
													</div>
													<div className='flex items-center gap-2'>
														<AlertCircle className='h-4 w-4 text-red-600' />
														<Badge variant='destructive'>Failed</Badge>
													</div>
												</div>
											</Card>
										))}
									</ScrollArea>
								</TabsContent>
							</Tabs>

							{/* Action Buttons */}
							<div className='flex justify-between'>
								<Button onClick={exportResults} variant='outline'>
									<Download className='h-4 w-4 mr-1' />
									Export Results
								</Button>
								<div className='flex gap-2'>
									<Button onClick={checkBatchStatus} variant='outline'>
										<RotateCcw className='h-4 w-4 mr-1' />
										Refresh Status
									</Button>
									<Button onClick={() => setShowResults(false)}>Close</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}
