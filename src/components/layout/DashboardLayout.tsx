'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {AppHeader} from '@/components/layout/AppHeader'
import {ContextSwitcher} from '@/components/context/ContextSwitcher'
import {TenantSelector} from '@/components/tenants/TenantSelector'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {Loader2, AlertTriangle, Info} from 'lucide-react'
import {cn} from '@/lib/utils'

export interface DashboardLayoutProps {
	children: React.ReactNode
	title?: string
	description?: string
	showContextControls?: boolean
	showTenantInfo?: boolean
	className?: string
	requireAuth?: boolean
	allowedRoles?: string[]
	allowedContexts?: ('global' | 'tenant')[]
}

export function DashboardLayout({
	children,
	title,
	description,
	showContextControls = false,
	showTenantInfo = true,
	className,
	requireAuth = true,
	allowedRoles,
	allowedContexts,
}: DashboardLayoutProps) {
	const {user, isAuthenticated, currentMode, currentTenantId, globalContext, tenantContext} = useAuth()

	// Check if user has required roles
	const hasRequiredRole = () => {
		if (!allowedRoles || allowedRoles.length === 0) return true
		if (!user?.roles) return false
		return allowedRoles.some((role) => user.roles?.includes(role))
	}

	// Check if current context is allowed
	const hasValidContext = () => {
		if (!allowedContexts || allowedContexts.length === 0) return true
		// Handle 'auto' context mode
		if (currentMode === 'auto') return true
		return allowedContexts.includes(currentMode as 'global' | 'tenant')
	}

	// Show auth error
	if (requireAuth && !isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-600">
							<AlertTriangle className="h-5 w-5" />
							Authentication Required
						</CardTitle>
						<CardDescription>Please log in to access this page.</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	// Show role error
	if (!hasRequiredRole()) {
		return (
			<div className="min-h-screen">
				<AppHeader />
				<div className="container mx-auto p-4">
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							You don't have the required permissions to access this page.
							{allowedRoles && (
								<div className="mt-2">
									Required roles: {allowedRoles.map((role) => (
										<Badge key={role} variant="outline" className="ml-1">
											{role}
										</Badge>
									))}
								</div>
							)}
						</AlertDescription>
					</Alert>
				</div>
			</div>
		)
	}

	// Show context error
	if (!hasValidContext()) {
		return (
			<div className="min-h-screen">
				<AppHeader />
				<div className="container mx-auto p-4">
					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription>
							This page requires a specific context. Please switch to the appropriate context.
							{allowedContexts && (
								<div className="mt-2">
									Allowed contexts: {allowedContexts.map((context) => (
										<Badge key={context} variant="outline" className="ml-1">
											{context}
										</Badge>
									))}
								</div>
							)}
						</AlertDescription>
					</Alert>
					{showContextControls && (
						<div className="mt-4 space-y-4">
							<ContextSwitcher variant="card" showRefreshButton />
							<TenantSelector variant="full" />
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			<AppHeader 
				showNavigation={true}
				showContextSwitcher={true}
				showTenantSelector={true}
			/>
			
			<main className={cn('container mx-auto p-4', className)}>
				{/* Page Header */}
				{(title || description || showContextControls || showTenantInfo) && (
					<div className="mb-6 space-y-4">
						{/* Title and Description */}
						{(title || description) && (
							<div>
								{title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
								{description && (
									<p className="text-muted-foreground mt-2">{description}</p>
								)}
							</div>
						)}

						{/* Context Information */}
						{showTenantInfo && (
							<div className="flex flex-wrap gap-4 text-sm">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground">Current Context:</span>
									<Badge variant={currentMode === 'global' ? 'default' : 'secondary'}>
										{currentMode === 'global' ? 'Global' : `Tenant: ${currentTenantId}`}
									</Badge>
								</div>
								
								{currentMode === 'global' && globalContext?.user && (
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">User:</span>
										<span>{globalContext.user.email}</span>
									</div>
								)}
								
								{currentMode === 'tenant' && tenantContext?.user && (
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">Tenant User:</span>
										<span>{tenantContext.user.email}</span>
									</div>
								)}
							</div>
						)}

						{/* Context Controls */}
						{showContextControls && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<ContextSwitcher 
									variant="card" 
									showRefreshButton 
									showCurrentContext
									showTenantInfo
								/>
								<TenantSelector 
									variant="full"
									showGlobalOption
									showCreateButton
									showManageButton
								/>
							</div>
						)}
					</div>
				)}

				{/* Main Content */}
				{children}
			</main>
		</div>
	)
}
