'use client'

import React, {useState, useEffect, useCallback} from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {QrCode, Download, Copy, Share2, Eye, EyeOff, RefreshCw, ExternalLink, Smartphone, Monitor, AlertTriangle} from 'lucide-react'
import {toast} from 'sonner'
import {VerifiableCredential} from '@/types/credentials'

interface CredentialQRCodeProps {
	credential: VerifiableCredential
	size?: number
	includeMetadata?: boolean
	shareUrl?: string
	onGenerate?: (qrData: string) => void
	className?: string
	enableDeepLink?: boolean // New prop for enabling/disabling deep linking
	enableOfflineSupport?: boolean // New prop for enabling/disabling offline support
}

/**
 * CredentialQRCode Component
 * Generates and displays QR codes for credential sharing
 */
export function CredentialQRCode({credential, size = 256, includeMetadata = true, shareUrl, onGenerate, className = '', enableDeepLink = true, enableOfflineSupport = true}: CredentialQRCodeProps) {
	// State management
	const [qrDataUrl, setQrDataUrl] = useState<string>('')
	const [qrData, setQrData] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showFullData, setShowFullData] = useState(false)
	const [qrMode, setQrMode] = useState<'online' | 'offline'>(enableOfflineSupport ? 'offline' : 'online')

	/**
	 * Generate QR code data based on credential and options
	 */
	const generateQRData = useCallback(() => {
		try {
			let data: string

			if (shareUrl) {
				// Use share URL if provided
				data = shareUrl
			} else if (qrMode === 'offline' && enableOfflineSupport) {
				// Include full credential data for offline verification
				data = JSON.stringify(credential)
			} else if (enableDeepLink) {
				// Create a deep link for mobile wallet apps
				const baseUrl = `auth3://credentials/view`
				const params = new URLSearchParams({
					id: credential.id,
					issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id || '',
					type: Array.isArray(credential.type) ? credential.type.join(',') : credential.type,
					callback: `${window.location.origin}/credentials/verify/${credential.id}`,
				})
				data = `${baseUrl}?${params.toString()}`
			} else if (includeMetadata) {
				// Include full credential data
				data = JSON.stringify(credential)
			} else {
				// Include minimal data for verification
				data = JSON.stringify({
					id: credential.id,
					type: credential.type,
					issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id,
					issuanceDate: credential.issuanceDate,
					verificationUrl: `${window.location.origin}/credentials/verify/${credential.id}`,
				})
			}

			return data
		} catch (err) {
			console.error('Error generating QR data:', err)
			throw new Error('Failed to generate QR data')
		}
	}, [credential, shareUrl, includeMetadata, qrMode, enableOfflineSupport, enableDeepLink])

	/**
	 * Generate QR code using the qrcode library
	 */
	const generateQRCode = useCallback(async (data: string, size: number): Promise<string> => {
		try {
			// Generate QR code using the qrcode library
			const qrCodeDataUrl = await QRCode.toDataURL(data, {
				width: size,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF',
				},
				errorCorrectionLevel: 'M',
			})

			return qrCodeDataUrl
		} catch (err) {
			console.error('Error generating QR code:', err)
			throw new Error('Failed to generate QR code')
		}
	}, [])

	/**
	 * Generate QR code
	 */
	const handleGenerateQR = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const data = generateQRData()
			setQrData(data)

			// Generate QR code using the qrcode library with appropriate options
			const qrCodeDataUrl = await generateQRCode(data, size)
			setQrDataUrl(qrCodeDataUrl)

			if (onGenerate) {
				onGenerate(data)
			}
		} catch (err) {
			console.error('Error generating QR code:', err)
			setError('Failed to generate QR code')
		} finally {
			setLoading(false)
		}
	}, [generateQRData, generateQRCode, size, onGenerate])

	/**
	 * Toggle QR code mode (online/offline)
	 */
	const toggleQrMode = useCallback(() => {
		const newMode = qrMode === 'online' ? 'offline' : 'online'
		setQrMode(newMode)

		// Regenerate QR code with new mode
		toast.info(`Switched to ${newMode} mode QR code`)
	}, [qrMode])

	/**
	 * Download QR code
	 */
	const handleDownload = useCallback(() => {
		if (!qrDataUrl) return

		// Create a temporary link element
		const link = document.createElement('a')
		link.href = qrDataUrl
		link.download = `credential-${credential.id.substring(0, 8)}.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		toast.success('QR code downloaded')
	}, [qrDataUrl, credential.id])

	/**
	 * Copy QR data to clipboard
	 */
	const handleCopyData = async () => {
		if (!qrData) return

		try {
			await navigator.clipboard.writeText(qrData)
			toast.success('QR data copied to clipboard')
		} catch (err) {
			console.log('Error copying QR data', err)
			toast.error('Failed to copy QR data')
		}
	}

	/**
	 * Share QR code
	 */
	const handleShare = async () => {
		if (!qrDataUrl || !qrData) return

		try {
			if (navigator.share) {
				// Use native sharing if available
				await navigator.share({
					title: 'Verifiable Credential',
					text: 'Scan this QR code to verify the credential',
					url: shareUrl || qrData,
				})
			} else {
				// Fallback to copying URL
				await navigator.clipboard.writeText(shareUrl || qrData)
				toast.success('Share link copied to clipboard')
			}
		} catch (err) {
			console.log('Error sharing QR code', err)
			toast.error('Failed to share QR code')
		}
	}

	/**
	 * Get data preview for display
	 */
	const getDataPreview = (data: string, maxLength: number = 100) => {
		if (data.length <= maxLength) return data
		return `${data.substring(0, maxLength)}...`
	}

	// Generate QR code on component mount
	useEffect(() => {
		handleGenerateQR()
	}, [credential, size, includeMetadata, shareUrl, handleGenerateQR])

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className='flex items-center space-x-2'>
					<QrCode className='h-5 w-5' />
					<span>QR Code</span>
				</CardTitle>
				<CardDescription>Scan to verify or share this credential</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* QR Code Display */}
				<div className='flex justify-center'>
					{loading ? (
						<div className='flex items-center justify-center' style={{width: size, height: size}}>
							<RefreshCw className='h-8 w-8 animate-spin text-gray-400' />
						</div>
					) : error ? (
						<Alert className='mt-4' variant='destructive'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : qrDataUrl ? (
						<div className='flex flex-col items-center mt-4 space-y-2'>
							<div className='relative bg-white p-2 rounded'>
								<Image
									src={qrDataUrl}
									alt='Credential QR Code'
									width={size}
									height={size}
									className='rounded'
									unoptimized // Required for data URLs
								/>
							</div>

							{enableOfflineSupport && (
								<Badge variant={qrMode === 'offline' ? 'default' : 'outline'} className='cursor-pointer' onClick={toggleQrMode}>
									{qrMode === 'offline' ? 'Offline Mode' : 'Online Mode'}
								</Badge>
							)}

							{enableDeepLink && qrMode === 'online' && (
								<Badge variant='secondary' className='flex gap-1'>
									<Smartphone className='h-3 w-3' />
									<span>Deep Link Enabled</span>
								</Badge>
							)}

							<div className='flex space-x-2 mt-2'>
								<Button variant='outline' size='sm' onClick={handleDownload}>
									<Download className='h-4 w-4 mr-1' />
									Download
								</Button>
								{onGenerate && (
									<Button variant='outline' size='sm' onClick={handleGenerateQR}>
										<RefreshCw className='h-4 w-4 mr-1' />
										Refresh
									</Button>
								)}
							</div>
						</div>
					) : null}
				</div>

				{/* QR Data Information */}
				{qrData && (
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-medium'>QR Data:</span>
							<Button onClick={() => setShowFullData(!showFullData)} variant='ghost' size='sm'>
								{showFullData ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
							</Button>
						</div>
						<div className='bg-gray-50 rounded-lg p-3'>
							<code className='text-xs text-gray-700 break-all'>{showFullData ? qrData : getDataPreview(qrData)}</code>
						</div>
					</div>
				)}

				<Separator />

				{/* QR Mode Selection */}
				<div className='flex items-center justify-between'>
					<span className='text-sm font-medium'>QR Code Mode:</span>
					<Button onClick={toggleQrMode} variant='outline' size='sm' className='whitespace-nowrap'>
						{qrMode === 'online' ? 'Switch to Offline' : 'Switch to Online'}
					</Button>
				</div>

				{/* Action Buttons */}
				<div className='flex flex-wrap gap-2'>
					<Button onClick={handleGenerateQR} disabled={loading} variant='outline' size='sm'>
						<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
						Regenerate
					</Button>

					<Button onClick={handleDownload} disabled={!qrDataUrl} variant='outline' size='sm'>
						<Download className='h-4 w-4 mr-2' />
						Download
					</Button>

					<Button onClick={handleCopyData} disabled={!qrData} variant='outline' size='sm'>
						<Copy className='h-4 w-4 mr-2' />
						Copy Data
					</Button>

					<Button onClick={handleShare} disabled={!qrDataUrl} variant='outline' size='sm'>
						<Share2 className='h-4 w-4 mr-2' />
						Share
					</Button>
				</div>

				{/* Usage Instructions */}
				<div className='bg-blue-50 rounded-lg p-3'>
					<h4 className='text-sm font-medium text-blue-900 mb-2'>How to use:</h4>
					<div className='space-y-1 text-xs text-blue-800'>
						<div className='flex items-center space-x-2'>
							<Smartphone className='h-3 w-3' />
							<span>Scan with mobile wallet app</span>
						</div>
						<div className='flex items-center space-x-2'>
							<Monitor className='h-3 w-3' />
							<span>Use QR scanner on verification website</span>
						</div>
						<div className='flex items-center space-x-2'>
							<ExternalLink className='h-3 w-3' />
							<span>Share link for online verification</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

/**
 * CredentialQRCodeModal Component
 * Modal version of QR code display
 */
interface CredentialQRCodeModalProps {
	credential: VerifiableCredential
	isOpen: boolean
	onClose: () => void
	size?: number
}

export function CredentialQRCodeModal({credential, isOpen, onClose, size = 300}: CredentialQRCodeModalProps) {
	if (!isOpen) return null

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-semibold'>Share Credential</h3>
					<Button onClick={onClose} variant='ghost' size='sm'>
						×
					</Button>
				</div>
				<CredentialQRCode credential={credential} size={size} includeMetadata={false} />
			</div>
		</div>
	)
}

export default CredentialQRCode
