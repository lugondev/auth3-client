'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Eye, User, Key, Calendar, FileText, CheckCircle, AlertTriangle, Clock} from 'lucide-react'
import {format} from 'date-fns'

import {CredentialTemplate, JSONValue} from '@/types/template'

interface ReviewStepProps {
	template: CredentialTemplate
	credentialData: Record<string, JSONValue>
	recipientInfo: {
		did?: string
		email?: string
	}
	issuanceOptions: {
		issuanceDate?: string
		expirationDate?: string
		additionalContext?: string[]
	}
	issuerDID?: string
	isLoading: boolean
	onIssue: () => void
	onBack: () => void
}

export function ReviewStep({template, credentialData, recipientInfo, issuanceOptions, issuerDID, isLoading, onIssue, onBack}: ReviewStepProps) {
	const [showJsonPreview, setShowJsonPreview] = useState(false)

	// Determine the final issuer DID - template takes priority
	const finalIssuerDID = template.issuerDID || issuerDID || 'did:web:auth3.example.com'

	// Generate credential preview
	const generateCredentialPreview = () => {
		const now = new Date()
		const issuanceDate = issuanceOptions.issuanceDate ? new Date(issuanceOptions.issuanceDate) : now

		const credential = {
			'@context': ['https://www.w3.org/2018/credentials/v1', ...(issuanceOptions.additionalContext || [])],
			id: `urn:uuid:${crypto.randomUUID()}`,
			type: ['VerifiableCredential', ...template.type],
			issuer: {
				id: finalIssuerDID,
				name: 'Auth3 System',
			},
			issuanceDate: issuanceDate.toISOString(),
			...(issuanceOptions.expirationDate && {
				expirationDate: new Date(issuanceOptions.expirationDate).toISOString(),
			}),
			credentialSubject: {
				id: recipientInfo.did || `mailto:${recipientInfo.email}`,
				...credentialData,
			},
		}

		return credential
	}

	const credentialPreview = generateCredentialPreview()

	const formatValue = (value: JSONValue): string => {
		if (value === null || value === undefined) return 'N/A'
		if (typeof value === 'boolean') return value ? 'Yes' : 'No'
		if (Array.isArray(value)) return value.join(', ')
		if (typeof value === 'object') return JSON.stringify(value)
		return String(value)
	}

	const getValidationStatus = () => {
		const issues: string[] = []

		// Check required fields
		const requiredFields = (template.schema.required as string[]) || []
		const missingFields = requiredFields.filter((field) => !credentialData[field] || credentialData[field] === '' || credentialData[field] === null || credentialData[field] === undefined)

		if (missingFields.length > 0) {
			issues.push(`Missing required fields: ${missingFields.join(', ')}`)
		}

		// Check recipient
		if (!recipientInfo.did && !recipientInfo.email) {
			issues.push('Recipient DID or email is required')
		}

		// Check dates
		if (issuanceOptions.expirationDate && issuanceOptions.issuanceDate) {
			const issueDate = new Date(issuanceOptions.issuanceDate)
			const expDate = new Date(issuanceOptions.expirationDate)
			if (expDate <= issueDate) {
				issues.push('Expiration date must be after issuance date')
			}
		}

		return {
			isValid: issues.length === 0,
			issues,
		}
	}

	const validation = getValidationStatus()

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-lg font-semibold mb-2'>Review & Issue Credential</h3>
				<p className='text-muted-foreground'>Please review all the information below before issuing the credential.</p>
			</div>

			{/* Validation Status */}
			<Card className={validation.isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
				<CardContent className='pt-6'>
					<div className='flex items-center gap-2'>
						{validation.isValid ? <CheckCircle className='h-5 w-5 text-green-600' /> : <AlertTriangle className='h-5 w-5 text-red-600' />}
						<span className={`font-medium ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>{validation.isValid ? 'Ready to Issue' : 'Issues Found'}</span>
					</div>
					{!validation.isValid && (
						<ul className='mt-2 space-y-1 text-sm text-red-600'>
							{validation.issues.map((issue, index) => (
								<li key={index} className='flex items-start gap-1'>
									<span className='mt-1'>•</span>
									{issue}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Credential Information */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<FileText className='h-5 w-5' />
								Credential Information
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div>
								<span className='text-sm font-medium'>Template:</span>
								<p className='text-sm text-muted-foreground'>{template.name}</p>
							</div>
							<div>
								<span className='text-sm font-medium'>Version:</span>
								<p className='text-sm text-muted-foreground'>{template.version}</p>
							</div>
							<div>
								<span className='text-sm font-medium'>Types:</span>
								<div className='flex flex-wrap gap-1 mt-1'>
									{template.type.map((type, index) => (
										<Badge key={index} variant='secondary' className='text-xs'>
											{type}
										</Badge>
									))}
								</div>
							</div>
							<div>
								<span className='text-sm font-medium'>Description:</span>
								<p className='text-sm text-muted-foreground'>{template.description}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<User className='h-5 w-5' />
								Recipient Information
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							{recipientInfo.did && (
								<div>
									<span className='text-sm font-medium'>DID:</span>
									<p className='text-sm text-muted-foreground break-all'>{recipientInfo.did}</p>
								</div>
							)}
							{recipientInfo.email && (
								<div>
									<span className='text-sm font-medium'>Email:</span>
									<p className='text-sm text-muted-foreground'>{recipientInfo.email}</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Calendar className='h-5 w-5' />
								Issuance Details
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div>
								<span className='text-sm font-medium'>Issuance Date:</span>
								<p className='text-sm text-muted-foreground'>{issuanceOptions.issuanceDate ? format(new Date(issuanceOptions.issuanceDate), 'PPP') : format(new Date(), 'PPP')}</p>
							</div>
							<div>
								<span className='text-sm font-medium'>Issuer DID:</span>
								<p className='text-sm text-muted-foreground break-all'>{finalIssuerDID}</p>
								{template.issuerDID && (
									<p className='text-xs text-blue-600 mt-1'>
										<CheckCircle className='h-3 w-3 inline mr-1' />
										From template configuration
									</p>
								)}
								{!template.issuerDID && issuerDID && (
									<p className='text-xs text-green-600 mt-1'>
										<User className='h-3 w-3 inline mr-1' />
										User selected
									</p>
								)}
							</div>
							{issuanceOptions.expirationDate && (
								<div>
									<span className='text-sm font-medium'>Expiration Date:</span>
									<p className='text-sm text-muted-foreground'>{format(new Date(issuanceOptions.expirationDate), 'PPP')}</p>
								</div>
							)}
							{issuanceOptions.additionalContext && issuanceOptions.additionalContext.length > 0 && (
								<div>
									<span className='text-sm font-medium'>Additional Contexts:</span>
									<div className='flex flex-wrap gap-1 mt-1'>
										{issuanceOptions.additionalContext.map((context, index) => (
											<Badge key={index} variant='outline' className='text-xs'>
												{context}
											</Badge>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Credential Data */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Key className='h-5 w-5' />
								Credential Subject Data
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							{Object.entries(credentialData).map(([key, value]) => (
								<div key={key}>
									<span className='text-sm font-medium capitalize'>{key.replace(/([A-Z])/g, ' $1')}:</span>
									<p className='text-sm text-muted-foreground'>{formatValue(value)}</p>
								</div>
							))}
							{Object.keys(credentialData).length === 0 && <p className='text-sm text-muted-foreground italic'>No credential data provided</p>}
						</CardContent>
					</Card>

					{/* Credential Preview */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<Eye className='h-5 w-5' />
									Credential Preview
								</div>
								<Button variant='outline' size='sm' onClick={() => setShowJsonPreview(!showJsonPreview)}>
									{showJsonPreview ? 'Hide JSON' : 'Show JSON'}
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{showJsonPreview ? (
								<pre className='pre-code-json'>{JSON.stringify(credentialPreview, null, 2)}</pre>
							) : (
								<div className='space-y-3'>
									<div className='flex items-center gap-2'>
										<Badge variant='outline'>Verifiable Credential</Badge>
										{template.type.map((type, index) => (
											<Badge key={index} variant='secondary' className='text-xs'>
												{type}
											</Badge>
										))}
									</div>
									<Separator />
									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='font-medium'>Issuer:</span>
											<p className='text-muted-foreground'>Auth3 System</p>
										</div>
										<div>
											<span className='font-medium'>Subject:</span>
											<p className='text-muted-foreground break-all'>{recipientInfo.did || `mailto:${recipientInfo.email}`}</p>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Action Buttons */}
			<div className='flex justify-between'>
				<Button variant='outline' onClick={onBack} disabled={isLoading}>
					Back to Data Entry
				</Button>

				<Button onClick={onIssue} disabled={!validation.isValid || isLoading} className='min-w-32'>
					{isLoading ? (
						<div className='flex items-center gap-2'>
							<Clock className='h-4 w-4 animate-spin' />
							Issuing...
						</div>
					) : (
						<div className='flex items-center gap-2'>
							<CheckCircle className='h-4 w-4' />
							Issue Credential
						</div>
					)}
				</Button>
			</div>
		</div>
	)
}
