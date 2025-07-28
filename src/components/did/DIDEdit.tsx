'use client'

import React, {useState, useEffect} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Loader2, Save, X, Info} from 'lucide-react'
import {toast} from 'sonner'
import {updateDID, getDID} from '@/services/didService'
import type {UpdateDIDInput, DIDResponse} from '@/types/did'

interface DIDEditProps {
	didId: string // DID string (e.g., "did:VBSN:...")
	onSave?: (did: DIDResponse) => void
	onCancel?: () => void
	className?: string
}

interface DIDEditForm {
	id: string // UUID of the DID record in database
	name?: string
	metadata?: Record<string, unknown>
}

/**
 * DIDEdit component for editing DID informateion
 * Allows updating name and metadata fields
 */
export function DIDEdit({didId, onSave, onCancel, className}: DIDEditProps) {
	const [form, setForm] = useState<DIDEditForm>({
		id: '',
		name: '',
		metadata: {},
	})
	const [loading, setLoading] = useState(false)
	const [initialLoading, setInitialLoading] = useState(true)
	const [metadataJson, setMetadataJson] = useState('')

	/**
	 * Load existing DID data
	 */
	useEffect(() => {
		const loadDIDData = async () => {
			try {
				setInitialLoading(true)
				const response = await getDID(didId)
				
				setForm({
					id: response.id, // UUID of the DID record
					name: response.name || '',
					metadata: response.metadata || {},
				})
				
				// Format metadata as JSON string for editing
				setMetadataJson(JSON.stringify(response.metadata || {}, null, 2))
			} catch (error) {
				console.error('Error loading DID data:', error)
				toast.error('Failed to load DID data')
			} finally {
				setInitialLoading(false)
			}
		}

		if (didId) {
			loadDIDData()
		}
	}, [didId])

	/**
	 * Handle metadata JSON changes
	 */
	const handleMetadataChange = (value: string) => {
		setMetadataJson(value)
		
		try {
			const parsed = JSON.parse(value)
			setForm(prev => ({...prev, metadata: parsed}))
		} catch {
			// Invalid JSON, keep form metadata as is
		}
	}

	/**
	 * Validate metadata JSON
	 */
	const isValidMetadataJson = () => {
		try {
			JSON.parse(metadataJson)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Handle form submission
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!isValidMetadataJson()) {
			toast.error('Invalid JSON format in metadata')
			return
		}

		setLoading(true)

		try {
			const updateInput: UpdateDIDInput = {
				id: form.id, // Use UUID from form (DID record ID)
				did: didId, // DID string for URL path
				name: form.name || undefined,
				metadata: form.metadata,
			}

			const response = await updateDID(updateInput)
			
			toast.success('DID updated successfully!')
			onSave?.(response)
		} catch (error) {
			console.error('Error updating DID:', error)
			toast.error('Failed to update DID')
		} finally {
			setLoading(false)
		}
	}

	if (initialLoading) {
		return (
			<div className={`flex items-center justify-center py-8 ${className}`}>
				<div className='flex items-center gap-2 text-muted-foreground'>
					<Loader2 className='h-4 w-4 animate-spin' />
					<span>Loading DID data...</span>
				</div>
			</div>
		)
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Breadcrumb */}
			<div className='flex items-center gap-2 text-sm text-muted-foreground mb-4'>
				<span>DIDs</span>
				<span>/</span>
				<span className='text-foreground font-medium'>
					{form.name || form.id.substring(0, 8) + '...'}
				</span>
				<span>/</span>
				<span className='text-foreground'>Edit</span>
			</div>

			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-2xl font-bold'>Edit DID</h2>
					<p className='text-muted-foreground'>Update your DID information</p>
				</div>
				
				<div className='flex items-center gap-2'>
					<Button variant='outline' onClick={onCancel} disabled={loading}>
						<X className='h-4 w-4 mr-2' />
						Cancel
					</Button>
				</div>
			</div>

			<form onSubmit={handleSubmit} className='space-y-6'>
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>Update basic DID information</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label htmlFor='name'>Name (Optional)</Label>
							<Input
								id='name'
								value={form.name}
								onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
								placeholder='Enter a friendly name for your DID'
								className='text-sm'
							/>
							<div className='text-sm text-muted-foreground mt-1'>
								A human-readable name to help identify this DID
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Metadata */}
				<Card>
					<CardHeader>
						<CardTitle>Metadata</CardTitle>
						<CardDescription>Additional metadata associated with this DID</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label htmlFor='metadata'>Metadata (JSON)</Label>
							<Textarea
								id='metadata'
								value={metadataJson}
								onChange={(e) => handleMetadataChange(e.target.value)}
								placeholder='{"key": "value"}'
								className='font-mono text-sm min-h-32'
								rows={8}
							/>
							<div className='text-sm text-muted-foreground mt-1'>
								Additional metadata in JSON format. Must be valid JSON.
							</div>
							{!isValidMetadataJson() && metadataJson.trim() && (
								<Alert className='mt-2'>
									<Info className='h-4 w-4' />
									<AlertDescription>
										Invalid JSON format. Please check your syntax.
									</AlertDescription>
								</Alert>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Important Notes */}
				<Alert>
					<Info className='h-4 w-4' />
					<AlertDescription>
						<strong>Note:</strong> Only the name and metadata can be updated. The DID identifier, method, 
						and cryptographic properties cannot be changed after creation.
					</AlertDescription>
				</Alert>

				{/* Actions */}
				<div className='flex gap-4'>
					<Button type='submit' disabled={loading || !isValidMetadataJson()} className='flex-1'>
						{loading ? (
							<>
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
								Updating...
							</>
						) : (
							<>
								<Save className='h-4 w-4 mr-2' />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	)
}
