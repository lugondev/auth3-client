'use client'

import {ColumnDef} from '@tanstack/react-table'
import {MoreHorizontal, ArrowUpDown} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Checkbox} from '@/components/ui/checkbox'
import {TenantUserResponse} from '@/lib/apiClient' // Assuming TenantUserResponse is exported from apiClient
import {Badge} from '@/components/ui/badge'

export const tenantUserColumns: ColumnDef<TenantUserResponse>[] = [
	{
		id: 'select',
		header: ({table}) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label='Select all' />,
		cell: ({row}) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />,
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'email',
		header: ({column}) => {
			return (
				<Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Email
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			)
		},
	},
	{
		accessorKey: 'first_name',
		header: 'First Name',
	},
	{
		accessorKey: 'last_name',
		header: 'Last Name',
	},
	{
		accessorKey: 'roles',
		header: 'Roles (Tenant)',
		cell: ({row}) => {
			const roles = row.original.roles
			return (
				<div className='flex flex-wrap gap-1'>
					{roles.map((role) => (
						<Badge key={role} variant='outline'>
							{role}
						</Badge>
					))}
				</div>
			)
		},
	},
	{
		accessorKey: 'status_in_tenant',
		header: 'Status (Tenant)',
		cell: ({row}) => <Badge variant={row.original.status_in_tenant === 'active' ? 'default' : 'secondary'}>{row.original.status_in_tenant}</Badge>,
	},
	{
		accessorKey: 'global_status',
		header: 'Global Status',
		cell: ({row}) => <Badge variant={row.original.global_status === 'active' ? 'default' : 'secondary'}>{row.original.global_status}</Badge>,
	},
	{
		accessorKey: 'joined_at',
		header: 'Joined At',
		cell: ({row}) => new Date(row.original.joined_at).toLocaleDateString(),
	},
	{
		id: 'actions',
		cell: ({row}) => {
			const user = row.original
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
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.user_id)}>Copy User ID</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Edit User Roles/Status</DropdownMenuItem>
						<DropdownMenuItem className='text-red-600'>Remove from Tenant</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
]
