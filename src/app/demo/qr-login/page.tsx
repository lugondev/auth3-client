'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {QRCodeLogin} from '@/components/auth/QRCodeLogin'
import {MobileQRDemo} from '@/components/demo/MobileQRDemo'
import {Monitor, Smartphone, QrCode, Settings, BarChart3, Code, Play, Users, Shield, Zap} from 'lucide-react'

interface DemoStats {
	total_sessions: number
	successful_logins: number
	active_demos: number
	avg_scan_time: number
}

export default function QRCodeDemoPage() {
	const [demoStats] = useState<DemoStats>({
		total_sessions: 1247,
		successful_logins: 1089,
		active_demos: 23,
		avg_scan_time: 3.2,
	})

	const features = [
		{
			icon: QrCode,
			title: 'QR Code Generation',
			description: 'Dynamic QR codes with OAuth2 session binding',
		},
		{
			icon: Smartphone,
			title: 'Mobile Authentication',
			description: 'Seamless mobile app integration for scanning',
		},
		{
			icon: Shield,
			title: 'Security Features',
			description: 'Session expiry, rate limiting, and audit logging',
		},
		{
			icon: Zap,
			title: 'Real-time Updates',
			description: 'Live status updates via polling mechanism',
		},
	]

	const codeExamples = {
		frontend: `// Generate QR Code for Login
const generateQRLogin = async () => {
  const response = await fetch('/api/v1/oauth2/qr/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: 'your-client-id',
      redirect_uri: 'https://your-app.com/callback',
      scope: 'openid profile email',
      state: 'random-state-value'
    })
  })
  
  const { session_id, qr_code, expires_at } = await response.json()
  // Display QR code and start polling
}`,

		mobile: `// Scan QR Code (Mobile App)
const scanQRCode = async (sessionId: string) => {
  const response = await fetch(\`/api/v1/oauth2/qr/scan/\${sessionId}\`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + userToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_info: 'iPhone 14 Pro',
      location: 'San Francisco, CA'
    })
  })
  
  const scanResult = await response.json()
  // Show authorization prompt to user
}`,

		backend: `// Go Backend Service
func (s *QRCodeService) GenerateQR(ctx context.Context, req *dto.QRCodeGenerateRequest) (*dto.QRCodeGenerateResponse, error) {
    // Create QR session
    session := &entities.QRCodeSession{
        ID:          uuid.New(),
        SessionID:   generateSecureID(),
        Status:      constants.QRCodeStatusPending,
        ClientID:    req.ClientID,
        RedirectURI: req.RedirectURI,
        Scope:       req.Scope,
        State:       req.State,
        ExpiresAt:   time.Now().Add(5 * time.Minute),
    }
    
    // Generate QR code image
    qrURL := fmt.Sprintf("auth3://qr/%s", session.SessionID)
    qrCode, err := qrcode.Encode(qrURL, qrcode.Medium, 256)
    
    return &dto.QRCodeGenerateResponse{
        SessionID: session.SessionID,
        QRCode:    base64.StdEncoding.EncodeToString(qrCode),
        ExpiresAt: session.ExpiresAt,
    }, nil
}`,
	}

	return (
		<div className='container mx-auto py-8 space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<h1 className='text-4xl font-bold text-foreground'>QR Code Login Demo</h1>
				<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>Experience seamless authentication with QR code scanning. Test the complete OAuth2 QR code login flow including web generation, mobile scanning, and admin controls.</p>

				{/* Demo Stats */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6'>
					<div className='text-center'>
						<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{demoStats.total_sessions.toLocaleString()}</div>
						<div className='text-sm text-muted-foreground'>Total Sessions</div>
					</div>
					<div className='text-center'>
						<div className='text-2xl font-bold text-green-600 dark:text-green-400'>{demoStats.successful_logins.toLocaleString()}</div>
						<div className='text-sm text-muted-foreground'>Successful Logins</div>
					</div>
					<div className='text-center'>
						<div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>{demoStats.active_demos}</div>
						<div className='text-sm text-muted-foreground'>Active Demos</div>
					</div>
					<div className='text-center'>
						<div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>{demoStats.avg_scan_time}s</div>
						<div className='text-sm text-muted-foreground'>Avg Scan Time</div>
					</div>
				</div>
			</div>

			{/* Features Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{features.map((feature, index) => (
					<Card key={index}>
						<CardContent className='p-6'>
							<div className='flex items-center gap-3 mb-3'>
								<div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
									<feature.icon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
								</div>
								<h3 className='font-semibold text-foreground'>{feature.title}</h3>
							</div>
							<p className='text-sm text-muted-foreground'>{feature.description}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Interactive Demo */}
			<Tabs defaultValue='web' className='space-y-6'>
				<div className='flex items-center justify-center'>
					<TabsList className='grid w-full max-w-md grid-cols-2'>
						<TabsTrigger value='web' className='flex items-center gap-1'>
							<Monitor className='h-4 w-4' />
							Web
						</TabsTrigger>
						<TabsTrigger value='mobile' className='flex items-center gap-1'>
							<Smartphone className='h-4 w-4' />
							Mobile
						</TabsTrigger>
					</TabsList>
				</div>

				{/* Web Demo */}
				<TabsContent value='web' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Monitor className='h-5 w-5' />
								Web Application Demo
							</CardTitle>
							<CardDescription>Generate QR codes for user authentication on your website</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
								<div>
									<QRCodeLogin clientId='fd59567ebd2e98e5cd72e29e38cfaed8' redirectUri='http://localhost:3002/auth/callback' onSuccess={(data) => console.log('Login success:', data)} onError={(error) => console.error('Login error:', error)} />
								</div>
								<div className='space-y-4'>
									<h4 className='font-semibold text-foreground'>How it works:</h4>
									<ol className='list-decimal list-inside space-y-2 text-sm text-muted-foreground'>
										<li>Click "Generate QR Code" to create a new login session</li>
										<li>The QR code contains a secure session identifier</li>
										<li>Users scan the code with their mobile Auth3 app</li>
										<li>After approval, the web page receives an authorization code</li>
										<li>Exchange the code for access tokens to complete login</li>
									</ol>

									<div className='mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
										<div className='flex items-center gap-2 mb-2'>
											<Badge variant='default'>Features</Badge>
										</div>
										<ul className='text-sm space-y-1 text-muted-foreground'>
											<li>• Auto-refresh QR codes every 5 minutes</li>
											<li>• Real-time status updates via polling</li>
											<li>• Automatic expiry and cleanup</li>
											<li>• Mobile-optimized scanning experience</li>
										</ul>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Mobile Demo */}
				<TabsContent value='mobile' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Smartphone className='h-5 w-5' />
								Mobile Application Demo
							</CardTitle>
							<CardDescription>Simulate the mobile app experience for scanning QR codes</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
								<div className='flex justify-center'>
									<div className='w-full max-w-sm'>
										<MobileQRDemo />
									</div>
								</div>
								<div className='space-y-4'>
									<h4 className='font-semibold text-foreground'>Mobile App Features:</h4>
									<ul className='space-y-2 text-sm text-muted-foreground'>
										<li className='flex items-center gap-2'>
											<Users className='h-4 w-4 text-blue-600 dark:text-blue-400' />
											User profile and authentication status
										</li>
										<li className='flex items-center gap-2'>
											<QrCode className='h-4 w-4 text-green-600 dark:text-green-400' />
											Camera-based QR code scanning
										</li>
										<li className='flex items-center gap-2'>
											<Shield className='h-4 w-4 text-purple-600 dark:text-purple-400' />
											Secure authorization with user consent
										</li>
										<li className='flex items-center gap-2'>
											<Play className='h-4 w-4 text-orange-600 dark:text-orange-400' />
											Real-time session management
										</li>
									</ul>

									<div className='mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg'>
										<div className='flex items-center gap-2 mb-2'>
											<Badge variant='default' className='bg-green-600 dark:bg-green-700'>
												Demo Instructions
											</Badge>
										</div>
										<ol className='text-sm space-y-1 text-muted-foreground'>
											<li>1. Generate a QR code in the Web tab</li>
											<li>2. Copy the session ID from the QR code</li>
											<li>3. Paste it here or upload a QR image</li>
											<li>4. Approve or deny the login request</li>
										</ol>
									</div>

									<div className='mt-4'>
										<Link href='/qr-scan' target='_blank'>
											<Button className='w-full'>
												<Smartphone className='h-4 w-4 mr-2' />
												Open Mobile QR Scanner
											</Button>
										</Link>
										<p className='text-xs text-muted-foreground mt-2 text-center'>Opens in a new tab to simulate mobile app experience</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Code Examples */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Code className='h-5 w-5' />
						Integration Examples
					</CardTitle>
					<CardDescription>Sample code for integrating QR code authentication in your applications</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue='frontend' className='space-y-4'>
						<TabsList>
							<TabsTrigger value='frontend'>Frontend</TabsTrigger>
							<TabsTrigger value='mobile'>Mobile</TabsTrigger>
							<TabsTrigger value='backend'>Backend</TabsTrigger>
						</TabsList>

						<TabsContent value='frontend'>
							<pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
								<code className='text-foreground'>{codeExamples.frontend}</code>
							</pre>
						</TabsContent>

						<TabsContent value='mobile'>
							<pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
								<code className='text-foreground'>{codeExamples.mobile}</code>
							</pre>
						</TabsContent>

						<TabsContent value='backend'>
							<pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
								<code className='text-foreground'>{codeExamples.backend}</code>
							</pre>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Footer */}
			<div className='text-center text-muted-foreground space-y-2'>
				<Separator className='my-8' />
				<p>This demo showcases the complete QR code login integration</p>
				<p className='text-sm'>Built with Auth3 OAuth2 system • Next.js • Go Fiber • PostgreSQL</p>
			</div>
		</div>
	)
}
