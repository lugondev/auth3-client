'use client'

import {useState, useEffect, useRef} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {QrCode, Smartphone, CheckCircle, XCircle, Clock, RefreshCw} from 'lucide-react'
import {Alert, AlertDescription} from '@/components/ui/alert'
import { qrService, type QRCodeResponse, type PollResponse, type QRCodeGenerateRequest } from '@/services/qrService'

interface QRCodeLoginProps {
	clientId: string
	redirectUri: string
	scope?: string
	state?: string
	codeChallenge?: string
	codeChallengeMethod?: string
	onSuccess: (authCode: string, state: string) => void
	onError: (error: string) => void
}

export function QRCodeLogin({clientId, redirectUri, scope = 'openid profile email', state, codeChallenge, codeChallengeMethod = 'S256', onSuccess, onError}: QRCodeLoginProps) {
	const [qrData, setQrData] = useState<QRCodeResponse | null>(null)
	const [pollData, setPollData] = useState<PollResponse | null>(null)
	const [loading, setLoading] = useState(false)
	const [polling, setPolling] = useState(false)
	const [timeRemaining, setTimeRemaining] = useState<number>(0)
	const [showWarning, setShowWarning] = useState(false)

	const pollIntervalRef = useRef<NodeJS.Timeout>()
	const countdownRef = useRef<NodeJS.Timeout>()

	// Generate QR code
	const generateQRCode = async () => {
		setLoading(true)
		setShowWarning(false)
		try {
			const request: QRCodeGenerateRequest = {
				client_id: clientId,
				redirect_uri: redirectUri,
				scope,
				state,
				code_challenge: codeChallenge,
				code_challenge_method: codeChallengeMethod,
			}

			const data = await qrService.generateQRCode(request)
			setQrData(data)
			setTimeRemaining(data.expires_in)
			startPolling(data.session_id, data.settings.poll_interval)
			startCountdown()
		} catch (error) {
			onError(error instanceof Error ? error.message : 'Failed to generate QR code')
		} finally {
			setLoading(false)
		}
	}

	// Start polling for status updates
	const startPolling = (sessionId: string, interval: number) => {
		setPolling(true)
		pollIntervalRef.current = setInterval(async () => {
			try {
				const data = await qrService.pollQRStatus(sessionId)
				setPollData(data)

				// Handle different statuses
				switch (data.next_action) {
					case 'redirect':
						if (data.auth_code && data.state) {
							stopPolling()
							onSuccess(data.auth_code, data.state)
						}
						break
					case 'error':
					case 'retry':
						stopPolling()
						if (data.error_description) {
							onError(data.error_description)
						}
						break
				}

				// Update time remaining
				setTimeRemaining(data.expires_in)

				// Show warning when close to expiry
				if (data.expires_in <= 60 && !showWarning) {
					setShowWarning(true)
				}
			} catch (error) {
				console.error('Polling error:', error)
			}
		}, interval * 1000)
	}

	// Start countdown timer
	const startCountdown = () => {
		countdownRef.current = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1) {
					stopPolling()
					return 0
				}
				return prev - 1
			})
		}, 1000)
	}

	// Stop polling and timers
	const stopPolling = () => {
		setPolling(false)
		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current)
		}
		if (countdownRef.current) {
			clearInterval(countdownRef.current)
		}
	}

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopPolling()
		}
	}, [])

	// Format time remaining
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	// Get status info
	const getStatusInfo = () => {
		if (!pollData) return {icon: QrCode, color: 'default', text: 'Generating QR Code...'}

		switch (pollData.status) {
			case 'pending':
				return {icon: QrCode, color: 'default', text: 'Waiting for scan'}
			case 'scanned':
				return {icon: Smartphone, color: 'warning', text: 'Scanned - Waiting for authorization'}
			case 'authorized':
				return {icon: CheckCircle, color: 'success', text: 'Authorized - Redirecting...'}
			case 'rejected':
				return {icon: XCircle, color: 'destructive', text: 'Rejected by user'}
			case 'expired':
				return {icon: Clock, color: 'destructive', text: 'QR Code expired'}
			default:
				return {icon: QrCode, color: 'default', text: 'Unknown status'}
		}
	}

	const statusInfo = getStatusInfo()
	const StatusIcon = statusInfo.icon

	return (
		<Card className='w-full max-w-md mx-auto'>
			<CardHeader className='text-center'>
				<CardTitle className='flex items-center justify-center gap-2'>
					<QrCode className='h-5 w-5' />
					QR Code Login
				</CardTitle>
				<CardDescription>Scan with your mobile device to login quickly</CardDescription>
			</CardHeader>

			<CardContent className='space-y-4'>
				{!qrData ? (
					<div className='text-center'>
						<Button onClick={generateQRCode} disabled={loading} className='w-full'>
							{loading ? (
								<>
									<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
									Generating...
								</>
							) : (
								<>
									<QrCode className='h-4 w-4 mr-2' />
									Generate QR Code
								</>
							)}
						</Button>
					</div>
				) : (
					<>
						{/* QR Code Image */}
						<div className='flex justify-center'>
							<div className='bg-white dark:bg-gray-100 p-4 rounded-lg border-2 border-muted'>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={`data:image/png;base64,${qrData.qr_code_data}`} alt='QR Code for login' className='w-48 h-48' />
							</div>
						</div>

						{/* Status Badge */}
						<div className='text-center'>
							<Badge variant={statusInfo.color === 'success' ? 'default' : statusInfo.color === 'warning' ? 'secondary' : statusInfo.color === 'destructive' ? 'destructive' : 'default'} className='inline-flex items-center gap-1'>
								<StatusIcon className='h-3 w-3' />
								{statusInfo.text}
							</Badge>
						</div>

						{/* Status Message */}
						{pollData && <div className='text-center text-sm text-muted-foreground'>{pollData.message}</div>}

						{/* Time Remaining */}
						{timeRemaining > 0 && (
							<div className='text-center'>
								<div className='text-sm text-muted-foreground'>
									Expires in: <span className='font-mono'>{formatTime(timeRemaining)}</span>
								</div>
							</div>
						)}

						{/* Warning */}
						{showWarning && (
							<Alert>
								<Clock className='h-4 w-4' />
								<AlertDescription>QR code will expire soon. Please scan now or generate a new one.</AlertDescription>
							</Alert>
						)}

						{/* Action Buttons */}
						<div className='flex gap-2'>
							<Button onClick={generateQRCode} disabled={loading || polling} variant='outline' className='flex-1'>
								<RefreshCw className='h-4 w-4 mr-1' />
								New QR
							</Button>

							{(pollData?.status === 'expired' || pollData?.status === 'rejected') && (
								<Button onClick={generateQRCode} disabled={loading} className='flex-1'>
									Try Again
								</Button>
							)}
						</div>

						{/* Instructions */}
						<div className='text-xs text-muted-foreground space-y-1'>
							<p>1. Open your mobile app</p>
							<p>2. Scan the QR code above</p>
							<p>3. Confirm login on your device</p>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
