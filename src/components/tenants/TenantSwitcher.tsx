'use client'

import React, {useState, useEffect} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Button} from '@/components/ui/button'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {ChevronsUpDown, Check} from 'lucide-react' // Icons

export function TenantSwitcher() {
	const {user, userTenants, currentTenantId, switchTenant, loading: authLoading} = useAuth()
	const [isSwitching, setIsSwitching] = useState(false)
	const [currentTenantName, setCurrentTenantName] = useState<string | null>(null)

	console.log('[TenantSwitcher] AuthContext values:', {user, userTenants, currentTenantId, authLoading})

	useEffect(() => {
		console.log('[TenantSwitcher] useEffect triggered. currentTenantId:', currentTenantId, 'userTenants:', userTenants)
		if (currentTenantId && userTenants) {
			const activeTenant = userTenants.find((t) => t.tenant_id === currentTenantId)
			setCurrentTenantName(activeTenant ? activeTenant.tenant_name : 'Unknown Organization')
		} else if (userTenants && userTenants.length > 0) {
			// If no currentTenantId but tenants are available, prompt selection
			console.log('[TenantSwitcher] No currentTenantId, but tenants available. Setting to "Select Organization".')
			setCurrentTenantName('Select Organization')
		} else {
			console.log('[TenantSwitcher] No currentTenantId or no userTenants. Setting currentTenantName to null.')
			setCurrentTenantName(null) // No tenants or not loaded
		}
	}, [currentTenantId, userTenants])

	const handleSwitchTenant = async (tenantId: string) => {
		if (tenantId === currentTenantId || isSwitching) {
			return
		}
		setIsSwitching(true)
		await switchTenant(tenantId)
		setIsSwitching(false)
		// Name will update via useEffect
	}

	if (!user || !userTenants || userTenants.length === 0) {
		console.log('[TenantSwitcher] Condition: !user || !userTenants || userTenants.length === 0. Values:', {user, userTenants, length: userTenants?.length})
		// Don't show switcher if no user, no tenants, or tenants list is empty
		// Or if only one tenant and it's already selected (AuthContext handles auto-switch for single tenant)
		if (userTenants && userTenants.length === 1 && currentTenantId === userTenants[0].tenant_id) {
			console.log('[TenantSwitcher] Rendering disabled button for single, active tenant.')
			return (
				<div className='ml-auto flex items-center space-x-4'>
					<Button variant='outline' disabled className='w-[200px] justify-between'>
						{userTenants[0].tenant_name}
					</Button>
				</div>
			)
		}
		console.log('[TenantSwitcher] Returning null (no user/tenants).')
		return null
	}

	// If there are multiple tenants, or one tenant that isn't yet the current context
	if (userTenants.length > 1 || (userTenants.length === 1 && currentTenantId !== userTenants[0].tenant_id)) {
		console.log('[TenantSwitcher] Rendering dropdown. userTenants.length:', userTenants.length, 'currentTenantId:', currentTenantId)
		return (
			<div className='ml-auto flex items-center space-x-4'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' role='combobox' aria-expanded={!!currentTenantId} aria-label='Select an organization' className='w-[200px] justify-between' disabled={isSwitching || authLoading}>
							{currentTenantName || 'Select Organization'}
							<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className='w-[200px] p-0'>
						<DropdownMenuLabel>Organizations</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{userTenants.map((tenant) => (
							<DropdownMenuItem key={tenant.tenant_id} onSelect={() => handleSwitchTenant(tenant.tenant_id)} disabled={isSwitching} className='text-sm'>
								{tenant.tenant_name}
								{currentTenantId === tenant.tenant_id && <Check className='ml-auto h-4 w-4' />}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		)
	}

	// Fallback for single tenant already selected (though above condition might catch it)
	if (currentTenantName) {
		console.log('[TenantSwitcher] Rendering fallback disabled button with currentTenantName:', currentTenantName)
		return (
			<div className='ml-auto flex items-center space-x-4'>
				<Button variant='outline' disabled className='w-[200px] justify-between'>
					{currentTenantName}
				</Button>
			</div>
		)
	}
	console.log('[TenantSwitcher] Returning null (default fallback).')
	return null // Default to rendering nothing if no appropriate state
}
