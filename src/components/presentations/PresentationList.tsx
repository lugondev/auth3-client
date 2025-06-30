'use client'

import {useState, useEffect, useCallback} from 'react'
import {Plus, Search, RefreshCw, Trash2} from 'lucide-react'
import {toast} from 'sonner'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
import {Checkbox} from '@/components/ui/checkbox'

import {PresentationCard} from './PresentationCard'
import {VerificationResultModal} from './VerificationResultModal'

import {VerifiablePresentation, PresentationStatus, PresentationFilterOptions, VerifyPresentationResponse, EnhancedVerificationResponse} from '@/types/presentations'
import {getMyPresentations, deletePresentation, verifyPresentationEnhanced} from '@/services/presentationService'

interface PresentationListProps {
	className?: string
	onShare?: (presentation: VerifiablePresentation) => void
	onVerify?: (presentation: VerifiablePresentation) => void
}

/**
 * PresentationList Component - Main presentation management interface
 *
 * Features:
 * - List all user presentations with filtering and search
 * - Create new presentations
 * - Bulk operations (delete, status update)
 * - Individual presentation actions (view, verify, share, delete)
 * - Pagination and sorting
 * - Real-time updates
 */
export function PresentationList({className = '', onShare, onVerify}: PresentationListProps) {
	const [presentations, setPresentations] = useState<VerifiablePresentation[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedPresentations, setSelectedPresentations] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState('')
	const [filters, setFilters] = useState<PresentationFilterOptions>({
		status: undefined,
		purpose: '',
		sortBy: 'createdAt',
		sortOrder: 'desc',
		page: 1,
		limit: 20,
	})

	// Bulk delete state
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
	const [bulkDeleting, setBulkDeleting] = useState(false)

	// Verification result state
	const [showVerificationResult, setShowVerificationResult] = useState(false)
	const [verificationResults, setVerificationResults] = useState<VerifyPresentationResponse | EnhancedVerificationResponse | null>(null)
	const [verifyingPresentation, setVerifyingPresentation] = useState<VerifiablePresentation | null>(null)
	const [isVerifying, setIsVerifying] = useState(false)

	// Load presentations
	const loadPresentations = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await getMyPresentations({
				...filters,
				offset: ((filters.page || 1) - 1) * (filters.limit || 20),
			})

			// Ensure we always set an array, never null
			setPresentations(Array.isArray(response.presentations) ? response.presentations : [])
		} catch (err) {
			console.error('Failed to load presentations:', err)
			setError('Failed to load presentations')
			toast.error('Failed to load presentations')
			// Set empty array on error to prevent null reference
			setPresentations([])
		} finally {
			setLoading(false)
		}
	}, [filters])

	// Load presentations on mount and filter changes
	useEffect(() => {
		loadPresentations()
	}, [loadPresentations])

	// Search functionality
	const filteredPresentations = (presentations || []).filter((presentation) => {
		if (!searchQuery) return true

		const query = searchQuery.toLowerCase()
		return presentation.id?.toLowerCase().includes(query) || presentation.holder?.toLowerCase().includes(query) || (Array.isArray(presentation.type) && presentation.type.some((type) => typeof type === 'string' && type.toLowerCase().includes(query)))
	})

	// Selection handlers
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const validPresentations = filteredPresentations.filter((p) => p.id)
			setSelectedPresentations(new Set(validPresentations.map((p) => p.id).filter(Boolean)))
		} else {
			setSelectedPresentations(new Set())
		}
	}

	const handleSelectPresentation = (presentationId: string, checked: boolean) => {
		const newSelection = new Set(selectedPresentations)
		if (checked) {
			newSelection.add(presentationId)
		} else {
			newSelection.delete(presentationId)
		}
		setSelectedPresentations(newSelection)
	}

	// Action handlers
	const handleDelete = async (presentationId: string) => {
		try {
			await deletePresentation(presentationId)
			setPresentations((prev) => (prev || []).filter((p) => p.id !== presentationId))
			toast.success('Presentation deleted successfully')
		} catch (error) {
			console.error('Delete error:', error)
			toast.error('Failed to delete presentation')
		}
	}

	const handleBulkDelete = async () => {
		if (selectedPresentations.size === 0) return

		setBulkDeleting(true)
		try {
			const presentationIds = Array.from(selectedPresentations)
			const results = await Promise.allSettled(presentationIds.map((id) => deletePresentation(id)))

			const successCount = results.filter((r) => r.status === 'fulfilled').length
			const failureCount = results.filter((r) => r.status === 'rejected').length

			if (successCount > 0) {
				// Remove successfully deleted presentations
				setPresentations((prev) => (prev || []).filter((p) => !selectedPresentations.has(p.id)))
				setSelectedPresentations(new Set())
				toast.success(`${successCount} presentation${successCount !== 1 ? 's' : ''} deleted`)
			}

			if (failureCount > 0) {
				toast.error(`Failed to delete ${failureCount} presentation${failureCount !== 1 ? 's' : ''}`)
			}
		} catch (error) {
			console.error('Bulk delete error:', error)
			toast.error('Failed to delete presentations')
		} finally {
			setBulkDeleting(false)
			setShowBulkDeleteDialog(false)
		}
	}

	const handleShare = (presentation: VerifiablePresentation) => {
		if (onShare) {
			onShare(presentation)
		} else {
			toast.info('Share presentation feature coming soon')
		}
	}

	const handleVerify = async (presentation: VerifiablePresentation) => {
		console.log('Verifying presentation:', presentation)

		// If onVerify callback is provided, use it (for external control)
		if (onVerify) {
			onVerify(presentation)
			return
		}

		// Auto-verify the presentation and show results
		setIsVerifying(true)
		setVerifyingPresentation(presentation)

		try {
			toast.info('Verifying presentation...')

			// Perform enhanced verification with comprehensive options
			const verificationRequest = {
				presentation,
				verificationOptions: {
					verifySignature: true,
					verifyExpiration: true,
					verifyRevocation: true,
					verifyIssuerTrust: true,
					verifySchema: true,
					verifyChallenge: true,
					verifyDomain: true,
					strictMode: false,
					recordVerification: true,
				},
				metadata: {
					source: 'presentation_list',
					timestamp: new Date().toISOString(),
					userAgent: navigator.userAgent,
				},
			}

			const results = await verifyPresentationEnhanced(verificationRequest)

			// Show success/failure toast
			if (results.valid) {
				const trustScore = results.trustScore ? Math.round(results.trustScore * 100) : 0
				toast.success(`Verification completed! Trust Score: ${trustScore}%`)
			} else {
				toast.error('Verification failed - see results for details')
			}

			// Set results and show modal
			setVerificationResults(results)
			setShowVerificationResult(true)
		} catch (error) {
			console.error('Verification error:', error)
			toast.error('Failed to verify presentation')

			// Create error result
			const errorResult: EnhancedVerificationResponse = {
				valid: false,
				trustScore: 0,
				presentationResults: {
					signatureValid: false,
					proofValid: false,
					challengeValid: false,
					domainValid: false,
					holderVerified: false,
					credentialsValid: false,
					message: 'Verification service error',
				},
				errors: [error instanceof Error ? error.message : 'Unknown verification error'],
				verifiedAt: new Date().toISOString(),
			}

			setVerificationResults(errorResult)
			setShowVerificationResult(true)
		} finally {
			setIsVerifying(false)
		}
	}

	const handleRefresh = () => {
		loadPresentations()
	}

	const handleCloseVerificationResult = () => {
		setShowVerificationResult(false)
		setVerificationResults(null)
		setVerifyingPresentation(null)
	}

	const isAllSelected = filteredPresentations.length > 0 && filteredPresentations.every((p) => p.id && selectedPresentations.has(p.id))

	const isSomeSelected = selectedPresentations.size > 0

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Presentations</h1>
					<p className='text-muted-foreground'>Manage your verifiable presentations and share credentials securely</p>
				</div>
				<div className='flex gap-2'>
					<Button onClick={handleRefresh} variant='outline' size='sm'>
						<RefreshCw className='h-4 w-4 mr-2' />
						Refresh
					</Button>
				</div>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle>Filter & Search</CardTitle>
					<CardDescription>Find presentations using filters and search terms</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
						{/* Search */}
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
								<Input placeholder='Search presentations...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-8' />
							</div>
						</div>

						{/* Status Filter */}
						<Select
							value={filters.status || 'all'}
							onValueChange={(value) =>
								setFilters((prev) => ({
									...prev,
									status: value === 'all' ? undefined : (value as PresentationStatus),
								}))
							}>
							<SelectTrigger className='w-40'>
								<SelectValue placeholder='Status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Status</SelectItem>
								<SelectItem value={PresentationStatus.DRAFT}>Draft</SelectItem>
								<SelectItem value={PresentationStatus.SUBMITTED}>Submitted</SelectItem>
								<SelectItem value={PresentationStatus.VERIFIED}>Verified</SelectItem>
								<SelectItem value={PresentationStatus.REJECTED}>Rejected</SelectItem>
							</SelectContent>
						</Select>

						{/* Sort */}
						<Select
							value={`${filters.sortBy}-${filters.sortOrder}`}
							onValueChange={(value) => {
								const [sortBy, sortOrder] = value.split('-')
								setFilters((prev) => ({...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc'}))
							}}>
							<SelectTrigger className='w-48'>
								<SelectValue placeholder='Sort by' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='createdAt-desc'>Newest First</SelectItem>
								<SelectItem value='createdAt-asc'>Oldest First</SelectItem>
								<SelectItem value='updatedAt-desc'>Recently Updated</SelectItem>
								<SelectItem value='status-asc'>Status A-Z</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Bulk Actions */}
			{isSomeSelected && (
				<Card className='border-amber-200 bg-amber-50'>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Badge variant='secondary'>{selectedPresentations.size} selected</Badge>
								<span className='text-sm text-muted-foreground'>
									{selectedPresentations.size} presentation{selectedPresentations.size !== 1 ? 's' : ''} selected
								</span>
							</div>
							<div className='flex gap-2'>
								<Button variant='outline' size='sm' onClick={() => setSelectedPresentations(new Set())}>
									Clear Selection
								</Button>
								<AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
									<AlertDialogTrigger asChild>
										<Button variant='destructive' size='sm'>
											<Trash2 className='h-4 w-4 mr-2' />
											Delete Selected
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete Presentations</AlertDialogTitle>
											<AlertDialogDescription>
												Are you sure you want to delete {selectedPresentations.size} presentation{selectedPresentations.size !== 1 ? 's' : ''}? This action cannot be undone.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
											<AlertDialogAction onClick={handleBulkDelete} className='bg-red-600 hover:bg-red-700' disabled={bulkDeleting}>
												{bulkDeleting ? 'Deleting...' : 'Delete All'}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Presentations List */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle>Your Presentations</CardTitle>
							<CardDescription>
								{filteredPresentations.length} presentation{filteredPresentations.length !== 1 ? 's' : ''} found
							</CardDescription>
						</div>

						{/* Select All */}
						{filteredPresentations.length > 0 && (
							<div className='flex items-center space-x-2'>
								<Checkbox id='select-all' checked={isAllSelected} onCheckedChange={handleSelectAll} />
								<label htmlFor='select-all' className='text-sm font-medium'>
									Select All
								</label>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex items-center justify-center py-12'>
							<RefreshCw className='h-6 w-6 animate-spin mr-2' />
							<span>Loading presentations...</span>
						</div>
					) : error ? (
						<div className='text-center py-12'>
							<p className='text-red-600 mb-4'>{error}</p>
							<Button onClick={handleRefresh} variant='outline'>
								Try Again
							</Button>
						</div>
					) : filteredPresentations.length === 0 ? (
						<div className='text-center py-12'>
							<p className='text-muted-foreground mb-4'>{searchQuery || filters.status ? 'No presentations match your criteria' : 'No presentations found'}</p>
							{!searchQuery && !filters.status && <Button onClick={() => toast.info('Create presentation feature coming soon')}>Create Your First Presentation</Button>}
						</div>
					) : (
						<div className='space-y-4'>
							{filteredPresentations.map((presentation) => (
								<div key={presentation.id} className='flex items-center space-x-4'>
									<Checkbox checked={presentation.id ? selectedPresentations.has(presentation.id) : false} onCheckedChange={(checked) => presentation.id && handleSelectPresentation(presentation.id, checked as boolean)} />
									<div className='flex-1'>
										<PresentationCard presentation={presentation} status={presentation.status} onDelete={handleDelete} onShare={() => handleShare(presentation)} onVerify={() => handleVerify(presentation)} showActions={true} className='w-full' isVerifying={isVerifying && verifyingPresentation?.id === presentation.id} />
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Verification Result Modal */}
			{verifyingPresentation && <VerificationResultModal isOpen={showVerificationResult} onClose={handleCloseVerificationResult} results={verificationResults} presentation={verifyingPresentation} />}
		</div>
	)
}
