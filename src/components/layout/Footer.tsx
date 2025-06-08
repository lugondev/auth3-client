'use client'

import { useEffect, useState } from 'react'

export default function Footer() {
	const [currentYear, setCurrentYear] = useState<number | null>(null)

	useEffect(() => {
		setCurrentYear(new Date().getFullYear())
	}, [])

	// Show placeholder during hydration
	if (currentYear === null) {
		return (
			<footer className='border-t bg-background p-4 text-center text-sm text-muted-foreground'>
				<p>&copy; 2024 Your App Name. All rights reserved.</p>
			</footer>
		)
	}

	return (
		<footer className='border-t bg-background p-4 text-center text-sm text-muted-foreground'>
			<p>&copy; {currentYear} Your App Name. All rights reserved.</p>
		</footer>
	)
}
