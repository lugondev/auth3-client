'use client'

import {useState} from 'react'
import {Search, Plus, FileText, User, GraduationCap, Briefcase, Shield, Award, Check} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'

import type {CredentialTemplate} from '@/types/credentials'

interface CredentialTemplateSelectorProps {
	templates: CredentialTemplate[]
	selectedTemplate?: CredentialTemplate
	onSelectTemplate: (template: CredentialTemplate | null) => void
	onCreateCustom: () => void
	className?: string
}

/**
 * CredentialTemplateSelector Component - Template selection for credential issuance
 *
 * Features:
 * - Template browsing and search
 * - Category filtering
 * - Template preview
 * - Custom credential option
 * - Template details display
 */
export function CredentialTemplateSelector({templates, selectedTemplate, onSelectTemplate, onCreateCustom, className = ''}: CredentialTemplateSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')

	// Get template icon based on type
	const getTemplateIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case 'education':
			case 'degree':
			case 'certificate':
				return <GraduationCap className='h-5 w-5' />
			case 'employment':
			case 'job':
			case 'work':
				return <Briefcase className='h-5 w-5' />
			case 'identity':
			case 'id':
				return <User className='h-5 w-5' />
			case 'license':
			case 'permit':
				return <Shield className='h-5 w-5' />
			case 'achievement':
			case 'award':
				return <Award className='h-5 w-5' />
			default:
				return <FileText className='h-5 w-5' />
		}
	}

	// Get unique categories from templates
	const getCategories = () => {
		const categories = new Set<string>()
		templates.forEach((template) => {
			if (template.category) {
				categories.add(template.category)
			}
		})
		return Array.from(categories).sort()
	}

	// Filter templates based on search and category
	const filteredTemplates = templates.filter((template) => {
		const matchesSearch = !searchQuery || template.name.toLowerCase().includes(searchQuery.toLowerCase()) || template.description.toLowerCase().includes(searchQuery.toLowerCase()) || (template.category && template.category.toLowerCase().includes(searchQuery.toLowerCase()))

		const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

		return matchesSearch && matchesCategory
	})

	// Group templates by category for display
	const groupedTemplates = filteredTemplates.reduce((acc, template) => {
		const category = template.category || 'Other'
		if (!acc[category]) {
			acc[category] = []
		}
		acc[category].push(template)
		return acc
	}, {} as Record<string, CredentialTemplate[]>)

	const categories = getCategories()

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className='space-y-4'>
				<div>
					<h3 className='text-lg font-semibold'>Select Credential Template</h3>
					<p className='text-sm text-muted-foreground'>Choose a pre-defined template or create a custom credential</p>
				</div>

				{/* Search */}
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input placeholder='Search templates...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
				</div>
			</div>

			{/* Category Tabs */}
			<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
				<TabsList className='grid w-full grid-cols-auto'>
					<TabsTrigger value='all'>All Templates</TabsTrigger>
					{categories.map((category) => (
						<TabsTrigger key={category} value={category}>
							{category}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value={selectedCategory} className='mt-6'>
					<ScrollArea className='h-96'>
						<div className='space-y-6'>
							{/* Custom Credential Option */}
							<Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${!selectedTemplate ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`} onClick={() => onSelectTemplate(null)}>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<div className='p-2 bg-primary/10 rounded-lg'>
												<Plus className='h-5 w-5 text-primary' />
											</div>
											<div>
												<CardTitle className='text-base'>Custom Credential</CardTitle>
												<CardDescription>Create a credential with custom fields and structure</CardDescription>
											</div>
										</div>
										{!selectedTemplate && (
											<div className='p-1 bg-primary rounded-full'>
												<Check className='h-3 w-3 text-primary-foreground' />
											</div>
										)}
									</div>
								</CardHeader>
							</Card>

							{/* Template Groups */}
							{Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
								<div key={category} className='space-y-3'>
									{selectedCategory === 'all' && (
										<div className='flex items-center gap-2'>
											<h4 className='font-medium text-sm text-muted-foreground uppercase tracking-wide'>{category}</h4>
											<div className='flex-1 h-px bg-border' />
										</div>
									)}

									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										{categoryTemplates.map((template) => (
											<Card key={template.id} className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`} onClick={() => onSelectTemplate(template)}>
												<CardHeader className='pb-3'>
													<div className='flex items-start justify-between'>
														<div className='flex items-start gap-3 flex-1'>
															<div className='p-2 bg-muted rounded-lg'>{getTemplateIcon(template.category || template.name)}</div>
															<div className='space-y-1 flex-1'>
																<CardTitle className='text-base line-clamp-1'>{template.name}</CardTitle>
																<CardDescription className='line-clamp-2'>{template.description}</CardDescription>

																{/* Template Tags */}
																{template.tags && template.tags.length > 0 && (
																	<div className='flex flex-wrap gap-1 mt-2'>
																		{template.tags.slice(0, 3).map((tag, index) => (
																			<Badge key={index} variant='outline' className='text-xs'>
																				{tag}
																			</Badge>
																		))}
																		{template.tags.length > 3 && (
																			<Badge variant='outline' className='text-xs'>
																				+{template.tags.length - 3}
																			</Badge>
																		)}
																	</div>
																)}
															</div>
														</div>

														{selectedTemplate?.id === template.id && (
															<div className='p-1 bg-primary rounded-full'>
																<Check className='h-3 w-3 text-primary-foreground' />
															</div>
														)}
													</div>
												</CardHeader>

												<CardContent className='pt-0'>
													<div className='space-y-2'>
														{/* Schema Fields Preview */}
														{template.subjectSchema && template.subjectSchema.properties && (
															<div>
																<Label className='text-xs font-medium text-muted-foreground'>Fields ({Object.keys(template.subjectSchema.properties).length})</Label>
																<div className='flex flex-wrap gap-1 mt-1'>
																	{Object.keys(template.subjectSchema.properties)
																		.slice(0, 4)
																		.map((field, index) => (
																			<Badge key={index} variant='secondary' className='text-xs'>
																				{field}
																			</Badge>
																		))}
																	{Object.keys(template.subjectSchema.properties).length > 4 && (
																		<Badge variant='secondary' className='text-xs'>
																			+{Object.keys(template.subjectSchema.properties).length - 4}
																		</Badge>
																	)}
																</div>
															</div>
														)}

														{/* Template Metadata */}
														<div className='flex items-center justify-between text-xs text-muted-foreground'>
															<span>Version {template.version}</span>
															{template.issuanceCount !== undefined && <span>{template.issuanceCount} issued</span>}
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							))}

							{/* No Results */}
							{filteredTemplates.length === 0 && (
								<div className='text-center py-8'>
									<FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<h3 className='text-lg font-medium mb-2'>No templates found</h3>
									<p className='text-muted-foreground mb-4'>{searchQuery ? `No templates match "${searchQuery}"` : 'No templates available in this category'}</p>
									<Button onClick={onCreateCustom}>
										<Plus className='h-4 w-4 mr-2' />
										Create Custom Credential
									</Button>
								</div>
							)}
						</div>
					</ScrollArea>
				</TabsContent>
			</Tabs>

			{/* Selected Template Details */}
			{selectedTemplate && (
				<Card>
					<CardHeader>
						<CardTitle className='text-base'>Selected Template</CardTitle>
						<CardDescription>
							{selectedTemplate.name} - {selectedTemplate.description}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{/* Template Schema */}
							{selectedTemplate.subjectSchema && (
								<div>
									<Label className='text-sm font-medium'>Required Fields</Label>
									<div className='grid grid-cols-2 md:grid-cols-3 gap-2 mt-2'>
										{Object.entries(selectedTemplate.subjectSchema.properties || {})
											.filter(([fieldName]: [string, unknown]) => selectedTemplate.subjectSchema?.required?.includes(fieldName))
											.map(([fieldName, field]: [string, { type?: string }]) => (
												<div key={fieldName} className='text-sm'>
													<span className='font-medium'>{fieldName}</span>
													<span className='text-muted-foreground ml-1'>({field.type})</span>
												</div>
											))}
									</div>
								</div>
							)}

							{/* Template Context */}
							{selectedTemplate.context && (
								<div>
									<Label className='text-sm font-medium'>Context</Label>
									<div className='flex flex-wrap gap-1 mt-1'>
										{(Array.isArray(selectedTemplate.context) ? selectedTemplate.context : [selectedTemplate.context]).map((context, index) => (
											<Badge key={index} variant='outline' className='text-xs font-mono'>
												{typeof context === 'string' ? context : JSON.stringify(context)}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
