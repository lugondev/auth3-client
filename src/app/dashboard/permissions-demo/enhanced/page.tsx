'use client'

import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {PermissionButton, PermissionGuard, PermissionTooltip, ShowWithPermission, HideWithPermission, useConditionalAccess} from '@/components/permissions'
import {Shield, Lock, Unlock, Eye, EyeOff, Edit, Trash2, Plus, Settings, Users, Building, Info, CheckCircle, XCircle} from 'lucide-react'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'

export default function EnhancedPermissionsDemoPage() {
	const {permissions, roles, loading} = usePermissions()
	const {user, currentTenantId} = useAuth()

	// Demo permissions for testing
	const demoPermissions = ['admin:users:read', 'admin:users:create', 'admin:users:update', 'admin:users:delete', 'admin:tenants:read', 'admin:tenants:create', 'admin:oauth2:read', 'admin:oauth2:create', 'tenant:manage', 'user:profile:update']

	// Demo roles
	const demoRoles = ['system_admin', 'tenant_admin', 'user']

	// Use conditional access hook
	const adminAccess = useConditionalAccess({
		permissions: ['admin:users:read', 'admin:tenants:read'],
		requireAll: false,
	})

	const superAdminAccess = useConditionalAccess({
		role: 'system_admin',
	})

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold mb-2'>Enhanced Permissions Demo</h1>
				<p className='text-gray-600 dark:text-gray-400'>Demonstrating permission-aware components, conditional rendering, and tooltips</p>
			</div>

			{/* Current User Info */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Info className='h-5 w-5' />
						Current User Information
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<h4 className='font-medium mb-2'>User Details</h4>
							<p>
								<strong>Email:</strong> {user?.email || 'Not logged in'}
							</p>
							<p>
								<strong>Tenant:</strong> {currentTenantId || 'No tenant selected'}
							</p>
							<p>
								<strong>Loading:</strong> {loading ? 'Yes' : 'No'}
							</p>
						</div>
						<div>
							<h4 className='font-medium mb-2'>Access Status</h4>
							<div className='flex items-center gap-2 mb-1'>
								{adminAccess.hasAccess ? <CheckCircle className='h-4 w-4 text-green-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
								<span>Admin Access</span>
							</div>
							<div className='flex items-center gap-2'>
								{superAdminAccess.hasAccess ? <CheckCircle className='h-4 w-4 text-green-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
								<span>Super Admin Access</span>
							</div>
						</div>
					</div>

					<div>
						<h4 className='font-medium mb-2'>Current Permissions ({permissions.length})</h4>
						<div className='flex flex-wrap gap-1'>
							{permissions.slice(0, 10).map((perm, index) => (
								<Badge key={index} variant='secondary' className='text-xs'>
									{perm.object}.{perm.action}
								</Badge>
							))}
							{permissions.length > 10 && (
								<Badge variant='outline' className='text-xs'>
									+{permissions.length - 10} more
								</Badge>
							)}
						</div>
					</div>

					<div>
						<h4 className='font-medium mb-2'>Current Roles ({roles.length})</h4>
						<div className='flex flex-wrap gap-1'>
							{roles.map((role, index) => (
								<Badge key={index} variant='default' className='text-xs'>
									{role}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Permission Buttons Demo */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Permission-Aware Buttons
					</CardTitle>
					<CardDescription>Buttons that are automatically disabled/enabled based on permissions with tooltips</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{demoPermissions.map((permission) => (
							<PermissionTooltip key={permission} permission={permission}>
								<PermissionButton permission={permission} variant='outline' size='sm' className='w-full justify-start' hideWhenNoAccess={false} onClick={() => alert(`Clicked: ${permission}`)}>
									<Lock className='mr-2 h-4 w-4' />
									{permission}
								</PermissionButton>
							</PermissionTooltip>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Conditional Rendering Demo */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Eye className='h-5 w-5' />
						Conditional Rendering
					</CardTitle>
					<CardDescription>Components that show/hide based on permissions</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Show with permission */}
					<div>
						<h4 className='font-medium mb-2'>Show with Admin Permission</h4>
						<ShowWithPermission
							permissions={['admin:users:read', 'admin:tenants:read']}
							requireAll={false}
							fallback={
								<Alert>
									<Lock className='h-4 w-4' />
									<AlertDescription>You need admin permissions to see this content.</AlertDescription>
								</Alert>
							}>
							<Alert>
								<Unlock className='h-4 w-4' />
								<AlertDescription>🎉 You have admin access! This content is visible.</AlertDescription>
							</Alert>
						</ShowWithPermission>
					</div>

					{/* Hide with permission */}
					<div>
						<h4 className='font-medium mb-2'>Hide for Regular Users</h4>
						<HideWithPermission
							role='user'
							fallback={
								<Alert>
									<EyeOff className='h-4 w-4' />
									<AlertDescription>This content is hidden from regular users.</AlertDescription>
								</Alert>
							}>
							<Alert>
								<Eye className='h-4 w-4' />
								<AlertDescription>You are not a regular user, so you can see this!</AlertDescription>
							</Alert>
						</HideWithPermission>
					</div>

					{/* Permission Guard */}
					<div>
						<h4 className='font-medium mb-2'>Permission Guard (System Admin Only)</h4>
						<PermissionGuard
							role='system_admin'
							fallback={
								<Alert>
									<Lock className='h-4 w-4' />
									<AlertDescription>System admin access required.</AlertDescription>
								</Alert>
							}>
							<div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
								<div className='flex items-center gap-2 mb-2'>
									<Settings className='h-5 w-5 text-green-600' />
									<h5 className='font-medium text-green-800 dark:text-green-200'>System Admin Panel</h5>
								</div>
								<p className='text-green-700 dark:text-green-300 text-sm'>Welcome to the system admin panel! You have full access.</p>
								<div className='flex gap-2 mt-3'>
									<Button size='sm' variant='outline'>
										<Users className='mr-2 h-4 w-4' />
										Manage Users
									</Button>
									<Button size='sm' variant='outline'>
										<Building className='mr-2 h-4 w-4' />
										Manage Tenants
									</Button>
								</div>
							</div>
						</PermissionGuard>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons with Tooltips */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='h-5 w-5' />
						Action Buttons with Permission Tooltips
					</CardTitle>
					<CardDescription>Common action buttons that show helpful tooltips when disabled</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-3'>
						<PermissionTooltip permission='admin:users:create'>
							<PermissionButton permission='admin:users:create' variant='default' hideWhenNoAccess={false}>
								<Plus className='mr-2 h-4 w-4' />
								Create User
							</PermissionButton>
						</PermissionTooltip>

						<PermissionTooltip permission='admin:users:update'>
							<PermissionButton permission='admin:users:update' variant='outline' hideWhenNoAccess={false}>
								<Edit className='mr-2 h-4 w-4' />
								Edit User
							</PermissionButton>
						</PermissionTooltip>

						<PermissionTooltip permission='admin:users:delete'>
							<PermissionButton permission='admin:users:delete' variant='destructive' hideWhenNoAccess={false}>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete User
							</PermissionButton>
						</PermissionTooltip>

						<PermissionTooltip permission='admin:tenants:create'>
							<PermissionButton permission='admin:tenants:create' variant='secondary' hideWhenNoAccess={false}>
								<Building className='mr-2 h-4 w-4' />
								Create Tenant
							</PermissionButton>
						</PermissionTooltip>
					</div>
				</CardContent>
			</Card>

			{/* Testing Different Permission Combinations */}
			<Card>
				<CardHeader>
					<CardTitle>Complex Permission Logic</CardTitle>
					<CardDescription>Testing AND/OR logic with multiple permissions and roles</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<h4 className='font-medium mb-2'>Requires ALL admin permissions (AND logic)</h4>
						<PermissionTooltip permissions={['admin:users:read', 'admin:users:create', 'admin:users:update']} requireAll={true}>
							<PermissionButton permissions={['admin:users:read', 'admin:users:create', 'admin:users:update']} requireAll={true} variant='outline' hideWhenNoAccess={false}>
								Full User Management
							</PermissionButton>
						</PermissionTooltip>
					</div>

					<div>
						<h4 className='font-medium mb-2'>Requires ANY admin permission (OR logic)</h4>
						<PermissionTooltip permissions={['admin:users:read', 'admin:tenants:read', 'admin:oauth2:read']} requireAll={false}>
							<PermissionButton permissions={['admin:users:read', 'admin:tenants:read', 'admin:oauth2:read']} requireAll={false} variant='outline' hideWhenNoAccess={false}>
								Any Admin Access
							</PermissionButton>
						</PermissionTooltip>
					</div>

					<div>
						<h4 className='font-medium mb-2'>Role-based access</h4>
						<div className='flex gap-2'>
							{demoRoles.map((role) => (
								<PermissionTooltip key={role} role={role}>
									<PermissionButton role={role} variant='outline' size='sm' hideWhenNoAccess={false}>
										{role.replace('_', ' ').toUpperCase()}
									</PermissionButton>
								</PermissionTooltip>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
