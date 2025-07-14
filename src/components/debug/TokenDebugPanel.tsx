'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {tokenManager} from '@/lib/token-storage'
import {decodeJwt} from '@/lib/jwt'
import {
	Code,
	Key,
	User,
	Building2,
	Globe,
	Shield,
	Clock,
	Eye,
	EyeOff,
	Copy,
	RefreshCw,
} from 'lucide-react'
import {toast} from 'sonner'

export function TokenDebugPanel() {
	const {
		user,
		currentMode,
		currentTenantId,
		globalContext,
		tenantContext,
		isAuthenticated,
	} = useAuth()
	
	const [showTokens, setShowTokens] = React.useState(false)
	const [globalTokens, setGlobalTokens] = React.useState<any>(null)
	const [tenantTokens, setTenantTokens] = React.useState<any>(null)

	// Load tokens
	React.useEffect(() => {
		const loadTokens = () => {
			try {
				const global = tokenManager.getTokens('global')
				const tenant = tokenManager.getTokens('tenant')
				
				setGlobalTokens({
					...global,
					decoded: global.accessToken ? decodeJwt(global.accessToken) : null
				})
				
				setTenantTokens({
					...tenant,
					decoded: tenant.accessToken ? decodeJwt(tenant.accessToken) : null
				})
			} catch (error) {
				console.error('Error loading tokens:', error)
			}
		}
		
		loadTokens()
		// Refresh every 5 seconds
		const interval = setInterval(loadTokens, 5000)
		return () => clearInterval(interval)
	}, [currentMode, currentTenantId])

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		toast.success('Copied to clipboard')
	}

	const formatExpiry = (exp?: number) => {
		if (!exp) return 'N/A'
		const date = new Date(exp * 1000)
		const now = new Date()
		const diffMs = date.getTime() - now.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		
		if (diffMins < 0) return 'Expired'
		if (diffMins < 60) return `${diffMins}m left`
		const diffHours = Math.floor(diffMins / 60)
		return `${diffHours}h ${diffMins % 60}m left`
	}

	const TokenCard = ({
		title,
		icon: Icon,
		tokens,
		isActive,
		color
	}: {
		title: string
		icon: React.ElementType
		tokens: any
		isActive: boolean
		color: string
	}) => (
		<Card className={isActive ? `ring-2 ring-${color}-500` : ''}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<Icon className={`h-4 w-4 ${color}`} />
					{title}
					{isActive && <Badge className="text-xs">Active</Badge>}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{tokens?.accessToken ? (
					<>
						{/* User Info */}
						{tokens.decoded && (
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">User ID:</span>
									<code className="text-xs bg-gray-100 px-1 rounded">
										{tokens.decoded.sub?.slice(0, 8)}...
									</code>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">Email:</span>
									<span className="text-xs">{tokens.decoded.email}</span>
								</div>
								{tokens.decoded.tenant_id && (
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">Tenant ID:</span>
										<code className="text-xs bg-gray-100 px-1 rounded">
											{tokens.decoded.tenant_id.slice(0, 8)}...
										</code>
									</div>
								)}
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">Roles:</span>
									<div className="flex gap-1">
										{tokens.decoded.roles?.map((role: string) => (
											<Badge key={role} variant="secondary" className="text-xs">
												{role}
											</Badge>
										))}
									</div>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="font-medium">Expires:</span>
									<span className="text-xs">
										{formatExpiry(tokens.decoded.exp)}
									</span>
								</div>
							</div>
						)}

						<Separator />

						{/* Token Actions */}
						<div className="space-y-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => setShowTokens(!showTokens)}
							>
								{showTokens ? (
									<EyeOff className="h-3 w-3 mr-2" />
								) : (
									<Eye className="h-3 w-3 mr-2" />
								)}
								{showTokens ? 'Hide' : 'Show'} Token
							</Button>

							{showTokens && (
								<div className="space-y-2">
									<div className="text-xs">
										<div className="font-medium mb-1">Access Token:</div>
										<code className="block bg-gray-100 p-2 rounded text-xs break-all">
											{tokens.accessToken}
										</code>
										<Button
											variant="ghost"
											size="sm"
											className="mt-1 h-6 px-2 text-xs"
											onClick={() => copyToClipboard(tokens.accessToken)}
										>
											<Copy className="h-3 w-3 mr-1" />
											Copy
										</Button>
									</div>
									
									{tokens.refreshToken && (
										<div className="text-xs">
											<div className="font-medium mb-1">Refresh Token:</div>
											<code className="block bg-gray-100 p-2 rounded text-xs break-all">
												{tokens.refreshToken}
											</code>
											<Button
												variant="ghost"
												size="sm"
												className="mt-1 h-6 px-2 text-xs"
												onClick={() => copyToClipboard(tokens.refreshToken)}
											>
												<Copy className="h-3 w-3 mr-1" />
												Copy
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<div className="text-center text-sm text-muted-foreground py-4">
						No tokens available
					</div>
				)}
			</CardContent>
		</Card>
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Code className="h-5 w-5" />
					Token Debug Panel
				</CardTitle>
				<CardDescription>
					Current authentication context and token information
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Current Context Status */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Shield className="h-4 w-4" />
							Current Mode
						</div>
						<Badge variant={currentMode === 'global' ? 'outline' : 'default'}>
							{currentMode}
						</Badge>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Building2 className="h-4 w-4" />
							Current Tenant
						</div>
						<Badge variant="secondary">
							{currentTenantId ? `${currentTenantId.slice(0, 8)}...` : 'None'}
						</Badge>
					</div>
				</div>

				<Separator />

				{/* Token Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<TokenCard
						title="Global Context"
						icon={Globe}
						tokens={globalTokens}
						isActive={currentMode === 'global'}
						color="text-blue-600"
					/>
					
					<TokenCard
						title="Tenant Context"
						icon={Building2}
						tokens={tenantTokens}
						isActive={currentMode === 'tenant'}
						color="text-green-600"
					/>
				</div>

				{/* Context States */}
				<div className="space-y-4">
					<div className="text-sm font-medium">Context States:</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
						<div>
							<div className="font-medium mb-2">Global Context:</div>
							<pre className="bg-gray-100 p-2 rounded overflow-auto">
								{JSON.stringify({
									user: globalContext.user ? {
										id: globalContext.user.id.slice(0, 8) + '...',
										email: globalContext.user.email,
										roles: globalContext.user.roles,
										tenant_id: globalContext.user.tenant_id
									} : null,
									isAuthenticated: globalContext.isAuthenticated,
									tenantId: globalContext.tenantId
								}, null, 2)}
							</pre>
						</div>
						
						<div>
							<div className="font-medium mb-2">Tenant Context:</div>
							<pre className="bg-gray-100 p-2 rounded overflow-auto">
								{JSON.stringify({
									user: tenantContext.user ? {
										id: tenantContext.user.id.slice(0, 8) + '...',
										email: tenantContext.user.email,
										roles: tenantContext.user.roles,
										tenant_id: tenantContext.user.tenant_id
									} : null,
									isAuthenticated: tenantContext.isAuthenticated,
									tenantId: tenantContext.tenantId
								}, null, 2)}
							</pre>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.location.reload()}
					>
						<RefreshCw className="h-3 w-3 mr-2" />
						Refresh Page
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							tokenManager.clearTokens('global')
							tokenManager.clearTokens('tenant')
							toast.success('All tokens cleared')
						}}
					>
						<Key className="h-3 w-3 mr-2" />
						Clear All Tokens
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
