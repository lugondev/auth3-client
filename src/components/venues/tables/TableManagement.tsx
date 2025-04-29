// next/src/components/venues/tables/TableManagement.tsx
'use client'

import React, {useState} from 'react'
import {Table} from '@/types/venue' // Renamed VenueTable to Table
import {TableList} from './TableList'
import {AddTableDialog} from './AddTableDialog'
import {EditTableDialog} from './EditTableDialog'
import {DeleteTableDialog} from './DeleteTableDialog'

interface TableManagementProps {
	venueId: string
}

export function TableManagement({venueId}: TableManagementProps) {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [selectedTable, setSelectedTable] = useState<Table | null>(null) // Use new type
	const [refreshKey, setRefreshKey] = useState(0) // Key to trigger list refresh

	const handleSuccess = () => {
		// Increment key to force TableList useEffect to re-run
		setRefreshKey((prevKey) => prevKey + 1)
	}

	const openAddDialog = () => {
		setSelectedTable(null) // Clear selection
		setIsAddDialogOpen(true)
	}

	const openEditDialog = (table: Table) => {
		// Use new type
		setSelectedTable(table)
		setIsEditDialogOpen(true)
	}

	const openDeleteDialog = (table: Table) => {
		// Use new type
		setSelectedTable(table)
		setIsDeleteDialogOpen(true)
	}

	// Close handler that clears selected table
	const handleEditDialogClose = (open: boolean) => {
		setIsEditDialogOpen(open)
		if (!open) {
			setSelectedTable(null) // Clear selection when closing
		}
	}

	const handleDeleteDialogClose = (open: boolean) => {
		setIsDeleteDialogOpen(open)
		if (!open) {
			setSelectedTable(null) // Clear selection when closing
		}
	}

	return (
		<div className='container mx-auto py-6'>
			{' '}
			{/* Add some basic layout/padding */}
			<TableList venueId={venueId} onAddTable={openAddDialog} onEditTable={openEditDialog} onDeleteTable={openDeleteDialog} refreshKey={refreshKey} />
			<AddTableDialog venueId={venueId} open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={handleSuccess} />
			<EditTableDialog
				table={selectedTable}
				open={isEditDialogOpen}
				onOpenChange={handleEditDialogClose} // Use custom close handler
				onSuccess={handleSuccess}
			/>
			<DeleteTableDialog
				tableId={selectedTable?.id ?? null}
				tableName={selectedTable?.name ?? null}
				open={isDeleteDialogOpen}
				onOpenChange={handleDeleteDialogClose} // Use custom close handler
				onSuccess={handleSuccess}
			/>
		</div>
	)
}
