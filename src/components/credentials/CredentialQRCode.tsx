'use client'

import React, {useState, useEffect, useRef, useCallback} from 'react'
import Image from 'next/image'
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
}

/**
 * CredentialQRCode Component
 * Generates and displays QR codes for credential sharing
 */
export function CredentialQRCode({credential, size = 256, includeMetadata = true, shareUrl, onGenerate, className = ''}: CredentialQRCodeProps) {
	// State management
	const [qrDataUrl, setQrDataUrl] = useState<string>('')
	const [qrData, setQrData] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showFullData, setShowFullData] = useState(false)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	/**
	 * Generate QR code data based on credential and options
	 */
	const generateQRData = useCallback(() => {
		try {
			let data: string

			if (shareUrl) {
				// Use share URL if provided
				data = shareUrl
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
	}, [credential, shareUrl, includeMetadata])

	/**
	 * Generate QR code using a QR code library (mock implementation)
	 * In a real implementation, you would use a library like 'qrcode' or 'qr-code-generator'
	 */
	const generateQRCode = useCallback(async (data: string, size: number): Promise<string> => {
		return new Promise((resolve, reject) => {
			try {
				// Mock QR code generation - in real implementation use a QR library
				const canvas = canvasRef.current
				if (!canvas) {
					reject(new Error('Canvas not available'))
					return
				}

				const ctx = canvas.getContext('2d')
				if (!ctx) {
					reject(new Error('Canvas context not available'))
					return
				}

				// Set canvas size
				canvas.width = size
				canvas.height = size

				// Create a simple pattern (replace with actual QR code generation)
				ctx.fillStyle = '#ffffff'
				ctx.fillRect(0, 0, size, size)

				ctx.fillStyle = '#000000'
				const cellSize = size / 25

				// Generate a simple pattern based on data hash
				const hash = data.split('').reduce((a, b) => {
					a = (a << 5) - a + b.charCodeAt(0)
					return a & a
				}, 0)

				for (let i = 0; i < 25; i++) {
					for (let j = 0; j < 25; j++) {
						if ((hash + i * j) % 3 === 0) {
							ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
						}
					}
				}

				// Add corner markers
				const markerSize = cellSize * 3
				ctx.fillRect(0, 0, markerSize, markerSize)
				ctx.fillRect(size - markerSize, 0, markerSize, markerSize)
				ctx.fillRect(0, size - markerSize, markerSize, markerSize)

				// Convert to data URL
				const dataUrl = canvas.toDataURL('image/png')
				resolve(dataUrl)
			} catch (err) {
				reject(err)
			}
		})
	}, [canvasRef])

	/**
	 * Generate QR code
	 */
	const handleGenerateQR = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const data = generateQRData()
			setQrData(data)

			const dataUrl = await generateQRCode(data, size)
			setQrDataUrl(dataUrl)

			if (onGenerate) {
				onGenerate(data)
			}

			toast.success('QR code generated successfully')
		} catch (err) {
			console.error('Error generating QR code:', err)
			const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code'
			setError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setLoading(false)
		}
	}, [size, onGenerate, generateQRCode, generateQRData])

	/**
	 * Download QR code as image
	 */
	const handleDownload = useCallback(() => {
		if (!qrDataUrl) return

		const link = document.createElement('a')
		link.href = qrDataUrl
		link.download = `credential-qr-${credential.id || 'unknown'}.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		toast.success('QR code downloaded successfully')
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
						<Alert className='max-w-sm'>
							<AlertTriangle className='h-4 w-4' />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : qrDataUrl ? (
						<div className='relative'>
							<Image src={qrDataUrl} alt='Credential QR Code' className='border rounded-lg shadow-sm' style={{width: size, height: size}} />
							<Badge className='absolute -top-2 -right-2 bg-green-100 text-green-800' variant='outline'>
								Ready
							</Badge>
						</div>
					) : null}
				</div>

				{/* Hidden canvas for QR generation */}
				<canvas ref={canvasRef} style={{display: 'none'}} />

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
