'use client'

import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Checkbox} from '@/components/ui/checkbox'
import {Plus, Edit, Trash2} from 'lucide-react'
import {toast} from 'sonner'

import {JSONValue, JSONSchemaProperty, JSONSchemaType} from '@/types/template'

interface TemplateSchemaBuilderProps {
	schema: Record<string, JSONValue>
	onChange: (schema: Record<string, JSONValue>) => void
}

interface PropertyFormData {
	key: string
	type: JSONSchemaType
	title: string
	description: string
	required: boolean
	enum?: string[]
	minimum?: number
	maximum?: number
	minLength?: number
	maxLength?: number
	pattern?: string
	format?: string
}

export function TemplateSchemaBuilder({schema, onChange}: TemplateSchemaBuilderProps) {
	const [showPropertyForm, setShowPropertyForm] = useState(false)
	const [editingProperty, setEditingProperty] = useState<string | null>(null)
	const [propertyForm, setPropertyForm] = useState<PropertyFormData>({
		key: '',
		type: 'string',
		title: '',
		description: '',
		required: false,
	})

	const schemaProperties = (schema.properties as unknown as Record<string, JSONSchemaProperty>) || {}
	const requiredFields = (schema.required as unknown as string[]) || []

	const resetForm = (hideForm = true) => {
		setPropertyForm({
			key: '',
			type: 'string',
			title: '',
			description: '',
			required: false,
		})
		setEditingProperty(null)
		if (hideForm) {
			setShowPropertyForm(false)
		}
	}

	const handleAddProperty = () => {
		resetForm(false) // Reset form but don't hide it
		setShowPropertyForm(true)
	}

	const handleEditProperty = (key: string) => {
		const property = schemaProperties[key]
		if (!property) return

		setPropertyForm({
			key,
			type: Array.isArray(property.type) ? property.type[0] : property.type,
			title: property.title || '',
			description: property.description || '',
			required: requiredFields.includes(key),
			enum: property.enum?.map(String),
			minimum: property.minimum,
			maximum: property.maximum,
			minLength: property.minLength,
			maxLength: property.maxLength,
			pattern: property.pattern,
			format: property.format,
		})
		setEditingProperty(key)
		setShowPropertyForm(true)
	}

	const handleDeleteProperty = (key: string) => {
		const newProperties = {...schemaProperties}
		delete newProperties[key]

		const newRequired = requiredFields.filter((field) => field !== key)

		onChange({
			...schema,
			properties: newProperties as unknown as JSONValue,
			required: newRequired as unknown as JSONValue,
		})
	}

	const handleSaveProperty = () => {
		if (!propertyForm.key.trim()) {
			toast.error('Property key is required')
			return
		}

		if (editingProperty !== propertyForm.key && schemaProperties[propertyForm.key]) {
			toast.error('Property key already exists')
			return
		}

		const newProperty: JSONSchemaProperty = {
			type: propertyForm.type,
			title: propertyForm.title,
			description: propertyForm.description,
		}

		// Add type-specific properties
		if (propertyForm.type === 'string') {
			if (propertyForm.minLength !== undefined) newProperty.minLength = propertyForm.minLength
			if (propertyForm.maxLength !== undefined) newProperty.maxLength = propertyForm.maxLength
			if (propertyForm.pattern) newProperty.pattern = propertyForm.pattern
			if (propertyForm.format) newProperty.format = propertyForm.format
			if (propertyForm.enum && propertyForm.enum.length > 0) {
				newProperty.enum = propertyForm.enum
			}
		}

		if (propertyForm.type === 'number' || propertyForm.type === 'integer') {
			if (propertyForm.minimum !== undefined) newProperty.minimum = propertyForm.minimum
			if (propertyForm.maximum !== undefined) newProperty.maximum = propertyForm.maximum
		}

		const newProperties = {...schemaProperties}

		// If editing, remove old key if it changed
		if (editingProperty && editingProperty !== propertyForm.key) {
			delete newProperties[editingProperty]
		}

		newProperties[propertyForm.key] = newProperty

		const newRequired = requiredFields.filter((field) => field !== editingProperty)
		if (propertyForm.required && !newRequired.includes(propertyForm.key)) {
			newRequired.push(propertyForm.key)
		}

		onChange({
			...schema,
			properties: newProperties as unknown as JSONValue,
			required: newRequired as unknown as JSONValue,
		})

		resetForm()
		toast.success('Property saved successfully')
	}

	const handleEnumChange = (value: string) => {
		const enumValues = value
			.split(',')
			.map((v) => v.trim())
			.filter((v) => v)
		setPropertyForm((prev) => ({...prev, enum: enumValues}))
	}

	return (
		<div className='space-y-4'>
			{/* Existing Properties */}
			<div className='space-y-2'>
				<div className='flex items-center justify-between'>
					<Label className='text-base font-medium'>Schema Properties</Label>
					<Button type='button' onClick={handleAddProperty} size='sm'>
						<Plus className='h-4 w-4 mr-2' />
						Add Property
					</Button>
				</div>

				{Object.keys(schemaProperties).length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>No properties defined. Click &quot;Add Property&quot; to get started.</div>
				) : (
					<div className='space-y-2'>
						{Object.entries(schemaProperties).map(([key, property]) => (
							<Card key={key} className='p-3'>
								<div className='flex items-start justify-between'>
									<div className='flex-1'>
										<div className='flex items-center gap-2 mb-2'>
											<span className='font-medium'>{key}</span>
											<Badge variant='outline'>{property.type}</Badge>
											{requiredFields.includes(key) && (
												<Badge variant='destructive' className='text-xs'>
													Required
												</Badge>
											)}
										</div>
										{property.title && <div className='text-sm font-medium text-muted-foreground'>{property.title}</div>}
										{property.description && <div className='text-sm text-muted-foreground'>{property.description}</div>}
										{property.enum && <div className='text-sm text-muted-foreground mt-1'>Options: {property.enum.join(', ')}</div>}
									</div>
									<div className='flex gap-1'>
										<Button type='button' variant='ghost' size='sm' onClick={() => handleEditProperty(key)}>
											<Edit className='h-4 w-4' />
										</Button>
										<Button type='button' variant='ghost' size='sm' onClick={() => handleDeleteProperty(key)}>
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Property Form */}
			{showPropertyForm && (
				<Card>
					<CardHeader>
						<CardTitle className='text-lg'>{editingProperty ? 'Edit Property' : 'Add New Property'}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='propertyKey'>Property Key</Label>
								<Input id='propertyKey' value={propertyForm.key} onChange={(e) => setPropertyForm((prev) => ({...prev, key: e.target.value}))} placeholder='e.g., firstName, age, email' />
							</div>

							<div className='space-y-2'>
								<Label htmlFor='propertyType'>Type</Label>
								<Select value={propertyForm.type} onValueChange={(value: JSONSchemaType) => setPropertyForm((prev) => ({...prev, type: value}))}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='string'>String</SelectItem>
										<SelectItem value='number'>Number</SelectItem>
										<SelectItem value='integer'>Integer</SelectItem>
										<SelectItem value='boolean'>Boolean</SelectItem>
										<SelectItem value='array'>Array</SelectItem>
										<SelectItem value='object'>Object</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='propertyTitle'>Title</Label>
							<Input id='propertyTitle' value={propertyForm.title} onChange={(e) => setPropertyForm((prev) => ({...prev, title: e.target.value}))} placeholder='Human-readable title' />
						</div>

						<div className='space-y-2'>
							<Label htmlFor='propertyDescription'>Description</Label>
							<Textarea id='propertyDescription' value={propertyForm.description} onChange={(e) => setPropertyForm((prev) => ({...prev, description: e.target.value}))} placeholder='Description of the property' rows={2} />
						</div>

						<div className='flex items-center space-x-2'>
							<Checkbox id='propertyRequired' checked={propertyForm.required} onCheckedChange={(checked) => setPropertyForm((prev) => ({...prev, required: !!checked}))} />
							<Label htmlFor='propertyRequired'>Required field</Label>
						</div>

						{/* Type-specific fields */}
						{propertyForm.type === 'string' && (
							<div className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='minLength'>Min Length</Label>
										<Input
											id='minLength'
											type='number'
											value={propertyForm.minLength || ''}
											onChange={(e) =>
												setPropertyForm((prev) => ({
													...prev,
													minLength: e.target.value ? parseInt(e.target.value) : undefined,
												}))
											}
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='maxLength'>Max Length</Label>
										<Input
											id='maxLength'
											type='number'
											value={propertyForm.maxLength || ''}
											onChange={(e) =>
												setPropertyForm((prev) => ({
													...prev,
													maxLength: e.target.value ? parseInt(e.target.value) : undefined,
												}))
											}
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='pattern'>Pattern (RegEx)</Label>
									<Input id='pattern' value={propertyForm.pattern || ''} onChange={(e) => setPropertyForm((prev) => ({...prev, pattern: e.target.value}))} placeholder='^[a-zA-Z0-9]+$' />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='format'>Format</Label>
									<Select value={propertyForm.format || 'none'} onValueChange={(value) => setPropertyForm((prev) => ({...prev, format: value === 'none' ? undefined : value}))}>
										<SelectTrigger>
											<SelectValue placeholder='Select format' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='none'>None</SelectItem>
											<SelectItem value='email'>Email</SelectItem>
											<SelectItem value='uri'>URI</SelectItem>
											<SelectItem value='date'>Date</SelectItem>
											<SelectItem value='time'>Time</SelectItem>
											<SelectItem value='date-time'>Date Time</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='enum'>Enum Values (comma-separated)</Label>
									<Input id='enum' value={propertyForm.enum?.join(', ') || ''} onChange={(e) => handleEnumChange(e.target.value)} placeholder='option1, option2, option3' />
								</div>
							</div>
						)}

						{(propertyForm.type === 'number' || propertyForm.type === 'integer') && (
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='minimum'>Minimum</Label>
									<Input
										id='minimum'
										type='number'
										value={propertyForm.minimum || ''}
										onChange={(e) =>
											setPropertyForm((prev) => ({
												...prev,
												minimum: e.target.value ? parseFloat(e.target.value) : undefined,
											}))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='maximum'>Maximum</Label>
									<Input
										id='maximum'
										type='number'
										value={propertyForm.maximum || ''}
										onChange={(e) =>
											setPropertyForm((prev) => ({
												...prev,
												maximum: e.target.value ? parseFloat(e.target.value) : undefined,
											}))
										}
									/>
								</div>
							</div>
						)}

						<div className='flex gap-2 pt-4'>
							<Button type='button' onClick={handleSaveProperty}>
								{editingProperty ? 'Update Property' : 'Add Property'}
							</Button>
							<Button type='button' variant='outline' onClick={() => resetForm()}>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Schema Preview */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Schema Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className='pre-code-json'>{JSON.stringify(schema, null, 2)}</pre>
				</CardContent>
			</Card>
		</div>
	)
}
