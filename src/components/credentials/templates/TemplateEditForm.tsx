'use client'

import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {X, Plus} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate, UpdateTemplateRequest, JSONValue} from '@/types/template'
import {TemplateSchemaBuilder} from './TemplateSchemaBuilder'

interface TemplateEditFormProps {
	template: CredentialTemplate
	onSubmit: (data: UpdateTemplateRequest) => Promise<void>
	onCancel: () => void
	loading?: boolean
}

export function TemplateEditForm({template, onSubmit, onCancel, loading = false}: TemplateEditFormProps) {
	const [formData, setFormData] = useState<UpdateTemplateRequest>({
		name: template.name,
		description: template.description,
		type: [...template.type],
		'@context': [...template['@context']],
		schema: {...template.schema},
		active: template.active,
		version: template.version,
		tags: [...(template.tags || [])],
		metadata: {...template.metadata},
	})

	const [newType, setNewType] = useState('')
	const [newContext, setNewContext] = useState('')
	const [newTag, setNewTag] = useState('')
	const [errors, setErrors] = useState<Record<string, string>>({})

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (!formData.name?.trim()) {
			newErrors.name = 'Template name is required'
		}

		if (!formData.description?.trim()) {
			newErrors.description = 'Description is required'
		}

		if (!formData.type || formData.type.length === 0) {
			newErrors.type = 'At least one type is required'
		}

		if (!formData.schema || Object.keys(formData.schema).length === 0) {
			newErrors.schema = 'Schema cannot be empty'
		}

		if (!formData.version?.trim()) {
			newErrors.version = 'Version is required'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			toast.error('Please fix the form errors')
			return
		}

		try {
			await onSubmit(formData)
			toast.success('Template updated successfully')
		} catch (error) {
			toast.error('Failed to update template')
			console.error('Update error:', error)
		}
	}

	const handleInputChange = (field: keyof UpdateTemplateRequest, value: string | boolean | string[] | Record<string, JSONValue>) => {
		setFormData((prev) => ({...prev, [field]: value}))
		if (errors[field]) {
			setErrors((prev) => ({...prev, [field]: ''}))
		}
	}

	const addType = () => {
		if (newType.trim() && !formData.type?.includes(newType.trim())) {
			handleInputChange('type', [...(formData.type || []), newType.trim()])
			setNewType('')
		}
	}

	const removeType = (typeToRemove: string) => {
		handleInputChange('type', formData.type?.filter((t) => t !== typeToRemove) || [])
	}

	const addContext = () => {
		if (newContext.trim() && !formData['@context']?.includes(newContext.trim())) {
			handleInputChange('@context', [...(formData['@context'] || []), newContext.trim()])
			setNewContext('')
		}
	}

	const removeContext = (contextToRemove: string) => {
		handleInputChange('@context', formData['@context']?.filter((c) => c !== contextToRemove) || [])
	}

	const addTag = () => {
		if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
			handleInputChange('tags', [...(formData.tags || []), newTag.trim()])
			setNewTag('')
		}
	}

	const removeTag = (tagToRemove: string) => {
		handleInputChange('tags', formData.tags?.filter((t) => t !== tagToRemove) || [])
	}

	const handleSchemaChange = (newSchema: Record<string, JSONValue>) => {
		handleInputChange('schema', newSchema)
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='name'>Template Name</Label>
						<Input id='name' value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder='Enter template name' className={errors.name ? 'border-red-500' : ''} />
						{errors.name && <p className='text-sm text-red-500'>{errors.name}</p>}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Description</Label>
						<Textarea id='description' value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder='Enter template description' rows={3} className={errors.description ? 'border-red-500' : ''} />
						{errors.description && <p className='text-sm text-red-500'>{errors.description}</p>}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='version'>Version</Label>
						<Input id='version' value={formData.version || ''} onChange={(e) => handleInputChange('version', e.target.value)} placeholder='e.g., 1.0.0' className={errors.version ? 'border-red-500' : ''} />
						{errors.version && <p className='text-sm text-red-500'>{errors.version}</p>}
					</div>

					<div className='flex items-center space-x-2'>
						<Switch id='active' checked={formData.active ?? true} onCheckedChange={(checked) => handleInputChange('active', checked)} />
						<Label htmlFor='active'>Active Template</Label>
					</div>
				</CardContent>
			</Card>

			{/* Types */}
			<Card>
				<CardHeader>
					<CardTitle>Credential Types</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex gap-2'>
						<Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder='Add credential type' onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addType())} />
						<Button type='button' onClick={addType} size='sm'>
							<Plus className='h-4 w-4' />
						</Button>
					</div>

					<div className='flex flex-wrap gap-2'>
						{formData.type?.map((type, index) => (
							<Badge key={index} variant='secondary' className='flex items-center gap-1'>
								{type}
								<X className='h-3 w-3 cursor-pointer' onClick={() => removeType(type)} />
							</Badge>
						))}
					</div>
					{errors.type && <p className='text-sm text-red-500'>{errors.type}</p>}
				</CardContent>
			</Card>

			{/* Contexts */}
			<Card>
				<CardHeader>
					<CardTitle>JSON-LD Contexts</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex gap-2'>
						<Input value={newContext} onChange={(e) => setNewContext(e.target.value)} placeholder='Add JSON-LD context URL' onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addContext())} />
						<Button type='button' onClick={addContext} size='sm'>
							<Plus className='h-4 w-4' />
						</Button>
					</div>

					<div className='flex flex-wrap gap-2'>
						{formData['@context']?.map((context, index) => (
							<Badge key={index} variant='outline' className='flex items-center gap-1'>
								{context}
								<X className='h-3 w-3 cursor-pointer' onClick={() => removeContext(context)} />
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Tags */}
			<Card>
				<CardHeader>
					<CardTitle>Tags</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex gap-2'>
						<Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder='Add tag' onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
						<Button type='button' onClick={addTag} size='sm'>
							<Plus className='h-4 w-4' />
						</Button>
					</div>

					<div className='flex flex-wrap gap-2'>
						{formData.tags?.map((tag, index) => (
							<Badge key={index} variant='default' className='flex items-center gap-1'>
								{tag}
								<X className='h-3 w-3 cursor-pointer' onClick={() => removeTag(tag)} />
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Schema Builder */}
			<Card>
				<CardHeader>
					<CardTitle>Credential Schema</CardTitle>
				</CardHeader>
				<CardContent>
					<TemplateSchemaBuilder schema={formData.schema || {}} onChange={handleSchemaChange} />
					{errors.schema && <p className='text-sm text-red-500 mt-2'>{errors.schema}</p>}
				</CardContent>
			</Card>

			{/* Form Actions */}
			<div className='flex gap-2'>
				<Button type='submit' disabled={loading}>
					{loading ? 'Updating...' : 'Update Template'}
				</Button>
				<Button type='button' variant='outline' onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</form>
	)
}
