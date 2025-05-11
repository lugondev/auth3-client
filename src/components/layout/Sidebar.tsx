// @/components/layout/Sidebar.tsx
'use client'

import React from 'react'
import Link from 'next/link'

interface SidebarProps {
	type?: 'system' | 'tenant'
	tenantId?: string // Only for tenant type
	tenantName?: string // Only for tenant type
}

const systemAdminLinks = [
	{href: '/admin/dashboard', label: 'Dashboard'},
	{href: '/admin/tenants', label: 'Tenant Management'},
	{href: '/admin/users', label: 'User Management'},
	{href: '/admin/roles', label: 'Global Roles & Permissions'}, // Updated label
	{href: '/admin/logs', label: 'System Logs'}, // Updated label
]

const getTenantAdminLinks = (tenantId: string) => [
	{href: `/tenant/${tenantId}/overview`, label: 'Overview'},
	{href: `/tenant/${tenantId}/users`, label: 'Tenant Users'}, // Updated label
	{href: `/tenant/${tenantId}/roles`, label: 'Tenant Roles & Permissions'}, // Updated label
	{href: `/tenant/${tenantId}/settings`, label: 'Tenant Settings'}, // Updated label
]

const Sidebar: React.FC<SidebarProps> = ({type, tenantId, tenantName}) => {
	const links = (() => {
		if (type === 'system') {
			return systemAdminLinks
		}
		if (type === 'tenant' && tenantId) {
			return getTenantAdminLinks(tenantId)
		}
		return []
	})()

	const title = (() => {
		if (type === 'system') {
			return 'System Admin'
		}
		if (type === 'tenant') {
			return `Tenant: ${tenantName || 'N/A'}`
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
					{links.map((link) => (
						<li key={link.href}>
							<Link href={link.href} className='block py-2 px-3 hover:bg-gray-700 rounded'>
								{link.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	)
}

export default Sidebar
