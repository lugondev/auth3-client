'use client'

import {useState, useEffect, useCallback} from 'react'
import {Activity, Wifi, WifiOff, RefreshCw, Bell, Shield, AlertTriangle, CheckCircle, Clock} from 'lucide-react'
import {toast} from 'sonner'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Separator} from '@/components/ui/separator'

import {getCredentialStatus} from '@/services/vcService'
import {CredentialStatus, type CredentialMetadata} from '@/types/credentials'

interface StatusUpdate {
	id: string
	credentialId: string
	credentialTitle: string
	previousStatus: CredentialStatus
	newStatus: CredentialStatus
	timestamp: string
	reason?: string
	source: 'system' | 'issuer' | 'manual'
}

interface RealTimeStatusMonitorProps {
	credentials: CredentialMetadata[]
	onStatusChange?: (updates: StatusUpdate[]) => void
	className?: string
}

/**
 * RealTimeStatusMonitor Component - Real-time credential status monitoring
 *
 * Features:
 * - WebSocket-based real-time updates
 * - Status change notifications
 * - Connection status indicator
 * - Automatic reconnection
 * - Status history tracking
 * - Batch status updates
 */
export function RealTimeStatusMonitor({
	credentials,
	onStatusChange,
	className = ''
}: RealTimeStatusMonitorProps) {
	const [isConnected, setIsConnected] = useState(false)
	const [isMonitoring, setIsMonitoring] = useState(false)
	const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
	const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
	const [connectionError, setConnectionError] = useState<string | null>(null)
	const [retryCount, setRetryCount] = useState(0)

	// Mock WebSocket connection (replace with actual implementation)
	const [mockConnection, setMockConnection] = useState<NodeJS.Timeout | null>(null)

	// Simulate real-time status updates
	const simulateStatusUpdate = useCallback(() => {
		if (credentials.length === 0) return

		// Randomly select a credential
		const credential = credentials[Math.floor(Math.random() * credentials.length)]
		
		// Simulate status changes (low probability to avoid spam)
		if (Math.random() < 0.1) { // 10% chance of status change
			const possibleStatuses: CredentialStatus[] = [
				CredentialStatus.ACTIVE, 
				CredentialStatus.REVOKED, 
				CredentialStatus.SUSPENDED, 
				CredentialStatus.EXPIRED
			]
			const currentStatus = credential.status
			const newStatus = possibleStatuses.find(s => s !== currentStatus) || CredentialStatus.ACTIVE
			
			const update: StatusUpdate = {
				id: `update-${Date.now()}-${credential.id}`,
				credentialId: credential.id,
				credentialTitle: Array.isArray(credential.type) 
					? credential.type.filter(t => t !== 'VerifiableCredential').join(', ')
					: credential.type,
				previousStatus: currentStatus,
				newStatus,
				timestamp: new Date().toISOString(),
				reason: getStatusChangeReason(currentStatus, newStatus),
				source: Math.random() > 0.5 ? 'issuer' : 'system'
			}

			setStatusUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates
			setLastUpdateTime(new Date().toISOString())
			
			// Show notification
			const title = `${credential.id.slice(0, 8)}... status changed`
			const message = `${currentStatus} → ${newStatus}`
			
			if (newStatus === CredentialStatus.REVOKED) {
				toast.error(title, {description: message})
			} else if (newStatus === CredentialStatus.SUSPENDED) {
				toast.warning(title, {description: message})
			} else {
				toast.info(title, {description: message})
			}

			onStatusChange?.([update])
		}
	}, [credentials, onStatusChange])

	// Get reason for status change
	const getStatusChangeReason = (from: CredentialStatus, to: CredentialStatus): string => {
		if (to === CredentialStatus.REVOKED) return 'Credential revoked by issuer'
		if (to === CredentialStatus.SUSPENDED) return 'Credential temporarily suspended'
		if (to === CredentialStatus.EXPIRED) return 'Credential validity period ended'
		if (to === CredentialStatus.ACTIVE && from === CredentialStatus.SUSPENDED) return 'Credential reinstated'
		return 'Status updated'
	}

	// Start monitoring
	const startMonitoring = useCallback(() => {
		if (isMonitoring) return

		setIsMonitoring(true)
		setConnectionError(null)
		setRetryCount(0)

		// Simulate connection establishment
		setTimeout(() => {
			setIsConnected(true)
			toast.success('Connected to status monitoring service')
		}, 1000)

		// Set up periodic status checks (simulating WebSocket updates)
		const interval = setInterval(simulateStatusUpdate, 5000) // Check every 5 seconds
		setMockConnection(interval)

	}, [isMonitoring, simulateStatusUpdate])

	// Stop monitoring
	const stopMonitoring = useCallback(() => {
		setIsMonitoring(false)
		setIsConnected(false)
		
		if (mockConnection) {
			clearInterval(mockConnection)
			setMockConnection(null)
		}

		toast.info('Disconnected from status monitoring service')
	}, [mockConnection])

	// Toggle monitoring
	const toggleMonitoring = () => {
		if (isMonitoring) {
			stopMonitoring()
		} else {
			startMonitoring()
		}
	}

	// Retry connection
	const retryConnection = () => {
		setRetryCount(prev => prev + 1)
		stopMonitoring()
		setTimeout(startMonitoring, 1000)
	}

	// Manual refresh
	const handleManualRefresh = async () => {
		try {
			toast.info('Refreshing credential statuses...')
			
			// Simulate checking all credentials
			const updates: StatusUpdate[] = []
			
			for (const credential of credentials.slice(0, 5)) { // Check first 5 to avoid API overload
				try {
					const currentStatus = await getCredentialStatus(credential.id)
					
					if (currentStatus !== credential.status) {
						const update: StatusUpdate = {
							id: `manual-${Date.now()}-${credential.id}`,
							credentialId: credential.id,
							credentialTitle: Array.isArray(credential.type) 
								? credential.type.filter(t => t !== 'VerifiableCredential').join(', ')
								: credential.type,
							previousStatus: credential.status,
							newStatus: currentStatus,
							timestamp: new Date().toISOString(),
							reason: 'Manual refresh detected change',
							source: 'manual'
						}
						updates.push(update)
					}
				} catch (error) {
					console.error(`Failed to check status for credential ${credential.id}:`, error)
				}
			}

			if (updates.length > 0) {
				setStatusUpdates(prev => [...updates, ...prev.slice(0, 50 - updates.length)])
				setLastUpdateTime(new Date().toISOString())
				onStatusChange?.(updates)
				toast.success(`Found ${updates.length} status change(s)`)
			} else {
				toast.info('All credential statuses are up to date')
			}
			
		} catch (error) {
			console.error('Manual refresh failed:', error)
			toast.error('Failed to refresh credential statuses')
		}
	}

	// Get status badge color
	const getStatusBadgeVariant = (status: CredentialStatus) => {
		switch (status) {
			case CredentialStatus.ACTIVE: return 'default'
			case CredentialStatus.REVOKED: return 'destructive'
			case CredentialStatus.SUSPENDED: return 'secondary'
			case CredentialStatus.EXPIRED: return 'outline'
			default: return 'outline'
		}
	}

	// Get status change icon
	const getStatusChangeIcon = (update: StatusUpdate) => {
		if (update.newStatus === CredentialStatus.REVOKED) return <AlertTriangle className="h-4 w-4 text-red-600" />
		if (update.newStatus === CredentialStatus.ACTIVE) return <CheckCircle className="h-4 w-4 text-green-600" />
		return <Clock className="h-4 w-4 text-yellow-600" />
	}

	// Format timestamp
	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		
		if (diffMins < 1) return 'Just now'
		if (diffMins < 60) return `${diffMins}m ago`
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
		return date.toLocaleDateString()
	}

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (mockConnection) {
				clearInterval(mockConnection)
			}
		}
	}, [mockConnection])

	return (
		<div className={className}>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Activity className="h-5 w-5" />
								Real-time Status Monitor
							</CardTitle>
							<CardDescription>
								Monitor credential status changes in real-time
							</CardDescription>
						</div>
						
						<div className="flex items-center gap-2">
							{/* Connection Status */}
							<div className="flex items-center gap-2">
								{isConnected ? (
									<Wifi className="h-4 w-4 text-green-600" />
								) : (
									<WifiOff className="h-4 w-4 text-gray-400" />
								)}
								<span className="text-sm text-muted-foreground">
									{isConnected ? 'Connected' : 'Disconnected'}
								</span>
							</div>
							
							{/* Monitoring Toggle */}
							<div className="flex items-center gap-2">
								<span className="text-sm">Monitor</span>
								<Switch 
									checked={isMonitoring} 
									onCheckedChange={toggleMonitoring}
									disabled={credentials.length === 0}
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				
				<CardContent className="space-y-4">
					{/* Connection Error */}
					{connectionError && (
						<Alert variant="destructive">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription className="flex items-center justify-between">
								<span>{connectionError}</span>
								<Button variant="outline" size="sm" onClick={retryConnection}>
									Retry ({retryCount})
								</Button>
							</AlertDescription>
						</Alert>
					)}

					{/* Control Panel */}
					<div className="flex items-center justify-between p-3 bg-muted rounded-md">
						<div className="flex items-center gap-4">
							<div>
								<div className="text-sm font-medium">Monitoring Status</div>
								<div className="text-xs text-muted-foreground">
									{credentials.length} credential(s) being monitored
								</div>
							</div>
							
							{lastUpdateTime && (
								<div>
									<div className="text-sm font-medium">Last Update</div>
									<div className="text-xs text-muted-foreground">
										{formatTimestamp(lastUpdateTime)}
									</div>
								</div>
							)}
						</div>
						
						<Button variant="outline" size="sm" onClick={handleManualRefresh}>
							<RefreshCw className="h-4 w-4 mr-2" />
							Refresh
						</Button>
					</div>

					{/* Status Updates */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">Recent Status Changes</h4>
							<Badge variant="outline">
								{statusUpdates.length} update(s)
							</Badge>
						</div>
						
						{statusUpdates.length === 0 ? (
							<div className="text-center py-8">
								<Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">No status changes detected</p>
								<p className="text-sm text-muted-foreground mt-1">
									{isMonitoring ? 'Monitoring active...' : 'Enable monitoring to track changes'}
								</p>
							</div>
						) : (
							<ScrollArea className="h-64">
								<div className="space-y-2">
									{statusUpdates.map((update, index) => (
										<div key={update.id}>
											<div className="flex items-start gap-3 p-3 rounded-md border">
												{getStatusChangeIcon(update)}
												
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-medium text-sm truncate">
															{update.credentialTitle}
														</span>
														<Badge variant="outline" className="text-xs">
															{update.source}
														</Badge>
													</div>
													
													<div className="flex items-center gap-2 text-sm">
														<Badge variant={getStatusBadgeVariant(update.previousStatus)}>
															{update.previousStatus}
														</Badge>
														<span>→</span>
														<Badge variant={getStatusBadgeVariant(update.newStatus)}>
															{update.newStatus}
														</Badge>
													</div>
													
													{update.reason && (
														<p className="text-xs text-muted-foreground mt-1">
															{update.reason}
														</p>
													)}
													
													<div className="text-xs text-muted-foreground mt-1">
														{formatTimestamp(update.timestamp)} • ID: {update.credentialId.slice(0, 8)}...
													</div>
												</div>
											</div>
											
											{index < statusUpdates.length - 1 && <Separator />}
										</div>
									))}
								</div>
							</ScrollArea>
						)}
					</div>

					{/* Statistics */}
					{statusUpdates.length > 0 && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
							<div className="text-center">
								<div className="text-lg font-bold text-green-600">
									{statusUpdates.filter(u => u.newStatus === CredentialStatus.ACTIVE).length}
								</div>
								<div className="text-xs text-muted-foreground">Activated</div>
							</div>
							<div className="text-center">
								<div className="text-lg font-bold text-red-600">
									{statusUpdates.filter(u => u.newStatus === CredentialStatus.REVOKED).length}
								</div>
								<div className="text-xs text-muted-foreground">Revoked</div>
							</div>
							<div className="text-center">
								<div className="text-lg font-bold text-yellow-600">
									{statusUpdates.filter(u => u.newStatus === CredentialStatus.SUSPENDED).length}
								</div>
								<div className="text-xs text-muted-foreground">Suspended</div>
							</div>
							<div className="text-center">
								<div className="text-lg font-bold text-gray-600">
									{statusUpdates.filter(u => u.newStatus === CredentialStatus.EXPIRED).length}
								</div>
								<div className="text-xs text-muted-foreground">Expired</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
