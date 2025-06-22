'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {ArrowLeft, Eye, Upload, Loader2} from 'lucide-react'
import Link from 'next/link'
import {toast} from 'sonner'
import {PresentationVerificationResults} from '@/components/presentations'
import type {VerifyPresentationResponse, VerifyPresentationRequest} from '@/types/presentations'
import {verifyPresentation} from '@/services/presentationService'

export default function VerifyPresentationPage() {
	const [presentationJson, setPresentationJson] = useState('')
	const [verificationResult, setVerificationResult] = useState<VerifyPresentationResponse | null>(null)
	const [isVerifying, setIsVerifying] = useState(false)

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsVerifying(true)

		try {
			// Parse and validate the presentation JSON
			let presentation
			try {
				presentation = JSON.parse(presentationJson)
			} catch {
				toast.error('Invalid JSON format')
				return
			}

			// Validate that it looks like a verifiable presentation
			if (!presentation.type || !Array.isArray(presentation.type) || !presentation.type.includes('VerifiablePresentation')) {
				toast.error('Invalid verifiable presentation format')
				return
			}

			// Create verification request
			const request: VerifyPresentationRequest = {
				presentation,
				challenge: presentation.proof?.challenge || `verify-${Date.now()}`,
				domain: window.location.origin,
				verifySignature: true,
				verifyCredentials: true,
				verifyRevocation: true,
				verifyIssuerTrust: true,
				verifyExpiration: true,
				verifySchema: true,
			}

			// Call the verification service
			const response = await verifyPresentation(request)
			setVerificationResult(response)

			if (response.valid) {
				toast.success('Presentation verified successfully!')
			} else {
				toast.error('Presentation verification failed')
			}
		} catch (error) {
			console.error('Verification failed:', error)
			toast.error('Verification failed. Please try again.')

			// Set error result
			setVerificationResult({
				valid: false,
				verificationResults: {
					signatureValid: false,
					proofValid: false,
					challengeValid: false,
					domainValid: false,
					holderVerified: false,
					credentialsValid: false,
					message: 'Verification service error',
				},
				errors: ['Service error: Unable to verify presentation'],
				verifiedAt: new Date().toISOString(),
			})
		} finally {
			setIsVerifying(false)
		}
	}

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = (event) => {
				const content = event.target?.result as string
				setPresentationJson(content)
			}
			reader.readAsText(file)
		}
	}

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex items-center gap-4'>
				<Link href='/dashboard/presentations'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to Presentations
					</Button>
				</Link>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Verify Presentation</h1>
					<p className='text-muted-foreground'>Verify the authenticity and integrity of a verifiable presentation</p>
				</div>
			</div>

			<div className='grid gap-6 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Presentation Input</CardTitle>
						<CardDescription>Paste the verifiable presentation JSON or upload a file</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleVerify} className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='presentation'>Verifiable Presentation (JSON)</Label>
								<Textarea id='presentation' value={presentationJson} onChange={(e) => setPresentationJson(e.target.value)} placeholder='Paste your verifiable presentation JSON here...' rows={12} className='font-mono text-sm' required />
							</div>

							<div className='flex items-center gap-2'>
								<div className='flex-1'>
									<Label htmlFor='file-upload' className='cursor-pointer'>
										<div className='flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors'>
											<Upload className='h-4 w-4' />
											<span className='text-sm'>Upload JSON file</span>
										</div>
									</Label>
									<input id='file-upload' type='file' accept='.json' onChange={handleFileUpload} className='hidden' />
								</div>
							</div>

							<Button type='submit' disabled={!presentationJson || isVerifying} className='w-full'>
								{isVerifying ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Verifying...
									</>
								) : (
									<>
										<Eye className='mr-2 h-4 w-4' />
										Verify Presentation
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Verification Results</CardTitle>
						<CardDescription>Results will appear here after verification</CardDescription>
					</CardHeader>
					<CardContent>{verificationResult ? <PresentationVerificationResults results={verificationResult} /> : <div className='text-center text-muted-foreground py-8'>Enter a presentation and click verify to see results</div>}</CardContent>
				</Card>
			</div>
		</div>
	)
}
