'use client'

import {useState} from 'react'
import {useMutation} from '@tanstack/react-query'
import {ArrowLeft, Upload, FileText, Shield, CheckCircle, XCircle, AlertTriangle, Copy, Download} from 'lucide-react'
import Link from 'next/link'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'
import {Switch} from '@/components/ui/switch'
import {Input} from '@/components/ui/input'

import {verifyCredential} from '@/services/vcService'
import type {VerifyCredentialInput, VerifyCredentialOutput, VerifiableCredential, VerificationOptions} from '@/types/credentials'
import {VerificationResults} from '@/components/credentials/VerificationResults'

/**
 * Verify Credential Page - Interface for verifying verifiable credentials
 *
 * Features:
 * - Credential upload/input (JSON, file, URL)
 * - Verification options configuration
 * - Real-time verification results
 * - Detailed verification checks display
 * - Export verification report
 */
export default function VerifyCredentialPage() {
	const [credentialInput, setCredentialInput] = useState('')
	const [verificationOptions, setVerificationOptions] = useState<VerificationOptions>({
		skipRevocationCheck: false,
	})
	const [verificationResult, setVerificationResult] = useState<VerifyCredentialOutput | null>(null)
	const [inputMethod, setInputMethod] = useState<'json' | 'file' | 'url'>('json')
	const [activeTab, setActiveTab] = useState<'input' | 'results'>('input')

	// Verify credential mutation
	const verifyMutation = useMutation({
		mutationFn: verifyCredential,
		onSuccess: (data) => {
			setVerificationResult(data)
			setActiveTab('results')
			toast.success('Credential verification completed')
		},
		onError: (error: Error & {response?: {data?: {message?: string}}}) => {
			console.error('Error verifying credential:', error)

			// Extract meaningful error message
			let errorMessage = 'Failed to verify credential'

			if (error?.response?.data?.message) {
				errorMessage = error.response.data.message
			} else if (error?.message) {
				errorMessage = error.message
			}

			// Check for specific error types and provide better messages
			if (errorMessage.includes("credential subject must have an 'id' field")) {
				errorMessage = "The credential subject is missing a required 'id' field. Please ensure the credential subject includes an identifier."
			} else if (errorMessage.includes('signature verification failed')) {
				errorMessage = "Signature verification failed. The credential may have been tampered with or the issuer's verification method cannot be resolved."
			} else if (errorMessage.includes('invalid credential format')) {
				errorMessage = "Invalid credential format. Please ensure you're providing a valid JSON verifiable credential."
			}

			toast.error(errorMessage)
			setVerificationResult(null)
		},
	})

	// Handle file upload
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = (e) => {
				const content = e.target?.result as string
				setCredentialInput(content)
			}
			reader.readAsText(file)
		}
	}

	// Handle verification
	const handleVerify = async () => {
		if (!credentialInput.trim()) {
			toast.error('Please provide a credential to verify')
			return
		}

		try {
			let credential: VerifiableCredential

			if (inputMethod === 'url') {
				// For URL input, we would fetch the credential
				// For now, we'll show an error
				toast.error('URL input not yet implemented')
				return
			} else {
				// Parse JSON input
				try {
					credential = JSON.parse(credentialInput)
				} catch {
					toast.error('Invalid JSON format. Please check your credential format.')
					return
				}

				// Basic validation of required fields
				if (!credential['@context'] || !Array.isArray(credential['@context'])) {
					toast.error('Credential must have a valid @context field (array)')
					return
				}

				if (!credential.type || !Array.isArray(credential.type)) {
					toast.error('Credential must have a valid type field (array)')
					return
				}

				if (!credential.type.includes('VerifiableCredential')) {
					toast.error('Credential type must include "VerifiableCredential"')
					return
				}

				if (!credential.issuer) {
					toast.error('Credential must have an issuer field')
					return
				}

				if (!credential.issuanceDate) {
					toast.error('Credential must have an issuanceDate field')
					return
				}

				if (!credential.credentialSubject) {
					toast.error('Credential must have a credentialSubject field')
					return
				}
			}

			const input: VerifyCredentialInput = {
				credential,
				options: verificationOptions,
			}

			verifyMutation.mutate(input)
		} catch (error) {
			console.error('Error preparing credential for verification:', error)
			toast.error('Error preparing credential for verification. Please check your input.')
		}
	}

	// Copy verification result to clipboard
	const copyResult = async () => {
		if (verificationResult) {
			try {
				await navigator.clipboard.writeText(JSON.stringify(verificationResult, null, 2))
				toast.success('Verification result copied to clipboard')
			} catch (error) {
				console.log('Error copying to clipboard: ', error)
				toast.error('Failed to copy to clipboard')
			}
		}
	}

	// Download verification report
	const downloadReport = () => {
		if (verificationResult) {
			const report = {
				timestamp: new Date().toISOString(),
				verificationResult,
				options: verificationOptions,
			}

			const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `verification-report-${Date.now()}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			toast.success('Verification report downloaded')
		}
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button variant='ghost' size='sm' asChild>
					<Link href='/dashboard/credentials'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Credentials
					</Link>
				</Button>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Verify Credential</h1>
					<p className='text-muted-foreground'>Verify the authenticity and validity of verifiable credentials</p>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Main Content */}
				<div className='lg:col-span-2'>
					<Card>
						<CardHeader>
							<CardTitle>Credential Verification</CardTitle>
							<CardDescription>Upload or paste a verifiable credential to verify its authenticity</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'input' | 'results')}>
								<TabsList className='grid w-full grid-cols-2'>
									<TabsTrigger value='input'>Input Credential</TabsTrigger>
									<TabsTrigger value='results' disabled={!verificationResult}>
										Verification Results
									</TabsTrigger>
								</TabsList>

								<TabsContent value='input' className='space-y-6 mt-6'>
									{/* Input Method Selection */}
									<div className='space-y-4'>
										<Label>Input Method</Label>
										<Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'json' | 'file' | 'url')}>
											<TabsList className='grid w-full grid-cols-3'>
												<TabsTrigger value='json'>JSON Text</TabsTrigger>
												<TabsTrigger value='file'>Upload File</TabsTrigger>
												<TabsTrigger value='url'>From URL</TabsTrigger>
											</TabsList>

											<TabsContent value='json' className='mt-4'>
												<div className='space-y-2'>
													<Label htmlFor='credential-json'>Credential JSON</Label>
													<Textarea id='credential-json' placeholder='Paste the verifiable credential JSON here...' value={credentialInput} onChange={(e) => setCredentialInput(e.target.value)} rows={12} className='font-mono text-sm' />
													<div className='text-sm text-muted-foreground'>
														<p className='mb-2'>Expected format: W3C Verifiable Credential JSON with:</p>
														<ul className='list-disc list-inside space-y-1 ml-4'>
															<li>@context array including "https://www.w3.org/2018/credentials/v1"</li>
															<li>type array including "VerifiableCredential"</li>
															<li>issuer field (DID or URL)</li>
															<li>issuanceDate (ISO 8601 format)</li>
															<li>credentialSubject object</li>
															<li>proof object (optional for verification)</li>
														</ul>
													</div>
												</div>
											</TabsContent>

											<TabsContent value='file' className='mt-4'>
												<div className='space-y-4'>
													<div className='border-2 border-dashed border-border rounded-lg p-8 text-center'>
														<Upload className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
														<div className='space-y-2'>
															<Label htmlFor='file-upload' className='cursor-pointer'>
																<span className='text-primary hover:text-primary/80'>Click to upload</span>
																<span className='text-muted-foreground'> or drag and drop</span>
															</Label>
															<p className='text-sm text-muted-foreground'>JSON files only</p>
														</div>
														<Input id='file-upload' type='file' accept='.json,application/json' onChange={handleFileUpload} className='hidden' />
													</div>
													{credentialInput && (
														<Alert>
															<FileText className='h-4 w-4' />
															<AlertDescription>File loaded successfully. You can now verify the credential.</AlertDescription>
														</Alert>
													)}
												</div>
											</TabsContent>

											<TabsContent value='url' className='mt-4'>
												<div className='space-y-2'>
													<Label htmlFor='credential-url'>Credential URL</Label>
													<Input id='credential-url' placeholder='https://example.com/credentials/123' value={credentialInput} onChange={(e) => setCredentialInput(e.target.value)} />
													<p className='text-sm text-muted-foreground'>Enter a URL that returns a verifiable credential JSON</p>
												</div>
											</TabsContent>
										</Tabs>
									</div>

									<Separator />

									{/* Verification Options */}
									<div className='space-y-4'>
										<Label className='text-base font-semibold'>Verification Options</Label>

										<div className='space-y-4'>
											<div className='flex items-center justify-between'>
												<div className='space-y-0.5'>
													<Label>Skip Revocation Check</Label>
													<p className='text-sm text-muted-foreground'>Skip checking if the credential has been revoked</p>
												</div>
												<Switch checked={verificationOptions.skipRevocationCheck || false} onCheckedChange={(checked) => setVerificationOptions((prev) => ({...prev, skipRevocationCheck: checked}))} />
											</div>

											<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
												<div className='space-y-2'>
													<Label htmlFor='challenge'>Challenge (Optional)</Label>
													<Input id='challenge' placeholder='Verification challenge' value={verificationOptions.challenge || ''} onChange={(e) => setVerificationOptions((prev) => ({...prev, challenge: e.target.value || undefined}))} />
												</div>

												<div className='space-y-2'>
													<Label htmlFor='domain'>Domain (Optional)</Label>
													<Input id='domain' placeholder='example.com' value={verificationOptions.domain || ''} onChange={(e) => setVerificationOptions((prev) => ({...prev, domain: e.target.value || undefined}))} />
												</div>
											</div>
										</div>
									</div>

									{/* Verify Button */}
									<Button onClick={handleVerify} disabled={!credentialInput.trim() || verifyMutation.isPending} className='w-full' size='lg'>
										{verifyMutation.isPending ? (
											<div>
												<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
												Verifying...
											</div>
										) : (
											<div>
												<Shield className='h-4 w-4 mr-2' />
												Verify Credential
											</div>
										)}
									</Button>
								</TabsContent>

								<TabsContent value='results' className='mt-6'>
									{verificationResult && (
										<div className='space-y-6'>
											{/* Verification Status */}
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-3'>
													{verificationResult.verified ? <CheckCircle className='h-8 w-8 text-green-600' /> : <XCircle className='h-8 w-8 text-red-600' />}
													<div>
														<h3 className='text-lg font-semibold'>{verificationResult.verified ? 'Credential Verified' : 'Verification Failed'}</h3>
														<p className='text-sm text-muted-foreground'>Status: {verificationResult.status}</p>
													</div>
												</div>

												<div className='flex gap-2'>
													<Button variant='outline' size='sm' onClick={copyResult}>
														<Copy className='h-4 w-4 mr-2' />
														Copy Result
													</Button>
													<Button variant='outline' size='sm' onClick={downloadReport}>
														<Download className='h-4 w-4 mr-2' />
														Download Report
													</Button>
												</div>
											</div>

											{/* Verification Results Component */}
											<VerificationResults result={verificationResult} />

											{/* Warnings and Errors */}
											{verificationResult.warnings && verificationResult.warnings.length > 0 && (
												<Alert>
													<AlertTriangle className='h-4 w-4' />
													<AlertDescription>
														<strong>Warnings:</strong>
														<ul className='list-disc list-inside mt-2'>
															{verificationResult.warnings.map((warning, index) => (
																<li key={index}>{warning}</li>
															))}
														</ul>
													</AlertDescription>
												</Alert>
											)}

											{verificationResult.errors && verificationResult.errors.length > 0 && (
												<Alert variant='destructive'>
													<XCircle className='h-4 w-4' />
													<AlertDescription>
														<strong>Errors:</strong>
														<ul className='list-disc list-inside mt-2'>
															{verificationResult.errors.map((error, index) => (
																<li key={index}>{error}</li>
															))}
														</ul>
													</AlertDescription>
												</Alert>
											)}
										</div>
									)}
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className='space-y-6'>
					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Quick Actions</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							<Button variant='outline' size='sm' className='w-full justify-start' asChild>
								<Link href='/dashboard/credentials'>
									<FileText className='h-4 w-4 mr-2' />
									View All Credentials
								</Link>
							</Button>
							<Button variant='outline' size='sm' className='w-full justify-start' asChild>
								<Link href='/dashboard/credentials/issue'>
									<Shield className='h-4 w-4 mr-2' />
									Issue Credential
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Verification Info */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>About Verification</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3 text-sm'>
							<div>
								<strong>Cryptographic Verification:</strong>
								<p className='text-muted-foreground mt-1'>Checks digital signatures and proof integrity</p>
							</div>

							<div>
								<strong>Status Verification:</strong>
								<p className='text-muted-foreground mt-1'>Confirms the credential hasn't been revoked</p>
							</div>

							<div>
								<strong>Expiration Check:</strong>
								<p className='text-muted-foreground mt-1'>Validates the credential is still within its validity period</p>
							</div>

							<div>
								<strong>Issuer Verification:</strong>
								<p className='text-muted-foreground mt-1'>Confirms the issuer's identity and authority</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
