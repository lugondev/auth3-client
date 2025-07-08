'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Label} from '@/components/ui/label'
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
	SortAsc,
	SortDesc,
	Plus,
	Grid3x3,
	List,
	MoreHorizontal,
} from 'lucide-react'
import {toast} from 'sonner'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
	viewMode?: 'grid' | 'list'
	compactMode?: boolean
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
 * - Grid/List view modes with compact option
 * - Popular and recommended templates highlighting
 * - Template preview and detailed information
 * - Custom credential creation option
 * - Responsive design with mobile optimization
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
	viewMode: initialViewMode = 'grid',
	compactMode = false,
}: TemplateSelectorProps) {
	const [templates, setTemplates] = useState<EnhancedTemplate[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
	const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent' | 'rating'>('name')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
	const [loadingStats, setLoadingStats] = useState(false)
	const [statsCache, setStatsCache] = useState<Record<string, TemplateStats>>({})
	const [filters] = useState<TemplateFilters>({
		page: 1,
		limit: 100, // Load all for better UX
		active: true,
	})

	// Debounce search term to avoid excessive API calls
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm)
		}, 300) // Wait 300ms after user stops typing

		return () => clearTimeout(timer)
	}, [searchTerm])

	// Load templates without stats first for faster initial render
	useEffect(() => {
		const loadTemplates = async () => {
			try {
				setLoading(true)
				setError(null)

				const response = await templateService.listTemplates({
					...filters,
					search: debouncedSearchTerm || undefined,
				})

				// Create basic enhanced templates without stats first
				const basicEnhancedTemplates: EnhancedTemplate[] = response.templates.map((template) => ({
					...template,
					category: (template.metadata?.category as string) || 'Other',
					isRecent: template.updatedAt ? 
						new Date(template.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : 
						false,
				}))

				setTemplates(basicEnhancedTemplates)
			} catch (err) {
				console.error('Error loading templates:', err)
				setError('Failed to load templates')
				toast.error('Failed to load templates')
			} finally {
				setLoading(false)
			}
		}

		loadTemplates()
	}, [filters, debouncedSearchTerm])

	// Load analytics data separately if enabled to avoid blocking initial render
	useEffect(() => {
		if (!showAnalytics || templates.length === 0) return

		const loadAnalyticsData = async () => {
			try {
				setLoadingStats(true)

				// Load stats for templates that aren't already cached
				const templatesToLoadStats = templates.filter(template => !statsCache[template.id])
				
				if (templatesToLoadStats.length === 0) {
					// All stats already cached, just update templates
					const updatedTemplates = templates.map(template => ({
						...template,
						stats: statsCache[template.id],
						isPopular: statsCache[template.id] ? statsCache[template.id].usageCount > 10 : false,
					}))
					setTemplates(updatedTemplates)
					return
				}

				// Batch load stats with delay to avoid overwhelming the server
				const newStatsCache = { ...statsCache }
				const batchSize = 5 // Process 5 templates at a time
				
				for (let i = 0; i < templatesToLoadStats.length; i += batchSize) {
					const batch = templatesToLoadStats.slice(i, i + batchSize)
					
					const batchPromises = batch.map(async (template) => {
						try {
							const usageStats = await templateService.getTemplateUsageStats(template.id)
							const stats: TemplateStats = {
								usageCount: usageStats.totalCredentials || 0,
								recentUsage: usageStats.usageThisWeek || 0,
								lastUsed: usageStats.lastUsed,
							}
							newStatsCache[template.id] = stats
							return { templateId: template.id, stats }
						} catch (error) {
							console.warn(`Failed to load stats for template ${template.id}:`, error)
							// Fallback to basic stats
							const fallbackStats: TemplateStats = {
								usageCount: 0,
								recentUsage: 0,
							}
							newStatsCache[template.id] = fallbackStats
							return { templateId: template.id, stats: fallbackStats }
						}
					})

					await Promise.all(batchPromises)
					
					// Add delay between batches to avoid overwhelming the server
					if (i + batchSize < templatesToLoadStats.length) {
						await new Promise(resolve => setTimeout(resolve, 200))
					}
				}

				// Update cache
				setStatsCache(newStatsCache)

				// Update templates with stats
				const enhancedTemplates = templates.map(template => ({
					...template,
					stats: newStatsCache[template.id],
					isPopular: newStatsCache[template.id] ? newStatsCache[template.id].usageCount > 10 : false,
				}))

				setTemplates(enhancedTemplates)
			} catch (error) {
				console.error('Error loading analytics data:', error)
				// Don't show error toast for analytics failures
			} finally {
				setLoadingStats(false)
			}
		}

		// Add small delay to allow initial render to complete
		const timeoutId = setTimeout(loadAnalyticsData, 100)
		return () => clearTimeout(timeoutId)
	}, [templates.length, showAnalytics, statsCache])

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

	// Filter and sort templates with client-side search for better UX
	const getFilteredAndSortedTemplates = () => {
		const filtered = templates.filter((template) => {
			// Use immediate searchTerm for client-side filtering (responsive UI)
			const matchesSearch = !searchTerm || 
				template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
				(template.type && template.type.some(type => type.toLowerCase().includes(searchTerm.toLowerCase())))

			return matchesSearch
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

	// Render template card based on view mode
	const renderTemplateCard = (template: EnhancedTemplate) => {
		const isSelected = enableBulkSelection
			? selectedTemplates.some(t => t.id === template.id)
			: selectedTemplate?.id === template.id

		const cardClasses = `cursor-pointer transition-all hover:shadow-md ${
			isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
		} ${compactMode ? 'p-3' : 'p-4'}`

		if (viewMode === 'list') {
			return (
				<Card
					key={template.id}
					className={cardClasses}
					onClick={() => handleTemplateSelect(template)}
				>
					<CardContent className={compactMode ? 'p-3' : 'p-4'}>
						<div className="flex items-center gap-4">
							{/* Icon */}
							<div className="flex-shrink-0">
								{getTemplateIcon(template)}
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<div className="flex-1">
										<h4 className={`font-semibold ${compactMode ? 'text-sm' : 'text-base'} line-clamp-1`}>
											{template.name}
										</h4>
										<p className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'} line-clamp-1 mt-1`}>
											{template.description}
										</p>
									</div>

									{/* Selection Indicator */}
									{isSelected && (
										<Check className="h-5 w-5 text-primary flex-shrink-0" />
									)}
								</div>

								{/* Badges and Stats - Horizontal layout for list view */}
								<div className="flex items-center gap-2 mt-2 flex-wrap">
									{template.category && (
										<Badge variant="secondary" className="text-xs">
											{template.category}
										</Badge>
									)}

									{template.isPopular && (
										<Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
											<Star className="h-3 w-3 mr-1" />
											Popular
										</Badge>
									)}

									{showAnalytics && template.stats && template.stats.usageCount > 0 && (
										<Badge variant="outline" className="text-xs">
											<TrendingUp className="h-3 w-3 mr-1" />
											{template.stats.usageCount} uses
										</Badge>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)
		}

		// Grid view (default)
		return (
			<Card
				key={template.id}
				className={cardClasses}
				onClick={() => handleTemplateSelect(template)}
			>
				<CardContent className={compactMode ? 'p-3' : 'p-4'}>
					<div className="flex items-start gap-3">
						{/* Icon */}
						<div className="flex-shrink-0 mt-1">
							{getTemplateIcon(template)}
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1">
									<h4 className={`font-semibold ${compactMode ? 'text-sm' : 'text-base'} line-clamp-1`}>
										{template.name}
									</h4>
									<p className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'} line-clamp-2 mt-1`}>
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
								{template.category && (
									<Badge variant="secondary" className="text-xs">
										{template.category}
									</Badge>
								)}

								{template.isPopular && (
									<Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
										<Star className="h-3 w-3 mr-1" />
										Popular
									</Badge>
								)}

								{template.isRecent && (
									<Badge variant="default" className="text-xs bg-green-100 text-green-800">
										<Clock className="h-3 w-3 mr-1" />
										Recent
									</Badge>
								)}

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

							{/* Schema fields preview for grid view */}
							{!compactMode && template.schema && typeof template.schema === 'object' && (
								<div className="mt-3">
									<Label className="text-xs text-muted-foreground">
										Fields ({Object.keys(template.schema).length})
									</Label>
									<div className="flex flex-wrap gap-1 mt-1">
										{Object.keys(template.schema)
											.slice(0, 3)
											.map((field, index) => (
												<Badge key={index} variant="outline" className="text-xs">
													{field}
												</Badge>
											))}
										{Object.keys(template.schema).length > 3 && (
											<Badge variant="outline" className="text-xs">
												+{Object.keys(template.schema).length - 3}
											</Badge>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

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
			<CardHeader className={compactMode ? 'pb-4' : 'pb-6'}>
				<CardTitle className="flex items-center justify-between">
					<span>{compactMode ? 'Templates' : 'Select Template'}</span>
					<div className="flex items-center gap-2">
						{enableBulkSelection && (
							<Badge variant="outline">
								{selectedTemplates.length} selected
							</Badge>
						)}
						
						{/* Analytics Loading Indicator */}
						{showAnalytics && loadingStats && (
							<Badge variant="outline" className="bg-blue-50 text-blue-700">
								Loading stats...
							</Badge>
						)}
						
						{/* View Mode Toggle */}
						<div className="flex items-center border rounded-md">
							<Button
								variant={viewMode === 'grid' ? 'default' : 'ghost'}
								size="sm"
								className="rounded-r-none"
								onClick={() => setViewMode('grid')}
							>
								<Grid3x3 className="h-4 w-4" />
							</Button>
							<Button
								variant={viewMode === 'list' ? 'default' : 'ghost'}
								size="sm"
								className="rounded-l-none"
								onClick={() => setViewMode('list')}
							>
								<List className="h-4 w-4" />
							</Button>
						</div>

						{/* More Options */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
									Switch to {viewMode === 'grid' ? 'List' : 'Grid'} View
								</DropdownMenuItem>
								{showAnalytics && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => {
											setStatsCache({})
											toast.success('Analytics cache cleared')
										}}>
											Refresh Analytics
										</DropdownMenuItem>
									</>
								)}
								<DropdownMenuSeparator />
								{onCreateCustom && (
									<DropdownMenuItem onClick={onCreateCustom}>
										<Plus className="h-4 w-4 mr-2" />
										Create Custom
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardTitle>
				{!compactMode && (
					<CardDescription>
						{enableBulkSelection 
							? 'Select multiple templates for bulk operations'
							: 'Choose a template for credential issuance or create a custom one'
						}
					</CardDescription>
				)}
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
						{/* Show loading indicator when server search is pending */}
						{searchTerm !== debouncedSearchTerm && searchTerm.length > 0 && (
							<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
								<div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
							</div>
						)}
					</div>

					{/* Filters Row */}
					<div className="flex gap-2 flex-wrap">
						{/* Sort By */}
						<Select value={sortBy} onValueChange={(value: 'name' | 'usage' | 'recent' | 'rating') => setSortBy(value)}>
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
				<ScrollArea className={compactMode ? "h-[300px] w-full" : "h-[500px] w-full"}>
					{filteredTemplates.length === 0 ? (
						<div className="text-center py-12">
							<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">No templates found</h3>
							<p className="text-muted-foreground mb-4">
								{searchTerm
									? 'No templates match your current search.'
									: 'No templates are available.'}
							</p>
							{onCreateCustom && (
								<Button onClick={onCreateCustom} variant="outline">
									<Plus className="h-4 w-4 mr-2" />
									Create Custom Template
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{/* Custom Template Option */}
							{onCreateCustom && !enableBulkSelection && (
								<Card
									className={`cursor-pointer transition-all hover:shadow-md border-dashed ${
										!selectedTemplate ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
									}`}
									onClick={() => onTemplateSelect(null)}
								>
									<CardContent className={compactMode ? 'p-3' : 'p-4'}>
										<div className="flex items-center gap-3">
											<div className="p-2 bg-primary/10 rounded-lg">
												<Plus className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1">
												<h4 className={`font-semibold ${compactMode ? 'text-sm' : 'text-base'}`}>
													Custom Credential
												</h4>
												<p className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'} mt-1`}>
													Create a credential with custom fields and structure
												</p>
											</div>
											{!selectedTemplate && (
												<Check className="h-5 w-5 text-primary" />
											)}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Templates Grid/List */}
							<div className={`${
								viewMode === 'grid' 
									? `grid ${compactMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-3`
									: 'space-y-2'
							}`}>
								{filteredTemplates.map(renderTemplateCard)}
							</div>
						</div>
					)}
				</ScrollArea>

				{/* Selected Template Details */}
				{selectedTemplate && !compactMode && (
					<Card className="mt-4 bg-muted/50">
						<CardHeader className="pb-3">
							<CardTitle className="text-base flex items-center gap-2">
								{getTemplateIcon(selectedTemplate)}
								Selected: {selectedTemplate.name}
							</CardTitle>
							<CardDescription>
								{selectedTemplate.description}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{/* Template Schema */}
								{selectedTemplate.schema && typeof selectedTemplate.schema === 'object' && (
									<div>
										<Label className="text-sm font-medium">Schema Fields</Label>
										<div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
											{Object.entries(selectedTemplate.schema).map(([fieldName, field]) => (
												<div key={fieldName} className="text-sm">
													<span className="font-medium">{fieldName}</span>
													<span className="text-muted-foreground ml-1">
														({typeof field === 'object' && field !== null ? 'object' : typeof field})
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Template Context */}
								{selectedTemplate['@context'] && (
									<div>
										<Label className="text-sm font-medium">Context</Label>
										<div className="flex flex-wrap gap-1 mt-1">
											{selectedTemplate['@context'].map((context, index) => (
												<Badge key={index} variant="outline" className="text-xs font-mono">
													{context}
												</Badge>
											))}
										</div>
									</div>
								)}

								{/* Template Type */}
								<div>
									<Label className="text-sm font-medium">Type</Label>
									<div className="flex flex-wrap gap-1 mt-1">
										{selectedTemplate.type.map((type, index) => (
											<Badge key={index} variant="secondary" className="text-xs">
												{type}
											</Badge>
										))}
									</div>
								</div>

								{/* Template Tags */}
								{selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
									<div>
										<Label className="text-sm font-medium">Tags</Label>
										<div className="flex flex-wrap gap-1 mt-1">
											{selectedTemplate.tags.map((tag, index) => (
												<Badge key={index} variant="outline" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</CardContent>
		</Card>
	)
}
