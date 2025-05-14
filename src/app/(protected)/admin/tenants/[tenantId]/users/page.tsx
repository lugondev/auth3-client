'use client'

import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {PlusCircledIcon, DotsHorizontalIcon} from '@radix-ui/react-icons' // ArrowLeftIcon removed
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent} from '@/components/ui/card' // CardHeader, CardDescription, CardTitle removed
import {listUsersInTenant, removeUserFromTenant, getTenantById} from '@/services/tenantService'
import {TenantUserResponse} from '@/types/tenant'
import {toast} from 'sonner'
import Link from 'next/link'
import {useState} from 'react'
import {useParams} from 'next/navigation'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog'
import {PageHeader} from '@/components/layout/PageHeader' // Import PageHeader
import {AxiosError} from 'axios'

const TENANT_USERS_QUERY_KEY = 'tenantUsers'
const TENANT_DETAIL_QUERY_KEY = 'tenantDetail' // For fetching tenant name

export default function TenantUsersPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const queryClient = useQueryClient()

	const [page, setPage] = useState(0)
	const [rowsPerPage] = useState(10)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [userToRemove, setUserToRemove] = useState<TenantUserResponse | null>(null)

	const {data: tenantData, isLoading: isLoadingTenantName} = useQuery({
		queryKey: [TENANT_DETAIL_QUERY_KEY, tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId,
	})

	const {data, isLoading, error, isFetching} = useQuery({
		queryKey: [TENANT_USERS_QUERY_KEY, tenantId, page, rowsPerPage],
		queryFn: () => listUsersInTenant(tenantId, rowsPerPage, page * rowsPerPage),
		enabled: !!tenantId,
		placeholderData: (previousData) => previousData,
	})

	const removeUserMutation = useMutation({
		mutationFn: ({userId}: {userId: string}) => removeUserFromTenant(tenantId, userId),
		onSuccess: () => {
			toast.success('User removed from tenant successfully.')
			queryClient.invalidateQueries({queryKey: [TENANT_USERS_QUERY_KEY, tenantId]})
			setShowDeleteConfirm(false)
			setUserToRemove(null)
		},
		onError: (err: Error | AxiosError<{message?: string}>) => {
			let errorMessage = 'Failed to remove user.'
			if (err && typeof err === 'object' && 'isAxiosError' in err && err.isAxiosError) {
				const axiosError = err as AxiosError<{message?: string}>
				errorMessage = axiosError.response?.data?.message || axiosError.message
			} else {
				errorMessage = err.message
			}
			toast.error(errorMessage)
			setShowDeleteConfirm(false)
			setUserToRemove(null)
		},
	})

	const handleDeleteClick = (user: TenantUserResponse) => {
		setUserToRemove(user)
		setShowDeleteConfirm(true)
	}

	const confirmDelete = () => {
		if (userToRemove) {
			removeUserMutation.mutate({userId: userToRemove.user_id})
		}
	}

	if (isLoadingTenantName || isLoading) return <div className='container mx-auto py-8'>Loading tenant users...</div>
	if (error) return <div className='container mx-auto py-8'>Error fetching users: {error.message}</div>

	const users = data?.users || []
	const totalPages = data?.total_pages || 0
	const tenantName = tenantData?.name || 'Tenant'

	const pageActions = (
		<Link href={`/admin/tenants/${tenantId}/users/add`} passHref>
			<Button>
				<PlusCircledIcon className='mr-2 h-4 w-4' /> Add User
			</Button>
		</Link>
	)

	return (
		<div className='container mx-auto py-8'>
			<PageHeader title={`Users in ${tenantName}`} description='Manage users and their roles within this tenant.' backButton={{text: 'Back to Tenants', href: '/admin/tenants'}} actions={pageActions} />
			<Card>
				{/* Empty CardHeader removed as its content is now handled by PageHeader */}
				<CardContent>
					{/* The Table and its content remain the same */}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Email</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Roles</TableHead>
								<TableHead>Status in Tenant</TableHead>
								<TableHead>Global Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.length > 0 ? (
								users.map((user) => (
									<TableRow key={user.user_id}>
										<TableCell>{user.email}</TableCell>
										<TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
										<TableCell>
											{user.roles.map((role) => (
												<Badge key={role} variant='secondary' className='mr-1'>
													{role}
												</Badge>
											))}
											{user.roles.length === 0 && <span className='text-xs text-muted-foreground'>No roles</span>}
										</TableCell>
										<TableCell>
											<Badge variant={user.status_in_tenant === 'active' ? 'default' : 'outline'}>{user.status_in_tenant}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={user.global_status === 'active' ? 'default' : 'outline'}>{user.global_status}</Badge>
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
													<Link href={`/admin/tenants/${tenantId}/users/${user.user_id}/edit`} passHref>
														<DropdownMenuItem>Edit User Roles/Status</DropdownMenuItem>
													</Link>
													<DropdownMenuSeparator />
													<DropdownMenuItem onClick={() => handleDeleteClick(user)} className='text-red-600'>
														Remove from Tenant
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className='h-24 text-center'>
										No users found in this tenant.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
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
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove user {userToRemove?.email} from the tenant &quot;{tenantName}&quot;. The user&apos;s global account will not be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setUserToRemove(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} disabled={removeUserMutation.isPending} className='bg-red-600 hover:bg-red-700'>
							{removeUserMutation.isPending ? 'Removing...' : 'Remove User'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
