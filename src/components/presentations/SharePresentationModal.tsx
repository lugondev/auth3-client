'use client'

import React, {useState} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Copy, QrCode, Mail, Link2, Share2, Download, Check} from 'lucide-react'
import {toast} from 'sonner'
import type {VerifiablePresentation} from '@/types/presentations'
import SharingOptions from './SharingOptions'
import PresentationQRCode from './PresentationQRCode'
import ShareHistory from './ShareHistory'

interface SharePresentationModalProps {
	isOpen: boolean
	onClose: () => void
	presentation: VerifiablePresentation
	className?: string
}

/**
 * SharePresentationModal Component - Modal for sharing presentations
 *
 * Features:
 * - QR code generation for mobile sharing
 * - Direct link sharing with secure URLs
 * - Email sharing with templates
 * - JSON export and download
 * - Custom sharing messages
 * - Access control and expiration settings
 */
export function SharePresentationModal({isOpen, onClose, presentation, className = ''}: SharePresentationModalProps) {
	const [shareMethod, setShareMethod] = useState<'link' | 'qr' | 'email' | 'download' | 'advanced' | 'history'>('link')
	const [emailRecipient, setEmailRecipient] = useState('')
	const [emailSubject, setEmailSubject] = useState('Verifiable Presentation Shared')
	const [emailMessage, setEmailMessage] = useState('')
	const [customMessage, setCustomMessage] = useState('')
	const [expirationDays, setExpirationDays] = useState(7)
	const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

	// Generate sharing URLs and content
	const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
	const presentationUrl = `${baseUrl}/verify-presentation?id=${presentation.id}`
	const directViewUrl = `${baseUrl}/presentations/${presentation.id}/view`

	// Generate secure sharing link with parameters
	const generateSecureLink = () => {
		const params = new URLSearchParams()
		params.append('id', presentation.id)
		if (customMessage) params.append('message', customMessage)
		if (expirationDays !== 7) params.append('expires', expirationDays.toString())

		return `${baseUrl}/presentations/shared?${params.toString()}`
	}

	const secureShareUrl = generateSecureLink()

	// Copy to clipboard with feedback
	const copyToClipboard = async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopiedStates((prev) => ({...prev, [key]: true}))
			toast.success('Copied to clipboard!')

			// Reset copied state after 2 seconds
			setTimeout(() => {
				setCopiedStates((prev) => ({...prev, [key]: false}))
			}, 2000)
		} catch (error) {
			console.error('Failed to copy:', error)
			toast.error('Failed to copy to clipboard')
		}
	}

	// Generate JSON for download
	const generatePresentationJson = () => {
		return JSON.stringify(presentation, null, 2)
	}

	// Download presentation as JSON file
	const downloadPresentation = () => {
		const jsonContent = generatePresentationJson()
		const blob = new Blob([jsonContent], {type: 'application/json'})
		const url = URL.createObjectURL(blob)

		const link = document.createElement('a')
		link.href = url
		link.download = `presentation-${presentation.id}.json`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)

		toast.success('Presentation downloaded successfully!')
	}

	// Email sharing functionality
	const shareViaEmail = () => {
		if (!emailRecipient) {
			toast.error('Please enter an email address')
			return
		}

		const subject = encodeURIComponent(emailSubject)
		const body = encodeURIComponent(
			`
${emailMessage || 'I am sharing a verifiable presentation with you.'}

${customMessage ? `Message: ${customMessage}\n\n` : ''}

Verification Link: ${secureShareUrl}
Direct View: ${directViewUrl}

This presentation contains verified credentials and can be cryptographically validated.

Best regards
		`.trim(),
		)

		const mailtoUrl = `mailto:${emailRecipient}?subject=${subject}&body=${body}`
		window.open(mailtoUrl, '_blank')
		toast.success('Email client opened')
	}

	const renderCopyButton = (text: string, key: string) => (
		<Button variant='outline' size='sm' onClick={() => copyToClipboard(text, key)} className='ml-2'>
			{copiedStates[key] ? <Check className='h-4 w-4 text-green-600' /> : <Copy className='h-4 w-4' />}
		</Button>
	)

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={`sm:max-w-[800px] max-h-[90vh] overflow-y-auto ${className}`}>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Share2 className='h-5 w-5' />
						Share Presentation
					</DialogTitle>
					<DialogDescription>Share this verifiable presentation securely with others using various methods.</DialogDescription>
				</DialogHeader>

				{/* Presentation Summary */}
				<Card>
					<CardHeader>
						<CardTitle className='text-base'>Presentation Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-2'>
							<div className='flex justify-between'>
								<span className='font-medium'>ID:</span>
								<span className='font-mono text-sm'>{presentation.id}</span>
							</div>
							<div className='flex justify-between'>
								<span className='font-medium'>Holder:</span>
								<span className='text-sm truncate'>{presentation.holder}</span>
							</div>
							<div className='flex justify-between'>
								<span className='font-medium'>Credentials:</span>
								<Badge variant='secondary'>{Array.isArray(presentation.verifiableCredential) ? presentation.verifiableCredential.length : 1} credential(s)</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Sharing Options */}
				<Tabs value={shareMethod} onValueChange={(value) => setShareMethod(value as 'link' | 'qr' | 'email' | 'download' | 'advanced' | 'history')}>
					<TabsList className='grid w-full grid-cols-6'>
						<TabsTrigger value='link' className='flex items-center gap-2'>
							<Link2 className='h-4 w-4' />
							Link
						</TabsTrigger>
						<TabsTrigger value='qr' className='flex items-center gap-2'>
							<QrCode className='h-4 w-4' />
							QR Code
						</TabsTrigger>
						<TabsTrigger value='email' className='flex items-center gap-2'>
							<Mail className='h-4 w-4' />
							Email
						</TabsTrigger>
						<TabsTrigger value='download' className='flex items-center gap-2'>
							<Download className='h-4 w-4' />
							Download
						</TabsTrigger>
						<TabsTrigger value='advanced' className='flex items-center gap-2'>
							<Share2 className='h-4 w-4' />
							Advanced
						</TabsTrigger>
						<TabsTrigger value='history' className='flex items-center gap-2'>
							<Share2 className='h-4 w-4' />
							History
						</TabsTrigger>
					</TabsList>

					<TabsContent value='link' className='space-y-4'>
						<div className='space-y-4'>
							<div>
								<Label>Secure Sharing Link</Label>
								<div className='flex items-center space-x-2'>
									<Input value={secureShareUrl} readOnly className='font-mono text-sm' />
									{renderCopyButton(secureShareUrl, 'secure')}
								</div>
							</div>

							<div>
								<Label>Direct Verification Link</Label>
								<div className='flex items-center space-x-2'>
									<Input value={presentationUrl} readOnly className='font-mono text-sm' />
									{renderCopyButton(presentationUrl, 'verify')}
								</div>
							</div>

							<div>
								<Label>Direct View Link</Label>
								<div className='flex items-center space-x-2'>
									<Input value={directViewUrl} readOnly className='font-mono text-sm' />
									{renderCopyButton(directViewUrl, 'view')}
								</div>
							</div>

							{/* Sharing Options */}
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Sharing Settings</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<Label htmlFor='custom-message'>Custom Message</Label>
										<Textarea id='custom-message' value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder='Add a custom message for the recipient...' rows={2} />
									</div>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label htmlFor='expiration'>Expiration (Days)</Label>
											<Input id='expiration' type='number' min='1' max='365' value={expirationDays} onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)} />
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value='qr' className='space-y-4'>
						<PresentationQRCode
							url={secureShareUrl}
							presentationId={presentation.id}
							metadata={{
								title: 'Verifiable Presentation',
								description: customMessage || 'Scan to access the shared presentation',
								issuer: presentation.holder,
								type: 'presentation',
								validUntil: expirationDays ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
								instructions: 'Position your camera 6-12 inches from the QR code and ensure good lighting'
							}}
						/>
					</TabsContent>

					<TabsContent value='email' className='space-y-4'>
						<div className='space-y-4'>
							<div>
								<Label htmlFor='email-recipient'>Recipient Email *</Label>
								<Input id='email-recipient' type='email' value={emailRecipient} onChange={(e) => setEmailRecipient(e.target.value)} placeholder='recipient@example.com' required />
							</div>
							<div>
								<Label htmlFor='email-subject'>Subject</Label>
								<Input id='email-subject' value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder='Email subject' />
							</div>
							<div>
								<Label htmlFor='email-message'>Message</Label>
								<Textarea id='email-message' value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder='Add a custom message...' rows={4} />
							</div>
							<Button onClick={shareViaEmail} className='w-full'>
								<Mail className='mr-2 h-4 w-4' />
								Open Email Client
							</Button>
						</div>
					</TabsContent>

					<TabsContent value='download' className='space-y-4'>
						<div className='text-center space-y-4'>
							<div className='space-y-2'>
								<h3 className='text-lg font-medium'>Download Options</h3>
								<p className='text-sm text-muted-foreground'>Download the presentation in various formats for offline sharing</p>
							</div>

							<div className='space-y-3'>
								<Button onClick={downloadPresentation} className='w-full' variant='outline'>
									<Download className='mr-2 h-4 w-4' />
									Download as JSON
								</Button>

								<div className='border rounded-lg p-4'>
									<Label>Raw JSON (Copy & Paste)</Label>
									<Textarea value={generatePresentationJson()} readOnly rows={8} className='font-mono text-xs mt-2' />
									{renderCopyButton(generatePresentationJson(), 'json')}
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value='advanced' className='space-y-4'>
						<SharingOptions
							presentationId={presentation.id}
							onShareCreated={(shareLink) => {
								toast.success('Advanced share link created!')
								// Could update the modal state or close it
							}}
						/>
					</TabsContent>

					<TabsContent value='history' className='space-y-4'>
						<ShareHistory
							presentationId={presentation.id}
							onShareRevoked={(shareId) => {
								toast.success('Share link revoked successfully')
							}}
						/>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button type='button' variant='outline' onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
