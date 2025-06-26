'use client'

import React from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {CheckCircle, XCircle, Download, Copy, Shield} from 'lucide-react'
import {toast} from 'sonner'
import {VerificationResults} from '@/components/credentials/VerificationResults'
import type {VerifyCredentialOutput} from '@/types/credentials'

interface CredentialVerificationResultModalProps {
	isOpen: boolean
	onClose: () => void
	results: VerifyCredentialOutput | null
	className?: string
}

/**
 * CredentialVerificationResultModal Component - Modal specifically for displaying credential verification results
 *
 * Features:
 * - Clean dedicated modal for verification results
 * - Export results as JSON
 * - Copy results to clipboard
 * - Success/failure status indication
 * - Responsive design
 */
export function CredentialVerificationResultModal({isOpen, onClose, results, className = ''}: CredentialVerificationResultModalProps) {
	if (!results) {
		return null
	}

	const isValid = results.valid

	// Export results as JSON
	const handleExportResults = () => {
		try {
			const blob = new Blob([JSON.stringify(results, null, 2)], {
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
		try {
			await navigator.clipboard.writeText(JSON.stringify(results, null, 2))
			toast.success('Results copied to clipboard')
		} catch (error) {
			console.error('Copy error:', error)
			toast.error('Failed to copy results')
		}
	}

	// Calculate verification score
	const getVerificationScore = () => {
		const checks = [results.verificationResults.signatureValid, results.verificationResults.notExpired, results.verificationResults.notRevoked, results.verificationResults.issuerTrusted, results.verificationResults.schemaValid, results.verificationResults.proofValid]
		const passedChecks = checks.filter((check) => check === true).length
		return Math.round((passedChecks / checks.length) * 100)
	}

	// Get status icon and color
	const getStatusIcon = () => {
		if (isValid) {
			return <CheckCircle className='h-6 w-6 text-green-600' />
		}
		return <XCircle className='h-6 w-6 text-red-600' />
	}

	const score = getVerificationScore()

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={`sm:max-w-[800px] max-h-[90vh] overflow-y-auto ${className}`}>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-3'>
						{getStatusIcon()}
						<span>Credential Verification Results</span>
						<span className={`text-lg font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-blue-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>({score}% Score)</span>
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* Status Overview */}
					<Card className={isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
						<CardHeader className='pb-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									{isValid ? <CheckCircle className='h-8 w-8 text-green-600' /> : <XCircle className='h-8 w-8 text-red-600' />}
									<div>
										<CardTitle className={isValid ? 'text-green-800' : 'text-red-800'}>Credential {isValid ? 'Valid' : 'Invalid'}</CardTitle>
										<CardDescription className={isValid ? 'text-green-700' : 'text-red-700'}>{isValid ? 'All verification checks passed successfully' : 'One or more verification checks failed'}</CardDescription>
									</div>
								</div>

								{/* Verification Score */}
								<div className='text-center'>
									<div className={`text-2xl font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-blue-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{score}%</div>
									<div className='text-sm text-muted-foreground'>Score</div>
								</div>
							</div>
						</CardHeader>
					</Card>

					{/* Main Results Display */}
					<VerificationResults result={results} className='border-0 shadow-none bg-transparent' hideMessages={true} />

					{/* Verification Summary Card */}
					<Card className='border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-2 text-slate-800'>
								<Shield className='h-5 w-5 text-slate-600' />
								Verification Summary
							</CardTitle>
							<CardDescription>Key metrics and details from the verification process</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							{/* Stats Grid */}
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<div className='bg-white rounded-lg p-4 text-center shadow-sm border border-slate-200'>
									<div className='text-3xl font-bold text-blue-600 mb-1'>{score}%</div>
									<div className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Score</div>
								</div>
								<div className='bg-white rounded-lg p-4 text-center shadow-sm border border-slate-200'>
									<div className={`text-3xl font-bold mb-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>{isValid ? 'Valid' : 'Invalid'}</div>
									<div className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Status</div>
								</div>
								<div className='bg-white rounded-lg p-4 text-center shadow-sm border border-slate-200'>
									<div className='text-3xl font-bold text-orange-600 mb-1'>{results.warnings?.length || 0}</div>
									<div className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Warnings</div>
								</div>
								<div className='bg-white rounded-lg p-4 text-center shadow-sm border border-slate-200'>
									<div className='text-3xl font-bold text-red-600 mb-1'>{results.errors?.length || 0}</div>
									<div className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Errors</div>
								</div>
							</div>

							{/* Verification Details */}
							<div className='bg-white rounded-lg p-4 border border-slate-200 shadow-sm'>
								<h5 className='text-sm font-semibold text-slate-700 mb-3'>Verification Details</h5>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
									<div className='flex items-center gap-2'>
										<span className='text-slate-500 font-medium'>Verification Time:</span>
										<span className='text-slate-800 font-semibold'>{new Date(results.verifiedAt).toLocaleString()}</span>
									</div>
									<div className='flex items-center gap-2'>
										<span className='text-slate-500 font-medium'>Message:</span>
										<span className='text-slate-800 font-semibold'>{results.verificationResults.message || 'N/A'}</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Errors and Warnings */}
					{results.errors && results.errors.length > 0 && (
						<Card className='border-red-200'>
							<CardHeader>
								<CardTitle className='text-red-600 flex items-center gap-2'>
									<XCircle className='h-5 w-5' />
									Errors
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className='list-disc list-inside space-y-1'>
									{results.errors.map((error, index) => (
										<li key={index} className='text-sm text-red-600'>
											{error}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}

					{results.warnings && results.warnings.length > 0 && (
						<Card className='border-orange-200'>
							<CardHeader>
								<CardTitle className='text-orange-600 flex items-center gap-2'>
									<Shield className='h-5 w-5' />
									Warnings
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className='list-disc list-inside space-y-1'>
									{results.warnings.map((warning, index) => (
										<li key={index} className='text-sm text-orange-600'>
											{warning}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}
				</div>

				<DialogFooter className='flex justify-between items-center'>
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
					<Button type='button' onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default CredentialVerificationResultModal
