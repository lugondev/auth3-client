'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TemplateCard } from './TemplateCard'

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

interface TemplateListProps {
	templates: TemplateDisplay[]
	isLoading: boolean
	error: string | null
	onDeleteTemplate: (id: string) => void
	onEditTemplate?: (template: TemplateDisplay) => void
	onViewTemplate?: (template: TemplateDisplay) => void
	onCopyTemplate?: (template: TemplateDisplay) => void
	onDownloadTemplate?: (template: TemplateDisplay) => void
}

export function TemplateList({
	templates,
	isLoading,
	error,
	onDeleteTemplate,
	onEditTemplate,
	onViewTemplate,
	onCopyTemplate,
	onDownloadTemplate,
}: TemplateListProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Templates</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="border rounded-lg p-4">
								<div className="animate-pulse">
									<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-1/2"></div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Templates</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<div className="text-red-600 mb-2">Error loading templates</div>
						<div className="text-sm text-gray-500">{error}</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (templates.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Templates</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<div className="text-gray-500 mb-2">No templates found</div>
						<div className="text-sm text-gray-400">
							Create your first template to get started
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Templates ({templates.length})</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{templates.map((template) => (
						<TemplateCard
							key={template.id}
							template={template}
							onDelete={onDeleteTemplate}
							onEdit={onEditTemplate}
							onView={onViewTemplate}
							onCopy={onCopyTemplate}
							onDownload={onDownloadTemplate}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	)
}