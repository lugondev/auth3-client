import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {createPresentation} from '@/services/presentationService'
import {listCredentials} from '@/services/vcService'
import {useUserDIDs} from '@/hooks/useUserDIDs'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Checkbox} from '@/components/ui/checkbox'
import {Badge} from '@/components/ui/badge'
import {Loader2, Search, Plus, Shield} from 'lucide-react'
import type {CreatePresentationRequest, CreatePresentationResponse, VerifiablePresentation} from '@/types/presentations'
import type {CredentialMetadata} from '@/types/credentials'
import {validateRequired, validateMinArrayLength, validateJSON, sanitizeAndValidateUUIDArray} from '@/utils/validation'

interface PresentationFormProps {
	onSuccess?: (presentation: VerifiablePresentation) => void
	onCancel?: () => void
	initialValues?: Partial<CreatePresentationRequest>
	showCard?: boolean
}

export function PresentationForm({onSuccess, onCancel, initialValues = {}, showCard = true}: PresentationFormProps) {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [credentials, setCredentials] = useState<CredentialMetadata[]>([])
	const [loadingCredentials, setLoadingCredentials] = useState(false)
	const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set(initialValues.credentials || []))
	const [searchQuery, setSearchQuery] = useState('')
	const [formData, setFormData] = useState({
		name: initialValues.metadata?.name || '',
		description: initialValues.metadata?.description || '',
		challenge: initialValues.challenge || '',
		domain: initialValues.domain || '',
		purpose: initialValues.metadata?.purpose || '',
		additionalContext: Array.isArray(initialValues['@context']) ? initialValues['@context'].slice(1) : [],
		expirationDays: 30,
		holderDID: initialValues.holderDID || '',
		presentationType: initialValues.metadata?.purpose || '',
		customMetadata: '',
		presentationDefinition: '',
	})
	const {dids, loading: loadingDIDs, error: didsError} = useUserDIDs()

	useEffect(() => {
		setLoadingCredentials(true)
		listCredentials({page: 1, limit: 100})
			.then((response) => setCredentials(response.credentials || []))
			.catch(() => toast.error('Failed to load credentials'))
			.finally(() => setLoadingCredentials(false))
	}, [])

	// Filter credentials based on search
	const filteredCredentials = credentials.filter((credential) => {
		if (!searchQuery) return true
		const query = searchQuery.toLowerCase()
		return credential.id?.toLowerCase().includes(query) || credential.subject?.toLowerCase().includes(query) || (typeof credential.issuer === 'string' ? credential.issuer.toLowerCase().includes(query) : credential.issuer?.id?.toLowerCase().includes(query)) || (Array.isArray(credential.type) && credential.type.some((type) => typeof type === 'string' && type.toLowerCase().includes(query)))
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
				holderDID: formData.holderDID,
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
			if (onSuccess) onSuccess(response.presentation)
			else router.push('/dashboard/presentations')
		} catch (error) {
			toast.error('Failed to create presentation. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const formContent = (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{/* Holder DID */}
			<div className='space-y-2'>
				<Label htmlFor='holderDID'>Holder DID</Label>
				<Select value={formData.holderDID} onValueChange={(value) => setFormData({...formData, holderDID: value})} disabled={loadingDIDs}>
					<SelectTrigger>
						<SelectValue placeholder={loadingDIDs ? 'Loading DIDs...' : dids.length === 0 ? 'No DIDs found' : 'Select holder DID'} />
					</SelectTrigger>
					<SelectContent>
						{dids.length === 0 && !loadingDIDs ? (
							<div className='px-3 py-2 text-muted-foreground text-sm'>No DIDs available</div>
						) : (
							dids.map((did) => {
								const value = String(did?.did || did?.id || '')
								return value ? (
									<SelectItem key={value} value={value}>
										{value}
									</SelectItem>
								) : null
							})
						)}
					</SelectContent>
				</Select>
				{didsError && <p className='text-sm text-destructive'>{didsError}</p>}
			</div>
			{/* Presentation Name */}
			<div className='space-y-2'>
				<Label htmlFor='name'>Presentation Name</Label>
				<Input id='name' value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder='Enter presentation name' required />
			</div>
			{/* Purpose */}
			<div className='space-y-2'>
				<Label htmlFor='purpose'>Purpose</Label>
				<Input id='purpose' value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} placeholder='e.g., Job application verification' />
			</div>
			{/* Description */}
			<div className='space-y-2'>
				<Label htmlFor='description'>Description</Label>
				<Textarea id='description' value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder='Optional description of this presentation...' rows={3} />
			</div>
			{/* Challenge & Domain */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div>
					<Label htmlFor='challenge'>Challenge</Label>
					<Input id='challenge' value={formData.challenge} onChange={(e) => setFormData({...formData, challenge: e.target.value})} placeholder='Auto-generated challenge' />
				</div>
				<div>
					<Label htmlFor='domain'>Domain</Label>
					<Input id='domain' value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} placeholder='Domain for verification' />
				</div>
			</div>
			{/* Expiration */}
			<div>
				<Label htmlFor='expirationDays'>Expiration (Days)</Label>
				<Input id='expirationDays' type='number' min='1' max='365' value={formData.expirationDays} onChange={(e) => setFormData((prev) => ({...prev, expirationDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 30))}))} />
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
							<div key={credential.id} className='p-3 border rounded-md'>
								<div className='flex items-start space-x-3'>
									<Checkbox id={credential.id} checked={selectedCredentials.has(credential.id)} onCheckedChange={(checked) => handleCredentialSelection(credential.id, checked as boolean)} className='mt-1' />
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 mb-1'>
											<Shield className='h-4 w-4 text-green-600' />
											<span className='font-medium truncate'>{credential.subject || credential.id?.substring(0, 8) || 'Unknown Credential'}</span>
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
							</div>
						))
					)}
				</div>
			</div>
			<div className='flex gap-2'>
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
				{onCancel && (
					<Button type='button' variant='outline' onClick={onCancel} disabled={isLoading}>
						Cancel
					</Button>
				)}
			</div>
		</form>
	)

	if (showCard) {
		return (
			<Card className='max-w-2xl'>
				<CardHeader>
					<CardTitle>New Presentation</CardTitle>
					<CardDescription>Create a verifiable presentation by selecting credentials and defining the presentation requirements</CardDescription>
				</CardHeader>
				<CardContent>{formContent}</CardContent>
			</Card>
		)
	}
	return formContent
}
