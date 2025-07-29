'use client'

import React from 'react'
import {useParams} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {Shield, Users, Settings as SettingsIcon, Key} from 'lucide-react'
import Link from 'next/link'

import {TenantManagementLayout} from '@/components/tenants/management/TenantManagementLayout'
import {useAuth} from '@/contexts/AuthContext'
import {TransferTenantOwnershipSection} from '@/components/tenants/management/TransferTenantOwnershipSection'
import {TenantAuthConfigSection} from '@/components/tenants/auth/TenantAuthConfigSection'
import {SSOConfiguration} from '@/components/tenants/auth/SSOConfiguration'
import {TenantResponse} from '@/types/tenant'
import {tenantAuthConfigService} from '@/services/tenantAuthConfigService'

export default function TenantSettingsPage() {
	const params = useParams()
	const tenantId = params.tenantId as string
	const {user} = useAuth()
	const [ssoEnabled, setSsoEnabled] = React.useState(false)

	// Handle SSO state update from TenantAuthConfigSection
	const handleSSOStateUpdate = React.useCallback((enabled: boolean) => {
		setSsoEnabled(enabled)
	}, [])

	// Quick Actions content as additional content
	const quickActionsContent = (
		<div className="space-y-6">
			{/* Authentication Configuration Section */}
			<TenantAuthConfigSection 
				tenantId={tenantId} 
				onSSOStateChange={handleSSOStateUpdate}
			/>

			{/* SSO Configuration Section */}
			<SSOConfiguration 
				tenantId={tenantId} 
				enabled={ssoEnabled} 
				onToggle={setSsoEnabled}
			/>
			
			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>Manage your tenant settings and permissions.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<Link href={`/dashboard/tenant/${tenantId}/roles`}>
							<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-start space-y-2'>
								<div className='flex items-center space-x-2'>
									<Shield className='h-5 w-5 text-blue-600' />
									<span className='font-semibold'>Role Management</span>
								</div>
								<span className='text-sm text-muted-foreground text-left'>
									Create and manage roles and permissions for your organization
								</span>
							</Button>
						</Link>

						<Link href={`/dashboard/tenant/${tenantId}/users`}>
							<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-start space-y-2'>
								<div className='flex items-center space-x-2'>
									<Users className='h-5 w-5 text-green-600' />
									<span className='font-semibold'>User Management</span>
								</div>
								<span className='text-sm text-muted-foreground text-left'>
									Invite users and assign roles to team members
								</span>
							</Button>
						</Link>

						<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-start space-y-2' disabled>
							<div className='flex items-center space-x-2'>
								<Key className='h-5 w-5 text-orange-600' />
								<span className='font-semibold'>Advanced SSO</span>
							</div>
							<span className='text-sm text-muted-foreground text-left'>
								Advanced SAML and OIDC configuration (Coming Soon)
							</span>
						</Button>

						<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-start space-y-2' disabled>
							<div className='flex items-center space-x-2'>
								<SettingsIcon className='h-5 w-5 text-gray-600' />
								<span className='font-semibold'>Security Logs</span>
							</div>
							<span className='text-sm text-muted-foreground text-left'>
								Authentication and security audit logs (Coming Soon)
							</span>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)

	// Custom render function for ownership sections with role-based access
	const renderOwnershipSections = (tenant: TenantResponse) => {
		if (!user?.roles?.includes('TenantOwner')) {
			return null
		}

		return (
			<div>
				<Separator />
				{/* We'll need to import these components */}
				<TransferTenantOwnershipSection tenantId={tenantId} currentTenantName={tenant.name} />
				<Separator />
			</div>
		)
	}

	return (
		<TenantManagementLayout
			titlePrefix='Tenant Settings'
			informationDescription='View and update your tenant details.'
			loadingMessage='Loading Tenant Settings...'
			backButton={{
				text: 'Back to Tenant Dashboard',
				href: `/dashboard/tenant/${tenantId}`,
			}}
			errorBackButton={{
				text: 'Go Back',
				onClick: () => window.history.back(),
			}}
			notFoundBackButton={{
				text: 'Back to Tenant Dashboard',
				href: `/dashboard/tenant/${tenantId}`,
			}}
			deleteRedirectPath={`/dashboard/tenant/${tenantId}`}
			additionalContent={quickActionsContent}
			renderOwnershipSections={renderOwnershipSections}
			// Hide the role management section since it's now on dedicated roles page
			showRoleManagement={false}
		/>
	)
}
