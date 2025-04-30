'use client'

import React, {useState} from 'react'
import {useFetchVenueTables, useDeleteTable} from '@/features/venues/tables/hooks'
import {Table as TableType} from '@/types/table'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Trash2, Edit} from 'lucide-react' // Removed PlusCircle
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog' // Removed unused AlertDialogTrigger
// TODO: Import TableForm when created
// import TableForm from './TableForm';

interface TableListProps {
	venueId: string
	onEditTable: (table: TableType) => void // Add prop for edit action
	// onCreateTable is handled by the parent ManageTables component now
}

const TableList: React.FC<TableListProps> = ({venueId, onEditTable}) => {
	// Add onEditTable to props destructuring
	// const [currentPage, setCurrentPage] = useState(1) // Removed unused state
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<TableType | null>(null)
	const tablesLimit = 10 // Or make this configurable

	const {data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage} = useFetchVenueTables(venueId, {limit: tablesLimit})

	const deleteTableMutation = useDeleteTable()

	const handleDeleteClick = (table: TableType) => {
		setShowDeleteConfirm(table)
	}

	const confirmDelete = () => {
		if (showDeleteConfirm) {
			deleteTableMutation.mutate(
				{tableId: showDeleteConfirm.id, venueId: venueId, tableName: showDeleteConfirm.name},
				{
					onSuccess: () => {
						setShowDeleteConfirm(null)
					},
					onError: () => {
						// Toast is handled in the hook, maybe additional logic here
						setShowDeleteConfirm(null)
					},
				},
			)
		}
	}

	if (isLoading && !data) {
		return <div>Loading tables...</div>
	}

	if (error) {
		return (
			<Alert variant='destructive'>
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>Failed to load tables: {error.message}</AlertDescription>
			</Alert>
		)
	}

	const allTables = data?.pages.flatMap((page) => page.tables) ?? []

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<h2 className='text-2xl font-semibold'>Tables</h2>
				{/* Add Table button is now handled in ManageTables.tsx */}
			</div>

			{allTables.length === 0 ? (
				<p>No tables found for this venue.</p>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Capacity</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Group/Zone</TableHead>
								<TableHead className='text-right'>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{allTables.map((table) => (
								<TableRow key={table.id}>
									<TableCell>{table.name}</TableCell>
									<TableCell>{table.capacity}</TableCell>
									<TableCell>
										<Badge variant={table.status === 'available' ? 'default' : table.status === 'occupied' ? 'secondary' : 'outline'}>{table.status}</Badge>
									</TableCell>
									<TableCell>{table.groupId || 'N/A'}</TableCell> {/* TODO: Fetch group name if needed */}
									<TableCell className='text-right space-x-2'>
										<Button variant='ghost' size='icon' onClick={() => onEditTable(table)}>
											{' '}
											{/* Call onEditTable */}
											<Edit className='h-4 w-4' />
										</Button>
										<Button variant='ghost' size='icon' onClick={() => handleDeleteClick(table)} disabled={deleteTableMutation.isPending}>
											<Trash2 className='h-4 w-4 text-destructive' />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{hasNextPage && (
						<div className='text-center mt-4'>
							<Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
								{isFetchingNextPage ? 'Loading more...' : 'Load More'}
							</Button>
						</div>
					)}
				</>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>{`This action cannot be undone. This will permanently delete the table "${showDeleteConfirm?.name}".`}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} disabled={deleteTableMutation.isPending} className='bg-destructive hover:bg-destructive/90'>
							{deleteTableMutation.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

export default TableList
