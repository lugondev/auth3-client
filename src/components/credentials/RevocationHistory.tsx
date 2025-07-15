'use client'

import {useState, useEffect} from 'react'
import {History, Clock, User, FileText, AlertTriangle, Shield} from 'lucide-react'
import {useQuery} from '@tanstack/react-query'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Skeleton} from '@/components/ui/skeleton'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ScrollArea} from '@/components/ui/scroll-area'

import {getCredentialStatus} from '@/services/vcService'
import {CredentialStatus} from '@/types/credentials'

interface RevocationHistoryProps {
	credentialId: string
	className?: string
}

interface RevocationEvent {
	id: string
	timestamp: string
	action: 'issued' | 'revoked' | 'suspended' | 'reinstated'
	reason?: string
	notes?: string
	actor?: string
	status: CredentialStatus
}

// Mock revocation history data (replace with actual API call)
const mockRevocationHistory = (): RevocationEvent[] => [
	{
		id: '1',
		timestamp: new Date().toISOString(),
		action: 'issued',
		status: CredentialStatus.ACTIVE,
		actor: 'System',
		notes: 'Credential initially issued'
	},
	// Add more mock events as needed
]

/**
 * RevocationHistory Component - Displays the revocation history of a credential
 *
 * Features:
 * - Timeline of credential status changes
 * - Revocation reasons and notes
 * - Actor information
 * - Status badges
 * - Real-time updates
 */
export function RevocationHistory({credentialId, className = ''}: RevocationHistoryProps) {
	const [revocationEvents, setRevocationEvents] = useState<RevocationEvent[]>([])

	// Fetch current credential status
	const {
		data: currentStatus,
		isLoading: statusLoading,
		error: statusError
	} = useQuery({
		queryKey: ['credential-status', credentialId],
		queryFn: () => getCredentialStatus(credentialId),
		staleTime: 30000,
	})

	// Mock fetch revocation history (replace with actual API call)
	useEffect(() => {
		const fetchRevocationHistory = async () => {
			try {
				// Replace this with actual API call
				const history = mockRevocationHistory()
				setRevocationEvents(history)
			} catch (error) {
				console.error('Error fetching revocation history:', error)
			}
		}

		if (credentialId) {
			fetchRevocationHistory()
		}
	}, [credentialId])

	// Get action icon
	const getActionIcon = (action: string) => {
		switch (action) {
			case 'issued':
				return <Shield className="h-4 w-4 text-green-600" />
			case 'revoked':
				return <AlertTriangle className="h-4 w-4 text-red-600" />
			case 'suspended':
				return <Clock className="h-4 w-4 text-yellow-600" />
			case 'reinstated':
				return <Shield className="h-4 w-4 text-blue-600" />
			default:
				return <FileText className="h-4 w-4 text-gray-600" />
		}
	}

	// Get action badge color
	const getActionBadge = (action: string) => {
		switch (action) {
			case 'issued':
				return <Badge variant="default" className="bg-green-100 text-green-800">Issued</Badge>
			case 'revoked':
				return <Badge variant="destructive">Revoked</Badge>
			case 'suspended':
				return <Badge variant="outline" className="border-yellow-200 text-yellow-800">Suspended</Badge>
			case 'reinstated':
				return <Badge variant="outline" className="border-blue-200 text-blue-800">Reinstated</Badge>
			default:
				return <Badge variant="outline">{action}</Badge>
		}
	}

	// Format timestamp
	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp)
		return {
			date: date.toLocaleDateString(),
			time: date.toLocaleTimeString()
		}
	}

	if (statusLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Revocation History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex items-start gap-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (statusError) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Revocation History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							Failed to load revocation history. Please try again.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<History className="h-5 w-5" />
					Revocation History
				</CardTitle>
				<CardDescription>
					Timeline of status changes and revocation events for this credential
				</CardDescription>
			</CardHeader>
			<CardContent>
				{revocationEvents.length === 0 ? (
					<div className="text-center py-8">
						<History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No History Available</h3>
						<p className="text-muted-foreground">
							No revocation events have been recorded for this credential yet.
						</p>
					</div>
				) : (
					<ScrollArea className="max-h-96">
						<div className="space-y-4">
							{revocationEvents.map((event, index) => {
								const {date, time} = formatTimestamp(event.timestamp)
								
								return (
									<div key={event.id} className="relative">
										{/* Timeline line */}
										{index < revocationEvents.length - 1 && (
											<div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
										)}
										
										<div className="flex items-start gap-3">
											{/* Timeline icon */}
											<div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
												{getActionIcon(event.action)}
											</div>
											
											{/* Event content */}
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														{getActionBadge(event.action)}
														<span className="text-sm text-muted-foreground">
															{date} at {time}
														</span>
													</div>
												</div>
												
												{/* Event details */}
												<div className="space-y-1">
													{event.reason && (
														<div className="text-sm">
															<span className="font-medium">Reason:</span> {event.reason}
														</div>
													)}
													
													{event.notes && (
														<div className="text-sm text-muted-foreground">
															<span className="font-medium">Notes:</span> {event.notes}
														</div>
													)}
													
													{event.actor && (
														<div className="flex items-center gap-1 text-xs text-muted-foreground">
															<User className="h-3 w-3" />
															<span>by {event.actor}</span>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</ScrollArea>
				)}
				
				{/* Current Status */}
				{currentStatus && (
					<div className="mt-6 pt-4 border-t">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Current Status:</span>
							<Badge 
								variant={
									currentStatus.revoked ? 'destructive' : 'default'
								}
							>
								{currentStatus.revoked ? 'Revoked' : 'Active'}
							</Badge>
						</div>
						{currentStatus.revoked && currentStatus.revokedAt && (
							<div className="mt-2 text-xs text-muted-foreground">
								Revoked on: {new Date(currentStatus.revokedAt).toLocaleDateString()}
							</div>
						)}
						{currentStatus.reason && (
							<div className="mt-1 text-xs text-muted-foreground">
								Reason: {currentStatus.reason}
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
