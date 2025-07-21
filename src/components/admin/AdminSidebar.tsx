'use client'

import React from 'react'
import {usePathname} from 'next/navigation'
import Link from 'next/link'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Shield, Home, Building2, Users, Key, UserCheck, FileText, Activity, Settings, BarChart3} from 'lucide-react'

export const AdminSidebar: React.FC = () => {
	const pathname = usePathname()

	const menuItems = [
		{
			icon: Home,
			label: 'Dashboard',
			href: '/dashboard/admin',
			description: 'Admin overview',
			badge: null,
		},
		{
			icon: Building2,
			label: 'Tenants',
			href: '/dashboard/admin/tenants',
			description: 'Manage tenants',
			badge: 'Core',
		},
		{
			icon: Users,
			label: 'Users',
			href: '/dashboard/admin/users',
			description: 'Manage users',
			badge: 'Core',
		},
		{
			icon: Shield,
			label: 'RBAC',
			href: '/dashboard/admin/rbac',
			description: 'Role permissions',
			badge: 'RBAC',
		},
		{
			icon: UserCheck,
			label: 'Roles',
			href: '/dashboard/admin/roles',
			description: 'Manage roles',
			badge: 'RBAC',
		},
		{
			icon: Key,
			label: 'DIDs',
			href: '/dashboard/admin/dids',
			description: 'Identity management',
			badge: 'Identity',
		},
		{
			icon: FileText,
			label: 'Credentials',
			href: '/dashboard/admin/credentials',
			description: 'Verifiable credentials',
			badge: 'Creds',
		},
		{
			icon: Shield,
			label: 'OAuth2',
			href: '/dashboard/admin/oauth2',
			description: 'OAuth2 applications',
			badge: 'Auth',
		},
		{
			icon: Activity,
			label: 'Logs',
			href: '/dashboard/admin/logs',
			description: 'System logs',
			badge: 'Monitor',
		},
		{
			icon: BarChart3,
			label: 'Analytics',
			href: '/dashboard/admin/analytics',
			description: 'System metrics',
			badge: 'Insights',
		},
		{
			icon: Settings,
			label: 'Settings',
			href: '/dashboard/admin/settings',
			description: 'System config',
			badge: 'Config',
		},
	]

	const getBadgeVariant = (badge: string | null) => {
		if (!badge) return null

		switch (badge) {
			case 'Core':
				return 'default'
			case 'RBAC':
				return 'secondary'
			case 'Identity':
				return 'outline'
			case 'Creds':
				return 'secondary'
			case 'Auth':
				return 'default'
			case 'Monitor':
				return 'destructive'
			case 'Insights':
				return 'default'
			case 'Config':
				return 'outline'
			default:
				return 'secondary'
		}
	}

	return (
		<div className='flex flex-col h-full'>
			{/* Admin Header */}
			<div className='p-4 border-b'>
				<div className='flex items-center space-x-3'>
					<div className='p-2 bg-red-100 dark:bg-red-900 rounded-lg'>
						<Shield className='h-5 w-5 text-red-600 dark:text-red-400' />
					</div>
					<div>
						<h2 className='font-semibold text-sm'>Admin Space</h2>
						<p className='text-xs text-muted-foreground'>System Administration</p>
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
								<Button variant={isActive ? 'secondary' : 'ghost'} className={cn('w-full justify-start gap-3 h-auto p-3', isActive && 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100')}>
									<item.icon className='h-4 w-4 flex-shrink-0' />
									<div className='flex-1 text-left'>
										<div className='flex items-center gap-2'>
											<span className='font-medium text-sm'>{item.label}</span>
											{item.badge && (
												<Badge variant={getBadgeVariant(item.badge)} className='text-xs h-4 px-1'>
													{item.badge}
												</Badge>
											)}
										</div>
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
				<div className='text-xs text-muted-foreground text-center'>System Administration</div>
			</div>
		</div>
	)
}
