import React from 'react'
import {UserOutput} from '@/lib/apiClient'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {UserTable, ColumnDefinition} from '@/components/users/UserTable' // Assuming UserTable is reusable
import {RbacLoadingState} from '@/types/rbac'

interface UsersSectionProps {
	users: UserOutput[] // Filtered users
	loading: RbacLoadingState // Pass relevant loading states (initial, userRoles)
	error: string | null // Pass general error state
	searchQuery: string
	selectedUser: UserOutput | null // To disable button while loading specific user roles
	onSearchChange: (query: string) => void
	onOpenUserRolesModal: (user: UserOutput) => void
	userRolesMap: Record<string, string[]> // Needed to display roles in the table cell
}

export const UsersSection: React.FC<UsersSectionProps> = ({users, loading, error, searchQuery, selectedUser, onSearchChange, onOpenUserRolesModal, userRolesMap}) => {
	// Define columns specifically for the RBAC context within this component
	// Note: Access data directly from 'row' assuming UserTable passes the row data correctly
	const rbacUserColumns: ColumnDefinition<UserOutput>[] = [
		{
			accessorKey: 'name',
			header: 'Name',
			// Corrected: Access properties directly from 'row'
			cell: ({row}) => <div className='font-medium'>{`${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'N/A'}</div>,
		},
		{
			accessorKey: 'email',
			header: 'Email',
			// Corrected: Access properties directly from 'row'
			cell: ({row}) => row.email,
		},
		{
			accessorKey: 'assignedRoles',
			header: 'Assigned Roles',
			cell: ({row}) => {
				// Corrected: Access id directly from 'row'
				const assignedRoles = userRolesMap[row.id] || []
				return (
					<div className='flex flex-wrap gap-1'>
						{assignedRoles.length > 0 ? (
							assignedRoles.map((roleName) => (
								<Badge key={roleName} variant='secondary'>
									{roleName}
								</Badge>
							))
						) : (
							<span className='text-xs text-muted-foreground italic'>No roles</span>
						)}
					</div>
				)
			},
		},
		{
			accessorKey: 'actions',
			header: () => <div className='text-right'>Actions</div>,
			cell: ({row}) => (
				<div className='text-right'>
					{/* Corrected: Pass 'row' directly to the modal opener */}
					<Button variant='outline' size='sm' onClick={() => onOpenUserRolesModal(row)} disabled={loading.userRoles && selectedUser?.id === row.id}>
						Manage Roles
					</Button>
				</div>
			),
			size: 150, // Explicitly set size like in the original
		},
	]

	return (
		<section aria-labelledby='users-heading'>
			<div className='flex flex-col sm:flex-row justify-between items-center mb-4 gap-4'>
				<h2 id='users-heading' className='text-2xl font-semibold'>
					Users
				</h2>
				<div className='w-full sm:w-auto sm:max-w-xs'>
					<Input type='text' placeholder='Search users by name or email...' value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
				</div>
			</div>
			<UserTable
				data={users}
				columns={rbacUserColumns}
				loading={loading.initial} // Use initial loading state for the table skeleton
				error={error && !error.startsWith('User Roles Error:') && !error.startsWith('Role Permissions Error:') ? error : null} // Show only general table errors
				selectedRows={{}} // Pass empty object as selection is not used here
				onSelectedRowsChange={() => {}} // Pass dummy function
				getRowId={(user) => user.id} // Provide function to get unique row ID
				showSelectionColumn={false} // Hide selection checkboxes
				showSelectionSummary={false} // Hide selection summary text
				// Pagination props are omitted as this table is not paginated in the original component
			/>
		</section>
	)
}
