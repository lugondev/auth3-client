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
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsCreating(true)

		try {
			// Validate required fields
			if (!formData.name.trim()) {
				toast.error('Presentation name is required')
				return
			}

			// Parse presentation definition if provided
			let parsedDefinition = null
			if (formData.presentationDefinition.trim()) {
				try {
					parsedDefinition = JSON.parse(formData.presentationDefinition)
				} catch {
					toast.error('Invalid JSON in presentation definition')
					return
				}
			}

			// Create the presentation request
			const request: CreatePresentationRequest = {
				holderDID: getUserDID(currentUser?.id),
				challenge: `challenge-${Date.now()}`,
				domain: window.location.origin,
				credentials: formData.credentials,
				type: ['VerifiablePresentation'],
				'@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
				metadata: {
					name: formData.name,
					description: formData.description,
					purpose: formData.presentationType || 'general',
					presentationDefinition: parsedDefinition || generateDefaultDefinition(),
				},
			}

			// Call the API to create the presentation
			const response = await createPresentation(request)

			toast.success('Presentation created successfully!')
			console.log('Created presentation:', response)

			// Redirect to the presentations list
			router.push('/dashboard/presentations')
		} catch (error) {
			console.error('Failed to create presentation:', error)
			toast.error('Failed to create presentation. Please try again.')
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
							<Link href='/dashboard/presentations'>
								<Button type='button' variant='outline' disabled={isCreating}>
									Cancel
								</Button>
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
