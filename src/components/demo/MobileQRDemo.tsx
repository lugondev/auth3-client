import {useState, useRef, useEffect} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'
import {Smartphone, Camera, CheckCircle, XCircle, Clock, QrCode, AlertCircle, Wifi, User, Shield, LogOut} from 'lucide-react'
import {qrService, type QRScanResult, type QRAuthorizeResult} from '@/services/qrService'
import {scanQRCode, authorizeQRCode, rejectQRCode} from '@/services/qrCodeService'
import {getCurrentUser} from '@/services/userService'

export function MobileQRDemo() {
	const [isScanning, setIsScanning] = useState(false)
	const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
	const [authorizing, setAuthorizing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<QRAuthorizeResult | null>(null)
	const [manualSessionId, setManualSessionId] = useState('')
	const [isConnected] = useState(true)
	const [currentUser, setCurrentUser] = useState<{
		id: string
		name: string
		email: string
		avatar: string
	} | null>(null)

	const fileInputRef = useRef<HTMLInputElement>(null)

	// Load current user info using service
	useEffect(() => {
		const loadUserInfo = async () => {
			try {
				// Use the getCurrentUser service
				const userData = await getCurrentUser()
				setCurrentUser({
					id: userData.id,
					name: `${userData.first_name} ${userData.last_name}`.trim(),
					email: userData.email,
					avatar: userData.avatar || '/placeholder-avatar.png',
				})
			} catch (error) {
				console.error('Failed to load user info:', error)
				// Fallback: Try to get from localStorage if service fails
				const userInfo = localStorage.getItem('user_info')
				if (userInfo) {
					setCurrentUser(JSON.parse(userInfo))
				}
			}
		}

		loadUserInfo()
	}, [])

	// Logout function
	const handleLogout = () => {
		localStorage.removeItem('auth_token')
		localStorage.removeItem('access_token')
		localStorage.removeItem('user_info')
		window.location.href = '/auth/login'
	}

	// Simulate QR code scanning
	const simulateQRScan = async (sessionId?: string) => {
		const targetSessionId = sessionId || manualSessionId.trim()

		if (!targetSessionId) {
			setError('Please enter a session ID or scan a QR code')
			return
		}

		// Validate session ID format
		if (!qrService.isValidSessionId(targetSessionId)) {
			setError('Invalid session ID format')
			return
		}

		setIsScanning(true)
		setError(null)
		setScanResult(null)
		setSuccess(null)

		try {
			// Simulate camera scanning delay
			await new Promise((resolve) => setTimeout(resolve, 1500))

			// Use the QR code service to scan
			const scanData = await scanQRCode(targetSessionId, {
				challenge: undefined // Optional challenge
			})

			// Transform service response to expected format
			const scanResult: QRScanResult = {
				session_id: scanData.session_id,
				client_name: scanData.client_info?.name || 'Unknown Client',
				client_description: scanData.client_info?.description,
				client_logo: scanData.client_info?.logo_uri,
				scope: Array.isArray(scanData.requested_scope) ? scanData.requested_scope.join(' ') : 'openid profile',
				redirect_uri: scanData.client_info?.client_uri || '',
				expires_at: scanData.expires_at,
				status: 'scanned',
			}

			setScanResult(scanResult)
			setManualSessionId('') // Clear manual input
		} catch (error) {
			console.error('QR scan service failed:', error)
			setError(error instanceof Error ? error.message : 'Failed to scan QR code. Please check if the session ID is valid and backend is running.')
		} finally {
			setIsScanning(false)
		}
	}

	// Handle QR code file upload (for desktop demo)
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		// In a real app, you'd use a QR code reader library
		// For demo, we'll extract session ID from filename or try to parse QR content
		const fileName = file.name

		// Try to extract session ID from filename pattern
		const sessionId = qrService.extractSessionId(fileName)

		// If no session ID in filename, prompt user to enter manually
		if (!sessionId) {
			// Create a file reader to potentially extract from QR code content
			const reader = new FileReader()
			reader.onload = (e) => {
				const text = e.target?.result as string
				// Simple pattern matching for auth3:// URLs
				const match = text.match(/auth3:\/\/qr\/([a-f0-9]{32})/)
				if (match) {
					simulateQRScan(match[1])
				} else {
					setError('Could not extract session ID from QR code. Please enter session ID manually.')
				}
			}
			reader.readAsText(file)
		} else {
			simulateQRScan(sessionId)
		}
	}

	// Authorize login
	const authorizeLogin = async (approved: boolean) => {
		if (!scanResult) return

		setAuthorizing(true)
		setError(null)

		try {
			if (approved) {
				// Use authorize service
				const responseData = await authorizeQRCode(scanResult.session_id, {
					approved: true,
					scopes: scanResult.scope.split(' '),
					user_info: currentUser ? {
						id: currentUser.id,
						email: currentUser.email,
						first_name: currentUser.name.split(' ')[0],
						last_name: currentUser.name.split(' ').slice(1).join(' '),
					} : undefined,
				})

				// Transform service response to expected format
				const result: QRAuthorizeResult = {
					success: true,
					message: 'Login request approved successfully!',
					auth_code: responseData.auth_code,
					redirect_uri: responseData.redirect_uri,
				}

				setSuccess(result)
			} else {
				// Use reject service
				await rejectQRCode(scanResult.session_id, 'User rejected login request')

				// Create success result for rejection
				const result: QRAuthorizeResult = {
					success: false,
					message: 'Login request rejected successfully',
				}

				setSuccess(result)
			}

			// Clear scan result after successful action
			setScanResult(null)
		} catch (error) {
			console.error('QR authorization service failed:', error)
			setError(error instanceof Error ? error.message : 'Failed to process authorization. Please try again.')
		} finally {
			setAuthorizing(false)
		}
	}

	const formatExpiry = (expiresAt: string): string => {
		return qrService.formatExpiryTime(expiresAt)
	}

	return (
		<div className='max-w-sm mx-auto space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen'>
			{/* Mobile Header */}
			<div className='bg-background border-b p-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Smartphone className='h-6 w-6 text-blue-600 dark:text-blue-400' />
						<span className='font-semibold text-foreground'>QR Scanner</span>
					</div>
					<div className='flex items-center gap-2'>
						<Wifi className={`h-4 w-4 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
						<div className='w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center'>
							<User className='h-4 w-4 text-white' />
						</div>
					</div>
				</div>
			</div>

			{/* User Info */}
			<Card className='mx-4'>
				<CardContent className='p-4'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
							<User className='h-5 w-5 text-blue-600 dark:text-blue-400' />
						</div>
						<div className='flex-1'>
							<p className='font-medium text-foreground'>{currentUser?.name || 'Loading...'}</p>
							<p className='text-sm text-muted-foreground'>{currentUser?.email || 'Loading...'}</p>
						</div>
						<div className='flex items-center gap-2'>
							<Badge variant='outline' className='text-xs'>
								Authenticated
							</Badge>
							<Button variant='ghost' size='sm' onClick={handleLogout} className='p-1 h-8 w-8' title='Logout'>
								<LogOut className='h-4 w-4' />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* QR Scanner */}
			<Card className='mx-4'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Camera className='h-5 w-5' />
						QR Code Login Scanner
					</CardTitle>
					<CardDescription>Scan or enter a session ID to authenticate login requests</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4'>
					{/* Manual Session ID Input */}
					<div className='space-y-2'>
						<Label htmlFor='sessionId'>Enter Session ID:</Label>
						<Input 
							id='sessionId' 
							placeholder='Enter session ID from QR login page...' 
							value={manualSessionId} 
							onChange={(e) => setManualSessionId(e.target.value)} 
							disabled={isScanning} 
						/>
					</div>

					{/* File Upload for Desktop Demo */}
					<div className='space-y-2'>
						<Label>Upload QR Code Image (Optional):</Label>
						<input 
							ref={fileInputRef} 
							type='file' 
							accept='image/*' 
							onChange={handleFileUpload} 
							className='block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50' 
							disabled={isScanning} 
						/>
					</div>

					<Separator />

					{/* Scan Button */}
					<Button onClick={() => simulateQRScan()} disabled={isScanning || !manualSessionId.trim()} className='w-full' size='lg'>
						{isScanning ? (
							<>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
								Scanning Session...
							</>
						) : (
							<>
								<QrCode className='h-4 w-4 mr-2' />
								Process Session ID
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{/* Error Display */}
			{error && (
				<div className='mx-4'>
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</div>
			)}

			{/* Success Display */}
			{success && (
				<div className='mx-4'>
					<Alert className='border-green-200 bg-green-50'>
						<CheckCircle className='h-4 w-4 text-green-600' />
						<AlertDescription className='text-green-800'>
							{success.message}
							{success.auth_code && <div className='mt-2 text-xs font-mono bg-white p-2 rounded border'>Auth Code: {success.auth_code}</div>}
						</AlertDescription>
					</Alert>
				</div>
			)}

			{/* Scan Result */}
			{scanResult && (
				<Card className='mx-4'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5 text-green-600 dark:text-green-400' />
							Login Request
						</CardTitle>
						<CardDescription>A website wants to authenticate with your account</CardDescription>
					</CardHeader>

					<CardContent className='space-y-4'>
						{/* Client Info */}
						<div className='space-y-3 p-3 bg-muted rounded-lg'>
							<div className='flex items-center gap-3'>
								{scanResult.client_logo ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={scanResult.client_logo} alt={scanResult.client_name} className='w-8 h-8 rounded' />
								) : (
									<div className='w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
										<QrCode className='h-4 w-4 text-blue-600 dark:text-blue-400' />
									</div>
								)}
								<div>
									<p className='font-medium text-foreground'>{scanResult.client_name}</p>
									{scanResult.client_description && <p className='text-sm text-muted-foreground'>{scanResult.client_description}</p>}
								</div>
							</div>
						</div>

						{/* Permissions */}
						<div className='space-y-2'>
							<Label>Requested Permissions:</Label>
							<div className='flex flex-wrap gap-1'>
								{scanResult.scope.split(' ').map((scope, index) => (
									<Badge key={index} variant='secondary'>
										{scope}
									</Badge>
								))}
							</div>
						</div>

						{/* Expiry */}
						<div className='flex items-center gap-2 text-sm text-muted-foreground'>
							<Clock className='h-4 w-4' />
							{formatExpiry(scanResult.expires_at)}
						</div>

						{/* Action Buttons */}
						<div className='grid grid-cols-2 gap-3 pt-2'>
							<Button variant='outline' onClick={() => authorizeLogin(false)} disabled={authorizing} className='flex items-center gap-2'>
								<XCircle className='h-4 w-4' />
								Deny
							</Button>

							<Button onClick={() => authorizeLogin(true)} disabled={authorizing} className='flex items-center gap-2'>
								{authorizing ? <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div> : <CheckCircle className='h-4 w-4' />}
								Approve
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Help Text */}
			<div className='mx-4 text-center text-sm text-muted-foreground pb-4'>
				<p>Enter a session ID from any Auth3 QR login page</p>
				<p className='mt-1'>Or upload a QR code image to extract the session ID</p>
				<p className='mt-2 text-xs text-blue-600 dark:text-blue-400'>
					✅ Connected to Auth3 backend via service API
				</p>
			</div>
		</div>
	)
}
