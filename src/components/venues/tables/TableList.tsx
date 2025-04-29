// next/src/components/venues/tables/TableList.tsx
'use client'

import React, {useState, useEffect, useMemo} from 'react'
// Removed TableType as it's unused directly, tableTypes array is used
import {Table as VenueTableType, tableStatuses, TableStatus, tableTypes} from '@/types/venue' // Renamed VenueTable import
import venueService from '@/services/venueService'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Badge} from '@/components/ui/badge'
import {MoreHorizontal, PlusCircle} from 'lucide-react'
import {toast} from 'sonner' // Use sonner toast directly

interface TableListProps {
	venueId: string
	// Add props for triggering Add/Edit/Delete modals later
	onAddTable: () => void
	onEditTable: (table: VenueTableType) => void // Use new type
	onDeleteTable: (table: VenueTableType) => void // Use new type
	refreshKey?: number // Add refreshKey prop
}

const getStatusColor = (status: TableStatus): string => {
	switch (status) {
		case 'available':
			return 'bg-green-500'
		case 'occupied':
			return 'bg-yellow-500'
		case 'reserved':
			return 'bg-blue-500'
		case 'out_of_service':
			return 'bg-red-500'
		default:
			return 'bg-gray-500'
	}
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')

// Destructure refreshKey from props
export function TableList({venueId, onAddTable, onEditTable, onDeleteTable, refreshKey}: TableListProps) {
	const [tables, setTables] = useState<VenueTableType[]>([]) // Use new type
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filterStatus, setFilterStatus] = useState<string>('all') // 'all' or TableStatus
	const [filterLocation, setFilterLocation] = useState<string>('')
	const [filterType, setFilterType] = useState<string>('all') // 'all' or TableType
	// Removed useToast hook

	useEffect(() => {
		const fetchTables = async () => {
			// Added basic loading/error feedback if venueId is missing, though parent should handle this
			if (!venueId) {
				setError('Venue ID is required to load tables.')
				setLoading(false)
				setTables([]) // Clear tables if venueId is missing
				return
			}
			setLoading(true)
			setError(null)
			try {
				const fetchedTables = await venueService.getVenueTables(venueId)
				setTables(fetchedTables)
			} catch (err: unknown) {
				// Changed 'any' to 'unknown' for stricter type safety
				const errorMessage = err instanceof Error ? err.message : 'Unknown error'
				setError(`Failed to fetch tables: ${errorMessage}`)
				toast.error(`Failed to load tables: ${errorMessage}`) // Use sonner toast.error
			} finally {
				setLoading(false)
			}
		}
		fetchTables()
	}, [venueId, toast, refreshKey]) // Add refreshKey to dependency array

	const filteredTables = useMemo(() => {
		return tables.filter((table) => {
			const statusMatch = filterStatus === 'all' || table.status === filterStatus
			const locationMatch = filterLocation === '' || (table.location && table.location.toLowerCase().includes(filterLocation.toLowerCase()))
			const typeMatch = filterType === 'all' || table.type === filterType
			return statusMatch && locationMatch && typeMatch
		})
	}, [tables, filterStatus, filterLocation, filterType])

	// TODO: Implement handleStatusChange if needed directly here or via Edit modal

	if (loading) {
		return <div>Loading tables...</div> // Replace with Skeleton loader later
	}

	if (error) {
		return <div className='text-red-500'>{error}</div>
	}

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-4'>
				<h2 className='text-2xl font-semibold'>Tables</h2>
				<div className='flex flex-wrap items-center gap-2'>
					{/* Filters */}
					<Input placeholder='Filter by location...' value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className='max-w-xs' />
					<Select value={filterStatus} onValueChange={setFilterStatus}>
						<SelectTrigger className='w-[180px]'>
							<SelectValue placeholder='Filter by status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Statuses</SelectItem>
							{tableStatuses.map((status) => (
								<SelectItem key={status} value={status}>
									{capitalize(status)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className='w-[180px]'>
							<SelectValue placeholder='Filter by type' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Types</SelectItem>
							{tableTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{capitalize(type)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button onClick={onAddTable}>
						<PlusCircle className='mr-2 h-4 w-4' /> Add Table
					</Button>
				</div>
			</div>

			{/* TODO: Add Grid View option */}

			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Capacity</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Min Spend</TableHead>
							<TableHead className='text-right'>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredTables.length > 0 ? (
							filteredTables.map((table) => (
								<TableRow key={table.id}>
									<TableCell className='font-medium'>{table.name}</TableCell>
									<TableCell>{table.capacity}</TableCell>
									<TableCell>{capitalize(table.type)}</TableCell>
									<TableCell>{table.location || '-'}</TableCell>
									<TableCell>
										<Badge variant='outline' className={`border-none text-white ${getStatusColor(table.status)}`}>
											{capitalize(table.status)}
										</Badge>
									</TableCell>
									<TableCell>{table.minimumSpend ? `$${table.minimumSpend.toFixed(2)}` : '-'}</TableCell> {/* Corrected property name */}
									<TableCell className='text-right'>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' className='h-8 w-8 p-0'>
													<span className='sr-only'>Open menu</span>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem onClick={() => onEditTable(table)}>Edit Details</DropdownMenuItem>
												{/* Add Change Status options here if desired */}
												<DropdownMenuSeparator />
												<DropdownMenuItem className='text-red-600 focus:text-red-700 focus:bg-red-50' onClick={() => onDeleteTable(table)}>
													{' '}
													{/* Pass full table */}
													Delete Table
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={7} className='h-24 text-center'>
									No tables found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
