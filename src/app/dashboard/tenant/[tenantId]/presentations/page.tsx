'use client'

import React, {useState, useEffect} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Presentation, Plus, Search, Eye, RefreshCw, Shield, CheckCircle, AlertCircle, Clock, Share2} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'

interface VerifiablePresentation {
	id: string
	type: string[]
	holder: string
	verifiableCredential: string[]
	proof: {
		type: string
		created: string
		verificationMethod: string
		proofPurpose: string
	}
	status: 'active' | 'expired' | 'revoked' | 'pending'
	purpose: string
	createdAt: string
	expiresAt?: string
}

export default function TenantPresentationsPage() {
	const params = useParams()
	const tenantId = params.tenantId as string

	const [presentations, setPresentations] = useState<VerifiablePresentation[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [selectedPresentation, setSelectedPresentation] = useState<VerifiablePresentation | null>(null)

	// Mock data for development
	useEffect(() => {
		const mockPresentations: VerifiablePresentation[] = [
			{
				id: 'vp_1234567890',
				type: ['VerifiablePresentation'],
				holder: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
				verifiableCredential: ['cred_1234567890', 'cred_0987654321'],
				proof: {
					type: 'Ed25519Signature2020',
					created: '2024-12-15T14:30:00Z',
					verificationMethod: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH#z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
					proofPurpose: 'authentication',
				},
				status: 'active',
				purpose: 'Job Application - Senior Developer Position',
				createdAt: '2024-12-15T14:30:00Z',
				expiresAt: '2024-12-22T14:30:00Z',
			},
			{
				id: 'vp_2345678901',
				type: ['VerifiablePresentation'],
				holder: 'did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVCM',
				verifiableCredential: ['cred_education_001'],
				proof: {
					type: 'Ed25519Signature2020',
					created: '2024-12-10T09:15:00Z',
					verificationMethod: 'did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVCM#z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVCM',
					proofPurpose: 'authentication',
				},
				status: 'expired',
				purpose: 'University Enrollment Verification',
				createdAt: '2024-12-10T09:15:00Z',
				expiresAt: '2024-12-14T09:15:00Z',
			},
			{
				id: 'vp_3456789012',
				type: ['VerifiablePresentation'],
				holder: 'did:key:z6MknoJFLookup1ivmd7aWBhXQO6L2fKnNWEswLyyN1p9DLJ',
				verifiableCredential: ['cred_certification_001', 'cred_certification_002'],
				proof: {
					type: 'Ed25519Signature2020',
					created: '2024-12-16T16:45:00Z',
					verificationMethod: 'did:key:z6MknoJFLookup1ivmd7aWBhXQO6L2fKnNWEswLyyN1p9DLJ#z6MknoJFLookup1ivmd7aWBhXQO6L2fKnNWEswLyyN1p9DLJ',
					proofPurpose: 'authentication',
				},
				status: 'pending',
				purpose: 'Professional Certification Portfolio',
				createdAt: '2024-12-16T16:45:00Z',
			},
		]

		setTimeout(() => {
			setPresentations(mockPresentations)
			setLoading(false)
		}, 1000)
	}, [])

	const filteredPresentations = presentations.filter((pres) => {
		const matchesSearch = pres.purpose.toLowerCase().includes(searchTerm.toLowerCase()) || pres.id.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesStatus = statusFilter === 'all' || pres.status === statusFilter

		return matchesSearch && matchesStatus
	})

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'active':
				return <CheckCircle className='h-4 w-4 text-green-600' />
			case 'expired':
				return <Clock className='h-4 w-4 text-orange-600' />
			case 'revoked':
				return <AlertCircle className='h-4 w-4 text-red-600' />
			case 'pending':
				return <Clock className='h-4 w-4 text-blue-600' />
			default:
				return <Shield className='h-4 w-4' />
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'default'
			case 'expired':
				return 'secondary'
			case 'revoked':
				return 'destructive'
			case 'pending':
				return 'outline'
			default:
				return 'secondary'
		}
	}

	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='flex items-center justify-center h-64'>
					<RefreshCw className='h-8 w-8 animate-spin' />
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Presentations Management</h1>
						<p className='text-muted-foreground'>Manage verifiable presentations for tenant: {tenantId}</p>
					</div>

					<Button>
						<Plus className='mr-2 h-4 w-4' />
						Create Presentation
					</Button>
				</div>

				{/* Stats Cards */}
				<div className='grid gap-4 md:grid-cols-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Total Presentations</CardTitle>
							<Presentation className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{presentations.length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active</CardTitle>
							<CheckCircle className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{presentations.filter((p) => p.status === 'active').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Expired</CardTitle>
							<Clock className='h-4 w-4 text-orange-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{presentations.filter((p) => p.status === 'expired').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Shared</CardTitle>
							<Share2 className='h-4 w-4 text-blue-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{presentations.filter((p) => p.purpose.includes('Shared')).length}</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle className='text-lg'>Filters</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex gap-4 flex-wrap'>
							<div className='flex-1 min-w-[200px]'>
								<Label htmlFor='search'>Search</Label>
								<div className='relative'>
									<Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
									<Input id='search' placeholder='Search presentations...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-8' />
								</div>
							</div>

							<div className='min-w-[150px]'>
								<Label>Status</Label>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All Status</SelectItem>
										<SelectItem value='active'>Active</SelectItem>
										<SelectItem value='expired'>Expired</SelectItem>
										<SelectItem value='revoked'>Revoked</SelectItem>
										<SelectItem value='pending'>Pending</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Presentations List */}
				<div className='space-y-4'>
					{filteredPresentations.map((presentation) => (
						<Card key={presentation.id}>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<div className='space-y-1'>
										<div className='flex items-center gap-2'>
											<CardTitle className='text-lg'>{presentation.purpose}</CardTitle>
											<Badge variant={getStatusColor(presentation.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
												{getStatusIcon(presentation.status)}
												<span className='ml-1'>{presentation.status}</span>
											</Badge>
											<Badge variant='outline'>
												{presentation.verifiableCredential.length} Credential{presentation.verifiableCredential.length !== 1 ? 's' : ''}
											</Badge>
										</div>
										<p className='text-sm text-muted-foreground'>ID: {presentation.id}</p>
									</div>

									<div className='flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => setSelectedPresentation(presentation)}>
											<Eye className='h-4 w-4' />
										</Button>
										<Button variant='outline' size='sm'>
											<Share2 className='h-4 w-4' />
										</Button>
									</div>
								</div>
							</CardHeader>

							<CardContent>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
									<div>
										<Label className='text-xs text-muted-foreground'>Created</Label>
										<p>{new Date(presentation.createdAt).toLocaleDateString()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Expires</Label>
										<p>{presentation.expiresAt ? new Date(presentation.expiresAt).toLocaleDateString() : 'Never'}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Holder</Label>
										<p className='truncate'>{presentation.holder.split(':').pop()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Credentials</Label>
										<p>{presentation.verifiableCredential.length} included</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{filteredPresentations.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<Presentation className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No presentations found</h3>
								<p className='text-muted-foreground mb-4'>{searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters to see more results.' : 'Create your first verifiable presentation to get started.'}</p>
								{!searchTerm && statusFilter === 'all' && (
									<Button>
										<Plus className='mr-2 h-4 w-4' />
										Create First Presentation
									</Button>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Presentation Detail Dialog */}
				<Dialog open={!!selectedPresentation} onOpenChange={() => setSelectedPresentation(null)}>
					<DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
						<DialogHeader>
							<DialogTitle>Presentation Details</DialogTitle>
							<DialogDescription>{selectedPresentation?.purpose || 'Presentation Information'}</DialogDescription>
						</DialogHeader>

						{selectedPresentation && (
							<Tabs defaultValue='overview' className='w-full'>
								<TabsList className='grid w-full grid-cols-3'>
									<TabsTrigger value='overview'>Overview</TabsTrigger>
									<TabsTrigger value='credentials'>Credentials</TabsTrigger>
									<TabsTrigger value='raw'>Raw Data</TabsTrigger>
								</TabsList>

								<TabsContent value='overview' className='space-y-4'>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label>ID</Label>
											<p className='font-mono text-sm'>{selectedPresentation.id}</p>
										</div>
										<div>
											<Label>Status</Label>
											<div className='flex items-center gap-1'>
												{getStatusIcon(selectedPresentation.status)}
												<span className='capitalize'>{selectedPresentation.status}</span>
											</div>
										</div>
										<div>
											<Label>Purpose</Label>
											<p>{selectedPresentation.purpose}</p>
										</div>
										<div>
											<Label>Holder</Label>
											<p className='font-mono text-sm break-all'>{selectedPresentation.holder}</p>
										</div>
										<div>
											<Label>Created</Label>
											<p>{new Date(selectedPresentation.createdAt).toLocaleString()}</p>
										</div>
										<div>
											<Label>Expires</Label>
											<p>{selectedPresentation.expiresAt ? new Date(selectedPresentation.expiresAt).toLocaleString() : 'Never'}</p>
										</div>
									</div>
								</TabsContent>

								<TabsContent value='credentials' className='space-y-4'>
									<div className='space-y-2'>
										<Label>Included Credentials</Label>
										{selectedPresentation.verifiableCredential.map((credId, index) => (
											<div key={credId} className='p-3 border rounded-md'>
												<div className='flex items-center justify-between'>
													<div>
														<p className='font-mono text-sm'>{credId}</p>
														<p className='text-xs text-muted-foreground'>Credential {index + 1}</p>
													</div>
													<Badge variant='outline'>Active</Badge>
												</div>
											</div>
										))}
									</div>
								</TabsContent>

								<TabsContent value='raw'>
									<div className='mt-2'>
										<pre className='pre-code-json'>{JSON.stringify(selectedPresentation, null, 2)}</pre>
									</div>
								</TabsContent>
							</Tabs>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
