'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Badge} from '@/components/ui/badge'
import {Shield, Upload, CheckCircle, XCircle, AlertTriangle, RefreshCw} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'

interface VerificationResult {
	isValid: boolean
	checks: {
		signatureValid: boolean
		notExpired: boolean
		issuerTrusted: boolean
		subjectMatches: boolean
	}
	credential?: Record<string, unknown>
	errors?: string[]
	warnings?: string[]
}

interface CredentialVerificationInterfaceProps {
	onComplete?: (result: VerificationResult) => void
	className?: string
	tenantId?: string
}

export function CredentialVerificationInterface({
	onComplete,
	className = '',
	tenantId,
}: CredentialVerificationInterfaceProps) {
	const {toast} = useToast()
	const [credentialInput, setCredentialInput] = useState('')
	const [isVerifying, setIsVerifying] = useState(false)
	const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

	const handleVerify = async () => {
		if (!credentialInput.trim()) {
			toast({
				title: "Input Required",
				description: "Please provide a credential to verify",
				variant: "destructive",
			})
			return
		}

		setIsVerifying(true)
		setVerificationResult(null)

		try {
			// Parse the credential
			let credential
			try {
				credential = JSON.parse(credentialInput)
			} catch {
				throw new Error('Invalid JSON format')
			}

			// Mock verification logic - replace with actual API call
			await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay

			// Mock verification results
			const result: VerificationResult = {
				isValid: true,
				checks: {
					signatureValid: true,
					notExpired: true,
					issuerTrusted: true,
					subjectMatches: true,
				},
				credential,
				warnings: credential.expirationDate ? [] : ['Credential has no expiration date'],
			}

			setVerificationResult(result)
			onComplete?.(result)

			toast({
				title: "Verification Complete",
				description: result.isValid ? "Credential is valid!" : "Credential verification failed",
				variant: result.isValid ? "default" : "destructive",
			})
		} catch (error) {
			const errorResult: VerificationResult = {
				isValid: false,
				checks: {
					signatureValid: false,
					notExpired: false,
					issuerTrusted: false,
					subjectMatches: false,
				},
				errors: [error instanceof Error ? error.message : 'Verification failed'],
			}

			setVerificationResult(errorResult)
			onComplete?.(errorResult)

			toast({
				title: "Verification Failed",
				description: error instanceof Error ? error.message : 'Verification failed',
				variant: "destructive",
			})
		} finally {
			setIsVerifying(false)
		}
	}

	const handleClear = () => {
		setCredentialInput('')
		setVerificationResult(null)
	}

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			const text = await file.text()
			setCredentialInput(text)
			toast({
				title: "File Loaded",
				description: "Credential file loaded successfully",
			})
		} catch {
			toast({
				title: "Error",
				description: "Failed to read file",
				variant: "destructive",
			})
		}
	}

	const renderVerificationChecks = (result: VerificationResult) => {
		const checks = [
			{
				key: 'signatureValid',
				label: 'Digital Signature',
				description: 'Cryptographic signature is valid',
			},
			{
				key: 'notExpired',
				label: 'Not Expired',
				description: 'Credential is within validity period',
			},
			{
				key: 'issuerTrusted',
				label: 'Trusted Issuer',
				description: 'Issuer is in trusted registry',
			},
			{
				key: 'subjectMatches',
				label: 'Subject Integrity',
				description: 'Subject data is consistent',
			},
		]

		return (
			<div className="space-y-3">
				{checks.map((check) => {
					const isValid = result.checks[check.key as keyof typeof result.checks]
					return (
						<div key={check.key} className="flex items-center justify-between p-3 border rounded-lg">
							<div>
								<div className="font-medium">{check.label}</div>
								<div className="text-sm text-muted-foreground">{check.description}</div>
							</div>
							<div className="flex items-center gap-2">
								{isValid ? (
									<CheckCircle className="h-5 w-5 text-green-600" />
								) : (
									<XCircle className="h-5 w-5 text-red-600" />
								)}
								<Badge variant={isValid ? "default" : "destructive"}>
									{isValid ? 'Valid' : 'Invalid'}
								</Badge>
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{tenantId && (
				<Alert>
					<Shield className="h-4 w-4" />
					<AlertDescription>
						Verifying credential for tenant: <strong>{tenantId}</strong>
					</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Credential Input
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="credential-input">Verifiable Credential (JSON)</Label>
						<Textarea
							id="credential-input"
							placeholder="Paste the verifiable credential JSON here..."
							value={credentialInput}
							onChange={(e) => setCredentialInput(e.target.value)}
							className="min-h-[200px] font-mono text-sm"
							disabled={isVerifying}
						/>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<input
								type="file"
								accept=".json,.txt"
								onChange={handleFileUpload}
								className="hidden"
								id="file-upload"
								disabled={isVerifying}
							/>
							<Label htmlFor="file-upload" className="cursor-pointer">
								<Button variant="outline" disabled={isVerifying} asChild>
									<span>
										<Upload className="h-4 w-4 mr-2" />
										Upload File
									</span>
								</Button>
							</Label>
						</div>

						<Button
							onClick={handleVerify}
							disabled={!credentialInput.trim() || isVerifying}
							className="flex items-center gap-2"
						>
							{isVerifying ? (
								<RefreshCw className="h-4 w-4 animate-spin" />
							) : (
								<Shield className="h-4 w-4" />
							)}
							{isVerifying ? 'Verifying...' : 'Verify Credential'}
						</Button>

						<Button variant="outline" onClick={handleClear} disabled={isVerifying}>
							Clear
						</Button>
					</div>
				</CardContent>
			</Card>

			{verificationResult && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{verificationResult.isValid ? (
								<CheckCircle className="h-5 w-5 text-green-600" />
							) : (
								<XCircle className="h-5 w-5 text-red-600" />
							)}
							Verification Result
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert variant={verificationResult.isValid ? "default" : "destructive"}>
							<AlertDescription className="flex items-center gap-2">
								{verificationResult.isValid ? (
									<>
										<CheckCircle className="h-4 w-4" />
										Credential verification passed all checks
									</>
								) : (
									<>
										<XCircle className="h-4 w-4" />
										Credential verification failed
									</>
								)}
							</AlertDescription>
						</Alert>

						{renderVerificationChecks(verificationResult)}

						{verificationResult.warnings && verificationResult.warnings.length > 0 && (
							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									<strong>Warnings:</strong>
									<ul className="mt-2 list-disc list-inside">
										{verificationResult.warnings.map((warning, index) => (
											<li key={index}>{warning}</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}

						{verificationResult.errors && verificationResult.errors.length > 0 && (
							<Alert variant="destructive">
								<XCircle className="h-4 w-4" />
								<AlertDescription>
									<strong>Errors:</strong>
									<ul className="mt-2 list-disc list-inside">
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
		</div>
	)
}
