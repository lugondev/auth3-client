'use client'

import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {Plus, Trash2} from 'lucide-react'
import {createTemplate} from '@/services/vcService'
import type {CreateTemplateInput, JSONSchemaProperty} from '@/types/credentials'

// Template field interface
interface TemplateField {
	id: number
	name: string
	type: string
	required: boolean
}

interface CreateTemplateFormProps {
	onClose: () => void
	onSuccess: () => void
}

export function CreateTemplateForm({onClose, onSuccess}: CreateTemplateFormProps) {
	const [formData, setFormData] = useState({
		name: '',
		type: [] as string[],
		description: '',
		fields: [] as TemplateField[],
		isActive: true,
	})
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [newField, setNewField] = useState({name: '', type: 'string', required: true})

	const addField = () => {
		if (newField.name) {
			setFormData((prev) => ({
				...prev,
				fields: [...prev.fields, {...newField, id: Date.now()}],
			}))
			setNewField({name: '', type: 'string', required: true})
		}
	}

	const removeField = (fieldId: number) => {
		setFormData((prev) => ({
			...prev,
			fields: prev.fields.filter((field) => field.id !== fieldId),
		}))
	}

	const handleSubmit = async () => {
		setIsLoading(true)
		setError(null)
		try {
			// Transform form data to API format
			const templateInput: CreateTemplateInput = {
				name: formData.name,
				description: formData.description,
				type: formData.type.length > 0 ? formData.type : ['VerifiableCredential'],
				schema: {
					id: `${formData.name.toLowerCase().replace(/\s+/g, '-')}-schema`,
					type: 'JsonSchemaValidator2018',
				},
				subjectSchema: {
					type: 'object',
					properties: formData.fields.reduce((acc, field) => {
						acc[field.name] = {
							type: field.type,
							...(field.required && {description: `Required ${field.type} field`}),
						}
						return acc
					}, {} as Record<string, JSONSchemaProperty>),
					required: formData.fields.filter((f) => f.required).map((f) => f.name),
				},
				isActive: formData.isActive,
			}
			await createTemplate(templateInput)
			onSuccess()
			onClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create template')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<Label htmlFor='name'>Template Name</Label>
					<Input id='name' value={formData.name} onChange={(e) => setFormData((prev) => ({...prev, name: e.target.value}))} placeholder='Enter template name' />
				</div>
				<div>
					<Label htmlFor='type'>Type</Label>
					<Input
						id='type'
						value={formData.type.join(', ')}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								type: e.target.value
									.split(',')
									.map((t) => t.trim())
									.filter(Boolean),
							}))
						}
						placeholder='Enter credential types (comma-separated, e.g., VerifiableCredential, EducationCredential)'
					/>
				</div>
			</div>

			<div>
				<Label htmlFor='description'>Description</Label>
				<Textarea id='description' value={formData.description} onChange={(e) => setFormData((prev) => ({...prev, description: e.target.value}))} placeholder='Enter template description' />
			</div>

			<div>
				<Label>Template Fields</Label>
				<div className='space-y-2 mt-2'>
					{formData.fields.map((field) => (
						<div key={field.id} className='flex items-center gap-2 p-2 border rounded'>
							<span className='flex-1'>{field.name}</span>
							<Badge variant='outline'>{field.type}</Badge>
							{field.required && <Badge variant='secondary'>Required</Badge>}
							<Button variant='ghost' size='sm' onClick={() => removeField(field.id)}>
								<Trash2 className='w-4 h-4' />
							</Button>
						</div>
					))}
				</div>

				<div className='flex gap-2 mt-2'>
					<Input placeholder='Field name' value={newField.name} onChange={(e) => setNewField((prev) => ({...prev, name: e.target.value}))} />
					<Select value={newField.type} onValueChange={(value) => setNewField((prev) => ({...prev, type: value}))}>
						<SelectTrigger className='w-32'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='string'>String</SelectItem>
							<SelectItem value='number'>Number</SelectItem>
							<SelectItem value='date'>Date</SelectItem>
							<SelectItem value='boolean'>Boolean</SelectItem>
						</SelectContent>
					</Select>
					<div className='flex items-center gap-2'>
						<Switch checked={newField.required} onCheckedChange={(checked) => setNewField((prev) => ({...prev, required: checked}))} />
						<span className='text-sm'>Required</span>
					</div>
					<Button onClick={addField}>
						<Plus className='w-4 h-4' />
					</Button>
				</div>
			</div>

			<div className='flex items-center gap-2'>
				<Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData((prev) => ({...prev, isActive: checked}))} />
				<Label>Active Template</Label>
			</div>

			{error && <div className='text-red-600 text-sm p-2 bg-red-50 rounded'>{error}</div>}

			<div className='flex justify-end gap-2 pt-4'>
				<Button variant='outline' onClick={onClose}>
					Cancel
				</Button>
				<Button disabled={isLoading} onClick={handleSubmit}>
					{isLoading ? 'Creating...' : 'Create Template'}
				</Button>
			</div>
		</div>
	)
}
