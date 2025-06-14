'use client'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Copy, Download, Share2, Smartphone} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {toast} from 'sonner'

interface DIDQRCodeProps {
	did: string
	size?: number
	title?: string
	description?: string
	showActions?: boolean
	includeMetadata?: boolean
	metadata?: Record<string, unknown>
}

/**
 * DIDQRCode component generates QR code for DID sharing
 * with options for different formats and actions
 */
export function DIDQRCode({did, size = 256, title = 'DID QR Code', description, showActions = true, includeMetadata = false, metadata = {}}: DIDQRCodeProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
	const [isGenerating, setIsGenerating] = useState(false)

	// Generate QR code data
	const generateQRData = useCallback(() => {
		if (includeMetadata && Object.keys(metadata).length > 0) {
			return JSON.stringify({
				did,
				metadata,
				timestamp: new Date().toISOString(),
			})
		}
		return did
	}, [did, includeMetadata, metadata])

	// Generate QR code using canvas (simple implementation)
	// In a real implementation, you would use a QR code library like 'qrcode'
	const generateQRCode = useCallback(async () => {
		if (!canvasRef.current) return

		setIsGenerating(true)

		try {
			// This is a placeholder implementation
			// In production, use a proper QR code library like 'qrcode'
			const canvas = canvasRef.current
			const ctx = canvas.getContext('2d')

			if (!ctx) return

			// Set canvas size
			canvas.width = size
			canvas.height = size

			// Clear canvas
			ctx.fillStyle = '#ffffff'
			ctx.fillRect(0, 0, size, size)

			// Draw placeholder QR code pattern
			const qrData = generateQRData()
			const moduleSize = size / 25 // 25x25 grid

			// Simple pattern generation based on data hash
			const hash = simpleHash(qrData)

			ctx.fillStyle = '#000000'

			// Draw finder patterns (corners)
			drawFinderPattern(ctx, 0, 0, moduleSize)
			drawFinderPattern(ctx, size - 7 * moduleSize, 0, moduleSize)
			drawFinderPattern(ctx, 0, size - 7 * moduleSize, moduleSize)

			// Draw data modules based on hash
			for (let i = 0; i < 25; i++) {
				for (let j = 0; j < 25; j++) {
					// Skip finder pattern areas
					if (isFinderPatternArea(i, j)) continue

					const shouldFill = (hash + i * j) % 3 === 0
					if (shouldFill) {
						ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize)
					}
				}
			}

			// Convert to data URL
			const dataUrl = canvas.toDataURL('image/png')
			setQrCodeDataUrl(dataUrl)
		} catch (error) {
			console.error('Error generating QR code:', error)
			toast.error('Failed to generate QR code')
		} finally {
			setIsGenerating(false)
		}
	}, [size, generateQRData])

	// Simple hash function for demo purposes
	const simpleHash = (str: string): number => {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // Convert to 32-bit integer
		}
		return Math.abs(hash)
	}

	// Draw finder pattern (corner squares)
	const drawFinderPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) => {
		// Outer square
		ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize)

		// Inner white square
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize)

		// Center black square
		ctx.fillStyle = '#000000'
		ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize)
	}

	// Check if position is in finder pattern area
	const isFinderPatternArea = (i: number, j: number): boolean => {
		return (
			(i < 9 && j < 9) || // Top-left
			(i > 15 && j < 9) || // Top-right
			(i < 9 && j > 15) // Bottom-left
		)
	}

	// Copy DID to clipboard
	const handleCopyDID = async () => {
		try {
			await navigator.clipboard.writeText(did)
			toast.success('DID copied to clipboard')
		} catch (error) {
			console.log('Error copying DID:', error)
			toast.error('Failed to copy DID')
		}
	}

	// Copy QR data to clipboard
	const handleCopyQRData = async () => {
		try {
			const qrData = generateQRData()
			await navigator.clipboard.writeText(qrData)
			toast.success('QR data copied to clipboard')
		} catch (error) {
			console.log('Error copying QR data:', error)
			toast.error('Failed to copy QR data')
		}
	}

	// Download QR code as image
	const handleDownload = () => {
		if (!qrCodeDataUrl) return

		try {
			const link = document.createElement('a')
			link.download = `did-qr-${did.replace(/[^a-zA-Z0-9]/g, '-')}.png`
			link.href = qrCodeDataUrl
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			toast.success('QR code downloaded')
		} catch (error) {
			console.log('Error downloading QR code:', error)
			toast.error('Failed to download QR code')
		}
	}

	// Share QR code (if Web Share API is available)
	const handleShare = async () => {
		if (!qrCodeDataUrl) return

		try {
			if (navigator.share && navigator.canShare) {
				// Convert data URL to blob
				const response = await fetch(qrCodeDataUrl)
				const blob = await response.blob()
				const file = new File([blob], 'did-qr-code.png', {type: 'image/png'})

				if (navigator.canShare({files: [file]})) {
					await navigator.share({
						title: 'DID QR Code',
						text: `DID: ${did}`,
						files: [file],
					})
					return
				}
			}

			// Fallback: copy to clipboard
			await handleCopyDID()
		} catch (error) {
			console.error('Error sharing:', error)
			toast.error('Failed to share QR code')
		}
	}

	// Generate QR code on mount and when dependencies change
	useEffect(() => {
		generateQRCode()
	}, [did, size, includeMetadata, metadata, generateQRCode])

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Smartphone className='h-5 w-5' />
							{title}
						</CardTitle>
						{description && <CardDescription>{description}</CardDescription>}
					</div>
					{includeMetadata && <Badge variant='outline'>With Metadata</Badge>}
				</div>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* QR Code Display */}
				<div className='flex justify-center'>
					<div className='relative'>
						<canvas ref={canvasRef} className='border rounded-lg shadow-sm' style={{maxWidth: '100%', height: 'auto'}} />
						{isGenerating && (
							<div className='absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg'>
								<div className='text-sm text-muted-foreground'>Generating...</div>
							</div>
						)}
					</div>
				</div>

				{/* DID Information */}
				<div className='space-y-2'>
					<div className='text-sm'>
						<span className='text-muted-foreground'>DID: </span>
						<code className='text-xs bg-muted px-2 py-1 rounded break-all'>{did}</code>
					</div>

					{includeMetadata && Object.keys(metadata).length > 0 && (
						<div className='text-sm'>
							<span className='text-muted-foreground'>Metadata: </span>
							<div className='mt-1 p-2 bg-muted rounded text-xs'>
								<pre>{JSON.stringify(metadata, null, 2)}</pre>
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				{showActions && (
					<div className='flex flex-wrap gap-2'>
						<Button variant='outline' size='sm' onClick={handleCopyDID}>
							<Copy className='h-4 w-4 mr-2' />
							Copy DID
						</Button>

						{includeMetadata && (
							<Button variant='outline' size='sm' onClick={handleCopyQRData}>
								<Copy className='h-4 w-4 mr-2' />
								Copy QR Data
							</Button>
						)}

						<Button variant='outline' size='sm' onClick={handleDownload} disabled={!qrCodeDataUrl}>
							<Download className='h-4 w-4 mr-2' />
							Download
						</Button>

						<Button variant='outline' size='sm' onClick={handleShare} disabled={!qrCodeDataUrl}>
							<Share2 className='h-4 w-4 mr-2' />
							Share
						</Button>
					</div>
				)}

				{/* Instructions */}
				<div className='text-xs text-muted-foreground bg-muted/50 p-3 rounded'>
					<p className='font-medium mb-1'>How to use:</p>
					<ul className='space-y-1 list-disc list-inside'>
						<li>Scan with a DID-compatible wallet or app</li>
						<li>Share with others for identity verification</li>
						<li>Use for quick DID exchange in person</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	)
}

/**
 * Compact QR Code component for inline use
 */
export function DIDQRCodeCompact({did, size = 128}: {did: string; size?: number}) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (!canvasRef.current) return

		const canvas = canvasRef.current
		const ctx = canvas.getContext('2d')

		if (!ctx) return

		canvas.width = size
		canvas.height = size

		// Simple placeholder pattern
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, size, size)

		ctx.fillStyle = '#000000'
		const moduleSize = size / 25

		// Draw simple pattern
		for (let i = 0; i < 25; i++) {
			for (let j = 0; j < 25; j++) {
				if ((i + j) % 3 === 0) {
					ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize)
				}
			}
		}
	}, [did, size])

	return <canvas ref={canvasRef} className='border rounded' style={{width: size, height: size}} title={`QR Code for ${did}`} />
}
