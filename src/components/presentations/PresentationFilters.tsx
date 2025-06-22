import React from 'react'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Calendar} from '@/components/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Search, X, Calendar as CalendarIcon, SortAsc, SortDesc} from 'lucide-react'
import {format} from 'date-fns'
import {PresentationStatus, PresentationFilterOptions} from '@/types/presentations'

interface PresentationFiltersProps {
	filters: PresentationFilterOptions
	onFiltersChange: (filters: PresentationFilterOptions) => void
	onClearFilters: () => void
	className?: string
}

/**
 * PresentationFilters - Advanced filtering for presentation lists
 */
export function PresentationFilters({filters, onFiltersChange, onClearFilters, className = ''}: PresentationFiltersProps) {
	const hasActiveFilters = Boolean(filters.status || filters.purpose || filters.verifierDID || filters.createdAfter || filters.createdBefore || filters.verifiedAfter || filters.verifiedBefore)

	const handleFilterChange = (key: keyof PresentationFilterOptions, value: string | undefined) => {
		onFiltersChange({
			...filters,
			[key]: value,
			page: 1, // Reset to first page when filters change
		})
	}

	const handleDateSelect = (field: 'createdAfter' | 'createdBefore' | 'verifiedAfter' | 'verifiedBefore', date: Date | undefined) => {
		handleFilterChange(field, date?.toISOString())
	}

	const removeFilter = (key: keyof PresentationFilterOptions) => {
		handleFilterChange(key, undefined)
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Search and Quick Filters */}
			<div className='flex flex-col sm:flex-row gap-4'>
				{/* Search Input */}
				<div className='flex-1'>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
						<Input placeholder='Search presentations...' value={filters.search || ''} onChange={(e) => handleFilterChange('search', e.target.value)} className='pl-10' />
					</div>
				</div>

				{/* Status Filter */}
				<div className='w-full sm:w-48'>
					<Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : (value as PresentationStatus))}>
						<SelectTrigger>
							<SelectValue placeholder='All statuses' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Statuses</SelectItem>
							<SelectItem value={PresentationStatus.VERIFIED}>Verified</SelectItem>
							<SelectItem value={PresentationStatus.PENDING}>Pending</SelectItem>
							<SelectItem value={PresentationStatus.SUBMITTED}>Submitted</SelectItem>
							<SelectItem value={PresentationStatus.REJECTED}>Rejected</SelectItem>
							<SelectItem value={PresentationStatus.EXPIRED}>Expired</SelectItem>
							<SelectItem value={PresentationStatus.REVOKED}>Revoked</SelectItem>
							<SelectItem value={PresentationStatus.DRAFT}>Draft</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Sort Options */}
				<div className='w-full sm:w-48'>
					<Select
						value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
						onValueChange={(value) => {
							const [sortBy, sortOrder] = value.split('-')
							handleFilterChange('sortBy', sortBy)
							handleFilterChange('sortOrder', sortOrder)
						}}>
						<SelectTrigger>
							<SelectValue placeholder='Sort by' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='createdAt-desc'>
								<div className='flex items-center gap-2'>
									<SortDesc className='h-4 w-4' />
									Newest First
								</div>
							</SelectItem>
							<SelectItem value='createdAt-asc'>
								<div className='flex items-center gap-2'>
									<SortAsc className='h-4 w-4' />
									Oldest First
								</div>
							</SelectItem>
							<SelectItem value='updatedAt-desc'>Latest Updated</SelectItem>
							<SelectItem value='status-asc'>Status A-Z</SelectItem>
							<SelectItem value='holder-asc'>Holder A-Z</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Advanced Filters */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				{/* Purpose Filter */}
				<div>
					<Label htmlFor='purpose'>Purpose</Label>
					<Input id='purpose' placeholder='e.g., identity, academic' value={filters.purpose || ''} onChange={(e) => handleFilterChange('purpose', e.target.value)} />
				</div>

				{/* Verifier DID Filter */}
				<div>
					<Label htmlFor='verifierDID'>Verifier DID</Label>
					<Input id='verifierDID' placeholder='did:example:verifier' value={filters.verifierDID || ''} onChange={(e) => handleFilterChange('verifierDID', e.target.value)} />
				</div>

				{/* Created Date Range */}
				<div>
					<Label>Created After</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant='outline' className='w-full justify-start text-left font-normal'>
								<CalendarIcon className='mr-2 h-4 w-4' />
								{filters.createdAfter ? format(new Date(filters.createdAfter), 'MMM dd, yyyy') : 'Select date'}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0' align='start'>
							<Calendar mode='single' selected={filters.createdAfter ? new Date(filters.createdAfter) : undefined} onSelect={(date) => handleDateSelect('createdAfter', date)} initialFocus />
						</PopoverContent>
					</Popover>
				</div>

				<div>
					<Label>Created Before</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant='outline' className='w-full justify-start text-left font-normal'>
								<CalendarIcon className='mr-2 h-4 w-4' />
								{filters.createdBefore ? format(new Date(filters.createdBefore), 'MMM dd, yyyy') : 'Select date'}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0' align='start'>
							<Calendar mode='single' selected={filters.createdBefore ? new Date(filters.createdBefore) : undefined} onSelect={(date) => handleDateSelect('createdBefore', date)} initialFocus />
						</PopoverContent>
					</Popover>
				</div>
			</div>

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className='flex flex-wrap items-center gap-2'>
					<span className='text-sm font-medium'>Active filters:</span>

					{filters.status && (
						<Badge variant='secondary' className='gap-1'>
							Status: {filters.status}
							<X className='h-3 w-3 cursor-pointer' onClick={() => removeFilter('status')} />
						</Badge>
					)}

					{filters.purpose && (
						<Badge variant='secondary' className='gap-1'>
							Purpose: {filters.purpose}
							<X className='h-3 w-3 cursor-pointer' onClick={() => removeFilter('purpose')} />
						</Badge>
					)}

					{filters.verifierDID && (
						<Badge variant='secondary' className='gap-1'>
							Verifier: {filters.verifierDID.slice(0, 20)}...
							<X className='h-3 w-3 cursor-pointer' onClick={() => removeFilter('verifierDID')} />
						</Badge>
					)}

					{filters.createdAfter && (
						<Badge variant='secondary' className='gap-1'>
							After: {format(new Date(filters.createdAfter), 'MMM dd')}
							<X className='h-3 w-3 cursor-pointer' onClick={() => removeFilter('createdAfter')} />
						</Badge>
					)}

					<Button variant='ghost' size='sm' onClick={onClearFilters} className='h-6 px-2 text-muted-foreground hover:text-foreground'>
						Clear all
					</Button>
				</div>
			)}
		</div>
	)
}
