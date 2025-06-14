'use client'

import {CheckCircle, XCircle, AlertTriangle, Clock, Shield, FileText, User, Key} from 'lucide-react'

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Progress} from '@/components/ui/progress'
import {Separator} from '@/components/ui/separator'
import {Label} from '@/components/ui/label'

import type {VerifyCredentialOutput} from '@/types/credentials'

// Extended interface for component props to include additional verification details
interface ExtendedVerificationResult extends VerifyCredentialOutput {
	verifiedAt?: string
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
export function VerificationResults({result, className = ''}: VerificationResultsProps) {
	// Calculate verification score
	const calculateScore = () => {
		if (!result.checks || result.checks.length === 0) return 0

		const passedChecks = result.checks.filter((check) => check.status === 'passed').length
		return Math.round((passedChecks / result.checks.length) * 100)
	}

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'passed':
				return 'text-green-600'
			case 'failed':
				return 'text-red-600'
			case 'warning':
				return 'text-yellow-600'
			case 'skipped':
				return 'text-gray-500'
			default:
				return 'text-gray-500'
		}
	}

	// Get status icon
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'passed':
				return <CheckCircle className='h-4 w-4' />
			case 'failed':
				return <XCircle className='h-4 w-4' />
			case 'warning':
				return <AlertTriangle className='h-4 w-4' />
			case 'skipped':
				return <Clock className='h-4 w-4' />
			default:
				return <Clock className='h-4 w-4' />
		}
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
			default:
				return <Shield className='h-4 w-4' />
		}
	}

	// Format timestamp
	const formatTimestamp = (timestamp: string) => {
		try {
			return new Date(timestamp).toLocaleString()
		} catch {
			return timestamp
		}
	}

	const score = calculateScore()
	const passedChecks = result.checks?.filter((check) => check.status === 'passed').length || 0
	const totalChecks = result.checks?.length || 0

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Overall Status */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							{result.verified ? <CheckCircle className='h-6 w-6 text-green-600' /> : <XCircle className='h-6 w-6 text-red-600' />}
							<div>
								<CardTitle className='text-lg'>{result.verified ? 'Verification Successful' : 'Verification Failed'}</CardTitle>
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
			{result.checks && result.checks.length > 0 && (
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
							{result.checks.map((check, index) => (
								<div key={index}>
									<div className='flex items-start gap-3'>
										<div className={`mt-0.5 ${getStatusColor(check.status)}`}>{getStatusIcon(check.status)}</div>

										<div className='flex-1 space-y-2'>
											<div className='flex items-center gap-2'>
												<div className='text-muted-foreground'>{getCheckTypeIcon(check.check)}</div>
												<h4 className='font-medium'>{check.check}</h4>
												<Badge variant={check.status === 'passed' ? 'default' : check.status === 'failed' ? 'destructive' : check.status === 'warning' ? 'secondary' : 'outline'}>{check.status}</Badge>
											</div>

											{check.message && <p className='text-sm text-muted-foreground'>{check.message}</p>}
										</div>
									</div>

									{index < result.checks.length - 1 && <Separator className='mt-4' />}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Verification Details */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{/* Issuer Verification */}
				{result.issuerVerification && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-lg'>
								<User className='h-5 w-5' />
								Issuer Verification
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium'>Status</span>
								<Badge variant={result.issuerVerification.verified ? 'default' : 'destructive'}>{result.issuerVerification.verified ? 'Verified' : 'Failed'}</Badge>
							</div>

							{result.issuerVerification.issuerDid && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Issuer DID</Label>
									<p className='text-sm font-mono break-all'>{result.issuerVerification.issuerDid}</p>
								</div>
							)}

							{result.issuerVerification.publicKey && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Public Key</Label>
									<p className='text-sm font-mono break-all'>{result.issuerVerification.publicKey}</p>
								</div>
							)}

							{result.issuerVerification.keyType && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Key Type</Label>
									<p className='text-sm'>{result.issuerVerification.keyType}</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Status Check */}
				{result.statusCheck && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-lg'>
								<Shield className='h-5 w-5' />
								Status Check
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium'>Status</span>
								<Badge variant={result.statusCheck.revoked ? 'destructive' : 'default'}>{result.statusCheck.revoked ? 'Revoked' : 'Active'}</Badge>
							</div>

							{result.statusCheck.statusListUrl && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Status List URL</Label>
									<p className='text-sm font-mono break-all'>{result.statusCheck.statusListUrl}</p>
								</div>
							)}

							{result.statusCheck.statusListIndex !== undefined && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Status Index</Label>
									<p className='text-sm'>{result.statusCheck.statusListIndex}</p>
								</div>
							)}

							{result.statusCheck.checkedAt && (
								<div>
									<Label className='text-xs font-medium text-muted-foreground'>Checked At</Label>
									<p className='text-sm'>{formatTimestamp(result.statusCheck.checkedAt)}</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>

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
