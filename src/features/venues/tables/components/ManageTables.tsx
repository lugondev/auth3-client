'use client'

import React, {useState} from 'react'
import {Table as TableType} from '@/types/table'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog' // Removed unused DialogTrigger
import TableList from './TableList'
import TableForm from './TableForm'
import {PlusCircle} from 'lucide-react'

interface ManageTablesProps {
	venueId: string
}

const ManageTables: React.FC<ManageTablesProps> = ({venueId}) => {
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [editingTable, setEditingTable] = useState<TableType | null>(null)

	const handleOpenForm = (table?: TableType | null) => {
		setEditingTable(table || null) // Set null for create mode
		setIsFormOpen(true)
	}

	const handleCloseForm = () => {
		setIsFormOpen(false)
		setEditingTable(null) // Clear editing state on close
	}

	const handleFormSuccess = () => {
		handleCloseForm()
		// List is automatically refetched by react-query invalidation in hooks
	}

	return (
		<div>
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				{/*
          We don't use DialogTrigger here directly on the list's button
          because the list itself needs to control opening for edit mode.
          Instead, we manage the 'open' state manually.
          The 'Add Table' button below will trigger handleOpenForm.
        */}
				<div className='flex justify-end mb-4'>
					{/* Separate button to trigger create mode */}
					<Button onClick={() => handleOpenForm(null)}>
						<PlusCircle className='mr-2 h-4 w-4' /> Add Table
					</Button>
				</div>

				{/* Pass handleOpenForm as the onEditTable prop */}
				<TableList venueId={venueId} onEditTable={handleOpenForm} />

				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>{editingTable ? 'Edit Table' : 'Create New Table'}</DialogTitle>
						<DialogDescription>{editingTable ? `Update the details for table "${editingTable.name}".` : 'Enter the details for the new table.'}</DialogDescription>
					</DialogHeader>
					<TableForm venueId={venueId} initialData={editingTable} onSuccess={handleFormSuccess} />
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default ManageTables
