'use client'

import React, {useState, useCallback, useRef, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {FileText, Download, AlertCircle, CheckCircle, Play, Plus, Trash2, RefreshCw} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate} from '@/types/template'
import type {BulkIssueCredentialResponse} from '@/types/credentials'
import {templateService} from '@/services/templateService'

interface PersonalBulkIssuanceProps {
	onComplete?: (result: BulkIssueCredentialResponse) => void
	className?: string
}

interface CSVRecord {
	[key: string]: string
}

interface ManualDataEntry {
	id: string
	recipientEmail: string
	recipientName: string
	customClaims: Record<string, string>
}

interface ProcessingStatus {
	isProcessing: boolean
	currentIndex: number
	totalRecords: number
	successCount: number
	errorCount: number
	results: Array<{
		index: number
		success: boolean
		error?: string
		credentialId?: string
	}>
}

/**
 * Personal Bulk Credential Issuance Component
 * Enhanced version with template selection and manual data entry
 */
export function PersonalBulkIssuance({onComplete, className}: PersonalBulkIssuanceProps) {
	// Template selection
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null)
	const [availableTemplates, setAvailableTemplates] = useState<CredentialTemplate[]>([])
	const [filteredTemplates, setFilteredTemplates] = useState<CredentialTemplate[]>([])
	const [templateSearchQuery, setTemplateSearchQuery] = useState('')
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

	// Confirmation modal
	const [showConfirmModal, setShowConfirmModal] = useState(false)

	// Data input methods
	const [inputMethod, setInputMethod] = useState<'csv' | 'manual'>('csv')

	// CSV mode
	const [csvFile, setCsvFile] = useState<File | null>(null)
	const [csvData, setCsvData] = useState<CSVRecord[]>([])

	// Manual mode
	const [manualData, setManualData] = useState<ManualDataEntry[]>([
		{
			id: `entry_${Date.now()}_0`,
			recipientEmail: '',
			recipientName: '',
			customClaims: {},
		},
	])

	const [processing, setProcessing] = useState<ProcessingStatus>({
		isProcessing: false,
		currentIndex: 0,
		totalRecords: 0,
		successCount: 0,
		errorCount: 0,
		results: [],
	})
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Load templates on component mount
	useEffect(() => {
		loadAvailableTemplates()
	}, [])

	// Filter templates based on search query
	useEffect(() => {
		if (!templateSearchQuery.trim()) {
			setFilteredTemplates(availableTemplates)
		} else {
			const query = templateSearchQuery.toLowerCase()
			const filtered = availableTemplates.filter((template) => template.name.toLowerCase().includes(query) || template.description.toLowerCase().includes(query) || template.type.some((type) => type.toLowerCase().includes(query)) || (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(query))))
			setFilteredTemplates(filtered)
		}
	}, [availableTemplates, templateSearchQuery])

	const loadAvailableTemplates = async () => {
		setIsLoadingTemplates(true)
		try {
			const response = await templateService.listTemplates({
				active: true,
				limit: 50, // Load first 50 active templates
			})
			setAvailableTemplates(response.templates)

			if (response.templates.length === 0) {
				toast.info('No templates found. You can create templates in the Templates section.')
			}
		} catch (error) {
			console.error('Error loading templates:', error)
			toast.error('Failed to load templates. Please try again.')
			setAvailableTemplates([])
		} finally {
			setIsLoadingTemplates(false)
		}
	}

	const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.name.endsWith('.csv')) {
			toast.error('Please select a CSV file')
			return
		}

		setCsvFile(file)

		// Parse CSV file
		const reader = new FileReader()
		reader.onload = (e) => {
			const text = e.target?.result as string
			const lines = text.split('\n').filter((line) => line.trim())

			if (lines.length < 2) {
				toast.error('CSV file must contain at least a header row and one data row')
				return
			}

			const headers = lines[0].split(',').map((h) => h.trim())
			const records = lines.slice(1).map((line) => {
				const values = line.split(',').map((v) => v.trim())
				const record: CSVRecord = {}
				headers.forEach((header, i) => {
					record[header] = values[i] || ''
				})
				return record
			})

			setCsvData(records)
			toast.success(`Loaded ${records.length} records from CSV`)
		}

		reader.onerror = () => {
			toast.error('Failed to read CSV file')
		}

		reader.readAsText(file)
	}, [])

	// Helper functions
	const canStartProcessing = () => {
		if (!selectedTemplate) return false

		if (inputMethod === 'csv') {
			return csvData.length > 0
		} else {
			return manualData.length > 0 && manualData.every((entry) => entry.recipientEmail && entry.recipientName)
		}
	}

	const getRecordCount = () => {
		if (inputMethod === 'csv') {
			return csvData.length
		} else {
			return manualData.length
		}
	}

	const finalizeBulkProcess = useCallback(
		(csvData: CSVRecord[], successCount: number, errorCount: number, results: ProcessingStatus['results']) => {
			setProcessing((prev) => ({
				...prev,
				isProcessing: false,
			}))

			const response: BulkIssueCredentialResponse = {
				batchId: `batch_${Date.now()}`,
				totalRequested: csvData.length,
				successCount,
				failureCount: errorCount,
				credentials: results
					.filter((r) => r.success)
					.map((r) => ({
						credentialId: r.credentialId || `cred_${r.index}`,
						recipientEmail: csvData[r.index]?.recipient_email || '',
						status: 'success' as const,
						issuedAt: new Date().toISOString(),
					})),
				failures: results
					.filter((r) => !r.success)
					.map((r) => ({
						recipientEmail: csvData[r.index]?.recipient_email || '',
						error: r.error || 'Unknown error',
						index: r.index,
					})),
				processedAt: new Date().toISOString(),
				message: `Bulk issuance completed: ${successCount} successful, ${errorCount} failed`,
				status: errorCount === 0 ? 'completed' : 'partial',
			}

			toast.success(`Bulk issuance completed: ${successCount} successful, ${errorCount} failed`)
			onComplete?.(response)
		},
		[onComplete],
	)

	const startBulkIssuance = async () => {
		const dataToProcess =
			inputMethod === 'csv'
				? csvData
				: manualData.map((entry) => ({
						recipient_email: entry.recipientEmail,
						recipient_name: entry.recipientName,
						...entry.customClaims,
				  }))

		if (!dataToProcess.length) {
			toast.error('No data to process')
			return
		}

		setProcessing({
			isProcessing: true,
			currentIndex: 0,
			totalRecords: dataToProcess.length,
			successCount: 0,
			errorCount: 0,
			results: [],
		})

		const results: ProcessingStatus['results'] = []
		let successCount = 0
		let errorCount = 0

		// Process each record
		for (let i = 0; i < dataToProcess.length; i++) {
			setProcessing((prev) => ({
				...prev,
				currentIndex: i + 1,
			}))

			try {
				// For demo purposes, we'll simulate the API call
				// In reality, this would call personalCredentialService.issueCredential
				await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

				// Simulate success/failure (90% success rate for demo)
				const isSuccess = Math.random() > 0.1

				if (isSuccess) {
					const credentialId = `cred_${Date.now()}_${i}`
					results.push({
						index: i,
						success: true,
						credentialId,
					})
					successCount++
				} else {
					results.push({
						index: i,
						success: false,
						error: 'Simulated API error',
					})
					errorCount++
				}
			} catch (error) {
				results.push({
					index: i,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
				errorCount++
			}

			setProcessing((prev) => ({
				...prev,
				successCount,
				errorCount,
				results: [...results],
			}))
		}

		// Use CSV data format for response compatibility
		const csvFormatData = inputMethod === 'csv' ? csvData : dataToProcess
		finalizeBulkProcess(csvFormatData, successCount, errorCount, results)
	}

	const resetProcess = useCallback(() => {
		setCsvFile(null)
		setCsvData([])
		setManualData([
			{
				id: `entry_${Date.now()}`,
				recipientEmail: '',
				recipientName: '',
				customClaims: {},
			},
		])
		setProcessing({
			isProcessing: false,
			currentIndex: 0,
			totalRecords: 0,
			successCount: 0,
			errorCount: 0,
			results: [],
		})
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}, [])

	const downloadTemplate = useCallback(() => {
		let templateContent = 'recipient_email,recipient_name'

		// Add schema properties as CSV columns if available
		if (selectedTemplate?.schema?.properties) {
			const schemaProperties = Object.keys(selectedTemplate.schema.properties)
			templateContent += ',' + schemaProperties.join(',')
		} else {
			// Default columns if no schema
			templateContent += ',credential_type,subject_name,subject_value'
		}

		// Add example data row
		templateContent += '\n'
		if (selectedTemplate?.schema?.properties) {
			const schemaProperties = Object.keys(selectedTemplate.schema.properties)
			const exampleData = [
				'john@example.com',
				'John Doe',
				...schemaProperties.map((prop) => {
					// Generate example values based on property name
					if (prop.toLowerCase().includes('date')) return '2024-01-15'
					if (prop.toLowerCase().includes('name')) return 'John Doe'
					if (prop.toLowerCase().includes('email')) return 'john@example.com'
					if (prop.toLowerCase().includes('score')) return '85'
					if (prop.toLowerCase().includes('grade')) return 'A'
					if (prop.toLowerCase().includes('level')) return 'Advanced'
					if (prop.toLowerCase().includes('skill')) return 'Data Science'
					if (prop.toLowerCase().includes('achievement')) return 'Certificate of Completion'
					return 'Sample Value'
				}),
			]
			templateContent += exampleData.join(',')
		} else {
			templateContent += 'john@example.com,John Doe,VerifiableCredential,Certification,Data Science Certificate'
		}

		// Add a second example row
		templateContent += '\n'
		if (selectedTemplate?.schema?.properties) {
			const schemaProperties = Object.keys(selectedTemplate.schema.properties)
			const exampleData2 = [
				'jane@example.com',
				'Jane Smith',
				...schemaProperties.map((prop) => {
					if (prop.toLowerCase().includes('date')) return '2024-02-20'
					if (prop.toLowerCase().includes('name')) return 'Jane Smith'
					if (prop.toLowerCase().includes('email')) return 'jane@example.com'
					if (prop.toLowerCase().includes('score')) return '92'
					if (prop.toLowerCase().includes('grade')) return 'A+'
					if (prop.toLowerCase().includes('level')) return 'Expert'
					if (prop.toLowerCase().includes('skill')) return 'Machine Learning'
					if (prop.toLowerCase().includes('achievement')) return 'Excellence Award'
					return 'Another Value'
				}),
			]
			templateContent += exampleData2.join(',')
		} else {
			templateContent += 'jane@example.com,Jane Smith,VerifiableCredential,Achievement,Leadership Award'
		}

		const blob = new Blob([templateContent], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${selectedTemplate?.name ? selectedTemplate.name.toLowerCase().replace(/\s+/g, '_') : 'personal_bulk_credentials'}_template.csv`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)

		toast.success('Template downloaded successfully')
	}, [selectedTemplate])

	return (
		<div className={className}>
			<div className='space-y-6'>
				{/* Template Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Select Credential Template</CardTitle>
						<CardDescription>Choose a template for your bulk credential issuance</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{/* Search Box */}
							<div>
								<Label htmlFor='template-search'>Search Templates</Label>
								<Input id='template-search' type='text' placeholder='Search by name, description, type, or tags...' value={templateSearchQuery} onChange={(e) => setTemplateSearchQuery(e.target.value)} disabled={isLoadingTemplates} className='mb-2' />
							</div>

							<div>
								<Label htmlFor='template-select'>Credential Template</Label>
								<Select
									value={selectedTemplate?.id || ''}
									onValueChange={(value) => {
										const template = availableTemplates.find((t) => t.id === value)
										setSelectedTemplate(template || null)
									}}
									disabled={isLoadingTemplates}>
									<SelectTrigger>
										<SelectValue placeholder={isLoadingTemplates ? 'Loading templates...' : filteredTemplates.length === 0 && templateSearchQuery ? `No templates match "${templateSearchQuery}"` : availableTemplates.length === 0 ? 'No templates available' : 'Select a template...'} />
									</SelectTrigger>
									<SelectContent className='max-h-60'>
										{isLoadingTemplates ? (
											<SelectItem value='loading' disabled>
												Loading templates...
											</SelectItem>
										) : filteredTemplates.length === 0 ? (
											<SelectItem value='none' disabled>
												{templateSearchQuery ? `No templates match "${templateSearchQuery}"` : 'No templates available'}
											</SelectItem>
										) : (
											<>
												{filteredTemplates.slice(0, 20).map((template) => (
													<SelectItem key={template.id} value={template.id}>
														<div className='flex flex-col items-start py-1'>
															<div className='font-medium'>{template.name}</div>
															<div className='text-xs text-muted-foreground truncate max-w-xs'>{template.description}</div>
															{template.tags && template.tags.length > 0 && <div className='text-xs text-muted-foreground'>Tags: {template.tags.join(', ')}</div>}
														</div>
													</SelectItem>
												))}
												{filteredTemplates.length > 20 && (
													<SelectItem value='more' disabled>
														... and {filteredTemplates.length - 20} more templates (refine your search)
													</SelectItem>
												)}
											</>
										)}
									</SelectContent>
								</Select>
							</div>

							{/* Refresh Templates Button */}
							<div className='flex justify-between items-center'>
								<div className='text-sm text-muted-foreground'>
									{availableTemplates.length > 0 && (
										<>
											{templateSearchQuery ? (
												<span>
													{filteredTemplates.length} of {availableTemplates.length} template{availableTemplates.length === 1 ? '' : 's'}
													{filteredTemplates.length === 0 ? ' match' : filteredTemplates.length === 1 ? ' matches' : ' match'} "{templateSearchQuery}"
												</span>
											) : (
												<span>
													{availableTemplates.length} template{availableTemplates.length === 1 ? '' : 's'} available
												</span>
											)}
										</>
									)}
								</div>
								<div className='flex gap-2'>
									{templateSearchQuery && (
										<Button variant='ghost' size='sm' onClick={() => setTemplateSearchQuery('')}>
											Clear Search
										</Button>
									)}
									<Button variant='outline' size='sm' onClick={loadAvailableTemplates} disabled={isLoadingTemplates}>
										<RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
										{isLoadingTemplates ? 'Loading...' : 'Refresh'}
									</Button>
								</div>
							</div>

							{/* No templates message */}
							{!isLoadingTemplates && (
								<>
									{availableTemplates.length === 0 ? (
										<div className='text-center py-6 border-2 border-dashed border-gray-200 rounded-lg'>
											<FileText className='h-12 w-12 mx-auto text-gray-400 mb-3' />
											<p className='text-sm text-muted-foreground mb-3'>No credential templates found</p>
											<p className='text-xs text-muted-foreground mb-4'>Create templates in the Templates section to enable bulk credential issuance</p>
											<Button variant='outline' size='sm' onClick={loadAvailableTemplates}>
												<RefreshCw className='h-4 w-4 mr-2' />
												Try Again
											</Button>
										</div>
									) : filteredTemplates.length === 0 && templateSearchQuery ? (
										<div className='text-center py-6 border-2 border-dashed border-gray-200 rounded-lg'>
											<FileText className='h-12 w-12 mx-auto text-gray-400 mb-3' />
											<p className='text-sm text-muted-foreground mb-3'>No templates match your search</p>
											<p className='text-xs text-muted-foreground mb-4'>Try refining your search terms or clear the search to see all templates</p>
											<Button variant='outline' size='sm' onClick={() => setTemplateSearchQuery('')}>
												Clear Search
											</Button>
										</div>
									) : null}
								</>
							)}

							{selectedTemplate && (
								<Alert>
									<FileText className='h-4 w-4' />
									<AlertDescription>
										<div className='space-y-1'>
											<div>
												<strong>{selectedTemplate.name}</strong> - {selectedTemplate.description}
											</div>
											<div className='text-xs text-muted-foreground'>
												Version: {selectedTemplate.version} | Type: {selectedTemplate.type.join(', ')} |{selectedTemplate.tags && selectedTemplate.tags.length > 0 && <span> Tags: {selectedTemplate.tags.join(', ')}</span>}
											</div>
										</div>
									</AlertDescription>
								</Alert>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Data Input Method Selection */}
				{selectedTemplate && (
					<Card>
						<CardHeader>
							<CardTitle>Choose Data Input Method</CardTitle>
							<CardDescription>Select how you want to provide recipient data</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'csv' | 'manual')}>
								<TabsList className='grid w-full grid-cols-2'>
									<TabsTrigger value='csv'>CSV Upload</TabsTrigger>
									<TabsTrigger value='manual'>Manual Entry</TabsTrigger>
								</TabsList>

								{/* CSV Upload Tab */}
								<TabsContent value='csv' className='space-y-4'>
									<div className='space-y-4'>
										<div className='flex items-center gap-4'>
											<div className='flex-1'>
												<Label htmlFor='csv-file'>CSV File</Label>
												<Input ref={fileInputRef} id='csv-file' type='file' accept='.csv' onChange={handleFileSelect} disabled={processing.isProcessing} />
											</div>
											<Button variant='outline' onClick={downloadTemplate} disabled={processing.isProcessing}>
												<Download className='h-4 w-4 mr-2' />
												Download Template
											</Button>
										</div>

										{csvFile && (
											<Alert>
												<FileText className='h-4 w-4' />
												<AlertDescription>
													File loaded: <strong>{csvFile.name}</strong> ({csvData.length} records)
												</AlertDescription>
											</Alert>
										)}

										{/* CSV Data Preview */}
										{csvData.length > 0 && (
											<div>
												<h4 className='font-medium mb-2'>Data Preview</h4>
												<div className='overflow-x-auto'>
													<Table>
														<TableHeader>
															<TableRow>
																{Object.keys(csvData[0] || {}).map((header) => (
																	<TableHead key={header}>{header}</TableHead>
																))}
															</TableRow>
														</TableHeader>
														<TableBody>
															{csvData.slice(0, 3).map((record, index) => (
																<TableRow key={index}>
																	{Object.values(record).map((value, i) => (
																		<TableCell key={i} className='max-w-xs truncate'>
																			{value}
																		</TableCell>
																	))}
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
												{csvData.length > 3 && <p className='text-sm text-muted-foreground mt-2'>... and {csvData.length - 3} more records</p>}
											</div>
										)}
									</div>
								</TabsContent>

								{/* Manual Entry Tab */}
								<TabsContent value='manual' className='space-y-4'>
									<div className='space-y-4'>
										<div className='flex justify-between items-center'>
											<h4 className='font-medium'>Manual Data Entry</h4>
											<Button
												variant='outline'
												size='sm'
												onClick={() => {
													setManualData((prev) => [
														...prev,
														{
															id: `entry_${Date.now()}_${prev.length}`,
															recipientEmail: '',
															recipientName: '',
															customClaims: {},
														},
													])
												}}>
												<Plus className='h-4 w-4 mr-2' />
												Add Entry
											</Button>
										</div>

										<div className='space-y-3'>
											{manualData.map((entry, index) => (
												<Card key={entry.id} className='p-4'>
													<div className='flex justify-between items-start mb-3'>
														<h5 className='font-medium'>Entry {index + 1}</h5>
														{manualData.length > 1 && (
															<Button
																variant='ghost'
																size='sm'
																onClick={() => {
																	setManualData((prev) => prev.filter((e) => e.id !== entry.id))
																}}>
																<Trash2 className='h-4 w-4' />
															</Button>
														)}
													</div>

													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														<div>
															<Label htmlFor={`email-${entry.id}`}>Recipient Email</Label>
															<Input
																id={`email-${entry.id}`}
																type='email'
																placeholder='recipient@example.com'
																value={entry.recipientEmail}
																onChange={(e) => {
																	setManualData((prev) => prev.map((item) => (item.id === entry.id ? {...item, recipientEmail: e.target.value} : item)))
																}}
															/>
														</div>

														<div>
															<Label htmlFor={`name-${entry.id}`}>Recipient Name</Label>
															<Input
																id={`name-${entry.id}`}
																placeholder='John Doe'
																value={entry.recipientName}
																onChange={(e) => {
																	setManualData((prev) => prev.map((item) => (item.id === entry.id ? {...item, recipientName: e.target.value} : item)))
																}}
															/>
														</div>

														<div className='md:col-span-2'>
															<Label htmlFor={`claims-${entry.id}`}>Custom Claims (JSON)</Label>
															<Textarea
																id={`claims-${entry.id}`}
																placeholder='{"achievement": "Data Science Certificate", "date": "2024-01-15"}'
																value={JSON.stringify(entry.customClaims, null, 2)}
																onChange={(e) => {
																	try {
																		const claims = JSON.parse(e.target.value || '{}')
																		setManualData((prev) => prev.map((item) => (item.id === entry.id ? {...item, customClaims: claims} : item)))
																	} catch {
																		// Handle invalid JSON gracefully
																	}
																}}
																rows={3}
															/>
														</div>
													</div>
												</Card>
											))}
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				)}

				{/* Processing Section */}
				{(processing.isProcessing || processing.results.length > 0) && (
					<Card>
						<CardHeader>
							<CardTitle>Bulk Issuance Progress</CardTitle>
							<CardDescription>{processing.isProcessing ? 'Processing credential issuance...' : 'Bulk issuance completed'}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								{processing.isProcessing && (
									<div className='space-y-2'>
										<div className='flex justify-between text-sm'>
											<span>Progress</span>
											<span>
												{processing.currentIndex} / {processing.totalRecords}
											</span>
										</div>
										<Progress value={(processing.currentIndex / processing.totalRecords) * 100} className='h-2' />
									</div>
								)}

								<div className='flex gap-4'>
									<Badge variant='secondary'>
										<CheckCircle className='h-3 w-3 mr-1' />
										Success: {processing.successCount}
									</Badge>
									<Badge variant='destructive'>
										<AlertCircle className='h-3 w-3 mr-1' />
										Failed: {processing.errorCount}
									</Badge>
								</div>

								{!processing.isProcessing && (
									<div className='flex gap-2'>
										<Button onClick={() => setShowConfirmModal(true)} disabled={!canStartProcessing()}>
											<Play className='h-4 w-4 mr-2' />
											Start Bulk Issuance
										</Button>
										<Button variant='outline' onClick={resetProcess}>
											Reset
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Action Buttons */}
				{canStartProcessing() && !processing.isProcessing && processing.results.length === 0 && (
					<div className='flex gap-2'>
						<Button onClick={() => setShowConfirmModal(true)} size='lg'>
							<Play className='h-4 w-4 mr-2' />
							Start Bulk Issuance ({getRecordCount()} credentials)
						</Button>
						<Button variant='outline' onClick={resetProcess}>
							Clear All
						</Button>
					</div>
				)}
			</div>

			{/* Confirmation Modal */}
			<Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Bulk Credential Issuance</DialogTitle>
						<DialogDescription>
							You are about to issue {getRecordCount()} credentials using the template "{selectedTemplate?.name}". This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<div className='text-sm'>
								<strong>Template:</strong> {selectedTemplate?.name}
							</div>
							<div className='text-sm'>
								<strong>Recipients:</strong> {getRecordCount()} credential{getRecordCount() === 1 ? '' : 's'}
							</div>
							<div className='text-sm'>
								<strong>Input Method:</strong> {inputMethod === 'csv' ? 'CSV Upload' : 'Manual Entry'}
							</div>
						</div>

						{inputMethod === 'csv' && csvFile && (
							<div className='text-sm text-muted-foreground'>
								<strong>CSV File:</strong> {csvFile.name}
							</div>
						)}

						<Alert>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>Once started, the bulk issuance process will begin immediately. Make sure all recipient data is correct before proceeding.</AlertDescription>
						</Alert>
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setShowConfirmModal(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setShowConfirmModal(false)
								startBulkIssuance()
							}}>
							<Play className='h-4 w-4 mr-2' />
							Confirm & Start Issuance
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
