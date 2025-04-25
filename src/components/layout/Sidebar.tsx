'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'
// Import necessary icons
import {Home, Users, Building, ShieldCheck, UserCircle} from 'lucide-react'

const sidebarNavItems = [
	{
		title: 'Dashboard',
		href: '/protected',
		icon: Home,
	},
	{
		title: 'Users',
		href: '/protected/users',
		icon: Users,
	},
	{
		title: 'Venues',
		href: '/protected/venues',
		icon: Building,
	},
	{
		title: 'RBAC',
		href: '/protected/rbac',
		icon: ShieldCheck,
	},
	{
		title: 'Profile',
		href: '/protected/profile',
		icon: UserCircle,
	},
]

export function Sidebar() {
	const pathname = usePathname()

	return (
		<div className='hidden border-r bg-muted/40 md:block'>
			{' '}
			{/* Hidden on small screens */}
			<div className='flex h-full max-h-screen flex-col gap-2'>
				{/* Use the same branding as the main header */}
				<div className='flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6'>
					<Link href='/' className='flex items-center gap-2 font-semibold'>
						{/* <AppWindow className='h-6 w-6' /> Optional Icon */}
						<span className='font-bold'>Moco</span>
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
									'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
									pathname === item.href && 'bg-muted text-primary', // Active link styling
								)}>
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
