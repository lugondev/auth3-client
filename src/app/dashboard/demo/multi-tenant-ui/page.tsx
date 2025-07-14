'use client'

import React from 'react'
import {DashboardLayout} from '@/components/layout/DashboardLayout'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {useAuth} from '@/contexts/AuthContext'
import {
	Building2,
	Globe,
	Users,
	Shield,
	Crown,
	Key,
	Database,
} from 'lucide-react'

export default function MultiTenantUIDemo() {
	const {user, currentMode, currentTenantId, globalContext, tenantContext} = useAuth()

	const demoSections = [
		{
			title: 'Authentication Contexts',
			description: 'Different authentication modes for users and tenants',
			content: (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-blue-600">
								<Globe className="h-5 w-5" />
								Global Context
							</CardTitle>
							<CardDescription>
								System-wide permissions, user management, and administrative functions
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between">
								<span className="text-sm">JWT Type:</span>
								<Badge variant="outline">Standard (no tenant_id)</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-sm">Use Cases:</span>
								<span className="text-sm">Admin, User Profile</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm">Permissions:</span>
								<span className="text-sm">System-wide</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-green-600">
								<Building2 className="h-5 w-5" />
								Tenant Context
							</CardTitle>
							<CardDescription>
								Organization-specific permissions and tenant-scoped operations
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between">
								<span className="text-sm">JWT Type:</span>
								<Badge variant="outline">With tenant_id</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-sm">Use Cases:</span>
								<span className="text-sm">Org Management</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm">Permissions:</span>
								<span className="text-sm">Tenant-scoped</span>
							</div>
						</CardContent>
					</Card>
				</div>
			)
		},
		{
			title: 'UI Components Showcase',
			description: 'Different variants of tenant and context switching components',
			content: (
				<div className="space-y-6">
					{/* Context Switcher Variants */}
					<div>
						<h4 className="text-lg font-semibold mb-3">Context Switcher Variants</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Dropdown Variant</CardTitle>
								</CardHeader>
								<CardContent>
									<ContextSwitcher 
										variant="dropdown" 
										showCurrentContext={true}
										showRefreshButton={true}
									/>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Button Group Variant</CardTitle>
								</CardHeader>
								<CardContent>
									<ContextSwitcher 
										variant="button-group" 
										size="sm"
									/>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Card Variant</CardTitle>
								</CardHeader>
								<CardContent>
									<ContextSwitcher 
										variant="card" 
										showRefreshButton={true}
									/>
								</CardContent>
							</Card>
						</div>
					</div>

					<Separator />

					{/* Tenant Selector Variants */}
					<div>
						<h4 className="text-lg font-semibold mb-3">Tenant Selector Variants</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Compact Variant</CardTitle>
								</CardHeader>
								<CardContent>
									<TenantSelector 
										variant="compact"
										showGlobalOption={true}
									/>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Dropdown Variant</CardTitle>
								</CardHeader>
								<CardContent>
									<TenantSelector 
										variant="dropdown"
										showGlobalOption={true}
									/>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Full Variant</CardTitle>
								</CardHeader>
								<CardContent>
									<TenantSelector 
										variant="full"
										showGlobalOption={true}
										showCreateButton={true}
										showManageButton={true}
									/>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			)
		},
		{
			title: 'Current User & Context State',
			description: 'Real-time information about authentication and context state',
			content: (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								User Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<span className="text-sm font-medium">Email:</span>
								<span className="text-sm">{user?.email || 'Not authenticated'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm font-medium">Name:</span>
								<span className="text-sm">
									{user?.first_name && user?.last_name 
										? `${user.first_name} ${user.last_name}`
										: user?.first_name || 'N/A'
									}
								</span>
							</div>
							<div className="space-y-1">
								<span className="text-sm font-medium">Roles:</span>
								<div className="flex flex-wrap gap-1">
									{user?.roles?.map((role) => (
										<Badge key={role} variant="secondary" className="text-xs">
											{role}
										</Badge>
									)) || <span className="text-sm text-muted-foreground">No roles</span>}
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Context State
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<span className="text-sm font-medium">Current Mode:</span>
								<Badge variant={currentMode === 'global' ? 'default' : 'secondary'}>
									{currentMode}
								</Badge>
							</div>
							{currentMode === 'tenant' && (
								<div className="flex justify-between">
									<span className="text-sm font-medium">Tenant ID:</span>
									<span className="text-sm font-mono text-xs">
										{currentTenantId || 'None'}
									</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-sm font-medium">Global Auth:</span>
								<Badge variant={globalContext?.isAuthenticated ? 'default' : 'destructive'}>
									{globalContext?.isAuthenticated ? 'Active' : 'Inactive'}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span className="text-sm font-medium">Tenant Auth:</span>
								<Badge variant={tenantContext?.isAuthenticated ? 'default' : 'destructive'}>
									{tenantContext?.isAuthenticated ? 'Active' : 'Inactive'}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			)
		},
		{
			title: 'Multi-Tenant Features',
			description: 'Key features supporting multi-tenant architecture',
			content: (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-green-600">
								<Crown className="h-5 w-5" />
								Tenant Ownership
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="text-sm space-y-1">
								<li>• One user can own multiple tenants</li>
								<li>• Transfer ownership functionality</li>
								<li>• Owner has full tenant permissions</li>
								<li>• Automatic owner role assignment</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-blue-600">
								<Key className="h-5 w-5" />
								Token Management
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="text-sm space-y-1">
								<li>• Separate tokens per context</li>
								<li>• Automatic token refresh</li>
								<li>• Context-aware API calls</li>
								<li>• Secure token storage</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-purple-600">
								<Database className="h-5 w-5" />
								RBAC Integration
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="text-sm space-y-1">
								<li>• Tenant-specific roles</li>
								<li>• Permission inheritance</li>
								<li>• Dynamic role assignment</li>
								<li>• Context-based access control</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			)
		}
	]

	return (
		<DashboardLayout
			title="Multi-Tenant UI Demo"
			description="Demonstration of frontend components for multi-tenant authentication system"
			showContextControls={true}
			showTenantInfo={true}
			allowedRoles={['user', 'admin', 'system_admin']}
		>
			<div className="space-y-8">
				{demoSections.map((section, index) => (
					<div key={index}>
						<div className="mb-4">
							<h2 className="text-2xl font-bold">{section.title}</h2>
							<p className="text-muted-foreground mt-1">{section.description}</p>
						</div>
						{section.content}
						{index < demoSections.length - 1 && <Separator className="mt-8" />}
					</div>
				))}
			</div>
		</DashboardLayout>
	)
}
