'use client'

import React, {useState, useEffect} from 'react'
import {
	PresentationList, 
	CreatePresentationModal, 
	VerifyPresentationModal, 
	SharePresentationModal, 
	VerificationResultModal,
	SelectiveDisclosure,
	BatchVerification,
	PresentationAnalytics
} from '@/components/presentations'
import { VPStateAnalytics } from '@/components/presentations/VPStateAnalytics'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Plus, Eye, BarChart3, Shield, FileCheck, Activity} from 'lucide-react'
import {toast} from 'sonner'
import {getPresentationStatistics, verifyPresentationEnhanced} from '@/services/presentationService'
import {triggerVPStateTransition} from '@/services/vpStateMachineService'
import type {PresentationStatistics, VerifiablePresentation, EnhancedVerificationResponse} from '@/types/presentations'

export default function PresentationsPage() {
	const [statistics, setStatistics] = useState<PresentationStatistics | null>(null)
	const [isLoadingStats, setIsLoadingStats] = useState(true)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showVerifyModal, setShowVerifyModal] = useState(false)
	const [showShareModal, setShowShareModal] = useState(false)
	const [selectedPresentation, setSelectedPresentation] = useState<VerifiablePresentation | null>(null)
	const [refreshKey, setRefreshKey] = useState(0)

	// Verification state
	const [verificationResults, setVerificationResults] = useState<EnhancedVerificationResponse | null>(null)
	const [showVerificationModal, setShowVerificationModal] = useState(false)

	// Advanced features state
	const [showSelectiveDisclosure, setShowSelectiveDisclosure] = useState(false)
	const [selectedCredentialForSD, setSelectedCredentialForSD] = useState(null)
	const [showBatchVerification, setShowBatchVerification] = useState(false)
	const [selectedCredentialsForBatch, setSelectedCredentialsForBatch] = useState([])
	const [activeTab, setActiveTab] = useState('presentations')

	// Load presentation statistics
	useEffect(() => {
		loadStatistics()
	}, [refreshKey])

	const loadStatistics = async () => {
		try {
			setIsLoadingStats(true)
			const stats = await getPresentationStatistics()
			setStatistics(stats)
		} catch (error) {
			console.error('Failed to load presentation statistics:', error)
			toast.error('Failed to load statistics')
		} finally {
			setIsLoadingStats(false)
		}
	}

	const handlePresentationCreated = () => {
		toast.success('Presentation created successfully!')
		setRefreshKey((prev) => prev + 1) // Trigger refresh
	}

	// Auto-verify presentation and show results with state machine integration
	const handleAutoVerify = async (presentation: VerifiablePresentation) => {
		setSelectedPresentation(presentation)

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
					verifyChallenge: false,
					verifyDomain: false,
					strictMode: false,
					recordVerification: true,
				},
				includeCredentialVerification: true,
				includeTrustScore: true,
				includeComplianceChecks: true,
				metadata: {
					source: 'dashboard_auto_verify',
					timestamp: new Date().toISOString(),
					userAgent: navigator.userAgent,
				},
			}

			const results = await verifyPresentationEnhanced(verificationRequest)

			// Show success/failure toast
			if (results.valid) {
				const trustScore = results.trustScore ? Math.round(results.trustScore) : 0
				toast.success(`Verification completed! Trust Score: ${trustScore}`)
			} else {
				toast.error('Verification failed - see results for details')
			}

			// Set results and show modal
			setVerificationResults(results)
			setShowVerificationModal(true)
		} catch (error) {
			console.error('Verification error:', error)
			toast.error(error instanceof Error ? error.message : 'Verification failed')
		}
	}

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Presentations</h1>
					<p className='text-muted-foreground'>Manage your verifiable presentations and advanced features</p>
				</div>
				<div className='flex gap-2'>
					<Button onClick={() => setShowCreateModal(true)}>
						<Plus className='mr-2 h-4 w-4' />
						Create Presentation
					</Button>
					<Button variant='outline' onClick={() => setShowVerifyModal(true)}>
						<Eye className='mr-2 h-4 w-4' />
						Verify Presentation
					</Button>
					<Button variant='outline' onClick={() => setShowBatchVerification(true)}>
						<FileCheck className='mr-2 h-4 w-4' />
						Batch Verify
					</Button>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Total Presentations</CardTitle>
						<BarChart3 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{isLoadingStats ? '...' : statistics?.totalPresentations || 0}</div>
						<p className='text-xs text-muted-foreground'>{statistics?.createdThisMonth || 0} created this month</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Verified</CardTitle>
						<Eye className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>{isLoadingStats ? '...' : statistics?.validPresentations || 0}</div>
						<p className='text-xs text-muted-foreground'>Successfully verified presentations</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Pending</CardTitle>
						<Plus className='h-4 w-4 text-orange-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-orange-600'>{isLoadingStats ? '...' : statistics?.pendingPresentations || 0}</div>
						<p className='text-xs text-muted-foreground'>Awaiting verification</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>This Week</CardTitle>
						<BarChart3 className='h-4 w-4 text-blue-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-blue-600'>{isLoadingStats ? '...' : statistics?.createdThisWeek || 0}</div>
						<p className='text-xs text-muted-foreground'>Created in the last 7 days</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content with Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="presentations">My Presentations</TabsTrigger>
					<TabsTrigger value="state-machine">State Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="presentations" className="mt-6 space-y-6">
					{/* Presentations List */}
					<Card>
						<CardHeader>
							<CardTitle>Your Presentations</CardTitle>
							<CardDescription>View and manage all your verifiable presentations</CardDescription>
						</CardHeader>
						<CardContent>
							<PresentationList
								key={refreshKey}
								onShare={(presentation) => {
									setSelectedPresentation(presentation)
									setShowShareModal(true)
								}}
								onVerify={handleAutoVerify}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="state-machine" className="mt-6">
					<VPStateAnalytics 
						autoRefresh={true}
						dateRange={{
							startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
							endDate: new Date().toISOString()
						}}
					/>
				</TabsContent>
			</Tabs>

			{/* Modals */}
			<CreatePresentationModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handlePresentationCreated} />

			<VerifyPresentationModal
				isOpen={showVerifyModal}
				onClose={() => {
					setShowVerifyModal(false)
					setSelectedPresentation(null)
				}}
				initialPresentation={selectedPresentation ? JSON.stringify(selectedPresentation, null, 2) : ''}
			/>

			{selectedPresentation && (
				<SharePresentationModal
					isOpen={showShareModal}
					onClose={() => {
						setShowShareModal(false)
						setSelectedPresentation(null)
					}}
					presentation={selectedPresentation}
				/>
			)}

			{/* Verification Results Modal */}
			{verificationResults && selectedPresentation && (
				<VerificationResultModal
					isOpen={showVerificationModal}
					onClose={() => {
						setShowVerificationModal(false)
						setVerificationResults(null)
						setSelectedPresentation(null)
					}}
					results={verificationResults}
					presentation={selectedPresentation}
				/>
			)}

			{/* Advanced Features Modals */}
			{selectedCredentialForSD && (
				<SelectiveDisclosure
					isOpen={showSelectiveDisclosure}
					onClose={() => {
						setShowSelectiveDisclosure(false)
						setSelectedCredentialForSD(null)
					}}
					credential={selectedCredentialForSD}
					onSuccess={(sdCredential) => {
						toast.success('Selective disclosure credential created!')
						setShowSelectiveDisclosure(false)
						setSelectedCredentialForSD(null)
					}}
				/>
			)}

			<BatchVerification
				isOpen={showBatchVerification}
				onClose={() => setShowBatchVerification(false)}
				items={selectedCredentialsForBatch}
				onComplete={(results) => {
					toast.success(`Batch verification completed! ${results.filter(r => r.status === 'verified').length} verified, ${results.filter(r => r.status === 'failed').length} failed`)
					setShowBatchVerification(false)
					setSelectedCredentialsForBatch([])
				}}
				mode="credentials"
			/>

		</div>
	)
}
