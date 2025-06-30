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
	ChevronsLeft, // For sidebar collapse
	ChevronsRight, // For sidebar expand
	Presentation, // For presentations
} from 'lucide-react'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils'
import {usePermissions} from '@/contexts/PermissionContext'
import {usePathname} from 'next/navigation'

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
	initialWidth?: number // Initial width of sidebar
	minWidth?: number // Minimum width when collapsed
	maxWidth?: number // Maximum width when expanded
	resizeTransitionDuration?: number // Duration of resize transition in ms
	onWidthChange?: (width: number) => void // Callback when sidebar width changes
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
		href: '/dashboard/admin/presentations',
		label: 'VP Administration',
		icon: Presentation,
		permission: 'admin:presentations:read',
		isCollapsible: true,
		children: [
			{href: '/dashboard/admin/presentations', label: 'VP Dashboard', icon: LayoutDashboard, permission: 'admin:presentations:read'},
			{href: '/dashboard/admin/presentations/verification', label: 'Verification Management', icon: Eye, permission: 'admin:presentations:verify'},
			{href: '/dashboard/admin/presentations/analytics', label: 'Analytics', icon: ListChecks, permission: 'admin:presentations:analytics'},
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
			{href: '/dashboard/oauth2/', label: 'Client List', icon: ListChecks, permission: 'admin:oauth2:read'},
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
	{href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
	{href: '/dashboard/profile', label: 'Profile', icon: UserCircle},
	{
		href: '/dashboard/dids',
		label: 'DID Management',
		icon: KeyRound,
		isCollapsible: true,
		children: [
			{href: '/dashboard/dids', label: 'Overview', icon: KeyRound},
			{href: '/dashboard/dids/create', label: 'Create DID', icon: Plus},
			{href: '/dashboard/dids/settings', label: 'Settings', icon: Settings},
		],
	},
	{
		href: '/dashboard/credentials',
		label: 'Credentials',
		icon: CreditCard,
		isCollapsible: true,
		children: [
			{href: '/dashboard/credentials', label: 'Overview', icon: CreditCard},
			{href: '/dashboard/credentials/issue', label: 'Issue Credential', icon: Plus},
			{href: '/dashboard/credentials/verify', label: 'Verify Credential', icon: Eye},
			{href: '/dashboard/credentials/templates', label: 'Templates', icon: FileText},
		],
	},
	{
		href: '/dashboard/presentations',
		label: 'Presentations',
		icon: Presentation,
		isCollapsible: true,
		children: [
			{href: '/dashboard/presentations', label: 'Overview', icon: Presentation},
			{href: '/dashboard/presentations/create', label: 'Create Presentation', icon: Plus},
			{href: '/dashboard/presentations/verify', label: 'Verify Presentation', icon: Eye},
		],
	},
	{
		href: '/dashboard/messages',
		label: 'Messages',
		icon: MessageSquare,
		isCollapsible: true,
		children: [
			{href: '/dashboard/messages', label: 'Inbox', icon: MessageSquare},
			{href: '/dashboard/messages/sent', label: 'Sent', icon: MessageSquare},
			{href: '/dashboard/messages/connections', label: 'Connections', icon: Users},
		],
	},
	{
		href: '/dashboard/tenant-management',
		label: 'Organizations',
		icon: Building,
		isCollapsible: true,
		children: [
			{href: '/dashboard/tenant-management', label: 'Overview', icon: Building},
			{href: '/dashboard/tenant-management/#settings', label: 'Settings', icon: Settings},
			{href: '/dashboard/tenant-management/#members', label: 'Members', icon: Users},
			{href: '/dashboard/tenant-management/#roles', label: 'Roles', icon: ShieldCheck},
		],
	},
]

const Sidebar: React.FC<SidebarProps> = ({type, initialWidth = 256, minWidth = 80, maxWidth = 320, resizeTransitionDuration = 150, onWidthChange}) => {
	const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})
	const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({})
	const [sidebarWidth, setSidebarWidth] = React.useState(initialWidth)
	const [isCollapsed, setIsCollapsed] = React.useState(false)
	const [isResizing, setIsResizing] = React.useState(false)
	const {hasPermission, hasRole} = usePermissions()
	const pathname = usePathname()

	// Reference for tracking resize
	const sidebarRef = React.useRef<HTMLDivElement>(null)
	const resizingRef = React.useRef(false)
	const startXRef = React.useRef(0)
	const startWidthRef = React.useRef(0)

	// Update parent component when sidebar width changes
	React.useEffect(() => {
		onWidthChange?.(sidebarWidth)
	}, [sidebarWidth, onWidthChange])

	const toggleMenu = (key: string) => {
		setOpenMenus((prev) => ({
			...prev,
			[key]: !prev[key],
		}))
	}

	const toggleSubmenu = (key: string) => {
		setOpenSubmenus((prev) => ({
			...prev,
			[key]: !prev[key],
		}))
	}

	// Check if a link is active (current page or parent of current page)
	const isLinkActive = (href: string): boolean => {
		if (href === '#') return false

		// Handle fragment URLs (URLs with #)
		if (href.includes('#')) {
			// Extract the base path without the fragment
			const basePath = href.split('#')[0]
			// Check if current path matches the base path exactly
			return pathname === basePath
		}

		// Check if current path matches exactly
		if (pathname === href) return true

		// For submenu items, we don't want to highlight parent items
		// For example, when on /dashboard/dids/create, we don't want /dashboard/dids to be active
		// This is to prevent multiple items in the same submenu from being highlighted
		return false
	}

	// Check if a parent link has an active child
	const hasActiveChild = (link: NavLink): boolean => {
		if (!link.children) return false
		return link.children.some((child) => {
			if (isLinkActive(child.href)) return true
			if (child.children) return hasActiveChild(child)
			return false
		})
	}

	// Toggle sidebar collapse state
	const toggleCollapse = () => {
		if (isCollapsed) {
			// Expand to previous width or default
			setSidebarWidth(Math.max(initialWidth, minWidth))
			setIsCollapsed(false)
		} else {
			// Collapse to minimum width
			setSidebarWidth(minWidth)
			setIsCollapsed(true)
		}
	}

	// Start resize with improved handling
	const startResize = (e: React.MouseEvent) => {
		e.preventDefault() // Prevent text selection during resize
		resizingRef.current = true
		startXRef.current = e.clientX
		startWidthRef.current = sidebarWidth
		setIsResizing(true)

		// Add event listeners
		document.addEventListener('mousemove', handleResize)
		document.addEventListener('mouseup', stopResize)

		// Add cursor styles to entire document during resize
		document.body.style.cursor = 'ew-resize'
		document.body.style.userSelect = 'none' // Prevent text selection
	}

	// Handle resize with throttling for better performance
	const handleResize = React.useCallback(
		(e: MouseEvent) => {
			if (!resizingRef.current) return

			// Calculate new width based on mouse movement
			const deltaX = e.clientX - startXRef.current
			const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX))

			// Update width and collapsed state
			setSidebarWidth(newWidth)
			setIsCollapsed(newWidth <= minWidth + 20) // Consider collapsed if near min width
		},
		[minWidth, maxWidth],
	)

	// Stop resize with cleanup
	const stopResize = React.useCallback(() => {
		resizingRef.current = false
		setIsResizing(false)

		// Remove event listeners
		document.removeEventListener('mousemove', handleResize)
		document.removeEventListener('mouseup', stopResize)

		// Reset cursor styles
		document.body.style.cursor = ''
		document.body.style.userSelect = ''
	}, [handleResize])

	// Cleanup event listeners on unmount
	React.useEffect(() => {
		return () => {
			document.removeEventListener('mousemove', handleResize)
			document.removeEventListener('mouseup', stopResize)
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
		}
	}, [handleResize, stopResize])

	// Check if user has access to a nav link
	const hasAccess = (link: NavLink): boolean => {
		// Special case for system admin with wildcard permissions
		if (hasPermission('*.*') || hasPermission('*:*') || hasPermission('.*:.*') || hasPermission('*:.*')) {
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

	// Tailwind classes for the sidebar container
	const sidebarClasses = cn('h-full min-h-screen flex flex-col bg-gray-800 text-white p-4 space-y-2 relative', isCollapsed ? 'items-center' : '', isResizing ? '' : `transition-all duration-${resizeTransitionDuration}`)

	return (
		<aside ref={sidebarRef} className={sidebarClasses} style={{width: `${sidebarWidth}px`}}>
			{/* Resize handle - improved for better UX */}
			<div className='absolute top-0 right-0 w-4 h-full cursor-ew-resize z-20 group' onMouseDown={startResize}>
				<div className='absolute top-0 right-0 w-1 h-full bg-gray-700 group-hover:bg-blue-500 group-hover:w-2 transition-all duration-200' />
			</div>

			{/* Collapse/Expand button */}
			<div className='absolute top-4 right-2 z-10'>
				<button onClick={toggleCollapse} className='p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200' title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
					{isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
				</button>
			</div>

			<h2 className={cn('text-xl font-semibold mb-4', isCollapsed ? 'sr-only' : '')}>{title}</h2>
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
							<ul>
								{link.isCollapsible ? (
									<li>
										<button onClick={() => toggleMenu(linkKey)} className={cn('flex items-center justify-between w-full space-x-3 py-2 px-3 rounded focus:outline-none transition-colors duration-200', hasLinkAccess ? 'hover:bg-gray-700 text-white' : 'text-gray-500 cursor-not-allowed', (isLinkActive(link.href) || hasActiveChild(link)) && hasLinkAccess ? 'bg-gray-700 font-medium' : '')} disabled={!hasLinkAccess}>
											<div className='flex items-center space-x-3'>
												{hasLinkAccess ? <IconComponent className={cn('h-5 w-5', isLinkActive(link.href) || hasActiveChild(link) ? 'text-blue-400' : '')} /> : <Lock className='h-5 w-5' />}
												{!isCollapsed && <span>{link.label}</span>}
											</div>
											{hasLinkAccess && !isCollapsed && (openMenus[linkKey] ? <ChevronDown className='h-5 w-5' /> : <ChevronRight className='h-5 w-5' />)}
										</button>
										{openMenus[linkKey] && link.children && hasLinkAccess && !isCollapsed && (
											<ul className='pl-4 mt-1'>
												{link.children.map((childLink, childIndex) => {
													const ChildIconComponent = childLink.icon
													const hasChildAccess = hasAccess(childLink)
													const childTooltipMessage = getTooltipMessage(childLink)
													const childKey = childLink.href !== '#' ? childLink.href : `${childLink.label}-${childIndex}`
													const submenuKey = `${linkKey}-${childKey}`
													const isSubmenuOpen = openSubmenus[submenuKey]
													const isChildActive = isLinkActive(childLink.href)
													const hasChildActiveChild = childLink.children ? hasActiveChild(childLink) : false

													const childContent = (
														<li>
															{childLink.isCollapsible && childLink.children ? (
																<div>
																	<button onClick={() => toggleSubmenu(submenuKey)} className={cn('flex items-center justify-between w-full space-x-3 py-2 px-3 rounded focus:outline-none transition-colors duration-200', hasChildAccess ? 'hover:bg-gray-600 text-white' : 'text-gray-500 cursor-not-allowed', (isChildActive || hasChildActiveChild) && hasChildAccess ? 'bg-gray-600 font-medium' : '')} disabled={!hasChildAccess}>
																		<div className='flex items-center space-x-3'>
																			{hasChildAccess ? <ChildIconComponent className={cn('h-5 w-5', isChildActive || hasChildActiveChild ? 'text-blue-400' : '')} /> : <Lock className='h-5 w-5' />}
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
																				const isGrandchildActive = isLinkActive(grandchildLink.href)

																				const grandchildContent = (
																					<li>
																						{hasGrandchildAccess ? (
																							<Link href={grandchildLink.href} className={cn('flex items-center space-x-3 py-2 px-3 hover:bg-gray-600 rounded text-white text-sm transition-colors duration-200', isGrandchildActive ? 'bg-gray-600 font-medium' : '')}>
																								<GrandchildIconComponent className={cn('h-4 w-4', isGrandchildActive ? 'text-blue-400' : '')} />
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
																</div>
															) : hasChildAccess ? (
																<Link href={childLink.href} className={cn('flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded text-white transition-colors duration-200', isChildActive ? 'bg-gray-700 font-medium' : '')}>
																	<ChildIconComponent className={cn('h-5 w-5', isChildActive ? 'text-blue-400' : '')} />
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
											<Link href={link.href} className={cn('flex items-center space-x-3 py-2 px-3 hover:bg-gray-700 rounded text-white transition-colors duration-200', isLinkActive(link.href) ? 'bg-gray-700 font-medium' : '')}>
												<IconComponent className={cn('h-5 w-5', isLinkActive(link.href) ? 'text-blue-400' : '')} />
												{!isCollapsed && <span>{link.label}</span>}
											</Link>
										) : (
											<div className='flex items-center space-x-3 py-2 px-3 text-gray-500 cursor-not-allowed'>
												<Lock className='h-5 w-5' />
												{!isCollapsed && <span>{link.label}</span>}
											</div>
										)}
									</li>
								)}
							</ul>
						)

						// Wrap with tooltip if access is denied or if collapsed
						const shouldShowTooltip = tooltipMessage || isCollapsed
						const tooltipText = tooltipMessage || (isCollapsed ? link.label : '')

						return shouldShowTooltip ? (
							<Tooltip key={linkKey}>
								<TooltipTrigger asChild>{linkContent}</TooltipTrigger>
								<TooltipContent>
									<p>{tooltipText}</p>
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
