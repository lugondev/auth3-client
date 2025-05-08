'use client'

import {ColumnDef} from '@tanstack/react-table'
import {MoreHorizontal, ArrowUpDown} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Checkbox} from '@/components/ui/checkbox'
import {TenantResponse} from '@/lib/apiClient' // Assuming TenantResponse is now exported from apiClient

export const columns: ColumnDef<TenantResponse>[] = [
	{
		id: 'select',
		header: ({table}) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label='Select all' />,
		cell: ({row}) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />,
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: ({column}) => {
			return (
				<Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Name
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			)
		},
	},
	{
		accessorKey: 'slug',
		header: 'Slug',
	},
	{
		accessorKey: 'owner_user_id',
		header: 'Owner ID',
	},
	{
		accessorKey: 'is_active',
		header: 'Status',
		cell: ({row}) => (row.original.is_active ? 'Active' : 'Inactive'),
	},
	{
		accessorKey: 'created_at',
		header: 'Created At',
		cell: ({row}) => new Date(row.original.created_at).toLocaleDateString(),
	},
	{
		id: 'actions',
		cell: ({row}) => {
			const tenant = row.original
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='ghost' className='h-8 w-8 p-0'>
							<span className='sr-only'>Open menu</span>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(tenant.id)}>Copy Tenant ID</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View Details</DropdownMenuItem>
						<DropdownMenuItem>Edit Tenant</DropdownMenuItem>
						<DropdownMenuItem className='text-red-600'>Delete Tenant</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
]
