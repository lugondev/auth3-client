'use client'

import React, {useState} from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Checkbox} from '@/components/ui/checkbox'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {Loader2, Shield, CheckCircle, XCircle, Copy, Download} from 'lucide-react'
import {toast} from 'sonner'
import {VerificationResults} from '@/components/credentials/VerificationResults'
import * as vcService from '@/services/vcService'
import type {VerifyCredentialOutput} from '@/types/credentials'

interface VerifyCredentialModalProps {
	isOpen: boolean
	onClose: () => void
	initialCredential?: string
	className?: string
}

interface VerificationOptions {
	verifySignature: boolean
	verifyExpiration: boolean
	verifyRevocation: boolean
	verifyIssuer: boolean
	verifySchema: boolean
}

/**
 * VerifyCredentialModal Component - Modal for verifying verifiable credentials
 *
 * Features:
 * - JSON input for credential data
 * - File upload support
 * - Configurable verification options
 * - Detailed verification results display
 * - Two-step flow: input → results
 */
export function VerifyCredentialModal({isOpen, onClose, initialCredential = '', className = ''}: VerifyCredentialModalProps) {
	const [credentialJson, setCredentialJson] = useState(initialCredential)
	const [isVerifying, setIsVerifying] = useState(false)
	const [verificationResult, setVerificationResult] = useState<VerifyCredentialOutput | null>(null)
	const [showResults, setShowResults] = useState(false)

	// Verification options
	const [verificationOptions, setVerificationOptions] = useState<VerificationOptions>({
		verifySignature: true,
		verifyExpiration: true,
		verifyRevocation: false,
		verifyIssuer: true,
		verifySchema: true,
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
				setCredentialJson(content)
				toast.success('Credential loaded successfully')
			} catch {
				toast.error('Invalid JSON file')
			}
		}
		reader.readAsText(file)
	}

	const validateCredential = (credentialText: string) => {
		try {
			const credential = JSON.parse(credentialText)

			if (!credential.type || !Array.isArray(credential.type)) {
				throw new Error('Missing or invalid type field')
			}

			if (!credential.type.includes('VerifiableCredential')) {
				throw new Error('Not a verifiable credential')
			}

			if (!credential.credentialSubject) {
				throw new Error('Missing credentialSubject field')
			}

			if (!credential.issuer) {
				throw new Error('Missing issuer field')
			}

			if (!credential.issuanceDate) {
				throw new Error('Missing issuanceDate field')
			}

			return credential
		} catch (error) {
			throw new Error(`Invalid credential format: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}

	const handleVerify = async () => {
		setIsVerifying(true)
		setVerificationResult(null)

		try {
			const credential = validateCredential(credentialJson)

			// Clean the credential to remove any database-specific fields
			const cleanCredential = vcService.cleanCredentialForVerification(credential)

			const result = await vcService.verifyCredential({
				credential: cleanCredential,
				...verificationOptions,
			})

			setVerificationResult(result)

			if (result.valid) {
				toast.success('Credential verification completed')
			} else {
				toast.error('Credential verification failed')
			}

			// Show results
			setShowResults(true)
		} catch (error) {
			console.error('Verification error:', error)
			toast.error(error instanceof Error ? error.message : 'Verification failed')
		} finally {
			setIsVerifying(false)
		}
	}

	const handleClose = () => {
		if (!isVerifying) {
			setCredentialJson(initialCredential)
			setVerificationResult(null)
			setShowResults(false)
			onClose()
		}
	}

	const handleBackToVerify = () => {
		setShowResults(false)
		setVerificationResult(null)
	}

	// Export results as JSON
	const handleExportResults = () => {
		if (!verificationResult) return

		try {
			const blob = new Blob([JSON.stringify(verificationResult, null, 2)], {
				type: 'application/json',
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `credential-verification-results-${new Date().toISOString().split('T')[0]}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
			toast.success('Verification results exported successfully')
		} catch (error) {
			console.error('Export error:', error)
			toast.error('Failed to export results')
		}
	}

	// Copy results to clipboard
	const handleCopyResults = async () => {
		if (!verificationResult) return

		try {
			await navigator.clipboard.writeText(JSON.stringify(verificationResult, null, 2))
			toast.success('Results copied to clipboard')
		} catch (error) {
			console.error('Copy error:', error)
			toast.error('Failed to copy results')
		}
	}

	// Calculate verification score
	const getVerificationScore = (result: VerifyCredentialOutput) => {
		const checks = [result.verificationResults.signatureValid, result.verificationResults.notExpired, result.verificationResults.notRevoked, result.verificationResults.issuerTrusted, result.verificationResults.schemaValid, result.verificationResults.proofValid]
		const passedChecks = checks.filter((check) => check === true).length
		return Math.round((passedChecks / checks.length) * 100)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className={`sm:max-w-[800px] max-h-[90vh] overflow-y-auto ${className}`}>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						{showResults ? 'Credential Verification Results' : 'Verify Verifiable Credential'}
					</DialogTitle>
				</DialogHeader>

				{showResults ? (
					/* Results View */
					<div className='space-y-6'>
						{/* Status Summary */}
						{verificationResult && (
							<Card className={verificationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											{verificationResult.valid ? <CheckCircle className='h-8 w-8 text-green-600' /> : <XCircle className='h-8 w-8 text-red-600' />}
											<div>
												<CardTitle className={verificationResult.valid ? 'text-green-800' : 'text-red-800'}>Credential {verificationResult.valid ? 'Valid' : 'Invalid'}</CardTitle>
												<CardDescription className={verificationResult.valid ? 'text-green-700' : 'text-red-700'}>{verificationResult.valid ? 'All verification checks passed successfully' : 'One or more verification checks failed'}</CardDescription>
											</div>
										</div>

										{/* Verification Score */}
										<div className='text-center'>
											<div className={`text-2xl font-bold ${getVerificationScore(verificationResult) >= 90 ? 'text-green-600' : getVerificationScore(verificationResult) >= 70 ? 'text-blue-600' : getVerificationScore(verificationResult) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{getVerificationScore(verificationResult)}%</div>
											<div className='text-sm text-muted-foreground'>Score</div>
										</div>
									</div>
								</CardHeader>
							</Card>
						)}

						{/* Detailed Results */}
						{verificationResult && (
							<div className='space-y-4'>
								<VerificationResults result={verificationResult} className='border-0 shadow-none bg-transparent' />

								{/* Quick Stats */}
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg'>
									<div className='text-center'>
										<div className='text-2xl font-bold text-blue-600'>{getVerificationScore(verificationResult)}%</div>
										<div className='text-sm text-muted-foreground'>Score</div>
									</div>
									<div className='text-center'>
										<div className={`text-2xl font-bold ${verificationResult.valid ? 'text-green-600' : 'text-red-600'}`}>{verificationResult.valid ? 'Valid' : 'Invalid'}</div>
										<div className='text-sm text-muted-foreground'>Status</div>
									</div>
									<div className='text-center'>
										<div className='text-2xl font-bold text-orange-600'>{verificationResult.warnings?.length || 0}</div>
										<div className='text-sm text-muted-foreground'>Warnings</div>
									</div>
									<div className='text-center'>
										<div className='text-2xl font-bold text-red-600'>{verificationResult.errors?.length || 0}</div>
										<div className='text-sm text-muted-foreground'>Errors</div>
									</div>
								</div>

								{/* Errors and Warnings */}
								{verificationResult.errors && verificationResult.errors.length > 0 && (
									<Card className='border-red-200'>
										<CardHeader>
											<CardTitle className='text-red-600'>Errors</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='list-disc list-inside space-y-1'>
												{verificationResult.errors.map((error, index) => (
													<li key={index} className='text-sm text-red-600'>
														{error}
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}

								{verificationResult.warnings && verificationResult.warnings.length > 0 && (
									<Card className='border-orange-200'>
										<CardHeader>
											<CardTitle className='text-orange-600'>Warnings</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='list-disc list-inside space-y-1'>
												{verificationResult.warnings.map((warning, index) => (
													<li key={index} className='text-sm text-orange-600'>
														{warning}
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}
							</div>
						)}
					</div>
				) : (
					/* Verification Form */
					<div className='space-y-6'>
						{/* Credential Input */}
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<Label htmlFor='credential-json'>Credential JSON</Label>
								<div>
									<Input type='file' accept='.json,application/json' onChange={handleFileUpload} className='w-auto' />
								</div>
							</div>
							<Textarea id='credential-json' value={credentialJson} onChange={(e) => setCredentialJson(e.target.value)} placeholder='Paste your verifiable credential JSON here...' rows={12} className='font-mono text-sm' />
						</div>

						{/* Verification Options */}
						<Card>
							<CardHeader>
								<CardTitle className='text-base'>Verification Options</CardTitle>
								<CardDescription>Choose which aspects of the credential to verify</CardDescription>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									{Object.entries(verificationOptions).map(([key, value]) => (
										<div key={key} className='flex items-center space-x-2'>
											<Checkbox
												id={key}
												checked={value}
												onCheckedChange={(checked) =>
													setVerificationOptions((prev) => ({
														...prev,
														[key]: checked,
													}))
												}
											/>
											<Label htmlFor={key} className='text-sm capitalize'>
												{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
											</Label>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				<DialogFooter>
					{showResults ? (
						<>
							<div className='flex gap-2'>
								<Button type='button' variant='outline' size='sm' onClick={handleCopyResults} className='flex items-center gap-2'>
									<Copy className='h-4 w-4' />
									Copy Results
								</Button>
								<Button type='button' variant='outline' size='sm' onClick={handleExportResults} className='flex items-center gap-2'>
									<Download className='h-4 w-4' />
									Export JSON
								</Button>
							</div>
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
							<Button onClick={handleVerify} disabled={isVerifying || !credentialJson.trim()}>
								{isVerifying ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Verifying...
									</>
								) : (
									<>
										<Shield className='mr-2 h-4 w-4' />
										Verify Credential
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

export default VerifyCredentialModal
