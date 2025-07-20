'use client'

import ProtectedWrapper from '@/components/auth/ProtectedWrapper'
import AppShell from '@/components/layout/AppShell'
import {usePathname} from 'next/navigation'

export default function ProtectedLayout({children}: {children: React.ReactNode}) {
	const pathname = usePathname()

	// Check if current route is tenant space or admin space
	// Only skip AppShell for specific tenant with ID (not tenant list/management pages)
	const isTenantSpace = /^\/dashboard\/tenant\/[^\/]+/.test(pathname) || pathname.match(/^\/dashboard\/tenant\/[a-zA-Z0-9-_]+/)
	const isAdminSpace = pathname.startsWith('/dashboard/admin')

	console.log('🔍 Dashboard Layout Debug:', {
		pathname,
		isTenantSpace,
		isAdminSpace,
		'regex test 1': /^\/dashboard\/tenant\/[^\/]+/.test(pathname),
		'regex test 2': pathname.match(/^\/dashboard\/tenant\/[a-zA-Z0-9-_]+/),
		'pathname segments': pathname.split('/'),
		'should skip AppShell': isTenantSpace || isAdminSpace,
	})

	// Force skip AppShell for any path containing tenant ID
	if (pathname.split('/').length >= 4 && pathname.includes('/dashboard/tenant/')) {
		console.log('🚫 Force skipping AppShell for tenant space')
		return <ProtectedWrapper key={`tenant-${pathname}`}>{children}</ProtectedWrapper>
	}

	// For tenant space and admin space, don't wrap with AppShell
	// as they have their own layouts with dedicated sidebars
	if (isTenantSpace || isAdminSpace) {
		return <ProtectedWrapper key={`no-shell-${pathname}`}>{children}</ProtectedWrapper>
	}

	// For regular dashboard routes, use AppShell
	return (
		<ProtectedWrapper key={`with-shell-${pathname}`}>
			<AppShell>{children}</AppShell>
		</ProtectedWrapper>
	)
}
