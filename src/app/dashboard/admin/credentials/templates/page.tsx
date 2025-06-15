'use client'

import React, {useState, useEffect} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription} from '@/components/ui/dialog'
import {Plus} from 'lucide-react'
import {listTemplates, getCredentialStatistics, deleteTemplate, CredentialStatistics} from '@/services/vcService'
import type {CredentialTemplate} from '@/types/credentials'

// Import components
import {TemplateStatistics} from './components/TemplateStatistics'
import {TemplateFilters} from './components/TemplateFilters'
import {TemplateList} from './components/TemplateList'
import {CreateTemplateForm} from './components/CreateTemplateForm'
import {Pagination} from './components/Pagination'

// Template display interface
interface TemplateDisplay {
	id: string
	name: string
	type: string[]
	version?: string
	status: 'active' | 'draft' | 'inactive'
	createdAt: string
	updatedAt: string
	usageCount?: number
	fields: string[]
	description: string
	category?: string
}

// Template statistics interface
interface TemplateStats {
	totalTemplates: number
	activeTemplates: number
	draftTemplates: number
	totalUsage: number
	recentActivity: number
}

export default function TemplatesManagementPage() {
	// State management
	const [templates, setTemplates] = useState<TemplateDisplay[]>([])
	const [stats, setStats] = useState<TemplateStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

	// Filter and search states
	const [searchTerm, setSearchTerm] = useState('')
	const [filterType, setFilterType] = useState('all')
	const [filterStatus, setFilterStatus] = useState('all')

	// Pagination states
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [itemsPerPage] = useState(9)

	// Transform API template to display format
	const transformTemplate = (template: CredentialTemplate): TemplateDisplay => {
		return {
			id: template.id,
			name: template.name,
			type: template.type,
			version: template.version || '1.0',
			status: template.isActive ? 'active' : 'draft',
			createdAt: new Date(template.createdAt).toLocaleDateString(),
			updatedAt: new Date(template.updatedAt).toLocaleDateString(),
			usageCount: template.issuanceCount || 0,
			fields: template.subjectSchema && typeof template.subjectSchema === 'object' ? Object.keys(template.subjectSchema.properties || {}) : [],
			description: template.description,
			category: template.category,
		}
	}

	// Transform credential statistics to template stats
	const transformStats = (credStats: CredentialStatistics, templateCount: number): TemplateStats => {
		return {
			totalTemplates: templateCount,
			activeTemplates: Math.floor(templateCount * 0.8), // Estimate active templates
			draftTemplates: Math.floor(templateCount * 0.2), // Estimate draft templates
			totalUsage: credStats.totalCredentials,
			recentActivity: credStats.issuedToday,
		}
	}

	/**
	 * Load templates and statistics data with optimized async/await pattern
	 * Handles error states and loading states efficiently
	 */
	const loadData = async () => {
		setIsLoading(true)
		setError(null)

		try {
			// Load templates with current filters and pagination
			const templatesResponse = await listTemplates({
				page: page,
				limit: itemsPerPage,
				search: searchTerm,
				type: filterType !== 'all' ? filterType : undefined,
				status: filterStatus !== 'all' ? filterStatus : undefined,
			})

			// Transform and set templates data
			const transformedTemplates = templatesResponse.templates.map(transformTemplate)
			setTemplates(transformedTemplates)
			setTotalPages(Math.ceil(templatesResponse.total / itemsPerPage))

			// Load statistics in parallel for better performance
			const statsResponse = await getCredentialStatistics()
			const transformedStats = transformStats(statsResponse, templatesResponse.total)
			setStats(transformedStats)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An error occurred while loading data'
			setError(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	// Load data on component mount and page change
	useEffect(() => {
		loadData()
	}, [page, searchTerm, filterType, filterStatus])

	/**
	 * Handle template deletion with proper error handling and data refresh
	 */
	const handleDeleteTemplate = async (templateId: string) => {
		try {
			await deleteTemplate(templateId)
			// Reload data after successful deletion
			await loadData()
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
			setError(errorMessage)
		}
	}

	const filteredTemplates = templates.filter((template) => {
		const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || template.type.some((type) => type.toLowerCase().includes(searchTerm.toLowerCase()))
		const matchesType = filterType === 'all' || template.type.some((type) => type.toLowerCase() === filterType.toLowerCase())
		const matchesStatus = filterStatus === 'all' || template.status === filterStatus
		return matchesSearch && matchesType && matchesStatus
	})

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Template Management</h1>
					<p className='text-muted-foreground'>Manage credential templates for your organization</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className='w-4 h-4 mr-2' />
							Create Template
						</Button>
					</DialogTrigger>
					<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
						<DialogHeader>
							<DialogTitle>Create New Template</DialogTitle>
							<DialogDescription>Create a new credential template for your organization</DialogDescription>
						</DialogHeader>
						<CreateTemplateForm onClose={() => setIsCreateDialogOpen(false)} onSuccess={loadData} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Statistics */}
			<TemplateStatistics stats={stats} loading={isLoading} />

			{/* Filters */}
			<TemplateFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterType={filterType} setFilterType={setFilterType} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />

			{/* Templates List */}
			<TemplateList templates={filteredTemplates} isLoading={isLoading} error={error} onDeleteTemplate={handleDeleteTemplate} />

			{/* Pagination */}
			{totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
		</div>
	)
}
