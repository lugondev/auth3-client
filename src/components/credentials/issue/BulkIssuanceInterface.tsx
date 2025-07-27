'use client'

import React, {useState, useCallback, useRef} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Progress} from '@/components/ui/progress'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Upload, FileText, Download, AlertCircle, CheckCircle, Play, Pause, History} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate} from '@/types/template'
import type {BulkIssueCredentialResponse} from '@/types/credentials'
import * as tenantCredentialService from '@/services/tenantCredentialService'

interface BulkIssuanceInterfaceProps {
	tenantId: string
	selectedTemplate?: CredentialTemplate
	onTemplateSelect?: (template: CredentialTemplate) => void
	onComplete?: (result: BulkIssueCredentialResponse) => void
	className?: string
}

interface CSVRecord {
	[key: string]: string
}

interface BulkJob {
	id: string
	templateId: string
	templateName: string
	totalRecords: number
	processedRecords: number
	successCount: number
	errorCount: number
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused'
	createdAt: string
	errors?: Array<{
		row: number
		error: string
		data: CSVRecord
	}>
}

export function BulkIssuanceInterface({tenantId, selectedTemplate, onTemplateSelect, onComplete, className}: BulkIssuanceInterfaceProps) {
	const [csvFile, setCsvFile] = useState<File | null>(null)
	const [csvData, setCsvData] = useState<CSVRecord[]>([])
	const [csvHeaders, setCsvHeaders] = useState<string[]>([])
	const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
	const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([])
	const [currentJob, setCurrentJob] = useState<BulkJob | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const autoMapFields = useCallback((headers: string[], template: CredentialTemplate) => {
		const schemaProperties = template.schema.properties as Record<string, unknown>
		const mapping: Record<string, string> = {}

		headers.forEach((header) => {
			const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')

			// Try exact match first
			if (schemaProperties[header]) {
				mapping[header] = header
			} else {
				// Try fuzzy match
				const matchedField = Object.keys(schemaProperties).find((field) => {
					const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '')
					return normalizedField === normalizedHeader || normalizedField.includes(normalizedHeader) || normalizedHeader.includes(normalizedField)
				})
				if (matchedField) {
					mapping[header] = matchedField
				}
			}
		})

		setFieldMapping(mapping)
	}, [])

	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (!file) return

			if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
				toast.error('Please select a valid CSV file')
				return
			}

			setCsvFile(file)

			// Parse CSV file
			const reader = new FileReader()
			reader.onload = (e) => {
				const text = e.target?.result as string
				const lines = text.split('\n').filter((line) => line.trim())

				if (lines.length < 2) {
					toast.error('CSV file must contain headers and at least one data row')
					return
				}

				const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
				const records: CSVRecord[] = []

				for (let i = 1; i < lines.length; i++) {
					const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
					if (values.length === headers.length) {
						const record: CSVRecord = {}
						headers.forEach((header, index) => {
							record[header] = values[index] || ''
						})
						records.push(record)
					}
				}

				setCsvHeaders(headers)
				setCsvData(records)

				// Auto-map fields if template is selected
				if (selectedTemplate) {
					autoMapFields(headers, selectedTemplate)
				}

				toast.success(`Loaded ${records.length} records from CSV`)
			}

			reader.readAsText(file)
		},
		[selectedTemplate, autoMapFields],
	)

	const startBulkIssuance = useCallback(async () => {
		if (!selectedTemplate || !csvData.length) {
			toast.error('Please select a template and upload CSV data')
			return
		}

		// Validate field mapping
		const requiredFields = (selectedTemplate.schema.required as string[]) || []
		const mappedFields = Object.values(fieldMapping).filter(Boolean)
		const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field))

		if (missingRequired.length > 0) {
			toast.error(`Missing required field mappings: ${missingRequired.join(', ')}`)
			return
		}

		setIsProcessing(true)

		try {
			// Convert CSV data to credential data
			const recipients = csvData.map((record, index) => {
				const credentialSubject: Record<string, string> = {}

				Object.entries(fieldMapping).forEach(([csvField, schemaField]) => {
					if (schemaField && record[csvField] !== undefined) {
						credentialSubject[schemaField] = record[csvField]
					}
				})

				return {
					recipientDid: record.did || record.DID || record.recipientDid,
					recipientEmail: record.email || record.Email || `recipient${index}@example.com`,
					credentialSubject,
					customClaims: {},
				}
			})

			const response = await tenantCredentialService.bulkIssueCredentials(tenantId, {
				templateId: selectedTemplate.id,
				issuerDid: selectedTemplate.issuerDID || 'did:example:issuer',
				recipients: recipients,
				issuanceDate: new Date().toISOString(),
			})

			const newJob: BulkJob = {
				id: response.batchId,
				templateId: selectedTemplate.id,
				templateName: selectedTemplate.name,
				totalRecords: csvData.length,
				processedRecords: response.totalRequested,
				successCount: response.successCount,
				errorCount: response.failureCount,
				status: 'completed',
				createdAt: new Date().toISOString(),
				errors:
					response.failures?.map((failure, index) => ({
						row: index + 1,
						error: failure.error || 'Unknown error',
						data: {},
					})) || [],
			}

			setCurrentJob(newJob)
			setBulkJobs((prev) => [newJob, ...prev])

			toast.success(`Bulk issuance completed: ${response.successCount} successful, ${response.failureCount} failed`)

			// Call onComplete callback if provided
			if (onComplete) {
				onComplete(response)
			}
		} catch (error) {
			console.error('Bulk issuance error:', error)
			toast.error('Failed to start bulk issuance')
		} finally {
			setIsProcessing(false)
		}
	}, [selectedTemplate, csvData, fieldMapping, onComplete, tenantId])

	// Remove polling function since bulk API returns results immediately

	const downloadErrorReport = useCallback((job: BulkJob) => {
		if (!job.errors || job.errors.length === 0) {
			toast.error('No errors to download')
			return
		}

		const csvContent = [['Row', 'Error', 'Data'].join(','), ...job.errors.map((error) => [error.row.toString(), `"${error.error.replace(/"/g, '""')}"`, `"${JSON.stringify(error.data).replace(/"/g, '""')}"`].join(','))].join('\n')

		const blob = new Blob([csvContent], {type: 'text/csv'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `bulk-issuance-errors-${job.id}.csv`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)

		toast.success('Error report downloaded')
	}, [])

	const getStatusIcon = (status: BulkJob['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className='h-4 w-4 text-green-500' />
			case 'failed':
				return <AlertCircle className='h-4 w-4 text-red-500' />
			case 'processing':
				return <Play className='h-4 w-4 text-blue-500' />
			case 'paused':
				return <Pause className='h-4 w-4 text-yellow-500' />
			default:
				return <FileText className='h-4 w-4 text-gray-500' />
		}
	}

	if (!selectedTemplate) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Bulk Credential Issuance</CardTitle>
					<CardDescription>Please select a credential template first to use bulk issuance</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<div className={`space-y-6 ${className}`}>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Upload className='h-5 w-5' />
						Bulk Credential Issuance
					</CardTitle>
					<CardDescription>
						Upload a CSV file to issue multiple credentials using template: <strong>{selectedTemplate.name}</strong>
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* File Upload */}
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='csv-upload'>Upload CSV File</Label>
							<div className='flex items-center gap-4'>
								<Input ref={fileInputRef} id='csv-upload' type='file' accept='.csv' onChange={handleFileUpload} className='flex-1' />
								<Button variant='outline' onClick={() => fileInputRef.current?.click()}>
									<Upload className='h-4 w-4 mr-2' />
									Browse
								</Button>
							</div>
						</div>

						{csvFile && (
							<Alert>
								<FileText className='h-4 w-4' />
								<AlertDescription>
									Loaded: <strong>{csvFile.name}</strong> ({csvData.length} records)
								</AlertDescription>
							</Alert>
						)}
					</div>

					{/* Field Mapping */}
					{csvHeaders.length > 0 && (
						<div className='space-y-4'>
							<Separator />
							<div>
								<h4 className='text-sm font-medium mb-3'>Map CSV Fields to Template Schema</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									{csvHeaders.map((header) => (
										<div key={header} className='space-y-2'>
											<Label className='text-xs'>{header}</Label>
											<select
												value={fieldMapping[header] || ''}
												onChange={(e) =>
													setFieldMapping((prev) => ({
														...prev,
														[header]: e.target.value,
													}))
												}
												className='w-full p-2 border rounded-md text-sm'>
												<option value=''>-- Skip Field --</option>
												{Object.keys(selectedTemplate.schema.properties as Record<string, unknown>).map((field) => (
													<option key={field} value={field}>
														{field} {(selectedTemplate.schema.required as string[])?.includes(field) ? '*' : ''}
													</option>
												))}
											</select>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Start Processing */}
					{csvData.length > 0 && (
						<div className='flex items-center justify-between'>
							<div className='text-sm text-muted-foreground'>Ready to process {csvData.length} credentials</div>
							<Button onClick={startBulkIssuance} disabled={isProcessing} className='ml-auto'>
								{isProcessing ? (
									<>
										<Play className='h-4 w-4 mr-2 animate-spin' />
										Processing...
									</>
								) : (
									<>
										<Play className='h-4 w-4 mr-2' />
										Start Bulk Issuance
									</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Current Job Progress */}
			{currentJob && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							{getStatusIcon(currentJob.status)}
							Current Job Progress
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<div className='flex justify-between text-sm'>
								<span>Progress</span>
								<span>
									{currentJob.processedRecords} / {currentJob.totalRecords}
								</span>
							</div>
							<Progress value={(currentJob.processedRecords / currentJob.totalRecords) * 100} className='w-full' />
						</div>

						<div className='grid grid-cols-3 gap-4 text-center'>
							<div>
								<div className='text-2xl font-bold text-green-600'>{currentJob.successCount}</div>
								<div className='text-xs text-muted-foreground'>Successful</div>
							</div>
							<div>
								<div className='text-2xl font-bold text-red-600'>{currentJob.errorCount}</div>
								<div className='text-xs text-muted-foreground'>Failed</div>
							</div>
							<div>
								<div className='text-2xl font-bold'>{currentJob.totalRecords - currentJob.processedRecords}</div>
								<div className='text-xs text-muted-foreground'>Remaining</div>
							</div>
						</div>

						{currentJob.errors && currentJob.errors.length > 0 && (
							<Button variant='outline' size='sm' onClick={() => downloadErrorReport(currentJob)} className='w-full'>
								<Download className='h-4 w-4 mr-2' />
								Download Error Report ({currentJob.errors.length} errors)
							</Button>
						)}
					</CardContent>
				</Card>
			)}

			{/* Job History */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle className='flex items-center gap-2'>
							<History className='h-5 w-5' />
							Bulk Issuance History
						</CardTitle>
						<Button variant='outline' size='sm' onClick={() => setShowHistory(!showHistory)}>
							{showHistory ? 'Hide' : 'Show'} History
						</Button>
					</div>
				</CardHeader>
				{showHistory && (
					<CardContent>
						{bulkJobs.length === 0 ? (
							<div className='text-center text-muted-foreground py-4'>No bulk issuance jobs yet</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Status</TableHead>
										<TableHead>Template</TableHead>
										<TableHead>Records</TableHead>
										<TableHead>Success</TableHead>
										<TableHead>Errors</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{bulkJobs.map((job) => (
										<TableRow key={job.id}>
											<TableCell>
												<div className='flex items-center gap-2'>
													{getStatusIcon(job.status)}
													<Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>{job.status}</Badge>
												</div>
											</TableCell>
											<TableCell>{job.templateName}</TableCell>
											<TableCell>{job.totalRecords}</TableCell>
											<TableCell>{job.successCount}</TableCell>
											<TableCell>{job.errorCount}</TableCell>
											<TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
											<TableCell>
												{job.errors && job.errors.length > 0 && (
													<Button variant='outline' size='sm' onClick={() => downloadErrorReport(job)}>
														<Download className='h-4 w-4' />
													</Button>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				)}
			</Card>
		</div>
	)
}
