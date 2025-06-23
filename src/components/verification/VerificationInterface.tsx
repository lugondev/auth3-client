import React, {useState, useCallback} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Upload, Shield, CheckCircle, XCircle, AlertTriangle, History, Loader2} from 'lucide-react'
import {toast} from 'sonner'
import {verifyPresentationEnhanced, getPresentationVerificationHistory} from '@/services/presentationService'
import {VerifiablePresentation, EnhancedVerificationRequest, EnhancedVerificationResponse, VerificationRecord} from '@/types/presentations'

interface VerificationInterfaceProps {
	className?: string
	onVerificationComplete?: (result: EnhancedVerificationResponse) => void
}

export function VerificationInterface({className = '', onVerificationComplete}: VerificationInterfaceProps) {
	const [activeTab, setActiveTab] = useState<'verify' | 'history'>('verify')
	const [isVerifying, setIsVerifying] = useState(false)
	const [verificationResult, setVerificationResult] = useState<EnhancedVerificationResponse | null>(null)
	const [presentationData, setPresentationData] = useState<VerifiablePresentation | null>(null)
	const [verificationHistory, setVerificationHistory] = useState<VerificationRecord[]>([])
	const [historyLoading, setHistoryLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	/**
	 * Load verification history for the current presentation
	 */
	const loadVerificationHistory = useCallback(async () => {
		if (!presentationData?.id) return

		try {
			setHistoryLoading(true)
			const response = await getPresentationVerificationHistory(presentationData.id)
			setVerificationHistory(response.records)
		} catch (err) {
			console.error('Error loading verification history:', err)
			toast.error('Failed to load verification history')
		} finally {
			setHistoryLoading(false)
		}
	}, [presentationData])

	/**
	 * Handle verification of a presentation
	 */
	const handleVerification = useCallback(async () => {
		if (!presentationData) {
			toast.error('No presentation data available')
			return
		}

		setIsVerifying(true)
		setError(null)

		try {
			const verificationRequest: EnhancedVerificationRequest = {
				presentation: presentationData,
				verificationOptions: {
					verifySignature: true,
					verifyExpiration: true,
					verifyRevocation: true,
					verifyIssuerTrust: true,
					verifySchema: true,
					verifyChallenge: true,
					verifyDomain: true,
					strictMode: false,
					recordVerification: true,
				},
				metadata: {
					userAgent: navigator.userAgent,
					timestamp: new Date().toISOString(),
				},
			}

			const result = await verifyPresentationEnhanced(verificationRequest)
			setVerificationResult(result)
			onVerificationComplete?.(result)

			if (result.valid) {
				toast.success('Presentation verified successfully')
				// Refresh history after verification
				loadVerificationHistory()
			} else {
				toast.error('Presentation verification failed')
			}
		} catch (error) {
			console.error('Verification error:', error)
			setError('Verification failed')
			toast.error('Verification failed')
		} finally {
			setIsVerifying(false)
		}
	}, [presentationData, onVerificationComplete, loadVerificationHistory])

	/**
	 * Handle file upload for presentation
	 */
	const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setError(null)

		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string
				const presentationJson = JSON.parse(content)
				setPresentationData(presentationJson)
				toast.success('Presentation loaded successfully')
			} catch (error) {
				console.error('File parsing error:', error)
				setError('Invalid presentation format')
				toast.error('Invalid presentation format')
			}
		}
		reader.readAsText(file)
	}, [])

	return (
		<div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Presentation Verification
					</CardTitle>
					<CardDescription>Upload and verify verifiable presentations</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'verify' | 'history')} className='w-full'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='verify' className='flex items-center gap-2'>
								<Shield className='h-4 w-4' />
								Verify
							</TabsTrigger>
							<TabsTrigger value='history' className='flex items-center gap-2'>
								<History className='h-4 w-4' />
								History
							</TabsTrigger>
						</TabsList>

						<TabsContent value='verify' className='space-y-4'>
							<div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
								<input type='file' onChange={handleFileUpload} accept='.json' className='hidden' id='file-upload' />
								<Upload className='h-12 w-12 mx-auto text-gray-400 mb-4' />
								<p className='text-sm text-gray-600 mb-4'>Upload a verifiable presentation file (JSON format)</p>
								<Button onClick={() => document.getElementById('file-upload')?.click()} variant='outline'>
									<Upload className='h-4 w-4 mr-2' />
									Choose File
								</Button>
							</div>

							{presentationData && (
								<div className='space-y-4'>
									<div className='p-4 bg-gray-50 rounded-lg'>
										<h3 className='font-medium'>Presentation Loaded</h3>
										<p className='text-sm text-gray-600'>Holder: {presentationData.holder}</p>
										<p className='text-sm text-gray-600'>Credentials: {presentationData.verifiableCredential?.length || 0}</p>
									</div>

									<Button onClick={handleVerification} disabled={isVerifying} className='w-full'>
										{isVerifying ? (
											<>
												<Loader2 className='h-4 w-4 animate-spin mr-2' />
												Verifying...
											</>
										) : (
											<>
												<Shield className='h-4 w-4 mr-2' />
												Verify Presentation
											</>
										)}
									</Button>
								</div>
							)}

							{error && (
								<Alert>
									<AlertTriangle className='h-4 w-4' />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{verificationResult && (
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											{verificationResult.valid ? <CheckCircle className='h-5 w-5 text-green-500' /> : <XCircle className='h-5 w-5 text-red-500' />}
											Verification {verificationResult.valid ? 'Successful' : 'Failed'}
											<Badge variant={verificationResult.valid ? 'default' : 'destructive'}>Trust Score: {(verificationResult.trustScore * 100).toFixed(1)}%</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent>
										{verificationResult.presentationResults && (
											<div className='grid grid-cols-2 gap-4'>
												<div className='flex items-center justify-between'>
													<span>Signature Valid:</span>
													<Badge variant={verificationResult.presentationResults.signatureValid ? 'default' : 'destructive'}>{verificationResult.presentationResults.signatureValid ? 'Yes' : 'No'}</Badge>
												</div>
												<div className='flex items-center justify-between'>
													<span>Holder Verified:</span>
													<Badge variant={verificationResult.presentationResults.holderVerified ? 'default' : 'destructive'}>{verificationResult.presentationResults.holderVerified ? 'Yes' : 'No'}</Badge>
												</div>
												<div className='flex items-center justify-between'>
													<span>Credentials Valid:</span>
													<Badge variant={verificationResult.presentationResults.credentialsValid ? 'default' : 'destructive'}>{verificationResult.presentationResults.credentialsValid ? 'Yes' : 'No'}</Badge>
												</div>
												<div className='flex items-center justify-between'>
													<span>Proof Valid:</span>
													<Badge variant={verificationResult.presentationResults.proofValid ? 'default' : 'destructive'}>{verificationResult.presentationResults.proofValid ? 'Yes' : 'No'}</Badge>
												</div>
											</div>
										)}

										{verificationResult.errors && verificationResult.errors.length > 0 && (
											<Alert className='mt-4'>
												<XCircle className='h-4 w-4' />
												<AlertDescription>
													<strong>Errors:</strong>
													<ul className='list-disc list-inside mt-1'>
														{verificationResult.errors.map((error, index) => (
															<li key={index}>{error}</li>
														))}
													</ul>
												</AlertDescription>
											</Alert>
										)}
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value='history' className='space-y-4'>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-medium'>Verification History</h3>
								<Button onClick={loadVerificationHistory} disabled={historyLoading || !presentationData} variant='outline' size='sm'>
									{historyLoading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <History className='h-4 w-4 mr-2' />}
									Refresh
								</Button>
							</div>

							{!presentationData ? (
								<div className='text-center py-8 text-gray-500'>Please load a presentation first</div>
							) : verificationHistory.length === 0 ? (
								<div className='text-center py-8 text-gray-500'>No verification history available</div>
							) : (
								<div className='space-y-2'>
									{verificationHistory.map((record) => (
										<Card key={record.id}>
											<CardContent className='p-4'>
												<div className='flex items-center justify-between'>
													<div>
														<p className='font-medium'>Verifier: {record.verifierDID || 'Anonymous'}</p>
														<p className='text-sm text-gray-600'>{new Date(record.verifiedAt).toLocaleString()}</p>
													</div>
													<div className='flex items-center gap-2'>
														<Badge variant={record.valid ? 'default' : 'destructive'}>{record.valid ? 'Valid' : 'Invalid'}</Badge>
														{record.trustScore && <Badge variant='outline'>Trust: {(record.trustScore * 100).toFixed(1)}%</Badge>}
													</div>
												</div>
												{record.errors && record.errors.length > 0 && <div className='mt-2 text-sm text-red-600'>Errors: {record.errors.join(', ')}</div>}
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
