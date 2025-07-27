'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Upload, Download, FileText, Users, Play, Pause, CheckCircle, AlertCircle, X, Plus, Trash2, Eye} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate} from '@/types/template'
import {IssuedCredential} from '@/types/credentials'
import {credentialService, BulkIssueResponse} from '@/services/credentialService'

interface BulkRecipient {
	id: string
	did?: string
	email?: string
	credentialData: Record<string, string | number | boolean>
	status: 'pending' | 'processing' | 'success' | 'error'
	error?: string
	credentialId?: string
}

interface BulkTemplateIssuanceProps {
	selectedTemplates?: CredentialTemplate[]
	onComplete?: (results: BulkIssueResponse) => void
	onCancel?: () => void
	className?: string
}

/**
 * Bulk Template-based Credential Issuance Component
 *
 * Features:
 * - Template-based bulk credential issuance
 * - CSV/Excel import for recipient data
 * - Real-time progress tracking
 * - Error handling and retry mechanisms
 * - Batch processing with concurrent limits
 * - Result export and reporting
 */
export function BulkTemplateIssuance({selectedTemplates = [], onComplete, onCancel, className = ''}: BulkTemplateIssuanceProps) {
	const [currentStep, setCurrentStep] = useState<'template' | 'recipients' | 'processing' | 'results'>('template')
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | undefined>(selectedTemplates.length === 1 ? selectedTemplates[0] : undefined)
	const [recipients, setRecipients] = useState<BulkRecipient[]>([])
	const [processing, setProcessing] = useState(false)
	const [progress, setProgress] = useState(0)
	const [results, setResults] = useState<{
		total: number
		successful: number
		failed: number
		credentials: IssuedCredential[]
		errors: string[]
	}>({
		total: 0,
		successful: 0,
		failed: 0,
		credentials: [],
		errors: [],
	})

	// Reset recipients when template changes
	useEffect(() => {
		if (selectedTemplate) {
			setRecipients([])
		}
	}, [selectedTemplate])

	// Generate CSV template for the selected template
	const generateCSVTemplate = () => {
		if (!selectedTemplate) return

		const schema = selectedTemplate.schema
		const properties = (schema.properties as Record<string, {title?: string}>) || {}

		// Base columns
		const headers = ['did', 'email']

		// Add schema fields
		Object.keys(properties).forEach((field) => {
			if (field !== 'id') {
				// Skip id field as it's auto-generated
				headers.push(field)
			}
		})

		// Create CSV content
		const csvContent = [
			headers.join(','),
			// Add a sample row with example data
			headers
				.map((header) => {
					switch (header) {
						case 'did':
							return 'did:key:example123'
						case 'email':
							return 'example@email.com'
						case 'name':
							return 'John Doe'
						case 'degree':
							return 'Bachelor of Science'
						case 'university':
							return 'Example University'
						case 'graduationDate':
							return '2023-12-15'
						default:
							return `example_${header}`
					}
				})
				.join(','),
		].join('\n')

		// Download the CSV
		const blob = new Blob([csvContent], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${selectedTemplate.name.replace(/\s+/g, '_')}_template.csv`
		a.click()
		URL.revokeObjectURL(url)

		toast.success('CSV template downloaded')
	}

	// Handle CSV file upload
	const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const text = e.target?.result as string
				const lines = text.split('\n').filter((line) => line.trim())

				if (lines.length < 2) {
					toast.error('CSV file must have at least a header row and one data row')
					return
				}

				const headers = lines[0].split(',').map((h) => h.trim())
				const dataLines = lines.slice(1)

				const newRecipients: BulkRecipient[] = dataLines.map((line, index) => {
					const values = line.split(',').map((v) => v.trim())
					const recipientData: Record<string, string> = {}

					headers.forEach((header, i) => {
						if (values[i]) {
							recipientData[header] = values[i]
						}
					})

					return {
						id: `recipient-${Date.now()}-${index}`,
						did: recipientData.did,
						email: recipientData.email,
						credentialData: Object.fromEntries(Object.entries(recipientData).filter(([key]) => key !== 'did' && key !== 'email')),
						status: 'pending',
					}
				})

				setRecipients(newRecipients)
				toast.success(`Loaded ${newRecipients.length} recipients from CSV`)
			} catch (error) {
				console.error('Error parsing CSV:', error)
				toast.error('Failed to parse CSV file')
			}
		}
		reader.readAsText(file)
	}

	// Add a single recipient manually
	const addRecipient = () => {
		if (!selectedTemplate) return

		const newRecipient: BulkRecipient = {
			id: `recipient-${Date.now()}`,
			status: 'pending',
			credentialData: {},
		}

		setRecipients([...recipients, newRecipient])
	}

	// Remove a recipient
	const removeRecipient = (id: string) => {
		setRecipients(recipients.filter((r) => r.id !== id))
	}

	// Update recipient data
	const updateRecipient = (id: string, updates: Partial<BulkRecipient>) => {
		setRecipients(recipients.map((r) => (r.id === id ? {...r, ...updates} : r)))
	}

	// Validate recipients before processing
	const validateRecipients = (): string[] => {
		const errors: string[] = []

		if (recipients.length === 0) {
			errors.push('At least one recipient is required')
		}

		recipients.forEach((recipient, index) => {
			if (!recipient.did && !recipient.email) {
				errors.push(`Recipient ${index + 1}: Either DID or email is required`)
			}

			// Validate required fields from template schema
			if (selectedTemplate?.schema.required) {
				const requiredFields = selectedTemplate.schema.required as string[]
				requiredFields.forEach((field) => {
					if (!recipient.credentialData[field]) {
						errors.push(`Recipient ${index + 1}: ${field} is required`)
					}
				})
			}
		})

		return errors
	}

	// Process bulk issuance
	const processBulkIssuance = async () => {
		if (!selectedTemplate) return

		const validationErrors = validateRecipients()
		if (validationErrors.length > 0) {
			toast.error(`Validation errors: ${validationErrors.join(', ')}`)
			return
		}

		setProcessing(true)
		setCurrentStep('processing')
		setProgress(0)

		const total = recipients.length
		let successful = 0
		let failed = 0
		const issuedCredentials: IssuedCredential[] = []
		const errors: string[] = []

		try {
			// Process recipients in batches to avoid overwhelming the server
			const batchSize = 5
			for (let i = 0; i < recipients.length; i += batchSize) {
				const batch = recipients.slice(i, i + batchSize)

				// Process batch concurrently
				const batchPromises = batch.map(async (recipient) => {
					try {
						setRecipients((prev) => prev.map((r) => (r.id === recipient.id ? {...r, status: 'processing'} : r)))

						const response = await credentialService.issueCredential({
							templateId: selectedTemplate.id,
							credentialSubject: recipient.credentialData,
							issuerDID: selectedTemplate.issuerDID || '', // Use template's issuer DID
							recipientDID: recipient.did,
							recipientEmail: recipient.email,
						})

						setRecipients((prev) =>
							prev.map((r) =>
								r.id === recipient.id
									? {
											...r,
											status: 'success',
											credentialId: response.id,
									  }
									: r,
							),
						)

						issuedCredentials.push({
							id: response.id,
							status: response.status,
							issuedAt: new Date().toISOString(),
							templateName: selectedTemplate.name,
							templateVersion: selectedTemplate.version,
							credentialTypes: selectedTemplate.type,
							credentialSubject: recipient.credentialData,
							recipient: recipient.did || recipient.email || '',
							verifiableCredential: response.credential,
						} as IssuedCredential)
						successful++
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Unknown error'

						setRecipients((prev) =>
							prev.map((r) =>
								r.id === recipient.id
									? {
											...r,
											status: 'error',
											error: errorMessage,
									  }
									: r,
							),
						)

						errors.push(`Recipient ${recipient.did || recipient.email}: ${errorMessage}`)
						failed++
					}
				})

				await Promise.all(batchPromises)

				// Update progress
				const processed = Math.min(i + batchSize, total)
				setProgress((processed / total) * 100)

				// Small delay between batches
				if (i + batchSize < recipients.length) {
					await new Promise((resolve) => setTimeout(resolve, 1000))
				}
			}

			const finalResults: BulkIssueResponse = {
				batchId: `batch-${Date.now()}`,
				totalRequests: total,
				successCount: successful,
				failureCount: failed,
				results: recipients.map((recipient, index) => ({
					index,
					success: recipient.status === 'success',
					credentialId: recipient.credentialId,
					error: recipient.error,
				})),
			}

			setResults({
				total,
				successful,
				failed,
				credentials: issuedCredentials,
				errors,
			})
			setCurrentStep('results')

			if (successful > 0) {
				toast.success(`Successfully issued ${successful} out of ${total} credentials`)
			}
			if (failed > 0) {
				toast.error(`Failed to issue ${failed} credentials`)
			}

			onComplete?.(finalResults)
		} catch (error) {
			console.error('Bulk issuance error:', error)
			toast.error('Bulk issuance process failed')
		} finally {
			setProcessing(false)
		}
	}

	// Export results as CSV
	const exportResults = () => {
		const headers = ['Recipient', 'Status', 'Credential ID', 'Error']
		const rows = recipients.map((recipient) => [recipient.did || recipient.email || 'Unknown', recipient.status, recipient.credentialId || '', recipient.error || ''])

		const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

		const blob = new Blob([csvContent], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `bulk_issuance_results_${new Date().toISOString().split('T')[0]}.csv`
		a.click()
		URL.revokeObjectURL(url)

		toast.success('Results exported to CSV')
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case 'template':
				return (
					<div className='space-y-6'>
						<div>
							<h3 className='text-lg font-semibold mb-2'>Template Selected</h3>
							<p className='text-sm text-muted-foreground'>Ready to proceed with bulk credential issuance</p>
						</div>

						{selectedTemplate && (
							<Alert>
								<FileText className='h-4 w-4' />
								<AlertDescription>
									<div className='space-y-2'>
										<div>
											<strong>Selected Template:</strong> {selectedTemplate.name}
										</div>
										<div className='text-sm text-muted-foreground'>{selectedTemplate.description}</div>
										<div className='text-xs text-muted-foreground'>
											Version: {selectedTemplate.version} | Type: {selectedTemplate.type.join(', ')}
											{selectedTemplate.tags && selectedTemplate.tags.length > 0 && <span> | Tags: {selectedTemplate.tags.join(', ')}</span>}
										</div>
									</div>
								</AlertDescription>
							</Alert>
						)}

						{selectedTemplate && (
							<div className='flex gap-2'>
								<Button onClick={() => setCurrentStep('recipients')}>Next: Add Recipients</Button>
							</div>
						)}
					</div>
				)

			case 'recipients':
				return (
					<div className='space-y-6'>
						<div className='flex items-center justify-between'>
							<div>
								<h3 className='text-lg font-semibold'>Recipients</h3>
								<p className='text-sm text-muted-foreground'>Add recipients for bulk credential issuance</p>
							</div>
							<Badge variant='outline'>{recipients.length} recipients</Badge>
						</div>

						{/* Upload Options */}
						<Card>
							<CardHeader>
								<CardTitle className='text-base'>Import Recipients</CardTitle>
								<CardDescription>Upload a CSV file or add recipients manually</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex gap-2 flex-wrap'>
									<Button variant='outline' onClick={generateCSVTemplate} disabled={!selectedTemplate}>
										<Download className='h-4 w-4 mr-2' />
										Download CSV Template
									</Button>

									<div className='relative'>
										<Button variant='outline' asChild>
											<label>
												<Upload className='h-4 w-4 mr-2' />
												Upload CSV
												<input type='file' accept='.csv' onChange={handleCSVUpload} className='absolute inset-0 opacity-0 cursor-pointer' />
											</label>
										</Button>
									</div>

									<Button variant='outline' onClick={addRecipient}>
										<Plus className='h-4 w-4 mr-2' />
										Add Manually
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Recipients List */}
						{recipients.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Recipients List</CardTitle>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>DID/Email</TableHead>
												<TableHead>Credential Data</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{recipients.map((recipient) => (
												<TableRow key={recipient.id}>
													<TableCell>
														<div className='space-y-1'>
															<Input placeholder='DID' value={recipient.did || ''} onChange={(e) => updateRecipient(recipient.id, {did: e.target.value})} className='text-xs' />
															<Input placeholder='Email' value={recipient.email || ''} onChange={(e) => updateRecipient(recipient.id, {email: e.target.value})} className='text-xs' />
														</div>
													</TableCell>
													<TableCell>
														<div className='space-y-1'>
															{selectedTemplate?.schema.properties &&
																Object.entries(selectedTemplate.schema.properties as Record<string, {title?: string}>)
																	.filter(([key]) => key !== 'id')
																	.map(([key, prop]) => (
																		<Input
																			key={key}
																			placeholder={prop.title || key}
																			value={String(recipient.credentialData[key] || '')}
																			onChange={(e) =>
																				updateRecipient(recipient.id, {
																					credentialData: {
																						...recipient.credentialData,
																						[key]: e.target.value,
																					},
																				})
																			}
																			className='text-xs'
																		/>
																	))}
														</div>
													</TableCell>
													<TableCell>
														<Button variant='outline' size='sm' onClick={() => removeRecipient(recipient.id)}>
															<Trash2 className='h-4 w-4' />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						)}

						{/* Navigation */}
						<div className='flex gap-2'>
							<Button variant='outline' onClick={() => setCurrentStep('template')}>
								Back
							</Button>
							<Button onClick={processBulkIssuance} disabled={recipients.length === 0}>
								<Play className='h-4 w-4 mr-2' />
								Start Bulk Issuance
							</Button>
						</div>
					</div>
				)

			case 'processing':
				return (
					<div className='space-y-6 text-center'>
						<div>
							<h3 className='text-lg font-semibold mb-2'>Processing Credentials</h3>
							<p className='text-sm text-muted-foreground'>Issuing credentials to {recipients.length} recipients...</p>
						</div>

						<div className='space-y-4'>
							<Progress value={progress} className='w-full' />
							<p className='text-sm text-muted-foreground'>{Math.round(progress)}% complete</p>
						</div>

						{/* Real-time status */}
						<div className='max-h-60 overflow-y-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Recipient</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{recipients.map((recipient) => (
										<TableRow key={recipient.id}>
											<TableCell className='text-sm'>{recipient.did || recipient.email}</TableCell>
											<TableCell>
												<div className='flex items-center gap-2'>
													{recipient.status === 'processing' && <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary' />}
													{recipient.status === 'success' && <CheckCircle className='h-4 w-4 text-green-500' />}
													{recipient.status === 'error' && <AlertCircle className='h-4 w-4 text-red-500' />}
													<span className='text-sm capitalize'>{recipient.status}</span>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				)

			case 'results':
				return (
					<div className='space-y-6'>
						<div className='text-center'>
							<h3 className='text-lg font-semibold mb-2'>Bulk Issuance Complete</h3>
							<p className='text-sm text-muted-foreground'>Results for {results.total} recipients</p>
						</div>

						{/* Summary Stats */}
						<div className='grid grid-cols-3 gap-4'>
							<Card>
								<CardContent className='p-4 text-center'>
									<div className='text-2xl font-bold text-green-600'>{results.successful}</div>
									<div className='text-sm text-muted-foreground'>Successful</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className='p-4 text-center'>
									<div className='text-2xl font-bold text-red-600'>{results.failed}</div>
									<div className='text-sm text-muted-foreground'>Failed</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className='p-4 text-center'>
									<div className='text-2xl font-bold'>{results.total}</div>
									<div className='text-sm text-muted-foreground'>Total</div>
								</CardContent>
							</Card>
						</div>

						{/* Errors */}
						{results.errors.length > 0 && (
							<Alert variant='destructive'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>
									<div className='space-y-1'>
										<p className='font-semibold'>Errors occurred:</p>
										{results.errors.slice(0, 3).map((error, i) => (
											<p key={i} className='text-sm'>
												{error}
											</p>
										))}
										{results.errors.length > 3 && <p className='text-sm'>...and {results.errors.length - 3} more errors</p>}
									</div>
								</AlertDescription>
							</Alert>
						)}

						{/* Actions */}
						<div className='flex gap-2 justify-center'>
							<Button variant='outline' onClick={exportResults}>
								<Download className='h-4 w-4 mr-2' />
								Export Results
							</Button>
							<Button
								onClick={() => {
									setCurrentStep('template')
									setRecipients([])
									setResults({total: 0, successful: 0, failed: 0, credentials: [], errors: []})
								}}>
								Issue More Credentials
							</Button>
						</div>
					</div>
				)
		}
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Bulk Template-based Issuance</CardTitle>
				<CardDescription>Issue credentials to multiple recipients using templates</CardDescription>
			</CardHeader>
			<CardContent>{renderStepContent()}</CardContent>
		</Card>
	)
}
