'use client'

// Example: Enhanced Token Status Component using useLocalStorage
// Shows how to use @uidotdev/usehooks for reactive localStorage

import React from 'react'
import {useLocalStorage} from '@uidotdev/usehooks'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {debugTokenFlow} from '@/utils/debugTokenFlow'

interface TokenInfo {
	accessToken: string | null
	refreshToken: string | null
}

export const EnhancedTokenStatus: React.FC = () => {
	// Reactive localStorage hooks - automatically update when storage changes
	const [globalAccessToken] = useLocalStorage<string | null>('global_accessToken', null)
	const [globalRefreshToken] = useLocalStorage<string | null>('global_refreshToken', null)
	const [tenantAccessToken] = useLocalStorage<string | null>('tenant_accessToken', null)
	const [tenantRefreshToken] = useLocalStorage<string | null>('tenant_refreshToken', null)
	const [currentMode] = useLocalStorage<string>('auth_current_mode', 'global')

	// These values automatically update when localStorage changes (even from other tabs!)
	const globalTokens: TokenInfo = {
		accessToken: globalAccessToken,
		refreshToken: globalRefreshToken,
	}

	const tenantTokens: TokenInfo = {
		accessToken: tenantAccessToken,
		refreshToken: tenantRefreshToken,
	}

	const formatToken = (token: string | null) => {
		if (!token) return 'None'
		return `${token.substring(0, 20)}...`
	}

	const getTokenStatus = (token: string | null) => {
		if (!token) return {text: 'No Token', variant: 'destructive' as const}

		try {
			const payload = JSON.parse(atob(token.split('.')[1]))
			const exp = payload.exp * 1000
			const now = Date.now()

			if (exp < now) {
				return {text: 'Expired', variant: 'destructive' as const}
			} else if (exp - now < 5 * 60 * 1000) {
				// 5 minutes
				return {text: 'Expiring Soon', variant: 'secondary' as const}
			} else {
				return {text: 'Valid', variant: 'default' as const}
			}
		} catch {
			return {text: 'Invalid', variant: 'destructive' as const}
		}
	}

	return (
		<div className='space-y-4'>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center justify-between'>
						Enhanced Token Status
						<Badge variant={currentMode === 'global' ? 'default' : 'secondary'}>{currentMode}</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Global Tokens */}
					<div>
						<h4 className='font-medium mb-2'>Global Context</h4>
						<div className='space-y-2 text-sm'>
							<div className='flex justify-between items-center'>
								<span>Access Token:</span>
								<div className='flex items-center gap-2'>
									<code className='text-xs'>{formatToken(globalTokens.accessToken)}</code>
									<Badge {...getTokenStatus(globalTokens.accessToken)} />
								</div>
							</div>
							<div className='flex justify-between items-center'>
								<span>Refresh Token:</span>
								<code className='text-xs'>{formatToken(globalTokens.refreshToken)}</code>
							</div>
						</div>
					</div>

					{/* Tenant Tokens */}
					<div>
						<h4 className='font-medium mb-2'>Tenant Context</h4>
						<div className='space-y-2 text-sm'>
							<div className='flex justify-between items-center'>
								<span>Access Token:</span>
								<div className='flex items-center gap-2'>
									<code className='text-xs'>{formatToken(tenantTokens.accessToken)}</code>
									<Badge {...getTokenStatus(tenantTokens.accessToken)} />
								</div>
							</div>
							<div className='flex justify-between items-center'>
								<span>Refresh Token:</span>
								<code className='text-xs'>{formatToken(tenantTokens.refreshToken)}</code>
							</div>
						</div>
					</div>

					{/* Token Issue Detection */}
					{currentMode === 'tenant' && tenantTokens.accessToken === globalTokens.accessToken && (
						<div className='p-3 bg-red-50 border border-red-200 rounded-md'>
							<p className='text-red-800 text-sm'>
								⚠️ <strong>Issue Detected:</strong> Tenant context is using the same token as global context!
							</p>
						</div>
					)}

					{/* Debug Actions */}
					<div className='flex gap-2 pt-2'>
						<Button size='sm' variant='outline' onClick={debugTokenFlow}>
							Debug Token Flow
						</Button>
						<Button size='sm' variant='outline' onClick={() => console.log('Token status checked')}>
							Check Issues
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Live Update Demo */}
			<Card>
				<CardHeader>
					<CardTitle>Live Update Demo</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-sm text-muted-foreground mb-2'>This component automatically updates when tokens change in localStorage. Try logging in/out or switching contexts in another tab!</p>
					<div className='text-xs font-mono bg-muted p-2 rounded'>Last render: {new Date().toLocaleTimeString()}</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default EnhancedTokenStatus
