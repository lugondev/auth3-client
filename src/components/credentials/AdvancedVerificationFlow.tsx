'use client'

import {useState, useEffect} from 'react'
import {Shield, CheckCircle, XCircle, AlertTriangle, Clock, Eye, FileText, Zap, Fingerprint} from 'lucide-react'
import {toast} from 'sonner'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'
import {ScrollArea} from '@/components/ui/scroll-area'

import {verifyCredential} from '@/services/vcService'
import type {VerifiableCredential, VerifyCredentialOutput} from '@/types/credentials'

interface AdvancedVerificationProps {
	credential: VerifiableCredential
	onVerificationComplete?: (result: VerifyCredentialOutput) => void
	className?: string
}

interface VerificationStep {
	id: string
	name: string
	description: string
	status: 'pending' | 'processing' | 'completed' | 'failed'
	result?: boolean
	details?: string
	timestamp?: string
	duration?: number
}

interface VerificationContext {
	timestamp: string
	verifierDid?: string
	challenge?: string
	purpose?: string
	domain?: string
}

/**
 * AdvancedVerificationFlow Component - Enhanced verification with detailed steps
 *
 * Features:
 * - Step-by-step verification process
 * - Real-time verification progress
 * - Detailed verification results
 * - Historical verification context
 * - Trust level assessment
 * - Verification confidence score
 */
export function AdvancedVerificationFlow({
	credential,
	onVerificationComplete,
	className = ''
}: AdvancedVerificationProps) {
	const [isVerifying, setIsVerifying] = useState(false)
	const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([])
	const [verificationResult, setVerificationResult] = useState<VerifyCredentialOutput | null>(null)
	const [verificationContext, setVerificationContext] = useState<VerificationContext | null>(null)
	const [currentStep, setCurrentStep] = useState<string | null>(null)
	const [overallScore, setOverallScore] = useState<number>(0)

	// Initialize verification steps
	useEffect(() => {
		const steps: VerificationStep[] = [
			{
				id: 'signature',
				name: 'Signature Verification',
				description: 'Verifying cryptographic signature and issuer authenticity',
				status: 'pending'
			},
			{
				id: 'expiration',
				name: 'Expiration Check',
				description: 'Checking if credential is still valid and not expired',
				status: 'pending'
			},
			{
				id: 'revocation',
				name: 'Revocation Status',
				description: 'Checking credential revocation status against revocation lists',
				status: 'pending'
			},
			{
				id: 'issuer',
				name: 'Issuer Trust',
				description: 'Verifying issuer identity and trust level',
				status: 'pending'
			},
			{
				id: 'schema',
				name: 'Schema Validation',
				description: 'Validating credential structure against expected schema',
				status: 'pending'
			},
			{
				id: 'proof',
				name: 'Proof Verification',
				description: 'Verifying cryptographic proofs and integrity',
				status: 'pending'
			}
		]
		setVerificationSteps(steps)
	}, [credential])

	// Simulate step-by-step verification process
	const simulateVerificationStep = async (step: VerificationStep, result: boolean, details?: string): Promise<void> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const duration = Math.random() * 1000 + 500 // Random duration between 500-1500ms
				
				setVerificationSteps(prev => prev.map(s => 
					s.id === step.id 
						? {
							...s,
							status: 'processing',
							timestamp: new Date().toISOString()
						}
						: s
				))
				
				setTimeout(() => {
					setVerificationSteps(prev => prev.map(s => 
						s.id === step.id 
							? {
								...s,
								status: result ? 'completed' : 'failed',
								result,
								details,
								duration: Math.round(duration)
							}
							: s
					))
					resolve()
				}, duration)
			}, 200)
		})
	}

	// Start verification process
	const startVerification = async () => {
		setIsVerifying(true)
		setVerificationResult(null)
		setOverallScore(0)
		
		// Set verification context
		setVerificationContext({
			timestamp: new Date().toISOString(),
			verifierDid: 'did:web:verifier.example.com',
			challenge: `challenge-${Date.now()}`,
			purpose: 'authentication',
			domain: window.location.hostname
		})

		try {
			// Reset all steps to pending
			setVerificationSteps(prev => prev.map(step => ({
				...step,
				status: 'pending',
				result: undefined,
				details: undefined,
				timestamp: undefined,
				duration: undefined
			})))

			// Perform actual verification
			const result = await verifyCredential({credential})
			
			// Simulate each verification step with realistic results
			const steps = verificationSteps
			
			for (const step of steps) {
				setCurrentStep(step.id)
				
				let stepResult = false
				let details = ''
				
				switch (step.id) {
					case 'signature':
						stepResult = result.verificationResults.signatureValid
						details = stepResult 
							? 'Digital signature is valid and matches issuer public key'
							: 'Invalid or missing digital signature'
						break
					case 'expiration':
						stepResult = result.verificationResults.notExpired
						details = stepResult
							? 'Credential is within validity period'
							: 'Credential has expired or invalid dates'
						break
					case 'revocation':
						stepResult = result.verificationResults.notRevoked
						details = stepResult
							? 'Credential is not revoked'
							: 'Credential has been revoked by issuer'
						break
					case 'issuer':
						stepResult = result.verificationResults.issuerTrusted
						details = stepResult
							? 'Issuer is recognized and trusted'
							: 'Issuer identity could not be verified'
						break
					case 'schema':
						stepResult = result.verificationResults.schemaValid
						details = stepResult
							? 'Credential structure matches expected schema'
							: 'Invalid credential structure or missing required fields'
						break
					case 'proof':
						stepResult = result.verificationResults.proofValid
						details = stepResult
							? 'Cryptographic proofs are valid'
							: 'Invalid or missing cryptographic proofs'
						break
				}
				
				await simulateVerificationStep(step, stepResult, details)
			}

			// Calculate overall score based on successful steps
			const successfulSteps = steps.filter((_, index) => {
				const stepId = steps[index].id
				let stepResult = false
				
				switch (stepId) {
					case 'signature':
						stepResult = result.verificationResults.signatureValid
						break
					case 'expiration':
						stepResult = result.verificationResults.notExpired
						break
					case 'revocation':
						stepResult = result.verificationResults.notRevoked
						break
					case 'issuer':
						stepResult = result.verificationResults.issuerTrusted
						break
					case 'schema':
						stepResult = result.verificationResults.schemaValid
						break
					case 'proof':
						stepResult = result.verificationResults.proofValid
						break
				}
				return stepResult
			})
			const score = Math.round((successfulSteps.length / steps.length) * 100)
			setOverallScore(score)
			
			setVerificationResult(result)
			setCurrentStep(null)
			onVerificationComplete?.(result)
			
			if (result.valid) {
				toast.success('Credential verification completed successfully')
			} else {
				toast.error('Credential verification failed')
			}
			
		} catch (error) {
			console.error('Verification error:', error)
			toast.error('Verification process failed')
			
			// Mark current step as failed
			if (currentStep) {
				setVerificationSteps(prev => prev.map(s => 
					s.id === currentStep 
						? {
							...s,
							status: 'failed',
							details: error instanceof Error ? error.message : 'Unknown error'
						}
						: s
				))
			}
		} finally {
			setIsVerifying(false)
			setCurrentStep(null)
		}
	}

	// Get step icon
	const getStepIcon = (step: VerificationStep) => {
		switch (step.status) {
			case 'pending':
				return <Clock className="h-4 w-4 text-gray-400" />
			case 'processing':
				return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-600" />
			case 'failed':
				return <XCircle className="h-4 w-4 text-red-600" />
		}
	}

	// Get trust level based on score
	const getTrustLevel = (score: number) => {
		if (score >= 90) return { level: 'High', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' }
		if (score >= 70) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' }
		if (score >= 50) return { level: 'Low', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' }
		return { level: 'Very Low', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
	}

	const progress = verificationSteps.filter(s => s.status === 'completed' || s.status === 'failed').length / verificationSteps.length * 100
	const trustLevel = getTrustLevel(overallScore)

	return (
		<div className={className}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Advanced Verification
					</CardTitle>
					<CardDescription>
						Comprehensive step-by-step credential verification with detailed analysis
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Quick Actions */}
					<div className="flex gap-2">
						<Button 
							onClick={startVerification} 
							disabled={isVerifying}
							className="flex-1"
						>
							{isVerifying ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
									Verifying...
								</>
							) : (
								<>
									<Zap className="h-4 w-4 mr-2" />
									Start Verification
								</>
							)}
						</Button>
						
						{verificationResult && (
							<Button variant="outline" onClick={() => window.print()}>
								<FileText className="h-4 w-4 mr-2" />
								Report
							</Button>
						)}
					</div>

					{/* Progress Bar */}
					{isVerifying && (
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Verification Progress</span>
								<span>{Math.round(progress)}%</span>
							</div>
							<Progress value={progress} />
							{currentStep && (
								<div className="text-sm text-muted-foreground">
									Current: {verificationSteps.find(s => s.id === currentStep)?.name}
								</div>
							)}
						</div>
					)}

					{/* Overall Score */}
					{verificationResult && (
						<Alert className={trustLevel.bgColor}>
							<Shield className={`h-4 w-4 ${trustLevel.color}`} />
							<AlertDescription className={trustLevel.color}>
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium">Trust Level: {trustLevel.level}</div>
										<div className="text-sm">Verification Score: {overallScore}%</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold">{overallScore}/100</div>
									</div>
								</div>
							</AlertDescription>
						</Alert>
					)}

					{/* Verification Steps */}
					<Tabs defaultValue="steps" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="steps">Verification Steps</TabsTrigger>
							<TabsTrigger value="details">Detailed Results</TabsTrigger>
							<TabsTrigger value="context">Context</TabsTrigger>
						</TabsList>

						<TabsContent value="steps" className="space-y-3">
							<ScrollArea className="h-64">
								{verificationSteps.map((step, index) => (
									<div key={step.id} className="relative">
										{/* Timeline line */}
										{index < verificationSteps.length - 1 && (
											<div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
										)}
										
										<div className="flex items-start gap-3 pb-4">
											{/* Step icon */}
											<div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
												{getStepIcon(step)}
											</div>
											
											{/* Step content */}
											<div className="flex-1 space-y-1">
												<div className="flex items-center justify-between">
													<h4 className="font-medium">{step.name}</h4>
													{step.duration && (
														<span className="text-xs text-muted-foreground">
															{step.duration}ms
														</span>
													)}
												</div>
												<p className="text-sm text-muted-foreground">{step.description}</p>
												{step.details && (
													<p className={`text-sm ${step.result ? 'text-green-600' : 'text-red-600'}`}>
														{step.details}
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</ScrollArea>
						</TabsContent>

						<TabsContent value="details" className="space-y-3">
							{verificationResult ? (
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium">Overall Status</label>
											<div className="flex items-center gap-2 mt-1">
												{verificationResult.valid ? (
													<CheckCircle className="h-4 w-4 text-green-600" />
												) : (
													<XCircle className="h-4 w-4 text-red-600" />
												)}
												<span className={verificationResult.valid ? 'text-green-600' : 'text-red-600'}>
													{verificationResult.valid ? 'Valid' : 'Invalid'}
												</span>
											</div>
										</div>
										
										<div>
											<label className="text-sm font-medium">Verified At</label>
											<div className="text-sm text-muted-foreground mt-1">
												{new Date(verificationResult.verifiedAt).toLocaleString()}
											</div>
										</div>
									</div>

									{verificationResult.verificationResults.message && (
										<div>
											<label className="text-sm font-medium">Message</label>
											<p className="text-sm text-muted-foreground mt-1">
												{verificationResult.verificationResults.message}
											</p>
										</div>
									)}

									{verificationResult.errors && verificationResult.errors.length > 0 && (
										<div>
											<label className="text-sm font-medium text-red-600">Errors</label>
											<ul className="text-sm text-red-600 mt-1 space-y-1">
												{verificationResult.errors.map((error, index) => (
													<li key={index}>• {error}</li>
												))}
											</ul>
										</div>
									)}

									{verificationResult.warnings && verificationResult.warnings.length > 0 && (
										<div>
											<label className="text-sm font-medium text-yellow-600">Warnings</label>
											<ul className="text-sm text-yellow-600 mt-1 space-y-1">
												{verificationResult.warnings.map((warning, index) => (
													<li key={index}>• {warning}</li>
												))}
											</ul>
										</div>
									)}
								</div>
							) : (
								<div className="text-center py-8">
									<Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">Start verification to see detailed results</p>
								</div>
							)}
						</TabsContent>

						<TabsContent value="context" className="space-y-3">
							{verificationContext ? (
								<div className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium">Verification Time</label>
											<div className="text-sm text-muted-foreground mt-1">
												{new Date(verificationContext.timestamp).toLocaleString()}
											</div>
										</div>
										
										<div>
											<label className="text-sm font-medium">Verifier DID</label>
											<div className="text-sm text-muted-foreground mt-1 font-mono">
												{verificationContext.verifierDid}
											</div>
										</div>
										
										<div>
											<label className="text-sm font-medium">Challenge</label>
											<div className="text-sm text-muted-foreground mt-1 font-mono">
												{verificationContext.challenge}
											</div>
										</div>
										
										<div>
											<label className="text-sm font-medium">Purpose</label>
											<div className="text-sm text-muted-foreground mt-1">
												{verificationContext.purpose}
											</div>
										</div>
										
										<div>
											<label className="text-sm font-medium">Domain</label>
											<div className="text-sm text-muted-foreground mt-1">
												{verificationContext.domain}
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-8">
									<Fingerprint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">Start verification to see context information</p>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
