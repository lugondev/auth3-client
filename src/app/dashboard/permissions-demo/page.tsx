'use client'

import React from 'react'
import {PermissionButton, CreateButton, EditButton, DeleteButton, ViewButton, AdminButton} from '@/components/guards'
import {PermissionGuard, usePermissions, usePermissionCheck} from '@/components/permissions'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Button} from '@/components/ui/button'
import {RefreshCw, Shield, Users, Building, Settings} from 'lucide-react'

export default function PermissionsDemoPage() {
	const {permissions, roles, loading, error, refreshPermissions, hasPermission} = usePermissions()
	const hasAdminAccess = usePermissionCheck('admin:dashboard:read')
	const hasUserManagement = usePermissionCheck('admin:users:read')
	const hasTenantManagement = usePermissionCheck('admin:tenants:read')
	const hasUsersCreate = usePermissionCheck('users.create')
	const hasUsersUpdate = usePermissionCheck('users.update')

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Permission System Demo</h1>
					<p className='text-muted-foreground'>Test and demonstrate the RBAC permission system</p>
				</div>
				<Button onClick={refreshPermissions} disabled={loading} variant='outline'>
					<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
					Refresh Permissions
				</Button>
			</div>

			{/* Debug Information */}
			<Card className='border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'>
				<CardHeader>
					<CardTitle className='text-slate-800 dark:text-slate-200'>Debug Information</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2 text-sm text-slate-700 dark:text-slate-300'>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Raw Permissions:</strong> {JSON.stringify(permissions)}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Raw Roles:</strong> {JSON.stringify(roles)}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Permissions Length:</strong> {permissions.length}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Is Authenticated:</strong> {loading ? 'loading...' : 'true'}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Has admin:dashboard:read:</strong> {hasAdminAccess.hasAccess ? 'true' : 'false'}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Has users.create:</strong> {hasUsersCreate.hasAccess ? 'true' : 'false'}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Has users.update:</strong> {hasUsersUpdate.hasAccess ? 'true' : 'false'}
						</div>
						<div>
							<strong className='text-slate-900 dark:text-slate-100'>Direct hasPermission('users.create'):</strong> {hasPermission('users.create') ? 'true' : 'false'}
						</div>
					</div>
				</CardContent>
			</Card>

			{error && (
				<Card className='border-destructive'>
					<CardHeader>
						<CardTitle className='text-destructive'>Error Loading Permissions</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-sm text-muted-foreground'>{error}</p>
					</CardContent>
				</Card>
			)}

			{/* Current User Permissions */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Current User Permissions
					</CardTitle>
					<CardDescription>Your current permissions and roles in the system</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<h4 className='font-semibold mb-2'>Roles:</h4>
						<div className='flex flex-wrap gap-2'>
							{roles.length > 0 ? (
								roles.map((role) => (
									<Badge key={role} variant='secondary'>
										{role}
									</Badge>
								))
							) : (
								<Badge variant='outline'>No roles assigned</Badge>
							)}
						</div>
					</div>

					<Separator />

					<div>
						<h4 className='font-semibold mb-2'>Permissions:</h4>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
							{permissions.length > 0 ? (
								permissions.map((permission) => (
									<Badge key={permission.object + ':' + permission.action} variant='outline' className='text-xs'>
										{permission.object}:{permission.action}
									</Badge>
								))
							) : (
								<Badge variant='outline'>No permissions assigned</Badge>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Permission Checks */}
			<Card>
				<CardHeader>
					<CardTitle>Permission Checks</CardTitle>
					<CardDescription>Real-time permission validation results</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='flex items-center justify-between p-3 border rounded-lg'>
							<span className='text-sm font-medium'>Admin Dashboard Access</span>
							<Badge variant={hasAdminAccess.hasAccess ? 'default' : 'destructive'}>{hasAdminAccess.hasAccess ? 'Granted' : 'Denied'}</Badge>
						</div>
						<div className='flex items-center justify-between p-3 border rounded-lg'>
							<span className='text-sm font-medium'>User Management</span>
							<Badge variant={hasUserManagement.hasAccess ? 'default' : 'destructive'}>{hasUserManagement.hasAccess ? 'Granted' : 'Denied'}</Badge>
						</div>
						<div className='flex items-center justify-between p-3 border rounded-lg'>
							<span className='text-sm font-medium'>Tenant Management</span>
							<Badge variant={hasTenantManagement.hasAccess ? 'default' : 'destructive'}>{hasTenantManagement.hasAccess ? 'Granted' : 'Denied'}</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Permission Guards Demo */}
			<Card>
				<CardHeader>
					<CardTitle>Permission Guards Demo</CardTitle>
					<CardDescription>Components that are conditionally rendered based on permissions</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<PermissionGuard permission='admin:users:read'>
						<div className='p-4 border border-green-200 bg-green-50 rounded-lg dark:border-green-800 dark:bg-green-950'>
							<div className='flex items-center gap-2'>
								<Users className='h-5 w-5 text-green-600' />
								<h4 className='font-semibold text-green-800 dark:text-green-200'>User Management Section</h4>
							</div>
							<p className='text-sm text-green-700 dark:text-green-300 mt-2'>This section is only visible if you have 'admin:users:read' permission.</p>
						</div>
					</PermissionGuard>

					<PermissionGuard permission='admin:tenants:read'>
						<div className='p-4 border border-blue-200 bg-blue-50 rounded-lg dark:border-blue-800 dark:bg-blue-950'>
							<div className='flex items-center gap-2'>
								<Building className='h-5 w-5 text-blue-600' />
								<h4 className='font-semibold text-blue-800 dark:text-blue-200'>Tenant Management Section</h4>
							</div>
							<p className='text-sm text-blue-700 dark:text-blue-300 mt-2'>This section is only visible if you have 'admin:tenants:read' permission.</p>
						</div>
					</PermissionGuard>

					<PermissionGuard permission='admin:system:manage'>
						<div className='p-4 border border-red-200 bg-red-50 rounded-lg dark:border-red-800 dark:bg-red-950'>
							<div className='flex items-center gap-2'>
								<Settings className='h-5 w-5 text-red-600' />
								<h4 className='font-semibold text-red-800 dark:text-red-200'>System Management Section</h4>
							</div>
							<p className='text-sm text-red-700 dark:text-red-300 mt-2'>This section is only visible if you have 'admin:system:manage' permission (likely not visible).</p>
						</div>
					</PermissionGuard>

					<PermissionGuard
						permission='admin:nonexistent:permission'
						fallback={
							<div className='p-4 border border-gray-200 bg-gray-50 rounded-lg dark:border-gray-700 dark:bg-gray-900'>
								<p className='text-sm text-gray-600 dark:text-gray-400'>This is a fallback message shown when permission is denied.</p>
							</div>
						}>
						<div className='p-4 border border-purple-200 bg-purple-50 rounded-lg'>
							<p className='text-sm text-purple-700'>This should not be visible (requires nonexistent permission).</p>
						</div>
					</PermissionGuard>
				</CardContent>
			</Card>

			{/* Permission Buttons Demo */}
			<Card>
				<CardHeader>
					<CardTitle>Permission Buttons Demo</CardTitle>
					<CardDescription>Buttons that are enabled/disabled based on permissions</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
						<CreateButton resource='users' onClick={() => alert('Create User clicked!')}>
							Create User
						</CreateButton>

						<EditButton resource='users' onClick={() => alert('Edit User clicked!')}>
							Edit User
						</EditButton>

						<DeleteButton resource='users' onClick={() => alert('Delete User clicked!')}>
							Delete User
						</DeleteButton>

						<ViewButton resource='users' onClick={() => alert('View User clicked!')}>
							View User
						</ViewButton>

						<AdminButton onClick={() => alert('Admin Action clicked!')}>Admin Action</AdminButton>
					</div>

					<Separator className='my-6' />

					<div className='space-y-4'>
						<h4 className='font-semibold'>Custom Permission Buttons</h4>
						<div className='flex flex-wrap gap-4'>
							<PermissionButton permission='tenants.create' onClick={() => alert('Create Tenant clicked!')} variant='default'>
								Create Tenant
							</PermissionButton>

							<PermissionButton permissions={['users.read', 'tenants.read']} requireAll={false} onClick={() => alert('Multi-permission button clicked!')} variant='outline'>
								Users OR Tenants
							</PermissionButton>

							<PermissionButton permissions={['users.read', 'users.update']} requireAll={true} onClick={() => alert('Multi-permission AND button clicked!')} variant='secondary'>
								Read AND Update
							</PermissionButton>

							<PermissionButton role='SystemSuperAdmin' onClick={() => alert('Role-based button clicked!')} variant='destructive'>
								System Admin Only
							</PermissionButton>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
