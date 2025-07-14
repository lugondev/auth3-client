'use client'

import React, {useState, useCallback, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useAuth} from '@/contexts/AuthContext'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {
	Building2,
	ChevronDown,
	Check,
	Plus,
	Settings,
	Globe,
	Crown,
	Users,
	Loader2,
	LogOut,
} from 'lucide-react'
import {cn} from '@/lib/utils'
import {getJoinedTenants} from '@/services/tenantService'
import {JoinedTenantMembership} from '@/types/tenantManagement'
import {toast} from 'sonner'

export interface TenantSelectorProps {
	variant?: 'compact' | 'full' | 'dropdown'
	showGlobalOption?: boolean
	showCreateButton?: boolean
	showManageButton?: boolean
	className?: string
	onTenantChange?: (tenantId: string | null) => void
	onCreateTenant?: () => void
	disabled?: boolean
}

interface TenantOption {
	id: string | null
	name: string
	description?: string
	role?: string
	isOwner?: boolean
	isGlobal?: boolean
	userCount?: number
	avatar?: string
}

export function TenantSelector({
	variant = 'full',
	showGlobalOption = true,
	showCreateButton = true,
	showManageButton = true,
	className,
	onTenantChange,
	onCreateTenant,
	disabled = false,
}: TenantSelectorProps) {
	const {user, currentTenantId, currentMode, switchToTenant, switchToGlobal, isTransitioning} = useAuth()
	const [isChanging, setIsChanging] = useState(false)

	// Fetch user's tenants
	const {
		data: tenantsData,
		isLoading: isLoadingTenants,
		error: tenantsError,
		refetch: refetchTenants,
	} = useQuery({
		queryKey: ['joinedTenants', user?.id],
		queryFn: () => getJoinedTenants(20, 0), // Fetch up to 20 tenants
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})

	// Transform tenants data to options
	const getTenantOptions = useCallback((): TenantOption[] => {
		const options: TenantOption[] = []

		// Add global option if enabled
		if (showGlobalOption) {
			options.push({
				id: null,
				name: 'Global Context',
				description: 'System-wide administration',
				isGlobal: true,
			})
		}

		// Add user's tenants
		if (tenantsData?.memberships) {
			const tenantOptions = tenantsData.memberships.map((tenant: JoinedTenantMembership): TenantOption => ({
				id: tenant.tenant_id,
				name: tenant.tenant_name,
				description: `Roles: ${tenant.user_roles?.join(', ') || 'Member'}`,
				role: tenant.user_roles?.join(', ') || 'Member',
				isOwner: false, // JoinedTenantMembership doesn't indicate ownership
			}))

			// Sort by name
			tenantOptions.sort((a: TenantOption, b: TenantOption) => {
				return a.name.localeCompare(b.name)
			})

			options.push(...tenantOptions)
		}

		return options
	}, [tenantsData, showGlobalOption])

	const tenantOptions = getTenantOptions()
	const currentOption = tenantOptions.find(
		(option) => option.id === (currentMode === 'global' ? null : currentTenantId)
	)

	// Handle tenant selection
	const handleTenantSelect = async (tenantId: string | null) => {
		if (tenantId === (currentMode === 'global' ? null : currentTenantId) || isChanging || disabled) {
			return
		}

		setIsChanging(true)
		try {
			if (tenantId === null) {
				// Switch to global context - will call login-global API
				toast.info('Switching to global context...')
				await switchToGlobal()
				toast.success('Switched to global context')
			} else {
				// Switch to tenant context - will call login-tenant API
				const tenant = tenantOptions.find((t) => t.id === tenantId)
				toast.info(`Authenticating with ${tenant?.name || 'tenant'}...`)
				await switchToTenant(tenantId)
				toast.success(`Switched to ${tenant?.name || 'tenant'}`)
			}

			onTenantChange?.(tenantId)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to switch context'
			toast.error(`Context switch failed: ${message}`)
		} finally {
			setIsChanging(false)
		}
	}

	// Handle create tenant
	const handleCreateTenant = () => {
		if (onCreateTenant) {
			onCreateTenant()
		} else {
			// Default behavior - could navigate to create tenant page
			toast.info('Create tenant functionality not implemented')
		}
	}

	// Compact variant (just a select dropdown)
	const renderCompact = () => (
		<Select
			value={currentOption?.id || 'global'}
			onValueChange={(value) => handleTenantSelect(value === 'global' ? null : value)}
			disabled={disabled || isChanging || isTransitioning}
		>
			<SelectTrigger className={cn('w-[200px]', className)}>
				<div className="flex items-center gap-2">
					{currentOption?.isGlobal ? (
						<Globe className="h-4 w-4 text-blue-600" />
					) : (
						<Building2 className="h-4 w-4 text-green-600" />
					)}
					<SelectValue placeholder="Select context..." />
				</div>
			</SelectTrigger>
			<SelectContent>
				{tenantOptions.map((option) => (
					<SelectItem key={option.id || 'global'} value={option.id || 'global'}>
						<div className="flex items-center gap-2">
							{option.isGlobal ? (
								<Globe className="h-4 w-4 text-blue-600" />
							) : (
								<Building2 className="h-4 w-4 text-green-600" />
							)}
							<span>{option.name}</span>
							{option.isOwner && <Crown className="h-3 w-3 text-yellow-500" />}
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)

	// Full variant with dropdown menu
	const renderFull = () => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'w-full justify-between gap-2 min-w-[250px]',
						(isChanging || isTransitioning) && 'animate-pulse',
						className
					)}
					disabled={disabled}
				>
					<div className="flex items-center gap-2 flex-1 min-w-0">
						{isChanging || isTransitioning ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : currentOption?.isGlobal ? (
							<Globe className="h-4 w-4 text-blue-600" />
						) : (
							<Building2 className="h-4 w-4 text-green-600" />
						)}
						<div className="flex-1 min-w-0 text-left">
							<div className="truncate font-medium">
								{currentOption?.name || 'Select context...'}
							</div>
							{currentOption && !currentOption.isGlobal && (
								<div className="text-xs text-muted-foreground truncate">
									{currentOption.role}
									{currentOption.isOwner && ' • Owner'}
								</div>
							)}
						</div>
					</div>
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[300px]">
				<DropdownMenuLabel>Switch Context</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{isLoadingTenants ? (
					<DropdownMenuItem disabled>
						<Loader2 className="h-4 w-4 animate-spin mr-2" />
						Loading tenants...
					</DropdownMenuItem>
				) : tenantsError ? (
					<DropdownMenuItem onClick={() => refetchTenants()}>
						<Building2 className="h-4 w-4 mr-2 text-red-500" />
						Error loading tenants. Click to retry.
					</DropdownMenuItem>
				) : (
					tenantOptions.map((option) => {
						const isCurrent =
							option.id === (currentMode === 'global' ? null : currentTenantId)

						return (
							<DropdownMenuItem
								key={option.id || 'global'}
								onClick={() => handleTenantSelect(option.id)}
								disabled={isCurrent}
								className="flex items-center gap-3 p-3"
							>
								<div className="flex items-center gap-2 flex-1 min-w-0">
									{option.isGlobal ? (
										<Globe className="h-4 w-4 text-blue-600" />
									) : (
										<Building2 className="h-4 w-4 text-green-600" />
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium truncate">{option.name}</span>
											{option.isOwner && <Crown className="h-3 w-3 text-yellow-500" />}
											{isCurrent && <Check className="h-3 w-3 text-green-600" />}
										</div>
										{option.description && (
											<p className="text-xs text-muted-foreground truncate">
												{option.description}
											</p>
										)}
									</div>
								</div>
								{!option.isGlobal && option.role && (
									<Badge variant="secondary" className="text-xs">
										{option.role}
									</Badge>
								)}
							</DropdownMenuItem>
						)
					})
				)}

				{(showCreateButton || showManageButton) && (
					<>
						<DropdownMenuSeparator />
						{showCreateButton && (
							<DropdownMenuItem onClick={handleCreateTenant}>
								<Plus className="h-4 w-4 mr-2" />
								Create New Tenant
							</DropdownMenuItem>
						)}
						{showManageButton && (
							<DropdownMenuItem onClick={() => {/* Navigate to tenant management */}}>
								<Settings className="h-4 w-4 mr-2" />
								Manage Tenants
							</DropdownMenuItem>
						)}
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)

	// Dropdown variant (simple dropdown for navigation bars)
	const renderDropdown = () => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'gap-2',
						(isChanging || isTransitioning) && 'animate-pulse',
						className
					)}
					disabled={disabled}
				>
					{isChanging || isTransitioning ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : currentOption?.isGlobal ? (
						<Globe className="h-4 w-4 text-blue-600" />
					) : (
						<Building2 className="h-4 w-4 text-green-600" />
					)}
					<span className="hidden sm:inline">
						{currentOption?.name || 'Context'}
					</span>
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[250px]">
				{tenantOptions.map((option) => (
					<DropdownMenuItem
						key={option.id || 'global'}
						onClick={() => handleTenantSelect(option.id)}
						className="flex items-center gap-2"
					>
						{option.isGlobal ? (
							<Globe className="h-4 w-4 text-blue-600" />
						) : (
							<Building2 className="h-4 w-4 text-green-600" />
						)}
						<span className="flex-1">{option.name}</span>
						{option.isOwner && <Crown className="h-3 w-3 text-yellow-500" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)

	// Don't render if user is not authenticated
	if (!user) return null

	// Render based on variant
	switch (variant) {
		case 'compact':
			return renderCompact()
		case 'dropdown':
			return renderDropdown()
		default:
			return renderFull()
	}
}

// Convenience components
export function CompactTenantSelector(props: Omit<TenantSelectorProps, 'variant'>) {
	return <TenantSelector {...props} variant="compact" />
}

export function DropdownTenantSelector(props: Omit<TenantSelectorProps, 'variant'>) {
	return <TenantSelector {...props} variant="dropdown" />
}
