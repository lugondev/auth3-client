'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Presentation, Plus, Copy, Download, RefreshCw, Shield, AlertCircle, Eye, EyeOff, CheckCircle} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useToast} from '@/hooks/use-toast'

// Mock types - these would come from the tenant VP service
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
		challenge?: string
		domain?: string
		jws: string
	}
	status: 'valid' | 'invalid' | 'expired'
	createdAt: string
	updatedAt: string
	presentedTo?: string
	purpose?: string
}

export default function TenantVPPage() {
	const params = useParams()
	const {toast} = useToast()
	const tenantId = params.tenantId as string

	const [presentations, setPresentations] = useState<VerifiablePresentation[]>([])
	const [loading, setLoading] = useState(true)
	const [isCreating, setIsCreating] = useState(false)
	const [showProof, setShowProof] = useState<string | null>(null)
	
	// Form state for creating new VP
	const [newVP, setNewVP] = useState({
		credentials: '',
		challenge: '',
		domain: '',
		purpose: 'authentication',
	})

	// Fetch presentations
	const fetchPresentations = useCallback(async () => {
		try {
			setLoading(true)
			// TODO: Replace with real API call
			await new Promise(resolve => setTimeout(resolve, 1000))
			const mockPresentations: VerifiablePresentation[] = [
				{
					id: 'vp:tenant:' + tenantId + ':pres:1',
					type: ['VerifiablePresentation'],
					holder: `did:key:tenant:${tenantId}`,
					verifiableCredential: [
						'vc:tenant:' + tenantId + ':cred:1',
						'vc:tenant:' + tenantId + ':cred:2',
					],
					proof: {
						type: 'Ed25519Signature2020',
						created: '2024-01-15T10:30:00Z',
						verificationMethod: `did:key:tenant:${tenantId}#key-1`,
						proofPurpose: 'authentication',
						challenge: 'challenge-123',
						domain: 'verifier.example.com',
						jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...',
					},
					status: 'valid',
					createdAt: '2024-01-15T10:30:00Z',
					updatedAt: '2024-01-15T10:30:00Z',
					presentedTo: 'verifier.example.com',
					purpose: 'Identity verification for service access',
				},
				{
					id: 'vp:tenant:' + tenantId + ':pres:2',
					type: ['VerifiablePresentation'],
					holder: `did:key:tenant:${tenantId}`,
					verifiableCredential: [
						'vc:tenant:' + tenantId + ':cred:2',
					],
					proof: {
						type: 'Ed25519Signature2020',
						created: '2024-01-10T15:00:00Z',
						verificationMethod: `did:key:tenant:${tenantId}#key-1`,
						proofPurpose: 'assertionMethod',
						challenge: 'challenge-456',
						domain: 'university.example.com',
						jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...',
					},
					status: 'valid',
					createdAt: '2024-01-10T15:00:00Z',
					updatedAt: '2024-01-10T15:00:00Z',
					presentedTo: 'university.example.com',
					purpose: 'Education credential verification',
				},
			]
			setPresentations(mockPresentations)
		} catch (error) {
			console.error('Error fetching presentations:', error)
			toast({
				title: 'Error',
				description: 'Failed to load verifiable presentations. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}, [tenantId, toast])

	useEffect(() => {
		if (tenantId) {
			fetchPresentations()
		}
	}, [fetchPresentations, tenantId])

	const handleCreateVP = async () => {
		setIsCreating(true)

		try {
			// TODO: Replace with real API call
			console.log('Creating VP with:', newVP)
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			toast({
				title: 'Success',
				description: 'Verifiable Presentation created successfully!',
			})
			
			// Refresh the list
			await fetchPresentations()
		} catch (error) {
			console.error('Error creating VP:', error)
			toast({
				title: 'Error',
				description: 'Failed to create Verifiable Presentation. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setIsCreating(false)
		}
	}

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast({
				title: 'Copied',
				description: 'Copied to clipboard successfully!',
			})
		} catch (error) {
			console.error('Failed to copy:', error)
		}
	}

	const downloadVP = (vp: VerifiablePresentation) => {
		const blob = new Blob([JSON.stringify(vp, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `vp-${vp.id.split(':').pop()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	const handleVerifyVP = async (vpId: string) => {
		try {
			// TODO: Replace with real API call
			console.log('Verifying VP:', vpId)
			await new Promise(resolve => setTimeout(resolve, 1000))
			
			toast({
				title: 'Verification Complete',
				description: 'Verifiable Presentation verified successfully!',
			})
		} catch (error) {
			console.error('Error verifying VP:', error)
			toast({
				title: 'Error',
				description: 'Failed to verify presentation. Please try again.',
				variant: 'destructive',
			})
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
						<h1 className='text-3xl font-bold tracking-tight'>Verifiable Presentations</h1>
						<p className='text-muted-foreground'>Manage Verifiable Presentations for tenant: {tenantId}</p>
					</div>

					<Dialog>
						<DialogTrigger asChild>
							<Button>
								<Plus className='mr-2 h-4 w-4' />
								Create Presentation
							</Button>
						</DialogTrigger>
						<DialogContent className='max-w-2xl'>
							<DialogHeader>
								<DialogTitle>Create New Verifiable Presentation</DialogTitle>
								<DialogDescription>Create a new verifiable presentation for this tenant.</DialogDescription>
							</DialogHeader>

							<div className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='purpose'>Purpose</Label>
										<Select value={newVP.purpose} onValueChange={(value) => setNewVP({...newVP, purpose: value})}>
											<SelectTrigger>
												<SelectValue placeholder='Select purpose' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='authentication'>Authentication</SelectItem>
												<SelectItem value='assertionMethod'>Assertion Method</SelectItem>
												<SelectItem value='keyAgreement'>Key Agreement</SelectItem>
												<SelectItem value='capabilityInvocation'>Capability Invocation</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='domain'>Domain</Label>
										<Input
											id='domain'
											placeholder='verifier.example.com'
											value={newVP.domain}
											onChange={(e) => setNewVP({...newVP, domain: e.target.value})}
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='challenge'>Challenge</Label>
									<Input
										id='challenge'
										placeholder='challenge-string-from-verifier'
										value={newVP.challenge}
										onChange={(e) => setNewVP({...newVP, challenge: e.target.value})}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='credentials'>Credential IDs (comma-separated)</Label>
									<Textarea
										id='credentials'
										placeholder='vc:tenant:123:cred:1, vc:tenant:123:cred:2'
										value={newVP.credentials}
										onChange={(e) => setNewVP({...newVP, credentials: e.target.value})}
										rows={3}
									/>
								</div>

								<Alert>
									<AlertCircle className='h-4 w-4' />
									<AlertDescription>
										The presentation will be signed using the tenant's DID key and can be verified by the recipient.
									</AlertDescription>
								</Alert>
							</div>

							<DialogFooter>
								<Button onClick={handleCreateVP} disabled={isCreating}>
									{isCreating ? (
										<>
											<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
											Creating...
										</>
									) : (
										<>
											<Presentation className='mr-2 h-4 w-4' />
											Create Presentation
										</>
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
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
							<CardTitle className='text-sm font-medium'>Valid</CardTitle>
							<CheckCircle className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{presentations.filter(p => p.status === 'valid').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Credentials Used</CardTitle>
							<Shield className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{new Set(presentations.flatMap(p => p.verifiableCredential)).size}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tenant ID</CardTitle>
							<Presentation className='h-4 w-4 text-blue-600' />
						</CardHeader>
						<CardContent>
							<div className='text-sm font-medium truncate'>{tenantId}</div>
						</CardContent>
					</Card>
				</div>

				{/* Presentations List */}
				<div className='space-y-4'>
					{presentations.map((vp) => (
						<Card key={vp.id}>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<div className='space-y-1'>
										<div className='flex items-center gap-2'>
											<CardTitle className='text-lg'>Verifiable Presentation</CardTitle>
											<Badge variant={vp.status === 'valid' ? 'default' : vp.status === 'invalid' ? 'destructive' : 'secondary'}>
												{vp.status}
											</Badge>
											{vp.type.map(type => (
												<Badge key={type} variant='outline'>{type}</Badge>
											))}
										</div>
										<p className='text-sm text-muted-foreground font-mono'>{vp.id}</p>
									</div>

									<div className='flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => copyToClipboard(vp.id)}>
											<Copy className='h-4 w-4' />
										</Button>
										<Button variant='outline' size='sm' onClick={() => downloadVP(vp)}>
											<Download className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleVerifyVP(vp.id)}
											className='text-green-600 hover:text-green-700 hover:bg-green-50'
										>
											<CheckCircle className='h-4 w-4' />
										</Button>
									</div>
								</div>
							</CardHeader>

							<CardContent className='space-y-4'>
								{/* Basic Info */}
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<Label className='text-xs text-muted-foreground'>Holder</Label>
										<p className='font-mono'>{vp.holder}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Presented To</Label>
										<p>{vp.presentedTo || 'Not specified'}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Created</Label>
										<p>{new Date(vp.createdAt).toLocaleString()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Purpose</Label>
										<p>{vp.purpose || 'Not specified'}</p>
									</div>
								</div>

								{/* Credentials */}
								<div>
									<Label className='text-sm font-medium'>Included Credentials</Label>
									<div className='mt-1 space-y-1'>
										{vp.verifiableCredential.map((credId, index) => (
											<div key={index} className='bg-gray-50 p-2 rounded-md border'>
												<p className='text-xs font-mono'>{credId}</p>
											</div>
										))}
									</div>
								</div>

								{/* Proof */}
								<div>
									<div className='flex items-center justify-between'>
										<Label className='text-sm font-medium'>Cryptographic Proof</Label>
										<Button variant='ghost' size='sm' onClick={() => setShowProof(showProof === vp.id ? null : vp.id)}>
											{showProof === vp.id ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
										</Button>
									</div>
									<div className='mt-1'>
										{showProof === vp.id ? (
											<pre className='pre-code-json'>{JSON.stringify(vp.proof, null, 2)}</pre>
										) : (
											<div className='bg-gray-50 p-3 rounded-md border'>
												<p className='text-xs text-gray-600'>Proof hidden for security - click to reveal</p>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{presentations.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<Presentation className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No Presentations Found</h3>
								<p className='text-muted-foreground mb-4'>Create your first verifiable presentation to get started.</p>
								<Dialog>
									<DialogTrigger asChild>
										<Button>
											<Plus className='mr-2 h-4 w-4' />
											Create First Presentation
										</Button>
									</DialogTrigger>
								</Dialog>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}
