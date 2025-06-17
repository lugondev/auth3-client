'use client'

import {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
import {Users, MessageCircle, MoreVertical, Check, X, Trash2, Copy, Eye, EyeOff, UserCheck, UserX} from 'lucide-react'
import {DIDCommConnection, ConnectionState} from '@/types/didcomm'
import {didcommService} from '@/services/didcommService'
import {toast} from 'sonner'
import {formatDistanceToNow} from 'date-fns'
import {vi} from 'date-fns/locale'
import {cn} from '@/lib/utils'

interface ConnectionCardProps {
	/** Connection data to display */
	connection: DIDCommConnection
	/** Current user's DID */
	myDid: string
	/** Whether to show action buttons */
	showActions?: boolean
	/** Whether to show detailed information */
	showDetails?: boolean
	/** Callback when connection is updated */
	onConnectionUpdate?: (connection: DIDCommConnection) => void
	/** Callback when connection is deleted */
	onConnectionDelete?: (connectionId: string) => void
	/** Callback when message button is clicked */
	onMessageClick?: (connection: DIDCommConnection) => void
	/** Custom CSS classes */
	className?: string
}

/**
 * ConnectionCard Component
 * Displays DIDComm connection information with action buttons
 */
export function ConnectionCard({connection, showActions = true, showDetails = true, onConnectionUpdate, onConnectionDelete, onMessageClick, className}: ConnectionCardProps) {
	const [loading, setLoading] = useState(false)
	const [showFullDid, setShowFullDid] = useState(false)

	// Accept connection invitation
	const acceptConnection = async () => {
		try {
			setLoading(true)
			await didcommService.acceptConnectionInvitation(connection.id)

			const updatedConnection = {
				...connection,
				state: 'active' as ConnectionState,
				updated_at: new Date().toISOString(),
			}

			onConnectionUpdate?.(updatedConnection)
			toast.success('Connection accepted')
		} catch (error) {
			console.error('Error accepting connection:', error)
			toast.error('Unable to accept connection')
		} finally {
			setLoading(false)
		}
	}

	// Reject connection invitation
	const rejectConnection = async () => {
		try {
			setLoading(true)
			await didcommService.rejectConnectionInvitation(connection.id)

			const updatedConnection = {
				...connection,
				state: 'abandoned' as ConnectionState,
				updated_at: new Date().toISOString(),
			}

			onConnectionUpdate?.(updatedConnection)
			toast.success('Connection rejected')
		} catch (error) {
			console.error('Error rejecting connection:', error)
			toast.error('Unable to reject connection')
		} finally {
			setLoading(false)
		}
	}

	// Delete connection
	const deleteConnection = async () => {
		try {
			setLoading(true)
			await didcommService.deleteConnection(connection.id)
			onConnectionDelete?.(connection.id)
			toast.success('Connection deleted')
		} catch (error) {
			console.error('Error deleting connection:', error)
			toast.error('Unable to delete connection')
		} finally {
			setLoading(false)
		}
	}

	// Copy DID to clipboard
	const copyDid = async (did: string) => {
		try {
			await navigator.clipboard.writeText(did)
			toast.success('Copied DID')
		} catch (error) {
			console.log('Error copying DID:', error)
			toast.error('Error copying DID')
		}
	}

	// Get connection state display
	const getStateDisplay = (state: ConnectionState) => {
		const stateMap: Record<
			ConnectionState,
			{
				label: string
				variant: 'default' | 'secondary' | 'destructive' | 'outline'
				icon?: React.ReactNode
			}
		> = {
			'invitation-sent': {
				label: 'Invitation Sent',
				variant: 'outline',
				icon: <UserCheck className='h-3 w-3' />,
			},
			'invitation-received': {
				label: 'Invitation Received',
				variant: 'secondary',
				icon: <UserCheck className='h-3 w-3' />,
			},
			'request-sent': {
				label: 'Request Sent',
				variant: 'outline',
				icon: <UserCheck className='h-3 w-3' />,
			},
			'request-received': {
				label: 'Request Received',
				variant: 'secondary',
				icon: <UserCheck className='h-3 w-3' />,
			},
			'response-sent': {
				label: 'Responded',
				variant: 'outline',
				icon: <UserCheck className='h-3 w-3' />,
			},
			'response-received': {
				label: 'Response Received',
				variant: 'secondary',
				icon: <UserCheck className='h-3 w-3' />,
			},
			'active': {
				label: 'Active',
				variant: 'default',
				icon: <Users className='h-3 w-3' />,
			},
			'error': {
				label: 'Error',
				variant: 'destructive',
				icon: <UserX className='h-3 w-3' />,
			},
			'abandoned': {
				label: 'Cancelled',
				variant: 'destructive',
				icon: <UserX className='h-3 w-3' />,
			},
		}
		return stateMap[state] || {label: state, variant: 'outline' as const}
	}

	// Check if connection needs action
	const needsAction = connection.state === 'invitation-received' || connection.state === 'request-received'
	const isActive = connection.state === 'active'
	const stateDisplay = getStateDisplay(connection.state)

	// Format DID for display
	const formatDid = (did: string, showFull: boolean = false) => {
		if (showFull || did.length <= 60) {
			return did
		}
		return `${did.substring(0, 30)}...${did.substring(did.length - 30)}`
	}

	return (
		<Card className={cn('transition-all hover:shadow-md', className)}>
			<CardHeader className='pb-3'>
				<div className='flex items-start justify-between'>
					<div className='flex items-center gap-3'>
						<Avatar className='h-10 w-10'>
							<AvatarFallback className='bg-primary/10 text-primary'>{(connection.their_label || connection.their_did).substring(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>

						<div className='flex-1 min-w-0'>
							<CardTitle className='text-lg truncate'>{connection.their_label || 'No label'}</CardTitle>
							<div className='flex items-center gap-2 mt-1'>
								<Badge variant={stateDisplay.variant} className='flex items-center gap-1'>
									{stateDisplay.icon}
									{stateDisplay.label}
								</Badge>
								{needsAction && (
									<Badge variant='outline' className='text-orange-600 border-orange-600'>
										Needs Action
									</Badge>
								)}
							</div>
						</div>
					</div>

					{showActions && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='sm'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								{isActive && (
									<div>
										<DropdownMenuItem onClick={() => onMessageClick?.(connection)}>
											<MessageCircle className='h-4 w-4 mr-2' />
											Send Message
										</DropdownMenuItem>
										<DropdownMenuSeparator />
									</div>
								)}

								<DropdownMenuItem onClick={() => copyDid(connection.their_did)}>
									<Copy className='h-4 w-4 mr-2' />
									Copy DID
								</DropdownMenuItem>

								<DropdownMenuItem onClick={() => setShowFullDid(!showFullDid)}>
									{showFullDid ? (
										<div>
											<EyeOff className='h-4 w-4 mr-2' />
											Hide Full DID
										</div>
									) : (
										<div>
											<Eye className='h-4 w-4 mr-2' />
											Show Full DID
										</div>
									)}
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<Trash2 className='h-4 w-4 mr-2' />
											Delete Connection
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete Connection</AlertDialogTitle>
											<AlertDialogDescription>Are you sure you want to delete the connection with "{connection.their_label || 'No label'}"? This action cannot be undone.</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction onClick={deleteConnection} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
												Delete
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>

			{showDetails && (
				<CardContent className='space-y-3'>
					{/* DID Information */}
					<div className='space-y-2'>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>Their DID:</p>
							<p className='text-sm font-mono bg-muted p-2 rounded break-all'>{formatDid(connection.their_did, showFullDid)}</p>
						</div>

						<div>
							<p className='text-sm font-medium text-muted-foreground'>My DID:</p>
							<p className='text-sm font-mono bg-muted p-2 rounded break-all'>{formatDid(connection.my_did, showFullDid)}</p>
						</div>

						{connection.my_label && (
							<div>
								<p className='text-sm font-medium text-muted-foreground'>My Label:</p>
								<p className='text-sm'>{connection.my_label}</p>
							</div>
						)}
					</div>

					{/* Timestamps */}
					<div className='flex justify-between text-xs text-muted-foreground'>
						<span>
							Created:{' '}
							{formatDistanceToNow(new Date(connection.created_at), {
								addSuffix: true,
								locale: vi,
							})}
						</span>
						{connection.updated_at && connection.updated_at !== connection.created_at && (
							<span>
								Updated:{' '}
								{formatDistanceToNow(new Date(connection.updated_at), {
									addSuffix: true,
									locale: vi,
								})}
							</span>
						)}
					</div>

					{/* Action Buttons */}
					{showActions && needsAction && (
						<div className='flex gap-2 pt-2'>
							<Button onClick={acceptConnection} disabled={loading} size='sm' className='flex-1'>
								{loading ? <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' /> : <Check className='h-4 w-4 mr-2' />}
								Accept
							</Button>

							<Button onClick={rejectConnection} disabled={loading} variant='outline' size='sm' className='flex-1'>
								<X className='h-4 w-4 mr-2' />
								Reject
							</Button>
						</div>
					)}

					{showActions && isActive && (
						<div className='pt-2'>
							<Button onClick={() => onMessageClick?.(connection)} variant='outline' size='sm' className='w-full'>
								<MessageCircle className='h-4 w-4 mr-2' />
								Send Message
							</Button>
						</div>
					)}
				</CardContent>
			)}
		</Card>
	)
}
