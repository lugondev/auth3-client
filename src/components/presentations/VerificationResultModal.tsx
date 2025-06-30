'use client'

import React from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {CheckCircle, XCircle, Download, Copy} from 'lucide-react'
import {toast} from 'sonner'
import {PresentationVerificationResults} from '@/components/presentations'
import type {VerifyPresentationResponse, EnhancedVerificationResponse, VerifiablePresentation} from '@/types/presentations'

interface VerificationResultModalProps {
	isOpen: boolean
	onClose: () => void
	results: VerifyPresentationResponse | EnhancedVerificationResponse | null
	presentation?: VerifiablePresentation
	className?: string
}

/**
 * VerificationResultModal Component - Modal specifically for displaying verification results
 *
 * Features:
 * - Clean dedicated modal for verification results
 * - Export results as JSON
 * - Copy results to clipboard
 * - Success/failure status indication
 * - Responsive design
 */
export function VerificationResultModal({isOpen, onClose, results, presentation, className = ''}: VerificationResultModalProps) {
	if (!results) {
		return null
	}

	const isEnhanced = 'trustScore' in results
	const isValid = results.valid
	const trustScore = isEnhanced ? results.trustScore : 0

	// Export results as JSON
	const handleExportResults = () => {
		try {
			const blob = new Blob([JSON.stringify(results, null, 2)], {
				type: 'application/json',
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `verification-results-${new Date().toISOString().split('T')[0]}.json`
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

	// Get modal title based on verification type and result
	const getModalTitle = () => {
		const baseTitle = isEnhanced ? 'Enhanced Verification' : 'Basic Verification'
		if (presentation) {
			const presentationId = presentation.id?.substring(0, 8) || 'Unknown'
			return `${baseTitle} - ${presentationId}...`
		}
		return `${baseTitle} Results`
	}

	// Get status icon and color
	const getStatusIcon = () => {
		if (isValid) {
			return <CheckCircle className='h-6 w-6 text-green-600' />
		}
		return <XCircle className='h-6 w-6 text-red-600' />
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={`sm:max-w-[900px] max-h-[90vh] overflow-y-auto ${className}`}>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-3'>
						{getStatusIcon()}
						<span>{getModalTitle()}</span>
						{isEnhanced && <span className={`text-lg font-bold ${trustScore >= 0.9 ? 'text-green-600' : trustScore >= 0.7 ? 'text-blue-600' : trustScore >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>({trustScore} Trust Score)</span>}
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* Main Results Display */}
					<PresentationVerificationResults results={results} className='border-0 shadow-none bg-transparent' />

					{/* Enhanced Specific Information */}
					{isEnhanced && (
						<div className='bg-slate-50 rounded-lg p-4 space-y-4'>
							<h4 className='font-semibold text-slate-800'>Enhanced Verification Details</h4>

							{/* Trust Score Breakdown */}
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<div className='text-center'>
									<div className='text-2xl font-bold text-blue-600'>{trustScore.toFixed(1)}</div>
									<div className='text-sm text-muted-foreground'>Trust Score</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-green-600'>{(results as EnhancedVerificationResponse).credentialResults?.filter((r) => r.valid).length || 0}</div>
									<div className='text-sm text-muted-foreground'>Valid Credentials</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-orange-600'>{(results as EnhancedVerificationResponse).warnings?.length || 0}</div>
									<div className='text-sm text-muted-foreground'>Warnings</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-red-600'>{(results as EnhancedVerificationResponse).errors?.length || 0}</div>
									<div className='text-sm text-muted-foreground'>Errors</div>
								</div>
							</div>

							{/* Policy Results Summary */}
							{(results as EnhancedVerificationResponse).policyResults && (
								<div className='space-y-2'>
									<h5 className='font-medium text-slate-700'>Policy Verification</h5>
									<div className='space-y-1'>
										<div className='flex items-center justify-between text-sm'>
											<span>Policy Status</span>
											<span className={(results as EnhancedVerificationResponse).policyResults?.policyValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{(results as EnhancedVerificationResponse).policyResults?.policyValid ? 'Valid' : 'Invalid'}</span>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Verification Summary Stats */}
					<div className='bg-slate-50 rounded-lg p-4 space-y-2'>
						<h4 className='font-semibold text-slate-800'>Summary</h4>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
							<div>
								<span className='text-slate-600'>Verification Type:</span>
								<span className='ml-2 font-medium'>
									<span className={isEnhanced ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}>{isEnhanced ? 'Enhanced' : 'Basic'}</span>
								</span>
							</div>
							<div>
								<span className='text-slate-600'>Overall Status:</span>
								<span className={`ml-2 font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>{isValid ? 'Valid' : 'Invalid'}</span>
							</div>
							<div>
								<span className='text-slate-600'>Verified At:</span>
								<span className='ml-2 font-medium text-slate-800 dark:text-gray-300'>{new Date().toLocaleString()}</span>
							</div>
						</div>
					</div>
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

export default VerificationResultModal
