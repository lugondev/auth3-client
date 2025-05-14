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
	LayoutGrid,
	Users2,
	Shield,
	Settings,
	UserCircle, // Added for Profile
	ChevronDown, // For collapsible icon
	ChevronRight, // For collapsible icon
	// Icon as LucideIcon, // No longer needed for direct type definition
} from 'lucide-react'

interface NavLink {
	href: string
	label: string
	icon: React.ElementType // Correct type for a React component
	children?: NavLink[]
	isCollapsible?: boolean
}

interface SidebarProps {
	type?: 'system' | 'tenant' | 'user' // Added 'user' type
	tenantId?: string // Only for tenant type
	tenantName?: string // Only for tenant type
}

const systemAdminLinks: NavLink[] = [
	{href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard},
	{href: '/admin/tenants', label: 'Tenant Management', icon: Building},
	{href: '/admin/users', label: 'User Management', icon: Users},
	{href: '/admin/roles', label: 'Global Roles & Permissions', icon: ShieldCheck},
	{href: '/admin/logs', label: 'System Logs', icon: FileText},
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
	{href: '/profile', label: 'Profile', icon: UserCircle},
]

const getTenantAdminLinks = (tenantId: string): NavLink[] => [
	{href: `/tenant/${tenantId}/settings`, label: 'Overview', icon: LayoutGrid},
	{href: `/tenant/${tenantId}/users`, label: 'Tenant Users', icon: Users2},
	{href: `/tenant/${tenantId}/roles`, label: 'Tenant Roles & Permissions', icon: Shield},
	{href: `/tenant/${tenantId}/settings`, label: 'Tenant Settings', icon: Settings},
]

const Sidebar: React.FC<SidebarProps> = ({type, tenantId, tenantName}) => {
	const [openAdminMenu, setOpenAdminMenu] = React.useState(true)

	const toggleAdminMenu = () => {
		setOpenAdminMenu(!openAdminMenu)
	}

	const links = (() => {
		if (type === 'system') {
			// Place userLinks first, then the adminParentLink
			return [...userLinks, adminParentLink]
		}
		if (type === 'tenant' && tenantId) {
			return getTenantAdminLinks(tenantId)
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
		if (type === 'tenant') {
			return `Tenant: ${tenantName || 'N/A'}`
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
						if (link.isCollapsible) {
							return (
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
												return (
													<li key={childLink.href}>
														<Link href={childLink.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded'>
															<ChildIconComponent className='h-5 w-5' />
															<span>{childLink.label}</span>
														</Link>
													</li>
												)
											})}
										</ul>
									)}
								</li>
							)
						}
						return (
							<li key={link.href}>
								<Link href={link.href} className='flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded'>
									<IconComponent className='h-5 w-5' />
									<span>{link.label}</span>
								</Link>
							</li>
						)
					})}
				</ul>
			</nav>
		</aside>
	)
}

export default Sidebar
