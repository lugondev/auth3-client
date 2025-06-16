'use client'

import {useState, useEffect, useCallback} from 'react'
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
import {Users, UserPlus, Search, Check, X, MessageCircle, Trash2} from 'lucide-react'
import {didcommService} from '@/services/didcommService'
import {DIDCommConnection, ConnectionListResponse, ConnectionState} from '@/types/didcomm'
import {toast} from 'sonner'
import {formatDistanceToNow} from 'date-fns'
import {enUS} from 'date-fns/locale'

/**
 * Connections Page
 * Displays active connections list, connection requests, and connection management
 */
export default function ConnectionsPage() {
	const router = useRouter()
	const [connections, setConnections] = useState<DIDCommConnection[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeTab, setActiveTab] = useState('active')
	const [stateFilter, setStateFilter] = useState<ConnectionState | ''>('')
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		has_more: false,
	})

	// Load connections based on filters
	/**
	 * Load connections with callback pattern
	 * @param page - Page number to load
	 * @param onSuccess - Callback function called on successful load
	 * @param onError - Callback function called on error
	 */
	const loadConnections = useCallback((page = 1, onSuccess?: () => void, onError?: (error: Error) => void) => {
		setLoading(true)
		
		const params: {
			page: number
			limit: number
			state?: string
			search?: string
		} = {
			page,
			limit: pagination.limit,
		}

		// Add state filter based on active tab
		if (activeTab === 'active') {
			params.state = 'active'
		} else if (activeTab === 'pending') {
			params.state = 'invitation-received,request-received'
		} else if (activeTab === 'sent') {
			params.state = 'invitation-sent,request-sent'
		}

		// Add additional state filter if selected
		if (stateFilter) {
			params.state = stateFilter
		}

		didcommService.getConnections(params)
			.then((response: ConnectionListResponse) => {
				if (page === 1) {
					setConnections(response.connections)
				} else {
					setConnections((prev) => [...prev, ...response.connections])
				}

				setPagination({
					page: response.page,
					limit: response.page_size,
					total: response.total,
					has_more: response.has_next,
				})
				
				if (onSuccess) {
					onSuccess()
				}
			})
			.catch((error) => {
				console.error('Error loading connections:', error)
				toast.error('Failed to load connections list')
				
				if (onError) {
					onError(error)
				}
			})
			.finally(() => {
				setLoading(false)
			})
	}, [activeTab, stateFilter, pagination.limit])

	// Accept connection invitation
	const acceptConnection = async (connectionId: string) => {
		try {
			await didcommService.acceptConnectionInvitation(connectionId)
			toast.success('Connection invitation accepted')
			loadConnections(1)
		} catch (error) {
			console.error('Error accepting connection:', error)
			toast.error('Failed to accept connection')
		}
	}

	// Reject connection invitation
	const rejectConnection = async (connectionId: string) => {
		try {
			await didcommService.rejectConnectionInvitation(connectionId)
			toast.success('Connection invitation rejected')
			loadConnections(1)
		} catch (error) {
			console.error('Error rejecting connection:', error)
			toast.error('Failed to reject connection')
		}
	}

	// Delete connection
	const deleteConnection = async (connectionId: string) => {
		try {
			await didcommService.deleteConnection(connectionId)
			toast.success('Connection deleted')
			loadConnections(1)
		} catch (error) {
			console.error('Error deleting connection:', error)
			toast.error('Failed to delete connection')
		}
	}

	// Get connection state display
	const getStateDisplay = (state: ConnectionState) => {
		const stateMap: Record<ConnectionState, {label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'}> = {
			'invitation-sent': {label: 'Invitation Sent', variant: 'outline'},
			'invitation-received': {label: 'Invitation Received', variant: 'secondary'},
			'request-sent': {label: 'Request Sent', variant: 'outline'},
			'request-received': {label: 'Request Received', variant: 'secondary'},
			'response-sent': {label: 'Response Sent', variant: 'outline'},
			'response-received': {label: 'Response Received', variant: 'secondary'},
			'active': {label: 'Active', variant: 'default'},
			'error': {label: 'Error', variant: 'destructive'},
			'abandoned': {label: 'Abandoned', variant: 'destructive'},
		}
		return stateMap[state] || {label: state, variant: 'outline' as const}
	}

	// Filter connections by search query
	const filteredConnections = connections.filter((connection) => {
		if (!searchQuery) return true
		const query = searchQuery.toLowerCase()
		return connection.their_did.toLowerCase().includes(query) || connection.their_label?.toLowerCase().includes(query) || connection.my_label?.toLowerCase().includes(query)
	})

	useEffect(() => {
		loadConnections(1)
	}, [activeTab, stateFilter, loadConnections])

	return (
		<div className='container mx-auto p-6 space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold'>DIDComm Connections</h1>
					<p className='text-muted-foreground'>Manage DIDComm connections and invitations</p>
				</div>
				<Button onClick={() => router.push('/dashboard/connections/create')}>
					<UserPlus className='h-4 w-4 mr-2' />
					Create Connection
				</Button>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className='p-4'>
					<div className='flex gap-4 items-center'>
						<div className='flex-1 flex gap-2'>
							<Input placeholder='Search connections...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
							<Button variant='outline'>
								<Search className='h-4 w-4' />
							</Button>
						</div>

						<Select value={stateFilter} onValueChange={(value) => setStateFilter(value as ConnectionState | '')}>
							<SelectTrigger className='w-48'>
								<SelectValue placeholder='Status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value=''>All Status</SelectItem>
								<SelectItem value='active'>Active</SelectItem>
								<SelectItem value='invitation-received'>Invitation Received</SelectItem>
								<SelectItem value='request-received'>Request Received</SelectItem>
								<SelectItem value='invitation-sent'>Invitation Sent</SelectItem>
								<SelectItem value='request-sent'>Request Sent</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Connections Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='active' className='flex items-center gap-2'>
						<Users className='h-4 w-4' />
						Active
					</TabsTrigger>
					<TabsTrigger value='pending' className='flex items-center gap-2'>
						<UserPlus className='h-4 w-4' />
						Pending
					</TabsTrigger>
					<TabsTrigger value='sent' className='flex items-center gap-2'>
						<MessageCircle className='h-4 w-4' />
						Sent
					</TabsTrigger>
				</TabsList>

				<TabsContent value='active' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Active Connections</CardTitle>
							<CardDescription>Active DIDComm connections ({filteredConnections.length} connections)</CardDescription>
						</CardHeader>
						<CardContent>
							{loading && connections.length === 0 ? (
								<div className='text-center py-8'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
									<p className='mt-2 text-muted-foreground'>Loading connections...</p>
								</div>
							) : filteredConnections.length === 0 ? (
								<div className='text-center py-8'>
									<Users className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<p className='text-muted-foreground'>No active connections</p>
								</div>
							) : (
								<div className='space-y-4'>
									{filteredConnections.map((connection) => (
										<div key={connection.id} className='p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
											<div className='flex justify-between items-start'>
												<div className='flex-1'>
													<div className='flex items-center gap-2 mb-2'>
														<h3 className='font-medium'>{connection.their_label || 'No label'}</h3>
														<Badge {...getStateDisplay(connection.state)}>{getStateDisplay(connection.state).label}</Badge>
													</div>

													<div className='space-y-1 text-sm text-muted-foreground'>
														<p>
															<span className='font-medium'>Their DID:</span> <span className='font-mono'>{connection.their_did.length > 60 ? `${connection.their_did.substring(0, 60)}...` : connection.their_did}</span>
														</p>
														<p>
															<span className='font-medium'>My DID:</span> <span className='font-mono'>{connection.my_did.length > 60 ? `${connection.my_did.substring(0, 60)}...` : connection.my_did}</span>
														</p>
														<p>
															<span className='font-medium'>Created:</span>{' '}
															{formatDistanceToNow(new Date(connection.created_at), {
																addSuffix: true,
																locale: enUS,
															})}
														</p>
													</div>
												</div>

												<div className='flex items-center gap-2'>
													<Button variant='outline' size='sm' onClick={() => router.push(`/dashboard/messages/compose?to=${connection.their_did}`)}>
														<MessageCircle className='h-4 w-4' />
													</Button>

													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button variant='outline' size='sm'>
																<Trash2 className='h-4 w-4' />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Delete Connection</AlertDialogTitle>
																<AlertDialogDescription>Are you sure you want to delete this connection? This action cannot be undone.</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction onClick={() => deleteConnection(connection.id)} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											</div>
										</div>
									))}

									{pagination.has_more && (
										<div className='text-center pt-4'>
											<Button variant='outline' onClick={() => loadConnections(pagination.page + 1)} disabled={loading}>
												{loading ? 'Loading...' : 'Load More'}
											</Button>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='pending' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Pending Connections</CardTitle>
							<CardDescription>Connection invitations and requests that need to be processed</CardDescription>
						</CardHeader>
						<CardContent>
							{loading && connections.length === 0 ? (
								<div className='text-center py-8'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
									<p className='mt-2 text-muted-foreground'>Loading connections...</p>
								</div>
							) : filteredConnections.length === 0 ? (
								<div className='text-center py-8'>
									<UserPlus className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<p className='text-muted-foreground'>No pending connections</p>
								</div>
							) : (
								<div className='space-y-4'>
									{filteredConnections.map((connection) => (
										<div key={connection.id} className='p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
											<div className='flex justify-between items-start'>
												<div className='flex-1'>
													<div className='flex items-center gap-2 mb-2'>
														<h3 className='font-medium'>{connection.their_label || 'No label'}</h3>
														<Badge {...getStateDisplay(connection.state)}>{getStateDisplay(connection.state).label}</Badge>
													</div>

													<div className='space-y-1 text-sm text-muted-foreground'>
														<p>
															<span className='font-medium'>Their DID:</span> <span className='font-mono'>{connection.their_did.length > 60 ? `${connection.their_did.substring(0, 60)}...` : connection.their_did}</span>
														</p>
														<p>
															<span className='font-medium'>Created:</span>{' '}
															{formatDistanceToNow(new Date(connection.created_at), {
																addSuffix: true,
																locale: enUS,
															})}
														</p>
													</div>
												</div>

												{(connection.state === 'invitation-received' || connection.state === 'request-received') && (
													<div className='flex items-center gap-2'>
														<Button variant='outline' size='sm' onClick={() => acceptConnection(connection.id)}>
															<Check className='h-4 w-4 mr-1' />
															Accept
														</Button>
														<Button variant='outline' size='sm' onClick={() => rejectConnection(connection.id)}>
															<X className='h-4 w-4 mr-1' />
															Reject
														</Button>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='sent' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Sent Connections</CardTitle>
							<CardDescription>Connection invitations and requests that have been sent</CardDescription>
						</CardHeader>
						<CardContent>
							{loading && connections.length === 0 ? (
								<div className='text-center py-8'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
									<p className='mt-2 text-muted-foreground'>Loading connections...</p>
								</div>
							) : filteredConnections.length === 0 ? (
								<div className='text-center py-8'>
									<MessageCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<p className='text-muted-foreground'>No connections sent yet</p>
								</div>
							) : (
								<div className='space-y-4'>
									{filteredConnections.map((connection) => (
										<div key={connection.id} className='p-4 border rounded-lg hover:bg-muted/50 transition-colors'>
											<div className='flex justify-between items-start'>
												<div className='flex-1'>
													<div className='flex items-center gap-2 mb-2'>
														<h3 className='font-medium'>{connection.their_label || 'No label'}</h3>
														<Badge {...getStateDisplay(connection.state)}>{getStateDisplay(connection.state).label}</Badge>
													</div>

													<div className='space-y-1 text-sm text-muted-foreground'>
														<p>
															<span className='font-medium'>Target DID:</span> <span className='font-mono'>{connection.their_did.length > 60 ? `${connection.their_did.substring(0, 60)}...` : connection.their_did}</span>
														</p>
														<p>
															<span className='font-medium'>Sent:</span>{' '}
															{formatDistanceToNow(new Date(connection.created_at), {
																addSuffix: true,
																locale: enUS,
															})}
														</p>
													</div>
												</div>

												<div className='flex items-center gap-2'>
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button variant='outline' size='sm'>
																<Trash2 className='h-4 w-4' />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Cancel Connection</AlertDialogTitle>
																<AlertDialogDescription>Are you sure you want to cancel this connection?</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>No</AlertDialogCancel>
																<AlertDialogAction onClick={() => deleteConnection(connection.id)} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
																	Cancel
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
