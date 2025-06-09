'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Globe, Building2, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContextMode } from '@/types/dual-context'

export interface ContextIndicatorProps {
	// Display options
	variant?: 'badge' | 'card' | 'inline'
	size?: 'sm' | 'md' | 'lg'
	showIcon?: boolean
	showTooltip?: boolean
	showDetails?: boolean
	// Styling
	className?: string
	compact?: boolean
	// Behavior
	clickable?: boolean
	onClick?: () => void
}

interface ContextInfo {
	label: string
	description: string
	icon: React.ComponentType<{ className?: string }>
	color: string
	badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

const contextConfig: Record<ContextMode, ContextInfo> = {
	global: {
		label: 'Global',
		description: 'Operating in global context with system-wide permissions',
		icon: Globe,
		color: 'text-blue-600',
		badgeVariant: 'default'
	},
	tenant: {
		label: 'Tenant',
		description: 'Operating in tenant-specific context with organization permissions',
		icon: Building2,
		color: 'text-green-600',
		badgeVariant: 'secondary'
	},
	auto: {
		label: 'Auto',
		description: 'Automatically switching between global and tenant contexts',
		icon: Users,
		color: 'text-purple-600',
		badgeVariant: 'outline'
	}
}

export function ContextIndicator({
	variant = 'badge',
	size = 'md',
	showIcon = true,
	showTooltip = true,
	showDetails = false,
	className,
	compact = false,
	clickable = false,
	onClick
}: ContextIndicatorProps) {
	const { 
		currentMode, 
		currentTenantId, 
		globalContext, 
		tenantContext, 
		isTransitioning,
		isAuthenticated 
	} = useAuth()

	// Don't render if not authenticated
	if (!isAuthenticated) {
		return null
	}

	const effectiveMode = currentMode || 'global'
	const config = contextConfig[effectiveMode]
	const Icon = config.icon

	// Get context details
	const getContextDetails = () => {
		const details = {
			mode: effectiveMode,
			tenant: currentTenantId || null,
			user: globalContext?.user?.email || tenantContext?.user?.email,
			hasGlobal: !!globalContext?.isAuthenticated,
			hasTenant: !!tenantContext?.isAuthenticated && !!currentTenantId
		}
		return details
	}

	const details = getContextDetails()

	// Size classes
	const sizeClasses = {
		sm: {
			text: 'text-xs',
			icon: 'h-3 w-3',
			padding: 'px-2 py-1'
		},
		md: {
			text: 'text-sm',
			icon: 'h-4 w-4',
			padding: 'px-3 py-1.5'
		},
		lg: {
			text: 'text-base',
			icon: 'h-5 w-5',
			padding: 'px-4 py-2'
		}
	}

	const sizeClass = sizeClasses[size]

	// Render badge variant
	const renderBadge = () => {
		const content = (
			<Badge 
				variant={config.badgeVariant}
				className={cn(
					'flex items-center gap-1.5',
					sizeClass.text,
					sizeClass.padding,
					clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
					isTransitioning && 'animate-pulse',
					className
				)}
				onClick={clickable ? onClick : undefined}
			>
				{showIcon && <Icon className={cn(sizeClass.icon, config.color)} />}
				{compact ? config.label.charAt(0) : config.label}
				{details.tenant && !compact && (
					<span className="text-muted-foreground">({details.tenant})</span>
				)}
				{isTransitioning && (
					<AlertCircle className="h-3 w-3 text-yellow-500" />
				)}
			</Badge>
		)

		if (showTooltip) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>{content}</TooltipTrigger>
						<TooltipContent>
							<div className="space-y-1">
								<p className="font-medium">{config.label} Context</p>
								<p className="text-sm text-muted-foreground">{config.description}</p>
								{details.tenant && (
									<p className="text-sm">Tenant: {details.tenant}</p>
								)}
								{showDetails && (
									<div className="text-xs text-muted-foreground space-y-0.5">
										<div className="flex items-center gap-1">
											{details.hasGlobal ? (
												<CheckCircle2 className="h-3 w-3 text-green-500" />
											) : (
												<AlertCircle className="h-3 w-3 text-red-500" />
											)}
											Global context
										</div>
										<div className="flex items-center gap-1">
											{details.hasTenant ? (
												<CheckCircle2 className="h-3 w-3 text-green-500" />
											) : (
												<AlertCircle className="h-3 w-3 text-red-500" />
											)}
											Tenant context
										</div>
									</div>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)
		}

		return content
	}

	// Render card variant
	const renderCard = () => (
		<Card 
			className={cn(
				'w-fit',
				clickable && 'cursor-pointer hover:shadow-md transition-shadow',
				isTransitioning && 'animate-pulse',
				className
			)}
			onClick={clickable ? onClick : undefined}
		>
			<CardContent className={cn('flex items-center gap-3', sizeClass.padding)}>
				{showIcon && <Icon className={cn(sizeClass.icon, config.color)} />}
				<div className="flex-1">
					<div className={cn('font-medium', sizeClass.text)}>
						{config.label} Context
						{isTransitioning && (
							<AlertCircle className="inline ml-1 h-3 w-3 text-yellow-500" />
						)}
					</div>
					{details.tenant && (
						<div className="text-sm text-muted-foreground">
							{details.tenant}
						</div>
					)}
					{showDetails && (
						<div className="text-xs text-muted-foreground mt-1 space-y-0.5">
							<div className="flex items-center gap-1">
								{details.hasGlobal ? (
									<CheckCircle2 className="h-3 w-3 text-green-500" />
								) : (
									<AlertCircle className="h-3 w-3 text-red-500" />
								)}
								Global context available
							</div>
							<div className="flex items-center gap-1">
								{details.hasTenant ? (
									<CheckCircle2 className="h-3 w-3 text-green-500" />
								) : (
									<AlertCircle className="h-3 w-3 text-red-500" />
								)}
								Tenant context available
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)

	// Render inline variant
	const renderInline = () => {
		const content = (
			<span 
				className={cn(
					'inline-flex items-center gap-1.5',
					sizeClass.text,
					config.color,
					clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
					isTransitioning && 'animate-pulse',
					className
				)}
				onClick={clickable ? onClick : undefined}
			>
				{showIcon && <Icon className={sizeClass.icon} />}
				{compact ? config.label.charAt(0) : config.label}
				{details.tenant && !compact && (
					<span className="text-muted-foreground">({details.tenant})</span>
				)}
				{isTransitioning && (
					<AlertCircle className="h-3 w-3 text-yellow-500" />
				)}
			</span>
		)

		if (showTooltip) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>{content}</TooltipTrigger>
						<TooltipContent>
							<p>{config.description}</p>
							{details.tenant && (
								<p className="text-sm mt-1">Tenant: {details.tenant}</p>
							)}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)
		}

		return content
	}

	// Render based on variant
	switch (variant) {
		case 'card':
			return renderCard()
		case 'inline':
			return renderInline()
		default:
			return renderBadge()
	}
}

// Convenience components for specific contexts
export function GlobalContextIndicator(props: Omit<ContextIndicatorProps, 'variant'>) {
	return <ContextIndicator {...props} variant="badge" />
}

export function TenantContextIndicator(props: Omit<ContextIndicatorProps, 'variant'>) {
	return <ContextIndicator {...props} variant="badge" />
}

export function CompactContextIndicator(props: Omit<ContextIndicatorProps, 'compact' | 'size'>) {
	return <ContextIndicator {...props} compact size="sm" />
}