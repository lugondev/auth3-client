'use client'

import React, {useState, useEffect} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
import {Card} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Loader2, Search, Plus, FileText, Shield} from 'lucide-react'
import {toast} from 'sonner'
import {createPresentation} from '@/services/presentationService'
import {listCredentials} from '@/services/vcService'
import type {CreatePresentationRequest, CreatePresentationResponse, VerifiablePresentation} from '@/types/presentations'
import type {CredentialMetadata} from '@/types/credentials'
import {useAuth} from '@/hooks/useAuth'

interface CreatePresentationModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: (presentation: VerifiablePresentation) => void
	className?: string
}

/**
 * CreatePresentationModal Component - Modal for creating new presentations
 *
 * Features:
 * - Credential selection with search and filtering
 * - Presentation metadata configuration
 * - Real-time validation
 * - Challenge and domain configuration
 * - Preview of selected credentials
 */
export function CreatePresentationModal({isOpen, onClose, onSuccess, className = ''}: CreatePresentationModalProps) {
	const {user} = useAuth()
	const [isLoading, setIsLoading] = useState(false)
	const [credentials, setCredentials] = useState<CredentialMetadata[]>([])
	const [loadingCredentials, setLoadingCredentials] = useState(false)
	const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState('')

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		challenge: '',
		domain: '',
		purpose: '',
		additionalContext: [] as string[],
		expirationDays: 30,
	})

	// Load user's credentials when modal opens
	useEffect(() => {
		if (isOpen) {
			loadCredentials()
			// Generate default challenge
			setFormData((prev) => ({
				...prev,
				challenge: `presentation-${Date.now()}`,
				domain: window.location.origin,
			}))
		}
	}, [isOpen])

	const loadCredentials = async () => {
		try {
			setLoadingCredentials(true)
			const response = await listCredentials({page: 1, limit: 100})
			setCredentials(response.credentials || [])
		} catch (error) {
			console.error('Failed to load credentials:', error)
			toast.error('Failed to load credentials')
		} finally {
			setLoadingCredentials(false)
		}
	}

	// Filter credentials based on search
	const filteredCredentials = credentials.filter((credential) => {
		if (!searchQuery) return true
		const query = searchQuery.toLowerCase()
		return credential.id?.toLowerCase().includes(query) || credential.subjectDID?.toLowerCase().includes(query) || (typeof credential.issuer === 'string' ? credential.issuer.toLowerCase().includes(query) : credential.issuer?.id?.toLowerCase().includes(query)) || (Array.isArray(credential.type) && credential.type.some((type) => typeof type === 'string' && type.toLowerCase().includes(query)))
	})

	const handleCredentialSelection = (credentialId: string, selected: boolean) => {
		const newSelection = new Set(selectedCredentials)
		if (selected) {
			newSelection.add(credentialId)
		} else {
			newSelection.delete(credentialId)
		}
		setSelectedCredentials(newSelection)
	}

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedCredentials(new Set(filteredCredentials.map((c) => c.id).filter(Boolean)))
		} else {
			setSelectedCredentials(new Set())
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (selectedCredentials.size === 0) {
			toast.error('Please select at least one credential')
			return
		}

		if (!formData.name.trim()) {
			toast.error('Please provide a presentation name')
			return
		}

		setIsLoading(true)

		try {
			// Calculate expiration date
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + formData.expirationDays)

			const request: CreatePresentationRequest = {
				credentials: Array.from(selectedCredentials),
				holderDID: user?.id ? `did:key:z6Mk${user.id.substring(0, 44)}` : 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
				challenge: formData.challenge,
				domain: formData.domain,
				'@context': ['https://www.w3.org/2018/credentials/v1', ...formData.additionalContext.filter(Boolean)],
				type: ['VerifiablePresentation'],
				metadata: {
					name: formData.name,
					description: formData.description,
					purpose: formData.purpose,
					expiresAt: expiresAt.toISOString(),
				},
			}

			const response: CreatePresentationResponse = await createPresentation(request)

			toast.success('Presentation created successfully!')
			onSuccess(response.presentation)
			handleClose()
		} catch (error) {
			console.error('Failed to create presentation:', error)
			toast.error('Failed to create presentation. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleClose = () => {
		if (!isLoading) {
			setFormData({
				name: '',
				description: '',
				challenge: '',
				domain: '',
				purpose: '',
				additionalContext: [],
				expirationDays: 30,
			})
			setSelectedCredentials(new Set())
			setSearchQuery('')
			onClose()
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className={`sm:max-w-[900px] max-h-[90vh] overflow-y-auto ${className}`}>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<FileText className='h-5 w-5' />
						Create Verifiable Presentation
					</DialogTitle>
					<DialogDescription>Create a new verifiable presentation by selecting credentials and configuring metadata.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Basic Information */}
					<div className='space-y-4'>
						<h3 className='text-lg font-medium'>Basic Information</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label htmlFor='name'>Presentation Name *</Label>
								<Input id='name' value={formData.name} onChange={(e) => setFormData((prev) => ({...prev, name: e.target.value}))} placeholder='e.g., Employment Verification' required />
							</div>
							<div>
								<Label htmlFor='purpose'>Purpose</Label>
								<Input id='purpose' value={formData.purpose} onChange={(e) => setFormData((prev) => ({...prev, purpose: e.target.value}))} placeholder='e.g., Job application verification' />
							</div>
						</div>
						<div>
							<Label htmlFor='description'>Description</Label>
							<Textarea id='description' value={formData.description} onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))} placeholder='Optional description of this presentation...' rows={3} />
						</div>
					</div>

					{/* Technical Configuration */}
					<div className='space-y-4'>
						<h3 className='text-lg font-medium'>Technical Configuration</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label htmlFor='challenge'>Challenge</Label>
								<Input id='challenge' value={formData.challenge} onChange={(e) => setFormData((prev) => ({...prev, challenge: e.target.value}))} placeholder='Auto-generated challenge' />
							</div>
							<div>
								<Label htmlFor='domain'>Domain</Label>
								<Input id='domain' value={formData.domain} onChange={(e) => setFormData((prev) => ({...prev, domain: e.target.value}))} placeholder='Domain for verification' />
							</div>
						</div>
						<div>
							<Label htmlFor='expirationDays'>Expiration (Days)</Label>
							<Input
								id='expirationDays'
								type='number'
								min='1'
								max='365'
								value={formData.expirationDays}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										expirationDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 30)),
									}))
								}
							/>
						</div>
					</div>

					{/* Credential Selection */}
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<h3 className='text-lg font-medium'>Select Credentials</h3>
							<Badge variant='secondary'>{selectedCredentials.size} selected</Badge>
						</div>

						{/* Search */}
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input placeholder='Search credentials...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
						</div>

						{/* Select All */}
						{filteredCredentials.length > 0 && (
							<div className='flex items-center space-x-2'>
								<Checkbox id='select-all' checked={filteredCredentials.every((c) => selectedCredentials.has(c.id))} onCheckedChange={handleSelectAll} />
								<Label htmlFor='select-all' className='text-sm'>
									Select all {filteredCredentials.length} credentials
								</Label>
							</div>
						)}

						{/* Credentials List */}
						<div className='max-h-60 overflow-y-auto space-y-2'>
							{loadingCredentials ? (
								<div className='flex items-center justify-center p-8'>
									<Loader2 className='h-6 w-6 animate-spin' />
									<span className='ml-2'>Loading credentials...</span>
								</div>
							) : filteredCredentials.length === 0 ? (
								<div className='text-center p-8 text-muted-foreground'>{credentials.length === 0 ? 'No credentials available. Create some credentials first.' : 'No credentials match your search.'}</div>
							) : (
								filteredCredentials.map((credential) => (
									<Card key={credential.id} className='p-3'>
										<div className='flex items-start space-x-3'>
											<Checkbox id={credential.id} checked={selectedCredentials.has(credential.id)} onCheckedChange={(checked) => handleCredentialSelection(credential.id, checked as boolean)} className='mt-1' />
											<div className='flex-1 min-w-0'>
												<div className='flex items-center gap-2 mb-1'>
													<Shield className='h-4 w-4 text-green-600' />
													<span className='font-medium truncate'>{credential.subjectDID || credential.id?.substring(0, 8) || 'Unknown Credential'}</span>
												</div>
												<p className='text-sm text-muted-foreground truncate'>Issuer: {typeof credential.issuer === 'string' ? credential.issuer.substring(0, 20) : credential.issuer?.id?.substring(0, 20) || 'Unknown'}...</p>
												<div className='flex gap-1 mt-1'>
													{Array.isArray(credential.type) &&
														credential.type
															.filter((t) => t !== 'VerifiableCredential')
															.slice(0, 2)
															.map((type) => (
																<Badge key={type} variant='outline' className='text-xs'>
																	{type}
																</Badge>
															))}
												</div>
											</div>
										</div>
									</Card>
								))
							)}
						</div>
					</div>

					<DialogFooter>
						<Button type='button' variant='outline' onClick={handleClose} disabled={isLoading}>
							Cancel
						</Button>
						<Button type='submit' disabled={isLoading || selectedCredentials.size === 0}>
							{isLoading ? (
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
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
