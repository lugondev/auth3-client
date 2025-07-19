'use client'

import {useState, useRef, useEffect} from 'react'
import {Camera, X, Upload} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'

interface QRScannerProps {
	onScan: (data: string) => void
	onError?: (error: string) => void
	isScanning: boolean
	onToggleScanning: () => void
}

export function QRScanner({onScan, onError, isScanning, onToggleScanning}: QRScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [error, setError] = useState<string>('')
	const [hasCamera, setHasCamera] = useState<boolean>(true)

	useEffect(() => {
		if (isScanning) {
			startCamera()
		} else {
			stopCamera()
		}

		return () => stopCamera()
	}, [isScanning])

	const startCamera = async () => {
		try {
			setError('')
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment', // Use back camera if available
					width: {ideal: 640},
					height: {ideal: 480},
				},
			})

			setStream(mediaStream)
			setHasCamera(true)

			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream
				videoRef.current.play()

				// Start scanning for QR codes
				const intervalId = setInterval(() => {
					captureAndScan()
				}, 1000)

				// Store interval ID for cleanup
				videoRef.current.dataset.intervalId = intervalId.toString()
			}
		} catch (err) {
			console.error('Error accessing camera:', err)
			setHasCamera(false)
			const errorMessage = 'Unable to access camera. Please ensure camera permissions are granted.'
			setError(errorMessage)
			onError?.(errorMessage)
		}
	}

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop())
			setStream(null)
		}

		if (videoRef.current?.dataset.intervalId) {
			clearInterval(parseInt(videoRef.current.dataset.intervalId))
		}
	}

	const captureAndScan = () => {
		if (!videoRef.current || !canvasRef.current) return

		const video = videoRef.current
		const canvas = canvasRef.current
		const context = canvas.getContext('2d')

		if (!context || video.videoWidth === 0) return

		// Set canvas size to match video
		canvas.width = video.videoWidth
		canvas.height = video.videoHeight

		// Draw video frame to canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height)

		// Get image data for QR code detection
		const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

		// Simple QR code detection (in real app, use a proper QR library like jsQR)
		// For demo purposes, we'll simulate detection
		simulateQRDetection(imageData)
	}

	const simulateQRDetection = (imageData: ImageData) => {
		// In a real implementation, you would use a library like jsQR here
		// For demo purposes, we'll just simulate finding a QR code
		// This is a placeholder - you should integrate a proper QR code library
		// Placeholder: simulate finding QR code data
		// In reality, this would come from QR detection library
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (e) => {
			const img = new Image()
			img.onload = () => {
				if (!canvasRef.current) return

				const canvas = canvasRef.current
				const context = canvas.getContext('2d')
				if (!context) return

				canvas.width = img.width
				canvas.height = img.height
				context.drawImage(img, 0, 0)

				// Simulate QR detection from uploaded image
				// In real app, use proper QR detection library

				// For demo: simulate successful scan
				const demoQRData = JSON.stringify({
					type: 'PresentationRequest',
					requestID: 'demo-request-123',
					url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/presentation-requests/by-request-id/demo-request-123`,
				})

				onScan(btoa(demoQRData)) // Base64 encode for demo
			}
			img.src = e.target?.result as string
		}
		reader.readAsDataURL(file)
	}

	return (
		<Card className='w-full max-w-md mx-auto'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Camera className='w-5 h-5' />
					QR Code Scanner
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{error && (
					<Alert variant='destructive'>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className='space-y-4'>
					{hasCamera && (
						<div className='relative'>
							<video ref={videoRef} className={`w-full rounded-lg border ${isScanning ? 'block' : 'hidden'}`} playsInline muted />
							<canvas ref={canvasRef} className='hidden' />

							{isScanning && (
								<div className='absolute inset-0 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none'>
									<div className='absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-500'></div>
									<div className='absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-500'></div>
									<div className='absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-500'></div>
									<div className='absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-500'></div>
								</div>
							)}
						</div>
					)}

					<div className='flex gap-2'>
						<Button onClick={onToggleScanning} variant={isScanning ? 'destructive' : 'default'} className='flex-1' disabled={!hasCamera}>
							{isScanning ? (
								<>
									<X className='w-4 h-4 mr-2' />
									Stop Scanning
								</>
							) : (
								<>
									<Camera className='w-4 h-4 mr-2' />
									Start Scanning
								</>
							)}
						</Button>
					</div>

					<div className='relative'>
						<input type='file' accept='image/*' onChange={handleFileUpload} className='absolute inset-0 w-full h-full opacity-0 cursor-pointer' id='qr-upload' />
						<Button variant='outline' className='w-full' asChild>
							<label htmlFor='qr-upload' className='cursor-pointer'>
								<Upload className='w-4 h-4 mr-2' />
								Upload QR Image
							</label>
						</Button>
					</div>
				</div>

				<div className='text-sm text-muted-foreground text-center'>Point your camera at a QR code or upload an image</div>
			</CardContent>
		</Card>
	)
}
