'use client'

import {useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {getRolesForUser, addRoleForUser, removeRoleForUser} from '@/services/rbacService'
import {UserRoleInput} from '@/types/rbac'
import {toast} from 'sonner'
import {z} from 'zod'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {ArrowLeftIcon, TrashIcon} from '@radix-ui/react-icons'
import Link from 'next/link'
import {AxiosError} from 'axios'

const USER_ROLES_QUERY_KEY = 'userRoles'

const addRoleFormSchema = z.object({
	roleName: z.string().min(1, {message: 'Role name cannot be empty.'}),
})
type AddRoleFormValues = z.infer<typeof addRoleFormSchema>

export default function ManageUserRolesPage() {
	const [userIdSearch, setUserIdSearch] = useState<string>('')
	const [currentUserId, setCurrentUserId] = useState<string | null>(null)
	const queryClient = useQueryClient()

	const {
		data: userRolesData,
		isLoading: isLoadingUserRoles,
		// refetch: refetchUserRoles, // Removed unused variable
		error: userRolesError,
	} = useQuery({
		queryKey: [USER_ROLES_QUERY_KEY, currentUserId],
		queryFn: () => {
			if (!currentUserId) return Promise.resolve(null) // Or throw an error
			return getRolesForUser(currentUserId)
		},
		enabled: !!currentUserId, // Only fetch if currentUserId is set
	})

	const addRoleMutation = useMutation({
		mutationFn: (data: UserRoleInput) => addRoleForUser(data),
		onSuccess: () => {
			toast.success('Role added successfully.')
			queryClient.invalidateQueries({queryKey: [USER_ROLES_QUERY_KEY, currentUserId]})
		},
		onError: (error: Error | AxiosError<{message?: string}>) => {
			const errorMessage = error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError && (error as AxiosError<{message?: string}>).response?.data?.message ? (error as AxiosError<{message?: string}>).response?.data?.message : error.message
			toast.error(`Failed to add role: ${errorMessage}`)
		},
	})

	const removeRoleMutation = useMutation({
		mutationFn: ({userId, role}: {userId: string; role: string}) => removeRoleForUser(userId, role),
		onSuccess: () => {
			toast.success('Role removed successfully.')
			queryClient.invalidateQueries({queryKey: [USER_ROLES_QUERY_KEY, currentUserId]})
		},
		onError: (error: Error | AxiosError<{message?: string}>) => {
			const errorMessage = error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError && (error as AxiosError<{message?: string}>).response?.data?.message ? (error as AxiosError<{message?: string}>).response?.data?.message : error.message
			toast.error(`Failed to remove role: ${errorMessage}`)
		},
	})

	const addRoleForm = useForm<AddRoleFormValues>({
		resolver: zodResolver(addRoleFormSchema),
		defaultValues: {roleName: ''},
	})

	const handleSearchUser = () => {
		if (userIdSearch.trim()) {
			setCurrentUserId(userIdSearch.trim())
		} else {
			toast.error('Please enter a User ID.')
		}
	}

	const handleAddRole = (values: AddRoleFormValues) => {
		if (!currentUserId) {
			toast.error('No user selected.')
			return
		}
		addRoleMutation.mutate({role: values.roleName})
		addRoleForm.reset()
	}

	const handleRemoveRole = (roleName: string) => {
		if (!currentUserId) return
		removeRoleMutation.mutate({userId: currentUserId, role: roleName})
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
					<CardTitle>Manage User Roles</CardTitle>
					<CardDescription>Search for a user by ID to view and manage their roles.</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex space-x-2'>
						<Input type='text' placeholder='Enter User ID (UUID)' value={userIdSearch} onChange={(e) => setUserIdSearch(e.target.value)} className='max-w-xs' />
						<Button onClick={handleSearchUser}>Search User</Button>
					</div>
				</CardContent>
			</Card>

			{currentUserId && (
				<Card>
					<CardHeader>
						<CardTitle>Roles for User: {currentUserId}</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoadingUserRoles && <p>Loading roles...</p>}
						{userRolesError && <p className='text-red-500'>Error fetching roles: {userRolesError.message}</p>}
						{userRolesData && (
							<>
								{userRolesData.roles.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Role Name</TableHead>
												<TableHead className='text-right'>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{userRolesData.roles.map((role) => (
												<TableRow key={role}>
													<TableCell>{role}</TableCell>
													<TableCell className='text-right'>
														<Button variant='destructive' size='sm' onClick={() => handleRemoveRole(role)} disabled={removeRoleMutation.isPending && removeRoleMutation.variables?.role === role}>
															<TrashIcon className='mr-2 h-4 w-4' />
															Remove
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<p>No roles assigned to this user.</p>
								)}

								<Form {...addRoleForm}>
									<form onSubmit={addRoleForm.handleSubmit(handleAddRole)} className='mt-6 flex items-end space-x-2'>
										<FormField
											control={addRoleForm.control}
											name='roleName'
											render={({field}) => (
												<FormItem className='flex-grow'>
													<FormLabel>Add New Role</FormLabel>
													<FormControl>
														<Input placeholder='Enter role name' {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type='submit' disabled={addRoleMutation.isPending}>
											Add Role
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
