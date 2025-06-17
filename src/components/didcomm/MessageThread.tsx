'use client'

import {useState, useEffect, useRef, useCallback} from 'react'
import {Card, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Separator} from '@/components/ui/separator'
import {Send, Paperclip, Download} from 'lucide-react'
import {DIDCommMessage, DIDCommAttachment, MessageType, MESSAGE_TYPES} from '@/types/didcomm'
import {didcommService} from '@/services/didcommService'
import {toast} from 'sonner'
import {formatDistanceToNow} from 'date-fns'
import {enUS} from 'date-fns/locale'
import {cn} from '@/lib/utils'

interface MessageThreadProps {
	/** Thread ID or connection ID to load messages for */
	threadId?: string
	/** Connection DID to filter messages */
	connectionDid?: string
	/** Current user's DID */
	myDid: string
	/** Whether to show the compose input */
	showCompose?: boolean
	/** Maximum height of the thread container */
	maxHeight?: string
	/** Callback when a new message is sent */
	onMessageSent?: (message: DIDCommMessage) => void
}

/**
 * MessageThread Component
 * Displays a thread of DIDComm messages with real-time updates and compose functionality
 */
export function MessageThread({threadId, connectionDid, myDid, showCompose = true, maxHeight = '600px', onMessageSent}: MessageThreadProps) {
	const [messages, setMessages] = useState<DIDCommMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [sending, setSending] = useState(false)
	const [newMessage, setNewMessage] = useState('')
	const [attachments, setAttachments] = useState<File[]>([])
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Load messages for the thread
	const loadMessages = useCallback(async () => {
		try {
			setLoading(true)
			const params: {
				limit?: number
				page?: number
				thread_id?: string
				type?: string
				from?: string
				to?: string
			} = {
				limit: 50,
			}

			if (threadId) {
				params.thread_id = threadId
			}
			if (connectionDid) {
				params.from = connectionDid
			}

			const response = await didcommService.getMessages(params)
			setMessages(response.messages)
		} catch (error) {
			console.error('Error loading messages:', error)
			toast.error('Unable to load messages')
		} finally {
			setLoading(false)
		}
	}, [threadId, connectionDid])

	// Send a new message
	const sendMessage = async () => {
		if (!newMessage.trim() && attachments.length === 0) {
			return
		}

		if (!connectionDid) {
			toast.error('No recipient information')
			return
		}

		try {
			setSending(true)

			// Prepare attachments
			const messageAttachments: DIDCommAttachment[] = []
			for (const file of attachments) {
				const base64 = await fileToBase64(file)
				messageAttachments.push({
					id: `attachment-${Date.now()}-${Math.random()}`,
					filename: file.name,
					mime_type: file.type,
					byte_count: file.size,
					data: {
						base64: base64,
					},
				})
			}

			const messageRequest = {
				from: myDid,
				to: connectionDid,
				type: 'basic-message' as MessageType,
				body: {
					content: newMessage.trim(),
				},
				attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
				thread_id: threadId,
			}

			const sentMessage = await didcommService.sendMessage(messageRequest)

			// Add the sent message to the thread
			setMessages((prev) => [...prev, sentMessage])

			// Clear the compose form
			setNewMessage('')
			setAttachments([])

			// Notify parent component
			onMessageSent?.(sentMessage)

			toast.success('Message sent successfully')
		} catch (error) {
			console.error('Error sending message:', error)
			toast.error('Unable to send message')
		} finally {
			setSending(false)
		}
	}

	// Convert file to base64
	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.readAsDataURL(file)
			reader.onload = () => {
				const result = reader.result as string
				// Remove data URL prefix
				const base64 = result.split(',')[1]
				resolve(base64)
			}
			reader.onerror = reject
		})
	}

	// Handle file attachment
	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || [])
		setAttachments((prev) => [...prev, ...files])
	}

	// Remove attachment
	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index))
	}

	// Download attachment
	const downloadAttachment = (attachment: DIDCommAttachment) => {
		try {
			if (!attachment.data.base64) {
				throw new Error('No base64 data available')
			}
			const blob = new Blob([Uint8Array.from(atob(attachment.data.base64), (c) => c.charCodeAt(0))], {
				type: attachment.mime_type || 'application/octet-stream',
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = attachment.filename || 'attachment'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Error downloading attachment:', error)
			toast.error('Unable to download attachment')
		}
	}

	// Get message type display
	const getMessageTypeDisplay = (type: MessageType) => {
		const typeMap: Record<MessageType, {label: string; variant: 'default' | 'secondary' | 'outline'}> = {
			[MESSAGE_TYPES.BASIC_MESSAGE]: {label: 'Message', variant: 'default'},
			[MESSAGE_TYPES.TRUST_PING]: {label: 'Ping', variant: 'secondary'},
			[MESSAGE_TYPES.TRUST_PING_RESPONSE]: {label: 'Ping Response', variant: 'secondary'},
			[MESSAGE_TYPES.CONNECTION_INVITATION]: {label: 'Invitation', variant: 'outline'},
			[MESSAGE_TYPES.CONNECTION_REQUEST]: {label: 'Request', variant: 'outline'},
			[MESSAGE_TYPES.CONNECTION_RESPONSE]: {label: 'Response', variant: 'outline'},
			[MESSAGE_TYPES.CREDENTIAL_OFFER]: {label: 'VC Offer', variant: 'secondary'},
			[MESSAGE_TYPES.CREDENTIAL_REQUEST]: {label: 'VC Request', variant: 'secondary'},
			[MESSAGE_TYPES.CREDENTIAL_ISSUE]: {label: 'VC Issue', variant: 'secondary'},
			[MESSAGE_TYPES.PRESENTATION_REQUEST]: {label: 'Proof Request', variant: 'outline'},
			[MESSAGE_TYPES.PRESENTATION]: {label: 'Proof Presentation', variant: 'outline'},
			[MESSAGE_TYPES.PROBLEM_REPORT]: {label: 'Problem Report', variant: 'outline'},
		}
		return typeMap[type] || {label: type, variant: 'outline' as const}
	}

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [messages])

	// Load messages on mount
	useEffect(() => {
		loadMessages()
	}, [threadId, connectionDid, loadMessages])

	return (
		<Card className='flex flex-col' style={{maxHeight}}>
			<CardHeader className='pb-3'>
				<CardTitle className='text-lg'>
					Message Thread
					{connectionDid && <span className='text-sm font-normal text-muted-foreground ml-2'>with {connectionDid.length > 30 ? `${connectionDid.substring(0, 30)}...` : connectionDid}</span>}
				</CardTitle>
			</CardHeader>

			<Separator />

			{/* Messages Area */}
			<ScrollArea className='flex-1 p-4' ref={scrollAreaRef}>
				{loading ? (
					<div className='flex justify-center py-8'>
						<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
					</div>
				) : messages.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>
						<p>No messages yet</p>
					</div>
				) : (
					<div className='space-y-4'>
						{messages.map((message) => {
							const isFromMe = message.from === myDid
							const typeDisplay = getMessageTypeDisplay(message.type as MessageType)

							return (
								<div key={message.id} className={cn('flex gap-3', isFromMe ? 'justify-end' : 'justify-start')}>
									{!isFromMe && (
										<Avatar className='h-8 w-8'>
											<AvatarFallback>{message.from.substring(0, 2).toUpperCase()}</AvatarFallback>
										</Avatar>
									)}

									<div className={cn('max-w-[70%] space-y-2', isFromMe ? 'items-end' : 'items-start')}>
										{/* Message Header */}
										<div className={cn('flex items-center gap-2 text-xs text-muted-foreground', isFromMe ? 'flex-row-reverse' : 'flex-row')}>
											<Badge {...typeDisplay}>{typeDisplay.label}</Badge>
											<span>
												{formatDistanceToNow(new Date(message.created_time), {
													addSuffix: true,
													locale: enUS,
												})}
											</span>
										</div>

										{/* Message Content */}
										<div className={cn('rounded-lg px-3 py-2 text-sm', isFromMe ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
											{typeof message.body === 'string' ? <p className='whitespace-pre-wrap'>{message.body}</p> : message.body && typeof message.body === 'object' && 'content' in message.body && typeof message.body.content === 'string' && <p className='whitespace-pre-wrap'>{message.body.content}</p>}

											{/* Attachments */}
											{message.attachments && message.attachments.length > 0 && (
												<div className='mt-2 space-y-2'>
													{message.attachments.map((attachment, index) => (
														<div key={index} className={cn('flex items-center gap-2 p-2 rounded border', isFromMe ? 'border-primary-foreground/20 bg-primary-foreground/10' : 'border-border bg-background')}>
															<Paperclip className='h-4 w-4' />
															<div className='flex-1 min-w-0'>
																<p className='text-xs font-medium truncate'>{attachment.filename}</p>
																<p className='text-xs opacity-70'>{attachment.byte_count ? (attachment.byte_count / 1024).toFixed(1) : '0'} KB</p>
															</div>
															<Button variant='ghost' size='sm' onClick={() => downloadAttachment(attachment)} className='h-6 w-6 p-0'>
																<Download className='h-3 w-3' />
															</Button>
														</div>
													))}
												</div>
											)}
										</div>
									</div>

									{isFromMe && (
										<Avatar className='h-8 w-8'>
											<AvatarFallback>{myDid.substring(0, 2).toUpperCase()}</AvatarFallback>
										</Avatar>
									)}
								</div>
							)
						})}
					</div>
				)}
			</ScrollArea>

			{/* Compose Area */}
			{showCompose && (
				<div>
					<Separator />
					<div className='p-4 space-y-3'>
						{/* Attachments Preview */}
						{attachments.length > 0 && (
							<div className='space-y-2'>
								<p className='text-sm font-medium'>Attachments:</p>
								<div className='flex flex-wrap gap-2'>
									{attachments.map((file, index) => (
										<div key={index} className='flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm'>
											<Paperclip className='h-3 w-3' />
											<span className='truncate max-w-32'>{file.name}</span>
											<Button variant='ghost' size='sm' onClick={() => removeAttachment(index)} className='h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground'>
												×
											</Button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Message Input */}
						<div className='flex gap-2'>
							<Input
								placeholder='Type a message...'
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault()
										sendMessage()
									}
								}}
								className='flex-1'
							/>

							<input type='file' ref={fileInputRef} onChange={handleFileSelect} multiple className='hidden' />

							<Button variant='outline' onClick={() => fileInputRef.current?.click()} disabled={sending}>
								<Paperclip className='h-4 w-4' />
							</Button>

							<Button onClick={sendMessage} disabled={sending || (!newMessage.trim() && attachments.length === 0)}>
								{sending ? <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current' /> : <Send className='h-4 w-4' />}
							</Button>
						</div>
					</div>
				</div>
			)}
		</Card>
	)
}
