'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'
// Import necessary icons
import {Home, Users, Building, ShieldCheck, UserCircle} from 'lucide-react'

const sidebarNavItems = [
	{
		title: 'Dashboard',
		href: '/',
		icon: Home,
	},
	{
		title: 'Users',
		href: '/users',
		icon: Users,
	},
	{
		title: 'Venues',
		href: '/venues',
		icon: Building,
	},
	{
		title: 'RBAC',
		href: '/rbac',
		icon: ShieldCheck,
	},
	{
		title: 'Profile',
		href: '/profile',
		icon: UserCircle,
	},
]

export function Sidebar() {
	const pathname = usePathname()

	return (
		// Use sidebar specific background and border colors
		<div className='hidden border-r border-sidebar-border bg-sidebar md:block'>
			<div className='flex h-full max-h-screen flex-col gap-2'>
				{/* Use sidebar specific border for the header */}
				<div className='flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6'>
					{/* Use sidebar foreground color for the brand text */}
					<Link href='/' className='flex items-center gap-2 font-semibold text-sidebar-foreground'>
						{/* <AppWindow className='h-6 w-6' /> Optional Icon */}
						<span className=''>Moco</span> {/* Removed font-bold to match theme approach */}
					</Link>
					{/* Optional: Notification bell etc. can go here */}
				</div>
				<div className='flex-1'>
					<nav className='grid items-start px-2 text-sm font-medium lg:px-4'>
						{sidebarNavItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									// Use sidebar specific text colors and hover effect
									'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
									// Use sidebar specific active background and text color
									pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground',
								)}>
								{/* Adjust icon color to match text */}
								<item.icon className='h-4 w-4' />
								{item.title}
							</Link>
						))}
					</nav>
				</div>
				{/* Optional: Add content at the bottom of the sidebar, like settings or logout */}
			</div>
		</div>
	)
}
