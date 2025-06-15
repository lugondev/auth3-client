// @/components/layout/Sidebar.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import {
	LayoutDashboard,
	Building,
	Users,
	ShieldCheck,
	FileText,
	Settings,
	UserCircle, // Added for Profile
	ChevronDown, // For collapsible icon
	ChevronRight, // For collapsible icon
	KeyRound, // OAuth2 icon
	ListChecks, // OAuth2 list icon
	Lock, // For disabled items
	TestTube, // For permissions demo
	CreditCard, // For credentials
	MessageSquare, // For messages
	Plus, // For create actions
	Eye, // For view actions
} from 'lucide-react'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils'
import {usePermissions} from '@/contexts/PermissionContext'

interface NavLink {
	href: string
	label: string
	icon: React.ElementType // Correct type for a React component
	children?: NavLink[]
	isCollapsible?: boolean
	permission?: string // Permission required to view this link
	role?: string // Role required to view this link
}

interface SidebarProps {
	type?: 'system' | 'user' // Added 'user' type
	tenantId?: string // Only for tenant type
	tenantName?: string // Only for tenant type
}

const systemAdminLinks: NavLink[] = [
	{href: '/dashboard/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'admin:dashboard:read'},
	{href: '/dashboard/admin/tenants', label: 'Tenant Management', icon: Building, permission: 'admin:tenants:read'},
	{href: '/dashboard/admin/users', label: 'User Management', icon: Users, permission: 'admin:users:read'},
	{href: '/dashboard/admin/roles', label: 'Global Roles & Permissions', icon: ShieldCheck, permission: 'admin:roles:read'},
	{
		href: '/dashboard/admin/dids',
		label: 'DID Administration',
		icon: KeyRound,
		permission: 'admin:dids:read',
		isCollapsible: true,
		children: [
			{href: '/dashboard/admin/dids', label: 'DID Dashboard', icon: LayoutDashboard, permission: 'admin:dids:read'},
			{href: '/dashboard/admin/dids/config', label: 'Method Configuration', icon: Settings, permission: 'admin:dids:config'},
		],
	},
	{
		href: '/dashboard/admin/credentials',
		label: 'VC Administration',
		icon: CreditCard,
		permission: 'admin:credentials:read',
		isCollapsible: true,
		children: [
			{href: '/dashboard/admin/credentials', label: 'VC Dashboard', icon: LayoutDashboard, permission: 'admin:credentials:read'},
			{href: '/dashboard/admin/credentials/templates', label: 'Templates Management', icon: FileText, permission: 'admin:credentials:templates'},
			{href: '/dashboard/admin/credentials/revocation', label: 'Revocation Management', icon: ShieldCheck, permission: 'admin:credentials:revoke'},
		],
	},
	{
		href: '/dashboard/permissions-demo',
		label: 'Permissions Demo',
		icon: TestTube,
		isCollapsible: true,
		permission: 'admin:permissions:demo',
		children: [
			{href: '/dashboard/permissions-demo', label: 'Basic Demo', icon: TestTube, permission: 'admin:permissions:demo'},
			{href: '/dashboard/permissions-demo/enhanced', label: 'Enhanced Demo', icon: TestTube, permission: 'admin:permissions:demo'},
			{href: '/dashboard/permissions-demo/dual-context', label: 'Dual Context Demo', icon: TestTube, permission: 'admin:permissions:demo'},
		],
	},
	{
		href: '/dashboard/oauth2',
		label: 'OAuth2 Management',
		icon: KeyRound,
		isCollapsible: true,
		permission: 'admin:oauth2:read',
		children: [
			{href: '/dashboard/oauth2/clients', label: 'Client List', icon: ListChecks, permission: 'admin:oauth2:read'},
			{href: '/dashboard/oauth2/create', label: 'Create Client', icon: KeyRound, permission: 'admin:oauth2:create'},
			{
				href: '/dashboard/oauth2/advanced',
				label: 'Advanced Settings',
				icon: Settings,
				isCollapsible: true,
				permission: 'admin:oauth2:advanced',
				children: [
					{href: '/dashboard/oauth2/scopes', label: 'Manage Scopes', icon: ShieldCheck, permission: 'admin:oauth2:scopes'},
					{href: '/dashboard/oauth2/tokens', label: 'Token Management', icon: KeyRound, permission: 'admin:oauth2:tokens'},
					{href: '/dashboard/oauth2/audit', label: 'Audit Logs', icon: FileText, permission: 'admin:oauth2:audit'},
				],
			},
		],
	},
	{href: '/dashboard/admin/logs', label: 'System Logs', icon: FileText, permission: 'admin:logs:read'},
]

const adminParentLink: NavLink = {
	href: '#', // Parent link doesn't navigate directly
	label: 'Admin',
	icon: Settings, // Or a more generic admin icon
	isCollapsible: true,
	children: systemAdminLinks,
}

const userLinks: NavLink[] = [
	{href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view'},
	{href: '/dashboard/profile', label: 'Profile', icon: UserCircle, permission: 'profile:view'},
	{
		href: '/dashboard/dids',
		label: 'DID Management',
		icon: KeyRound,
		permission: 'did:view',
		isCollapsible: true,
		children: [
			{href: '/dashboard/dids', label: 'Overview', icon: KeyRound, permission: 'did:view'},
			{href: '/dashboard/dids/create', label: 'Create DID', icon: Plus, permission: 'did:create'},
			{href: '/dashboard/dids/settings', label: 'Settings', icon: Settings, permission: 'did:manage'},
		],
	},
	{
		href: '/dashboard/credentials',
		label: 'Credentials',
		icon: CreditCard,
		permission: 'credentials:view',
		isCollapsible: true,
		children: [
			{href: '/dashboard/credentials', label: 'Overview', icon: CreditCard, permission: 'credentials:view'},
			{href: '/dashboard/credentials/issue', label: 'Issue Credential', icon: Plus, permission: 'credentials:issue'},
			{href: '/dashboard/credentials/verify', label: 'Verify Credential', icon: Eye, permission: 'credentials:verify'},
			{href: '/dashboard/credentials/templates', label: 'Templates', icon: FileText, permission: 'credentials:templates'},
		],
	},
	{
		href: '/dashboard/messages',
		label: 'Messages',
		icon: MessageSquare,
		permission: 'messages:view',
		isCollapsible: true,
		children: [
			{href: '/dashboard/messages', label: 'Inbox', icon: MessageSquare, permission: 'messages:view'},
			{href: '/dashboard/messages/sent', label: 'Sent', icon: MessageSquare, permission: 'messages:view'},
			{href: '/dashboard/messages/connections', label: 'Connections', icon: Users, permission: 'messages:connections'},
		],
	},
	{
		href: '/dashboard/tenant-management',
		label: 'Organizations',
		icon: Building,
		permission: 'tenant:view',
		isCollapsible: true,
		children: [
			{href: '/dashboard/tenant-management', label: 'Overview', icon: Building, permission: 'tenant:view'},
			{href: '/dashboard/tenant-management/settings', label: 'Settings', icon: Settings, permission: 'tenant:manage'},
			{href: '/dashboard/tenant-management/members', label: 'Members', icon: Users, permission: 'tenant:members:view'},
			{href: '/dashboard/tenant-management/roles', label: 'Roles', icon: ShieldCheck, permission: 'tenant:roles:view'},
		],
	},
]

const Sidebar: React.FC<SidebarProps> = ({type}) => {
	const [openAdminMenu, setOpenAdminMenu] = React.useState(true)
	const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({})
	const {hasPermission, hasRole} = usePermissions()

	const toggleAdminMenu = () => {
		setOpenAdminMenu(!openAdminMenu)
	}

	const toggleSubmenu = (key: string) => {
		setOpenSubmenus((prev) => ({
			...prev,
			[key]: !prev[key],
		}))
	}

	// Check if user has access to a nav link
	const hasAccess = (link: NavLink): boolean => {
		// Special case for system admin with wildcard permissions
		if (hasPermission('*.*') || hasPermission('*:*') || hasPermission('.*:.*')) {
			return true
		}

		if (link.permission && !hasPermission(link.permission)) {
			return false
		}
		if (link.role && !hasRole(link.role)) {
			return false
		}
		return true
	}

	// Get tooltip message for disabled links
	const getTooltipMessage = (link: NavLink): string => {
		if (link.permission && !hasPermission(link.permission)) {
			return `Requires permission: ${link.permission}`
		}
		if (link.role && !hasRole(link.role)) {
			return `Requires role: ${link.role}`
		}
		return ''
	}

	const links = (() => {
		if (type === 'system') {
			// Place userLinks first, then the adminParentLink
			return [...userLinks, adminParentLink]
		}
		// Fallback for undefined type, or could be more explicit
		// For now, if not system/tenant, and type is 'user', show userLinks.
		// If type is undefined, it will currently return [].
		// Let's make it default to userLinks if not system or tenant.
		return userLinks // Default to user links if not system or tenant admin
	})()

	const title = (() => {
		if (type === 'system') {
			return 'System Admin'
		}

		if (type === 'user') {
			return 'My Account' // Or some other appropriate title
		}
		return 'Menu' // Default title
	})()

	// The actual visibility of the sidebar (especially on mobile) is controlled by AppShell.
	// This component might use `isOpen` for internal styling or animations if needed in the future.
	// For now, we just ensure the prop is accepted.

	// Tailwind classes for the sidebar container.
	// The actual visibility (especially on mobile) is controlled by AppShell.
	// `isOpen` might be used here for conditional styling if needed.
	const sidebarClasses = `
    h-full flex flex-col 
    bg-gray-800 text-white 
    p-4 space-y-2
  `
	// Removed w-64 as width is handled by the parent div in AppShell

	return (
		<aside className={sidebarClasses}>
			<h2 className='text-xl font-semibold mb-4'>{title}</h2>
			<nav className='flex-grow overflow-y-auto'>
				{' '}
				{/* Added flex-grow and overflow for long lists */}
				<ul>
					{links.map((link, linkIndex) => {
						const IconComponent = link.icon
						const hasLinkAccess = hasAccess(link)
						const tooltipMessage = getTooltipMessage(link)
						const linkKey = link.href !== '#' ? link.href : `${link.label}-${linkIndex}`

						const linkContent = (
							<>
								{link.isCollapsible ? (
									<li>
										<button onClick={toggleAdminMenu} className={cn('flex items-center justify-between w-full space-x-3 py-2 px-3 rounded focus:outline-none', hasLinkAccess ? 'hover:bg-gray-700 text-white' : 'text-gray-500 cursor-not-allowed')} disabled={!hasLinkAccess}>
											<div className='flex items-center space-x-3'>
												{hasLinkAccess ? <IconComponent className='h-5 w-5' /> : <Lock className='h-5 w-5' />}
												<span>{link.label}</span>
											</div>
											{hasLinkAccess && (openAdminMenu ? <ChevronDown className='h-5 w-5' /> : <ChevronRight className='h-5 w-5' />)}
										</button>
										{openAdminMenu && link.children && hasLinkAccess && (
											<ul className='pl-4 mt-1'>
												{link.children.map((childLink, childIndex) => {
													const ChildIconComponent = childLink.icon
													const hasChildAccess = hasAccess(childLink)
													const childTooltipMessage = getTooltipMessage(childLink)
													const childKey = childLink.href !== '#' ? childLink.href : `${childLink.label}-${childIndex}`
													const submenuKey = `${linkKey}-${childKey}`
													const isSubmenuOpen = openSubmenus[submenuKey]

													const childContent = (
														<li>
															{childLink.isCollapsible && childLink.children ? (
																<>
																	<button onClick={() => toggleSubmenu(submenuKey)} className={cn('flex items-center justify-between w-full space-x-3 py-2 px-3 rounded focus:outline-none', hasChildAccess ? 'hover:bg-gray-600 text-white' : 'text-gray-500 cursor-not-allowed')} disabled={!hasChildAccess}>
																		<div className='flex items-center space-x-3'>
																			{hasChildAccess ? <ChildIconComponent className='h-5 w-5' /> : <Lock className='h-5 w-5' />}
																			<span>{childLink.label}</span>
																		</div>
																		{hasChildAccess && (isSubmenuOpen ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />)}
																	</button>
																	{isSubmenuOpen && childLink.children && hasChildAccess && (
																		<ul className='pl-4 mt-1'>
																			{childLink.children.map((grandchildLink, grandchildIndex) => {
																				const GrandchildIconComponent = grandchildLink.icon
																				const hasGrandchildAccess = hasAccess(grandchildLink)
																				const grandchildTooltipMessage = getTooltipMessage(grandchildLink)
																				const grandchildKey = grandchildLink.href !== '#' ? grandchildLink.href : `${grandchildLink.label}-${grandchildIndex}`

																				const grandchildContent = (
																					<li>
																						{hasGrandchildAccess ? (
																							<Link href={grandchildLink.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-600 rounded text-white text-sm'>
																								<GrandchildIconComponent className='h-4 w-4' />
																								<span>{grandchildLink.label}</span>
																							</Link>
																						) : (
																							<div className='flex items-center space-x-3 py-2 px-3 text-gray-500 cursor-not-allowed text-sm'>
																								<Lock className='h-4 w-4' />
																								<span>{grandchildLink.label}</span>
																							</div>
																						)}
																					</li>
																				)

																				return grandchildTooltipMessage ? (
																					<Tooltip key={grandchildKey}>
																						<TooltipTrigger asChild>{grandchildContent}</TooltipTrigger>
																						<TooltipContent>
																							<p>{grandchildTooltipMessage}</p>
																						</TooltipContent>
																					</Tooltip>
																				) : (
																					<React.Fragment key={grandchildKey}>{grandchildContent}</React.Fragment>
																				)
																			})}
																		</ul>
																	)}
																</>
															) : hasChildAccess ? (
																<Link href={childLink.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded text-white'>
																	<ChildIconComponent className='h-5 w-5' />
																	<span>{childLink.label}</span>
																</Link>
															) : (
																<div className='flex items-center space-x-3 py-2 px-3 text-gray-500 cursor-not-allowed'>
																	<Lock className='h-5 w-5' />
																	<span>{childLink.label}</span>
																</div>
															)}
														</li>
													)

													return childTooltipMessage ? (
														<Tooltip key={childKey}>
															<TooltipTrigger asChild>{childContent}</TooltipTrigger>
															<TooltipContent>
																<p>{childTooltipMessage}</p>
															</TooltipContent>
														</Tooltip>
													) : (
														<React.Fragment key={childKey}>{childContent}</React.Fragment>
													)
												})}
											</ul>
										)}
									</li>
								) : (
									<li>
										{hasLinkAccess ? (
											<Link href={link.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded text-white'>
												<IconComponent className='h-5 w-5' />
												<span>{link.label}</span>
											</Link>
										) : (
											<div className='flex items-center space-x-3 py-2 px-3 text-gray-500 cursor-not-allowed'>
												<Lock className='h-5 w-5' />
												<span>{link.label}</span>
											</div>
										)}
									</li>
								)}
							</>
						)

						// Wrap with tooltip if access is denied
						return tooltipMessage ? (
							<Tooltip key={linkKey}>
								<TooltipTrigger asChild>{linkContent}</TooltipTrigger>
								<TooltipContent>
									<p>{tooltipMessage}</p>
								</TooltipContent>
							</Tooltip>
						) : (
							<React.Fragment key={linkKey}>{linkContent}</React.Fragment>
						)
					})}
				</ul>
			</nav>
		</aside>
	)
}

export default Sidebar
