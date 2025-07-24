'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {Building2, Globe, Users, Shield, Crown, Key, Database, RefreshCw, LogOut, CheckCircle, XCircle, AlertCircle, Info} from 'lucide-react'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'

interface ContextStatusCardProps {
	title: string
	icon: React.ComponentType<{className?: string}>
	isActive: boolean
	user: any
	tenantId?: string | null
	context: 'global' | 'tenant'
	onSwitch: () => void
	onRefresh: () => void
	className?: string
}

function ContextStatusCard({title, icon: Icon, isActive, user, tenantId, context, onSwitch, onRefresh, className}: ContextStatusCardProps) {
	return (
		<Card className={cn('relative', isActive && 'ring-2 ring-primary', className)}>
			<CardHeader className='pb-3'>
				<CardTitle className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Icon className={cn('h-5 w-5', context === 'global' ? 'text-blue-600' : 'text-green-600')} />
						{title}
					</div>
					{isActive && <Badge variant='default'>Active</Badge>}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-3'>
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>Status:</span>
						<div className='flex items-center gap-1'>
							{user ? (
								<>
									<CheckCircle className='h-4 w-4 text-green-600' />
									<span className='text-sm text-green-600'>Authenticated</span>
								</>
							) : (
								<>
									<XCircle className='h-4 w-4 text-red-600' />
									<span className='text-sm text-red-600'>Not authenticated</span>
								</>
							)}
						</div>
					</div>

					{user && (
						<>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium'>User:</span>
								<span className='text-sm truncate max-w-[150px]'>{user.email}</span>
							</div>

							{tenantId && (
								<div className='flex items-center justify-between'>
									<span className='text-sm font-medium'>Tenant:</span>
									<span className='text-sm font-mono text-xs truncate max-w-[100px]'>{tenantId}</span>
								</div>
							)}

							<div className='space-y-1'>
								<span className='text-sm font-medium'>Roles:</span>
								<div className='flex flex-wrap gap-1'>
									{user.roles?.map((role: string) => (
										<Badge key={role} variant='outline' className='text-xs'>
											{role}
										</Badge>
									)) || <span className='text-xs text-muted-foreground'>No roles</span>}
								</div>
							</div>
						</>
					)}
				</div>

				<div className='flex gap-2 pt-2 border-t'>
					<Button variant={isActive ? 'secondary' : 'default'} size='sm' onClick={onSwitch} disabled={isActive} className='flex-1'>
						{isActive ? 'Current' : 'Switch'}
					</Button>
					<Button variant='outline' size='sm' onClick={onRefresh}>
						<RefreshCw className='h-3 w-3' />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

export function ContextDashboard() {
	const {user, currentMode, currentTenantId, globalContext, tenantContext, isTransitioning, switchToGlobal, switchToTenant, logout} = useAuth()

	const handleSwitchToGlobal = async () => {
		try {
			await switchToGlobal()
			toast.success('Switched to global context')
		} catch (error) {
			toast.error('Failed to switch to global context')
		}
	}

	const handleSwitchToTenant = async () => {
		if (!currentTenantId) {
			toast.error('No tenant selected')
			return
		}
		try {
			await switchToTenant(currentTenantId)
			toast.success('Switched to tenant context')
		} catch (error) {
			toast.error('Failed to switch to tenant context')
		}
	}

	const handleRefreshGlobal = async () => {
		try {
			await switchToGlobal()
			toast.success('Global context refreshed')
		} catch (error) {
			toast.error('Failed to refresh global context')
		}
	}

	const handleRefreshTenant = async () => {
		if (!currentTenantId) {
			toast.error('No tenant selected for refresh')
			return
		}
		try {
			await switchToTenant(currentTenantId)
			toast.success('Tenant context refreshed')
		} catch (error) {
			toast.error('Failed to refresh tenant context')
		}
	}

	const handleLogout = async () => {
		try {
			await logout() // Full logout, not contextOnly
			toast.success('Logged out successfully')
		} catch (error) {
			toast.error('Failed to logout')
		}
	}

	return (
		<div className='space-y-6'>
			{/* Context Overview */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Context Overview
					</CardTitle>
					<CardDescription>Current authentication context and available contexts</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>Current Mode:</span>
						<Badge variant={currentMode === 'global' ? 'default' : 'secondary'} className='font-mono'>
							{currentMode}
						</Badge>
					</div>

					{currentMode === 'tenant' && currentTenantId && (
						<div className='flex items-center justify-between'>
							<span className='text-sm font-medium'>Current Tenant:</span>
							<span className='text-sm font-mono'>{currentTenantId}</span>
						</div>
					)}

					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium'>Transitioning:</span>
						<Badge variant={isTransitioning ? 'destructive' : 'secondary'}>{isTransitioning ? 'Yes' : 'No'}</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Context Status Cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<ContextStatusCard title='Global Context' icon={Globe} isActive={currentMode === 'global'} user={globalContext.user} context='global' onSwitch={handleSwitchToGlobal} onRefresh={handleRefreshGlobal} />

				<ContextStatusCard title='Tenant Context' icon={Building2} isActive={currentMode === 'tenant'} user={tenantContext.user} tenantId={tenantContext.tenantId} context='tenant' onSwitch={handleSwitchToTenant} onRefresh={handleRefreshTenant} />
			</div>

			{/* Context Controls */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Building2 className='h-5 w-5' />
							Tenant Selector
						</CardTitle>
						<CardDescription>Select tenant context or switch to global</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<TenantSelector
							variant='full'
							showGlobalOption={true}
							showCreateButton={true}
							showManageButton={true}
							onTenantChange={(tenantId) => {
								if (tenantId) {
									toast.info(`Selected tenant: ${tenantId}`)
								} else {
									toast.info('Selected global context')
								}
							}}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Context Switcher
						</CardTitle>
						<CardDescription>Switch between authentication contexts</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<ContextSwitcher
							variant='card'
							showRefreshButton={true}
							showCurrentContext={true}
							showTenantInfo={true}
							onContextSwitch={(mode) => {
								console.log('Context switched to:', mode)
							}}
						/>
					</CardContent>
				</Card>
			</div>

			{/* System Actions */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Key className='h-5 w-5' />
						System Actions
					</CardTitle>
					<CardDescription>Global system actions and utilities</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-3'>
						<Button variant='outline' onClick={handleRefreshGlobal} disabled={isTransitioning}>
							<RefreshCw className='h-4 w-4 mr-2' />
							Refresh Global
						</Button>

						<Button variant='outline' onClick={handleRefreshTenant} disabled={isTransitioning || !currentTenantId}>
							<RefreshCw className='h-4 w-4 mr-2' />
							Refresh Tenant
						</Button>

						<Button variant='destructive' onClick={handleLogout} disabled={isTransitioning}>
							<LogOut className='h-4 w-4 mr-2' />
							Logout
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Feature Showcase */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Database className='h-5 w-5' />
						Multi-Tenant Features
					</CardTitle>
					<CardDescription>Key features of the multi-tenant system</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<div className='flex items-center gap-2'>
								<Crown className='h-4 w-4 text-yellow-500' />
								<span className='font-medium'>Ownership</span>
							</div>
							<p className='text-sm text-muted-foreground'>Users can own and manage multiple tenants with full administrative privileges.</p>
						</div>

						<div className='space-y-2'>
							<div className='flex items-center gap-2'>
								<Key className='h-4 w-4 text-blue-500' />
								<span className='font-medium'>Token Isolation</span>
							</div>
							<p className='text-sm text-muted-foreground'>Separate JWT tokens for global and tenant contexts ensure security boundaries.</p>
						</div>

						<div className='space-y-2'>
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4 text-green-500' />
								<span className='font-medium'>RBAC Integration</span>
							</div>
							<p className='text-sm text-muted-foreground'>Context-aware role-based access control with tenant-specific permissions.</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
