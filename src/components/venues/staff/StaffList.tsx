// next/src/components/venues/staff/StaffList.tsx
'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {MoreHorizontal, PlusCircle, Loader2, AlertCircle} from 'lucide-react' // Removed User
import venueService from '@/services/venueService'
import {StaffMember, StaffRole} from '@/types/venue' // Removed staffRoles
import {toast} from 'sonner'

// Placeholder components for dialogs (will create these next)
import {AddStaffDialog} from './AddStaffDialog'
import {EditStaffDialog} from './EditStaffDialog'
import {RemoveStaffDialog} from './RemoveStaffDialog'
import {TransferOwnershipDialog} from './TransferOwnershipDialog'

interface StaffListProps {
	venueId: string
	// Add prop for current user ID/role to disable actions if needed
	// currentUserId: string;
}

// Helper to get initials for Avatar fallback
const getInitials = (name: string = ''): string => {
	return (
		name
			.split(' ')
			.map((n) => n[0])
			.filter((_, i, arr) => i === 0 || i === arr.length - 1) // First and Last initial
			.join('')
			.toUpperCase() || '??'
	)
}

export const StaffList: React.FC<StaffListProps> = ({venueId}) => {
	const [staff, setStaff] = useState<StaffMember[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// State for managing dialogs
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
	const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
	const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

	const fetchStaff = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const staffList = await venueService.getVenueStaff(venueId)
			setStaff(staffList)
		} catch (err) {
			console.error('Failed to fetch staff:', err)
			setError('Failed to load staff members. Please try again.')
			toast.error('Error Loading Staff', {
				description: err instanceof Error ? err.message : 'Could not fetch staff list.',
			})
		} finally {
			setIsLoading(false)
		}
	}, [venueId])

	useEffect(() => {
		fetchStaff()
	}, [fetchStaff])

	const handleStaffAdded = () => {
		fetchStaff() // Re-fetch staff list after adding
		setIsAddDialogOpen(false)
	}

	const handleStaffUpdated = () => {
		fetchStaff() // Re-fetch staff list after updating
		setIsEditDialogOpen(false)
		setSelectedStaff(null)
	}

	const handleStaffRemoved = () => {
		fetchStaff() // Re-fetch staff list after removing
		setIsRemoveDialogOpen(false)
		setSelectedStaff(null)
	}

	const handleOwnershipTransferred = () => {
		fetchStaff() // Re-fetch might be needed if owner role changes visually
		setIsTransferDialogOpen(false)
		// Maybe redirect or show a success message about ownership change
	}

	const openEditDialog = (staffMember: StaffMember) => {
		setSelectedStaff(staffMember)
		setIsEditDialogOpen(true)
	}

	const openRemoveDialog = (staffMember: StaffMember) => {
		setSelectedStaff(staffMember)
		setIsRemoveDialogOpen(true)
	}

	const getRoleDisplayName = (role: StaffRole): string => {
		return role.charAt(0).toUpperCase() + role.slice(1)
	}

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between'>
				<div>
					<CardTitle>Staff Management</CardTitle>
					<CardDescription>Manage roles and permissions for your venue staff.</CardDescription>
				</div>
				<div className='flex space-x-2'>
					<Button variant='outline' size='sm' onClick={() => setIsTransferDialogOpen(true)}>
						Transfer Ownership
					</Button>
					<Button size='sm' onClick={() => setIsAddDialogOpen(true)}>
						<PlusCircle className='mr-2 h-4 w-4' /> Add Staff
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className='flex justify-center items-center py-8'>
						<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
					</div>
				) : error ? (
					<div className='flex flex-col items-center justify-center py-8 text-destructive'>
						<AlertCircle className='h-8 w-8 mb-2' />
						<p>{error}</p>
						<Button variant='outline' size='sm' onClick={fetchStaff} className='mt-4'>
							Retry
						</Button>
					</div>
				) : staff.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>No staff members found. Click &#39;Add Staff&#39; to invite someone.</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead>
									<span className='sr-only'>Actions</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{staff.map((member) => (
								<TableRow key={member.id}>
									<TableCell>
										<div className='flex items-center space-x-3'>
											<Avatar>
												<AvatarImage src={member.user?.avatarUrl} alt={member.name} />
												<AvatarFallback>{getInitials(member.name)}</AvatarFallback>
											</Avatar>
											<span className='font-medium'>{member.name || 'N/A'}</span>
										</div>
									</TableCell>
									<TableCell>{member.email}</TableCell>
									<TableCell>{getRoleDisplayName(member.role)}</TableCell>
									<TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
									<TableCell className='text-right'>
										{/* Prevent owner from removing/editing themselves? Add logic here */}
										{/* Also prevent editing/removing owner by others? */}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' className='h-8 w-8 p-0'>
													<span className='sr-only'>Open menu</span>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem onClick={() => openEditDialog(member)}>Edit Role</DropdownMenuItem>
												<DropdownMenuSeparator />
												{/* Add check: Don't allow removing 'owner'? */}
												<DropdownMenuItem
													className='text-destructive focus:text-destructive focus:bg-destructive/10'
													onClick={() => openRemoveDialog(member)}
													// disabled={member.role === 'owner'} // Example disable
												>
													Remove Staff
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>

			{/* Dialogs */}
			<AddStaffDialog venueId={venueId} isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onStaffAdded={handleStaffAdded} />

			{selectedStaff && (
				<>
					<EditStaffDialog venueId={venueId} staffMember={selectedStaff} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onStaffUpdated={handleStaffUpdated} />
					<RemoveStaffDialog venueId={venueId} staffMember={selectedStaff} isOpen={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen} onStaffRemoved={handleStaffRemoved} />
				</>
			)}
			<TransferOwnershipDialog venueId={venueId} isOpen={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen} onOwnershipTransferred={handleOwnershipTransferred} />
		</Card>
	)
}
