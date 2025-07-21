'use client'

import React from 'react'
import {DashboardLayout} from '@/components/layout/DashboardLayout'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Building2, Users, Key, Shield, Settings, ChevronRight, TrendingUp, Activity, FileText, Database, UserCheck} from 'lucide-react'
import Link from 'next/link'
import {useAuth} from '@/contexts/AuthContext'

const adminMenuItems = [
	{
		icon: Building2,
		title: 'Tenant Management',
		description: 'Create, view, and manage all tenants in the system',
		href: '/dashboard/admin/tenants',
		badge: 'Core',
		color: 'text-blue-600',
		status: 'available' as const,
	},
	{
		icon: Users,
		title: 'User Management',
		description: 'Manage global users and their tenant memberships',
		href: '/dashboard/admin/users',
		badge: 'Core',
		color: 'text-green-600',
		status: 'available' as const,
	},
	{
		icon: Shield,
		title: 'Role & Permissions',
		description: 'Configure roles, permissions, and access control',
		href: '/dashboard/admin/rbac',
		badge: 'RBAC',
		color: 'text-purple-600',
		status: 'available' as const,
	},
	{
		icon: UserCheck,
		title: 'Roles Management',
		description: 'Create and manage system roles with detailed permissions',
		href: '/dashboard/admin/roles',
		badge: 'RBAC',
		color: 'text-indigo-600',
		status: 'available' as const,
	},
	{
		icon: Key,
		title: 'DID Management',
		description: 'Manage Decentralized Identifiers across the system',
		href: '/dashboard/admin/dids',
		badge: 'Identity',
		color: 'text-orange-600',
		status: 'available' as const,
	},
	{
		icon: FileText,
		title: 'Credentials Management',
		description: 'Manage verifiable credentials and templates',
		href: '/dashboard/admin/credentials',
		badge: 'Creds',
		color: 'text-teal-600',
		status: 'available' as const,
	},
	{
		icon: Activity,
		title: 'System Logs',
		description: 'View system logs, audit trails, and security events',
		href: '/dashboard/admin/logs',
		badge: 'Monitor',
		color: 'text-red-600',
		status: 'available' as const,
	},
	{
		icon: Database,
		title: 'Analytics Dashboard',
		description: 'System metrics, usage analytics, and performance data',
		href: '/dashboard/admin/dashboard',
		badge: 'Insights',
		color: 'text-cyan-600',
		status: 'available' as const,
	},
	{
		icon: Settings,
		title: 'System Configuration',
		description: 'Global system settings and configurations',
		href: '/dashboard/admin/settings',
		badge: 'Config',
		color: 'text-gray-600',
		status: 'planned' as const,
	},
]

const quickStats = [
	{
		title: 'Total Tenants',
		value: '24',
		change: '+12%',
		changeType: 'positive' as const,
		icon: Building2,
		href: '/dashboard/admin/tenants',
	},
	{
		title: 'Total Users',
		value: '1,247',
		change: '+5%',
		changeType: 'positive' as const,
		icon: Users,
		href: '/dashboard/admin/users',
	},
	{
		title: 'Active Sessions',
		value: '89',
		change: '-2%',
		changeType: 'negative' as const,
		icon: Activity,
		href: '/dashboard/admin/logs',
	},
	{
		title: 'System Health',
		value: '99.9%',
		change: 'Stable',
		changeType: 'positive' as const,
		icon: TrendingUp,
		href: '/dashboard/admin/dashboard',
	},
]

const getStatusBadge = (status: 'available' | 'partial' | 'planned') => {
	switch (status) {
		case 'available':
			return (
				<Badge variant='default' className='text-xs'>
					Available
				</Badge>
			)
		case 'partial':
			return (
				<Badge variant='secondary' className='text-xs'>
					Partial
				</Badge>
			)
		case 'planned':
			return (
				<Badge variant='outline' className='text-xs'>
					Planned
				</Badge>
			)
		default:
			return (
				<Badge variant='outline' className='text-xs'>
					Unknown
				</Badge>
			)
	}
}

export default function AdminDashboardPage() {
	const {currentMode} = useAuth()

	return (
		<DashboardLayout title='Administration Dashboard' description='System administration and management console' showContextControls={true} allowedRoles={['admin', 'system_admin', 'SystemSuperAdmin']}>
			<div className='space-y-8'>
				{/* Context Warning for non-global mode */}
				{currentMode !== 'global' && (
					<Card className='border-yellow-200 bg-yellow-50'>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3'>
								<Shield className='h-5 w-5 text-yellow-600' />
								<div>
									<p className='text-sm font-medium text-yellow-800'>Admin functions require global context</p>
									<p className='text-xs text-yellow-700'>Switch to global mode to access all administrative features</p>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Quick Stats */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{quickStats.map((stat) => (
						<Card key={stat.title} className='hover:shadow-md transition-shadow cursor-pointer'>
							<Link href={stat.href}>
								<CardContent className='pt-6'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-muted-foreground'>{stat.title}</p>
											<p className='text-2xl font-bold'>{stat.value}</p>
											<div className='flex items-center gap-1 mt-1'>
												<span className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
												{typeof stat.change !== 'string' && <span className='text-xs text-muted-foreground'>vs last period</span>}
											</div>
										</div>
										<div className='p-2 bg-gray-100 rounded-lg'>
											<stat.icon className='h-5 w-5 text-gray-600' />
										</div>
									</div>
								</CardContent>
							</Link>
						</Card>
					))}
				</div>

				{/* Admin Menu Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{adminMenuItems.map((item) => (
						<Card key={item.href} className='group hover:shadow-md transition-shadow'>
							<CardHeader className='pb-3'>
								<div className='flex items-start justify-between'>
									<div className='flex items-center gap-3'>
										<div className='p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors'>
											<item.icon className={`h-5 w-5 ${item.color}`} />
										</div>
										<div>
											<CardTitle className='text-base group-hover:text-blue-600 transition-colors'>{item.title}</CardTitle>
											<div className='flex items-center gap-2 mt-1'>
												<Badge variant='secondary' className='text-xs'>
													{item.badge}
												</Badge>
												{getStatusBadge(item.status)}
											</div>
										</div>
									</div>
									<ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors' />
								</div>
							</CardHeader>
							<CardContent className='pt-0'>
								<CardDescription className='text-sm mb-4'>{item.description}</CardDescription>
								{item.status === 'available' ? (
									<Button asChild variant='outline' size='sm' className='w-full'>
										<Link href={item.href}>Open Module</Link>
									</Button>
								) : (
									<Button variant='ghost' size='sm' className='w-full' disabled>
										Coming Soon
									</Button>
								)}
							</CardContent>
						</Card>
					))}
				</div>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Common administrative tasks</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
							<Link href='/dashboard/tenants'>
								<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50'>
									<Building2 className='h-5 w-5 text-blue-600' />
									<span>Manage Tenants</span>
								</Button>
							</Link>
							<Link href='/dashboard/admin/users'>
								<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-center space-y-2 hover:bg-green-50'>
									<Users className='h-5 w-5 text-green-600' />
									<span>Manage Users</span>
								</Button>
							</Link>
							<Link href='/dashboard/admin/roles'>
								<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-center space-y-2 hover:bg-purple-50'>
									<Shield className='h-5 w-5 text-purple-600' />
									<span>Manage Roles</span>
								</Button>
							</Link>
							<Link href='/dashboard/admin/logs'>
								<Button variant='outline' className='w-full h-auto p-4 flex flex-col items-center space-y-2 hover:bg-red-50'>
									<Activity className='h-5 w-5 text-red-600' />
									<span>View System Logs</span>
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Activity className='h-5 w-5' />
							Recent System Activity
						</CardTitle>
						<CardDescription>Recent administrative actions and system events</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{[
								{
									action: 'Tenant "Acme Corp" created',
									user: 'admin@auth3.com',
									time: '2 minutes ago',
									type: 'create',
								},
								{
									action: 'User "john@example.com" added to tenant "Acme Corp"',
									user: 'admin@auth3.com',
									time: '15 minutes ago',
									type: 'update',
								},
								{
									action: 'Role "Manager" permissions updated',
									user: 'system@auth3.com',
									time: '1 hour ago',
									type: 'config',
								},
								{
									action: 'System backup completed successfully',
									user: 'system',
									time: '3 hours ago',
									type: 'system',
								},
								{
									action: 'DID resolution service restarted',
									user: 'system',
									time: '6 hours ago',
									type: 'system',
								},
							].map((activity, index) => (
								<div key={index} className='flex items-center justify-between py-2 border-b last:border-b-0'>
									<div className='flex items-center gap-3'>
										<div className={`w-2 h-2 rounded-full ${activity.type === 'create' ? 'bg-green-500' : activity.type === 'update' ? 'bg-blue-500' : activity.type === 'config' ? 'bg-purple-500' : 'bg-gray-500'}`} />
										<div>
											<p className='text-sm font-medium'>{activity.action}</p>
											<p className='text-xs text-muted-foreground'>by {activity.user}</p>
										</div>
									</div>
									<span className='text-xs text-muted-foreground'>{activity.time}</span>
								</div>
							))}
						</div>
						<div className='mt-4 pt-4 border-t'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/dashboard/admin/logs'>View All Logs</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
