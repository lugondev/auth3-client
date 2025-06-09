'use client'

import React, {useState, useCallback} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {Globe, Building2, Users, ChevronDown, Check, AlertCircle, Loader2, RefreshCw, LogOut} from 'lucide-react'
import {cn} from '@/lib/utils'
import {ContextMode} from '@/types/dual-context'
import {toast} from 'sonner'

export interface ContextSwitcherProps {
	// Display options
	variant?: 'dropdown' | 'card' | 'button-group'
	size?: 'sm' | 'md' | 'lg'
	showCurrentContext?: boolean
	showTenantInfo?: boolean
	showRefreshButton?: boolean
	// Styling
	className?: string
	compact?: boolean
	// Behavior
	disabled?: boolean
	onContextSwitch?: (newMode: ContextMode) => void
	onError?: (error: Error) => void
}

interface ContextOption {
	mode: ContextMode
	label: string
	description: string
	icon: React.ComponentType<{className?: string}>
	color: string
	available: boolean
	reason?: string
}

export function ContextSwitcher({variant = 'dropdown', size = 'md', showCurrentContext = true, showTenantInfo = true, showRefreshButton = false, className, compact = false, disabled = false, onContextSwitch, onError}: ContextSwitcherProps) {
	const {currentMode, currentTenantId, globalContext, tenantContext, isTransitioning, switchToGlobal, switchToTenant, switchContext, logout, isAuthenticated} = useAuth()

	const [isRefreshing, setIsRefreshing] = useState(false)

	// Get available context options
	const getContextOptions = useCallback((): ContextOption[] => {
		const hasGlobalTokens = !!globalContext?.isAuthenticated
		const hasTenantTokens = !!tenantContext?.isAuthenticated
		const hasTenant = !!currentTenantId

		return [
			{
				mode: 'global',
				label: 'Global Context',
				description: 'System-wide permissions and administration',
				icon: Globe,
				color: 'text-blue-600',
				available: hasGlobalTokens,
				reason: hasGlobalTokens ? undefined : 'No global authentication available',
			},
			{
				mode: 'tenant',
				label: 'Tenant Context',
				description: hasTenant ? `Organization-specific permissions for ${currentTenantId}` : 'Organization-specific permissions',
				icon: Building2,
				color: 'text-green-600',
				available: hasTenantTokens && hasTenant,
				reason: !hasTenant ? 'No tenant selected' : !hasTenantTokens ? 'No tenant authentication available' : undefined,
			},
			{
				mode: 'auto',
				label: 'Auto Context',
				description: 'Automatically switch between global and tenant contexts',
				icon: Users,
				color: 'text-purple-600',
				available: hasGlobalTokens || (hasTenantTokens && hasTenant),
				reason: !hasGlobalTokens && (!hasTenantTokens || !hasTenant) ? 'No authentication contexts available' : undefined,
			},
		]
	}, [globalContext, tenantContext, currentTenantId])

	const contextOptions = getContextOptions()
	const currentOption = contextOptions.find((opt) => opt.mode === currentMode)

	// Handle context switching
	const handleContextSwitch = async (newMode: ContextMode) => {
		if (newMode === currentMode || isTransitioning || disabled) {
			return
		}

		const option = contextOptions.find((opt) => opt.mode === newMode)
		if (!option?.available) {
			toast.error(`Cannot switch to ${option?.label}: ${option?.reason}`)
			return
		}

		try {
			switch (newMode) {
				case 'global':
					await switchToGlobal()
					break
				case 'tenant':
					if (!currentTenantId) {
						throw new Error('No tenant selected')
					}
					await switchToTenant(currentTenantId)
					break
				case 'auto':
					// Auto mode: switch to tenant if available, otherwise global
					if (currentTenantId && tenantContext?.isAuthenticated) {
						await switchToTenant(currentTenantId)
					} else {
						await switchToGlobal()
					}
					break
				default:
					throw new Error(`Unknown context mode: ${newMode}`)
			}

			toast.success(`Switched to ${option.label}`)
			onContextSwitch?.(newMode)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to switch context'
			toast.error(`Context switch failed: ${errorMessage}`)
			onError?.(error instanceof Error ? error : new Error(errorMessage))
		}
	}

	// Handle refresh - refresh current context
	const handleRefresh = async () => {
		if (isRefreshing || disabled) return

		setIsRefreshing(true)
		try {
			// Refresh by switching to current mode again
			await switchContext(currentMode, currentTenantId || undefined)
			toast.success('Context refreshed')
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to refresh context'
			toast.error(`Refresh failed: ${errorMessage}`)
			onError?.(error instanceof Error ? error : new Error(errorMessage))
		} finally {
			setIsRefreshing(false)
		}
	}

	// Handle logout
	const handleLogout = async () => {
		if (disabled) return

		try {
			await logout()
			toast.success('Logged out successfully')
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to logout'
			toast.error(`Logout failed: ${errorMessage}`)
			onError?.(error instanceof Error ? error : new Error(errorMessage))
		}
	}

	// Size classes
	const sizeClasses = {
		sm: {
			text: 'text-xs',
			icon: 'h-3 w-3',
			padding: 'px-2 py-1',
			button: 'h-8',
		},
		md: {
			text: 'text-sm',
			icon: 'h-4 w-4',
			padding: 'px-3 py-2',
			button: 'h-9',
		},
		lg: {
			text: 'text-base',
			icon: 'h-5 w-5',
			padding: 'px-4 py-2',
			button: 'h-10',
		},
	}

	const sizeClass = sizeClasses[size]

	// Render dropdown variant
	const renderDropdown = () => {
		const CurrentIcon = currentOption?.icon || Globe

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline' className={cn('flex items-center gap-2', sizeClass.text, isTransitioning && 'animate-pulse', className)} disabled={disabled || isTransitioning}>
						{isTransitioning ? <Loader2 className={cn(sizeClass.icon, 'animate-spin')} /> : <CurrentIcon className={cn(sizeClass.icon, currentOption?.color)} />}
						{showCurrentContext && !compact && (
							<span>
								{currentOption?.label || 'Unknown'}
								{showTenantInfo && currentMode === 'tenant' && currentTenantId && <span className='text-muted-foreground ml-1'>({currentTenantId})</span>}
							</span>
						)}
						<ChevronDown className={cn(sizeClass.icon, 'opacity-50')} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-64'>
					<DropdownMenuLabel>Switch Context</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{contextOptions.map((option) => {
						const Icon = option.icon
						const isCurrent = option.mode === currentMode

						return (
							<DropdownMenuItem key={option.mode} onClick={() => handleContextSwitch(option.mode)} disabled={!option.available || isCurrent} className={cn('flex items-center gap-3 cursor-pointer', !option.available && 'opacity-50')}>
								<Icon className={cn('h-4 w-4', option.color)} />
								<div className='flex-1'>
									<div className='flex items-center gap-2'>
										<span className='font-medium'>{option.label}</span>
										{isCurrent && <Check className='h-3 w-3 text-green-600' />}
										{!option.available && <AlertCircle className='h-3 w-3 text-red-500' />}
									</div>
									<p className='text-xs text-muted-foreground'>{option.available ? option.description : option.reason}</p>
								</div>
							</DropdownMenuItem>
						)
					})}
					{showRefreshButton && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing} className='flex items-center gap-3 cursor-pointer'>
								{isRefreshing ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
								<span>Refresh Contexts</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleLogout} className='flex items-center gap-3 cursor-pointer text-red-600'>
								<LogOut className='h-4 w-4' />
								<span>Logout</span>
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}

	// Render button group variant
	const renderButtonGroup = () => (
		<div className={cn('flex items-center gap-1 p-1 bg-muted rounded-lg', className)}>
			{contextOptions.map((option) => {
				const Icon = option.icon
				const isCurrent = option.mode === currentMode
				const isDisabled = !option.available || disabled || isTransitioning

				const button = (
					<Button key={option.mode} variant={isCurrent ? 'default' : 'ghost'} onClick={() => handleContextSwitch(option.mode)} disabled={isDisabled} className={cn('flex items-center gap-2', sizeClass.text, isCurrent && 'shadow-sm', isTransitioning && option.mode === currentMode && 'animate-pulse')}>
						{isTransitioning && option.mode === currentMode ? <Loader2 className={cn(sizeClass.icon, 'animate-spin')} /> : <Icon className={cn(sizeClass.icon, option.color)} />}
						{!compact && option.label.split(' ')[0]}
						{!option.available && <AlertCircle className='h-3 w-3 text-red-500' />}
					</Button>
				)

				if (!option.available) {
					return (
						<TooltipProvider key={option.mode}>
							<Tooltip>
								<TooltipTrigger asChild>{button}</TooltipTrigger>
								<TooltipContent>
									<p>{option.reason}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)
				}

				return button
			})}
		</div>
	)

	// Render card variant
	const renderCard = () => (
		<Card className={cn('w-fit', className)}>
			<CardHeader className='pb-3'>
				<CardTitle className={cn('flex items-center gap-2', sizeClass.text)}>
					<Users className={sizeClass.icon} />
					Context Switcher
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-3'>
				{showCurrentContext && currentOption && (
					<div className='flex items-center gap-2 p-2 bg-muted rounded'>
						<currentOption.icon className={cn(sizeClass.icon, currentOption.color)} />
						<div>
							<p className={cn('font-medium', sizeClass.text)}>Current: {currentOption.label}</p>
							{showTenantInfo && currentMode === 'tenant' && currentTenantId && <p className='text-xs text-muted-foreground'>{currentTenantId}</p>}
						</div>
					</div>
				)}
				<div className='space-y-2'>
					{contextOptions.map((option) => {
						const Icon = option.icon
						const isCurrent = option.mode === currentMode
						const isDisabled = !option.available || disabled || isTransitioning

						return (
							<Button key={option.mode} variant={isCurrent ? 'default' : 'outline'} onClick={() => handleContextSwitch(option.mode)} disabled={isDisabled} className={cn('w-full justify-start gap-3', sizeClass.text, isTransitioning && option.mode === currentMode && 'animate-pulse')}>
								{isTransitioning && option.mode === currentMode ? <Loader2 className={cn(sizeClass.icon, 'animate-spin')} /> : <Icon className={cn(sizeClass.icon, option.color)} />}
								<div className='flex-1 text-left'>
									<div className='flex items-center gap-2'>
										<span>{option.label}</span>
										{isCurrent && (
											<Badge variant='secondary' className='text-xs'>
												Current
											</Badge>
										)}
										{!option.available && <AlertCircle className='h-3 w-3 text-red-500' />}
									</div>
									<p className='text-xs text-muted-foreground'>{option.available ? option.description : option.reason}</p>
								</div>
							</Button>
						)
					})}
				</div>
				{showRefreshButton && (
					<div className='flex gap-2 pt-2 border-t'>
						<Button variant='outline' onClick={handleRefresh} disabled={isRefreshing || disabled} className='flex-1'>
							{isRefreshing ? <Loader2 className={cn(sizeClass.icon, 'animate-spin mr-2')} /> : <RefreshCw className={cn(sizeClass.icon, 'mr-2')} />}
							Refresh
						</Button>
						<Button variant='outline' onClick={handleLogout} disabled={disabled} className='text-red-600 hover:text-red-700'>
							<LogOut className={sizeClass.icon} />
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)

	// Don't render if not authenticated
	if (!isAuthenticated) {
		return null
	}

	// Render based on variant
	switch (variant) {
		case 'card':
			return renderCard()
		case 'button-group':
			return renderButtonGroup()
		default:
			return renderDropdown()
	}
}

// Convenience components
export function CompactContextSwitcher(props: Omit<ContextSwitcherProps, 'compact' | 'size'>) {
	return <ContextSwitcher {...props} compact size='sm' />
}

export function ContextSwitcherCard(props: Omit<ContextSwitcherProps, 'variant'>) {
	return <ContextSwitcher {...props} variant='card' />
}

export function ContextSwitcherButtonGroup(props: Omit<ContextSwitcherProps, 'variant'>) {
	return <ContextSwitcher {...props} variant='button-group' />
}
