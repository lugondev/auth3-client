'use client'

import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {PlusCircledIcon, DotsHorizontalIcon} from '@radix-ui/react-icons'
import {Button} from '@/components/ui/button'
import {AxiosError} from 'axios' // Import AxiosError
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {listTenants, deleteTenant} from '@/services/tenantService'
import {MinimalTenantInfo} from '@/types/tenant' // PaginatedTenantsResponse uses this
import {toast} from 'sonner'
import Link from 'next/link'
import {useState} from 'react'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'

const TENANTS_QUERY_KEY = 'tenants'

export default function AdminTenantsPage() {
	const queryClient = useQueryClient()
	const [page, setPage] = useState(0) // 0-indexed for API offset calculation
	const [rowsPerPage] = useState(10)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [tenantToDelete, setTenantToDelete] = useState<MinimalTenantInfo | null>(null)

	const {data, isLoading, error, isFetching} = useQuery({
		queryKey: [TENANTS_QUERY_KEY, page, rowsPerPage],
		queryFn: () => listTenants(rowsPerPage, page * rowsPerPage),
		placeholderData: (previousData) => previousData,
		// keepPreviousData: true, // Consider for smoother pagination UX
	})

	const deleteTenantMutation = useMutation({
		mutationFn: deleteTenant,
		onSuccess: () => {
			toast.success('Tenant deleted successfully.')
			queryClient.invalidateQueries({queryKey: [TENANTS_QUERY_KEY]})
			setShowDeleteConfirm(false)
			setTenantToDelete(null)
		},
		onError: (err: Error | AxiosError) => {
			// It's good practice to check if err is an AxiosError to safely access err.response
			let errorMessage = err.message
			if (err && typeof err === 'object' && 'isAxiosError' in err && err.isAxiosError) {
				const axiosError = err as AxiosError<{message?: string}> // More specific type
				errorMessage = axiosError.response?.data?.message || axiosError.message
			}
			toast.error(`Failed to delete tenant: ${errorMessage}`)
			setShowDeleteConfirm(false)
			setTenantToDelete(null)
		},
	})

	const handleDeleteClick = (tenant: MinimalTenantInfo) => {
		setTenantToDelete(tenant)
		setShowDeleteConfirm(true)
	}

	const confirmDelete = () => {
		if (tenantToDelete) {
			deleteTenantMutation.mutate(tenantToDelete.id)
		}
	}

	if (isLoading) return <div>Loading tenants...</div>
	if (error) return <div>Error fetching tenants: {error.message}</div>

	const tenants = data?.tenants || []
	const totalPages = data?.total_pages || 0

	return (
		<div className='container mx-auto py-8'>
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle>Tenant Management</CardTitle>
							<CardDescription>Manage all organizations and their settings.</CardDescription>
						</div>
						<Link href='/admin/tenants/new' passHref>
							<Button>
								<PlusCircledIcon className='mr-2 h-4 w-4' /> Create Tenant
							</Button>
						</Link>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tenants.length > 0 ? (
								tenants.map((tenant) => (
									<TableRow key={tenant.id}>
										<TableCell className='font-medium'>{tenant.name}</TableCell>
										<TableCell>{tenant.slug}</TableCell>
										<TableCell>
											{/* Assuming TenantResponse has is_active, but list returns MinimalTenantInfo */}
											{/* We'd need to fetch full tenant details or add is_active to MinimalTenantInfo */}
											<Badge variant={tenant.id /* Placeholder for actual status logic */ ? 'default' : 'outline'}>{tenant.is_active ? 'Active' : 'Inactive'}</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant='ghost' className='h-8 w-8 p-0'>
														<span className='sr-only'>Open menu</span>
														<DotsHorizontalIcon className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end'>
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<Link href={`/admin/tenants/${tenant.id}/users`} passHref>
														<DropdownMenuItem>Manage Users</DropdownMenuItem>
													</Link>
													<Link href={`/admin/tenants/${tenant.id}/edit`} passHref>
														<DropdownMenuItem>Edit Tenant</DropdownMenuItem>
													</Link>
													<DropdownMenuSeparator />
													<DropdownMenuItem onClick={() => handleDeleteClick(tenant)} className='text-red-600'>
														Delete Tenant
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={4} className='h-24 text-center'>
										No tenants found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
					{/* Basic Pagination (can be improved with a dedicated component) */}
					<div className='flex items-center justify-end space-x-2 py-4'>
						<Button variant='outline' size='sm' onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isFetching}>
							Previous
						</Button>
						<span>
							Page {page + 1} of {totalPages}
						</span>
						<Button variant='outline' size='sm' onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || isFetching}>
							Next
						</Button>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>This action cannot be undone. This will permanently delete the tenant &quot;{tenantToDelete?.name}&quot; and all associated data.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setTenantToDelete(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} disabled={deleteTenantMutation.isPending} className='bg-red-600 hover:bg-red-700'>
							{deleteTenantMutation.isPending ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
