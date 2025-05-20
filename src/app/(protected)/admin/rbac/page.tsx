'use client'

import {useQuery} from '@tanstack/react-query'
import {Button} from '@/components/ui/button'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {getAllRoles, getAllPermissions} from '@/services/rbacService'
import Link from 'next/link'
// import {Separator} from '@/components/ui/separator' // Removed unused import

const ALL_ROLES_QUERY_KEY = 'allRoles'
const ALL_PERMISSIONS_QUERY_KEY = 'allPermissions'

export default function RbacOverviewPage() {
	const {
		data: rolesData,
		isLoading: isLoadingRoles,
		error: rolesError,
	} = useQuery({
		queryKey: [ALL_ROLES_QUERY_KEY],
		queryFn: getAllRoles,
	})

	const {
		data: permissionsData,
		isLoading: isLoadingPermissions,
		error: permissionsError,
	} = useQuery({
		queryKey: [ALL_PERMISSIONS_QUERY_KEY],
		queryFn: getAllPermissions,
	})

	if (isLoadingRoles || isLoadingPermissions) return <div className='container mx-auto py-8'>Loading RBAC data...</div>

	return (
		<div className='container mx-auto py-8 space-y-8'>
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>RBAC Management Overview</CardTitle>
						{/* Future: Button to manage global roles/permissions if applicable */}
					</div>
					<CardDescription>View all defined roles and permissions in the system. Manage user-role and role-permission assignments through dedicated sections.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='mb-4'>For managing user-specific roles or role-specific permissions, please navigate to the relevant tenant&apos;s user management section or a dedicated global RBAC user/role management page (to be implemented).</p>
					<div className='flex gap-4'>
						<Link href='/admin/rbac/user-roles' passHref>
							<Button variant='outline'>Manage User Roles</Button>
						</Link>
						<Link href='/admin/rbac/role-permissions' passHref>
							<Button variant='outline'>Manage Role Permissions</Button>
						</Link>
					</div>
				</CardContent>
			</Card>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				<Card>
					<CardHeader>
						<CardTitle>All Defined Roles</CardTitle>
						<CardDescription>List of all unique roles in the system.</CardDescription>
					</CardHeader>
					<CardContent>
						{rolesError ? (
							<p className='text-red-500'>Error fetching roles: {rolesError.message}</p>
						) : rolesData?.roles && rolesData.roles.global.length > 0 ? (
							<ul className='list-disc pl-5 space-y-1'>
								{rolesData.roles.global.map((role) => (
									<li key={role}>{role}</li>
								))}
							</ul>
						) : (
							<p>No roles found.</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>All Defined Permissions (Policies)</CardTitle>
						<CardDescription>List of all permission policies. Each policy is typically [subject/role, domain, object, action].</CardDescription>
					</CardHeader>
					<CardContent>
						{permissionsError ? (
							<p className='text-red-500'>Error fetching permissions: {permissionsError.message}</p>
						) : permissionsData?.permissions && permissionsData.permissions.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Subject/Role</TableHead>
										<TableHead>Domain</TableHead>
										<TableHead>Object/Resource</TableHead>
										<TableHead>Action</TableHead>
										{/* Add more heads if policies have more parts */}
									</TableRow>
								</TableHeader>
								<TableBody>
									{permissionsData.permissions.map((policy, index) => (
										<TableRow key={index}>
											<TableCell>{policy[0] || 'N/A'}</TableCell>
											<TableCell>{policy[1] || 'N/A'}</TableCell>
											<TableCell>{policy[2] || 'N/A'}</TableCell>
											<TableCell>{policy[3] || 'N/A'}</TableCell>
											{/* Render more cells if policy structure is longer */}
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<p>No permissions found.</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
