'use client'

import React, {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {X, Plus} from 'lucide-react'
import {toast} from 'sonner'

import {CreateTemplateRequest, JSONValue} from '@/types/template'
import {templateService} from '@/services/templateService'
import {TemplateSchemaBuilder} from './TemplateSchemaBuilder'
import {useAuth} from '@/hooks/useAuth'

const createTemplateSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
	description: z.string().max(1000, 'Description must be less than 1000 characters'),
	type: z.array(z.string()).min(1, 'At least one type is required'),
	context: z.array(z.string()).optional(),
	issuerDID: z.string().optional(),
	version: z.string().min(1, 'Version is required'),
	tags: z.array(z.string()).optional(),
})

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>

interface TemplateCreateModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

export function TemplateCreateModal({open, onOpenChange, onSuccess}: TemplateCreateModalProps) {
	const [loading, setLoading] = useState(false)
	const [newType, setNewType] = useState('')
	const [newContext, setNewContext] = useState('')
	const [newTag, setNewTag] = useState('')
	const [schema, setSchema] = useState<Record<string, JSONValue>>({
		type: 'object',
		properties: {},
		required: [],
	})

	const {user} = useAuth()

	const {
		register,
		handleSubmit,
		formState: {errors},
		setValue,
		watch,
		reset,
	} = useForm<CreateTemplateFormData>({
		resolver: zodResolver(createTemplateSchema),
		defaultValues: {
			type: ['VerifiableCredential'],
			context: ['https://www.w3.org/2018/credentials/v1'],
			tags: [],
		},
	})

	const watchedTypes = watch('type') || []
	const watchedContexts = watch('context') || []
	const watchedTags = watch('tags') || []

	const addType = () => {
		if (newType.trim() && !watchedTypes.includes(newType.trim())) {
			setValue('type', [...watchedTypes, newType.trim()])
			setNewType('')
		}
	}

	const removeType = (typeToRemove: string) => {
		setValue(
			'type',
			watchedTypes.filter((type) => type !== typeToRemove),
		)
	}

	const addContext = () => {
		if (newContext.trim() && !watchedContexts.includes(newContext.trim())) {
			setValue('context', [...watchedContexts, newContext.trim()])
			setNewContext('')
		}
	}

	const removeContext = (contextToRemove: string) => {
		setValue(
			'context',
			watchedContexts.filter((context) => context !== contextToRemove),
		)
	}

	const addTag = () => {
		if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
			setValue('tags', [...watchedTags, newTag.trim()])
			setNewTag('')
		}
	}

	const removeTag = (tagToRemove: string) => {
		setValue(
			'tags',
			watchedTags.filter((tag) => tag !== tagToRemove),
		)
	}

	const onSubmit = async (data: CreateTemplateFormData) => {
		try {
			setLoading(true)

			if (!user?.id) {
				toast.error('You must be logged in to create a template')
				return
			}

			const request: CreateTemplateRequest = {
				...data,
				userID: user.id,
				schema,
				'@context': data.context,
			}

			await templateService.createTemplate(request)
			toast.success('Template created successfully')
			onSuccess()
			onOpenChange(false)
			reset()
			setSchema({
				type: 'object',
				properties: {},
				required: [],
			})
		} catch (error) {
			toast.error('Failed to create template')
			console.error('Error creating template:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => {
		onOpenChange(false)
		reset()
		setSchema({
			type: 'object',
			properties: {},
			required: [],
		})
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Create New Template</DialogTitle>
					<DialogDescription>Create a new verifiable credential template with JSON Schema validation</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Basic Information</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='name'>Template Name</Label>
									<Input id='name' {...register('name')} placeholder='Enter template name' />
									{errors.name && <p className='text-sm text-destructive'>{errors.name.message}</p>}
								</div>

								<div className='space-y-2'>
									<Label htmlFor='version'>Version</Label>
									<Input id='version' {...register('version')} placeholder='1.0.0' />
									{errors.version && <p className='text-sm text-destructive'>{errors.version.message}</p>}
								</div>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='description'>Description</Label>
								<Textarea id='description' {...register('description')} placeholder='Describe the purpose of this template' rows={3} />
								{errors.description && <p className='text-sm text-destructive'>{errors.description.message}</p>}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='issuerDID'>Issuer DID (Optional)</Label>
								<Input id='issuerDID' {...register('issuerDID')} placeholder='did:example:123456789abcdefghi' />
								<p className='text-xs text-muted-foreground'>You can set the issuer DID later when creating an issuer</p>
								{errors.issuerDID && <p className='text-sm text-destructive'>{errors.issuerDID.message}</p>}
							</div>
						</CardContent>
					</Card>

					{/* Credential Types */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Credential Types</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex gap-2'>
								<Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder='Add credential type' onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addType())} />
								<Button type='button' onClick={addType} size='sm'>
									<Plus className='h-4 w-4' />
								</Button>
							</div>
							<div className='flex flex-wrap gap-2'>
								{watchedTypes.map((type, index) => (
									<Badge key={index} variant='secondary' className='flex items-center gap-1'>
										{type}
										<X className='h-3 w-3 cursor-pointer' onClick={() => removeType(type)} />
									</Badge>
								))}
							</div>
							{errors.type && <p className='text-sm text-destructive'>{errors.type.message}</p>}
						</CardContent>
					</Card>

					{/* JSON-LD Context */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>JSON-LD Context</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex gap-2'>
								<Input value={newContext} onChange={(e) => setNewContext(e.target.value)} placeholder='Add context URL' onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContext())} />
								<Button type='button' onClick={addContext} size='sm'>
									<Plus className='h-4 w-4' />
								</Button>
							</div>
							<div className='flex flex-wrap gap-2'>
								{watchedContexts.map((context, index) => (
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
							<CardTitle className='text-lg'>Tags</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex gap-2'>
								<Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder='Add tag' onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
								<Button type='button' onClick={addTag} size='sm'>
									<Plus className='h-4 w-4' />
								</Button>
							</div>
							<div className='flex flex-wrap gap-2'>
								{watchedTags.map((tag, index) => (
									<Badge key={index} variant='outline' className='flex items-center gap-1'>
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
							<CardTitle className='text-lg'>JSON Schema</CardTitle>
						</CardHeader>
						<CardContent>
							<TemplateSchemaBuilder schema={schema} onChange={setSchema} />
						</CardContent>
					</Card>

					<DialogFooter>
						<Button type='button' variant='outline' onClick={handleClose}>
							Cancel
						</Button>
						<Button type='submit' disabled={loading}>
							{loading ? 'Creating...' : 'Create Template'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
