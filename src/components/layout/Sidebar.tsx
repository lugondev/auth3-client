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
	// Icon as LucideIcon, // No longer needed for direct type definition
} from 'lucide-react'
import {PermissionGuard} from '@/components/permissions'

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
	{href: '/dashboard/admin/logs', label: 'System Logs', icon: FileText, permission: 'admin:logs:read'},
	{
		href: '/dashboard/oauth2',
		label: 'OAuth2 Management',
		icon: KeyRound,
		isCollapsible: true,
		permission: 'admin:oauth2:read',
		children: [
			{href: '#', label: 'Client List', icon: ListChecks, permission: 'admin:oauth2:read'},
			{href: '/dashboard/oauth2/create', label: 'Create Client', icon: KeyRound, permission: 'admin:oauth2:create'},
		],
	},
]

const adminParentLink: NavLink = {
	href: '#', // Parent link doesn't navigate directly
	label: 'Admin',
	icon: Settings, // Or a more generic admin icon
	isCollapsible: true,
	children: systemAdminLinks,
}

const userLinks: NavLink[] = [
	{href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
	{href: '/dashboard/tenant-management', label: 'Organizations', icon: Building},
	{href: '/dashboard/profile', label: 'Profile', icon: UserCircle},
]

const Sidebar: React.FC<SidebarProps> = ({type}) => {
	const [openAdminMenu, setOpenAdminMenu] = React.useState(true)

	const toggleAdminMenu = () => {
		setOpenAdminMenu(!openAdminMenu)
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
					{links.map((link) => {
					const IconComponent = link.icon
					const linkContent = (
						<>
							{link.isCollapsible ? (
								<li key={link.label}>
									<button onClick={toggleAdminMenu} className='flex items-center justify-between w-full space-x-3 py-2 px-3 hover:bg-gray-700 rounded focus:outline-none'>
										<div className='flex items-center space-x-3'>
											<IconComponent className='h-5 w-5' />
											<span>{link.label}</span>
										</div>
										{openAdminMenu ? <ChevronDown className='h-5 w-5' /> : <ChevronRight className='h-5 w-5' />}
									</button>
									{openAdminMenu && link.children && (
										<ul className='pl-4 mt-1'>
											{link.children.map((childLink) => {
												const ChildIconComponent = childLink.icon
												const childContent = (
													<li key={childLink.href}>
														<Link href={childLink.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded'>
															<ChildIconComponent className='h-5 w-5' />
															<span>{childLink.label}</span>
														</Link>
													</li>
												)
												return childLink.permission || childLink.role ? (
													<PermissionGuard
														key={childLink.href}
														permission={childLink.permission}
														role={childLink.role}
													>
														{childContent}
													</PermissionGuard>
												) : (
													childContent
												)
											})}
										</ul>
									)}
								</li>
							) : (
								<li key={link.href}>
									<Link href={link.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded'>
										<IconComponent className='h-5 w-5' />
										<span>{link.label}</span>
									</Link>
								</li>
							)}
						</>
					)

					// Wrap with PermissionGuard if permission or role is specified
					return link.permission || link.role ? (
						<PermissionGuard
							key={link.href || link.label}
							permission={link.permission}
							role={link.role}
						>
							{linkContent}
						</PermissionGuard>
					) : (
						linkContent
					)
				})}
				</ul>
			</nav>
		</aside>
	)
}

export default Sidebar
