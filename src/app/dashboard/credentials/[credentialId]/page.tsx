'use client'

import React, {useState, useEffect} from 'react'
import {useParams, useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {ArrowLeft, Download, Share2, Shield, Clock, User, Building, FileText, History, Copy, ExternalLink, AlertTriangle, CheckCircle, XCircle} from 'lucide-react'
import {toast} from 'sonner'
import {VerifiableCredential, CredentialStatus, VerifyCredentialOutput, VerificationResults as VerificationResultsType} from '@/types/credentials'
import {getVerificationHistory} from '@/services/verificationReportService'
import {CredentialViewer, CredentialVerificationResultModal} from '@/components/credentials'
import {RevocationHistory} from '@/components/credentials/RevocationHistory'
import {AdvancedVerificationFlow} from '@/components/credentials/AdvancedVerificationFlow'
import {RevocationButton} from '@/components/credentials/RevocationButton'
import * as vcService from '@/services/vcService'

/**
 * Credential Details Page Component
 * Displays comprehensive information about a specific verifiable credential
 */
export default function CredentialDetailsPage() {
	const params = useParams()
	const router = useRouter()
	const credentialId = params.credentialId as string

	// State management
	const [credential, setCredential] = useState<VerifiableCredential | null>(null)
	const [verificationHistory, setVerificationHistory] = useState<VerifyCredentialOutput[]>([])
	const [loading, setLoading] = useState(true)
	const [verifying, setVerifying] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState('overview')
	const [showResultModal, setShowResultModal] = useState(false)
	const [currentVerificationResult, setCurrentVerificationResult] = useState<VerifyCredentialOutput | null>(null)
	const [credentialStatus, setCredentialStatus] = useState<CredentialStatus>(CredentialStatus.ACTIVE)

	/**
	 * Load credential details and verification history
	 */
	useEffect(() => {
		const loadCredentialDetails = async () => {
			try {
				setLoading(true)
				setError(null)

				// Load credential details
				const credentialResponse = await vcService.getCredential({credentialId})
				setCredential(credentialResponse)

				// Load verification history from API
				try {
					const historyResponse = await getVerificationHistory({resource_id: credentialId, resource_type: 'credential'})
					// Map VerificationHistory[] to VerifyCredentialOutput[]
					const mapped = (historyResponse.data || []).map((item) => {
						return {
							valid: item.result?.valid || false,
							verificationResults: item.result ?? ({} as VerificationResultsType),
							errors: item.errorMessage ? [item.errorMessage] : [],
							warnings: [],
							verifiedAt: item.verifiedAt || item.createdAt,
						}
					})
					setVerificationHistory(mapped)
				} catch {
					setVerificationHistory([])
				}
			} catch (err) {
				console.error('Error loading credential details:', err)
				setError('Failed to load credential details')
			} finally {
				setLoading(false)
			}
		}

		if (credentialId) {
			loadCredentialDetails()
		}
	}, [credentialId])

	/**
	 * Handle credential verification
	 */
	const handleVerifyCredential = async (e?: React.MouseEvent) => {
		if (e) e.preventDefault()
		if (!credential) return

		try {
			setVerifying(true)
			// Clean the credential to remove database fields before verification
			const cleanCredential = vcService.cleanCredentialForVerification(credential)
			const result = await vcService.verifyCredential({
				credential: cleanCredential,
				verifySignature: true,
				verifyExpiration: true,
				verifyRevocation: false,
				verifyIssuer: true,
			})

			// Add new verification to history
			setVerificationHistory((prev) => [result, ...prev])

			// Show result in modal
			setCurrentVerificationResult(result)
			setShowResultModal(true)

			toast.success('Credential verified successfully')
		} catch (err) {
			console.error('Error verifying credential:', err)
			toast.error('Failed to verify credential')
		} finally {
			setVerifying(false)
		}
	}

	/**
	 * Handle credential download
	 */
	const handleDownload = (e?: React.MouseEvent) => {
		if (e) e.preventDefault()
		if (!credential) return

		const dataStr = JSON.stringify(credential, null, 2)
		const dataBlob = new Blob([dataStr], {type: 'application/json'})
		const url = URL.createObjectURL(dataBlob)
		const link = document.createElement('a')
		link.href = url
		link.download = `credential-${credentialId}.json`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)

		toast.success('Credential downloaded successfully')
	}

	/**
	 * Handle credential sharing
	 */
	const handleShare = async (e?: React.MouseEvent) => {
		if (e) e.preventDefault()
		if (!credential) return

		try {
			const shareUrl = `${window.location.origin}/credentials/view/${credentialId}`
			await navigator.clipboard.writeText(shareUrl)
			toast.success('Share link copied to clipboard')
		} catch (err) {
			console.log('Error copying share link to clipboard:', err)
			toast.error('Failed to copy share link')
		}
	}

	/**
	 * Handle credential revocation
	 */
	const handleRevoke = async (revokedCredentialId: string) => {
		if (revokedCredentialId === credentialId) {
			setCredentialStatus(CredentialStatus.REVOKED)
			toast.success('Credential revoked successfully')
			// Optionally reload the credential data
			setTimeout(() => {
				window.location.reload()
			}, 1500)
		}
	}

	/**
	 * Copy credential ID to clipboard
	 */
	const copyCredentialId = async (e?: React.MouseEvent) => {
		if (e) e.preventDefault()
		try {
			await navigator.clipboard.writeText(credentialId)
			toast.success('Credential ID copied to clipboard')
		} catch (err) {
			console.log('Error copying credential ID to clipboard:', err)
			toast.error('Failed to copy credential ID')
		}
	}

	/**
	 * Get status badge color
	 */
	const getStatusColor = (status: CredentialStatus) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800'
			case 'expired':
				return 'bg-red-100 text-red-800'
			case 'revoked':
				return 'bg-gray-100 text-gray-800'
			case 'suspended':
				return 'bg-yellow-100 text-yellow-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	/**
	 * Format date for display
	 */
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	if (loading) {
		return (
			<div className='container mx-auto p-6'>
				<div className='flex items-center justify-center h-64'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
				</div>
			</div>
		)
	}

	if (error || !credential) {
		return (
			<div className='container mx-auto p-6'>
				<Alert className='max-w-md mx-auto'>
					<AlertTriangle className='h-4 w-4' />
					<AlertDescription>{error || 'Credential not found'}</AlertDescription>
				</Alert>
				<div className='flex justify-center mt-4'>
					<Button
						onClick={(e) => {
							e.preventDefault()
							router.back()
						}}
						variant='outline'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Go Back
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto p-6 space-y-6'>
			{/* Header */}
			<div className='space-y-4'>
				{/* Title Row */}
				<div className='flex items-center space-x-4'>
					<Button
						onClick={(e) => {
							e.preventDefault()
							router.back()
						}}
						variant='ghost'
						size='sm'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back
					</Button>
					<div>
						<h1 className='text-2xl font-bold'>Credential Details</h1>
						<div className='flex items-center space-x-2 text-sm text-gray-600'>
							<span>ID: {credentialId}</span>
							<Button onClick={copyCredentialId} variant='ghost' size='sm' className='h-auto p-1'>
								<Copy className='h-3 w-3' />
							</Button>
						</div>
					</div>
				</div>

				{/* Action Buttons Row */}
				<div className='flex items-center space-x-2'>
					<Button onClick={handleVerifyCredential} disabled={verifying} variant='outline'>
						<Shield className='h-4 w-4 mr-2' />
						{verifying ? 'Verifying...' : 'Quick Verify'}
					</Button>
					<Button onClick={handleDownload} variant='outline'>
						<Download className='h-4 w-4 mr-2' />
						Download
					</Button>
					<Button onClick={handleShare} variant='outline'>
						<Share2 className='h-4 w-4 mr-2' />
						Share
					</Button>
					{credential && credentialStatus === CredentialStatus.ACTIVE && <RevocationButton credential={credential} variant='button' onRevoked={handleRevoke} />}
				</div>
			</div>

			{/* Status Overview */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center space-x-2'>
								<FileText className='h-5 w-5' />
								<span>{credential.type?.[1] || 'Verifiable Credential'}</span>
							</CardTitle>
							<CardDescription>Issued by {typeof credential.issuer === 'object' ? credential.issuer?.name || credential.issuer?.id : credential.issuer || 'Unknown Issuer'}</CardDescription>
						</div>
						<Badge className={getStatusColor(CredentialStatus.ACTIVE)}>Active</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='flex items-center space-x-2'>
							<Clock className='h-4 w-4 text-gray-500' />
							<div>
								<p className='text-sm font-medium'>Issued</p>
								<p className='text-sm text-gray-600'>{formatDate(credential.issuedAt)}</p>
							</div>
						</div>

						{credential.expirationDate && (
							<div className='flex items-center space-x-2'>
								<Clock className='h-4 w-4 text-gray-500' />
								<div>
									<p className='text-sm font-medium'>Expires</p>
									<p className='text-sm text-gray-600'>{formatDate(credential.expirationDate)}</p>
								</div>
							</div>
						)}

						<div className='flex items-center space-x-2'>
							<User className='h-4 w-4 text-gray-500' />
							<div>
								<p className='text-sm font-medium'>Subject</p>
								<p className='text-sm text-gray-600'>{credential.credentialSubject?.id || 'N/A'}</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Detailed Information Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-5'>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='credential'>Credential</TabsTrigger>
					<TabsTrigger value='advanced'>Advanced Verify</TabsTrigger>
					<TabsTrigger value='revocation'>Revocation</TabsTrigger>
					<TabsTrigger value='history'>History</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value='overview' className='space-y-4'>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
						{/* Issuer Information */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center space-x-2'>
									<Building className='h-5 w-5' />
									<span>Issuer Information</span>
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div>
									<p className='text-sm font-medium'>Name</p>
									<p className='text-sm text-gray-600'>{typeof credential.issuer === 'object' ? credential.issuer?.name : credential.issuer || 'Not specified'}</p>
								</div>
								<div>
									<p className='text-sm font-medium'>DID</p>
									<p className='text-sm text-gray-600 break-all'>{typeof credential.issuer === 'object' ? credential.issuer?.id : credential.issuer}</p>
								</div>
								{typeof credential.issuer === 'object' && credential.issuer?.url && (
									<div>
										<p className='text-sm font-medium'>Website</p>
										<a href={credential.issuer.url} target='_blank' rel='noopener noreferrer' className='text-sm text-blue-600 hover:underline flex items-center space-x-1'>
											<span>{credential.issuer.url}</span>
											<ExternalLink className='h-3 w-3' />
										</a>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Subject Information */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center space-x-2'>
									<User className='h-5 w-5' />
									<span>Subject Information</span>
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div>
									<p className='text-sm font-medium'>Subject ID</p>
									<p className='text-sm text-gray-600 break-all'>{credential.credentialSubject?.id || credential.subjectDID || 'Not specified'}</p>
								</div>
								{Object.entries(credential.credentialSubject || {}).map(([key, value]) => {
									if (key === 'id') return null
									return (
										<div key={key}>
											<p className='text-sm font-medium capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
											<p className='text-sm text-gray-600'>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
										</div>
									)
								})}
							</CardContent>
						</Card>
					</div>

					{/* Credential Schema */}
					{credential.credentialSchema && (
						<Card>
							<CardHeader>
								<CardTitle>Credential Schema</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									<div>
										<p className='text-sm font-medium'>Schema ID</p>
										<p className='text-sm text-gray-600 break-all'>{credential.credentialSchema?.id || 'Not specified'}</p>
									</div>
									<div>
										<p className='text-sm font-medium'>Type</p>
										<p className='text-sm text-gray-600'>{credential.credentialSchema?.type || 'Not specified'}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Credential Tab */}
				<TabsContent value='credential'>
					<CredentialViewer credential={credential} />
				</TabsContent>

				{/* Advanced Verification Tab */}
				<TabsContent value='advanced'>
					<AdvancedVerificationFlow
						credential={credential}
						onVerificationComplete={(result) => {
							setVerificationHistory((prev) => [result, ...prev])
						}}
					/>
				</TabsContent>

				{/* Revocation Tab */}
				<TabsContent value='revocation'>
					<RevocationHistory credentialId={credentialId} />
				</TabsContent>

				{/* History Tab */}
				<TabsContent value='history'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center space-x-2'>
								<History className='h-5 w-5' />
								<span>Verification History</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{verificationHistory.length > 0 ? (
								<ScrollArea className='h-64'>
									<div className='space-y-4'>
										{verificationHistory.map((result, index) => {
											// Calculate score from individual boolean flags
											const checks = [result.verificationResults.signatureValid, result.verificationResults.notExpired, result.verificationResults.notRevoked, result.verificationResults.issuerTrusted, result.verificationResults.schemaValid, result.verificationResults.proofValid]
											const passedChecks = checks.filter((check) => check === true).length
											const score = Math.round((passedChecks / checks.length) * 100)

											return (
												<div key={index} className='border rounded-lg p-4'>
													<div className='flex items-center justify-between mb-2'>
														<div className='flex items-center space-x-2'>
															{result.valid ? <CheckCircle className='h-4 w-4 text-green-600' /> : <XCircle className='h-4 w-4 text-red-600' />}
															<span className='font-medium'>{result.valid ? 'Valid' : 'Invalid'}</span>
															<Badge variant='outline'>Score: {score}%</Badge>
														</div>
														<span className='text-sm text-gray-600'>{formatDate(result.verifiedAt)}</span>
													</div>
													{result.verificationResults.message && <p className='text-sm text-gray-600'>Message: {result.verificationResults.message}</p>}
													<div className='text-sm text-gray-600 mt-1'>
														<p>
															Checks: {passedChecks}/{checks.length} passed
														</p>
													</div>
													{result.errors && result.errors.length > 0 && (
														<div className='text-sm text-red-600 mt-1'>
															<p>Errors: {result.errors.join(', ')}</p>
														</div>
													)}
												</div>
											)
										})}
									</div>
								</ScrollArea>
							) : (
								<div className='text-center py-8'>
									<History className='h-12 w-12 text-gray-400 mx-auto mb-4' />
									<p className='text-gray-600'>No verification history available</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Credential Verification Result Modal */}
			<CredentialVerificationResultModal isOpen={showResultModal} onClose={() => setShowResultModal(false)} results={currentVerificationResult} />
		</div>
	)
}
