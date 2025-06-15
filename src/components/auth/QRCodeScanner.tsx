'use client'

import {useState, useRef, useEffect} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Camera, Upload, X, Scan} from 'lucide-react'
import {toast} from 'sonner'
import QrScanner from 'qr-scanner'

// Extend HTMLVideoElement to include qrScanner property
declare global {
	interface HTMLVideoElement {
		qrScanner?: QrScanner | null
	}
}

interface QRCodeScannerProps {
	onScan: (data: string) => void
	onClose?: () => void
	title?: string
	description?: string
	className?: string
}

export function QRCodeScanner({onScan, onClose, title = 'Scan QR Code', description = 'Scan a QR code to authenticate with your mobile wallet', className = ''}: QRCodeScannerProps) {
	const [isScanning, setIsScanning] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [hasCamera, setHasCamera] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Check camera availability
	useEffect(() => {
		checkCameraAvailability()
		return () => {
			stopCamera()
		}
	}, [])

	const checkCameraAvailability = async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = devices.filter((device) => device.kind === 'videoinput')
			setHasCamera(videoDevices.length > 0)
		} catch (err) {
			console.error('Error checking camera availability:', err)
			setHasCamera(false)
		}
	}

	const startCamera = async () => {
		try {
			setError(null)
			setIsScanning(true)

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment', // Use back camera if available
					width: {ideal: 640},
					height: {ideal: 480},
				},
			})

			if (videoRef.current) {
				videoRef.current.srcObject = stream
				streamRef.current = stream
				await videoRef.current.play()

				// Start scanning for QR codes
				scanForQRCode()
			}
		} catch (err) {
			console.error('Error starting camera:', err)
			setError('Failed to access camera. Please check permissions.')
			setIsScanning(false)
		}
	}

	const stopCamera = () => {
		// Stop QR scanner if it exists
		if (videoRef.current?.qrScanner) {
			videoRef.current.qrScanner.destroy()
			videoRef.current.qrScanner = null
		}

		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
			streamRef.current = null
		}
		setIsScanning(false)
	}

	const scanForQRCode = () => {
		if (!videoRef.current) return

		const video = videoRef.current

		// Create QrScanner instance
		const qrScanner = new QrScanner(
			video,
			(result) => {
				handleQRCodeDetected(result.data)
			},
			{
				onDecodeError: (error) => {
					// Silently handle decode errors - they're expected when no QR code is visible
					console.debug('QR decode error:', error)
				},
				highlightScanRegion: true,
				highlightCodeOutline: true,
				returnDetailedScanResult: true,
			}
		)

		// Start scanning
		qrScanner.start().catch((error) => {
			console.error('Error starting QR scanner:', error)
			setError('Failed to start QR code scanner')
		})

		// Store scanner reference for cleanup
		videoRef.current.qrScanner = qrScanner
	}

	const handleQRCodeDetected = (data: string) => {
		stopCamera()
		onScan(data)
		toast.success('QR code scanned successfully')
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			setError('Please select an image file')
			return
		}

		const reader = new FileReader()
		reader.onload = (e) => {
			const img = new Image()
			img.onload = () => {
				if (!canvasRef.current) return

				const canvas = canvasRef.current
				const ctx = canvas.getContext('2d')
				if (!ctx) return

				canvas.width = img.width
				canvas.height = img.height
				ctx.drawImage(img, 0, 0)

				try {
					// Use QrScanner to scan the image
					QrScanner.scanImage(img, { returnDetailedScanResult: true })
						.then((result) => {
							handleQRCodeDetected(result.data)
						})
						.catch((error) => {
							console.error('Error scanning QR code from image:', error)
							setError('No QR code found in the image')
						})
				} catch (err) {
					console.error('Error processing image:', err)
					setError('Failed to process image')
				}
			}
			img.src = e.target?.result as string
		}
		reader.readAsDataURL(file)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Scan className='h-5 w-5' />
							{title}
						</CardTitle>
						<CardDescription>{description}</CardDescription>
					</div>
					{onClose && (
						<Button variant='ghost' size='sm' onClick={onClose}>
							<X className='h-4 w-4' />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className='space-y-4'>
				{error && (
					<Alert variant='destructive'>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Camera View */}
				{isScanning && (
					<div className='relative'>
						<video ref={videoRef} className='w-full rounded-lg border' playsInline muted />
						<canvas ref={canvasRef} className='hidden' />

						{/* Scanning overlay */}
						<div className='absolute inset-0 flex items-center justify-center'>
							<div className='w-48 h-48 border-2 border-primary border-dashed rounded-lg animate-pulse' />
						</div>

						<div className='absolute bottom-4 left-1/2 transform -translate-x-1/2'>
							<Button onClick={stopCamera} variant='secondary'>
								Stop Scanning
							</Button>
						</div>
					</div>
				)}

				{/* Controls */}
				{!isScanning && (
					<div className='space-y-3'>
						{hasCamera && (
							<Button onClick={startCamera} className='w-full' size='lg'>
								<Camera className='h-4 w-4 mr-2' />
								Start Camera
							</Button>
						)}

						<div className='relative'>
							<Button onClick={() => fileInputRef.current?.click()} variant='outline' className='w-full' size='lg'>
								<Upload className='h-4 w-4 mr-2' />
								Upload QR Code Image
							</Button>
							<input ref={fileInputRef} type='file' accept='image/*' onChange={handleFileUpload} className='hidden' />
						</div>

						{!hasCamera && (
							<Alert>
								<AlertDescription>Camera not available. You can still upload an image containing a QR code.</AlertDescription>
							</Alert>
						)}
					</div>
				)}

				<canvas ref={canvasRef} className='hidden' />
			</CardContent>
		</Card>
	)
}

// Compact version for inline use
export function QRCodeScannerCompact({onScan, className = ''}: {onScan: (data: string) => void; className?: string}) {
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}

		// Use QrScanner to scan the uploaded file
		QrScanner.scanImage(file, { returnDetailedScanResult: true })
			.then((result) => {
				onScan(result.data)
				toast.success('QR code scanned successfully')
			})
			.catch((error) => {
				console.error('Error scanning QR code from file:', error)
				toast.error('No QR code found in the image')
			})
	}

	return (
		<div className={className}>
			<Button onClick={() => fileInputRef.current?.click()} variant='outline' size='sm'>
				<Scan className='h-4 w-4 mr-2' />
				Scan QR
			</Button>
			<input ref={fileInputRef} type='file' accept='image/*' onChange={handleFileUpload} className='hidden' />
		</div>
	)
}
