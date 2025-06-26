'use client'

import React, {useState, useEffect} from 'react'
import {PresentationList, CreatePresentationModal, VerifyPresentationModal, SharePresentationModal} from '@/components/presentations'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Plus, Eye, BarChart3} from 'lucide-react'
import {toast} from 'sonner'
import {getPresentationStatistics} from '@/services/presentationService'
import type {PresentationStatistics, VerifiablePresentation} from '@/types/presentations'

export default function PresentationsPage() {
	const [statistics, setStatistics] = useState<PresentationStatistics | null>(null)
	const [isLoadingStats, setIsLoadingStats] = useState(true)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showVerifyModal, setShowVerifyModal] = useState(false)
	const [showShareModal, setShowShareModal] = useState(false)
	const [selectedPresentation, setSelectedPresentation] = useState<VerifiablePresentation | null>(null)
	const [refreshKey, setRefreshKey] = useState(0)

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

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Presentations</h1>
					<p className='text-muted-foreground'>Manage your verifiable presentations and view verification status</p>
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
					/>
				</CardContent>
			</Card>

			{/* Modals */}
			<CreatePresentationModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handlePresentationCreated} />

			<VerifyPresentationModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} />

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
		</div>
	)
}
