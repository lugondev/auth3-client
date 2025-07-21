'use client'

import React from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {cn} from '@/lib/utils'
import {BarChart3, Server, Building, Users, Fingerprint, Key, PieChart, Settings, Shield, Database, Activity} from 'lucide-react'

const analyticsNavItems = [
	{
		title: 'Overview',
		href: '/dashboard/admin/analytics',
		icon: BarChart3,
		description: 'System-wide analytics overview',
		isExact: true,
	},
	{
		title: 'Authentication',
		href: '/dashboard/admin/analytics/auth',
		icon: Shield,
		description: 'Login and authentication analytics',
	},
	{
		title: 'OAuth2',
		href: '/dashboard/admin/analytics/oauth2',
		icon: Key,
		description: 'OAuth2 flow metrics and performance',
	},
	{
		title: 'DID Analytics',
		href: '/dashboard/admin/analytics/did',
		icon: Fingerprint,
		description: 'Decentralized identity operations',
	},
	{
		title: 'KMS Analytics',
		href: '/dashboard/admin/analytics/kms',
		icon: Database,
		description: 'Key management and cryptography',
	},
	{
		title: 'Tenants',
		href: '/dashboard/admin/analytics/tenants',
		icon: Building,
		description: 'Tenant-specific metrics and insights',
		badge: 'Hot',
	},
	{
		title: 'System Metrics',
		href: '/dashboard/admin/analytics/system',
		icon: Server,
		description: 'Performance and uptime metrics',
	},
	{
		title: 'User Analytics',
		href: '/dashboard/admin/analytics/users',
		icon: Users,
		description: 'User behavior and engagement',
	},
]

interface AnalyticsLayoutProps {
	children: React.ReactNode
}

export default function AnalyticsLayout({children}: AnalyticsLayoutProps) {
	const pathname = usePathname()

	const isActiveRoute = (href: string, isExact?: boolean) => {
		if (isExact) {
			return pathname === href
		}
		return pathname.startsWith(href)
	}

	return (
		<div className='flex h-full min-h-screen'>
			{/* Sidebar */}
			<aside className='w-80 border-r bg-background p-6 hidden lg:block'>
				<div className='mb-6'>
					<h2 className='text-2xl font-bold text-foreground mb-2 flex items-center gap-2'>
						<BarChart3 className='h-6 w-6 text-primary' />
						Analytics Hub
					</h2>
					<p className='text-sm text-muted-foreground'>Comprehensive system monitoring and insights</p>
				</div>

				{/* Quick Stats */}
				<Card className='mb-6'>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm flex items-center gap-2'>
							<PieChart className='h-4 w-4' />
							Quick Overview
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='flex justify-between items-center'>
							<span className='text-xs text-muted-foreground'>System Status</span>
							<Badge variant='default' className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
								Healthy
							</Badge>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-xs text-muted-foreground'>Active Users</span>
							<span className='text-sm font-semibold'>1,247</span>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-xs text-muted-foreground'>API Calls/min</span>
							<span className='text-sm font-semibold'>342</span>
						</div>
					</CardContent>
				</Card>

				{/* Navigation */}
				<nav className='space-y-2'>
					<div className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3'>Analytics Sections</div>
					{analyticsNavItems.map((item) => {
						const Icon = item.icon
						const isActive = isActiveRoute(item.href, item.isExact)

						return (
							<Link key={item.href} href={item.href} className={cn('group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground', isActive ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
								<Icon className={cn('mr-3 h-4 w-4 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
								<div className='flex-1'>
									<div className='flex items-center justify-between'>
										<span>{item.title}</span>
										{item.badge && (
											<Badge variant='secondary' className='ml-auto text-xs'>
												{item.badge}
											</Badge>
										)}
									</div>
									<p className='text-xs text-muted-foreground mt-0.5 leading-tight'>{item.description}</p>
								</div>
							</Link>
						)
					})}
				</nav>
			</aside>

			{/* Main Content */}
			<main className='flex-1 overflow-hidden'>
				<div className='h-full overflow-auto'>{children}</div>
			</main>
		</div>
	)
}
