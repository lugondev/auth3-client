'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Copy, Eye, Download, CheckCircle, XCircle, Clock } from 'lucide-react'

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

interface TemplateCardProps {
	template: TemplateDisplay
	onDelete: (id: string) => void
	onEdit?: (template: TemplateDisplay) => void
	onView?: (template: TemplateDisplay) => void
	onCopy?: (template: TemplateDisplay) => void
	onDownload?: (template: TemplateDisplay) => void
}

export function TemplateCard({ 
	template, 
	onDelete, 
	onEdit, 
	onView, 
	onCopy, 
	onDownload 
}: TemplateCardProps) {
	const getStatusBadge = (status: 'active' | 'draft' | 'inactive') => {
		const statusConfig = {
			active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
			draft: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
			inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
		}
		const config = statusConfig[status] || statusConfig.draft
		const Icon = config.icon
		return (
			<Badge className={`${config.color} flex items-center gap-1`}>
				<Icon className="w-3 h-3" />
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		)
	}

	return (
		<div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						<h3 className="font-semibold text-lg">{template.name}</h3>
						{getStatusBadge(template.status)}
						{template.version && (
							<Badge variant="secondary">v{template.version}</Badge>
						)}
					</div>
					<div className="flex flex-wrap gap-1 mb-2">
						{Array.isArray(template.type) 
							? template.type.map((type, index) => (
									<Badge key={index} variant="outline">
										{type}
									</Badge>
								))
							: (
									<Badge variant="outline">
										{template.type}
									</Badge>
								)
						}
					</div>
					<p className="text-gray-600 mb-2">{template.description}</p>
					<div className="flex items-center gap-4 text-sm text-gray-500">
						<span>Created: {template.createdAt}</span>
						<span>Updated: {template.updatedAt}</span>
						<span>Usage: {template.usageCount}</span>
						<span>Fields: {template.fields.length}</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{onView && (
						<Button variant="ghost" size="sm" onClick={() => onView(template)}>
							<Eye className="w-4 h-4" />
						</Button>
					)}
					{onCopy && (
						<Button variant="ghost" size="sm" onClick={() => onCopy(template)}>
							<Copy className="w-4 h-4" />
						</Button>
					)}
					{onEdit && (
						<Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
							<Edit className="w-4 h-4" />
						</Button>
					)}
					{onDownload && (
						<Button variant="ghost" size="sm" onClick={() => onDownload(template)}>
							<Download className="w-4 h-4" />
						</Button>
					)}
					<Button 
						variant="ghost" 
						size="sm" 
						className="text-red-600" 
						onClick={() => onDelete(template.id)}
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}