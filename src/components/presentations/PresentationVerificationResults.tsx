'use client'

import {CheckCircle, AlertTriangle, XCircle, Shield, Clock, Hash, User} from 'lucide-react'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'

import type {VerifyPresentationResponse, EnhancedVerificationResponse, VerifiablePresentation} from '@/types/presentations'

interface PresentationVerificationResultsProps {
	results: VerifyPresentationResponse | EnhancedVerificationResponse
	presentation?: VerifiablePresentation // Made optional since it's not used
	onClose?: () => void
	className?: string
}

/**
 * PresentationVerificationResults Component - Display verification results
 *
 * Features:
 * - Overall verification status
 * - Detailed step-by-step results
 * - Trust score visualization
 * - Error and warning messages
 * - Compliance indicators
 * - Issuer trust information
 */
export function PresentationVerificationResults({
	results,
	presentation, // Keep for future use
	onClose, // Keep for future use
	className = '',
}: PresentationVerificationResultsProps) {
	const isEnhanced = 'trustScore' in results
	const overallValid = results.valid
	// Trust score is now a value between 0 and 1 (not percent)
	const trustScore = isEnhanced ? results.trustScore : 0

	// Get the presentation results - different property names for different response types
	const presentationResults = isEnhanced ? (results as EnhancedVerificationResponse).presentationResults : (results as VerifyPresentationResponse).verificationResults

	// Get trust score color (score: 0-1)
	const getTrustScoreColor = (score: number) => {
		if (score >= 0.9) return 'text-green-600'
		if (score >= 0.7) return 'text-blue-600'
		if (score >= 0.5) return 'text-yellow-600'
		return 'text-red-600'
	}

	// Get verification step status
	const getStepStatus = (passed: boolean, hasWarnings: boolean = false) => {
		if (passed) {
			return hasWarnings ? {icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Warning'} : {icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Passed'}
		}
		return {icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed'}
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Overall Status */}
			<Card className={overallValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
				<CardHeader className='pb-3'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							{overallValid ? <CheckCircle className='h-8 w-8 text-green-600' /> : <XCircle className='h-8 w-8 text-red-600' />}
							<div>
								<CardTitle className={overallValid ? 'text-green-800' : 'text-red-800'}>Presentation {overallValid ? 'Valid' : 'Invalid'}</CardTitle>
								<CardDescription className={overallValid ? 'text-green-700' : 'text-red-700'}>{overallValid ? 'All verification checks passed successfully' : 'One or more verification checks failed'}</CardDescription>
							</div>
						</div>

						{/* Trust Score */}
						{isEnhanced && (
							<div className='text-center'>
								<div className={`text-2xl font-bold ${getTrustScoreColor(trustScore)}`}>{trustScore.toFixed(2)}</div>
								<div className='text-sm text-muted-foreground'>Trust Score (0-1)</div>
							</div>
						)}
					</div>
				</CardHeader>

				{isEnhanced && (
					<CardContent className='pt-0'>
						<div className='space-y-2'>
							<div className='flex justify-between text-sm text-muted-foreground'>
								<span>Trust Score</span>
								<span className={getTrustScoreColor(trustScore)}>{trustScore.toFixed(2)}</span>
							</div>
							<Progress value={trustScore * 100} max={100} className='h-2' />
							<div className='text-xs text-muted-foreground'>Based on signature validity, issuer trust, and compliance checks</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Verification Steps */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Verification Steps
					</CardTitle>
					<CardDescription>Detailed results for each verification check</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{/* Signature Verification */}
						{presentationResults?.signatureValid !== undefined && (
							<div className='flex items-center gap-3'>
								{(() => {
									const status = getStepStatus(presentationResults.signatureValid)
									const StatusIcon = status.icon
									return (
										<>
											<div className={`p-2 rounded-full ${status.bg}`}>
												<StatusIcon className={`h-4 w-4 ${status.color}`} />
											</div>
											<div className='flex-1'>
												<div className='font-medium'>Cryptographic Signature</div>
												<div className='text-sm text-muted-foreground'>{presentationResults.signatureValid ? 'Digital signature is valid and authentic' : 'Digital signature verification failed'}</div>
											</div>
											<Badge variant={presentationResults.signatureValid ? 'default' : 'destructive'}>{status.label}</Badge>
										</>
									)
								})()}
							</div>
						)}

						{/* Credential Verification */}
						{results.credentialResults && results.credentialResults.length > 0 && (
							<>
								<Separator />
								<div className='space-y-3'>
									<div className='font-medium text-sm'>Individual Credential Results</div>
									{results.credentialResults.map((credResult, index) => (
										<div key={index} className='ml-4 space-y-2'>
											<div className='flex items-center gap-2'>
												<Badge variant='outline' className='text-xs'>
													Credential #{index + 1}
												</Badge>
												{credResult.credentialID && <span className='text-xs font-mono text-muted-foreground'>{credResult.credentialID.slice(0, 16)}...</span>}
											</div>

											<div className='grid grid-cols-2 gap-2 text-xs'>
												<div className='flex items-center gap-1'>
													<div className={`w-2 h-2 rounded-full ${credResult.results.signatureValid ? 'bg-green-500' : 'bg-red-500'}`} />
													<span>Signature</span>
												</div>
												<div className='flex items-center gap-1'>
													<div className={`w-2 h-2 rounded-full ${credResult.results.notRevoked ? 'bg-green-500' : 'bg-red-500'}`} />
													<span>Not Revoked</span>
												</div>
												<div className='flex items-center gap-1'>
													<div className={`w-2 h-2 rounded-full ${credResult.results.notExpired ? 'bg-green-500' : 'bg-red-500'}`} />
													<span>Not Expired</span>
												</div>
												<div className='flex items-center gap-1'>
													<div className={`w-2 h-2 rounded-full ${credResult.results.issuerTrusted ? 'bg-green-500' : 'bg-red-500'}`} />
													<span>Trusted Issuer</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</>
						)}

						{/* Enhanced Verification Details */}
						{isEnhanced && (
							<>
								<Separator />
								<div className='space-y-3'>
									<div className='font-medium text-sm'>Enhanced Verification</div>

									{/* Challenge & Domain */}
									{(presentationResults.challengeValid !== undefined || presentationResults.domainValid !== undefined) && (
										<div className='grid grid-cols-2 gap-4'>
											{presentationResults.challengeValid !== undefined && (
												<div className='flex items-center gap-2'>
													<Hash className='h-4 w-4 text-muted-foreground' />
													<span className='text-sm'>Challenge:</span>
													<Badge variant={presentationResults.challengeValid ? 'default' : 'destructive'} className='text-xs'>
														{presentationResults.challengeValid ? 'Valid' : 'Invalid'}
													</Badge>
												</div>
											)}
											{presentationResults.domainValid !== undefined && (
												<div className='flex items-center gap-2'>
													<User className='h-4 w-4 text-muted-foreground' />
													<span className='text-sm'>Domain:</span>
													<Badge variant={presentationResults.domainValid ? 'default' : 'destructive'} className='text-xs'>
														{presentationResults.domainValid ? 'Valid' : 'Invalid'}
													</Badge>
												</div>
											)}
										</div>
									)}

									{/* Compliance Checks - Only show for enhanced verification */}
									{isEnhanced && (results as EnhancedVerificationResponse).policyResults && (
										<div className='space-y-2'>
											<div className='text-sm font-medium'>Policy Compliance</div>
											<div className='grid grid-cols-2 gap-2'>
												<Badge variant={(results as EnhancedVerificationResponse).policyResults!.policyValid ? 'default' : 'secondary'} className='text-xs'>
													Policy {(results as EnhancedVerificationResponse).policyResults!.policyValid ? '✓' : '✗'}
												</Badge>
											</div>
										</div>
									)}
								</div>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Errors and Warnings */}
			{(results.errors && results.errors.length > 0) || (results.warnings && results.warnings.length > 0) ? (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5' />
							Issues & Warnings
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{/* Errors */}
						{results.errors && results.errors.length > 0 && (
							<Alert variant='destructive'>
								<XCircle className='h-4 w-4' />
								<AlertDescription>
									<div className='font-medium mb-1'>Errors ({results.errors.length})</div>
									<ul className='list-disc list-inside text-sm space-y-1'>
										{results.errors.map((error, index) => (
											<li key={index}>{error}</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}

						{/* Warnings */}
						{results.warnings && results.warnings.length > 0 && (
							<Alert>
								<AlertTriangle className='h-4 w-4' />
								<AlertDescription>
									<div className='font-medium mb-1'>Warnings ({results.warnings.length})</div>
									<ul className='list-disc list-inside text-sm space-y-1'>
										{results.warnings.map((warning, index) => (
											<li key={index}>{warning}</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}
					</CardContent>
				</Card>
			) : null}

			{/* Verification Metadata */}
			{results.verifiedAt && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Clock className='h-5 w-5' />
							Verification Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-4 text-sm'>
							<div>
								<span className='text-muted-foreground'>Verified At:</span>
								<div className='font-mono'>{new Date(results.verifiedAt).toLocaleString()}</div>
							</div>

							{results.verificationRecordID && (
								<div>
									<span className='text-muted-foreground'>Record ID:</span>
									<div className='font-mono text-xs'>{results.verificationRecordID}</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
