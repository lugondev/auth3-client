'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
import {Search, Plus, MoreHorizontal, Edit, Trash2, Download, Upload, Eye, BarChart3, Filter, GitBranch} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate, TemplateFilters, UpdateTemplateRequest} from '@/types/template'
import {templateService} from '@/services/templateService'
import {TemplateCreateModal} from './TemplateCreateModal'
import {TemplateEditForm} from './TemplateEditForm'
import {TemplatePreview} from './TemplatePreview'
import {TemplateUsageStats} from './TemplateUsageStats'
import {TemplateImportModal} from './TemplateImportModal'

interface TemplateManagerProps {
	className?: string
}

export function TemplateManager({className}: TemplateManagerProps) {
	const [templates, setTemplates] = useState<CredentialTemplate[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null)
	const [filters, setFilters] = useState<TemplateFilters>({
		page: 1,
		limit: 10,
		search: '',
	})
	const [totalCount, setTotalCount] = useState(0)

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [showPreviewModal, setShowPreviewModal] = useState(false)
	const [showStatsModal, setShowStatsModal] = useState(false)
	const [showImportModal, setShowImportModal] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [templateToDelete, setTemplateToDelete] = useState<CredentialTemplate | null>(null)

	const loadTemplates = useCallback(async () => {
		try {
			setLoading(true)
			const response = await templateService.listTemplates(filters)
			setTemplates(response.templates)
			setTotalCount(response.total)
		} catch (error) {
			toast.error('Failed to load templates')
			console.error('Error loading templates:', error)
		} finally {
			setLoading(false)
		}
	}, [filters])

	useEffect(() => {
		loadTemplates()
	}, [filters, loadTemplates])

	const handleSearchChange = (value: string) => {
		setFilters((prev) => ({...prev, search: value, page: 1}))
	}

	const handlePageChange = (page: number) => {
		setFilters((prev) => ({...prev, page}))
	}

	const handleEdit = (template: CredentialTemplate) => {
		setSelectedTemplate(template)
		setShowEditModal(true)
	}

	const handlePreview = (template: CredentialTemplate) => {
		setSelectedTemplate(template)
		setShowPreviewModal(true)
	}

	const handleStats = (template: CredentialTemplate) => {
		setSelectedTemplate(template)
		setShowStatsModal(true)
	}

	const handleDelete = (template: CredentialTemplate) => {
		setTemplateToDelete(template)
		setShowDeleteDialog(true)
	}

	const confirmDelete = async () => {
		if (!templateToDelete) return

		try {
			await templateService.deleteTemplate(templateToDelete.id)
			toast.success('Template deleted successfully')
			loadTemplates()
		} catch (error) {
			toast.error('Failed to delete template')
			console.error('Error deleting template:', error)
		} finally {
			setShowDeleteDialog(false)
			setTemplateToDelete(null)
		}
	}

	const handleExport = async (template: CredentialTemplate, format: 'json' | 'yaml' = 'json') => {
		try {
			await templateService.downloadTemplateExport(template.id, format)
			toast.success('Template exported successfully')
		} catch (error) {
			toast.error('Failed to export template')
			console.error('Error exporting template:', error)
		}
	}

	const handleVersions = (template: CredentialTemplate) => {
		// Navigate to versions page or show versions modal
		console.log('Show versions for template:', template.name)
	}

	const totalPages = Math.ceil(totalCount / (filters.limit || 10))

	return (
		<div className={className}>
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle>Credential Templates</CardTitle>
							<CardDescription>Manage your verifiable credential templates</CardDescription>
						</div>
						<div className='flex gap-2'>
							<Button variant='outline' onClick={() => setShowImportModal(true)}>
								<Upload className='h-4 w-4 mr-2' />
								Import
							</Button>
							<Button onClick={() => setShowCreateModal(true)}>
								<Plus className='h-4 w-4 mr-2' />
								Create Template
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Search and Filters */}
					<div className='flex items-center gap-4 mb-6'>
						<div className='relative flex-1'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input placeholder='Search templates...' value={filters.search || ''} onChange={(e) => handleSearchChange(e.target.value)} className='pl-10' />
						</div>
						<Button variant='outline' size='sm'>
							<Filter className='h-4 w-4 mr-2' />
							Filters
						</Button>
					</div>

					{/* Templates Table */}
					<div className='border rounded-lg'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Version</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className='text-center py-8'>
											Loading templates...
										</TableCell>
									</TableRow>
								) : templates.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className='text-center py-8'>
											No templates found
										</TableCell>
									</TableRow>
								) : (
									templates.map((template) => (
										<TableRow key={template.id}>
											<TableCell>
												<div>
													<div className='font-medium'>{template.name}</div>
													<div className='text-sm text-muted-foreground'>{template.description}</div>
												</div>
											</TableCell>
											<TableCell>
												<div className='flex flex-wrap gap-1'>
													{template.type.map((type, index) => (
														<Badge key={index} variant='secondary' className='text-xs'>
															{type}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell>{template.version}</TableCell>
											<TableCell>
												<Badge variant={template.active ? 'default' : 'secondary'}>{template.active ? 'Active' : 'Inactive'}</Badge>
											</TableCell>
											<TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant='ghost' size='sm'>
															<MoreHorizontal className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align='end'>
														<DropdownMenuLabel>Actions</DropdownMenuLabel>
														<DropdownMenuSeparator />
														<DropdownMenuItem onClick={() => handlePreview(template)}>
															<Eye className='h-4 w-4 mr-2' />
															Preview
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleEdit(template)}>
															<Edit className='h-4 w-4 mr-2' />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleStats(template)}>
															<BarChart3 className='h-4 w-4 mr-2' />
															Usage Stats
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleVersions(template)}>
															<GitBranch className='h-4 w-4 mr-2' />
															Versions
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem onClick={() => handleExport(template, 'json')}>
															<Download className='h-4 w-4 mr-2' />
															Export JSON
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleExport(template, 'yaml')}>
															<Download className='h-4 w-4 mr-2' />
															Export YAML
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem onClick={() => handleDelete(template)} className='text-destructive'>
															<Trash2 className='h-4 w-4 mr-2' />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className='flex items-center justify-between mt-4'>
							<div className='text-sm text-muted-foreground'>
								Showing {((filters.page || 1) - 1) * (filters.limit || 10) + 1} to {Math.min((filters.page || 1) * (filters.limit || 10), totalCount)} of {totalCount} templates
							</div>
							<div className='flex gap-2'>
								<Button variant='outline' size='sm' onClick={() => handlePageChange((filters.page || 1) - 1)} disabled={filters.page === 1}>
									Previous
								</Button>
								<Button variant='outline' size='sm' onClick={() => handlePageChange((filters.page || 1) + 1)} disabled={filters.page === totalPages}>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modals */}
			<TemplateCreateModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={loadTemplates} />

			<Dialog open={showEditModal} onOpenChange={setShowEditModal}>
				<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Edit Template</DialogTitle>
						<DialogDescription>Update the template configuration</DialogDescription>
					</DialogHeader>
					{selectedTemplate && (
						<TemplateEditForm
							template={selectedTemplate}
							onSubmit={async (updateData: UpdateTemplateRequest) => {
								await templateService.updateTemplate(selectedTemplate.id, updateData)
								setShowEditModal(false)
								loadTemplates()
							}}
							onCancel={() => setShowEditModal(false)}
						/>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
				<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Template Preview</DialogTitle>
						<DialogDescription>Preview the template structure and schema</DialogDescription>
					</DialogHeader>
					{selectedTemplate && <TemplatePreview template={selectedTemplate} onExport={() => handleExport(selectedTemplate)} onClose={() => setShowPreviewModal(false)} />}
				</DialogContent>
			</Dialog>

			<Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
				<DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Template Usage Statistics</DialogTitle>
						<DialogDescription>View usage metrics for this template</DialogDescription>
					</DialogHeader>
					{selectedTemplate && <TemplateUsageStats templateId={selectedTemplate.id} templateName={selectedTemplate.name} onClose={() => setShowStatsModal(false)} />}
				</DialogContent>
			</Dialog>

			<TemplateImportModal
				open={showImportModal}
				onClose={() => setShowImportModal(false)}
				onImportSuccess={() => {
					setShowImportModal(false)
					loadTemplates()
				}}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Template</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone and may affect issued credentials.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
