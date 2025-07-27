'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Key, Globe, Building2, ChevronDown, Check, Plus, RefreshCw, AlertCircle, Loader2, Copy, Eye} from 'lucide-react'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import * as tenantDIDService from '@/services/tenantDIDService'
import type {TenantDIDDocument, ListTenantDIDsRequest} from '@/services/tenantDIDService'

export interface TenantDIDSelectorProps {
	tenantId: string
	selectedDID?: string
	onDIDSelect?: (didId: string, didDocument: TenantDIDDocument) => void
	variant?: 'select' | 'dropdown'
	showCreateButton?: boolean
	showRefreshButton?: boolean
	className?: string
	disabled?: boolean
	placeholder?: string
	filterActiveOnly?: boolean
	filterCapabilities?: string[]
}

interface TenantDIDOption {
	id: string
	did: string
	method: string
	status: 'active' | 'revoked' | 'deactivated'
	capabilities?: string[]
	isActive: boolean
	document: TenantDIDDocument
}

const getMethodIcon = (method: string) => {
	switch (method.toLowerCase()) {
		case 'web':
			return <Globe className='h-4 w-4 text-blue-600' />
		case 'key':
			return <Key className='h-4 w-4 text-green-600' />
		case 'ethr':
			return <Building2 className='h-4 w-4 text-purple-600' />
		default:
			return <Key className='h-4 w-4 text-gray-600' />
	}
}

const getStatusBadge = (status: string) => {
	const variants = {
		active: 'default',
		deactivated: 'secondary',
		revoked: 'destructive',
	} as const

	return (
		<Badge variant={variants[status as keyof typeof variants] || 'secondary'} className='text-xs'>
			{status}
		</Badge>
	)
}

const truncateDID = (did: string, maxLength = 30): string => {
	if (did.length <= maxLength) return did
	return `${did.substring(0, maxLength)}...`
}

/**
 * TenantDIDSelector Component
 *
 * A dropdown/select component for choosing tenant DIDs, with support for:
 * - Loading tenant DIDs from API
 * - Filtering by status and capabilities
 * - Auto-selection of the first active DID
 * - Refresh and create options
 * - Multiple display variants
 */
const TenantDIDSelectorComponent = ({tenantId, selectedDID, onDIDSelect, variant = 'select', showCreateButton = false, showRefreshButton = true, className, disabled = false, placeholder = 'Select issuer DID...', filterActiveOnly = true, filterCapabilities}: TenantDIDSelectorProps) => {
	const [dids, setDids] = useState<TenantDIDOption[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [refreshing, setRefreshing] = useState(false)

	// Debug render count
	const renderCount = React.useRef(0)
	renderCount.current += 1
	console.log(`🔄 TenantDIDSelector render count: ${renderCount.current}, tenantId: ${tenantId}`, {
		selectedDID,
		filterActiveOnly,
		filterCapabilities,
	})

	// Load tenant DIDs from API
	const loadTenantDIDs = useCallback(
		async (showLoadingState = true) => {
			if (showLoadingState) {
				setLoading(true)
			} else {
				setRefreshing(true)
			}

			setError(null)

			try {
				const request: ListTenantDIDsRequest = {
					tenantId,
					pageSize: 100, // Load all DIDs for selection
				}

				console.log('🔍 Loading tenant DIDs for tenant:', tenantId)
				const response = await tenantDIDService.getTenantDIDs(request)
				console.log('📥 API Response:', response)
				console.log('📥 API Response keys:', Object.keys(response))
				console.log('📥 response.dids:', response.dids)
				console.log('📥 response.dids type:', typeof response.dids)

				// Handle different possible response structures
				const didsArray = response.dids || []
				console.log('📥 Extracted dids array:', didsArray)
				console.log('📥 Extracted dids array length:', didsArray.length)

				if (didsArray && Array.isArray(didsArray) && didsArray.length > 0) {
					console.log('✅ Found DIDs:', didsArray.length)
					console.log('✅ First DID structure:', didsArray[0])
					let filteredDIDs = didsArray

					// Filter active only if requested
					if (filterActiveOnly) {
						filteredDIDs = filteredDIDs.filter((did) => did.status === 'active')
						console.log('🔍 After active filter:', filteredDIDs.length)
					}

					// Filter by capabilities if specified
					if (filterCapabilities && filterCapabilities.length > 0) {
						const beforeCount = filteredDIDs.length
						filteredDIDs = filteredDIDs.filter((did) => filterCapabilities.some((cap) => did.capabilities?.includes(cap) || did.tenant_capabilities?.[cap]))
						console.log(`🔍 After capabilities filter (${filterCapabilities.join(', ')}):`, filteredDIDs.length, 'from', beforeCount)
					}

					const didOptions: TenantDIDOption[] = filteredDIDs.map((did) => ({
						id: did.id,
						did: did.document.id, // DID string from document.id
						method: did.method,
						status: did.status as 'active' | 'revoked' | 'deactivated',
						capabilities: did.capabilities,
						isActive: did.status === 'active',
						document: did,
					}))

					console.log('🎯 Final DID options:', didOptions)
					setDids(didOptions)
				} else {
					console.log('❌ No DIDs in response')
					setDids([])
				}
			} catch (err) {
				console.error('❌ Error loading tenant DIDs:', err)
				setError(err instanceof Error ? err.message : 'Failed to load tenant DIDs. Please try again.')
				setDids([])
			} finally {
				setLoading(false)
				setRefreshing(false)
			}
		},
		[tenantId, filterActiveOnly, filterCapabilities],
	)

	// Separate effect for auto-selection to avoid reload loops
	useEffect(() => {
		if (!selectedDID && dids.length > 0 && onDIDSelect) {
			const firstActiveDID = dids.find((d) => d.isActive) || dids[0]
			console.log('🎯 Auto-selecting DID:', firstActiveDID.did)
			onDIDSelect(firstActiveDID.did, firstActiveDID.document)
		}
	}, [dids, selectedDID, onDIDSelect])

	// Load DIDs on mount and when tenantId changes
	useEffect(() => {
		if (tenantId) {
			loadTenantDIDs()
		}
	}, [tenantId, loadTenantDIDs])

	// Handle DID selection
	const handleDIDSelect = useCallback(
		(didId: string) => {
			const selectedOption = dids.find((d) => d.did === didId)
			if (selectedOption && onDIDSelect) {
				onDIDSelect(selectedOption.did, selectedOption.document)
			}
		},
		[dids, onDIDSelect],
	)

	// Handle refresh
	const handleRefresh = useCallback(() => {
		loadTenantDIDs(false)
		toast.success('Tenant DIDs refreshed')
	}, [loadTenantDIDs])

	// Handle copy DID
	const handleCopyDID = useCallback(async (did: string) => {
		try {
			await navigator.clipboard.writeText(did)
			toast.success('DID copied to clipboard')
		} catch {
			toast.error('Failed to copy DID')
		}
	}, [])

	// Find selected option
	const selectedOption = dids.find((d) => d.did === selectedDID)

	if (loading) {
		return <Skeleton className={cn('h-10 w-full', className)} />
	}

	if (error) {
		return (
			<Alert className={className}>
				<AlertCircle className='h-4 w-4' />
				<AlertDescription className='flex items-center justify-between'>
					<span>{error}</span>
					<Button variant='outline' size='sm' onClick={() => loadTenantDIDs()}>
						<RefreshCw className='h-4 w-4 mr-1' />
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		)
	}

	if (dids.length === 0) {
		return (
			<Alert className={className}>
				<AlertCircle className='h-4 w-4' />
				<AlertDescription className='flex items-center justify-between'>
					<div>
						<p>No DIDs found for this tenant.</p>
						<p className='text-xs text-muted-foreground mt-1'>{filterActiveOnly ? 'No active DIDs available.' : 'No DIDs created yet.'}</p>
						{/* Debug info */}
						<details className='mt-2'>
							<summary className='text-xs cursor-pointer text-blue-600'>Debug Info</summary>
							<pre className='text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-32'>
								Tenant ID: {tenantId}
								{'\n'}
								Filter Active Only: {filterActiveOnly.toString()}
								{'\n'}
								Filter Capabilities: {filterCapabilities?.join(', ') || 'none'}
								{'\n'}
								DIDs Array Length: {dids.length}
							</pre>
						</details>
					</div>
					{showCreateButton && (
						<Button variant='outline' size='sm'>
							<Plus className='h-4 w-4 mr-1' />
							Create DID
						</Button>
					)}
				</AlertDescription>
			</Alert>
		)
	}

	// Render Select variant
	if (variant === 'select') {
		return (
			<div className={cn('space-y-2', className)}>
				<Select value={selectedDID || ''} onValueChange={handleDIDSelect} disabled={disabled}>
					<SelectTrigger>
						<SelectValue placeholder={placeholder}>
							{selectedOption && (
								<div className='flex items-center gap-2'>
									{getMethodIcon(selectedOption.method)}
									<span className='flex-1 text-left truncate'>{truncateDID(selectedOption.did)}</span>
									{getStatusBadge(selectedOption.status)}
								</div>
							)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{dids.map((did) => (
							<SelectItem key={did.id} value={did.did} className='py-3'>
								<div className='flex items-center gap-2 w-full'>
									{getMethodIcon(did.method)}
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2'>
											<span className='truncate font-mono text-sm'>{truncateDID(did.did)}</span>
											{getStatusBadge(did.status)}
										</div>
										<div className='text-xs text-muted-foreground mt-1'>
											Method: {did.method.toUpperCase()}
											{did.capabilities && did.capabilities.length > 0 && <span className='ml-2'>• {did.capabilities.length} capabilities</span>}
										</div>
									</div>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Action buttons */}
				{(showRefreshButton || showCreateButton) && (
					<div className='flex gap-2'>
						{showRefreshButton && (
							<Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing}>
								{refreshing ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
								<span className='ml-1'>Refresh</span>
							</Button>
						)}
						{showCreateButton && (
							<Button variant='outline' size='sm'>
								<Plus className='h-4 w-4 mr-1' />
								Create DID
							</Button>
						)}
					</div>
				)}
			</div>
		)
	}

	// Render Dropdown variant
	return (
		<div className={cn('', className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline' className='w-full justify-between' disabled={disabled}>
						{selectedOption ? (
							<div className='flex items-center gap-2 flex-1 min-w-0'>
								{getMethodIcon(selectedOption.method)}
								<span className='truncate'>{truncateDID(selectedOption.did)}</span>
								{getStatusBadge(selectedOption.status)}
							</div>
						) : (
							<span className='text-muted-foreground'>{placeholder}</span>
						)}
						<ChevronDown className='h-4 w-4 opacity-50' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-[400px]' align='start'>
					<DropdownMenuLabel>Select Issuer DID</DropdownMenuLabel>
					<DropdownMenuSeparator />

					{dids.map((did) => (
						<DropdownMenuItem key={did.id} onClick={() => handleDIDSelect(did.did)} className='flex items-center gap-2 py-3'>
							{getMethodIcon(did.method)}
							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-2'>
									<span className='truncate font-mono text-sm'>{did.did}</span>
									{selectedDID === did.did && <Check className='h-4 w-4 text-green-600' />}
								</div>
								<div className='text-xs text-muted-foreground mt-1'>
									Method: {did.method.toUpperCase()} • Status: {did.status}
									{did.capabilities && did.capabilities.length > 0 && <span className='ml-2'>• {did.capabilities.length} capabilities</span>}
								</div>
							</div>
							<div className='flex items-center gap-1'>
								{getStatusBadge(did.status)}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={(e) => e.stopPropagation()}>
											<Eye className='h-3 w-3' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' onClick={(e) => e.stopPropagation()}>
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation()
												handleCopyDID(did.did)
											}}>
											<Copy className='h-4 w-4 mr-2' />
											Copy DID
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</DropdownMenuItem>
					))}

					{(showRefreshButton || showCreateButton) && (
						<>
							<DropdownMenuSeparator />
							{showRefreshButton && (
								<DropdownMenuItem onClick={handleRefresh} disabled={refreshing}>
									{refreshing ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <RefreshCw className='h-4 w-4 mr-2' />}
									Refresh DIDs
								</DropdownMenuItem>
							)}
							{showCreateButton && (
								<DropdownMenuItem>
									<Plus className='h-4 w-4 mr-2' />
									Create New DID
								</DropdownMenuItem>
							)}
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

// Export memoized component to prevent unnecessary re-renders
export const TenantDIDSelector = React.memo(TenantDIDSelectorComponent)

// Convenience components
export function CompactTenantDIDSelector(props: Omit<TenantDIDSelectorProps, 'variant'>) {
	return <TenantDIDSelector {...props} variant='select' />
}

export function DropdownTenantDIDSelector(props: Omit<TenantDIDSelectorProps, 'variant'>) {
	return <TenantDIDSelector {...props} variant='dropdown' />
}
