'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  AlertTriangle
} from 'lucide-react'

interface QRCameraScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  isLoading?: boolean
}

export function QRCameraScanner({ onScan, onError, isLoading = false }: QRCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // QR Code detection using jsQR library
  const detectQRCode = async (imageData: ImageData) => {
    try {
      // Import jsQR dynamically for client-side only
      const jsQR = (await import('jsqr')).default
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      return code?.data || null
    } catch (error) {
      console.error('QR detection error:', error)
      return null
    }
  }

  const startCamera = async () => {
    try {
      setError(null)
      
      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        setStream(mediaStream)
        setCameraPermission('granted')
        setIsScanning(true)
        startScanning()
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setCameraPermission('denied')
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
  }

  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && isScanning) {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const qrData = await detectQRCode(imageData)

          if (qrData) {
            setIsScanning(false)
            stopCamera()
            
            // Extract session ID from QR data
            // Format could be: auth3://qr/{sessionId} or just the session ID
            let sessionId = qrData
            if (qrData.startsWith('auth3://qr/')) {
              sessionId = qrData.replace('auth3://qr/', '')
            } else if (qrData.startsWith('http')) {
              // Extract session ID from URL if it's a URL format
              const url = new URL(qrData)
              sessionId = url.pathname.split('/').pop() || qrData
            }
            
            onScan(sessionId)
          }
        }
      }
    }, 100) // Scan every 100ms
  }

  const retryCamera = () => {
    stopCamera()
    setError(null)
    setCameraPermission('prompt')
    startCamera()
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [stream])

  if (cameraPermission === 'denied' || error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <CameraOff className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Camera Access Required</h3>
              <p className="text-sm text-muted-foreground">
                Please allow camera access to scan QR codes
              </p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button onClick={retryCamera} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <p className="text-xs text-muted-foreground">
                Make sure to click "Allow" when prompted for camera access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg animate-pulse">
                  <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-blue-500"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-blue-500"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-blue-500"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-blue-500"></div>
                </div>
              </div>
            )}

            {/* Status indicator */}
            <div className="absolute top-3 left-3">
              {isScanning ? (
                <div className="flex items-center gap-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Scanning...
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  Ready
                </div>
              )}
            </div>
          </div>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          <div className="space-y-3">
            {!isScanning ? (
              <Button 
                onClick={startCamera} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={stopCamera} 
                variant="outline"
                className="w-full"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Scanning
              </Button>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Position the QR code within the scanning area
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
