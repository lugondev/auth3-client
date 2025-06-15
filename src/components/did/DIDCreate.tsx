'use client'

import React, {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Plus, Trash2, Eye, EyeOff, Copy, ArrowLeft, CheckCircle} from 'lucide-react'
import {DIDMethod, ServiceEndpoint, VerificationMethod} from '@/types/did'
import {DIDMethodSelector} from './DIDMethodSelector'
import {createDID} from '@/services/didService'
import {cryptoService} from '@/services/cryptoService'
import {toast} from 'sonner'

interface DIDCreateProps {
	onSuccess?: (didId: string) => void
	onCancel?: () => void
	className?: string
}

interface DIDCreationForm {
	method: DIDMethod | null
	keyType?: 'Ed25519' | 'secp256k1' | 'P-256'
	domain?: string
	path?: string
	ethereumAddress?: string
	networkId?: string
	peerEndpoint?: string
	serviceEndpoints: ServiceEndpoint[]
	verificationMethods: VerificationMethod[]
}

interface GeneratedKeys {
	publicKey: string
	privateKey: string
	keyId: string
}

/**
 * DIDCreate component provides a comprehensive interface for creating new DIDs
 * with support for different methods and advanced configuration
 */
export function DIDCreate({onSuccess, onCancel, className}: DIDCreateProps) {
	const [form, setForm] = useState<DIDCreationForm>({
		method: null,
		keyType: 'Ed25519',
		serviceEndpoints: [],
		verificationMethods: [],
	})
	const [loading, setLoading] = useState(false)
	const [step, setStep] = useState<'method' | 'config' | 'keys' | 'preview' | 'complete'>('method')
	const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeys | null>(null)
	const [showPrivateKey, setShowPrivateKey] = useState(false)
	const [previewDocument, setPreviewDocument] = useState<Record<string, unknown> | null>(null)
	const [createdDID, setCreatedDID] = useState<string | null>(null)

	/**
	 * Handle method selection and move to configuration step
	 */
	const handleMethodSelect = (method: DIDMethod) => {
		setForm((prev) => ({...prev, method}))
		setStep('config')
	}

	/**
	 * Generate cryptographic keys for the selected method
	 */
	const generateKeys = async () => {
		try {
			setLoading(true)

			// Generate actual cryptographic keys using cryptoService
			const keys = await cryptoService.generateKeyPair(form.keyType || 'Ed25519')

			const generatedKeys: GeneratedKeys = {
				publicKey: keys.publicKey,
				privateKey: keys.privateKey,
				keyId: keys.keyId,
			}

			setGeneratedKeys(generatedKeys)
			setStep('keys')
			toast.success('Keys generated successfully')
		} catch (error) {
			console.error('Error generating keys:', error)
			toast.error('Failed to generate keys')
		} finally {
			setLoading(false)
		}
	}

	/**
	 * Generate preview of the DID document
	 */
	const generatePreview = () => {
		if (!form.method || !generatedKeys) return

		const didString = generateDIDString()
		const document = {
			'@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
			id: didString,
			verificationMethod: [
				{
					id: `${didString}${generatedKeys.keyId}`,
					type: 'Ed25519VerificationKey2020',
					controller: didString,
					publicKeyMultibase: generatedKeys.publicKey,
				},
				...form.verificationMethods,
			],
			authentication: [`${didString}${generatedKeys.keyId}`],
			assertionMethod: [`${didString}${generatedKeys.keyId}`],
			keyAgreement: [`${didString}${generatedKeys.keyId}`],
			capabilityInvocation: [`${didString}${generatedKeys.keyId}`],
			service: form.serviceEndpoints,
		}

		setPreviewDocument(document)
		setStep('preview')
	}

	/**
	 * Generate DID string based on selected method and configuration
	 */
	const generateDIDString = (): string => {
		if (!form.method || !generatedKeys) return ''

		switch (form.method) {
			case 'key':
				return `did:key:${generatedKeys.publicKey}`
			case 'web':
				return `did:web:${form.domain}${form.path ? `:${form.path.replace(/\//g, ':')}` : ''}`
			case 'ethr':
				return `did:ethr:${form.networkId || 'mainnet'}:${form.ethereumAddress}`
			case 'ion':
				return `did:ion:${generatedKeys.publicKey}`
			case 'peer':
				return `did:peer:${generatedKeys.publicKey}`
			default:
				return ''
		}
	}

	/**
	 * Create the DID with the configured parameters
	 */
	const createDIDCall = async () => {
		try {
			setLoading(true)

			// Create DID using actual API call
			const response = await createDID({
				method: form.method!,
				options: {
					keyType: form.keyType,
					domain: form.domain,
					path: form.path,
					ethereumAddress: form.ethereumAddress,
					networkId: form.networkId,
					peerEndpoint: form.peerEndpoint,
					publicKey: generatedKeys!.publicKey,
					privateKey: generatedKeys!.privateKey,
				},
				metadata: {
					serviceEndpoints: form.serviceEndpoints,
					verificationMethods: form.verificationMethods,
				},
			})

			setCreatedDID(response.did)
			setStep('complete')

			toast.success('DID created successfully!')
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
	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(`${label} copied to clipboard`)
		} catch {
			toast.error(`Failed to copy ${label}`)
		}
	}

	/**
	 * Add a new service endpoint
	 */
	const addServiceEndpoint = () => {
		const newEndpoint: ServiceEndpoint = {
			id: `#service-${form.serviceEndpoints.length + 1}`,
			type: 'DIDCommMessaging',
			serviceEndpoint: '',
		}
		setForm((prev) => ({
			...prev,
			serviceEndpoints: [...prev.serviceEndpoints, newEndpoint],
		}))
	}

	/**
	 * Remove a service endpoint
	 */
	const removeServiceEndpoint = (index: number) => {
		setForm((prev) => ({
			...prev,
			serviceEndpoints: prev.serviceEndpoints.filter((_, i) => i !== index),
		}))
	}

	/**
	 * Update a service endpoint
	 */
	const updateServiceEndpoint = (index: number, field: keyof ServiceEndpoint, value: string) => {
		setForm((prev) => ({
			...prev,
			serviceEndpoints: prev.serviceEndpoints.map((endpoint, i) => (i === index ? {...endpoint, [field]: value} : endpoint)),
		}))
	}

	return (
		<div className={className}>
			{/* Header */}
			<div className='mb-6'>
				<div className='flex items-center gap-4 mb-4'>
					{onCancel && (
						<Button variant='ghost' size='sm' onClick={onCancel}>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back
						</Button>
					)}
					<div>
						<h2 className='text-2xl font-bold'>Create New DID</h2>
						<p className='text-muted-foreground'>Set up your decentralized identifier</p>
					</div>
				</div>

				{/* Progress indicator */}
				<div className='flex items-center gap-2 mb-6'>
					{['method', 'config', 'keys', 'preview', 'complete'].map((stepName, index) => {
						const currentIndex = ['method', 'config', 'keys', 'preview', 'complete'].indexOf(step)
						const isActive = index === currentIndex
						const isCompleted = index < currentIndex

						return (
							<React.Fragment key={stepName}>
								<div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{isCompleted ? <CheckCircle className='h-4 w-4' /> : index + 1}</div>
								{index < 4 && <div className={`h-0.5 w-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />}
							</React.Fragment>
						)
					})}
				</div>
			</div>

			{/* Step 1: Method Selection */}
			{step === 'method' && (
				<Card>
					<CardHeader>
						<CardTitle>Choose DID Method</CardTitle>
						<CardDescription>Select the DID method that best fits your use case</CardDescription>
					</CardHeader>
					<CardContent>
						<DIDMethodSelector selectedMethod={form.method} onMethodChange={handleMethodSelect} />
					</CardContent>
				</Card>
			)}

			{/* Step 2: Configuration */}
			{step === 'config' && form.method && (
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Configure {form.method.toUpperCase()} DID</CardTitle>
							<CardDescription>Set up the specific parameters for your DID method</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Key Type Selection */}
							<div className='space-y-2'>
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

							{/* Method-specific configuration */}
							{form.method === 'web' && (
								<>
									<div className='space-y-2'>
										<Label htmlFor='domain'>Domain *</Label>
										<Input id='domain' placeholder='example.com' value={form.domain || ''} onChange={(e) => setForm((prev) => ({...prev, domain: e.target.value}))} />
									</div>
									<div className='space-y-2'>
										<Label htmlFor='path'>Path (optional)</Label>
										<Input id='path' placeholder='users/alice' value={form.path || ''} onChange={(e) => setForm((prev) => ({...prev, path: e.target.value}))} />
									</div>
								</>
							)}

							{form.method === 'ethr' && (
								<>
									<div className='space-y-2'>
										<Label htmlFor='ethereumAddress'>Ethereum Address *</Label>
										<Input id='ethereumAddress' placeholder='0x...' value={form.ethereumAddress || ''} onChange={(e) => setForm((prev) => ({...prev, ethereumAddress: e.target.value}))} />
									</div>
									<div className='space-y-2'>
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

							{form.method === 'peer' && (
								<div className='space-y-2'>
									<Label htmlFor='peerEndpoint'>Peer Endpoint *</Label>
									<Input id='peerEndpoint' placeholder='https://peer.example.com' value={form.peerEndpoint || ''} onChange={(e) => setForm((prev) => ({...prev, peerEndpoint: e.target.value}))} />
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
						<CardContent>
							<div className='space-y-4'>
								{form.serviceEndpoints.map((endpoint, index) => (
									<div key={index} className='border rounded-lg p-4 space-y-3'>
										<div className='flex items-center justify-between'>
											<Label>Service Endpoint {index + 1}</Label>
											<Button variant='ghost' size='sm' onClick={() => removeServiceEndpoint(index)}>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
										<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
											<Input placeholder='Service ID' value={endpoint.id} onChange={(e) => updateServiceEndpoint(index, 'id', e.target.value)} />
											<Select value={endpoint.type} onValueChange={(value) => updateServiceEndpoint(index, 'type', value)}>
												<SelectTrigger>
													<SelectValue placeholder='Service Type' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='DIDCommMessaging'>DID Comm Messaging</SelectItem>
													<SelectItem value='CredentialRepository'>Credential Repository</SelectItem>
													<SelectItem value='LinkedDomains'>Linked Domains</SelectItem>
												</SelectContent>
											</Select>
											<Input placeholder='Service Endpoint URL' value={endpoint.serviceEndpoint as string} onChange={(e) => updateServiceEndpoint(index, 'serviceEndpoint', e.target.value)} />
										</div>
									</div>
								))}
								<Button variant='outline' onClick={addServiceEndpoint} className='w-full'>
									<Plus className='h-4 w-4 mr-2' />
									Add Service Endpoint
								</Button>
							</div>
						</CardContent>
					</Card>

					<div className='flex justify-between'>
						<Button variant='outline' onClick={() => setStep('method')}>
							Back
						</Button>
						<Button onClick={generateKeys} disabled={loading}>
							{loading ? 'Generating...' : 'Generate Keys'}
						</Button>
					</div>
				</div>
			)}

			{/* Step 3: Key Generation */}
			{step === 'keys' && generatedKeys && (
				<Card>
					<CardHeader>
						<CardTitle>Generated Keys</CardTitle>
						<CardDescription>Your cryptographic keys have been generated. Store the private key securely.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Alert>
							<AlertDescription>
								<strong>Important:</strong> Store your private key securely. You will need it to sign transactions and prove ownership of your DID.
							</AlertDescription>
						</Alert>

						<div className='space-y-4'>
							<div className='space-y-2'>
								<Label>Public Key</Label>
								<div className='flex items-center gap-2'>
									<Input value={generatedKeys.publicKey} readOnly />
									<Button variant='outline' size='sm' onClick={() => copyToClipboard(generatedKeys.publicKey, 'Public key')}>
										<Copy className='h-4 w-4' />
									</Button>
								</div>
							</div>

							<div className='space-y-2'>
								<Label>Private Key</Label>
								<div className='flex items-center gap-2'>
									<Input type={showPrivateKey ? 'text' : 'password'} value={generatedKeys.privateKey} readOnly />
									<Button variant='outline' size='sm' onClick={() => setShowPrivateKey(!showPrivateKey)}>
										{showPrivateKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
									</Button>
									<Button variant='outline' size='sm' onClick={() => copyToClipboard(generatedKeys.privateKey, 'Private key')}>
										<Copy className='h-4 w-4' />
									</Button>
								</div>
							</div>
						</div>

						<div className='flex justify-between pt-4'>
							<Button variant='outline' onClick={() => setStep('config')}>
								Back
							</Button>
							<Button onClick={generatePreview}>Continue to Preview</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 4: Preview */}
			{step === 'preview' && previewDocument && (
				<Card>
					<CardHeader>
						<CardTitle>DID Document Preview</CardTitle>
						<CardDescription>Review your DID document before creation</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='space-y-2'>
								<Label>DID String</Label>
								<div className='flex items-center gap-2'>
									<Input value={generateDIDString()} readOnly />
									<Button variant='outline' size='sm' onClick={() => copyToClipboard(generateDIDString(), 'DID')}>
										<Copy className='h-4 w-4' />
									</Button>
								</div>
							</div>

							<div className='space-y-2'>
								<Label>DID Document</Label>
								<Textarea value={JSON.stringify(previewDocument, null, 2)} readOnly className='font-mono text-sm h-64' />
							</div>
						</div>

						<div className='flex justify-between pt-4'>
							<Button variant='outline' onClick={() => setStep('keys')}>
								Back
							</Button>
							<Button onClick={createDIDCall} disabled={loading}>
								{loading ? 'Creating DID...' : 'Create DID'}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 5: Complete */}
			{step === 'complete' && createdDID && (
				<Card>
					<CardContent className='p-12 text-center'>
						<div className='space-y-4'>
							<CheckCircle className='h-16 w-16 text-green-500 mx-auto' />
							<h3 className='text-2xl font-bold'>DID Created Successfully!</h3>
							<p className='text-muted-foreground'>Your decentralized identifier is ready to use</p>

							<div className='bg-gray-50 p-4 rounded-lg'>
								<p className='text-sm font-medium mb-2'>Your DID:</p>
								<div className='flex items-center justify-center gap-2'>
									<code className='text-sm bg-white px-3 py-1 rounded border'>{createdDID}</code>
									<Button variant='outline' size='sm' onClick={() => copyToClipboard(createdDID, 'DID')}>
										<Copy className='h-4 w-4' />
									</Button>
								</div>
							</div>

							<div className='flex justify-center gap-4 pt-4'>
								{onSuccess && <Button onClick={() => onSuccess(createdDID)}>View DID Details</Button>}
								{onCancel && (
									<Button variant='outline' onClick={onCancel}>
										Create Another DID
									</Button>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
