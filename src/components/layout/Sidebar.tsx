// @/components/layout/Sidebar.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import {
	LayoutDashboard,
	Building,
	ShieldCheck,
	UserCircle,
	ChevronDown, // For collapsible icon
	ChevronRight, // For collapsible icon
	Lock, // For disabled items
	ChevronsLeft, // For sidebar collapse
	ChevronsRight, // For sidebar expand
} from 'lucide-react'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils'
import {usePermissions} from '@/contexts/PermissionContext'
import {useAuth} from '@/contexts/AuthContext'
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
	type?: 'system' | 'user' | 'tenant' // Legacy types - system/tenant now have separate spaces
	initialWidth?: number // Initial width of sidebar
	minWidth?: number // Minimum width when collapsed
	maxWidth?: number // Maximum width when expanded
	resizeTransitionDuration?: number // Duration of resize transition in ms
	onWidthChange?: (width: number) => void // Callback when sidebar width changes
}

const userLinks: NavLink[] = [
	{href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
	{href: '/dashboard/profile', label: 'Profile', icon: UserCircle},
	{
		href: '/dashboard/tenant-management',
		label: 'My Organizations',
		icon: Building,
		isCollapsible: false,
	},
	{
		href: '/dashboard/admin',
		label: 'Admin Panel',
		icon: ShieldCheck,
		isCollapsible: false,
		permission: 'admin:access', // Require admin permission
	},
]

const Sidebar: React.FC<SidebarProps> = ({type, initialWidth = 256, minWidth = 80, maxWidth = 320, resizeTransitionDuration = 150, onWidthChange}) => {
	const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})
	const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({})
	const [sidebarWidth, setSidebarWidth] = React.useState(initialWidth)
	const [isCollapsed, setIsCollapsed] = React.useState(false)
	const [isResizing, setIsResizing] = React.useState(false)
	const {hasPermission, hasRole} = usePermissions()
	const {isSystemAdmin} = useAuth()
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

		// Check for admin panel access using isSystemAdmin flag
		if (link.href === '/dashboard/admin') {
			return isSystemAdmin === true
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
		// Special message for admin panel
		if (link.href === '/dashboard/admin' && isSystemAdmin !== true) {
			return 'Requires system administrator privileges'
		}
		
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
			// Legacy system type - deprecated, admin now has separate space
			return userLinks
		}
		if (type === 'tenant') {
			// Legacy tenant type - deprecated, tenant now has separate space  
			return userLinks
		}
		// Default to user links for 'user' type or undefined
		return userLinks
	})()

	const title = (() => {
		if (type === 'system') {
			return 'Dashboard' // Legacy system type, now just shows dashboard
		}
		if (type === 'tenant') {
			return 'Organization'
		}
		if (type === 'user') {
			return 'My Account'
		}
		return 'Dashboard' // Default title
	})()

	// Tailwind classes for the sidebar container
	const sidebarClasses = cn('h-full min-h-screen flex flex-col bg-card border-r border-border text-foreground p-4 space-y-2 relative', isCollapsed ? 'items-center' : '', isResizing ? '' : `transition-all duration-${resizeTransitionDuration}`)

	return (
		<aside ref={sidebarRef} className={sidebarClasses} style={{width: `${sidebarWidth}px`}}>
			{/* Resize handle - improved for better UX */}
			<div className='absolute top-0 right-0 w-4 h-full cursor-ew-resize z-20 group' onMouseDown={startResize}>
				<div className='absolute top-0 right-0 w-1 h-full bg-border group-hover:bg-primary group-hover:w-2 transition-all duration-200' />
			</div>

			{/* Collapse/Expand button */}
			<div className='absolute top-4 right-2 z-10'>
				<button onClick={toggleCollapse} className='p-1 rounded-full bg-muted hover:bg-accent text-foreground transition-colors duration-200' title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
					{isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
				</button>
			</div>

			<h2 className={cn('text-xl font-semibold mb-4', isCollapsed ? 'sr-only' : '')}>{title}</h2>
			<nav className='flex-grow overflow-y-auto'>
				{' '}
				{/* Added flex-grow and overflow for long lists */}
				<ul>
					{links.filter(link => hasAccess(link)).map((link, linkIndex) => {
						const IconComponent = link.icon
						const hasLinkAccess = hasAccess(link)
						const tooltipMessage = getTooltipMessage(link)
						const linkKey = link.href !== '#' ? link.href : `${link.label}-${linkIndex}`

						const linkContent = (
							<ul>
								{link.isCollapsible ? (
									<li>
										<button onClick={() => toggleMenu(linkKey)} className={cn('flex items-center justify-between w-full space-x-3 py-2 px-3 rounded focus:outline-none transition-colors duration-200', hasLinkAccess ? 'hover:bg-accent text-foreground' : 'text-muted-foreground cursor-not-allowed', (isLinkActive(link.href) || hasActiveChild(link)) && hasLinkAccess ? 'bg-accent font-medium' : '')} disabled={!hasLinkAccess}>
											<div className='flex items-center space-x-3'>
												{hasLinkAccess ? <IconComponent className={cn('h-5 w-5', isLinkActive(link.href) || hasActiveChild(link) ? 'text-primary' : '')} /> : <Lock className='h-5 w-5' />}
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
																	<button onClick={() => toggleSubmenu(submenuKey)} className={cn('flex items-center justify-between w-full space-x-3 py-2 px-3 rounded focus:outline-none transition-colors duration-200', hasChildAccess ? 'hover:bg-muted text-foreground' : 'text-muted-foreground cursor-not-allowed', (isChildActive || hasChildActiveChild) && hasChildAccess ? 'bg-muted font-medium' : '')} disabled={!hasChildAccess}>
																		<div className='flex items-center space-x-3'>
																			{hasChildAccess ? <ChildIconComponent className={cn('h-5 w-5', isChildActive || hasChildActiveChild ? 'text-primary' : '')} /> : <Lock className='h-5 w-5' />}
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
																							<Link href={grandchildLink.href} className={cn('flex items-center space-x-3 py-2 px-3 hover:bg-accent rounded text-foreground text-sm transition-colors duration-200', isGrandchildActive ? 'bg-accent font-medium' : '')}>
																								<GrandchildIconComponent className={cn('h-4 w-4', isGrandchildActive ? 'text-primary' : '')} />
																								<span>{grandchildLink.label}</span>
																							</Link>
																						) : (
																							<div className='flex items-center space-x-3 py-2 px-3 text-muted-foreground cursor-not-allowed text-sm'>
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
																<Link href={childLink.href} className={cn('flex items-center space-x-3 py-2 px-3 hover:bg-accent rounded text-foreground transition-colors duration-200', isChildActive ? 'bg-accent font-medium' : '')}>
																	<ChildIconComponent className={cn('h-5 w-5', isChildActive ? 'text-primary' : '')} />
																	<span>{childLink.label}</span>
																</Link>
															) : (
																<div className='flex items-center space-x-3 py-2 px-3 text-muted-foreground cursor-not-allowed'>
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
											<Link href={link.href} className={cn('flex items-center space-x-3 py-2 px-3 hover:bg-accent rounded text-foreground transition-colors duration-200', isLinkActive(link.href) ? 'bg-accent font-medium' : '')}>
												<IconComponent className={cn('h-5 w-5', isLinkActive(link.href) ? 'text-primary' : '')} />
												{!isCollapsed && <span>{link.label}</span>}
											</Link>
										) : (
											<div className='flex items-center space-x-3 py-2 px-3 text-muted-foreground cursor-not-allowed'>
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
