'use client'

import {useEffect, useState} from 'react'
import {Separator} from '@/components/ui/separator'
import {Shield, Github, Mail, Users, Database, Settings} from 'lucide-react'

interface DashboardFooterProps {
	variant?: 'user' | 'tenant' | 'admin'
	tenantName?: string
}

export default function DashboardFooter({variant = 'user', tenantName}: DashboardFooterProps) {
	const [currentYear, setCurrentYear] = useState<number | null>(null)

	useEffect(() => {
		setCurrentYear(new Date().getFullYear())
	}, [])

	// Show placeholder during hydration
	if (currentYear === null) {
		return (
			<footer className='border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex flex-col items-center justify-between gap-3 md:flex-row'>
						<div className='flex items-center gap-2 text-sm text-muted-foreground'>
							<Shield className='h-4 w-4' />
							<span>&copy; 2024 Auth3 System. All rights reserved.</span>
						</div>
						<div className='flex items-center gap-4 text-sm text-muted-foreground'>
							<span>Decentralized Identity Management</span>
						</div>
					</div>
				</div>
			</footer>
		)
	}

	const getVariantInfo = () => {
		switch (variant) {
			case 'admin':
				return {
					icon: <Settings className='h-4 w-4' />,
					context: 'System Administration',
					description: 'Managing Auth3 System',
				}
			case 'tenant':
				return {
					icon: <Users className='h-4 w-4' />,
					context: tenantName ? `Tenant: ${tenantName}` : 'Tenant Dashboard',
					description: 'Multi-tenant Identity Management',
				}
			default:
				return {
					icon: <Shield className='h-4 w-4' />,
					context: 'Personal Dashboard',
					description: 'Decentralized Identity Management',
				}
		}
	}

	const variantInfo = getVariantInfo()

	return (
		<footer className='border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container mx-auto px-4 py-4'>
				<div className='flex flex-col items-center justify-between gap-3 md:flex-row'>
					<div className='flex items-center gap-3 text-sm text-muted-foreground'>
						{variantInfo.icon}
						<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
							<span>&copy; {currentYear} Auth3 System.</span>
							<span className='hidden sm:inline'>•</span>
							<span className='font-medium text-foreground'>{variantInfo.context}</span>
						</div>
					</div>

					<div className='flex items-center gap-4 text-sm text-muted-foreground'>
						<span className='hidden md:inline'>{variantInfo.description}</span>
						<Separator orientation='vertical' className='h-4 hidden md:block' />
						<div className='flex items-center gap-3'>
							{variant === 'admin' && (
								<div className='flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200'>
									<Database className='h-3 w-3' />
									<span>Admin Mode</span>
								</div>
							)}
							{variant === 'tenant' && (
								<div className='flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200'>
									<Users className='h-3 w-3' />
									<span>Tenant Space</span>
								</div>
							)}
							<a href='https://github.com/lugondev/auth3-system' target='_blank' rel='noopener noreferrer' className='flex items-center gap-1 hover:text-foreground transition-colors' title='GitHub Repository'>
								<Github className='h-4 w-4' />
								<span className='hidden sm:inline'>GitHub</span>
							</a>
							<a href='mailto:support@auth3.system' className='flex items-center gap-1 hover:text-foreground transition-colors' title='Contact Support'>
								<Mail className='h-4 w-4' />
								<span className='hidden sm:inline'>Support</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}
