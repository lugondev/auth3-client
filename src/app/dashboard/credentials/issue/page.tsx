'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {ArrowLeft, Plus, Eye, FileText, User, Calendar, Shield} from 'lucide-react'
import Link from 'next/link'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'

import {issueCredential, listTemplates} from '@/services/vcService'
import type {IssueCredentialInput, CredentialSubject} from '@/types/credentials'
import {CredentialViewer} from '@/components/credentials/CredentialViewer'

/**
 * Issue Credential Page - Form for issuing new verifiable credentials
 *
 * Features:
 * - Template selection or custom credential creation
 * - Subject information input
 * - Claims configuration
 * - Credential preview
 * - Issuance with validation
 */
export default function IssueCredentialPage() {
	const router = useRouter()
	const queryClient = useQueryClient()

	const [selectedTemplate, setSelectedTemplate] = useState<string>('')
	const [credentialType, setCredentialType] = useState<string[]>(['VerifiableCredential'])
	const [subjectId, setSubjectId] = useState('')
	const [subjectData, setSubjectData] = useState<Record<string, string | number | boolean>>({})
	const [expirationDate, setExpirationDate] = useState('')
	const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
	const [customType, setCustomType] = useState('')

	// Fetch available templates
	const {data: templatesData} = useQuery({
		queryKey: ['credential-templates'],
		queryFn: () => listTemplates({isActive: true}),
	})

	// Issue credential mutation
	const issueMutation = useMutation({
		mutationFn: issueCredential,
		onSuccess: (data) => {
			toast.success('Credential issued successfully!')
			queryClient.invalidateQueries({queryKey: ['credentials']})
			router.push(`/dashboard/credentials/${data.credentialId}`)
		},
		onError: (error) => {
			console.log('Error issuing credential: ', error)
			toast.error(error.message || 'Failed to issue credential')
		},
	})

	// Handle template selection
	const handleTemplateSelect = (templateId: string) => {
		setSelectedTemplate(templateId)
		const template = templatesData?.templates.find((t) => t.id === templateId)
		if (template) {
			setCredentialType(template.type)
			// Initialize subject data based on template schema
			const initialData: Record<string, string | number | boolean> = {}
			if (template.subjectSchema && typeof template.subjectSchema === 'object') {
				Object.keys(template.subjectSchema).forEach((key) => {
					initialData[key] = ''
				})
			}
			setSubjectData(initialData)
		}
	}

	// Handle custom type addition
	const handleAddCustomType = () => {
		if (customType && !credentialType.includes(customType)) {
			setCredentialType([...credentialType, customType])
			setCustomType('')
		}
	}

	// Handle subject data change
	const handleSubjectDataChange = (key: string, value: string | number | boolean) => {
		setSubjectData((prev) => ({...prev, [key]: value}))
	}

	// Build credential subject
	const buildCredentialSubject = (): CredentialSubject => {
		const subject: CredentialSubject = {
			...(subjectId && {id: subjectId}),
			...subjectData,
		}
		return subject
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (credentialType.length === 0) {
			toast.error('Please select at least one credential type')
			return
		}

		const credentialSubject = buildCredentialSubject()
		if (Object.keys(credentialSubject).length === 0) {
			toast.error('Please provide subject information')
			return
		}

		const input: IssueCredentialInput = {
			credential: {
				'@context': ['https://www.w3.org/2018/credentials/v1'],
				id: `urn:uuid:${crypto.randomUUID()}`,
				type: credentialType,
				issuer: 'did:example:issuer',
				issuanceDate: new Date().toISOString(),
				credentialSubject,
				...(expirationDate && {expirationDate}),
			},
		}

		issueMutation.mutate(input)
	}

	// Preview credential data
	const previewCredential = {
		'@context': ['https://www.w3.org/2018/credentials/v1'],
		id: 'urn:uuid:preview-credential',
		type: credentialType,
		issuer: 'did:example:issuer',
		issuanceDate: new Date().toISOString(),
		credentialSubject: buildCredentialSubject(),
		...(expirationDate && {expirationDate}),
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button variant='ghost' size='sm' asChild>
					<Link href='/dashboard/credentials'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Credentials
					</Link>
				</Button>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Issue Credential</h1>
					<p className='text-muted-foreground'>Create and issue a new verifiable credential</p>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Main Form */}
				<div className='lg:col-span-2'>
					<Card>
						<CardHeader>
							<CardTitle>Credential Information</CardTitle>
							<CardDescription>Configure the credential details and subject information</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'form' | 'preview')}>
								<TabsList className='grid w-full grid-cols-2'>
									<TabsTrigger value='form'>Form</TabsTrigger>
									<TabsTrigger value='preview'>Preview</TabsTrigger>
								</TabsList>

								<TabsContent value='form' className='space-y-6 mt-6'>
									<form onSubmit={handleSubmit} className='space-y-6'>
										{/* Template Selection */}
										<div className='space-y-2'>
											<Label htmlFor='template'>Credential Template (Optional)</Label>
											<Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
												<SelectTrigger>
													<SelectValue placeholder='Select a template or create custom' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value=''>Custom Credential</SelectItem>
													{templatesData?.templates.map((template) => (
														<SelectItem key={template.id} value={template.id}>
															{template.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{selectedTemplate && <p className='text-sm text-muted-foreground'>{templatesData?.templates.find((t) => t.id === selectedTemplate)?.description}</p>}
										</div>

										{/* Credential Types */}
										<div className='space-y-2'>
											<Label>Credential Types</Label>
											<div className='flex flex-wrap gap-2 mb-2'>
												{credentialType.map((type, index) => (
													<Badge key={index} variant='secondary' className='flex items-center gap-1'>
														{type}
														{index > 0 && (
															<button type='button' onClick={() => setCredentialType(credentialType.filter((_, i) => i !== index))} className='ml-1 text-xs hover:text-destructive'>
																×
															</button>
														)}
													</Badge>
												))}
											</div>
											<div className='flex gap-2'>
												<Input placeholder='Add custom type' value={customType} onChange={(e) => setCustomType(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())} />
												<Button type='button' variant='outline' onClick={handleAddCustomType}>
													<Plus className='h-4 w-4' />
												</Button>
											</div>
										</div>

										<Separator />

										{/* Subject Information */}
										<div className='space-y-4'>
											<div className='flex items-center gap-2'>
												<User className='h-5 w-5' />
												<Label className='text-base font-semibold'>Subject Information</Label>
											</div>

											<div className='space-y-2'>
												<Label htmlFor='subjectId'>Subject ID (Optional)</Label>
												<Input id='subjectId' placeholder='did:example:123 or https://example.com/users/123' value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
											</div>

											{/* Dynamic subject fields based on template or custom */}
											{selectedTemplate ? (
												// Template-based fields
												<div className='space-y-4'>
													{templatesData?.templates.find((t) => t.id === selectedTemplate)?.subjectSchema &&
														Object.entries(templatesData.templates.find((t) => t.id === selectedTemplate)!.subjectSchema as unknown as Record<string, unknown>).map(([key]) => (
															<div key={key} className='space-y-2'>
																<Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</Label>
																<Input id={key} value={String(subjectData[key] || '')} onChange={(e) => handleSubjectDataChange(key, e.target.value)} placeholder={`Enter ${key}`} />
															</div>
														))}
												</div>
											) : (
												// Custom fields
												<div className='space-y-4'>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														<div className='space-y-2'>
															<Label htmlFor='name'>Name</Label>
															<Input id='name' value={String(subjectData.name || '')} onChange={(e) => handleSubjectDataChange('name', e.target.value)} placeholder='Full name' />
														</div>
														<div className='space-y-2'>
															<Label htmlFor='email'>Email</Label>
															<Input id='email' type='email' value={String(subjectData.email || '')} onChange={(e) => handleSubjectDataChange('email', e.target.value)} placeholder='email@example.com' />
														</div>
													</div>

													<div className='space-y-2'>
														<Label htmlFor='description'>Description</Label>
														<Textarea id='description' value={String(subjectData.description || '')} onChange={(e) => handleSubjectDataChange('description', e.target.value)} placeholder='Additional information about the credential subject' rows={3} />
													</div>
												</div>
											)}
										</div>

										<Separator />

										{/* Expiration */}
										<div className='space-y-2'>
											<div className='flex items-center gap-2'>
												<Calendar className='h-5 w-5' />
												<Label htmlFor='expiration'>Expiration Date (Optional)</Label>
											</div>
											<Input id='expiration' type='datetime-local' value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
											<p className='text-sm text-muted-foreground'>Leave empty for credentials that don't expire</p>
										</div>

										{/* Submit Button */}
										<div className='flex gap-2 pt-4'>
											<Button type='submit' disabled={issueMutation.isPending} className='flex-1'>
												{issueMutation.isPending ? (
													<div>
														<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
														Issuing...
													</div>
												) : (
													<div>
														<Shield className='h-4 w-4 mr-2' />
														Issue Credential
													</div>
												)}
											</Button>
											<Button type='button' variant='outline' onClick={() => setActiveTab('preview')}>
												<Eye className='h-4 w-4 mr-2' />
												Preview
											</Button>
										</div>
									</form>
								</TabsContent>

								<TabsContent value='preview' className='mt-6'>
									<div className='space-y-4'>
										<div className='flex items-center gap-2 mb-4'>
											<FileText className='h-5 w-5' />
											<h3 className='text-lg font-semibold'>Credential Preview</h3>
										</div>

										<Alert>
											<AlertDescription>This is a preview of how your credential will look. The actual credential will include additional metadata and cryptographic proofs.</AlertDescription>
										</Alert>

										<CredentialViewer credential={previewCredential} />
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className='space-y-6'>
					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Quick Actions</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							<Button variant='outline' size='sm' className='w-full justify-start' asChild>
								<Link href='/dashboard/credentials'>
									<Eye className='h-4 w-4 mr-2' />
									View All Credentials
								</Link>
							</Button>
							<Button variant='outline' size='sm' className='w-full justify-start' asChild>
								<Link href='/dashboard/credentials/verify'>
									<Shield className='h-4 w-4 mr-2' />
									Verify Credential
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Templates */}
					{templatesData && templatesData.templates.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Available Templates</CardTitle>
								<CardDescription>Pre-configured credential templates</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{templatesData.templates.slice(0, 5).map((template) => (
										<div key={template.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => handleTemplateSelect(template.id)}>
											<div className='font-medium text-sm'>{template.name}</div>
											<div className='text-xs text-muted-foreground mt-1'>{template.description}</div>
											<div className='flex flex-wrap gap-1 mt-2'>
												{template.type.slice(1).map((type, index) => (
													<Badge key={index} variant='outline' className='text-xs'>
														{type}
													</Badge>
												))}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}
