'use client'

import React from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {ChevronLeftIcon, ChevronRightIcon} from '@radix-ui/react-icons'

// Define the structure for a column definition
// T represents the data type for each row (e.g., UserOutput)
export interface ColumnDefinition<T> {
	accessorKey?: keyof T | string // Key to access data in the row object, or a unique string for custom columns like actions/checkboxes
	header: React.ReactNode | (() => React.ReactNode)
	cell: (props: {row: T}) => React.ReactNode
	size?: number | string // Optional: hint for column width (e.g., 100, '50px', 'w-[100px]')
}

// --- Prop Types for UserTable ---
interface UserTableProps<T> {
	data: T[]
	columns: ColumnDefinition<T>[]
	loading: boolean
	error: string | null
	// Row Selection
	selectedRows: Record<string, boolean>
	onSelectedRowsChange: (newSelectedRows: Record<string, boolean>) => void
	getRowId: (row: T) => string // Function to get a unique ID for each row
	// Optional: Control visibility of selection checkboxes
	showSelectionColumn?: boolean
	// Pagination (Optional)
	currentPage?: number
	totalPages?: number
	totalItems?: number // Renamed from totalUsers for generality
	onPreviousPage?: () => void
	onNextPage?: () => void
	// Optional: To show selection count summary
	showSelectionSummary?: boolean
}

export function UserTable<T>({
	data,
	columns,
	loading,
	error,
	selectedRows,
	onSelectedRowsChange,
	getRowId,
	currentPage,
	totalPages,
	totalItems,
	onPreviousPage, // Optional
	onNextPage, // Optional
	showSelectionSummary = true, // Default to true
	showSelectionColumn = true, // Default to true
}: UserTableProps<T>) {
	const isAllSelected = data.length > 0 && Object.keys(selectedRows).length === data.length && Object.values(selectedRows).every(Boolean)
	// Consider adding indeterminate state if needed

	// Check if pagination props are provided and valid
	const showPagination = totalPages !== undefined && totalPages > 0 && currentPage !== undefined && onPreviousPage && onNextPage

	const handleSelectAll = (checked: boolean) => {
		const newSelectedRows: Record<string, boolean> = {}
		if (checked) {
			data.forEach((row) => {
				const id = getRowId(row)
				if (id) {
					newSelectedRows[id] = true
				}
			})
		}
		onSelectedRowsChange(newSelectedRows)
	}

	const handleSelectRow = (row: T, checked: boolean) => {
		const id = getRowId(row)
		if (!id) return
		onSelectedRowsChange({
			...selectedRows,
			[id]: checked,
		})
	}

	const selectionCount = Object.keys(selectedRows).filter((k) => selectedRows[k]).length

	// Conditionally add the selection column based on the prop
	const selectionColumn: ColumnDefinition<T>[] = showSelectionColumn
		? [
				{
					accessorKey: 'select', // Unique key for the selection column
					header: () => (
						<Checkbox
							checked={isAllSelected}
							// indeterminate={!isAllSelected && selectionCount > 0} // Requires shadcn update or custom logic
							onCheckedChange={(checked) => handleSelectAll(!!checked)} // Use !!checked for boolean
							aria-label='Select all rows on this page'
							disabled={loading || data.length === 0}
							className='translate-y-[2px]' // Align checkbox nicely
						/>
					),
					cell: ({row}: {row: T}) => {
						const id = getRowId(row)
						if (!id) return null // Should not happen if getRowId is correct
						return (
							<Checkbox
								checked={selectedRows[id] || false}
								onCheckedChange={(checked) => handleSelectRow(row, !!checked)} // Use !!checked for boolean
								aria-label={`Select row ${id}`}
								className='translate-y-[2px]' // Align checkbox nicely
							/>
						)
					},
					size: 'w-[40px]', // Fixed width for checkbox
				} as ColumnDefinition<T>, // Ensure the object matches the type
		  ]
		: [] // Empty array if selection column is hidden

	// Combine selection column (if shown) with user-defined columns
	const tableColumns = [...selectionColumn, ...columns]

	return (
		<div className='space-y-4'>
			<div className='overflow-x-auto border rounded-md'>
				{' '}
				{/* Added border and rounded corners */}
				<Table>
					<TableHeader>
						<TableRow>
							{tableColumns.map((column, index) => (
								<TableHead key={String(column.accessorKey) || `header-${index}`} style={{width: typeof column.size === 'number' ? `${column.size}px` : column.size}} className={typeof column.size === 'string' && column.size.startsWith('w-') ? column.size : ''}>
									{typeof column.header === 'function' ? column.header() : column.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={tableColumns.length} className='h-24 text-center text-muted-foreground'>
									Loading data...
								</TableCell>
							</TableRow>
						) : error ? (
							<TableRow>
								<TableCell colSpan={tableColumns.length} className='h-24 text-center text-destructive'>
									Error: {error}
								</TableCell>
							</TableRow>
						) : data.length > 0 ? (
							data.map((row) => {
								const id = getRowId(row)
								return (
									<TableRow key={id || Math.random()} data-state={selectedRows[id || ''] && 'selected'}>
										{tableColumns.map((column, index) => (
											<TableCell key={String(column.accessorKey) || `cell-${index}-${id}`}>{column.cell({row})}</TableCell>
										))}
									</TableRow>
								)
							})
						) : (
							<TableRow>
								<TableCell colSpan={tableColumns.length} className='h-24 text-center text-muted-foreground'>
									No results found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls (Conditional) */}
			{!loading && !error && showPagination && (
				<div className='flex items-center justify-between space-x-2 py-4'>
					{showSelectionSummary ? (
						<div className='text-sm text-muted-foreground flex-1'>
							{/* Ensure totalItems is defined before accessing */}
							{selectionCount} of {data.length} row(s) on this page selected. {totalItems !== undefined ? `Total items: ${totalItems}.` : ''}
						</div>
					) : (
						<div className='flex-1'></div>
					)}{' '}
					{/* Placeholder */}
					<div className='flex items-center space-x-2'>
						<span className='text-sm text-muted-foreground whitespace-nowrap'>
							{/* Ensure currentPage and totalPages are defined */}
							Page {currentPage ?? '?'} of {totalPages ?? '?'}
						</span>
						{/* Ensure onPreviousPage is defined before using */}
						<Button variant='outline' size='sm' onClick={onPreviousPage} disabled={(currentPage ?? 1) <= 1 || loading}>
							<ChevronLeftIcon className='h-4 w-4 mr-1' />
							Previous
						</Button>
						{/* Ensure onNextPage is defined before using */}
						<Button variant='outline' size='sm' onClick={onNextPage} disabled={(currentPage ?? 1) >= (totalPages ?? 1) || loading}>
							Next
							<ChevronRightIcon className='h-4 w-4 ml-1' />
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
