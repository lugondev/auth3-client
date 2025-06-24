'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {ArrowLeft, Plus, Loader2} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {createPresentation} from '@/services/presentationService'
import type {CreatePresentationRequest} from '@/types/presentations'
import {useAuth} from '@/hooks/useAuth'
import {validateRequired, validateMinArrayLength, validateJSON, sanitizeAndValidateUUIDArray} from '@/utils/validation'

/**
 * Get the DID for the current user
 * This will eventually integrate with the real DID management system
 */
function getUserDID(userId?: string): string {
	// For now, generate a did:key based on user ID or use a default
	// In production, this would fetch the user's actual DID from their profile
	if (userId) {
		return `did:key:z6Mk${userId
			.replace(/[^a-zA-Z0-9]/g, '')
			.substring(0, 44)
			.padEnd(44, '0')}`
	}
	return 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH' // Default DID for demo
}

export default function CreatePresentationPage() {
	const router = useRouter()
	const {user: currentUser} = useAuth()
	const [isCreating, setIsCreating] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		presentationType: '',
		credentials: [] as string[],
		presentationDefinition: '',
		challenge: '',
		domain: '',
		context: ['https://www.w3.org/2018/credentials/v1'],
		type: ['VerifiablePresentation'],
		customMetadata: '',
	})
	const [showPreview, setShowPreview] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsCreating(true)

		try {
			// Validate required fields
			const nameValidation = validateRequired(formData.name.trim(), 'Presentation name')
			if (!nameValidation.isValid) {
				toast.error(nameValidation.error)
				return
			}

			// Validate and sanitize credentials array
			const credentialsInput = formData.credentials.join('\n')
			const {uuids: validatedCredentials, validation: credentialsValidation} = sanitizeAndValidateUUIDArray(credentialsInput)

			if (!credentialsValidation.isValid) {
				toast.error(credentialsValidation.error)
				return
			}

			// Validate context and type arrays
			const contextValidation = validateMinArrayLength(
				formData.context.filter((ctx) => ctx.trim()),
				1,
				'Context',
			)
			if (!contextValidation.isValid) {
				toast.error(contextValidation.error)
				return
			}

			const typeValidation = validateMinArrayLength(
				formData.type.filter((t) => t.trim()),
				1,
				'Type',
			)
			if (!typeValidation.isValid) {
				toast.error(typeValidation.error)
				return
			}

			// Parse presentation definition if provided
			let parsedDefinition = null
			if (formData.presentationDefinition.trim()) {
				const definitionResult = validateJSON(formData.presentationDefinition)
				if (!definitionResult.isValid) {
					toast.error(`Invalid JSON in presentation definition: ${definitionResult.error}`)
					return
				}
				parsedDefinition = definitionResult.data
			}

			// Parse custom metadata if provided
			const metadataResult = validateJSON(formData.customMetadata)
			if (!metadataResult.isValid) {
				toast.error(`Invalid JSON in custom metadata: ${metadataResult.error}`)
				return
			}
			const customMetadata = metadataResult.data || {}

			// Create the presentation request
			const request: CreatePresentationRequest = {
				'@context': formData.context.filter((ctx) => ctx.trim()),
				challenge: formData.challenge || `challenge-${Date.now()}`,
				credentials: validatedCredentials, // Use validated UUIDs
				domain: formData.domain || window.location.origin,
				holderDID: getUserDID(currentUser?.id),
				metadata: {
					name: formData.name,
					description: formData.description,
					purpose: formData.presentationType || 'general',
					presentationDefinition: parsedDefinition || generateDefaultDefinition(),
					...customMetadata,
				},
				type: formData.type.filter((t) => t.trim()),
			}

			// Call the API to create the presentation
			const response = await createPresentation(request)

			toast.success('Presentation created successfully!')
			console.log('Created presentation:', response)

			// Redirect to the presentations list
			router.push('/dashboard/presentations')
		} catch (error) {
			console.error('Failed to create presentation:', error)

			// Enhanced error handling for backend validation errors
			if (error && typeof error === 'object' && 'response' in error) {
				const axiosError = error as {response?: {data?: {message?: string; errors?: string[]}}}
				const errorMessage = axiosError.response?.data?.message || (axiosError.response?.data?.errors ? axiosError.response.data.errors.join(', ') : 'Failed to create presentation. Please try again.')
				toast.error(errorMessage)
			} else {
				toast.error('Failed to create presentation. Please try again.')
			}
		} finally {
			setIsCreating(false)
		}
	}

	// Generate a default presentation definition based on the selected type
	const generateDefaultDefinition = () => {
		const baseDefinition = {
			id: `presentation-def-${Date.now()}`,
			name: formData.name,
			purpose: formData.presentationType || 'general',
			input_descriptors: [
				{
					id: 'any-credential',
					name: 'Any Verifiable Credential',
					purpose: 'Any valid verifiable credential',
					constraints: {
						fields: [
							{
								path: ['$.type'],
								filter: {
									type: 'array',
									contains: {
										const: 'VerifiableCredential',
									},
								},
							},
						],
					},
				},
			],
		}

		// Customize based on presentation type
		switch (formData.presentationType) {
			case 'identity':
				baseDefinition.input_descriptors = [
					{
						id: 'identity-credential',
						name: 'Identity Credential',
						purpose: 'Identity verification credential',
						constraints: {
							fields: [
								{
									path: ['$.type'],
									filter: {
										type: 'array',
										contains: {
											const: 'IdentityCredential',
										},
									},
								},
							],
						},
					},
				]
				break
			case 'academic':
				baseDefinition.input_descriptors = [
					{
						id: 'academic-credential',
						name: 'Academic Credential',
						purpose: 'Academic or educational credential',
						constraints: {
							fields: [
								{
									path: ['$.type'],
									filter: {
										type: 'array',
										contains: {
											const: 'AcademicCredential',
										},
									},
								},
							],
						},
					},
				]
				break
			case 'professional':
				baseDefinition.input_descriptors = [
					{
						id: 'professional-credential',
						name: 'Professional Credential',
						purpose: 'Professional or work-related credential',
						constraints: {
							fields: [
								{
									path: ['$.type'],
									filter: {
										type: 'array',
										contains: {
											const: 'ProfessionalCredential',
										},
									},
								},
							],
						},
					},
				]
				break
		}

		return baseDefinition
	}

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex items-center gap-4'>
				<Link href='/dashboard/presentations'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to Presentations
					</Button>
				</Link>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Create Presentation</h1>
					<p className='text-muted-foreground'>Create a new verifiable presentation from your credentials</p>
				</div>
			</div>

			<Card className='max-w-2xl'>
				<CardHeader>
					<CardTitle>New Presentation</CardTitle>
					<CardDescription>Create a verifiable presentation by selecting credentials and defining the presentation requirements</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-6'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Presentation Name</Label>
							<Input id='name' value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder='Enter presentation name' required />
						</div>

						<div className='space-y-2'>
							<Label htmlFor='description'>Description</Label>
							<Textarea id='description' value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder='Describe the purpose of this presentation' rows={3} />
						</div>

						<div className='space-y-2'>
							<Label htmlFor='presentationType'>Presentation Type</Label>
							<Select value={formData.presentationType} onValueChange={(value) => setFormData({...formData, presentationType: value})}>
								<SelectTrigger>
									<SelectValue placeholder='Select presentation type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='identity'>Identity Verification</SelectItem>
									<SelectItem value='academic'>Academic Credentials</SelectItem>
									<SelectItem value='professional'>Professional Credentials</SelectItem>
									<SelectItem value='custom'>Custom Presentation</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='credentials'>Credentials (UUIDs)</Label>
							<Textarea id='credentials' value={formData.credentials.join('\n')} onChange={(e) => setFormData({...formData, credentials: e.target.value.split('\n').filter((id) => id.trim())})} placeholder='Enter credential UUIDs, one per line' rows={3} />
							<p className='text-sm text-muted-foreground'>Enter credential UUIDs that will be included in this presentation</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='challenge'>Challenge</Label>
							<Input id='challenge' value={formData.challenge} onChange={(e) => setFormData({...formData, challenge: e.target.value})} placeholder='Leave empty for auto-generation' />
							<p className='text-sm text-muted-foreground'>Optional: Custom challenge string</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='domain'>Domain</Label>
							<Input id='domain' value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} placeholder='Leave empty to use current domain' />
							<p className='text-sm text-muted-foreground'>Optional: Custom domain for the presentation</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='context'>Context (@context)</Label>
							<Textarea id='context' value={formData.context.join('\n')} onChange={(e) => setFormData({...formData, context: e.target.value.split('\n').filter((ctx) => ctx.trim())})} placeholder='Enter context URLs, one per line' rows={2} className='font-mono text-sm' />
							<p className='text-sm text-muted-foreground'>Context URLs for the presentation</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='type'>Type</Label>
							<Textarea id='type' value={formData.type.join('\n')} onChange={(e) => setFormData({...formData, type: e.target.value.split('\n').filter((t) => t.trim())})} placeholder='Enter presentation types, one per line' rows={2} className='font-mono text-sm' />
							<p className='text-sm text-muted-foreground'>Type identifiers for the presentation</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='customMetadata'>Custom Metadata (JSON)</Label>
							<Textarea id='customMetadata' value={formData.customMetadata} onChange={(e) => setFormData({...formData, customMetadata: e.target.value})} placeholder='Enter additional metadata as JSON object' rows={4} className='font-mono text-sm' />
							<p className='text-sm text-muted-foreground'>Optional: Additional metadata properties in JSON format</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='presentationDefinition'>Presentation Definition (JSON)</Label>
							<Textarea id='presentationDefinition' value={formData.presentationDefinition} onChange={(e) => setFormData({...formData, presentationDefinition: e.target.value})} placeholder='Enter presentation definition JSON or leave empty for auto-generation' rows={6} className='font-mono text-sm' />
							<p className='text-sm text-muted-foreground'>Optional: Provide a specific presentation definition. If left empty, one will be generated based on your selections.</p>
						</div>

						<div className='flex gap-2'>
							<Button type='submit' disabled={isCreating}>
								{isCreating ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Creating...
									</>
								) : (
									<>
										<Plus className='mr-2 h-4 w-4' />
										Create Presentation
									</>
								)}
							</Button>
							<Button type='button' variant='outline' onClick={() => setShowPreview(!showPreview)} disabled={isCreating}>
								{showPreview ? 'Hide Preview' : 'Show Preview'}
							</Button>
							<Link href='/dashboard/presentations'>
								<Button type='button' variant='outline' disabled={isCreating}>
									Cancel
								</Button>
							</Link>
						</div>
					</form>

					{showPreview && (
						<div className='mt-6 pt-6 border-t'>
							<h3 className='text-lg font-semibold mb-4'>Request Preview</h3>
							<div className='bg-muted p-4 rounded-lg'>
								<pre className='text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96'>
									{JSON.stringify(
										{
											'@context': formData.context.filter((ctx) => ctx.trim()),
											challenge: formData.challenge || `challenge-${Date.now()}`,
											credentials: formData.credentials.filter((cred) => cred.trim()),
											domain: formData.domain || window.location.origin,
											holderDID: getUserDID(currentUser?.id),
											metadata: {
												name: formData.name,
												description: formData.description,
												purpose: formData.presentationType || 'general',
												...(formData.customMetadata.trim() && validateJSON(formData.customMetadata).isValid ? validateJSON(formData.customMetadata).data : {}),
											},
											type: formData.type.filter((t) => t.trim()),
										},
										null,
										2,
									)}
								</pre>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
