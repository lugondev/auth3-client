'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {ArrowLeft, Send, Paperclip, X, Plus} from 'lucide-react'
import {didcommService} from '@/services/didcommService'
import {listDIDs} from '@/services/didService'
import {DIDCommAttachment, SendMessageRequest, MESSAGE_TYPES, MessageType} from '@/types/didcomm'
import {DIDResponse} from '@/types/did'
import {toast} from 'sonner'

interface ComposeFormData {
	from: string
	to: string
	type: MessageType
	subject: string
	content: string
	thread_id: string
	expires_time: string
}

/**
 * Compose Message Page
 * Allows users to compose and send DIDComm messages with recipient selection,
 * message composition, and attachment handling
 */
export default function ComposeMessagePage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [myDids, setMyDids] = useState<DIDResponse[]>([])
	const [formData, setFormData] = useState<ComposeFormData>({
		from: '',
		to: '',
		type: MESSAGE_TYPES.BASIC_MESSAGE,
		subject: '',
		content: '',
		thread_id: '',
		expires_time: '',
	})
	const [attachments, setAttachments] = useState<DIDCommAttachment[]>([])
	const [recipients, setRecipients] = useState<string[]>([])

	// Load user's DIDs for sender selection
	useEffect(() => {
		const loadMyDids = async () => {
			try {
				const response = await listDIDs()
				setMyDids(response.dids)
				if (response.dids.length > 0) {
					setFormData((prev) => ({...prev, from: response.dids[0].did.did}))
				}
			} catch (error) {
				console.error('Error loading DIDs:', error)
				toast.error('Unable to load DID list')
			}
		}

		loadMyDids()
	}, [])

	// Add recipient
	const addRecipient = () => {
		if (formData.to.trim() && !recipients.includes(formData.to.trim())) {
			setRecipients((prev) => [...prev, formData.to.trim()])
			setFormData((prev) => ({...prev, to: ''}))
		}
	}

	// Remove recipient
	const removeRecipient = (did: string) => {
		setRecipients((prev) => prev.filter((r) => r !== did))
	}

	// Handle file attachment
	const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files) return

		Array.from(files).forEach((file) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				const base64 = e.target?.result as string
				const attachment: DIDCommAttachment = {
					id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					filename: file.name,
					mime_type: file.type,
					byte_count: file.size,
					data: {
						base64: base64.split(',')[1], // Remove data:mime;base64, prefix
					},
				}
				setAttachments((prev) => [...prev, attachment])
			}
			reader.readAsDataURL(file)
		})
	}

	// Remove attachment
	const removeAttachment = (attachmentId: string) => {
		setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
	}

	// Send message
	const handleSend = async () => {
		if (!formData.from) {
			toast.error('Please select sender DID')
			return
		}

		if (recipients.length === 0) {
			toast.error('Please add at least one recipient')
			return
		}

		if (!formData.content.trim()) {
			toast.error('Please enter message content')
			return
		}

		try {
			setLoading(true)

			// Prepare message body based on type
			let messageBody: Record<string, unknown>
			if (formData.type === MESSAGE_TYPES.BASIC_MESSAGE) {
				messageBody = {
					content: formData.content,
				}
				if (formData.subject) {
					messageBody.subject = formData.subject
				}
			} else {
				messageBody = {
					content: formData.content,
					subject: formData.subject,
				}
			}

			// Send message to each recipient
			const sendPromises = recipients.map((recipient) => {
				const request: SendMessageRequest = {
					to: recipient,
					type: formData.type,
					body: messageBody,
					thread_id: formData.thread_id || undefined,
					attachments: attachments.length > 0 ? attachments : undefined,
					expires_time: formData.expires_time || undefined,
				}
				return didcommService.sendMessage(request)
			})

			await Promise.all(sendPromises)

			toast.success(`Message sent successfully to ${recipients.length} recipients`)
			router.push('/dashboard/messages')
		} catch (error) {
			console.error('Error sending message:', error)
			toast.error('Unable to send message')
		} finally {
			setLoading(false)
		}
	}

	// Get message type display name
	const getMessageTypeDisplay = (type: string) => {
		const typeMap: Record<string, string> = {
			[MESSAGE_TYPES.BASIC_MESSAGE]: 'Basic Message',
		[MESSAGE_TYPES.CONNECTION_INVITATION]: 'Connection Invitation',
		[MESSAGE_TYPES.CREDENTIAL_ISSUE]: 'Credential Issue',
		[MESSAGE_TYPES.CREDENTIAL_OFFER]: 'Credential Offer',
		[MESSAGE_TYPES.PRESENTATION_REQUEST]: 'Presentation Request',
		}
		return typeMap[type] || type
	}

	return (
		<div className='container mx-auto p-6 space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button variant='ghost' onClick={() => router.back()}>
					<ArrowLeft className='h-4 w-4' />
				</Button>
				<div>
					<h1 className='text-3xl font-bold'>Compose Message</h1>
				<p className='text-muted-foreground'>Create and send DIDComm messages</p>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Main compose form */}
				<div className='lg:col-span-2 space-y-6'>
					{/* Sender and Recipients */}
					<Card>
						<CardHeader>
							<CardTitle>Sender and Recipients</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Sender DID */}
							<div className='space-y-2'>
								<Label htmlFor='from'>From DID</Label>
								<Select value={formData.from} onValueChange={(value) => setFormData((prev) => ({...prev, from: value}))}>
									<SelectTrigger>
										<SelectValue placeholder='Select sender DID' />
									</SelectTrigger>
									<SelectContent>
										{myDids.map((did) => (
								<SelectItem key={did.id} value={did.did.did}>
									<div className='flex flex-col'>
										<span className='font-mono text-sm'>{did.did.did.length > 50 ? `${did.did.did.substring(0, 50)}...` : did.did.did}</span>
										<span className='text-xs text-muted-foreground'>
											{did.did.method} • {did.did.status}
										</span>
									</div>
								</SelectItem>
							))}
									</SelectContent>
								</Select>
							</div>

							{/* Recipients */}
							<div className='space-y-2'>
								<Label htmlFor='to'>To DID</Label>
								<div className='flex gap-2'>
									<Input id='to' placeholder='Enter recipient DID' value={formData.to} onChange={(e) => setFormData((prev) => ({...prev, to: e.target.value}))} onKeyPress={(e) => e.key === 'Enter' && addRecipient()} />
									<Button type='button' onClick={addRecipient} disabled={!formData.to.trim()}>
										<Plus className='h-4 w-4' />
									</Button>
								</div>

								{/* Recipients list */}
								{recipients.length > 0 && (
									<div className='flex flex-wrap gap-2 mt-2'>
										{recipients.map((recipient) => (
											<Badge key={recipient} variant='secondary' className='flex items-center gap-1'>
												<span className='font-mono text-xs'>{recipient.length > 30 ? `${recipient.substring(0, 30)}...` : recipient}</span>
												<button type='button' onClick={() => removeRecipient(recipient)} className='ml-1 hover:text-destructive'>
													<X className='h-3 w-3' />
												</button>
											</Badge>
										))}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Message Content */}
					<Card>
						<CardHeader>
							<CardTitle>Message Content</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Message Type */}
							<div className='space-y-2'>
								<Label htmlFor='type'>Message Type</Label>
								<Select value={formData.type} onValueChange={(value: MessageType) => setFormData((prev) => ({...prev, type: value}))}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={MESSAGE_TYPES.BASIC_MESSAGE}>{getMessageTypeDisplay(MESSAGE_TYPES.BASIC_MESSAGE)}</SelectItem>
										<SelectItem value={MESSAGE_TYPES.TRUST_PING}>{getMessageTypeDisplay(MESSAGE_TYPES.TRUST_PING)}</SelectItem>
										<SelectItem value={MESSAGE_TYPES.CONNECTION_INVITATION}>{getMessageTypeDisplay(MESSAGE_TYPES.CONNECTION_INVITATION)}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Subject (optional) */}
							<div className='space-y-2'>
								<Label htmlFor='subject'>Subject (optional)</Label>
							<Input id='subject' placeholder='Enter message subject' value={formData.subject} onChange={(e) => setFormData((prev) => ({...prev, subject: e.target.value}))} />
							</div>

							{/* Content */}
							<div className='space-y-2'>
								<Label htmlFor='content'>Content *</Label>
							<Textarea id='content' placeholder='Enter message content' value={formData.content} onChange={(e) => setFormData((prev) => ({...prev, content: e.target.value}))} rows={8} />
							</div>

							{/* Attachments */}
							<div className='space-y-2'>
								<Label>Attachments</Label>
								<div className='flex items-center gap-2'>
									<Input type='file' multiple onChange={handleFileAttachment} className='hidden' id='file-input' />
									<Button type='button' variant='outline' onClick={() => document.getElementById('file-input')?.click()}>
										<Paperclip className='h-4 w-4 mr-2' />
										Add File
									</Button>
								</div>

								{/* Attachments list */}
								{attachments.length > 0 && (
									<div className='space-y-2 mt-2'>
										{attachments.map((attachment) => (
											<div key={attachment.id} className='flex items-center justify-between p-2 border rounded'>
												<div className='flex items-center gap-2'>
													<Paperclip className='h-4 w-4' />
													<span className='text-sm'>{attachment.filename}</span>
													<Badge variant='outline' className='text-xs'>
														{attachment.mime_type}
													</Badge>
													{attachment.byte_count && <span className='text-xs text-muted-foreground'>({Math.round(attachment.byte_count / 1024)} KB)</span>}
												</div>
												<Button type='button' variant='ghost' size='sm' onClick={() => removeAttachment(attachment.id)}>
													<X className='h-4 w-4' />
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className='space-y-6'>
					{/* Advanced Options */}
					<Card>
						<CardHeader>
							<CardTitle>Advanced Options</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='thread_id'>Thread ID (optional)</Label>
							<Input id='thread_id' placeholder='Message thread ID' value={formData.thread_id} onChange={(e) => setFormData((prev) => ({...prev, thread_id: e.target.value}))} />
							</div>

							<div className='space-y-2'>
								<Label htmlFor='expires_time'>Expiration Time (optional)</Label>
								<Input id='expires_time' type='datetime-local' value={formData.expires_time} onChange={(e) => setFormData((prev) => ({...prev, expires_time: e.target.value}))} />
							</div>
						</CardContent>
					</Card>

					{/* Send Actions */}
					<Card>
						<CardContent className='p-4'>
							<div className='space-y-3'>
								<Button onClick={handleSend} disabled={loading || recipients.length === 0 || !formData.content.trim()} className='w-full'>
									{loading ? (
										<div className='flex items-center gap-2'>
											<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
											Sending...
										</div>
									) : (
										<div className='flex items-center gap-2'>
											<Send className='h-4 w-4' />
											Send Message
										</div>
									)}
								</Button>

								<Button variant='outline' onClick={() => router.back()} className='w-full' disabled={loading}>
									Cancel
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Message Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2 text-sm'>
							<div className='flex justify-between'>
								<span className='text-muted-foreground'>Recipients:</span>
								<span>{recipients.length}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground'>Attachments:</span>
								<span>{attachments.length}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-muted-foreground'>Type:</span>
								<span>{getMessageTypeDisplay(formData.type)}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
