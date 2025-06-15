'use client'

import React, {useState} from 'react'
import {PageHeader} from '@/components/layout/PageHeader'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Key, Globe, Coins, Network, Users, Eye, EyeOff, Copy, Check} from 'lucide-react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {createDID} from '@/services/didService'
import type {CreateDIDInput, DIDMethod, DIDDocument} from '@/types/did'

// Types for DID creation
interface DIDCreationForm {
	method: 'key' | 'web' | 'ethr' | 'ion' | 'peer'
	keyType?: 'Ed25519' | 'secp256k1' | 'P-256'
	domain?: string
	path?: string
	ethereumAddress?: string
	networkId?: string
	peerEndpoint?: string
	serviceEndpoints?: ServiceEndpoint[]
	verificationMethods?: VerificationMethod[]
}

interface ServiceEndpoint {
	id: string
	type: string
	serviceEndpoint: string
}

interface VerificationMethod {
	id: string
	type: string
	publicKeyMultibase?: string
}

/**
 * Create DID Page - Form for creating new DIDs
 * Supports all DID methods with method-specific configuration
 */
export default function CreateDIDPage() {
	const router = useRouter()
	const [form, setForm] = useState<DIDCreationForm>({
		method: 'key',
		keyType: 'Ed25519',
		serviceEndpoints: [],
		verificationMethods: [],
	})
	const [loading, setLoading] = useState(false)
	const [previewDocument, setPreviewDocument] = useState<DIDDocument | null>(null)
	const [showPreview, setShowPreview] = useState(false)
	const [generatedKeys, setGeneratedKeys] = useState<{publicKey: string; privateKey: string} | null>(null)
	const [showPrivateKey, setShowPrivateKey] = useState(false)
	const [copiedField, setCopiedField] = useState<string | null>(null)

	/**
	 * Get method icon and description
	 */
	const getMethodInfo = (method: string) => {
		switch (method) {
			case 'key':
				return {
					icon: <Key className='h-5 w-5' />,
					title: 'DID:Key',
					description: 'Simple cryptographic key-based DID method',
				}
			case 'web':
				return {
					icon: <Globe className='h-5 w-5' />,
					title: 'DID:Web',
					description: 'Web-based DID method using domain verification',
				}
			case 'ethr':
				return {
					icon: <Coins className='h-5 w-5' />,
					title: 'DID:Ethr',
					description: 'Ethereum-based DID method',
				}
			case 'ion':
				return {
					icon: <Network className='h-5 w-5' />,
					title: 'DID:ION',
					description: 'Bitcoin-anchored DID method by Microsoft',
				}
			case 'peer':
				return {
					icon: <Users className='h-5 w-5' />,
					title: 'DID:Peer',
					description: 'Peer-to-peer DID method for direct communication',
				}
			default:
				return {
					icon: <Key className='h-5 w-5' />,
					title: 'Unknown',
					description: 'Unknown DID method',
				}
		}
	}

	/**
	 * Generate preview DID document
	 */
	const generatePreview = () => {
		let didId = ''

		switch (form.method) {
			case 'key':
				didId = 'did:key:[generated-key-will-be-here]'
				break
			case 'web':
				didId = `did:web:${form.domain || '[domain-required]'}${form.path ? ':' + form.path.replace(/\//g, ':') : ''}`
				break
			case 'ethr':
				didId = `did:ethr:${form.networkId || 'mainnet'}:${form.ethereumAddress || '[ethereum-address-required]'}`
				break
			case 'ion':
				didId = 'did:ion:[generated-ion-id-will-be-here]'
				break
			case 'peer':
				didId = 'did:peer:[generated-peer-id-will-be-here]'
				break
		}

		const keyType = form.keyType || 'Ed25519'
		const verificationMethodType = keyType === 'Ed25519' ? 'Ed25519VerificationKey2020' : keyType === 'secp256k1' ? 'EcdsaSecp256k1VerificationKey2019' : 'JsonWebKey2020'

		const document = {
			'@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
			id: didId,
			verificationMethod: [
				{
					id: `${didId}#keys-1`,
					type: verificationMethodType,
					controller: didId,
					publicKeyMultibase: '[generated-public-key-will-be-here]',
				},
			],
			authentication: [`${didId}#keys-1`],
			assertionMethod: [`${didId}#keys-1`],
			keyAgreement: [`${didId}#keys-1`],
			capabilityInvocation: [`${didId}#keys-1`],
			capabilityDelegation: [`${didId}#keys-1`],
			service:
				form.serviceEndpoints?.map((endpoint) => ({
					id: `${didId}#${endpoint.id}`,
					type: endpoint.type,
					serviceEndpoint: endpoint.serviceEndpoint,
				})) || [],
		}

		setPreviewDocument(document)
		setShowPreview(true)
	}

	/**
	 * Handle form submission
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			// Prepare API input
			const createInput: CreateDIDInput = {
				method: form.method as DIDMethod,
				options: {
					keyType: form.keyType,
					...(form.method === 'web' && {
						domain: form.domain,
						path: form.path,
					}),
					...(form.method === 'ethr' && {
						ethereumAddress: form.ethereumAddress,
						networkId: form.networkId,
					}),
					...(form.method === 'peer' && {
						peerEndpoint: form.peerEndpoint,
					}),
					serviceEndpoints: form.serviceEndpoints,
				},
			}

			// Call actual API
			const response = await createDID(createInput)

			// Extract keys from response (assuming they're in the document or metadata)
			const keys = {
				publicKey: response.document.verificationMethod?.[0]?.publicKeyMultibase || response.did,
				privateKey: 'Private key is securely stored on the server', // Don't expose private keys
			}

			setGeneratedKeys(keys)
			// Store the response for navigation
			setPreviewDocument(response.document)
			toast.success('DID created successfully!')

			// Redirect after a delay to show the keys
			setTimeout(() => {
				router.push('/dashboard/dids')
			}, 5000)
		} catch (error) {
			console.error('Error creating DID:', error)
			toast.error('Failed to create DID')
		} finally {
			setLoading(false)
		}
	}

	/**
	 * Copy text to clipboard
	 */
	const copyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopiedField(field)
			toast.success('Copied to clipboard')
			setTimeout(() => setCopiedField(null), 2000)
		} catch (error) {
			console.error('Error copying to clipboard:', error)
			toast.error('Failed to copy to clipboard')
		}
	}

	/**
	 * Add service endpoint
	 */
	const addServiceEndpoint = () => {
		setForm((prev) => ({
			...prev,
			serviceEndpoints: [...(prev.serviceEndpoints || []), {id: `service-${Date.now()}`, type: 'LinkedDomains', serviceEndpoint: ''}],
		}))
	}

	/**
	 * Remove service endpoint
	 */
	const removeServiceEndpoint = (index: number) => {
		setForm((prev) => ({
			...prev,
			serviceEndpoints: prev.serviceEndpoints?.filter((_, i) => i !== index) || [],
		}))
	}

	// Show success screen with generated keys
	if (generatedKeys) {
		return (
			<div className='space-y-6'>
				<PageHeader title='DID Created Successfully' description='Your DID has been created. Please save your private key securely.' />

				<Alert>
					<Key className='h-4 w-4' />
					<AlertDescription>
						<strong>Important:</strong> Save your private key securely. You will not be able to recover it if lost.
					</AlertDescription>
				</Alert>

				<Card>
					<CardHeader>
						<CardTitle>Generated Keys</CardTitle>
						<CardDescription>Your DID and associated cryptographic keys</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label>Public Key</Label>
							<div className='flex items-center gap-2 mt-1'>
								<Input value={generatedKeys.publicKey} readOnly className='font-mono text-sm' />
								<Button variant='outline' size='sm' onClick={() => copyToClipboard(generatedKeys.publicKey, 'publicKey')}>
									{copiedField === 'publicKey' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>

						{generatedKeys.privateKey !== 'Private key is securely stored on the server' && (
							<div>
								<Label>Private Key</Label>
								<div className='flex items-center gap-2 mt-1'>
									<Input type={showPrivateKey ? 'text' : 'password'} value={generatedKeys.privateKey} readOnly className='font-mono text-sm' />
									<Button variant='outline' size='sm' onClick={() => setShowPrivateKey(!showPrivateKey)}>
										{showPrivateKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
									</Button>
									<Button variant='outline' size='sm' onClick={() => copyToClipboard(generatedKeys.privateKey, 'privateKey')}>
										{copiedField === 'privateKey' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
									</Button>
								</div>
							</div>
						)}

						{generatedKeys.privateKey === 'Private key is securely stored on the server' && (
							<Alert>
								<Key className='h-4 w-4' />
								<AlertDescription>
									<strong>Security Notice:</strong> Your private key is securely stored on the server and is not exposed for security reasons. You can use your DID for authentication and signing operations through the platform.
								</AlertDescription>
							</Alert>
						)}

						<div className='flex gap-2 pt-4'>
							<Button onClick={() => router.push('/dashboard/dids')} className='flex-1'>
								Go to DID Dashboard
							</Button>
							<Button variant='outline' onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(previewDocument?.id || generatedKeys.publicKey)}`)}>
								View DID Details
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader title='Create DID' description='Create a new Decentralized Identifier' backButton={{href: '/dashboard/dids', text: 'Back to DIDs'}} />

			<form onSubmit={handleSubmit} className='space-y-6'>
				{/* Method Selection */}
				<Card>
					<CardHeader>
						<CardTitle>DID Method</CardTitle>
						<CardDescription>Choose the DID method that best fits your use case</CardDescription>
					</CardHeader>
					<CardContent>
						<RadioGroup value={form.method} onValueChange={(value: 'key' | 'web' | 'ethr' | 'ion' | 'peer') => setForm((prev) => ({...prev, method: value}))} className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{['key', 'web', 'ethr', 'ion', 'peer'].map((method) => {
								const info = getMethodInfo(method)
								return (
									<div key={method} className='flex items-center space-x-2'>
										<RadioGroupItem value={method} id={method} />
										<Label htmlFor={method} className='flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1'>
											{info.icon}
											<div>
												<div className='font-medium'>{info.title}</div>
												<div className='text-sm text-gray-500'>{info.description}</div>
											</div>
										</Label>
									</div>
								)
							})}
						</RadioGroup>
					</CardContent>
				</Card>

				{/* Method-specific Configuration */}
				<Card>
					<CardHeader>
						<CardTitle>Configuration</CardTitle>
						<CardDescription>Configure your {getMethodInfo(form.method).title}</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						{/* Key Method Configuration */}
						{form.method === 'key' && (
							<div>
								<Label htmlFor='keyType'>Key Type</Label>
								<Select value={form.keyType} onValueChange={(value: 'Ed25519' | 'secp256k1' | 'P-256') => setForm((prev) => ({...prev, keyType: value}))}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='Ed25519'>Ed25519 (Recommended)</SelectItem>
										<SelectItem value='secp256k1'>secp256k1</SelectItem>
										<SelectItem value='P-256'>P-256</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Web Method Configuration */}
						{form.method === 'web' && (
							<>
								<div>
									<Label htmlFor='domain'>Domain *</Label>
									<Input id='domain' value={form.domain || ''} onChange={(e) => setForm((prev) => ({...prev, domain: e.target.value}))} placeholder='example.com' required />
								</div>
								<div>
									<Label htmlFor='path'>Path (optional)</Label>
									<Input id='path' value={form.path || ''} onChange={(e) => setForm((prev) => ({...prev, path: e.target.value}))} placeholder='users/alice' />
								</div>
							</>
						)}

						{/* Ethereum Method Configuration */}
						{form.method === 'ethr' && (
							<>
								<div>
									<Label htmlFor='ethereumAddress'>Ethereum Address</Label>
									<Input id='ethereumAddress' value={form.ethereumAddress || ''} onChange={(e) => setForm((prev) => ({...prev, ethereumAddress: e.target.value}))} placeholder='0x1234567890123456789012345678901234567890' />
								</div>
								<div>
									<Label htmlFor='networkId'>Network</Label>
									<Select value={form.networkId || 'mainnet'} onValueChange={(value) => setForm((prev) => ({...prev, networkId: value}))}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='mainnet'>Mainnet</SelectItem>
											<SelectItem value='goerli'>Goerli</SelectItem>
											<SelectItem value='sepolia'>Sepolia</SelectItem>
											<SelectItem value='polygon'>Polygon</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</>
						)}

						{/* Peer Method Configuration */}
						{form.method === 'peer' && (
							<div>
								<Label htmlFor='peerEndpoint'>Peer Endpoint</Label>
								<Input id='peerEndpoint' value={form.peerEndpoint || ''} onChange={(e) => setForm((prev) => ({...prev, peerEndpoint: e.target.value}))} placeholder='https://peer.example.com/didcomm' />
							</div>
						)}
					</CardContent>
				</Card>

				{/* Service Endpoints */}
				<Card>
					<CardHeader>
						<CardTitle>Service Endpoints (Optional)</CardTitle>
						<CardDescription>Add service endpoints to your DID document</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						{form.serviceEndpoints?.map((endpoint, index) => (
							<div key={index} className='flex gap-2 items-end'>
								<div className='flex-1'>
									<Label>Service Type</Label>
									<Input
										value={endpoint.type}
										onChange={(e) => {
											const newEndpoints = [...(form.serviceEndpoints || [])]
											newEndpoints[index].type = e.target.value
											setForm((prev) => ({...prev, serviceEndpoints: newEndpoints}))
										}}
										placeholder='LinkedDomains'
									/>
								</div>
								<div className='flex-2'>
									<Label>Service Endpoint</Label>
									<Input
										value={endpoint.serviceEndpoint}
										onChange={(e) => {
											const newEndpoints = [...(form.serviceEndpoints || [])]
											newEndpoints[index].serviceEndpoint = e.target.value
											setForm((prev) => ({...prev, serviceEndpoints: newEndpoints}))
										}}
										placeholder='https://example.com'
									/>
								</div>
								<Button type='button' variant='outline' onClick={() => removeServiceEndpoint(index)}>
									Remove
								</Button>
							</div>
						))}
						<Button type='button' variant='outline' onClick={addServiceEndpoint}>
							Add Service Endpoint
						</Button>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className='flex gap-4'>
					<Button type='button' variant='outline' onClick={generatePreview} className='flex-1'>
						Preview DID Document
					</Button>
					<Button type='submit' disabled={loading} className='flex-1'>
						{loading ? 'Creating...' : 'Create DID'}
					</Button>
				</div>
			</form>

			{/* Preview Modal */}
			{showPreview && previewDocument && (
				<Card>
					<CardHeader>
						<CardTitle>DID Document Preview</CardTitle>
						<CardDescription>Preview of your DID document</CardDescription>
					</CardHeader>
					<CardContent>
						<Textarea value={JSON.stringify(previewDocument, null, 2)} readOnly className='font-mono text-sm h-64' />
						<div className='flex gap-2 mt-4'>
							<Button variant='outline' onClick={() => copyToClipboard(JSON.stringify(previewDocument, null, 2), 'preview')}>
								{copiedField === 'preview' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}
								Copy
							</Button>
							<Button variant='outline' onClick={() => setShowPreview(false)}>
								Close
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
