'use client'

import React, {useState, useEffect} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {CreditCard, Plus, Search, Eye, RefreshCw, Shield, CheckCircle, AlertCircle, Clock} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'

interface Credential {
	id: string
	type: string[]
	issuer: string
	subject: string
	issuanceDate: string
	expirationDate?: string
	status: 'active' | 'expired' | 'revoked' | 'pending'
	credentialSubject: Record<string, string | number | boolean>
	proof: {
		type: string
		created: string
		verificationMethod: string
		proofPurpose: string
	}
}

export default function TenantCredentialsPage() {
	const params = useParams()
	const tenantId = params.tenantId as string

	const [credentials, setCredentials] = useState<Credential[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)

	// Mock data for development
	useEffect(() => {
		const mockCredentials: Credential[] = [
			{
				id: 'cred_1234567890',
				type: ['VerifiableCredential', 'EducationCredential'],
				issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
				subject: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
				issuanceDate: '2024-12-15T10:30:00Z',
				expirationDate: '2025-12-15T10:30:00Z',
				status: 'active',
				credentialSubject: {
					id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
					name: 'John Doe',
					degree: 'Bachelor of Science',
					university: 'Tech University',
					graduationDate: '2024-06-15',
				},
				proof: {
					type: 'Ed25519Signature2020',
					created: '2024-12-15T10:30:00Z',
					verificationMethod: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
					proofPurpose: 'assertionMethod',
				},
			},
		]

		setTimeout(() => {
			setCredentials(mockCredentials)
			setLoading(false)
		}, 1000)
	}, [])

	const filteredCredentials = credentials.filter((cred) => {
		const matchesSearch =
			String(cred.credentialSubject.name || '')
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) || cred.type.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
		const matchesStatus = statusFilter === 'all' || cred.status === statusFilter

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
						<h1 className='text-3xl font-bold tracking-tight'>Credentials Management</h1>
						<p className='text-muted-foreground'>Manage verifiable credentials for tenant: {tenantId}</p>
					</div>

					<Button>
						<Plus className='mr-2 h-4 w-4' />
						Issue Credential
					</Button>
				</div>

				{/* Stats Cards */}
				<div className='grid gap-4 md:grid-cols-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Total Credentials</CardTitle>
							<CreditCard className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active</CardTitle>
							<CheckCircle className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.filter((c) => c.status === 'active').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Expired</CardTitle>
							<Clock className='h-4 w-4 text-orange-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{credentials.filter((c) => c.status === 'expired').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Types</CardTitle>
							<Shield className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{new Set(credentials.flatMap((c) => c.type.filter((t) => t !== 'VerifiableCredential'))).size}</div>
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
									<Input id='search' placeholder='Search credentials...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-8' />
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

				{/* Credentials List */}
				<div className='space-y-4'>
					{filteredCredentials.map((credential) => (
						<Card key={credential.id}>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<div className='space-y-1'>
										<div className='flex items-center gap-2'>
											<CardTitle className='text-lg'>{credential.credentialSubject.name || 'Unnamed Credential'}</CardTitle>
											<Badge variant={getStatusColor(credential.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
												{getStatusIcon(credential.status)}
												<span className='ml-1'>{credential.status}</span>
											</Badge>
											{credential.type
												.filter((t) => t !== 'VerifiableCredential')
												.map((type) => (
													<Badge key={type} variant='outline'>
														{type.replace('Credential', '')}
													</Badge>
												))}
										</div>
										<p className='text-sm text-muted-foreground'>ID: {credential.id}</p>
									</div>

									<div className='flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => setSelectedCredential(credential)}>
											<Eye className='h-4 w-4' />
										</Button>
									</div>
								</div>
							</CardHeader>

							<CardContent>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
									<div>
										<Label className='text-xs text-muted-foreground'>Issued</Label>
										<p>{new Date(credential.issuanceDate).toLocaleDateString()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Expires</Label>
										<p>{credential.expirationDate ? new Date(credential.expirationDate).toLocaleDateString() : 'Never'}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Issuer</Label>
										<p className='truncate'>{credential.issuer.split(':').pop()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Subject</Label>
										<p className='truncate'>{credential.subject.split(':').pop()}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{filteredCredentials.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<CreditCard className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No credentials found</h3>
								<p className='text-muted-foreground mb-4'>{searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters to see more results.' : 'Issue your first verifiable credential to get started.'}</p>
								{!searchTerm && statusFilter === 'all' && (
									<Button>
										<Plus className='mr-2 h-4 w-4' />
										Issue First Credential
									</Button>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Credential Detail Dialog */}
				<Dialog open={!!selectedCredential} onOpenChange={() => setSelectedCredential(null)}>
					<DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
						<DialogHeader>
							<DialogTitle>Credential Details</DialogTitle>
							<DialogDescription>{selectedCredential?.credentialSubject.name || 'Credential Information'}</DialogDescription>
						</DialogHeader>

						{selectedCredential && (
							<Tabs defaultValue='overview' className='w-full'>
								<TabsList className='grid w-full grid-cols-3'>
									<TabsTrigger value='overview'>Overview</TabsTrigger>
									<TabsTrigger value='subject'>Subject</TabsTrigger>
									<TabsTrigger value='raw'>Raw Data</TabsTrigger>
								</TabsList>

								<TabsContent value='overview' className='space-y-4'>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<Label>ID</Label>
											<p className='font-mono text-sm'>{selectedCredential.id}</p>
										</div>
										<div>
											<Label>Status</Label>
											<div className='flex items-center gap-1'>
												{getStatusIcon(selectedCredential.status)}
												<span className='capitalize'>{selectedCredential.status}</span>
											</div>
										</div>
									</div>
								</TabsContent>

								<TabsContent value='subject' className='space-y-4'>
									<div className='space-y-2'>
										{Object.entries(selectedCredential.credentialSubject).map(([key, value]) => (
											<div key={key} className='grid grid-cols-3 gap-2'>
												<Label className='capitalize'>{key.replace(/([A-Z])/g, ' $1')}</Label>
												<p className='col-span-2'>{String(value)}</p>
											</div>
										))}
									</div>
								</TabsContent>

								<TabsContent value='raw'>
									<div className='mt-2'>
										<pre className='pre-code-json'>{JSON.stringify(selectedCredential, null, 2)}</pre>
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
