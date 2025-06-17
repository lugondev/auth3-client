'use client'

import {useState, useRef} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Send, Paperclip, X, Plus, Users, MessageCircle, FileText, Shield, Zap} from 'lucide-react'
import {DIDCommMessage, DIDCommAttachment, MessageType, SendMessageRequest, MESSAGE_TYPES} from '@/types/didcomm'
import {didcommService} from '@/services/didcommService'
import {toast} from 'sonner'
import {cn} from '@/lib/utils'

interface MessageComposerProps {
	/** Current user's DID */
	myDid: string
	/** Pre-filled recipient DIDs */
	recipients?: string[]
	/** Pre-filled subject */
	subject?: string
	/** Pre-filled message content */
	content?: string
	/** Thread ID for reply */
	threadId?: string
	/** Message type */
	messageType?: MessageType
	/** Whether to show advanced options */
	showAdvanced?: boolean
	/** Callback when message is sent */
	onMessageSent?: (message: DIDCommMessage) => void
	/** Callback when composer is cancelled */
	onCancel?: () => void
	/** Custom CSS classes */
	className?: string
}

/**
 * MessageComposer Component
 * Advanced DIDComm message composition with attachments and protocol selection
 */
export function MessageComposer({myDid, recipients = [], subject = '', content = '', threadId, messageType = MESSAGE_TYPES.BASIC_MESSAGE, showAdvanced = true, onMessageSent, onCancel, className}: MessageComposerProps) {
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		from: myDid,
		to: recipients,
		type: messageType,
		subject,
		content,
		threadId,
	})
	const [attachments, setAttachments] = useState<File[]>([])
	const [newRecipient, setNewRecipient] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Message type options
	const messageTypes: {value: MessageType; label: string; description: string; icon: React.ReactNode}[] = [
		{
			value: MESSAGE_TYPES.BASIC_MESSAGE,
			label: 'Basic Message',
			description: 'Standard text message',
			icon: <MessageCircle className='h-4 w-4' />,
		},
		{
			value: MESSAGE_TYPES.TRUST_PING,
			label: 'Trust Ping',
			description: 'Test connection and trust',
			icon: <Zap className='h-4 w-4' />,
		},
		{
			value: MESSAGE_TYPES.CONNECTION_INVITATION,
			label: 'Connection Invitation',
			description: 'Invite to create new DIDComm connection',
			icon: <Users className='h-4 w-4' />,
		},
		{
			value: MESSAGE_TYPES.CREDENTIAL_OFFER,
			label: 'Credential Offer',
			description: 'Offer to issue Verifiable Credential',
			icon: <Shield className='h-4 w-4' />,
		},
		{
			value: MESSAGE_TYPES.PRESENTATION_REQUEST,
			label: 'Proof Request',
			description: 'Request presentation of proof',
			icon: <FileText className='h-4 w-4' />,
		},
	]

	// Add recipient
	const addRecipient = () => {
		const trimmedRecipient = newRecipient.trim()

		if (!trimmedRecipient) {
			toast.error('Please enter recipient DID')
			return
		}

		if (!isValidDID(trimmedRecipient)) {
			toast.error('Invalid DID format. Example: did:example:123')
			return
		}

		if (formData.to.includes(trimmedRecipient)) {
			toast.error('This DID has already been added')
			return
		}

		setFormData((prev) => ({
			...prev,
			to: [...prev.to, trimmedRecipient],
		}))
		setNewRecipient('')
	}

	// Remove recipient
	const removeRecipient = (index: number) => {
		setFormData((prev) => ({
			...prev,
			to: prev.to.filter((_, i) => i !== index),
		}))
	}

	// Handle file selection
	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || [])

		// Check file size (max 10MB per file)
		const maxSize = 10 * 1024 * 1024
		const oversizedFiles = files.filter((file) => file.size > maxSize)

		if (oversizedFiles.length > 0) {
			toast.error(`File too large: ${oversizedFiles.map((f) => f.name).join(', ')}. Maximum size: 10MB`)
			return
		}

		setAttachments((prev) => [...prev, ...files])
	}

	// Remove attachment
	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index))
	}

	// Convert file to base64
	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.readAsDataURL(file)
			reader.onload = () => {
				const result = reader.result as string
				if (!result) {
					reject(new Error('Failed to read file'))
					return
				}
				const base64 = result.split(',')[1]
				if (!base64) {
					reject(new Error('Invalid file format'))
					return
				}
				resolve(base64)
			}
			reader.onerror = (error) => reject(error || new Error('File read error'))
		})
	}

	// Validate DID format
	const isValidDID = (did: string): boolean => {
		const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/
		return didRegex.test(did)
	}

	// Send message
	const sendMessage = async () => {
		// Validation
		if (!formData.from.trim()) {
			toast.error('Please select sender DID')
			return
		}

		if (!isValidDID(formData.from.trim())) {
			toast.error('Invalid sender DID format')
			return
		}

		if (formData.to.length === 0) {
			toast.error('Please add at least one recipient')
			return
		}

		// Validate all recipient DIDs
		for (const recipient of formData.to) {
			if (!isValidDID(recipient)) {
				toast.error(`Invalid recipient DID: ${recipient}`)
				return
			}
		}

		if (!formData.content.trim() && attachments.length === 0) {
			toast.error('Please enter message content or attach files')
			return
		}

		try {
			setLoading(true)

			// Prepare attachments
			const messageAttachments: DIDCommAttachment[] = []
			for (const file of attachments) {
				try {
					const base64 = await fileToBase64(file)
					messageAttachments.push({
						id: `attachment-${Date.now()}-${Math.random()}`,
						filename: file.name,
						mime_type: file.type,
						data: {
							base64,
						},
						byte_count: file.size,
					})
				} catch (fileError) {
					console.error('Error processing file:', file.name, fileError)
					toast.error(`Cannot process file: ${file.name}`)
					return
				}
			}

			// Prepare message request
			const messageRequest: SendMessageRequest = {
				to: formData.to[0], // SendMessageRequest expects single recipient
				type: formData.type,
				body: {
					content: formData.content.trim(),
					from: formData.from,
					...(formData.subject && {subject: formData.subject}),
				},
				...(messageAttachments.length > 0 && {attachments: messageAttachments}),
				...(formData.threadId && {thread_id: formData.threadId}),
			}

			const sentMessage = await didcommService.sendMessage(messageRequest)

			// Reset form
			setFormData({
				from: myDid,
				to: [],
				type: MESSAGE_TYPES.BASIC_MESSAGE,
				subject: '',
				content: '',
				threadId: undefined,
			})
			setAttachments([])

			onMessageSent?.(sentMessage)
			toast.success('Message sent successfully')
		} catch (error) {
			console.error('Error sending message:', error)

			// More specific error handling
			let errorMessage = 'Cannot send message'
			if (error instanceof Error) {
				if (error.message.includes('network')) {
					errorMessage = 'Network connection error. Please check your internet connection.'
				} else if (error.message.includes('unauthorized')) {
					errorMessage = 'Unauthorized to send message. Please log in again.'
				} else if (error.message.includes('invalid')) {
					errorMessage = 'Invalid message data. Please check and try again.'
				} else if (error.message) {
					errorMessage = `Error: ${error.message}`
				}
			}

			toast.error(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	// Get message type info
	const selectedMessageType = messageTypes.find((type) => type.value === formData.type)

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Send className='h-5 w-5' />
					Compose DIDComm Message
				</CardTitle>
				<CardDescription>Create and send DIDComm messages with attachments and various protocols</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{/* Sender */}
				<div className='space-y-2'>
					<Label htmlFor='from'>From (My DID)</Label>
					<Input id='from' value={formData.from} onChange={(e) => setFormData((prev) => ({...prev, from: e.target.value}))} placeholder='did:example:123...' className='font-mono' />
				</div>

				{/* Recipients */}
				<div className='space-y-3'>
					<Label>To (Recipient DID)</Label>

					{/* Current recipients */}
					{formData.to.length > 0 && (
						<div className='flex flex-wrap gap-2'>
							{formData.to.map((recipient, index) => (
								<Badge key={index} variant='secondary' className='flex items-center gap-1'>
									<span className='font-mono text-xs truncate max-w-32'>{recipient.length > 20 ? `${recipient.substring(0, 20)}...` : recipient}</span>
									<Button variant='ghost' size='sm' onClick={() => removeRecipient(index)} className='h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground'>
										<X className='h-3 w-3' />
									</Button>
								</Badge>
							))}
						</div>
					)}

					{/* Add recipient */}
					<div className='flex gap-2'>
						<Input
							value={newRecipient}
							onChange={(e) => setNewRecipient(e.target.value)}
							placeholder='Enter recipient DID...'
							className='font-mono'
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault()
									addRecipient()
								}
							}}
						/>
						<Button onClick={addRecipient} variant='outline'>
							<Plus className='h-4 w-4' />
						</Button>
					</div>
				</div>

				{/* Message Type */}
				{showAdvanced && (
					<div className='space-y-2'>
						<Label htmlFor='message-type'>Message Type</Label>
						<Select value={formData.type} onValueChange={(value: MessageType) => setFormData((prev) => ({...prev, type: value}))}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{messageTypes.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										<div className='flex items-center gap-2'>
											{type.icon}
											<div>
												<div className='font-medium'>{type.label}</div>
												<div className='text-xs text-muted-foreground'>{type.description}</div>
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{selectedMessageType && (
							<div className='p-3 bg-muted rounded-lg'>
								<div className='flex items-center gap-2 text-sm'>
									{selectedMessageType.icon}
									<span className='font-medium'>{selectedMessageType.label}</span>
								</div>
								<p className='text-xs text-muted-foreground mt-1'>{selectedMessageType.description}</p>
							</div>
						)}
					</div>
				)}

				{/* Subject */}
				<div className='space-y-2'>
					<Label htmlFor='subject'>Subject (optional)</Label>
					<Input id='subject' value={formData.subject} onChange={(e) => setFormData((prev) => ({...prev, subject: e.target.value}))} placeholder='Enter message subject...' />
				</div>

				{/* Content */}
				<div className='space-y-2'>
					<Label htmlFor='content'>Message Content</Label>
					<Textarea id='content' value={formData.content} onChange={(e) => setFormData((prev) => ({...prev, content: e.target.value}))} placeholder='Enter message content...' rows={6} />
				</div>

				{/* Attachments */}
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<Label>Attachments</Label>
						<Button variant='outline' onClick={() => fileInputRef.current?.click()} disabled={loading}>
							<Paperclip className='h-4 w-4 mr-2' />
							Attach File
						</Button>
					</div>

					<input type='file' ref={fileInputRef} onChange={handleFileSelect} multiple className='hidden' />

					{attachments.length > 0 && (
						<div className='space-y-2'>
							{attachments.map((file, index) => (
								<div key={index} className='flex items-center gap-3 p-3 border rounded-lg bg-muted/50'>
									<Paperclip className='h-4 w-4 text-muted-foreground' />
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium truncate'>{file.name}</p>
										<p className='text-xs text-muted-foreground'>
											{(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown'}
										</p>
									</div>
									<Button variant='ghost' size='sm' onClick={() => removeAttachment(index)} className='h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground'>
										<X className='h-4 w-4' />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>

				<Separator />

				{/* Actions */}
				<div className='flex gap-3'>
					<Button onClick={sendMessage} disabled={loading || formData.to.length === 0} className='flex-1'>
						{loading ? (
							<div>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
								Sending...
							</div>
						) : (
							<div>
								<Send className='h-4 w-4 mr-2' />
								Send Message
							</div>
						)}
					</Button>

					{onCancel && (
						<Button variant='outline' onClick={onCancel} disabled={loading}>
							Cancel
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
