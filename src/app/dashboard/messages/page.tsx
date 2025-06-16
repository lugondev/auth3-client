'use client'

import {useState, useEffect, useCallback} from 'react'
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {MessageCircle, Send, Inbox, Search, Plus} from 'lucide-react'
import {didcommService} from '@/services/didcommService'
import {DIDCommMessage, MessageListResponse, MessageSearchFilters} from '@/types/didcomm'
import {toast} from 'sonner'
import {formatDistanceToNow} from 'date-fns'
import {vi} from 'date-fns/locale'

/**
 * Messages Dashboard Page
 * Displays inbox/outbox views, message threads, and connection status
 */
export default function MessagesPage() {
	const router = useRouter()
	const [messages, setMessages] = useState<DIDCommMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeTab, setActiveTab] = useState('inbox')
	const [filters, setFilters] = useState<MessageSearchFilters>({})
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		has_more: false,
	})

	/**
	 * Load messages based on active tab and filters using callback pattern
	 * @param page - Page number to load
	 * @param onSuccess - Callback function called on successful load
	 * @param onError - Callback function called on error
	 */
	const loadMessages = useCallback((page = 1, onSuccess?: () => void, onError?: (error: Error) => void) => {
		setLoading(true)
		
		const params = {
			page,
			limit: pagination.limit,
			...filters,
		}

		// Add direction filter based on active tab
		if (activeTab === 'inbox') {
			// For inbox, we want inbound messages
			params.direction = 'inbound'
		} else if (activeTab === 'outbox') {
			// For outbox, we want outbound messages
			params.direction = 'outbound'
		}

		didcommService.getMessages(params)
			.then((response: MessageListResponse) => {
				if (page === 1) {
					setMessages(response.messages)
				} else {
					setMessages((prev) => [...prev, ...response.messages])
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
				console.error('Error loading messages:', error)
				toast.error('Unable to load messages')
				
				if (onError) {
					onError(error instanceof Error ? error : new Error(String(error)))
				}
			})
			.finally(() => {
				setLoading(false)
			})
	}, [pagination.limit, filters, activeTab])

	// Search messages
	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			loadMessages(1)
			return
		}

		try {
			setLoading(true)
			const results = await didcommService.searchMessages(searchQuery, filters)
			setMessages(results)
			setPagination((prev) => ({...prev, page: 1, total: results.length, has_more: false}))
		} catch (error) {
			console.error('Error searching messages:', error)
			toast.error('Unable to search messages')
		} finally {
			setLoading(false)
		}
	}

	// Mark message as read
	const markAsRead = async (messageId: string) => {
		try {
			await didcommService.markMessageAsRead(messageId)
			setMessages((prev) => prev.map((msg) => (msg.id === messageId ? {...msg, read: true} : msg)))
		} catch (error) {
			console.error('Error marking message as read:', error)
		}
	}

	// Get message type display name
	const getMessageTypeDisplay = (type: string) => {
		const typeMap: Record<string, string> = {
			'https://didcomm.org/basicmessage/2.0/message': 'Basic Message',
			'https://didcomm.org/connections/1.0/invitation': 'Connection Invitation',
			'https://didcomm.org/connections/1.0/request': 'Connection Request',
			'https://didcomm.org/connections/1.0/response': 'Connection Response',
			'https://didcomm.org/trust_ping/1.0/ping': 'Trust Ping',
			'https://didcomm.org/issue-credential/2.0/offer-credential': 'Credential Offer',
			'https://didcomm.org/present-proof/2.0/request-presentation': 'Presentation Request',
		}
		return typeMap[type] || type.split('/').pop() || 'Unknown'
	}

	// Get message preview text
	const getMessagePreview = (message: DIDCommMessage) => {
		if (typeof message.body === 'string') {
			return message.body.substring(0, 100) + (message.body.length > 100 ? '...' : '')
		}
		if (typeof message.body === 'object' && message.body?.content && typeof message.body.content === 'string') {
			return message.body.content.substring(0, 100) + (message.body.content.length > 100 ? '...' : '')
		}
		return 'Message has no text content'
	}

	useEffect(() => {
		loadMessages(1)
	}, [activeTab, filters, loadMessages])

	return (
		<div className='container mx-auto p-6 space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold'>DIDComm Messages</h1>
					<p className='text-muted-foreground'>Manage DIDComm messages and connections</p>
				</div>
				<Button onClick={() => router.push('/dashboard/messages/compose')}>
					<Plus className='h-4 w-4 mr-2' />
					Compose Message
				</Button>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className='p-4'>
					<div className='flex gap-4 items-center'>
						<div className='flex-1 flex gap-2'>
							<Input placeholder='Search messages...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
							<Button variant='outline' onClick={handleSearch}>
								<Search className='h-4 w-4' />
							</Button>
						</div>

						<Select value={filters.type || ''} onValueChange={(value) => setFilters((prev) => ({...prev, type: value || undefined}))}>
							<SelectTrigger className='w-48'>
								<SelectValue placeholder='Message Type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value=''>All Types</SelectItem>
								<SelectItem value='https://didcomm.org/basicmessage/2.0/message'>Basic Message</SelectItem>
								<SelectItem value='https://didcomm.org/connections/1.0/invitation'>Connection Invitation</SelectItem>
								<SelectItem value='https://didcomm.org/trust_ping/1.0/ping'>Trust Ping</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Messages Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='inbox' className='flex items-center gap-2'>
						<Inbox className='h-4 w-4' />
						Inbox
					</TabsTrigger>
					<TabsTrigger value='outbox' className='flex items-center gap-2'>
						<Send className='h-4 w-4' />
						Outbox
					</TabsTrigger>
					<TabsTrigger value='threads' className='flex items-center gap-2'>
						<MessageCircle className='h-4 w-4' />
						Conversations
					</TabsTrigger>
				</TabsList>

				<TabsContent value='inbox' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Inbox</CardTitle>
							<CardDescription>Received messages ({pagination.total} messages)</CardDescription>
						</CardHeader>
						<CardContent>
							{loading && messages.length === 0 ? (
								<div className='text-center py-8'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
									<p className='mt-2 text-muted-foreground'>Loading messages...</p>
								</div>
							) : messages.length === 0 ? (
								<div className='text-center py-8'>
									<MessageCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<p className='text-muted-foreground'>No messages</p>
								</div>
							) : (
								<div className='space-y-2'>
									{messages.map((message) => (
										<div
											key={message.id}
											className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${!message.read ? 'bg-blue-50 border-blue-200' : ''}`}
											onClick={() => {
												markAsRead(message.id)
												router.push(`/dashboard/messages/${message.id}`)
											}}>
											<div className='flex justify-between items-start mb-2'>
												<div className='flex items-center gap-2'>
													<span className='font-medium'>{message.from.split(':').pop()?.substring(0, 8)}...</span>
													{!message.read && (
														<Badge variant='secondary' className='text-xs'>
															New
														</Badge>
													)}
												</div>
												<span className='text-sm text-muted-foreground'>
													{formatDistanceToNow(new Date(message.created_time), {
														addSuffix: true,
														locale: vi,
													})}
												</span>
											</div>

											<div className='mb-2'>
												<Badge variant='outline' className='text-xs'>
													{getMessageTypeDisplay(message.type)}
												</Badge>
											</div>

											<p className='text-sm text-muted-foreground'>{getMessagePreview(message)}</p>

											{message.attachments && message.attachments.length > 0 && (
												<div className='mt-2'>
													<Badge variant='secondary' className='text-xs'>
														📎 {message.attachments.length} attachments
													</Badge>
												</div>
											)}
										</div>
									))}

									{pagination.has_more && (
										<div className='text-center pt-4'>
											<Button variant='outline' onClick={() => loadMessages(pagination.page + 1)} disabled={loading}>
												{loading ? 'Loading...' : 'Load More'}
											</Button>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='outbox' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Outbox</CardTitle>
							<CardDescription>Sent messages ({pagination.total} messages)</CardDescription>
						</CardHeader>
						<CardContent>
							{loading && messages.length === 0 ? (
								<div className='text-center py-8'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
									<p className='mt-2 text-muted-foreground'>Loading messages...</p>
								</div>
							) : messages.length === 0 ? (
								<div className='text-center py-8'>
									<Send className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
									<p className='text-muted-foreground'>No messages sent yet</p>
								</div>
							) : (
								<div className='space-y-2'>
									{messages.map((message) => (
										<div key={message.id} className='p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors' onClick={() => router.push(`/dashboard/messages/${message.id}`)}>
											<div className='flex justify-between items-start mb-2'>
												<div className='flex items-center gap-2'>
													<span className='font-medium'>To: {message.to[0]?.split(':').pop()?.substring(0, 8)}...</span>
													{message.to.length > 1 && (
														<Badge variant='secondary' className='text-xs'>
															+{message.to.length - 1} others
														</Badge>
													)}
												</div>
												<span className='text-sm text-muted-foreground'>
													{formatDistanceToNow(new Date(message.created_time), {
														addSuffix: true,
														locale: vi,
													})}
												</span>
											</div>

											<div className='mb-2'>
												<Badge variant='outline' className='text-xs'>
													{getMessageTypeDisplay(message.type)}
												</Badge>
											</div>

											<p className='text-sm text-muted-foreground'>{getMessagePreview(message)}</p>
										</div>
									))}

									{pagination.has_more && (
										<div className='text-center pt-4'>
											<Button variant='outline' onClick={() => loadMessages(pagination.page + 1)} disabled={loading}>
												{loading ? 'Loading...' : 'Load More'}
											</Button>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='threads' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Conversations</CardTitle>
							<CardDescription>Message threads grouped by topic</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-center py-8'>
								<MessageCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<p className='text-muted-foreground'>Conversation feature will be implemented later</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
