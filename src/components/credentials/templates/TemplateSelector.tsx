'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ScrollArea} from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Search,
	FileText,
	User,
	GraduationCap,
	Briefcase,
	Shield,
	Award,
	Check,
	Star,
	TrendingUp,
	Clock,
	Users,
	Filter,
	SortAsc,
	SortDesc,
} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate, TemplateFilters} from '@/types/template'
import {templateService} from '@/services/templateService'

interface TemplateSelectorProps {
	selectedTemplate?: CredentialTemplate
	onTemplateSelect: (template: CredentialTemplate | null) => void
	onCreateCustom?: () => void
	className?: string
	showAnalytics?: boolean
	enableBulkSelection?: boolean
	selectedTemplates?: CredentialTemplate[]
	onBulkSelectionChange?: (templates: CredentialTemplate[]) => void
}

interface TemplateStats {
	usageCount: number
	recentUsage: number
	averageRating?: number
	lastUsed?: string
}

interface EnhancedTemplate extends CredentialTemplate {
	stats?: TemplateStats
	isPopular?: boolean
	isRecent?: boolean
	category?: string
}

/**
 * Enhanced Template Selector Component with Analytics and Bulk Selection
 * 
 * Features:
 * - Advanced template search and filtering
 * - Template analytics and usage statistics
 * - Bulk template selection for batch operations
 * - Popular and recommended templates highlighting
 * - Category-based organization
 * - Template preview and detailed information
 */
export function TemplateSelector({
	selectedTemplate,
	onTemplateSelect,
	onCreateCustom,
	className = '',
	showAnalytics = false,
	enableBulkSelection = false,
	selectedTemplates = [],
	onBulkSelectionChange,
}: TemplateSelectorProps) {
	const [templates, setTemplates] = useState<EnhancedTemplate[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent' | 'rating'>('name')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [filters, setFilters] = useState<TemplateFilters>({
		page: 1,
		limit: 100, // Load all for better UX
		active: true,
	})

	// Load templates with enhanced data
	useEffect(() => {
		const loadTemplates = async () => {
			try {
				setLoading(true)
				setError(null)

				const response = await templateService.listTemplates({
					...filters,
					search: searchTerm || undefined,
					type: selectedCategory !== 'all' ? selectedCategory : undefined,
				})

				// Enhance templates with analytics data if enabled
				const enhancedTemplates: EnhancedTemplate[] = await Promise.all(
					response.templates.map(async (template) => {
						let stats: TemplateStats | undefined

						if (showAnalytics) {
							try {
								const usageStats = await templateService.getTemplateUsageStats(template.id)
								stats = {
									usageCount: usageStats.totalCredentials || 0,
									recentUsage: usageStats.usageThisWeek || 0,
									lastUsed: usageStats.lastUsed,
								}
							} catch {
								// Fallback to basic stats
								stats = {
									usageCount: 0,
									recentUsage: 0,
								}
							}
						}

						return {
							...template,
							stats,
							category: (template.metadata?.category as string) || 'Other',
							isPopular: stats ? stats.usageCount > 10 : false,
							isRecent: template.updatedAt ? 
								new Date(template.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : 
								false,
						}
					})
				)

				setTemplates(enhancedTemplates)
			} catch (err) {
				console.error('Error loading templates:', err)
				setError('Failed to load templates')
				toast.error('Failed to load templates')
			} finally {
				setLoading(false)
			}
		}

		loadTemplates()
	}, [filters, searchTerm, selectedCategory, showAnalytics])

	// Get template icon based on type/category
	const getTemplateIcon = (template: EnhancedTemplate) => {
		const category = template.category?.toLowerCase() || ''
		const types = template.type.join(' ').toLowerCase()

		if (category.includes('education') || types.includes('degree') || types.includes('certificate')) {
			return <GraduationCap className="h-5 w-5" />
		}
		if (category.includes('employment') || types.includes('employment') || types.includes('job')) {
			return <Briefcase className="h-5 w-5" />
		}
		if (category.includes('identity') || types.includes('identity') || types.includes('id')) {
			return <User className="h-5 w-5" />
		}
		if (category.includes('license') || types.includes('license')) {
			return <Shield className="h-5 w-5" />
		}
		if (category.includes('achievement') || category.includes('award')) {
			return <Award className="h-5 w-5" />
		}
		return <FileText className="h-5 w-5" />
	}

	// Get unique categories
	const getCategories = () => {
		const categories = new Set<string>()
		templates.forEach((template) => {
			if (template.category) {
				categories.add(template.category)
			}
		})
		return Array.from(categories).sort()
	}

	// Filter and sort templates
	const getFilteredAndSortedTemplates = () => {
		let filtered = templates.filter((template) => {
			const matchesSearch = !searchTerm || 
				template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase()))

			const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

			return matchesSearch && matchesCategory
		})

		// Sort templates
		filtered.sort((a, b) => {
			let comparison = 0

			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name)
					break
				case 'usage':
					comparison = (a.stats?.usageCount || 0) - (b.stats?.usageCount || 0)
					break
				case 'recent':
					comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
					break
				case 'rating':
					comparison = (a.stats?.averageRating || 0) - (b.stats?.averageRating || 0)
					break
			}

			return sortOrder === 'desc' ? -comparison : comparison
		})

		return filtered
	}

	// Handle template selection
	const handleTemplateSelect = (template: CredentialTemplate) => {
		if (enableBulkSelection) {
			const isSelected = selectedTemplates.some(t => t.id === template.id)
			let newSelection: CredentialTemplate[]

			if (isSelected) {
				newSelection = selectedTemplates.filter(t => t.id !== template.id)
			} else {
				newSelection = [...selectedTemplates, template]
			}

			onBulkSelectionChange?.(newSelection)
		} else {
			onTemplateSelect(selectedTemplate?.id === template.id ? null : template)
		}
	}

	// Handle bulk select all
	const handleSelectAll = () => {
		if (!enableBulkSelection) return

		const filteredTemplates = getFilteredAndSortedTemplates()
		const allSelected = filteredTemplates.every(t => 
			selectedTemplates.some(st => st.id === t.id)
		)

		if (allSelected) {
			// Deselect all filtered templates
			const newSelection = selectedTemplates.filter(st => 
				!filteredTemplates.some(ft => ft.id === st.id)
			)
			onBulkSelectionChange?.(newSelection)
		} else {
			// Select all filtered templates
			const templatesToAdd = filteredTemplates.filter(ft => 
				!selectedTemplates.some(st => st.id === ft.id)
			)
			onBulkSelectionChange?.([...selectedTemplates, ...templatesToAdd])
		}
	}

	const filteredTemplates = getFilteredAndSortedTemplates()
	const categories = getCategories()

	if (loading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Select Template</CardTitle>
					<CardDescription>Loading templates...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-20 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Select Template</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Select Template</span>
					{enableBulkSelection && (
						<Badge variant="outline">
							{selectedTemplates.length} selected
						</Badge>
					)}
				</CardTitle>
				<CardDescription>
					{enableBulkSelection 
						? 'Select multiple templates for bulk operations'
						: 'Choose a template for credential issuance'
					}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Search and Filters */}
				<div className="space-y-3">
					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search templates..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Filters Row */}
					<div className="flex gap-2 flex-wrap">
						{/* Category Filter */}
						<Select value={selectedCategory} onValueChange={setSelectedCategory}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{categories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Sort By */}
						<Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
							<SelectTrigger className="w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="name">Name</SelectItem>
								{showAnalytics && (
									<>
										<SelectItem value="usage">Usage</SelectItem>
										<SelectItem value="rating">Rating</SelectItem>
									</>
								)}
								<SelectItem value="recent">Updated</SelectItem>
							</SelectContent>
						</Select>

						{/* Sort Order */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
						>
							{sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
						</Button>

						{/* Bulk Select All */}
						{enableBulkSelection && filteredTemplates.length > 0 && (
							<Button variant="outline" size="sm" onClick={handleSelectAll}>
								{filteredTemplates.every(t => selectedTemplates.some(st => st.id === t.id))
									? 'Deselect All'
									: 'Select All'
								}
							</Button>
						)}
					</div>
				</div>

				{/* Templates List */}
				<ScrollArea className="h-[400px] w-full">
					{filteredTemplates.length === 0 ? (
						<div className="text-center py-12">
							<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">No templates found</h3>
							<p className="text-muted-foreground mb-4">
								{searchTerm || selectedCategory !== 'all'
									? 'No templates match your current filters.'
									: 'No templates are available.'}
							</p>
							{onCreateCustom && (
								<Button onClick={onCreateCustom} variant="outline">
									<FileText className="h-4 w-4 mr-2" />
									Create Custom Template
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-3">
							{filteredTemplates.map((template) => {
								const isSelected = enableBulkSelection
									? selectedTemplates.some(t => t.id === template.id)
									: selectedTemplate?.id === template.id

								return (
									<Card
										key={template.id}
										className={`cursor-pointer transition-all hover:shadow-md ${
											isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
										}`}
										onClick={() => handleTemplateSelect(template)}
									>
										<CardContent className="p-4">
											<div className="flex items-start gap-3">
												{/* Icon */}
												<div className="flex-shrink-0 mt-1">
													{getTemplateIcon(template)}
												</div>

												{/* Content */}
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-2">
														<div className="flex-1">
															<h4 className="font-semibold text-sm line-clamp-1">
																{template.name}
															</h4>
															<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
																{template.description}
															</p>
														</div>

														{/* Selection Indicator */}
														{isSelected && (
															<Check className="h-5 w-5 text-primary flex-shrink-0" />
														)}
													</div>

													{/* Badges and Stats */}
													<div className="flex items-center gap-2 mt-3 flex-wrap">
														{/* Category */}
														{template.category && (
															<Badge variant="secondary" className="text-xs">
																{template.category}
															</Badge>
														)}

														{/* Popular Badge */}
														{template.isPopular && (
															<Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
																<Star className="h-3 w-3 mr-1" />
																Popular
															</Badge>
														)}

														{/* Recent Badge */}
														{template.isRecent && (
															<Badge variant="default" className="text-xs bg-green-100 text-green-800">
																<Clock className="h-3 w-3 mr-1" />
																Recent
															</Badge>
														)}

														{/* Analytics Stats */}
														{showAnalytics && template.stats && (
															<>
																{template.stats.usageCount > 0 && (
																	<Badge variant="outline" className="text-xs">
																		<TrendingUp className="h-3 w-3 mr-1" />
																		{template.stats.usageCount} uses
																	</Badge>
																)}
																{template.stats.averageRating && (
																	<Badge variant="outline" className="text-xs">
																		<Star className="h-3 w-3 mr-1" />
																		{template.stats.averageRating.toFixed(1)}
																	</Badge>
																)}
															</>
														)}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})}
						</div>
					)}
				</ScrollArea>

				{/* Custom Template Option */}
				{onCreateCustom && !enableBulkSelection && (
					<div className="pt-3 border-t">
						<Button
							variant="outline"
							onClick={onCreateCustom}
							className="w-full"
						>
							<FileText className="h-4 w-4 mr-2" />
							Create Custom Credential (No Template)
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
