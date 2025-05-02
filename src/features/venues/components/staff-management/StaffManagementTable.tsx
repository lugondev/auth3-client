import React from 'react'
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {PlusCircle, Edit, Trash2} from 'lucide-react'
import {VenueStaff} from '@/types/staff' // Import the correct type

// The StaffMember interface is no longer needed

interface StaffManagementTableProps {
	// venueId will be added back later when API calls are implemented
	staff: VenueStaff[] // Use VenueStaff type
	isLoading: boolean
	onAddStaff: () => void // Function to open add dialog
	onEditStaff: (staffMember: VenueStaff) => void // Use VenueStaff type
	onDeleteStaff: (staffMemberId: string) => void // Function to handle deletion
}

const StaffManagementTable: React.FC<StaffManagementTableProps> = ({staff, isLoading, onAddStaff, onEditStaff, onDeleteStaff}) => {
	if (isLoading) {
		// TODO: Add a loading skeleton
		return <div>Loading staff...</div>
	}

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<h3 className='text-lg font-medium'>Staff Management</h3>
				<Button onClick={onAddStaff} size='sm'>
					<PlusCircle className='mr-2 h-4 w-4' /> Add Staff
				</Button>
			</div>
			<Table>
				<TableCaption>A list of staff members for this venue.</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead className='text-right'>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{staff.length === 0 && !isLoading ? (
						<TableRow>
							<TableCell colSpan={3} className='text-center'>
								No staff members found.
							</TableCell>
						</TableRow>
					) : (
						staff.map((member) => (
							<TableRow key={member.id}>
								<TableCell>{member.email}</TableCell>
								<TableCell>{member.role}</TableCell>
								<TableCell className='text-right'>
									<Button variant='ghost' size='icon' onClick={() => onEditStaff(member)} className='mr-2'>
										<Edit className='h-4 w-4' />
									</Button>
									<Button variant='ghost' size='icon' onClick={() => onDeleteStaff(member.id)} className='text-red-500 hover:text-red-700'>
										<Trash2 className='h-4 w-4' />
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	)
}

export default StaffManagementTable
