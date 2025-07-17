'use client'

import React from 'react'
import {useParams, usePathname} from 'next/navigation'
import Link from 'next/link'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {useAuth} from '@/contexts/AuthContext'
import {Building, Home, Users, Settings, BarChart3, Activity, Shield, Key, CreditCard, Presentation, Fingerprint} from 'lucide-react'

interface TenantSidebarProps {
	tenantId: string
}

export const TenantSidebar: React.FC<TenantSidebarProps> = ({tenantId}) => {
	const pathname = usePathname()

	const menuItems = [
		{
			icon: Home,
			label: 'Dashboard',
			href: `/dashboard/tenant/${tenantId}`,
			description: 'Tenant overview',
		},
		{
			icon: Users,
			label: 'Users',
			href: `/dashboard/tenant/${tenantId}/users`,
			description: 'Manage tenant users',
		},
		{
			icon: Shield,
			label: 'Roles',
			href: `/dashboard/tenant/${tenantId}/roles`,
			description: 'Manage roles & permissions',
		},
		{
			icon: Fingerprint,
			label: 'DID',
			href: `/dashboard/tenant/${tenantId}/did`,
			description: 'DID management',
		},
		{
			icon: CreditCard,
			label: 'Credentials',
			href: `/dashboard/tenant/${tenantId}/credentials`,
			description: 'Manage verifiable credentials',
		},
		{
			icon: Presentation,
			label: 'Presentations',
			href: `/dashboard/tenant/${tenantId}/presentations`,
			description: 'Manage presentations',
		},
		{
			icon: BarChart3,
			label: 'Analytics',
			href: `/dashboard/tenant/${tenantId}/analytics`,
			description: 'View analytics',
		},
		{
			icon: Activity,
			label: 'Activity',
			href: `/dashboard/tenant/${tenantId}/activity`,
			description: 'Activity logs',
		},
		{
			icon: Key,
			label: 'Security',
			href: `/dashboard/tenant/${tenantId}/security`,
			description: 'Security settings',
		},
		{
			icon: Settings,
			label: 'Settings',
			href: `/dashboard/tenant/${tenantId}/settings`,
			description: 'Tenant settings',
		},
	]

	return (
		<div className='flex flex-col h-full'>
			{/* Tenant Header */}
			<div className='p-4 border-b'>
				<div className='flex items-center space-x-3'>
					<div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'>
						<Building className='h-5 w-5 text-blue-600 dark:text-blue-400' />
					</div>
					<div>
						<h2 className='font-semibold text-sm'>Tenant Space</h2>
						<p className='text-xs text-muted-foreground'>ID: {tenantId}</p>
					</div>
				</div>
			</div>

			{/* Navigation Menu */}
			<div className='flex-1 overflow-y-auto'>
				<div className='p-4 space-y-1'>
					{menuItems.map((item) => {
						const isActive = pathname === item.href

						return (
							<Link key={item.href} href={item.href}>
								<Button variant={isActive ? 'secondary' : 'ghost'} className={cn('w-full justify-start gap-3 h-auto p-3', isActive && 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100')}>
									<item.icon className='h-4 w-4 flex-shrink-0' />
									<div className='flex-1 text-left'>
										<div className='font-medium text-sm'>{item.label}</div>
										<div className='text-xs text-muted-foreground'>{item.description}</div>
									</div>
								</Button>
							</Link>
						)
					})}
				</div>
			</div>

			{/* Footer */}
			<div className='p-4 border-t'>
				<div className='text-xs text-muted-foreground text-center'>Tenant Workspace</div>
			</div>
		</div>
	)
}
