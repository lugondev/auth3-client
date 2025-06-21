'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Search, FileText, CheckCircle, User, Calendar} from 'lucide-react'

import {CredentialTemplate, TemplateFilters} from '@/types/template'
import {templateService} from '@/services/templateService'

interface TemplateSelectionStepProps {
	selectedTemplate?: CredentialTemplate
	onTemplateSelect: (template: CredentialTemplate) => void
	error?: string
}

export function TemplateSelectionStep({selectedTemplate, onTemplateSelect, error}: TemplateSelectionStepProps) {
	const [templates, setTemplates] = useState<CredentialTemplate[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [filters, setFilters] = useState<TemplateFilters>({
		page: 1,
		limit: 20,
		active: true, // Only show active templates
	})

	useEffect(() => {
		const loadTemplatesAsync = async () => {
			try {
				setLoading(true)
				const response = await templateService.listTemplates({
					...filters,
					search: searchTerm || undefined,
				})
				setTemplates(response.templates)
			} catch (err) {
				console.error('Error loading templates:', err)
				setTemplates([])
			} finally {
				setLoading(false)
			}
		}

		loadTemplatesAsync()
	}, [filters, searchTerm])

	const handleSearch = (value: string) => {
		setSearchTerm(value)
		// Debounce search
		setTimeout(() => {
			setFilters((prev) => ({...prev, search: value || undefined, page: 1}))
		}, 300)
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString()
	}

	const getSchemaFieldCount = (template: CredentialTemplate) => {
		const properties = (template.schema.properties as Record<string, unknown>) || {}
		return Object.keys(properties).length
	}

	if (loading) {
		return (
			<div className='space-y-4'>
				<div className='flex items-center gap-4'>
					<Skeleton className='h-10 flex-1' />
					<Skeleton className='h-10 w-32' />
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className='h-6 w-3/4' />
								<Skeleton className='h-4 w-full' />
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-1/2' />
									<Skeleton className='h-4 w-2/3' />
									<div className='flex gap-2'>
										<Skeleton className='h-6 w-16' />
										<Skeleton className='h-6 w-16' />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-lg font-semibold mb-2'>Select Credential Template</h3>
				<p className='text-muted-foreground'>Choose a template that defines the structure and schema for your credential.</p>
			</div>

			{/* Search */}
			<div className='flex items-center gap-4'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input placeholder='Search templates by name, type, or description...' value={searchTerm} onChange={(e) => handleSearch(e.target.value)} className='pl-10' />
				</div>
				<Button
					variant='outline'
					onClick={() => {
						setSearchTerm('')
						setFilters((prev) => ({...prev, search: undefined, page: 1}))
					}}
					disabled={!searchTerm}>
					Clear
				</Button>
			</div>

			{/* Error Message */}
			{error && <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3'>{error}</div>}

			{/* Templates Grid */}
			{templates.length === 0 ? (
				<Card>
					<CardContent className='flex flex-col items-center justify-center py-12'>
						<FileText className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-semibold mb-2'>No Templates Found</h3>
						<p className='text-muted-foreground text-center'>{searchTerm ? 'No templates match your search criteria. Try different keywords.' : 'No active templates are available. Create a template first to issue credentials.'}</p>
					</CardContent>
				</Card>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{templates.map((template) => (
						<Card key={template.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => onTemplateSelect(template)}>
							<CardHeader className='pb-3'>
								<div className='flex items-start justify-between'>
									<div className='flex-1'>
										<CardTitle className='text-base flex items-center gap-2'>
											{template.name}
											{selectedTemplate?.id === template.id && <CheckCircle className='h-4 w-4 text-primary' />}
										</CardTitle>
										<CardDescription className='text-sm mt-1 line-clamp-2'>{template.description}</CardDescription>
									</div>
								</div>
							</CardHeader>

							<CardContent className='space-y-3'>
								{/* Template Types */}
								<div>
									<div className='text-xs text-muted-foreground mb-1'>Types</div>
									<div className='flex flex-wrap gap-1'>
										{template.type.slice(0, 2).map((type, index) => (
											<Badge key={index} variant='secondary' className='text-xs'>
												{type}
											</Badge>
										))}
										{template.type.length > 2 && (
											<Badge variant='outline' className='text-xs'>
												+{template.type.length - 2} more
											</Badge>
										)}
									</div>
								</div>

								{/* Template Info */}
								<div className='grid grid-cols-2 gap-4 text-xs'>
									<div className='flex items-center gap-1 text-muted-foreground'>
										<FileText className='h-3 w-3' />
										<span>{getSchemaFieldCount(template)} fields</span>
									</div>
									<div className='flex items-center gap-1 text-muted-foreground'>
										<User className='h-3 w-3' />
										<span>v{template.version}</span>
									</div>
								</div>

								{/* Template Tags */}
								{template.tags && template.tags.length > 0 && (
									<div>
										<div className='text-xs text-muted-foreground mb-1'>Tags</div>
										<div className='flex flex-wrap gap-1'>
											{template.tags.slice(0, 3).map((tag, index) => (
												<Badge key={index} variant='outline' className='text-xs'>
													{tag}
												</Badge>
											))}
											{template.tags.length > 3 && <span className='text-xs text-muted-foreground'>+{template.tags.length - 3} more</span>}
										</div>
									</div>
								)}

								{/* Last Updated */}
								<div className='flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t'>
									<Calendar className='h-3 w-3' />
									<span>Updated {formatDate(template.updatedAt)}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Selected Template Info */}
			{selectedTemplate && (
				<Card className='bg-green-50 border-green-200'>
					<CardContent className='p-4'>
						<div className='flex items-center gap-2 text-green-800'>
							<CheckCircle className='h-5 w-5' />
							<span className='font-medium'>Selected: {selectedTemplate.name}</span>
						</div>
						<p className='text-green-700 text-sm mt-1'>{selectedTemplate.description}</p>
						<div className='flex items-center gap-4 mt-2 text-sm text-green-600'>
							<span>{getSchemaFieldCount(selectedTemplate)} fields to fill</span>
							<span>Version {selectedTemplate.version}</span>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
