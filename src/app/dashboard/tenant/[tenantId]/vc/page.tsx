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
import {FileText, Plus, Copy, Download, RefreshCw, Shield, AlertCircle, Trash2, Eye, EyeOff} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {useToast} from '@/hooks/use-toast'

// Mock types - these would come from the tenant VC service
interface VerifiableCredential {
	id: string
	type: string[]
	issuer: string
	issuanceDate: string
	expirationDate?: string
	credentialSubject: Record<string, unknown>
	proof: {
		type: string
		created: string
		verificationMethod: string
		proofPurpose: string
		jws: string
	}
	status: 'active' | 'revoked' | 'suspended'
	createdAt: string
	updatedAt: string
}

export default function TenantVCPage() {
	const params = useParams()
	const {toast} = useToast()
	const tenantId = params.tenantId as string

	const [credentials, setCredentials] = useState<VerifiableCredential[]>([])
	const [loading, setLoading] = useState(true)
	const [isCreating, setIsCreating] = useState(false)
	const [showProof, setShowProof] = useState<string | null>(null)
	
	// Form state for creating new VC
	const [newVC, setNewVC] = useState({
		type: 'IdentityCredential',
		subject: '',
		claims: '{}',
		expirationDays: 365,
	})

	// Fetch credentials
	const fetchCredentials = useCallback(async () => {
		try {
			setLoading(true)
			// TODO: Replace with real API call
			await new Promise(resolve => setTimeout(resolve, 1000))
			const mockCredentials: VerifiableCredential[] = [
				{
					id: 'vc:tenant:' + tenantId + ':cred:1',
					type: ['VerifiableCredential', 'IdentityCredential'],
					issuer: `did:key:tenant:${tenantId}`,
					issuanceDate: '2024-01-15T10:00:00Z',
					expirationDate: '2025-01-15T10:00:00Z',
					credentialSubject: {
						id: 'did:example:subject123',
						name: 'John Doe',
						dateOfBirth: '1990-01-01',
						email: 'john.doe@example.com',
					},
					proof: {
						type: 'Ed25519Signature2020',
						created: '2024-01-15T10:00:00Z',
						verificationMethod: `did:key:tenant:${tenantId}#key-1`,
						proofPurpose: 'assertionMethod',
						jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...',
					},
					status: 'active',
					createdAt: '2024-01-15T10:00:00Z',
					updatedAt: '2024-01-15T10:00:00Z',
				},
				{
					id: 'vc:tenant:' + tenantId + ':cred:2',
					type: ['VerifiableCredential', 'EducationCredential'],
					issuer: `did:key:tenant:${tenantId}`,
					issuanceDate: '2024-01-10T14:30:00Z',
					expirationDate: '2026-01-10T14:30:00Z',
					credentialSubject: {
						id: 'did:example:subject456',
						degree: 'Bachelor of Science',
						university: 'Example University',
						graduationDate: '2023-05-15',
					},
					proof: {
						type: 'Ed25519Signature2020',
						created: '2024-01-10T14:30:00Z',
						verificationMethod: `did:key:tenant:${tenantId}#key-1`,
						proofPurpose: 'assertionMethod',
						jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...',
					},
					status: 'active',
					createdAt: '2024-01-10T14:30:00Z',
					updatedAt: '2024-01-10T14:30:00Z',
				},
			]
			setCredentials(mockCredentials)
		} catch (error) {
			console.error('Error fetching credentials:', error)
			toast({
				title: 'Error',
				description: 'Failed to load verifiable credentials. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}, [tenantId, toast])

	useEffect(() => {
		if (tenantId) {
			fetchCredentials()
		}
	}, [fetchCredentials, tenantId])

	const handleCreateVC = async () => {
		setIsCreating(true)

		try {
			// TODO: Replace with real API call
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			toast({
				title: 'Success',
				description: 'Verifiable Credential created successfully!',
			})
			
			// Refresh the list
			await fetchCredentials()
		} catch (error) {
			console.error('Error creating VC:', error)
			toast({
				title: 'Error',
				description: 'Failed to create Verifiable Credential. Please try again.',
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

	const downloadVC = (vc: VerifiableCredential) => {
		const blob = new Blob([JSON.stringify(vc, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `vc-${vc.id.split(':').pop()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	const handleRevokeVC = async (vcId: string) => {
		try {
			// TODO: Replace with real API call
			console.log('Revoking VC:', vcId)
			await new Promise(resolve => setTimeout(resolve, 1000))
			
			toast({
				title: 'Success',
				description: 'Verifiable Credential revoked successfully!',
			})
			
			await fetchCredentials()
		} catch (error) {
			console.error('Error revoking VC:', error)
			toast({
				title: 'Error',
				description: 'Failed to revoke credential. Please try again.',
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
						<h1 className='text-3xl font-bold tracking-tight'>Verifiable Credentials</h1>
						<p className='text-muted-foreground'>Manage Verifiable Credentials for tenant: {tenantId}</p>
					</div>

					<Dialog>
						<DialogTrigger asChild>
							<Button>
								<Plus className='mr-2 h-4 w-4' />
								Issue Credential
							</Button>
						</DialogTrigger>
						<DialogContent className='max-w-2xl'>
							<DialogHeader>
								<DialogTitle>Issue New Verifiable Credential</DialogTitle>
								<DialogDescription>Create a new verifiable credential for this tenant.</DialogDescription>
							</DialogHeader>

							<div className='space-y-4'>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='type'>Credential Type</Label>
										<Select value={newVC.type} onValueChange={(value) => setNewVC({...newVC, type: value})}>
											<SelectTrigger>
												<SelectValue placeholder='Select credential type' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='IdentityCredential'>Identity Credential</SelectItem>
												<SelectItem value='EducationCredential'>Education Credential</SelectItem>
												<SelectItem value='EmploymentCredential'>Employment Credential</SelectItem>
												<SelectItem value='LicenseCredential'>License Credential</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='expiration'>Expiration (Days)</Label>
										<Input
											id='expiration'
											type='number'
											value={newVC.expirationDays}
											onChange={(e) => setNewVC({...newVC, expirationDays: parseInt(e.target.value)})}
											min={1}
											max={3650}
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='subject'>Subject DID</Label>
									<Input
										id='subject'
										placeholder='did:example:subject123'
										value={newVC.subject}
										onChange={(e) => setNewVC({...newVC, subject: e.target.value})}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='claims'>Claims (JSON)</Label>
									<Textarea
										id='claims'
										placeholder='{"name": "John Doe", "dateOfBirth": "1990-01-01"}'
										value={newVC.claims}
										onChange={(e) => setNewVC({...newVC, claims: e.target.value})}
										rows={5}
									/>
								</div>

								<Alert>
									<AlertCircle className='h-4 w-4' />
									<AlertDescription>
										The credential will be signed using the tenant's DID key and stored securely.
									</AlertDescription>
								</Alert>
							</div>

							<DialogFooter>
								<Button onClick={handleCreateVC} disabled={isCreating}>
									{isCreating ? (
										<>
											<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
											Issuing...
										</>
									) : (
										<>
											<FileText className='mr-2 h-4 w-4' />
											Issue Credential
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
							<CardTitle className='text-sm font-medium'>Total Credentials</CardTitle>
							<FileText className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active</CardTitle>
							<Shield className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.filter(c => c.status === 'active').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Credential Types</CardTitle>
							<FileText className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{new Set(credentials.flatMap(c => c.type)).size}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tenant ID</CardTitle>
							<FileText className='h-4 w-4 text-blue-600' />
						</CardHeader>
						<CardContent>
							<div className='text-sm font-medium truncate'>{tenantId}</div>
						</CardContent>
					</Card>
				</div>

				{/* Credentials List */}
				<div className='space-y-4'>
					{credentials.map((vc) => (
						<Card key={vc.id}>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<div className='space-y-1'>
										<div className='flex items-center gap-2'>
											<CardTitle className='text-lg'>Verifiable Credential</CardTitle>
											<Badge variant={vc.status === 'active' ? 'default' : 'secondary'}>{vc.status}</Badge>
											{vc.type.map(type => (
												<Badge key={type} variant='outline'>{type}</Badge>
											))}
										</div>
										<p className='text-sm text-muted-foreground font-mono'>{vc.id}</p>
									</div>

									<div className='flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => copyToClipboard(vc.id)}>
											<Copy className='h-4 w-4' />
										</Button>
										<Button variant='outline' size='sm' onClick={() => downloadVC(vc)}>
											<Download className='h-4 w-4' />
										</Button>
										{vc.status === 'active' && (
											<Button
												variant='outline'
												size='sm'
												onClick={() => {
													if (window.confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
														handleRevokeVC(vc.id)
													}
												}}
												className='text-red-600 hover:text-red-700 hover:bg-red-50'
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										)}
									</div>
								</div>
							</CardHeader>

							<CardContent className='space-y-4'>
								{/* Basic Info */}
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<Label className='text-xs text-muted-foreground'>Issuer</Label>
										<p className='font-mono'>{vc.issuer}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Subject</Label>
										<p className='font-mono'>{(vc.credentialSubject as {id: string}).id}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Issued</Label>
										<p>{new Date(vc.issuanceDate).toLocaleString()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Expires</Label>
										<p>{vc.expirationDate ? new Date(vc.expirationDate).toLocaleString() : 'Never'}</p>
									</div>
								</div>

								{/* Credential Subject */}
								<div>
									<Label className='text-sm font-medium'>Credential Subject</Label>
									<div className='mt-1'>
										<pre className='pre-code-json'>{JSON.stringify(vc.credentialSubject, null, 2)}</pre>
									</div>
								</div>

								{/* Proof */}
								<div>
									<div className='flex items-center justify-between'>
										<Label className='text-sm font-medium'>Cryptographic Proof</Label>
										<Button variant='ghost' size='sm' onClick={() => setShowProof(showProof === vc.id ? null : vc.id)}>
											{showProof === vc.id ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
										</Button>
									</div>
									<div className='mt-1'>
										{showProof === vc.id ? (
											<pre className='pre-code-json'>{JSON.stringify(vc.proof, null, 2)}</pre>
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

					{credentials.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No Credentials Found</h3>
								<p className='text-muted-foreground mb-4'>Issue your first verifiable credential to get started.</p>
								<Dialog>
									<DialogTrigger asChild>
										<Button>
											<Plus className='mr-2 h-4 w-4' />
											Issue First Credential
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
