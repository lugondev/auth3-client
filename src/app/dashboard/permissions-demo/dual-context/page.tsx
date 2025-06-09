'use client'

import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {PermissionButton, GlobalPermissionButton, TenantPermissionButton, AutoPermissionButton} from '@/components/guards'
import {ContextIndicator, ContextSwitcher, CompactContextIndicator, ContextSwitcherCard} from '@/components/context'
import {Globe, Building2, Users, Shield, Eye, Edit, Trash2, Plus, Settings, Info, CheckCircle, XCircle, RefreshCw, ArrowRightLeft} from 'lucide-react'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'

export default function DualContextPermissionsDemoPage() {
	const {permissions, roles} = usePermissions()
	const {currentMode, globalContext, tenantContext, isTransitioning} = useAuth()

	// Demo permissions for testing
	const demoPermissions = ['admin:users:read', 'admin:users:create', 'admin:users:update', 'admin:users:delete', 'admin:tenants:read', 'admin:tenants:create', 'admin:oauth2:read', 'admin:oauth2:create', 'tenant:manage', 'user:profile:update']

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold mb-2'>Dual Context Permissions Demo</h1>
				<p className='text-gray-600 dark:text-gray-400'>Demonstrating dual authentication context management with permission-aware components</p>
			</div>

			{/* Context Overview */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<ArrowRightLeft className='h-5 w-5' />
						Dual Context Overview
					</CardTitle>
					<CardDescription>Current authentication contexts and their status</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Current Context Status */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<h4 className='font-medium flex items-center gap-2'>
								<Globe className='h-4 w-4 text-blue-600' />
								Global Context
							</h4>
							<div className='flex items-center gap-2'>
								{globalContext?.isAuthenticated ? <CheckCircle className='h-4 w-4 text-green-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
								<span className='text-sm'>{globalContext?.isAuthenticated ? 'Available' : 'Not Available'}</span>
							</div>
							{globalContext?.user && <p className='text-xs text-muted-foreground'>User: {globalContext.user.email}</p>}
						</div>

						<div className='space-y-2'>
							<h4 className='font-medium flex items-center gap-2'>
								<Building2 className='h-4 w-4 text-green-600' />
								Tenant Context
							</h4>
							<div className='flex items-center gap-2'>
								{tenantContext?.isAuthenticated ? <CheckCircle className='h-4 w-4 text-green-500' /> : <XCircle className='h-4 w-4 text-red-500' />}
								<span className='text-sm'>{tenantContext?.isAuthenticated ? 'Available' : 'Not Available'}</span>
							</div>
							{tenantContext?.tenantId && <p className='text-xs text-muted-foreground'>Tenant: {tenantContext.tenantId}</p>}
						</div>

						<div className='space-y-2'>
							<h4 className='font-medium flex items-center gap-2'>
								<Users className='h-4 w-4 text-purple-600' />
								Current Mode
							</h4>
							<div className='flex items-center gap-2'>
								<Badge variant={currentMode === 'global' ? 'default' : currentMode === 'tenant' ? 'secondary' : 'outline'}>{currentMode || 'Unknown'}</Badge>
								{isTransitioning && <RefreshCw className='h-3 w-3 animate-spin text-yellow-500' />}
							</div>
							<p className='text-xs text-muted-foreground'>
								Permissions: {permissions.length} | Roles: {roles.length}
							</p>
						</div>
					</div>

					<Separator />

					{/* Context Indicators Demo */}
					<div className='space-y-4'>
						<h4 className='font-medium'>Context Indicators</h4>
						<div className='flex flex-wrap items-center gap-4'>
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Badge Variant</p>
								<ContextIndicator variant='badge' showTooltip />
							</div>
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Inline Variant</p>
								<ContextIndicator variant='inline' showTooltip />
							</div>
							<div className='space-y-2'>
								<p className='text-sm text-muted-foreground'>Compact</p>
								<CompactContextIndicator showTooltip />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Context Switcher Demo */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<ArrowRightLeft className='h-5 w-5' />
							Context Switcher - Dropdown
						</CardTitle>
						<CardDescription>Switch between authentication contexts</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<ContextSwitcher variant='dropdown' showRefreshButton onContextSwitch={(mode) => console.log('Switched to:', mode)} />
						<ContextSwitcher variant='button-group' size='sm' onContextSwitch={(mode) => console.log('Switched to:', mode)} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Context Switcher - Card</CardTitle>
						<CardDescription>Detailed context switching interface</CardDescription>
					</CardHeader>
					<CardContent>
						<ContextSwitcherCard showRefreshButton showTenantInfo onContextSwitch={(mode) => console.log('Switched to:', mode)} />
					</CardContent>
				</Card>
			</div>

			{/* Context-Aware Permission Buttons */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Context-Aware Permission Buttons
					</CardTitle>
					<CardDescription>Buttons that check permissions in specific contexts</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Global Context Buttons */}
					<div className='space-y-3'>
						<h4 className='font-medium flex items-center gap-2'>
							<Globe className='h-4 w-4 text-blue-600' />
							Global Context Buttons
						</h4>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
							<GlobalPermissionButton permission='admin:users:create' variant='outline' size='sm' onClick={() => alert('Global: Create User')}>
								<Plus className='mr-2 h-4 w-4' />
								Create User (Global)
							</GlobalPermissionButton>
							<GlobalPermissionButton permission='admin:tenants:create' variant='outline' size='sm' onClick={() => alert('Global: Create Tenant')}>
								<Building2 className='mr-2 h-4 w-4' />
								Create Tenant (Global)
							</GlobalPermissionButton>
							<GlobalPermissionButton role='system_admin' variant='outline' size='sm' onClick={() => alert('Global: System Admin')}>
								<Settings className='mr-2 h-4 w-4' />
								System Admin (Global)
							</GlobalPermissionButton>
						</div>
					</div>

					{/* Tenant Context Buttons */}
					<div className='space-y-3'>
						<h4 className='font-medium flex items-center gap-2'>
							<Building2 className='h-4 w-4 text-green-600' />
							Tenant Context Buttons
						</h4>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
							<TenantPermissionButton permission='tenant:manage' variant='outline' size='sm' onClick={() => alert('Tenant: Manage')}>
								<Settings className='mr-2 h-4 w-4' />
								Manage Tenant
							</TenantPermissionButton>
							<TenantPermissionButton permission='user:profile:update' variant='outline' size='sm' onClick={() => alert('Tenant: Update Profile')}>
								<Edit className='mr-2 h-4 w-4' />
								Update Profile (Tenant)
							</TenantPermissionButton>
							<TenantPermissionButton role='tenant_admin' variant='outline' size='sm' onClick={() => alert('Tenant: Admin')}>
								<Users className='mr-2 h-4 w-4' />
								Tenant Admin
							</TenantPermissionButton>
						</div>
					</div>

					{/* Auto Context Buttons */}
					<div className='space-y-3'>
						<h4 className='font-medium flex items-center gap-2'>
							<Users className='h-4 w-4 text-purple-600' />
							Auto Context Buttons (with Fallback)
						</h4>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
							<AutoPermissionButton permission='admin:users:read' fallbackToGlobal variant='outline' size='sm' onClick={() => alert('Auto: Read Users')}>
								<Eye className='mr-2 h-4 w-4' />
								Read Users (Auto)
							</AutoPermissionButton>
							<AutoPermissionButton permission='admin:users:update' fallbackToGlobal variant='outline' size='sm' onClick={() => alert('Auto: Update Users')}>
								<Edit className='mr-2 h-4 w-4' />
								Update Users (Auto)
							</AutoPermissionButton>
							<AutoPermissionButton permission='admin:users:delete' fallbackToGlobal variant='destructive' size='sm' onClick={() => alert('Auto: Delete Users')}>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete Users (Auto)
							</AutoPermissionButton>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Context Comparison */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Info className='h-5 w-5' />
						Context Comparison
					</CardTitle>
					<CardDescription>Compare the same permission across different contexts</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{demoPermissions.slice(0, 3).map((permission) => (
							<div key={permission} className='p-4 border rounded-lg space-y-3'>
								<h5 className='font-medium text-sm'>{permission}</h5>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
									<PermissionButton permission={permission} context='global' variant='outline' size='sm' className='w-full' onClick={() => alert(`Global: ${permission}`)}>
										<Globe className='mr-2 h-3 w-3' />
										Global
									</PermissionButton>
									<PermissionButton permission={permission} context='tenant' variant='outline' size='sm' className='w-full' onClick={() => alert(`Tenant: ${permission}`)}>
										<Building2 className='mr-2 h-3 w-3' />
										Tenant
									</PermissionButton>
									<PermissionButton permission={permission} context='auto' fallbackToGlobal variant='outline' size='sm' className='w-full' onClick={() => alert(`Auto: ${permission}`)}>
										<Users className='mr-2 h-3 w-3' />
										Auto
									</PermissionButton>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Usage Instructions */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Info className='h-5 w-5' />
						Usage Instructions
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-3'>
							<h4 className='font-medium'>Context-Aware Components</h4>
							<ul className='text-sm space-y-1 text-muted-foreground'>
								<li>
									• <code>GlobalPermissionButton</code> - Checks permissions in global context only
								</li>
								<li>
									• <code>TenantPermissionButton</code> - Checks permissions in tenant context only
								</li>
								<li>
									• <code>AutoPermissionButton</code> - Checks in current context with fallback option
								</li>
								<li>
									• <code>ContextIndicator</code> - Shows current authentication context
								</li>
								<li>
									• <code>ContextSwitcher</code> - Allows switching between contexts
								</li>
							</ul>
						</div>
						<div className='space-y-3'>
							<h4 className='font-medium'>Key Features</h4>
							<ul className='text-sm space-y-1 text-muted-foreground'>
								<li>• Dual authentication context management</li>
								<li>• Context-specific permission checking</li>
								<li>• Automatic fallback mechanisms</li>
								<li>• Smooth context transitions</li>
								<li>• Visual context indicators</li>
								<li>• Backward compatibility maintained</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
