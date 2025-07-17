'use client'

import React, {useState, useEffect} from 'react'
import {useParams} from 'next/navigation'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Fingerprint, Plus, Key, Copy, Eye, EyeOff, Download, RefreshCw, Shield, AlertCircle} from 'lucide-react'
import {useAuth} from '@/contexts/AuthContext'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Alert, AlertDescription} from '@/components/ui/alert'

interface DIDDocument {
	id: string
	method: string
	document: {
		'@context'?: string[]
		id: string
		verificationMethod?: Array<{
			id: string
			type: string
			controller: string
			publicKeyMultibase: string
		}>
		[key: string]: unknown
	}
	privateKey?: string
	status: 'active' | 'revoked' | 'deactivated'
	createdAt: string
	updatedAt: string
}

export default function TenantDIDPage() {
	const params = useParams()
	const {user} = useAuth()
	const tenantId = params.tenantId as string

	const [dids, setDids] = useState<DIDDocument[]>([])
	const [loading, setLoading] = useState(true)
	const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)
	const [newDIDMethod, setNewDIDMethod] = useState('key')

	// Mock data for development
	useEffect(() => {
		const mockDIDs: DIDDocument[] = [
			{
				id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
				method: 'key',
				document: {
					'@context': ['https://www.w3.org/ns/did/v1'],
					id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
					verificationMethod: [
						{
							id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
							type: 'Ed25519VerificationKey2020',
							controller: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
							publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
						},
					],
				},
				privateKey: '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIB...',
				status: 'active',
				createdAt: '2024-12-15T10:30:00Z',
				updatedAt: '2024-12-15T10:30:00Z',
			},
		]

		setTimeout(() => {
			setDids(mockDIDs)
			setLoading(false)
		}, 1000)
	}, [])

	const handleCreateDID = async () => {
		setIsCreating(true)

		// Mock DID creation
		setTimeout(() => {
			const newDID: DIDDocument = {
				id: `did:${newDIDMethod}:z6Mk${Math.random().toString(36).substring(2, 15)}`,
				method: newDIDMethod,
				document: {
					'@context': ['https://www.w3.org/ns/did/v1'],
					id: `did:${newDIDMethod}:z6Mk${Math.random().toString(36).substring(2, 15)}`,
					verificationMethod: [],
				},
				privateKey: '-----BEGIN PRIVATE KEY-----\n...',
				status: 'active',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			setDids([newDID, ...dids])
			setIsCreating(false)
		}, 2000)
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
	}

	const downloadDIDDocument = (did: DIDDocument) => {
		const blob = new Blob([JSON.stringify(did.document, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `did-document-${did.id.split(':').pop()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
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
						<h1 className='text-3xl font-bold tracking-tight'>DID Management</h1>
						<p className='text-muted-foreground'>Manage Decentralized Identities for tenant: {tenantId}</p>
					</div>

					<Dialog>
						<DialogTrigger asChild>
							<Button>
								<Plus className='mr-2 h-4 w-4' />
								Create DID
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New DID</DialogTitle>
								<DialogDescription>Create a new Decentralized Identity for this tenant.</DialogDescription>
							</DialogHeader>

							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='method'>DID Method</Label>
									<select id='method' value={newDIDMethod} onChange={(e) => setNewDIDMethod(e.target.value)} className='w-full p-2 border rounded-md'>
										<option value='key'>did:key</option>
										<option value='web'>did:web</option>
										<option value='ethr'>did:ethr</option>
									</select>
								</div>

								<Alert>
									<AlertCircle className='h-4 w-4' />
									<AlertDescription>The private key will be generated automatically and stored securely.</AlertDescription>
								</Alert>
							</div>

							<DialogFooter>
								<Button onClick={handleCreateDID} disabled={isCreating}>
									{isCreating ? (
										<>
											<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
											Creating...
										</>
									) : (
										<>
											<Fingerprint className='mr-2 h-4 w-4' />
											Create DID
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
							<CardTitle className='text-sm font-medium'>Total DIDs</CardTitle>
							<Fingerprint className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{dids.length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active DIDs</CardTitle>
							<Shield className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{dids.filter((d) => d.status === 'active').length}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>DID Methods</CardTitle>
							<Key className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{new Set(dids.map((d) => d.method)).size}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tenant ID</CardTitle>
							<Fingerprint className='h-4 w-4 text-blue-600' />
						</CardHeader>
						<CardContent>
							<div className='text-sm font-medium truncate'>{tenantId}</div>
						</CardContent>
					</Card>
				</div>

				{/* DID List */}
				<div className='space-y-4'>
					{dids.map((did) => (
						<Card key={did.id}>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<div className='space-y-1'>
										<div className='flex items-center gap-2'>
											<CardTitle className='text-lg'>DID Document</CardTitle>
											<Badge variant={did.status === 'active' ? 'default' : 'secondary'}>{did.status}</Badge>
											<Badge variant='outline'>{did.method}</Badge>
										</div>
										<p className='text-sm text-muted-foreground font-mono'>{did.id}</p>
									</div>

									<div className='flex gap-2'>
										<Button variant='outline' size='sm' onClick={() => copyToClipboard(did.id)}>
											<Copy className='h-4 w-4' />
										</Button>
										<Button variant='outline' size='sm' onClick={() => downloadDIDDocument(did)}>
											<Download className='h-4 w-4' />
										</Button>
									</div>
								</div>
							</CardHeader>

							<CardContent className='space-y-4'>
								{/* DID Document */}
								<div>
									<Label className='text-sm font-medium'>DID Document</Label>
									<div className='mt-1'>
										<pre className='pre-code-json'>{JSON.stringify(did.document, null, 2)}</pre>
									</div>
								</div>

								{/* Private Key */}
								{did.privateKey && (
									<div>
										<div className='flex items-center justify-between'>
											<Label className='text-sm font-medium'>Private Key</Label>
											<Button variant='ghost' size='sm' onClick={() => setShowPrivateKey(showPrivateKey === did.id ? null : did.id)}>
												{showPrivateKey === did.id ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
											</Button>
										</div>
										<div className='mt-1'>
											{showPrivateKey === did.id ? (
												<pre className='pre-code-danger'>{did.privateKey}</pre>
											) : (
												<div className='bg-red-50 p-3 rounded-md border border-red-200'>
													<p className='text-xs text-red-600'>••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</p>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Metadata */}
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<Label className='text-xs text-muted-foreground'>Created</Label>
										<p>{new Date(did.createdAt).toLocaleString()}</p>
									</div>
									<div>
										<Label className='text-xs text-muted-foreground'>Updated</Label>
										<p>{new Date(did.updatedAt).toLocaleString()}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{dids.length === 0 && (
						<Card>
							<CardContent className='py-12 text-center'>
								<Fingerprint className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
								<h3 className='text-lg font-medium mb-2'>No DIDs found</h3>
								<p className='text-muted-foreground mb-4'>Create your first Decentralized Identity to get started.</p>
								<Dialog>
									<DialogTrigger asChild>
										<Button>
											<Plus className='mr-2 h-4 w-4' />
											Create First DID
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
