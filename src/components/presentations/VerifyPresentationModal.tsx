'use client'

import React, {useState} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Checkbox} from '@/components/ui/checkbox'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Loader2, Eye, CheckCircle, XCircle} from 'lucide-react'
import {toast} from 'sonner'
import {verifyPresentation, verifyPresentationEnhanced} from '@/services/presentationService'
import {PresentationVerificationResults} from '@/components/presentations'
import type {VerifyPresentationRequest, VerifyPresentationResponse, EnhancedVerificationRequest, EnhancedVerificationResponse} from '@/types/presentations'

interface VerifyPresentationModalProps {
	isOpen: boolean
	onClose: () => void
	initialPresentation?: string
	className?: string
}

/**
 * VerifyPresentationModal Component - Modal for verifying presentations
 *
 * Features:
 * - JSON input for presentation data
 * - File upload support
 * - Basic and enhanced verification modes
 * - Configurable verification options
 * - Detailed verification results display
 * - Trust scoring and compliance checks
 */
export function VerifyPresentationModal({isOpen, onClose, initialPresentation = '', className = ''}: VerifyPresentationModalProps) {
	const [presentationJson, setPresentationJson] = useState(initialPresentation)
	const [verificationMode, setVerificationMode] = useState<'basic' | 'enhanced'>('basic')
	const [isVerifying, setIsVerifying] = useState(false)
	const [verificationResult, setVerificationResult] = useState<VerifyPresentationResponse | null>(null)
	const [enhancedResult, setEnhancedResult] = useState<EnhancedVerificationResponse | null>(null)
	const [showResults, setShowResults] = useState(false)

	// Verification options
	const [verificationOptions, setVerificationOptions] = useState({
		verifySignature: true,
		verifyExpiration: true,
		verifyRevocation: false,
		verifyIssuerTrust: true,
		verifySchema: true,
		verifyChallenge: false,
		verifyDomain: false,
		strictMode: false,
		recordVerification: true,
	})

	// Enhanced verification options
	const [enhancedOptions, setEnhancedOptions] = useState({
		challenge: '',
		domain: '',
		verifierDID: '',
		includeCredentialVerification: true,
		includeTrustScore: true,
		includeComplianceChecks: true,
		recordVerification: true,
	})

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.type.includes('json') && !file.name.endsWith('.json')) {
			toast.error('Please select a JSON file')
			return
		}

		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string
				// Validate JSON
				JSON.parse(content)
				setPresentationJson(content)
				toast.success('Presentation loaded successfully')
			} catch {
				toast.error('Invalid JSON file')
			}
		}
		reader.readAsText(file)
	}

	const validatePresentation = (presentationText: string) => {
		try {
			const presentation = JSON.parse(presentationText)

			if (!presentation.type || !Array.isArray(presentation.type)) {
				throw new Error('Missing or invalid type field')
			}

			if (!presentation.type.includes('VerifiablePresentation')) {
				throw new Error('Not a verifiable presentation')
			}

			if (!presentation.verifiableCredential || !Array.isArray(presentation.verifiableCredential)) {
				throw new Error('Missing or invalid verifiableCredential field')
			}

			return presentation
		} catch (error) {
			throw new Error(`Invalid presentation format: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}

	const handleBasicVerify = async () => {
		setIsVerifying(true)
		setVerificationResult(null)
		setEnhancedResult(null)

		try {
			const presentation = validatePresentation(presentationJson)

			const request: VerifyPresentationRequest = {
				presentation,
				...verificationOptions,
				challenge: verificationOptions.verifyChallenge ? enhancedOptions.challenge : undefined,
				domain: verificationOptions.verifyDomain ? enhancedOptions.domain : undefined,
			}

			const result = await verifyPresentation(request)
			setVerificationResult(result)

			if (result.valid) {
				toast.success('Presentation verification completed')
			} else {
				toast.error('Presentation verification failed')
			}

			// Show results in modal
			setShowResults(true)
		} catch (error) {
			console.error('Verification error:', error)
			toast.error(error instanceof Error ? error.message : 'Verification failed')
		} finally {
			setIsVerifying(false)
		}
	}

	const handleEnhancedVerify = async () => {
		setIsVerifying(true)
		setVerificationResult(null)
		setEnhancedResult(null)

		try {
			const presentation = validatePresentation(presentationJson)

			const request: EnhancedVerificationRequest = {
				presentation,
				...enhancedOptions,
				verificationOptions: {
					...verificationOptions,
					verifyChallenge: !!enhancedOptions.challenge,
					verifyDomain: !!enhancedOptions.domain,
				},
			}

			const result = await verifyPresentationEnhanced(request)
			setEnhancedResult(result)

			if (result.valid) {
				toast.success(`Presentation verified with trust score: ${result.trustScore}`)
			} else {
				toast.error('Enhanced verification failed')
			}

			// Show results in modal
			setShowResults(true)
		} catch (error) {
			console.error('Enhanced verification error:', error)
			toast.error(error instanceof Error ? error.message : 'Enhanced verification failed')
		} finally {
			setIsVerifying(false)
		}
	}

	const handleVerify = () => {
		if (verificationMode === 'enhanced') {
			handleEnhancedVerify()
		} else {
			handleBasicVerify()
		}
	}

	const handleClose = () => {
		if (!isVerifying) {
			setPresentationJson(initialPresentation)
			setVerificationResult(null)
			setEnhancedResult(null)
			setShowResults(false)
			onClose()
		}
	}

	const handleBackToVerify = () => {
		setShowResults(false)
		setVerificationResult(null)
		setEnhancedResult(null)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className={`sm:max-w-[1000px] max-h-[90vh] overflow-y-auto ${className}`}>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Eye className='h-5 w-5' />
						{showResults ? 'Verification Results' : 'Verify Verifiable Presentation'}
					</DialogTitle>
					<DialogDescription>{showResults ? 'View the verification results for your presentation' : 'Verify the authenticity and validity of a verifiable presentation using cryptographic validation.'}</DialogDescription>
				</DialogHeader>

				{showResults ? (
					/* Results View */
					<div className='space-y-6'>
						{/* Status Summary */}
						{(verificationResult || enhancedResult) && (
							<Card className={verificationResult?.valid || enhancedResult?.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											{verificationResult?.valid || enhancedResult?.valid ? <CheckCircle className='h-8 w-8 text-green-600' /> : <XCircle className='h-8 w-8 text-red-600' />}
											<div>
												<CardTitle className={verificationResult?.valid || enhancedResult?.valid ? 'text-green-800' : 'text-red-800'}>Presentation {verificationResult?.valid || enhancedResult?.valid ? 'Valid' : 'Invalid'}</CardTitle>
												<CardDescription className={verificationResult?.valid || enhancedResult?.valid ? 'text-green-700' : 'text-red-700'}>{verificationResult?.valid || enhancedResult?.valid ? 'All verification checks passed successfully' : 'One or more verification checks failed'}</CardDescription>
											</div>
										</div>

										{/* Trust Score for Enhanced */}
										{enhancedResult && (
											<div className='text-center'>
												<div className={`text-2xl font-bold ${enhancedResult.trustScore >= 90 ? 'text-green-600' : enhancedResult.trustScore >= 70 ? 'text-blue-600' : enhancedResult.trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{enhancedResult.trustScore.toFixed(1)}%</div>
												<div className='text-sm text-muted-foreground'>Trust Score</div>
											</div>
										)}
									</div>
								</CardHeader>
							</Card>
						)}

						{/* Detailed Results */}
						{verificationResult && <PresentationVerificationResults results={verificationResult} className='border-0 shadow-none bg-transparent' />}

						{enhancedResult && (
							<div className='space-y-4'>
								<PresentationVerificationResults results={enhancedResult} className='border-0 shadow-none bg-transparent' />

								{/* Enhanced Stats */}
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg'>
									<div className='text-center'>
										<div className='text-2xl font-bold text-blue-600'>{enhancedResult.trustScore.toFixed(1)}</div>
										<div className='text-sm text-muted-foreground'>Trust Score</div>
									</div>
									<div className='text-center'>
										<div className='text-2xl font-bold text-green-600'>{enhancedResult.credentialResults?.filter((r) => r.valid).length || 0}</div>
										<div className='text-sm text-muted-foreground'>Valid Credentials</div>
									</div>
									<div className='text-center'>
										<div className='text-2xl font-bold text-orange-600'>{enhancedResult.warnings?.length || 0}</div>
										<div className='text-sm text-muted-foreground'>Warnings</div>
									</div>
									<div className='text-center'>
										<div className='text-2xl font-bold text-red-600'>{enhancedResult.errors?.length || 0}</div>
										<div className='text-sm text-muted-foreground'>Errors</div>
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					/* Verification Form */

					<Tabs value={verificationMode} onValueChange={(value) => setVerificationMode(value as 'basic' | 'enhanced')}>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='basic'>Basic Verification</TabsTrigger>
							<TabsTrigger value='enhanced'>Enhanced Verification</TabsTrigger>
						</TabsList>

						<TabsContent value='basic' className='space-y-6'>
							{/* Presentation Input */}
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='presentation-json'>Presentation JSON</Label>
									<div>
										<Input type='file' accept='.json,application/json' onChange={handleFileUpload} className='w-auto' />
									</div>
								</div>
								<Textarea id='presentation-json' value={presentationJson} onChange={(e) => setPresentationJson(e.target.value)} placeholder='Paste your verifiable presentation JSON here...' rows={10} className='font-mono text-sm' />
							</div>

							{/* Verification Options */}
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Verification Options</CardTitle>
								</CardHeader>
								<CardContent className='space-y-3'>
									<div className='grid grid-cols-2 gap-4'>
										{Object.entries(verificationOptions).map(([key, value]) => (
											<div key={key} className='flex items-center space-x-2'>
												<Checkbox id={key} checked={value} onCheckedChange={(checked) => setVerificationOptions((prev) => ({...prev, [key]: checked}))} />
												<Label htmlFor={key} className='text-sm capitalize'>
													{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
												</Label>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value='enhanced' className='space-y-6'>
							{/* Presentation Input */}
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='presentation-json-enhanced'>Presentation JSON</Label>
									<div>
										<Input type='file' accept='.json,application/json' onChange={handleFileUpload} className='w-auto' />
									</div>
								</div>
								<Textarea id='presentation-json-enhanced' value={presentationJson} onChange={(e) => setPresentationJson(e.target.value)} placeholder='Paste your verifiable presentation JSON here...' rows={8} className='font-mono text-sm' />
							</div>

							{/* Enhanced Options */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<Card>
									<CardHeader>
										<CardTitle className='text-base'>Verification Context</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div>
											<Label htmlFor='challenge'>Challenge</Label>
											<Input id='challenge' value={enhancedOptions.challenge} onChange={(e) => setEnhancedOptions((prev) => ({...prev, challenge: e.target.value}))} placeholder='Verification challenge' />
										</div>
										<div>
											<Label htmlFor='domain'>Domain</Label>
											<Input id='domain' value={enhancedOptions.domain} onChange={(e) => setEnhancedOptions((prev) => ({...prev, domain: e.target.value}))} placeholder='Verification domain' />
										</div>
										<div>
											<Label htmlFor='verifier-did'>Verifier DID</Label>
											<Input id='verifier-did' value={enhancedOptions.verifierDID} onChange={(e) => setEnhancedOptions((prev) => ({...prev, verifierDID: e.target.value}))} placeholder='did:key:...' />
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className='text-base'>Enhanced Options</CardTitle>
									</CardHeader>
									<CardContent className='space-y-3'>
										{Object.entries(enhancedOptions)
											.filter(([key]) => !['challenge', 'domain', 'verifierDID'].includes(key))
											.map(([key, value]) => (
												<div key={key} className='flex items-center space-x-2'>
													<Checkbox id={`enhanced-${key}`} checked={value as boolean} onCheckedChange={(checked) => setEnhancedOptions((prev) => ({...prev, [key]: checked}))} />
													<Label htmlFor={`enhanced-${key}`} className='text-sm capitalize'>
														{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
													</Label>
												</div>
											))}
									</CardContent>
								</Card>
							</div>
						</TabsContent>
					</Tabs>
				)}

				<DialogFooter>
					{showResults ? (
						<>
							<Button type='button' variant='outline' onClick={handleBackToVerify}>
								Verify Another
							</Button>
							<Button type='button' onClick={handleClose}>
								Close
							</Button>
						</>
					) : (
						<>
							<Button type='button' variant='outline' onClick={handleClose} disabled={isVerifying}>
								Close
							</Button>
							<Button onClick={handleVerify} disabled={isVerifying || !presentationJson.trim()}>
								{isVerifying ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Verifying...
									</>
								) : (
									<>
										<Eye className='mr-2 h-4 w-4' />
										{verificationMode === 'enhanced' ? 'Enhanced Verify' : 'Verify'}
									</>
								)}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
