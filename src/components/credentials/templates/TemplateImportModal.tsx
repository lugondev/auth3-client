'use client'

import React, {useState, useRef} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Upload, FileText, AlertCircle, CheckCircle, X, Download, Eye} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate, TemplateImportRequest, JSONValue} from '@/types/template'
import {templateService} from '@/services/templateService'

interface TemplateImportModalProps {
	open: boolean
	onClose: () => void
	onImportSuccess: (template: CredentialTemplate) => void
}

export function TemplateImportModal({open, onClose, onImportSuccess}: TemplateImportModalProps) {
	const [activeTab, setActiveTab] = useState('file')
	const [loading, setLoading] = useState(false)
	const [previewTemplate, setPreviewTemplate] = useState<CredentialTemplate | null>(null)
	const [jsonContent, setJsonContent] = useState('')
	const [overwriteID, setOverwriteID] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const resetForm = () => {
		setActiveTab('file')
		setPreviewTemplate(null)
		setJsonContent('')
		setOverwriteID(false)
		setSelectedFile(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.name.endsWith('.json') && !file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
			toast.error('Please select a JSON or YAML file')
			return
		}

		setSelectedFile(file)
		previewFileContent(file)
	}

	const previewFileContent = (file: File) => {
		const reader = new FileReader()

		reader.onload = (event) => {
			try {
				const content = event.target?.result as string
				const templateData = JSON.parse(content)
				const template = templateData.template || templateData

				if (isValidTemplate(template)) {
					setPreviewTemplate(template)
					setJsonContent(JSON.stringify(template, null, 2))
				} else {
					toast.error('Invalid template format')
					setPreviewTemplate(null)
				}
			} catch {
				toast.error('Failed to parse file content')
				setPreviewTemplate(null)
			}
		}

		reader.readAsText(file)
	}

	const handleJsonContentChange = (content: string) => {
		setJsonContent(content)

		if (!content.trim()) {
			setPreviewTemplate(null)
			return
		}

		try {
			const templateData = JSON.parse(content)
			const template = templateData.template || templateData

			if (isValidTemplate(template)) {
				setPreviewTemplate(template)
			} else {
				setPreviewTemplate(null)
			}
		} catch {
			setPreviewTemplate(null)
		}
	}

	const isValidTemplate = (template: unknown): template is CredentialTemplate => {
		if (!template || typeof template !== 'object') return false

		const t = template as Record<string, unknown>
		return typeof t.name === 'string' && typeof t.description === 'string' && Array.isArray(t.type) && Array.isArray(t['@context']) && typeof t.schema === 'object' && t.schema !== null && typeof t.issuerDID === 'string' && typeof t.version === 'string'
	}

	const handleImport = async () => {
		if (!previewTemplate) {
			toast.error('No valid template to import')
			return
		}

		try {
			setLoading(true)

			let result: CredentialTemplate

			if (activeTab === 'file' && selectedFile) {
				result = await templateService.uploadTemplateImport(selectedFile, overwriteID)
			} else {
				const request: TemplateImportRequest = {
					template: previewTemplate,
					format: 'json',
					overwriteID,
				}
				result = await templateService.importTemplate(request)
			}

			toast.success('Template imported successfully')
			onImportSuccess(result)
			handleClose()
		} catch (error) {
			toast.error(`Failed to import template: ${error}`)
			console.error('Import error:', error)
		} finally {
			setLoading(false)
		}
	}

	const downloadSample = () => {
		const sampleTemplate: CredentialTemplate = {
			id: 'template-id-will-be-generated',
			name: 'Sample Credential Template',
			description: 'A sample template for demonstration purposes',
			type: ['VerifiableCredential', 'SampleCredential'],
			'@context': ['https://www.w3.org/2018/credentials/v1', 'https://example.com/contexts/sample/v1'],
			schema: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						title: 'Full Name',
						description: "The person's full name",
					},
					email: {
						type: 'string',
						format: 'email',
						title: 'Email Address',
						description: "The person's email address",
					},
					score: {
						type: 'number',
						minimum: 0,
						maximum: 100,
						title: 'Score',
						description: 'Achievement score',
					},
				},
				required: ['name', 'email'],
			},
			userID: 'user-id-will-be-set',
			issuerDID: 'did:example:issuer123',
			active: true,
			version: '1.0.0',
			tags: ['sample', 'demo'],
			metadata: {
				category: 'Education',
				difficulty: 'Beginner',
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}

		const blob = new Blob([JSON.stringify(sampleTemplate, null, 2)], {
			type: 'application/json',
		})

		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = 'sample-template.json'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	const renderJSONValue = (value: JSONValue, depth = 0): React.ReactNode => {
		if (value === null) return <span className='text-muted-foreground'>null</span>
		if (typeof value === 'boolean') return <span className='text-blue-600'>{value.toString()}</span>
		if (typeof value === 'number') return <span className='text-green-600'>{value}</span>
		if (typeof value === 'string') return <span className='text-orange-600'>"{value}"</span>

		if (Array.isArray(value)) {
			if (value.length === 0) return <span>[]</span>
			return (
				<div className={`${depth > 0 ? 'ml-4' : ''}`}>
					<span>[</span>
					{value.slice(0, 3).map((item, index) => (
						<div key={index} className='ml-4'>
							{renderJSONValue(item, depth + 1)}
							{index < Math.min(value.length - 1, 2) && <span>,</span>}
						</div>
					))}
					{value.length > 3 && <div className='ml-4 text-muted-foreground'>... {value.length - 3} more items</div>}
					<span>]</span>
				</div>
			)
		}

		if (typeof value === 'object' && value !== null) {
			const entries = Object.entries(value)
			if (entries.length === 0) return <span>{'{}'}</span>

			return (
				<div className={`${depth > 0 ? 'ml-4' : ''}`}>
					<span>{'{'}</span>
					{entries.slice(0, 3).map(([key, val], index) => (
						<div key={key} className='ml-4'>
							<span className='text-purple-600'>"{key}"</span>: {renderJSONValue(val, depth + 1)}
							{index < Math.min(entries.length - 1, 2) && <span>,</span>}
						</div>
					))}
					{entries.length > 3 && <div className='ml-4 text-muted-foreground'>... {entries.length - 3} more properties</div>}
					<span>{'}'}</span>
				</div>
			)
		}

		return <span>{String(value)}</span>
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Import Template</DialogTitle>
					<DialogDescription>Import a credential template from a file or paste JSON content directly.</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='file'>File Upload</TabsTrigger>
							<TabsTrigger value='json'>JSON Content</TabsTrigger>
						</TabsList>

						<TabsContent value='file' className='space-y-4'>
							<Card>
								<CardHeader>
									<CardTitle className='text-lg flex items-center gap-2'>
										<Upload className='h-5 w-5' />
										Upload Template File
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='template-file'>Select Template File</Label>
										<Input id='template-file' type='file' accept='.json,.yaml,.yml' onChange={handleFileSelect} ref={fileInputRef} />
										<p className='text-sm text-muted-foreground'>Supports JSON and YAML formats</p>
									</div>

									<div className='flex items-center space-x-2'>
										<Button type='button' variant='outline' size='sm' onClick={downloadSample}>
											<Download className='h-4 w-4 mr-2' />
											Download Sample
										</Button>
									</div>

									{selectedFile && (
										<div className='flex items-center gap-2 p-2 bg-muted rounded'>
											<FileText className='h-4 w-4' />
											<span className='text-sm'>{selectedFile.name}</span>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => {
													setSelectedFile(null)
													setPreviewTemplate(null)
													if (fileInputRef.current) {
														fileInputRef.current.value = ''
													}
												}}>
												<X className='h-4 w-4' />
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value='json' className='space-y-4'>
							<Card>
								<CardHeader>
									<CardTitle className='text-lg flex items-center gap-2'>
										<FileText className='h-5 w-5' />
										JSON Content
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='json-content'>Template JSON</Label>
										<Textarea id='json-content' value={jsonContent} onChange={(e) => handleJsonContentChange(e.target.value)} placeholder='Paste your template JSON here...' rows={10} className='font-mono text-sm' />
									</div>

									<Button type='button' variant='outline' size='sm' onClick={downloadSample}>
										<Download className='h-4 w-4 mr-2' />
										Download Sample
									</Button>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					{/* Import Options */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Import Options</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center space-x-2'>
								<Checkbox id='overwrite-id' checked={overwriteID} onCheckedChange={(checked) => setOverwriteID(!!checked)} />
								<Label htmlFor='overwrite-id'>Overwrite existing template if ID matches</Label>
							</div>
							<p className='text-sm text-muted-foreground mt-2'>If unchecked, a new template will be created with a new ID even if the imported template has an existing ID.</p>
						</CardContent>
					</Card>

					{/* Template Preview */}
					{previewTemplate && (
						<Card>
							<CardHeader>
								<CardTitle className='text-lg flex items-center gap-2'>
									<Eye className='h-5 w-5' />
									Template Preview
									<Badge variant={previewTemplate ? 'default' : 'destructive'}>{previewTemplate ? 'Valid' : 'Invalid'}</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<Label className='text-sm font-medium'>Name</Label>
										<p className='text-sm'>{previewTemplate.name}</p>
									</div>
									<div>
										<Label className='text-sm font-medium'>Version</Label>
										<p className='text-sm'>{previewTemplate.version}</p>
									</div>
									<div className='col-span-2'>
										<Label className='text-sm font-medium'>Description</Label>
										<p className='text-sm text-muted-foreground'>{previewTemplate.description}</p>
									</div>
								</div>

								<div>
									<Label className='text-sm font-medium'>Types</Label>
									<div className='flex flex-wrap gap-2 mt-1'>
										{previewTemplate.type.map((type, index) => (
											<Badge key={index} variant='secondary'>
												{type}
											</Badge>
										))}
									</div>
								</div>

								<div>
									<Label className='text-sm font-medium'>Schema</Label>
									<div className='bg-muted p-3 rounded-lg font-mono text-sm max-h-32 overflow-y-auto'>{renderJSONValue(previewTemplate.schema)}</div>
								</div>

								{previewTemplate.tags && previewTemplate.tags.length > 0 && (
									<div>
										<Label className='text-sm font-medium'>Tags</Label>
										<div className='flex flex-wrap gap-2 mt-1'>
											{previewTemplate.tags.map((tag, index) => (
												<Badge key={index} variant='default'>
													{tag}
												</Badge>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Validation Messages */}
					{previewTemplate ? (
						<div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
							<CheckCircle className='h-5 w-5 text-green-600' />
							<span className='text-sm text-green-800'>Template is valid and ready to import</span>
						</div>
					) : (
						(jsonContent || selectedFile) && (
							<div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
								<AlertCircle className='h-5 w-5 text-red-600' />
								<span className='text-sm text-red-800'>Invalid template format or missing required fields</span>
							</div>
						)
					)}
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleImport} disabled={!previewTemplate || loading}>
						{loading ? 'Importing...' : 'Import Template'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
