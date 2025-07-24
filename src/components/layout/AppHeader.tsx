'use client'

import React from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {User, Settings, LogOut, Shield, Building2, Globe, Menu, Home, Users, FileText, Database, Key, CheckCircle, Share2} from 'lucide-react'
import {cn} from '@/lib/utils'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'

interface NavigationItem {
	label: string
	href: string
	icon: React.ComponentType<{className?: string}>
	roles: string[]
	description?: string
}

export interface AppHeaderProps {
	showNavigation?: boolean
	showContextSwitcher?: boolean
	showTenantSelector?: boolean
	className?: string
}

const navigationItems: NavigationItem[] = [
	{
		label: 'Dashboard',
		href: '/dashboard',
		icon: Home,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Main overview and analytics',
	},
	{
		label: 'DIDs',
		href: '/dashboard/dids',
		icon: Key,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Manage Decentralized Identifiers',
	},
	{
		label: 'Credentials',
		href: '/dashboard/credentials',
		icon: CheckCircle,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Verifiable Credentials',
	},
	{
		label: 'Presentations',
		href: '/dashboard/presentations',
		icon: Share2,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Verifiable Presentations',
	},
	{
		label: 'DID Management',
		href: '/dashboard/did-management',
		icon: Settings,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Advanced DID Operations',
	},
	{
		label: 'My Tenants',
		href: '/dashboard/tenants',
		icon: Building2,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Multi-tenant management',
	},
	{
		label: 'Templates',
		href: '/dashboard/templates',
		icon: FileText,
		roles: ['user', 'admin', 'system_admin'],
		description: 'Credential templates',
	},
	{
		label: 'Administration',
		href: '/dashboard/admin',
		icon: Shield,
		roles: ['admin', 'system_admin'],
		description: 'System administration',
	},
]

export function AppHeader({showNavigation = true, showContextSwitcher = true, showTenantSelector = true, className}: AppHeaderProps) {
	const {user, logout, currentMode, currentTenantId} = useAuth()
	const pathname = usePathname()

	// Check if user has required role for navigation item
	const hasRole = (requiredRoles: string[]) => {
		if (!user?.roles) return false
		return requiredRoles.some((role) => user.roles?.includes(role))
	}

	// Get user display name
	const getUserDisplayName = () => {
		if (user?.first_name && user?.last_name) {
			return `${user.first_name} ${user.last_name}`
		}
		if (user?.first_name) {
			return user.first_name
		}
		return user?.email || 'User'
	}

	// Get user initials for avatar
	const getUserInitials = () => {
		if (user?.first_name && user?.last_name) {
			return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
		}
		if (user?.first_name) {
			return user.first_name[0].toUpperCase()
		}
		return user?.email?.[0]?.toUpperCase() || 'U'
	}

	// Handle logout
	const handleLogout = async () => {
		try {
			await logout() // Full logout, not contextOnly
		} catch (error) {
			console.error('Logout failed:', error)
		}
	}

	return (
		<header className={cn('border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50', className)}>
			<div className='container mx-auto px-4'>
				<div className='flex h-16 items-center justify-between'>
					{/* Logo and Navigation */}
					<div className='flex items-center gap-6'>
						{/* Logo */}
						<Link href='/dashboard' className='flex items-center gap-2'>
							<div className='h-8 w-8 rounded-lg bg-primary flex items-center justify-center'>
								<Shield className='h-5 w-5 text-primary-foreground' />
							</div>
							<span className='font-semibold text-lg'>Auth3</span>
						</Link>

						{/* Navigation */}
						{showNavigation && (
							<nav className='hidden md:flex items-center space-x-1'>
								{navigationItems
									.filter((item) => hasRole(item.roles))
									.map((item) => {
										const Icon = item.icon
										const isActive = pathname.startsWith(item.href)

										return (
											<Link key={item.href} href={item.href}>
												<Button variant={isActive ? 'secondary' : 'ghost'} size='sm' className='gap-2'>
													<Icon className='h-4 w-4' />
													<span className='hidden lg:inline'>{item.label}</span>
												</Button>
											</Link>
										)
									})}
							</nav>
						)}
					</div>

					{/* Context and User Controls */}
					<div className='flex items-center gap-3'>
						{/* Context Information Display */}
						<div className='hidden lg:flex items-center gap-2 text-sm text-muted-foreground'>
							{currentMode === 'global' ? (
								<div className='flex items-center gap-1'>
									<Globe className='h-4 w-4 text-blue-600' />
									<span>Global</span>
								</div>
							) : (
								<div className='flex items-center gap-1'>
									<Building2 className='h-4 w-4 text-green-600' />
									<span>{currentTenantId || 'Tenant'}</span>
								</div>
							)}
						</div>

						<Separator orientation='vertical' className='h-6 hidden lg:block' />

						{/* Tenant Selector */}
						{showTenantSelector && (
							<div className='hidden sm:block'>
								<TenantSelector variant='dropdown' showGlobalOption={true} showCreateButton={false} showManageButton={false} />
							</div>
						)}

						{/* Context Switcher */}
						{showContextSwitcher && (
							<div className='hidden sm:block'>
								<ContextSwitcher variant='dropdown' size='sm' showCurrentContext={false} showRefreshButton={false} />
							</div>
						)}

						{/* User Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='relative h-8 w-8 rounded-full'>
									<Avatar className='h-8 w-8'>
										<AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
										<AvatarFallback>{getUserInitials()}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='w-80' align='end' forceMount>
								{/* User Info */}
								<div className='flex items-center space-x-3 p-3'>
									<Avatar className='h-10 w-10'>
										<AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
										<AvatarFallback>{getUserInitials()}</AvatarFallback>
									</Avatar>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium leading-none truncate'>{getUserDisplayName()}</p>
										<p className='text-xs text-muted-foreground truncate'>{user?.email}</p>
										<div className='flex flex-wrap gap-1 mt-1'>
											{user?.roles?.map((role) => (
												<Badge key={role} variant='outline' className='text-xs'>
													{role}
												</Badge>
											))}
										</div>
									</div>
								</div>

								<DropdownMenuSeparator />

								{/* Context Info (Mobile) */}
								<div className='sm:hidden'>
									<DropdownMenuLabel>Current Context</DropdownMenuLabel>
									<div className='px-2 py-1'>
										{currentMode === 'global' ? (
											<div className='flex items-center gap-2 text-sm'>
												<Globe className='h-4 w-4 text-blue-600' />
												<span>Global Context</span>
											</div>
										) : (
											<div className='flex items-center gap-2 text-sm'>
												<Building2 className='h-4 w-4 text-green-600' />
												<span>Tenant: {currentTenantId}</span>
											</div>
										)}
									</div>
									<DropdownMenuSeparator />
								</div>

								{/* Menu Items */}
								<DropdownMenuItem asChild>
									<Link href='/dashboard/profile' className='cursor-pointer'>
										<User className='mr-2 h-4 w-4' />
										<span>Profile</span>
									</Link>
								</DropdownMenuItem>

								<DropdownMenuItem asChild>
									<Link href='/dashboard/settings' className='cursor-pointer'>
										<Settings className='mr-2 h-4 w-4' />
										<span>Settings</span>
									</Link>
								</DropdownMenuItem>

								{hasRole(['admin', 'system_admin']) && (
									<DropdownMenuItem asChild>
										<Link href='/dashboard/admin' className='cursor-pointer'>
											<Shield className='mr-2 h-4 w-4' />
											<span>Admin Panel</span>
										</Link>
									</DropdownMenuItem>
								)}

								<DropdownMenuSeparator />

								{/* Mobile Context Controls */}
								<div className='sm:hidden space-y-2 p-2'>
									<div className='text-xs font-medium text-muted-foreground mb-2'>Quick Actions</div>
									{showTenantSelector && <TenantSelector variant='compact' showGlobalOption={true} showCreateButton={false} showManageButton={false} className='w-full' />}
									{showContextSwitcher && <ContextSwitcher variant='button-group' size='sm' showCurrentContext={false} className='w-full' />}
									<DropdownMenuSeparator />
								</div>

								<DropdownMenuItem onClick={handleLogout} className='cursor-pointer text-red-600'>
									<LogOut className='mr-2 h-4 w-4' />
									<span>Log out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Mobile Navigation Menu */}
						{showNavigation && (
							<div className='md:hidden'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant='ghost' size='sm'>
											<Menu className='h-5 w-5' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-56'>
										<DropdownMenuLabel>Navigation</DropdownMenuLabel>
										<DropdownMenuSeparator />{' '}
										{navigationItems
											.filter((item) => hasRole(item.roles))
											.map((item) => {
												const Icon = item.icon
												const isActive = pathname.startsWith(item.href)

												return (
													<DropdownMenuItem key={item.href} asChild>
														<Link href={item.href} className='cursor-pointer flex flex-col items-start py-3'>
															<div className='flex items-center w-full'>
																<Icon className='mr-2 h-4 w-4' />
																<span>{item.label}</span>
																{isActive && (
																	<Badge variant='secondary' className='ml-auto text-xs'>
																		Active
																	</Badge>
																)}
															</div>
															{item.description && <span className='text-xs text-muted-foreground ml-6'>{item.description}</span>}
														</Link>
													</DropdownMenuItem>
												)
											})}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	)
}
