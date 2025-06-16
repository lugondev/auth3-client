'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
	Users, 
	Shield, 
	Key, 
	Settings, 
	FileText, 
	Activity, 
	Database,
	Building,
	UserCheck
} from 'lucide-react'

interface AdminFeature {
	title: string
	description: string
	href: string
	icon: React.ReactNode
	status: 'available' | 'partial' | 'planned'
}

const adminFeatures: AdminFeature[] = [
	{
		title: 'User Management',
		description: 'Manage system users, view profiles, edit user information, and control user status.',
		href: '/dashboard/admin/users',
		icon: <Users className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'Role & Permission Management',
		description: 'Configure roles, permissions, and access control policies for users and tenants.',
		href: '/dashboard/admin/rbac',
		icon: <Shield className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'Roles Management',
		description: 'Create and manage system roles with detailed permission assignments.',
		href: '/dashboard/admin/roles',
		icon: <UserCheck className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'DID Management',
		description: 'Manage Decentralized Identifiers (DIDs) across the system.',
		href: '/dashboard/admin/dids',
		icon: <Key className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'Tenant Management',
		description: 'Manage tenants, their configurations, and tenant-specific settings.',
		href: '/dashboard/admin/tenants',
		icon: <Building className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'Credentials Management',
		description: 'Manage verifiable credentials, templates, and credential revocation.',
		href: '/dashboard/admin/credentials',
		icon: <FileText className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'System Logs',
		description: 'View and analyze system logs, audit trails, and security events.',
		href: '/dashboard/admin/logs',
		icon: <Activity className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'Analytics Dashboard',
		description: 'View system analytics, usage statistics, and performance metrics.',
		href: '/dashboard/admin/dashboard',
		icon: <Database className="h-6 w-6" />,
		status: 'available'
	},
	{
		title: 'System Settings',
		description: 'Configure global system settings, security policies, and integrations.',
		href: '/dashboard/admin/settings',
		icon: <Settings className="h-6 w-6" />,
		status: 'planned'
	}
]

const getStatusColor = (status: AdminFeature['status']) => {
	switch (status) {
		case 'available':
			return 'bg-green-100 text-green-800 border-green-200'
		case 'partial':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200'
		case 'planned':
			return 'bg-gray-100 text-gray-800 border-gray-200'
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200'
	}
}

const getStatusText = (status: AdminFeature['status']) => {
	switch (status) {
		case 'available':
			return 'Available'
		case 'partial':
			return 'Partial'
		case 'planned':
			return 'Planned'
		default:
			return 'Unknown'
	}
}

export default function AdminPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Manage users, roles, permissions, and system settings from this central admin panel.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{adminFeatures.map((feature) => (
					<Card key={feature.href} className="relative hover:shadow-md transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center space-x-3">
									<div className="p-2 bg-primary/10 rounded-lg">
										{feature.icon}
									</div>
									<CardTitle className="text-lg">{feature.title}</CardTitle>
								</div>
								<span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(feature.status)}`}>
									{getStatusText(feature.status)}
								</span>
							</div>
							<CardDescription className="text-sm leading-relaxed">
								{feature.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							{feature.status === 'available' ? (
								<Link href={feature.href}>
									<Button className="w-full">
										Access {feature.title}
									</Button>
								</Link>
							) : feature.status === 'partial' ? (
								<Link href={feature.href}>
									<Button variant="outline" className="w-full">
										View {feature.title}
									</Button>
								</Link>
							) : (
								<Button variant="ghost" className="w-full" disabled>
									Coming Soon
								</Button>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-8">
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>
							Common administrative tasks
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<Link href="/dashboard/admin/users/new">
								<Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
									<Users className="h-5 w-5" />
									<span>Create User</span>
								</Button>
							</Link>
							<Link href="/dashboard/admin/roles">
								<Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
									<Shield className="h-5 w-5" />
									<span>Manage Roles</span>
								</Button>
							</Link>
							<Link href="/dashboard/admin/tenants">
								<Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
									<Building className="h-5 w-5" />
									<span>Manage Tenants</span>
								</Button>
							</Link>
							<Link href="/dashboard/admin/logs">
								<Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
									<Activity className="h-5 w-5" />
									<span>View Logs</span>
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8">
				<Card>
					<CardHeader>
						<CardTitle>System Status</CardTitle>
						<CardDescription>
							Overview of system health and recent activity
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">Online</div>
								<div className="text-sm text-muted-foreground">System Status</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">Active</div>
								<div className="text-sm text-muted-foreground">Admin Features</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-600">Ready</div>
								<div className="text-sm text-muted-foreground">User Management</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
