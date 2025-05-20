'use client'

import {useState} from 'react' // Removed useEffect
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {getAllRoles, getPermissionsForRole, addPermissionForRole, removePermissionForRole} from '@/services/rbacService'
import {RolePermissionInput} from '@/types/rbac'
import {toast} from 'sonner'
import {z} from 'zod'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {ArrowLeftIcon, TrashIcon} from '@radix-ui/react-icons'
import Link from 'next/link'
import {AxiosError} from 'axios'

const ALL_ROLES_QUERY_KEY_FOR_SELECT = 'allRolesForSelect'
const ROLE_PERMISSIONS_QUERY_KEY = 'rolePermissions'

const addPermissionFormSchema = z.object({
	object: z.string().min(1, {message: 'Object cannot be empty.'}),
	action: z.string().min(1, {message: 'Action cannot be empty.'}),
})
type AddPermissionFormValues = z.infer<typeof addPermissionFormSchema>

export default function ManageRolePermissionsPage() {
	const [selectedRole, setSelectedRole] = useState<string | null>(null)
	const queryClient = useQueryClient()

	const {data: allRolesData, isLoading: isLoadingAllRoles} = useQuery({
		queryKey: [ALL_ROLES_QUERY_KEY_FOR_SELECT],
		queryFn: getAllRoles,
	})

	const {
		data: rolePermissionsData,
		isLoading: isLoadingRolePermissions,
		error: rolePermissionsError,
	} = useQuery({
		queryKey: [ROLE_PERMISSIONS_QUERY_KEY, selectedRole],
		queryFn: () => {
			if (!selectedRole) return Promise.resolve(null)
			return getPermissionsForRole(selectedRole)
		},
		enabled: !!selectedRole,
	})

	const addPermissionMutation = useMutation({
		mutationFn: (data: RolePermissionInput) => addPermissionForRole(data),
		onSuccess: () => {
			toast.success('Permission added to role successfully.')
			queryClient.invalidateQueries({queryKey: [ROLE_PERMISSIONS_QUERY_KEY, selectedRole]})
		},
		onError: (error: Error | AxiosError<{message?: string}>) => {
			const errorMessage = error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError && (error as AxiosError<{message?: string}>).response?.data?.message ? (error as AxiosError<{message?: string}>).response?.data?.message : error.message
			toast.error(`Failed to add permission: ${errorMessage}`)
		},
	})

	const removePermissionMutation = useMutation({
		mutationFn: ({role, object, action}: {role: string; object: string; action: string}) => removePermissionForRole(role, object, action),
		onSuccess: () => {
			toast.success('Permission removed from role successfully.')
			queryClient.invalidateQueries({queryKey: [ROLE_PERMISSIONS_QUERY_KEY, selectedRole]})
		},
		onError: (error: Error | AxiosError<{message?: string}>) => {
			const errorMessage = error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError && (error as AxiosError<{message?: string}>).response?.data?.message ? (error as AxiosError<{message?: string}>).response?.data?.message : error.message
			toast.error(`Failed to remove permission: ${errorMessage}`)
		},
	})

	const addPermissionForm = useForm<AddPermissionFormValues>({
		resolver: zodResolver(addPermissionFormSchema),
		defaultValues: {object: '', action: ''},
	})

	const handleAddPermission = (values: AddPermissionFormValues) => {
		if (!selectedRole) {
			toast.error('No role selected.')
			return
		}
		addPermissionMutation.mutate({role: selectedRole, permissions: [[values.object, values.action]]})
		addPermissionForm.reset()
	}

	const handleRemovePermission = (object: string, action: string) => {
		if (!selectedRole) return
		removePermissionMutation.mutate({role: selectedRole, object, action})
	}

	return (
		<div className='container mx-auto py-8 space-y-6'>
			<div className='mb-4'>
				<Link href='/admin/rbac' passHref>
					<Button variant='outline' size='sm'>
						<ArrowLeftIcon className='mr-2 h-4 w-4' />
						Back to RBAC Overview
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Manage Role Permissions</CardTitle>
					<CardDescription>Select a role to view and manage its permissions.</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<FormLabel>Select Role</FormLabel>
					<Select onValueChange={setSelectedRole} value={selectedRole || ''}>
						<SelectTrigger className='w-[280px]'>
							<SelectValue placeholder={isLoadingAllRoles ? 'Loading roles...' : 'Select a role'} />
						</SelectTrigger>
						<SelectContent>
							{allRolesData?.roles &&
								allRolesData.roles.global.map((role) => (
									<SelectItem key={role} value={role}>
										{role}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedRole && (
				<Card>
					<CardHeader>
						<CardTitle>Permissions for Role: {selectedRole}</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoadingRolePermissions && <p>Loading permissions...</p>}
						{rolePermissionsError && <p className='text-red-500'>Error fetching permissions: {rolePermissionsError.message}</p>}
						{rolePermissionsData && (
							<>
								{rolePermissionsData.permissions.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Object/Resource</TableHead>
												<TableHead>Action</TableHead>
												<TableHead className='text-right'>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{rolePermissionsData.permissions.map((perm, index) => (
												<TableRow key={`${perm[0]}-${perm[1]}-${index}`}>
													<TableCell>{perm[0]}</TableCell>
													<TableCell>{perm[1]}</TableCell>
													<TableCell className='text-right'>
														<Button variant='destructive' size='sm' onClick={() => handleRemovePermission(perm[0], perm[1])} disabled={removePermissionMutation.isPending && removePermissionMutation.variables?.role === selectedRole && removePermissionMutation.variables?.object === perm[0] && removePermissionMutation.variables?.action === perm[1]}>
															<TrashIcon className='mr-2 h-4 w-4' />
															Remove
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<p>No permissions assigned to this role.</p>
								)}

								<Form {...addPermissionForm}>
									<form onSubmit={addPermissionForm.handleSubmit(handleAddPermission)} className='mt-6 space-y-4 md:space-y-0 md:flex md:items-end md:space-x-2'>
										<FormField
											control={addPermissionForm.control}
											name='object'
											render={({field}) => (
												<FormItem className='flex-grow'>
													<FormLabel>Object/Resource</FormLabel>
													<FormControl>
														<Input placeholder='e.g., /api/v1/articles' {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={addPermissionForm.control}
											name='action'
											render={({field}) => (
												<FormItem className='flex-grow'>
													<FormLabel>Action</FormLabel>
													<FormControl>
														<Input placeholder='e.g., read, write, delete' {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type='submit' disabled={addPermissionMutation.isPending} className='md:self-end'>
											Add Permission
										</Button>
									</form>
								</Form>
							</>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
