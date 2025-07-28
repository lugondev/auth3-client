'use client'

import {useEffect, useState} from 'react'
import {Separator} from '@/components/ui/separator'
import {Shield, Github, Mail} from 'lucide-react'

export default function Footer() {
	const [currentYear, setCurrentYear] = useState<number | null>(null)

	useEffect(() => {
		setCurrentYear(new Date().getFullYear())
	}, [])

	// Show placeholder during hydration
	if (currentYear === null) {
		return (
			<footer className='border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='container mx-auto px-4 py-6'>
					<div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
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

	return (
		<footer className='border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container mx-auto px-4 py-6'>
				<div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
					<div className='flex items-center gap-2 text-sm text-muted-foreground'>
						<Shield className='h-4 w-4' />
						<span>&copy; {currentYear} Auth3 System. All rights reserved.</span>
					</div>
					<div className='flex items-center gap-6 text-sm text-muted-foreground'>
						<span className='hidden sm:inline'>Decentralized Identity Management</span>
						<Separator orientation='vertical' className='h-4 hidden sm:block' />
						<div className='flex items-center gap-4'>
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
