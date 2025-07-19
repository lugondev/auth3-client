'use client'

import {useState, useRef} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Camera, QrCode, Upload, CheckCircle, XCircle, Clock, Smartphone, User, Shield, MapPin, Monitor, AlertTriangle, RefreshCw} from 'lucide-react'
import {useAuth} from '@/contexts/AuthContext'
import {scanQRCode, authorizeQRCode, rejectQRCode} from '@/services/qrCodeService'

interface QRScanSession {
	session_id: string
	client_name: string
	redirect_uri: string
	scope: string[]
	requested_permissions: string[]
	device_info: string
	location: string
	expires_at: string
	created_at: string
}

export default function QRScanPage() {
	const {user, isAuthenticated, loading} = useAuth()
	const [scanMethod, setScanMethod] = useState<'camera' | 'manual' | 'upload'>('camera')
	const [sessionId, setSessionId] = useState('')
	const [scanSession, setScanSession] = useState<QRScanSession | null>(null)
	const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle')
	const [errorMessage, setErrorMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			setScanStatus('processing')
			setIsLoading(true)

			// Simulate QR code detection from image
			setTimeout(() => {
				const mockSessionId = 'scanned-from-image-' + Math.random().toString(36).substr(2, 9)
				simulateQRScan(mockSessionId)
			}, 2000)
		}
	}

	const simulateQRScan = async (detectedSessionId: string) => {
		if (!detectedSessionId) {
			setErrorMessage('Session ID is required')
			setScanStatus('error')
			return
		}

		setScanStatus('processing')
		setIsLoading(true)
		setErrorMessage('')

		try {
			// Use QR service to scan session
			const data = await scanQRCode(detectedSessionId, {challenge: ''})

			setScanSession({
				session_id: detectedSessionId,
				client_name: data.client_info.name || 'OAuth2 Client',
				redirect_uri: data.client_info.client_uri || '',
				scope: data.requested_scope || ['openid', 'profile', 'email'],
				requested_permissions: data.requested_scope?.map((scope) => `Access your ${scope}`) || ['Read your profile', 'Access your email', 'Sign you in'],
				device_info: 'Unknown Device',
				location: 'Unknown Location',
				expires_at: data.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				created_at: new Date().toISOString(),
			})
			setScanStatus('success')
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to scan QR code')
			setScanStatus('error')
		} finally {
			setIsLoading(false)
		}
	}

	const handleManualScan = () => {
		simulateQRScan(sessionId)
	}

	const handleApproveLogin = async () => {
		if (!scanSession || !user) return

		setIsLoading(true)
		try {
			// Use QR service to approve login
			await authorizeQRCode(scanSession.session_id, {
				approved: true,
				scopes: scanSession.scope || [],
				user_info: {
					id: user.id,
					email: user.email,
					first_name: user.first_name,
					last_name: user.last_name,
				},
			})

			setScanStatus('success')
			setErrorMessage('')

			// Show success message
			setTimeout(() => {
				setScanStatus('idle')
				setScanSession(null)
				setSessionId('')
			}, 3000)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to approve login')
			setScanStatus('error')
		} finally {
			setIsLoading(false)
		}
	}

	const handleDenyLogin = async () => {
		if (!scanSession) return

		setIsLoading(true)
		try {
			// Use QR service to reject login
			await rejectQRCode(scanSession.session_id, 'User rejected login request')

			setScanStatus('idle')
			setScanSession(null)
			setSessionId('')
			setErrorMessage('')
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to deny login')
			setScanStatus('error')
		} finally {
			setIsLoading(false)
		}
	}

	const resetScan = () => {
		setScanStatus('idle')
		setScanSession(null)
		setSessionId('')
		setErrorMessage('')
	}

	const formatTimeRemaining = (expiresAt: string) => {
		const expiry = new Date(expiresAt)
		const now = new Date()
		const diff = expiry.getTime() - now.getTime()
		const minutes = Math.floor(diff / 60000)
		const seconds = Math.floor((diff % 60000) / 1000)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
			{/* Loading State */}
			{loading || !isAuthenticated || !user ? (
				<div className='flex items-center justify-center min-h-screen'>
					<div className='text-center space-y-4'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
						<p className='text-muted-foreground'>{loading ? 'Loading...' : !isAuthenticated ? 'Redirecting to login...' : 'Loading profile...'}</p>
					</div>
				</div>
			) : (
				<>
					{/* Quick Navigation */}
					<div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700'>
						<div className='container mx-auto px-4 py-3'>
							<div className='flex items-center justify-between'>
								<Button variant='ghost' size='sm' onClick={() => window.history.back()}>
									← Back
								</Button>
								<div className='flex items-center gap-2'>
									<Button variant='outline' size='sm' onClick={() => window.open('/demo/qr-login', '_blank')}>
										<Monitor className='h-4 w-4 mr-1' />
										Web Demo
									</Button>
								</div>
							</div>
						</div>
					</div>

					<div className='container mx-auto py-8 px-4 max-w-md'>
						{/* Mobile App Header */}
						<div className='text-center mb-8'>
							<div className='flex items-center justify-center gap-2 mb-4'>
								<div className='p-3 bg-blue-600 rounded-xl'>
									<Smartphone className='h-8 w-8 text-white' />
								</div>
								<h1 className='text-2xl font-bold text-foreground'>Auth3 Mobile</h1>
							</div>
							<p className='text-muted-foreground'>Scan QR codes to authenticate securely</p>
						</div>

						{/* User Profile Card */}
						<Card className='mb-6'>
							<CardContent className='p-4'>
								<div className='flex items-center gap-3'>
									<div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
										<User className='h-6 w-6 text-white' />
									</div>
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<h3 className='font-semibold text-foreground'>
												{user.first_name} {user.last_name}
											</h3>
											{user.roles && user.roles.length > 0 && (
												<Badge variant='default' className='text-xs'>
													<CheckCircle className='h-3 w-3 mr-1' />
													Verified
												</Badge>
											)}
										</div>
										<p className='text-sm text-muted-foreground'>{user.email}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Scan Interface */}
						{!scanSession ? (
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<QrCode className='h-5 w-5' />
										Scan QR Code
									</CardTitle>
									<CardDescription>Choose how you'd like to scan the QR code</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<Tabs value={scanMethod} onValueChange={(value) => setScanMethod(value as 'camera' | 'manual' | 'upload')}>
										<TabsList className='grid w-full grid-cols-3'>
											<TabsTrigger value='camera' disabled={scanStatus === 'processing'}>
												<Camera className='h-4 w-4 mr-1' />
												Camera
											</TabsTrigger>
											<TabsTrigger value='manual' disabled={scanStatus === 'processing'}>
												<QrCode className='h-4 w-4 mr-1' />
												Manual
											</TabsTrigger>
											<TabsTrigger value='upload' disabled={scanStatus === 'processing'}>
												<Upload className='h-4 w-4 mr-1' />
												Upload
											</TabsTrigger>
										</TabsList>

										<TabsContent value='camera' className='space-y-4'>
											<div className='aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25'>
												<div className='text-center space-y-2'>
													<Camera className='h-12 w-12 text-muted-foreground mx-auto' />
													<p className='text-sm text-muted-foreground'>Camera preview</p>
													<p className='text-xs text-muted-foreground'>(Demo mode - camera not implemented)</p>
												</div>
											</div>
											<Button onClick={() => simulateQRScan('camera-scan-' + Math.random().toString(36).substr(2, 9))} disabled={isLoading} className='w-full'>
												{isLoading ? (
													<>
														<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
														Scanning...
													</>
												) : (
													<>
														<QrCode className='h-4 w-4 mr-2' />
														Simulate Camera Scan
													</>
												)}
											</Button>
										</TabsContent>

										<TabsContent value='manual' className='space-y-4'>
											<div className='space-y-2'>
												<Label htmlFor='session-id'>Session ID from QR Code</Label>
												<Input id='session-id' placeholder='Enter session ID manually...' value={sessionId} onChange={(e) => setSessionId(e.target.value)} disabled={isLoading} />
												<p className='text-xs text-muted-foreground'>Copy the session ID from the web page QR code</p>
											</div>
											<Button onClick={handleManualScan} disabled={!sessionId || isLoading} className='w-full'>
												{isLoading ? (
													<>
														<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
														Processing...
													</>
												) : (
													<>
														<QrCode className='h-4 w-4 mr-2' />
														Scan Session ID
													</>
												)}
											</Button>
										</TabsContent>

										<TabsContent value='upload' className='space-y-4'>
											<div className='space-y-2'>
												<Label>Upload QR Code Image</Label>
												<input ref={fileInputRef} type='file' accept='image/*' onChange={handleFileUpload} disabled={isLoading} className='hidden' />
												<Button variant='outline' onClick={() => fileInputRef.current?.click()} disabled={isLoading} className='w-full'>
													<Upload className='h-4 w-4 mr-2' />
													Choose Image
												</Button>
												<p className='text-xs text-muted-foreground'>Upload a screenshot or photo of the QR code</p>
											</div>
										</TabsContent>
									</Tabs>

									{errorMessage && (
										<Alert variant='destructive'>
											<AlertTriangle className='h-4 w-4' />
											<AlertDescription>{errorMessage}</AlertDescription>
										</Alert>
									)}
								</CardContent>
							</Card>
						) : (
							/* Authorization Request */
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Shield className='h-5 w-5 text-blue-600 dark:text-blue-400' />
										Authorization Request
									</CardTitle>
									<CardDescription>Review the login request details</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{/* Client Info */}
									<div className='p-4 bg-muted rounded-lg space-y-3'>
										<div className='flex items-center gap-3'>
											<Monitor className='h-5 w-5 text-blue-600 dark:text-blue-400' />
											<div>
												<h4 className='font-semibold text-foreground'>{scanSession.client_name}</h4>
												<p className='text-sm text-muted-foreground'>{scanSession.redirect_uri}</p>
											</div>
										</div>

										<div className='flex items-center gap-2 text-sm text-muted-foreground'>
											<MapPin className='h-4 w-4' />
											{scanSession.location}
										</div>

										<div className='flex items-center gap-2 text-sm'>
											<Clock className='h-4 w-4 text-orange-600 dark:text-orange-400' />
											<span className='text-muted-foreground'>Expires in:</span>
											<Badge variant='secondary'>{formatTimeRemaining(scanSession.expires_at)}</Badge>
										</div>
									</div>

									{/* Requested Permissions */}
									<div className='space-y-2'>
										<h4 className='font-semibold text-foreground'>Requested Permissions:</h4>
										<div className='space-y-2'>
											{scanSession.requested_permissions.map((permission, index) => (
												<div key={index} className='flex items-center gap-2 text-sm'>
													<CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
													<span className='text-muted-foreground'>{permission}</span>
												</div>
											))}
										</div>
									</div>

									{/* Action Buttons */}
									<div className='grid grid-cols-2 gap-3 pt-4'>
										<Button variant='outline' onClick={handleDenyLogin} disabled={isLoading} className='text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30'>
											<XCircle className='h-4 w-4 mr-2' />
											Deny
										</Button>
										<Button onClick={handleApproveLogin} disabled={isLoading} className='bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'>
											{isLoading ? (
												<>
													<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
													Approving...
												</>
											) : (
												<>
													<CheckCircle className='h-4 w-4 mr-2' />
													Approve
												</>
											)}
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Success State */}
						{scanStatus === 'success' && scanSession && (
							<Card className='mt-4 border-green-200 dark:border-green-800'>
								<CardContent className='p-4'>
									<div className='text-center space-y-3'>
										<div className='w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto'>
											<CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
										</div>
										<h3 className='font-semibold text-foreground'>Login Approved!</h3>
										<p className='text-sm text-muted-foreground'>The web application has been notified and the user will be logged in shortly.</p>
										<Button variant='outline' onClick={resetScan} className='mt-3'>
											Scan Another QR Code
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Instructions */}
						<Card className='mt-6'>
							<CardHeader>
								<CardTitle className='text-lg'>How to Test</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div className='space-y-2 text-sm text-muted-foreground'>
									<p>
										<strong>1.</strong> Go to the QR Login Demo page in another tab
									</p>
									<p>
										<strong>2.</strong> Generate a QR code for login
									</p>
									<p>
										<strong>3.</strong> Copy the session ID or use "Manual" tab here
									</p>
									<p>
										<strong>4.</strong> Paste the session ID and scan
									</p>
									<p>
										<strong>5.</strong> Approve or deny the login request
									</p>
								</div>
								<Button variant='outline' size='sm' onClick={() => window.open('/demo/qr-login', '_blank')} className='w-full mt-3'>
									<Monitor className='h-4 w-4 mr-2' />
									Open QR Demo Page
								</Button>
							</CardContent>
						</Card>
					</div>
				</>
			)}
		</div>
	)
}
