'use client'

import React, {useState} from 'react'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {X, Upload, Image, QrCode} from 'lucide-react'
import {ClientRegistrationRequest} from '@/types/oauth2'
import {uploadOAuth2Logo} from '@/services/uploadService'

// Auto Tag Input Component for Grant Types and Response Types
const AutoTagInput: React.FC<{
	label: string
	tags: string[]
	onTagsChange: (tags: string[]) => void
	placeholder?: string
}> = ({label, tags, onTagsChange, placeholder}) => {
	const [inputValue, setInputValue] = useState('')

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
			e.preventDefault()
			const trimmedValue = inputValue.trim()
			if (trimmedValue && !tags.includes(trimmedValue)) {
				onTagsChange([...tags, trimmedValue])
				setInputValue('')
			}
		} else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
			onTagsChange(tags.slice(0, -1))
		}
	}

	const removeTag = (indexToRemove: number) => {
		onTagsChange(tags.filter((_, index) => index !== indexToRemove))
	}

	return (
		<div className='space-y-2'>
			<Label>{label}:</Label>
			<div className='min-h-[40px] border border-input rounded-md p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'>
				<div className='flex flex-wrap gap-1 mb-2'>
					{tags?.map((tag, index) => (
						<Badge key={index} variant='secondary' className='px-2 py-1'>
							{tag}
							<button type='button' onClick={() => removeTag(index)} className='ml-1 text-xs hover:text-destructive'>
								×
							</button>
						</Badge>
					))}
				</div>
				<Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder || 'Type and press Enter, comma, or space to add'} className='border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0' />
			</div>
			<p className='text-xs text-muted-foreground'>Press Enter, comma, or space to add tags</p>
		</div>
	)
}

// Line Tag Input Component for Redirect URIs
const LineTagInput: React.FC<{
	label: string
	tags: string[]
	onTagsChange: (tags: string[]) => void
	placeholder?: string
}> = ({label, tags, onTagsChange, placeholder}) => {
	const [inputValue, setInputValue] = useState('')

	const handleAddTag = () => {
		const trimmedValue = inputValue.trim()
		if (trimmedValue && !tags.includes(trimmedValue)) {
			onTagsChange([...tags, trimmedValue])
			setInputValue('')
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAddTag()
		}
	}

	const removeTag = (indexToRemove: number) => {
		onTagsChange(tags.filter((_, index) => index !== indexToRemove))
	}

	return (
		<div className='space-y-2'>
			<Label>{label}:</Label>
			<div className='space-y-2'>
				<div className='flex gap-2'>
					<Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder || 'Enter URI and press Enter'} className='flex-1' />
					<Button type='button' onClick={handleAddTag} size='sm'>
						Add
					</Button>
				</div>
				{tags.length > 0 && (
					<div className='space-y-1'>
						{tags.map((tag, index) => (
							<div key={index} className='flex items-center gap-2 p-2 bg-muted rounded-md'>
								<span className='flex-1 text-sm font-mono'>{tag}</span>
								<button type='button' onClick={() => removeTag(index)} className='text-xs hover:text-destructive'>
									<X className='h-3 w-3' />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

// Image Upload Component
const ImageUpload: React.FC<{
	label: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
}> = ({label, value, onChange, placeholder}) => {
	const [previewUrl, setPreviewUrl] = useState<string>(value || '')
	const [isUploading, setIsUploading] = useState(false)

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file')
			return
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size must be less than 5MB')
			return
		}

		setIsUploading(true)

		try {
			// Upload OAuth2 logo using the upload service
			const uploadResponse = await uploadOAuth2Logo(file)

			const uploadedUrl = uploadResponse.url
			setPreviewUrl(uploadedUrl)
			onChange(uploadedUrl)
		} catch (error) {
			console.error('Upload failed:', error)
			const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
			alert(errorMessage)

			// Fallback to local preview if upload fails
			const localUrl = URL.createObjectURL(file)
			setPreviewUrl(localUrl)
			onChange(localUrl)
		} finally {
			setIsUploading(false)
		}
	}

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const url = e.target.value
		onChange(url)
		setPreviewUrl(url)
	}

	const clearImage = () => {
		onChange('')
		setPreviewUrl('')
	}

	return (
		<div className='space-y-2'>
			<Label>{label}:</Label>
			<div className='space-y-3'>
				{/* URL Input */}
				<div className='flex gap-2'>
					<Input type='url' value={value} onChange={handleUrlChange} placeholder={placeholder || 'https://example.com/image.png'} className='flex-1' />
					{value && (
						<Button type='button' onClick={clearImage} size='sm' variant='outline'>
							<X className='h-4 w-4' />
						</Button>
					)}
				</div>

				{/* File Upload */}
				<div className='flex items-center gap-2'>
					<Input type='file' accept='image/*' onChange={handleFileChange} disabled={isUploading} className='hidden' id={`${label}-file-upload`} />
					<Label htmlFor={`${label}-file-upload`} className='flex items-center gap-2 px-3 py-2 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors'>
						<Upload className='h-4 w-4' />
						{isUploading ? 'Uploading...' : 'Upload Image'}
					</Label>
					<span className='text-xs text-muted-foreground'>Max 5MB</span>
				</div>

				{/* Image Preview */}
				{previewUrl && (
					<div className='flex items-center gap-3 p-3 border border-input rounded-md bg-muted/50'>
						<div className='flex-shrink-0'>
							<Image className='h-8 w-8 text-muted-foreground' />
						</div>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium truncate'>Image Preview</p>
							<p className='text-xs text-muted-foreground truncate'>{previewUrl}</p>
						</div>
						<img src={previewUrl} alt='Preview' className='h-12 w-12 object-cover rounded border' onError={() => setPreviewUrl('')} />
					</div>
				)}
			</div>
		</div>
	)
}

interface OAuth2ClientFormProps {
	clientData: ClientRegistrationRequest
	onSubmit: (e: React.FormEvent) => void
	onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
	onDataChange: (data: Partial<ClientRegistrationRequest>) => void
	submitLabel: string
	errorMessage?: string | null
	showCancel?: boolean
	onCancel?: () => void
	isLoading?: boolean
}

const OAuth2ClientForm: React.FC<OAuth2ClientFormProps> = ({clientData, onSubmit, onChange, onDataChange, submitLabel, errorMessage, showCancel = false, onCancel, isLoading = false}) => {
	return (
		<div>
			{errorMessage && (
				<Alert variant='destructive' className='mb-4'>
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			<form onSubmit={onSubmit} className='space-y-4'>
				<div className='space-y-2'>
					<Label htmlFor='name'>Client Name:</Label>
					<Input type='text' id='name' name='name' value={clientData.name} onChange={onChange} required />
				</div>

				<div className='space-y-2'>
					<Label htmlFor='description'>Description:</Label>
					<Input type='text' id='description' name='description' value={clientData.description} onChange={onChange} placeholder='Optional description of the client application' />
				</div>

				<div className='space-y-2'>
					<Label htmlFor='client_uri'>Client URI:</Label>
					<Input type='url' id='client_uri' name='client_uri' value={clientData.client_uri} onChange={onChange} placeholder='https://example.com' />
				</div>

				<ImageUpload label='Logo Image' value={clientData.logo_uri || ''} onChange={(value) => onDataChange({logo_uri: value})} placeholder='https://example.com/logo.png' />

				<div className='space-y-2'>
					<Label htmlFor='tos_uri'>Terms of Service URI:</Label>
					<Input type='url' id='tos_uri' name='tos_uri' value={clientData.tos_uri} onChange={onChange} placeholder='https://example.com/terms' />
				</div>

				<div className='space-y-2'>
					<Label htmlFor='policy_uri'>Privacy Policy URI:</Label>
					<Input type='url' id='policy_uri' name='policy_uri' value={clientData.policy_uri} onChange={onChange} placeholder='https://example.com/privacy' />
				</div>

				<div className='space-y-2'>
					<Label htmlFor='token_endpoint_auth_method'>Token Endpoint Auth Method:</Label>
					<Input type='text' id='token_endpoint_auth_method' name='token_endpoint_auth_method' value={clientData.token_endpoint_auth_method} onChange={onChange} placeholder='client_secret_basic, client_secret_post, none' />
				</div>

				<div className='flex items-center justify-between p-4 border border-input rounded-md bg-muted/50'>
					<div className='flex items-center space-x-3'>
						<QrCode className='h-5 w-5 text-muted-foreground' />
						<div>
							<Label htmlFor='is_qr_code_enabled' className='text-sm font-medium'>
								Enable QR Code Authentication
							</Label>
							<p className='text-xs text-muted-foreground'>
								Allow users to authenticate using QR codes for this OAuth2 client
							</p>
						</div>
					</div>
					<Switch
						id='is_qr_code_enabled'
						checked={clientData.is_qr_code_enabled ?? true}
						onCheckedChange={(checked) => onDataChange({is_qr_code_enabled: checked})}
					/>
				</div>

				<LineTagInput label='Contacts' tags={clientData.contacts || []} onTagsChange={(contacts) => onDataChange({contacts})} placeholder='admin@example.com' />

				<LineTagInput label='Redirect URIs' tags={clientData.redirect_uris} onTagsChange={(redirect_uris) => onDataChange({redirect_uris})} placeholder='https://example.com/callback' />

				<AutoTagInput label='Grant Types' tags={clientData.grant_types} onTagsChange={(grant_types) => onDataChange({grant_types})} placeholder='authorization_code, client_credentials' />

				<AutoTagInput label='Response Types' tags={clientData.response_types} onTagsChange={(response_types) => onDataChange({response_types})} placeholder='code, token' />

				<AutoTagInput label='Scopes' tags={clientData.scopes} onTagsChange={(scopes) => onDataChange({scopes})} placeholder='openid, profile, email' />

				<div className='flex gap-2 pt-4'>
					<Button type='submit' disabled={isLoading}>
						{isLoading ? 'Loading...' : submitLabel}
					</Button>
					{showCancel && (
						<Button type='button' variant='outline' onClick={onCancel}>
							Cancel
						</Button>
					)}
				</div>
			</form>
		</div>
	)
}

export default OAuth2ClientForm
