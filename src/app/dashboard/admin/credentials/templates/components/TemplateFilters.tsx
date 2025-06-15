'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface TemplateFiltersProps {
	searchTerm: string
	setSearchTerm: (term: string) => void
	filterType: string
	setFilterType: (type: string) => void
	filterStatus: string
	setFilterStatus: (status: string) => void
}

export function TemplateFilters({
	searchTerm,
	setSearchTerm,
	filterType,
	setFilterType,
	filterStatus,
	setFilterStatus,
}: TemplateFiltersProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-4 mb-6">
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
				<Input
					placeholder="Search templates..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-10"
				/>
			</div>
			<Select value={filterType} onValueChange={setFilterType}>
				<SelectTrigger className="w-full sm:w-48">
					<SelectValue placeholder="Filter by type" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Types</SelectItem>
					<SelectItem value="VerifiableCredential">Verifiable Credential</SelectItem>
					<SelectItem value="EducationCredential">Education Credential</SelectItem>
					<SelectItem value="EmploymentCredential">Employment Credential</SelectItem>
					<SelectItem value="IdentityCredential">Identity Credential</SelectItem>
				</SelectContent>
			</Select>
			<Select value={filterStatus} onValueChange={setFilterStatus}>
				<SelectTrigger className="w-full sm:w-48">
					<SelectValue placeholder="Filter by status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Status</SelectItem>
					<SelectItem value="active">Active</SelectItem>
					<SelectItem value="draft">Draft</SelectItem>
					<SelectItem value="inactive">Inactive</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)
}