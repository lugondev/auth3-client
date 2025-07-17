'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {LayoutDashboard, Users, ShieldCheck, Settings, Globe, Building2, CreditCard, Presentation, Menu} from 'lucide-react'
import Link from 'next/link'
import {cn} from '@/lib/utils'
import {useState} from 'react'

export default function TenantDashboard() {
	const {currentMode, currentTenantId, user} = useAuth()
	const [sidebarOpen, setSidebarOpen] = useState(false)

	// Redirect to global if not in tenant context
	if (currentMode !== 'tenant') {
		return (
			<div className='container mx-auto px-4 py-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Globe className='h-5 w-5 text-blue-600' />
							Global Context Active
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground'>This is the organization dashboard. It's only available when you switch to a tenant context. Please use the tenant selector to switch to an organization.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	const sidebarItems = [
		{
			title: 'Dashboard',
			href: '/dashboard/tenant',
			icon: LayoutDashboard,
		},
		{
			title: 'Members',
			href: '/dashboard/tenant/members',
			icon: Users,
		},
		{
			title: 'Roles',
			href: '/dashboard/tenant/roles',
			icon: ShieldCheck,
		},
		{
			title: 'Credentials',
			href: '/dashboard/tenant/credentials',
			icon: CreditCard,
		},
		{
			title: 'Presentations',
			href: '/dashboard/tenant/presentations',
			icon: Presentation,
		},
		{
			title: 'Settings',
			href: '/dashboard/tenant/settings',
			icon: Settings,
		},
	]

	return (
		<div className='flex h-screen bg-gray-50'>
			{/* Sidebar */}
			<div className={cn('fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
				<div className='flex h-full flex-col'>
					{/* Sidebar Header */}
					<div className='flex h-16 items-center justify-between px-4 border-b'>
						<h2 className='text-lg font-semibold text-gray-900'>Organization</h2>
						<Button variant='ghost' size='sm' className='lg:hidden' onClick={() => setSidebarOpen(false)}>
							<Menu className='h-4 w-4' />
						</Button>
					</div>

					{/* Current Tenant Info */}
					<div className='p-4 border-b bg-gray-50'>
						<div className='text-sm font-medium text-gray-900'>{currentTenantId}</div>
						<div className='text-xs text-gray-500'>Tenant ID</div>
					</div>

					{/* Navigation */}
					<nav className='flex-1 space-y-1 p-4'>
						{sidebarItems.map((item) => {
							const Icon = item.icon
							return (
								<Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')}>
									<Icon className='h-4 w-4' />
									{item.title}
								</Link>
							)
						})}
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<div className='flex-1 flex flex-col min-h-0'>
				{/* Mobile header */}
				<div className='lg:hidden flex h-16 items-center justify-between px-4 bg-white border-b'>
					<Button variant='ghost' size='sm' onClick={() => setSidebarOpen(true)}>
						<Menu className='h-4 w-4' />
					</Button>
					<h1 className='text-lg font-semibold'>Organization Dashboard</h1>
					<div />
				</div>

				{/* Main content area */}
				<main className='flex-1 overflow-auto'>
					<div className='container mx-auto px-4 py-8'>
						<div className='space-y-6'>
							<div className='hidden lg:block'>
								<h1 className='text-3xl font-bold tracking-tight'>Organization Dashboard</h1>
								<p className='text-muted-foreground'>Welcome to your organization workspace</p>
							</div>

							{/* Context Info Cards */}
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>Current Organization</CardTitle>
										<Building2 className='h-4 w-4 text-green-600' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>{currentTenantId}</div>
										<p className='text-xs text-muted-foreground'>Tenant ID</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>Your Role</CardTitle>
										<ShieldCheck className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='flex flex-wrap gap-1'>
											{user?.roles?.map((role) => (
												<Badge key={role} variant='secondary' className='text-xs'>
													{role}
												</Badge>
											)) || <Badge variant='outline'>No roles</Badge>}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>Context Mode</CardTitle>
										<Building2 className='h-4 w-4 text-green-600' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold capitalize'>{currentMode}</div>
										<p className='text-xs text-muted-foreground'>Organization context</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>User Email</CardTitle>
										<Users className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-sm font-medium'>{user?.email || 'N/A'}</div>
										<p className='text-xs text-muted-foreground'>Organization member</p>
									</CardContent>
								</Card>
							</div>

							{/* Quick Actions - Focus on Credentials and Presentations */}
							<div className='grid gap-4 md:grid-cols-2'>
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<CreditCard className='h-5 w-5' />
											Credentials Management
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground mb-4'>Create, manage, and verify credentials for your organization. Control the lifecycle of verifiable credentials.</p>
										<div className='space-y-2'>
											<Button asChild className='w-full'>
												<Link href='/dashboard/tenant/credentials'>
													<CreditCard className='mr-2 h-4 w-4' />
													Manage Credentials
												</Link>
											</Button>
											<Button asChild variant='outline' className='w-full'>
												<Link href='/dashboard/tenant/credentials/create'>Create New Credential</Link>
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Presentation className='h-5 w-5' />
											Presentations Management
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground mb-4'>Create verifiable presentations from your credentials. Share proof of credentials securely.</p>
										<div className='space-y-2'>
											<Button asChild className='w-full'>
												<Link href='/dashboard/tenant/presentations'>
													<Presentation className='mr-2 h-4 w-4' />
													Manage Presentations
												</Link>
											</Button>
											<Button asChild variant='outline' className='w-full'>
												<Link href='/dashboard/tenant/presentations/create'>Create Presentation</Link>
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Additional Actions */}
							<div className='grid gap-4 md:grid-cols-3'>
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Users className='h-5 w-5' />
											Team Management
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground mb-4'>Invite and manage team members for your organization.</p>
										<Button asChild className='w-full' variant='outline'>
											<Link href='/dashboard/tenant/members'>
												<Users className='mr-2 h-4 w-4' />
												Members
											</Link>
										</Button>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<ShieldCheck className='h-5 w-5' />
											Access Control
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground mb-4'>Configure roles and permissions for your organization.</p>
										<Button asChild className='w-full' variant='outline'>
											<Link href='/dashboard/tenant/roles'>
												<ShieldCheck className='mr-2 h-4 w-4' />
												Roles
											</Link>
										</Button>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Settings className='h-5 w-5' />
											Organization Settings
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground mb-4'>Configure organization preferences and security policies.</p>
										<Button asChild className='w-full' variant='outline'>
											<Link href='/dashboard/tenant/settings'>
												<Settings className='mr-2 h-4 w-4' />
												Settings
											</Link>
										</Button>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</main>
			</div>

			{/* Mobile overlay */}
			{sidebarOpen && <div className='fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden' onClick={() => setSidebarOpen(false)} />}
		</div>
	)
}
