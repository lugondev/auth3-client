'use client'

import {CheckCircle, XCircle, AlertTriangle, Clock, Shield, FileText, User, Key} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Separator} from '@/components/ui/separator'
import {Label} from '@/components/ui/label'
import type {VerificationResults as VerificationResultsType} from '@/types/credentials'

// Interface for verification results data
interface VerificationResultsData {
	valid: boolean
	verificationResults: VerificationResultsType
	errors?: string[]
	warnings?: string[]
	verifiedAt: string
}

// Extended interface for component props to include additional verification details
interface ExtendedVerificationResult extends VerificationResultsData {
	issuerVerification?: {
		verified: boolean
		issuerDid?: string
		publicKey?: string
		keyType?: string
	}
	statusCheck?: {
		revoked: boolean
		statusListUrl?: string
		statusListIndex?: number
		checkedAt?: string
	}
	verificationMethod?: string
	challenge?: string
	domain?: string
}

interface VerificationResultsProps {
	result: ExtendedVerificationResult
	className?: string
	hideMessages?: boolean
}

// Utility function to format timestamps
function formatTimestamp(timestamp: string): string {
	try {
		return new Date(timestamp).toLocaleString()
	} catch {
		return timestamp
	}
}

/**
 * VerificationResults Component - Displays credential verification results
 *
 * Features:
 * - Overall verification status
 * - Individual check results
 * - Verification score
 * - Detailed check information
 * - Visual indicators for each check
 */
export function VerificationResults({result, className = '', hideMessages = false}: VerificationResultsProps) {
	// Extract verification results from nested structure
	const verificationResults = result.verificationResults

	// Calculate verification score from individual boolean flags
	const calculateScore = () => {
		const checks = [verificationResults.signatureValid, verificationResults.notExpired, verificationResults.notRevoked, verificationResults.issuerTrusted, verificationResults.schemaValid, verificationResults.proofValid]

		const passedChecks = checks.filter((check) => check === true).length
		return Math.round((passedChecks / checks.length) * 100)
	}

	// Get status color based on overall validity
	const getStatusColor = (isValid: boolean) => {
		return isValid ? 'text-green-600' : 'text-red-600'
	}

	// Get status icon based on overall validity
	const getStatusIcon = (isValid: boolean) => {
		return isValid ? <CheckCircle className='h-4 w-4' /> : <XCircle className='h-4 w-4' />
	}

	// Get check type icon
	const getCheckTypeIcon = (type: string) => {
		switch (type) {
			case 'signature':
				return <Key className='h-4 w-4' />
			case 'status':
				return <Shield className='h-4 w-4' />
			case 'expiration':
				return <Clock className='h-4 w-4' />
			case 'issuer':
				return <User className='h-4 w-4' />
			case 'schema':
				return <FileText className='h-4 w-4' />
			case 'proof':
				return <Shield className='h-4 w-4' />
			default:
				return <CheckCircle className='h-4 w-4' />
		}
	}

	const score = calculateScore()

	// Create individual check objects for display
	const checks = [
		{name: 'Signature', valid: verificationResults.signatureValid, icon: 'signature'},
		{name: 'Not Expired', valid: verificationResults.notExpired, icon: 'expiration'},
		{name: 'Not Revoked', valid: verificationResults.notRevoked, icon: 'status'},
		{name: 'Issuer Trusted', valid: verificationResults.issuerTrusted, icon: 'issuer'},
		{name: 'Schema Valid', valid: verificationResults.schemaValid, icon: 'schema'},
		{name: 'Proof Valid', valid: verificationResults.proofValid, icon: 'proof'},
	]

	const passedChecks = checks.filter((check) => check.valid).length
	const totalChecks = checks.length

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Overall Status */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							{result.valid ? <CheckCircle className='h-6 w-6 text-green-600' /> : <XCircle className='h-6 w-6 text-red-600' />}
							<div>
								<CardTitle className='text-lg'>{result.valid ? 'Verification Successful' : 'Verification Failed'}</CardTitle>
								<CardDescription>Verified at {result.verifiedAt ? formatTimestamp(result.verifiedAt) : 'Unknown'}</CardDescription>
							</div>
						</div>
						<div className='text-right'>
							<div className='text-2xl font-bold'>{score}%</div>
							<div className='text-sm text-muted-foreground'>
								{passedChecks}/{totalChecks} checks passed
							</div>
						</div>
					</div>
					{/* Progress Bar */}
					<div className='space-y-2'>
						<Progress value={score} className='h-2' />
						<div className='flex justify-between text-xs text-muted-foreground'>
							<span>Verification Score</span>
							<span>{score}%</span>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Verification Checks */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Verification Checks
					</CardTitle>
					<CardDescription>Detailed results for each verification check</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{checks.map((check, index) => (
							<div key={index}>
								<div className='flex items-start gap-3'>
									<div className={`mt-0.5 ${getStatusColor(check.valid)}`}>{getStatusIcon(check.valid)}</div>
									<div className='flex-1 space-y-2'>
										<div className='flex items-center gap-2'>
											<div className='text-muted-foreground'>{getCheckTypeIcon(check.icon)}</div>
											<h4 className='font-medium'>{check.name}</h4>
											<Badge variant={check.valid ? 'default' : 'destructive'}>{check.valid ? 'PASSED' : 'FAILED'}</Badge>
										</div>
									</div>
								</div>
								{index < checks.length - 1 && <Separator className='mt-4' />}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Messages */}
			{!hideMessages && (verificationResults.message || result.errors?.length || result.warnings?.length) && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<FileText className='h-5 w-5' />
							Messages
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{verificationResults.message && (
							<div className='flex items-center gap-2'>
								<CheckCircle className='h-4 w-4 text-green-600' />
								<span className='text-sm'>{verificationResults.message}</span>
							</div>
						)}

						{result.errors?.map((error, index) => (
							<div key={`error-${index}`} className='flex items-center gap-2'>
								<XCircle className='h-4 w-4 text-red-600' />
								<span className='text-sm text-red-600'>{error}</span>
							</div>
						))}

						{result.warnings?.map((warning, index) => (
							<div key={`warning-${index}`} className='flex items-center gap-2'>
								<AlertTriangle className='h-4 w-4 text-yellow-600' />
								<span className='text-sm text-yellow-600'>{warning}</span>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{/* Additional Information */}
			{(result.verificationMethod || result.challenge || result.domain) && (
				<Card>
					<CardHeader>
						<CardTitle className='text-lg'>Verification Context</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							{result.verificationMethod && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Verification Method</Label>
									<p className='text-sm font-mono break-all'>{result.verificationMethod}</p>
								</div>
							)}
							{result.challenge && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Challenge</Label>
									<p className='text-sm font-mono break-all'>{result.challenge}</p>
								</div>
							)}
							{result.domain && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Domain</Label>
									<p className='text-sm'>{result.domain}</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
