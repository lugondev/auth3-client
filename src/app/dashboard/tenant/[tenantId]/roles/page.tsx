'use client'

import React, {useEffect} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Shield, Users, Settings, ArrowLeft, Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import Link from 'next/link'

import {useAuth} from '@/contexts/AuthContext'
import {useTenantRbac} from '@/hooks/useTenantRbac'
import {TenantRolesTable} from '@/components/tenants/rbac/TenantRolesTable'
import {TenantRolePermissionsModal} from '@/components/tenants/rbac/TenantRolePermissionsModal'
import {TenantCreateRoleModal} from '@/components/tenants/rbac/TenantCreateRoleModal'

export default function TenantRolesPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const {user} = useAuth()

	// Check if user has permission to manage roles
	const canManageRoles = Boolean(user?.roles?.includes('TenantOwner') || user?.roles?.includes('TenantAdmin'))

	// Initialize tenant RBAC hook
	const tenantRbac = useTenantRbac(tenantId)

	useEffect(() => {
		if (tenantId) {
			tenantRbac.actions.setTenantId(tenantId)
		}
	}, [tenantId])

	// Calculate stats
	const totalRoles = (tenantRbac.roles.custom?.length || 0) + (tenantRbac.roles.default?.length || 0)
	const customRoles = tenantRbac.roles.custom?.length || 0
	const systemRoles = tenantRbac.roles.default?.length || 0
	
	// Calculate total permissions across all roles
	const totalPermissions = Object.values(tenantRbac.rolePermissionsMap).reduce((total, permissions) => {
		return total + (permissions ? permissions.length : 0)
	}, 0)

	// Loading state
	if (tenantRbac.loading.initialRoles) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Loader2 className='h-8 w-8 animate-spin text-primary' />
				<span className='ml-2 text-lg'>Loading roles...</span>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='space-y-1'>
					<div className='flex items-center space-x-2'>
						<Link href={`/dashboard/tenant/${tenantId}`}>
							<Button variant='outline' size='sm'>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Back to Dashboard
							</Button>
						</Link>
					</div>
					<h1 className='text-3xl font-bold tracking-tight'>Role Management</h1>
					<p className='text-muted-foreground'>
						Manage roles and permissions for your organization
					</p>
				</div>
				<Shield className='h-8 w-8 text-blue-600' />
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<Card className='hover:shadow-md transition-shadow'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>Available Roles</CardTitle>
						<Shield className='h-4 w-4 text-primary' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-primary'>{totalRoles}</div>
						<p className='text-xs text-muted-foreground'>Total roles in tenant</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-md transition-shadow'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>Custom Roles</CardTitle>
						<Settings className='h-4 w-4 text-blue-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-blue-600'>{customRoles}</div>
						<p className='text-xs text-muted-foreground'>User-created roles</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-md transition-shadow'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>System Roles</CardTitle>
						<Users className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{systemRoles}</div>
						<p className='text-xs text-muted-foreground'>Built-in tenant roles</p>
					</CardContent>
				</Card>

				<Card className='hover:shadow-md transition-shadow'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>Total Permissions</CardTitle>
						<Shield className='h-4 w-4 text-orange-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-orange-600'>{totalPermissions}</div>
						<p className='text-xs text-muted-foreground'>Across all roles</p>
					</CardContent>
				</Card>
			</div>

			{/* Role Management Section */}
			<Card className='shadow-sm'>
				<CardHeader className='bg-muted/30'>
					<div className='flex items-center gap-2'>
						<Shield className='h-5 w-5 text-primary' />
						<div>
							<CardTitle>Tenant Roles</CardTitle>
							<CardDescription>
								{canManageRoles
									? 'Create, edit, and delete roles for this tenant. System roles cannot be deleted.'
									: 'View roles available in this tenant. Contact an administrator to make changes.'}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className='p-6'>
					<TenantRolesTable 
						roles={tenantRbac.roles}
						loading={tenantRbac.loading}
						error={tenantRbac.error}
						selectedRole={tenantRbac.selectedRole}
						canManageRoles={canManageRoles}
						onOpenCreateRoleModal={tenantRbac.actions.openCreateRoleModal}
						onOpenRolePermsModal={tenantRbac.actions.openRolePermsModal}
						onDeleteRole={tenantRbac.actions.handleDeleteTenantRole}
						rolePermissionsMap={tenantRbac.rolePermissionsMap}
					/>
				</CardContent>
			</Card>

			{/* Tenant RBAC Modals */}
			<TenantRolePermissionsModal 
				isOpen={tenantRbac.isRolePermsModalOpen}
				onClose={tenantRbac.actions.closeRolePermsModal}
				role={tenantRbac.selectedRole}
				groupedPermissions={tenantRbac.groupedPermissions(tenantRbac.selectedRole)}
				loading={tenantRbac.loading}
				error={tenantRbac.error}
				newPermObject={tenantRbac.newPermObject}
				newPermAction={tenantRbac.newPermAction}
				onNewPermObjectChange={tenantRbac.actions.setNewPermObject}
				onNewPermActionChange={tenantRbac.actions.setNewPermAction}
				onAddPermission={tenantRbac.actions.handleAddPermissionToTenantRole}
				onRemovePermission={tenantRbac.actions.handleRemovePermissionFromTenantRole}
			/>

			<TenantCreateRoleModal 
				isOpen={tenantRbac.isCreateRoleModalOpen}
				onClose={tenantRbac.actions.closeCreateRoleModal}
				loading={tenantRbac.loading}
				error={tenantRbac.createRoleError}
				onCreateRole={tenantRbac.actions.handleCreateTenantRole}
			/>

			{/* Quick Actions */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<Card className='hover:shadow-md transition-shadow'>
					<CardHeader>
						<CardTitle className='text-lg flex items-center gap-2'>
							<Users className='h-5 w-5 text-green-600' />
							User Management
						</CardTitle>
						<CardDescription>Assign roles to users and manage user permissions</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href={`/dashboard/tenant/${tenantId}/users`}>
							<Button className='w-full bg-green-600 hover:bg-green-700'>
								<Users className='h-4 w-4 mr-2' />
								Manage Users
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className='hover:shadow-md transition-shadow'>
					<CardHeader>
						<CardTitle className='text-lg flex items-center gap-2'>
							<Settings className='h-5 w-5 text-blue-600' />
							Tenant Settings
						</CardTitle>
						<CardDescription>Configure tenant-wide settings and preferences</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href={`/dashboard/tenant/${tenantId}/settings`}>
							<Button variant='outline' className='w-full border-blue-600 text-blue-600 hover:bg-blue-50'>
								<Settings className='h-4 w-4 mr-2' />
								Tenant Settings
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
