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
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {Key, Globe, Coins, Network, Users, Eye, EyeOff, Copy, Check, Shield, ArrowRight, ArrowLeft, RefreshCw, CheckCircle, Clock, Loader2} from 'lucide-react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {createDID} from '@/services/didService'
import {ClientDIDGenerator} from '@/components/did/ClientDIDGenerator'
import ChallengeDisplay from '@/components/did/ChallengeDisplay'
import SigningHelper from '@/components/did/SigningHelper'
import * as didService from '@/services/didService'
import type {CreateDIDInput, CreateDIDOutput, DIDMethod, DIDDocument, GenerateControlChallengeInput, GenerateControlChallengeOutput, VerifyDIDControlInput, RegisterUserManagedDIDInput, DIDControlProof} from '@/types/did'
import {ETHEREUM_NETWORKS, ETHEREUM_NETWORK_LABELS, DID_METHOD_INFO, RECOMMENDED_KEY_TYPES, VALIDATION_PATTERNS} from '@/constants/did'

// Service endpoint types with descriptions
const SERVICE_ENDPOINT_TYPES = {
	'MessagingService': {
		label: 'Messaging',
		description: 'Secure messaging service',
		placeholder: 'https://messaging.example.com/api',
	},
	'CredentialRepositoryService': {
		label: 'Credential Exchange',
		description: 'Digital credential exchange',
		placeholder: 'https://credentials.example.com/exchange',
	},
	'IdentityHub': {
		label: 'Identity Hub',
		description: 'Personal data storage',
		placeholder: 'https://hub.example.com/identity',
	},
	'PaymentService': {
		label: 'Payment Services',
		description: 'Payment service provider',
		placeholder: 'https://payment.example.com/api',
	},
	'DIDCommMessaging': {
		label: 'DIDComm Messaging',
		description: 'DIDComm communication',
		placeholder: 'https://didcomm.example.com/messages',
	},
	'LinkedDomains': {
		label: 'Linked Domains',
		description: 'Domain verification',
		placeholder: 'https://example.com/.well-known/did-configuration.json',
	},
	'Custom': {
		label: 'Custom',
		description: 'Custom service type',
		placeholder: 'https://example.com/custom-service',
	},
} as const

// Types for DID creation
interface DIDCreationForm {
	method: 'key' | 'web' | 'ethr' | 'VBSN' | 'peer'
	name?: string
	keyType?: 'Ed25519' | 'secp256k1' | 'P-256'
	domain?: string
	path?: string
	ethereumAddress?: string
	networkId?: string
	peerEndpoint?: string
	serviceEndpoints?: ServiceEndpoint[]
	verificationMethods?: VerificationMethod[]
}

// Client-side registration workflow steps
type ClientRegistrationStep = 'generate' | 'challenge' | 'sign' | 'verify' | 'complete'

interface ChallengeData extends GenerateControlChallengeOutput {
  verification_method?: string
}

interface SigningData {
  message: string
  signature: string
  verification_method: string
  timestamp: string
}

interface ServiceEndpoint {
	id: string
	type: string
	serviceEndpoint: string
	description?: string
	customType?: string
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
		method: 'VBSN',
		keyType: 'Ed25519',
		serviceEndpoints: [],
		verificationMethods: [],
	})
	const [loading, setLoading] = useState(false)
	const [previewDocument, setPreviewDocument] = useState<DIDDocument | null>(null)
	const [showPreview, setShowPreview] = useState(false)
	const [generatedKeys, setGeneratedKeys] = useState<{publicKey: string; privateKey: string} | null>(null)
	const [didResponse, setDidResponse] = useState<CreateDIDOutput | null>(null)
	const [showPrivateKey, setShowPrivateKey] = useState(false)
	const [copiedField, setCopiedField] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState('server')
	const [clientGeneratedResult, setClientGeneratedResult] = useState<any>(null)
	
	// Client-side registration workflow state
	const [clientStep, setClientStep] = useState<ClientRegistrationStep>('generate')
	const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
	const [signingData, setSigningData] = useState<SigningData | null>(null)
	const [proof, setProof] = useState<DIDControlProof | null>(null)
	const [registrationResult, setRegistrationResult] = useState<any>(null)
	const [registrationLoading, setRegistrationLoading] = useState(false)
	
	// Challenge workflow states
	const [challengeLoading, setChallengeLoading] = useState(false)
	const [challengeResult, setChallengeResult] = useState<any>(null)
	const [signingLoading, setSigningLoading] = useState(false)
	const [signatureResult, setSignatureResult] = useState<any>(null)
	const [verificationLoading, setVerificationLoading] = useState(false)

	/**
	 * Get method icon and description
	 */
	const getMethodInfo = (method: string) => {
		const info = DID_METHOD_INFO[method as keyof typeof DID_METHOD_INFO]
		if (!info) {
			return {
				icon: <Key className='h-5 w-5' />,
				title: 'Unknown',
				description: 'Unknown DID method',
			}
		}

		const IconComponent =
			{
				Key,
				Globe,
				Coins,
				Network,
				Users,
			}[info.icon] || Key

		return {
			icon: <IconComponent className='h-5 w-5' />,
			title: info.title,
			description: info.description,
		}
	}

	/**
	 * Generate preview DID document
	 */
	const generatePreview = () => {
		let didId = ''

		switch (form.method) {
			case 'VBSN':
				didId = 'did:VBSN:[generated-vbsn-id-using-ed25519-keys]'
				break
			case 'key':
				didId = 'did:key:[generated-key-will-be-here]'
				break
			case 'web':
				didId = `did:web:${form.domain || '[domain-required]'}${form.path ? ':' + form.path.replace(/\//g, ':') : ''}`
				break
			case 'ethr':
				const network = form.networkId || 'mainnet'
				const address = form.ethereumAddress || '[generated-or-provided-address]'
				didId = `did:ethr:${network}:${address}`
				break
			case 'peer':
				didId = 'did:peer:[generated-peer-id-for-p2p-communication]'
				break
		}

		const keyType = form.keyType || 'Ed25519'
		const verificationMethodType = keyType === 'Ed25519' ? 'Ed25519VerificationKey2020' : keyType === 'secp256k1' ? 'EcdsaSecp256k1VerificationKey2019' : 'JsonWebKey2020'

		const document = {
			'@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
			id: didId,
			verificationMethod: [
				{
					id: `${didId}#[generated-key-fragment]`,
					type: verificationMethodType,
					controller: didId,
					publicKeyMultibase: '[generated-public-key-will-be-here]',
				},
			],
			authentication: [`${didId}#[generated-key-fragment]`],
			assertionMethod: [`${didId}#[generated-key-fragment]`],
			keyAgreement: [`${didId}#[generated-key-fragment]`],
			capabilityInvocation: [`${didId}#[generated-key-fragment]`],
			capabilityDelegation: [`${didId}#[generated-key-fragment]`],
			service:
				form.serviceEndpoints?.map((endpoint) => ({
					id: `${didId}#${endpoint.id}`,
					type: endpoint.type === 'Custom' ? endpoint.customType || 'CustomService' : endpoint.type,
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
			// Client-side validation
			if (form.method === 'web' && !form.domain) {
				toast.error('Domain is required for did:web method')
				return
			}

			if (form.method === 'web' && form.domain && !VALIDATION_PATTERNS.DOMAIN.test(form.domain)) {
				toast.error('Invalid domain format')
				return
			}

			if (form.method === 'peer' && form.peerEndpoint) {
				if (!VALIDATION_PATTERNS.URL.test(form.peerEndpoint)) {
					toast.error('Peer endpoint must be a valid HTTP/HTTPS URL')
					return
				}
			}

			if (form.method === 'ethr' && form.ethereumAddress) {
				if (!VALIDATION_PATTERNS.ETHEREUM_ADDRESS.test(form.ethereumAddress)) {
					toast.error('Invalid Ethereum address format')
					return
				}
			}

			// Prepare API input to match backend DTO structure
			const createInput: CreateDIDInput = {
				method: form.method as DIDMethod,
				name: form.name,
				key_type: form.keyType,
				// Send method-specific fields directly (not in options)
				...(form.method === 'web' && {
					domain: form.domain,
					path: form.path,
				}),
				...(form.method === 'ethr' && {
					ethereumAddress: form.ethereumAddress,
					networkId: form.networkId || ETHEREUM_NETWORKS.MAINNET,
				}),
				...(form.method === 'peer' && {
					peerEndpoint: form.peerEndpoint,
				}),
				// Send service endpoints with snake_case
				service_endpoints:
					form.serviceEndpoints?.map((endpoint) => ({
						id: endpoint.id,
						type: endpoint.type === 'Custom' ? endpoint.customType || 'CustomService' : endpoint.type,
						service_endpoint: endpoint.serviceEndpoint, // Backend expects snake_case
						description: endpoint.description,
					})) || [],
				// Additional options and metadata
				options: {},
				metadata: {},
			}

			// Call actual API
			const response = await createDID(createInput)
			console.log('API Response:', response)

			// Extract keys from response - backend returns flat structure
			const publicKey = response.did.metadata?.publicKey || response.did.document?.verificationMethod?.[0]?.publicKeyMultibase || response.did || 'Generated successfully'

			const privateKey = response.did.metadata?.privateKey || 'Private key is securely stored on the server'

			const keys = {
				publicKey: typeof publicKey === 'string' ? publicKey : JSON.stringify(publicKey),
				privateKey: typeof privateKey !== 'string' ? JSON.stringify(privateKey) : 'Private key is securely stored on the server',
			}

			setGeneratedKeys(keys)
			setDidResponse(response)
			// Store the response document for navigation
			if (response.did.document) {
				setPreviewDocument(response.did.document)
			}
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

	// Client-side registration workflow functions
	const handleClientDIDGenerated = (result: any) => {
		setClientGeneratedResult(result)
		setClientStep('challenge')
		toast.success('DID generated successfully! Now generating challenge...')
		// Auto-generate challenge
		setTimeout(() => handleGenerateChallenge(result), 500)
	}

	const handleGenerateChallenge = async (generatedResult: any) => {
		if (!generatedResult) return

		setChallengeLoading(true)
		try {
			const input: GenerateControlChallengeInput = {
				did: generatedResult.did,
				verification_method: generatedResult.verificationMethod,
				purpose: 'registration'
			}

			const result = await didService.generateControlChallenge(input)
			
			setChallengeResult({
				...result,
				verification_method: generatedResult.verificationMethod
			})
			
			setClientStep('sign')
			toast.success('Challenge generated successfully!')
		} catch (err) {
			console.error('Error generating challenge:', err)
			toast.error(err instanceof Error ? err.message : 'Failed to generate challenge')
		} finally {
			setChallengeLoading(false)
		}
	}

	const handleSignatureCreated = (signature: string) => {
		if (!challengeResult || !clientGeneratedResult) return

		const signingDataResult: SigningData = {
			message: challengeResult.challenge,
			signature: signature,
			verification_method: challengeResult.verification_method || clientGeneratedResult.verificationMethod,
			timestamp: new Date().toISOString()
		}

		setSigningData(signingDataResult)
		setClientStep('verify')
		toast.success('Signature created successfully!')
	}

	const handleVerifyAndRegister = async () => {
		if (!challengeResult || !signingData || !clientGeneratedResult) return

		setVerificationLoading(true)
		try {
			// Create proof
			const proofData: DIDControlProof = {
				type: 'signature',
				challenge: challengeResult.challenge,
				signature: signingData.signature,
				verification_method: signingData.verification_method,
				signed_message: challengeResult.challenge,
				timestamp: signingData.timestamp,
				nonce: challengeResult.nonce
			}

			// Use the RegisterUserManagedDID API (backend will be updated to handle non-existing DIDs)
			const registerInput: RegisterUserManagedDIDInput = {
				did: clientGeneratedResult.did,
				challenge_id: challengeResult.challenge_id,
				document: clientGeneratedResult.didDocument, // Include DID document for verification
				proof_of_control: proofData,
				metadata: {
					clientGenerated: true,
					name: form.name || `Client Generated ${clientGeneratedResult.did.split(':')[1]} DID`,
					keyType: clientGeneratedResult.keyPair ? 
						(clientGeneratedResult.keyPair.privateKey.length === 32 ? 'Ed25519' : 'secp256k1') : 
						'Ed25519',
					originalDID: clientGeneratedResult.did,
					verificationMethod: clientGeneratedResult.verificationMethod,
					didDocument: clientGeneratedResult.didDocument,
					generatedAt: new Date().toISOString()
				}
			}

			const registerResult = await didService.registerUserManagedDID(registerInput)
			
			setRegistrationResult(registerResult)
			setClientStep('complete')
			toast.success('Client-generated DID registered successfully!')
			
		} catch (err) {
			console.error('Error in verification/registration:', err)
			toast.error(err instanceof Error ? err.message : 'Failed to verify/register DID')
		} finally {
			setVerificationLoading(false)
		}
	}

	const resetClientWorkflow = () => {
		setClientGeneratedResult(null)
		setClientStep('generate')
		setRegistrationResult(null)
		setRegistrationLoading(false)
		
		// Reset challenge workflow states
		setChallengeLoading(false)
		setChallengeResult(null)
		setSigningLoading(false)
		setSignatureResult(null)
		setVerificationLoading(false)
		setChallengeData(null)
		setSigningData(null)
		setProof(null)
	}

	/**
	 * Add service endpoint
	 */
	const addServiceEndpoint = () => {
		const randomId = Math.random().toString(36).substring(2, 8)
		setForm((prev) => ({
			...prev,
			serviceEndpoints: [
				...(prev.serviceEndpoints || []),
				{
					id: randomId,
					type: 'MessagingService',
					serviceEndpoint: '',
				},
			],
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

	/**
	 * Update service endpoint field
	 */
	const updateServiceEndpoint = (index: number, field: keyof ServiceEndpoint, value: string) => {
		setForm((prev) => {
			const newEndpoints = [...(prev.serviceEndpoints || [])]
			newEndpoints[index] = {
				...newEndpoints[index],
				[field]: value,
			}
			return {...prev, serviceEndpoints: newEndpoints}
		})
	}

	/**
	 * Get placeholder for service endpoint URL based on type
	 */
	const getServiceEndpointPlaceholder = (type: string) => {
		return SERVICE_ENDPOINT_TYPES[type as keyof typeof SERVICE_ENDPOINT_TYPES]?.placeholder || 'https://example.com/service'
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
								<Button variant='outline' size='sm' onClick={() => copyToClipboard(generatedKeys.publicKey, 'publicKey')} className='hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors'>
									{copiedField === 'publicKey' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
								</Button>
							</div>
						</div>

						{generatedKeys.privateKey !== 'Private key is securely stored on the server' && (
							<div>
								<Label>Private Key</Label>
								<div className='flex items-center gap-2 mt-1'>
									<Input type={showPrivateKey ? 'text' : 'password'} value={generatedKeys.privateKey} readOnly className='font-mono text-sm' />
									<Button variant='outline' size='sm' onClick={() => setShowPrivateKey(!showPrivateKey)} className='hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors'>
										{showPrivateKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
									</Button>
									<Button variant='outline' size='sm' onClick={() => copyToClipboard(generatedKeys.privateKey, 'privateKey')} className='hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors'>
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
							<Button onClick={() => router.push('/dashboard/dids')} className='flex-1 hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors'>
								Go to DID Dashboard
							</Button>
							<Button variant='outline' onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(previewDocument?.id || didResponse?.did.did || '')}`)} className='flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors'>
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

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="server" className="flex items-center gap-2">
						<Globe className="h-4 w-4" />
						Server Creation
					</TabsTrigger>
					<TabsTrigger value="client" className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						Client-side Generation
					</TabsTrigger>
				</TabsList>

				<TabsContent value="server" className="space-y-6">
					<form onSubmit={handleSubmit} className='space-y-6'>
				{/* Method Selection */}
				<Card>
					<CardHeader>
						<CardTitle>DID Method</CardTitle>
						<CardDescription>Choose the DID method that best fits your use case</CardDescription>
					</CardHeader>
					<CardContent>
						<RadioGroup
							value={form.method}
							onValueChange={(value: 'VBSN' | 'key' | 'web' | 'ethr' | 'peer') => {
								// Auto-select recommended key type for each method
								const recommendedKeyType = RECOMMENDED_KEY_TYPES[value] || 'Ed25519'

								setForm((prev) => ({
									...prev,
									method: value,
									keyType: recommendedKeyType,
								}))
							}}
							className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{['VBSN', 'key', 'web', 'ethr', 'peer'].map((method) => {
								const info = getMethodInfo(method)
								const isDisabled = method === 'ethr' || method === 'peer'
								return (
									<div key={method} className='flex items-center space-x-2'>
										<RadioGroupItem value={method} id={method} disabled={isDisabled} />
										<Label htmlFor={method} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 flex-1 ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
											{info.icon}
											<div>
												<div className='font-medium'>
													{info.title}
													{isDisabled && <span className='text-xs text-gray-400 ml-1'>(Coming Soon)</span>}
												</div>
												<div className='text-sm text-gray-500 dark:text-gray-400'>{info.description}</div>
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
						{/* Name Field - Available for all methods */}
						<div>
							<Label htmlFor='name'>Name (Optional)</Label>
							<Input id='name' value={form.name || ''} onChange={(e) => setForm((prev) => ({...prev, name: e.target.value}))} placeholder='Enter a friendly name for your DID' className='text-sm' />
							<div className='text-sm text-gray-500 mt-1'>A human-readable name to help identify this DID</div>
						</div>

						{/* Key Type Selection - Available for all methods */}
						<div>
							<Label htmlFor='keyType'>Key Type</Label>
							<Select value={form.keyType} onValueChange={(value: 'Ed25519' | 'secp256k1' | 'P-256') => setForm((prev) => ({...prev, keyType: value}))}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='Ed25519'>Ed25519 (Recommended for most methods)</SelectItem>
									<SelectItem value='secp256k1'>secp256k1 (Recommended for Ethereum)</SelectItem>
									<SelectItem value='P-256'>P-256 (NIST curve)</SelectItem>
								</SelectContent>
							</Select>
							<div className='text-sm text-gray-500 mt-1'>
								{form.method === 'ethr' && 'secp256k1 is recommended for Ethereum-based DIDs'}
								{form.method === 'key' && 'Ed25519 is recommended for did:key method'}
								{form.method === 'web' && 'Ed25519 is recommended for did:web method'}
								{form.method === 'VBSN' && 'Ed25519 is recommended for did:VBSN method'}
								{form.method === 'peer' && 'Ed25519 is recommended for did:peer method'}
							</div>
						</div>

						{/* VBSN Method Configuration */}
						{form.method === 'VBSN' && (
							<div className='space-y-4'>
								<div className='text-sm text-gray-500 dark:text-gray-400'>
									<p>VBSN (Vietnam Blockchain Service Network) is a key-based DID method.</p>
									<p>No additional configuration required - the system will generate Ed25519 keys automatically.</p>
								</div>
							</div>
						)}

						{/* Method-specific Configuration */}
						{form.method === 'key' && <div className='text-sm text-gray-500 dark:text-gray-400'>No additional configuration required for did:key method.</div>}

						{/* Web Method Configuration */}
						{form.method === 'web' && (
							<div>
								<div>
									<Label htmlFor='domain'>Domain *</Label>
									<Input id='domain' value={form.domain || ''} onChange={(e) => setForm((prev) => ({...prev, domain: e.target.value}))} placeholder='example.com' required />
								</div>
								<div>
									<Label htmlFor='path'>Path (optional)</Label>
									<Input id='path' value={form.path || ''} onChange={(e) => setForm((prev) => ({...prev, path: e.target.value}))} placeholder='users/alice' />
								</div>
							</div>
						)}

						{/* Ethereum Method Configuration */}
						{form.method === 'ethr' && (
							<div className='space-y-4'>
								<div>
									<Label htmlFor='ethereumAddress'>Ethereum Address (optional)</Label>
									<Input id='ethereumAddress' value={form.ethereumAddress || ''} onChange={(e) => setForm((prev) => ({...prev, ethereumAddress: e.target.value}))} placeholder='0x1234567890123456789012345678901234567890' />
									<div className='text-sm text-gray-500 mt-1'>Leave empty to generate a new address</div>
								</div>
								<div>
									<Label htmlFor='networkId'>Ethereum Network</Label>
									<Select value={form.networkId || ETHEREUM_NETWORKS.MAINNET} onValueChange={(value) => setForm((prev) => ({...prev, networkId: value}))}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(ETHEREUM_NETWORK_LABELS).map(([value, label]) => (
												<SelectItem key={value} value={value}>
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{/* Peer Method Configuration */}
						{form.method === 'peer' && (
							<div className='space-y-4'>
								<div>
									<Label htmlFor='peerEndpoint'>DIDComm Endpoint (optional)</Label>
									<Input id='peerEndpoint' value={form.peerEndpoint || ''} onChange={(e) => setForm((prev) => ({...prev, peerEndpoint: e.target.value}))} placeholder='https://peer.example.com/didcomm' />
									<div className='text-sm text-gray-500 mt-1'>URL for DIDComm messaging. Must be HTTPS.</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Service Endpoints */}
				<Card>
					<CardHeader>
						<CardTitle>Service Endpoints (Optional)</CardTitle>
						<CardDescription>Add service endpoints to your DID document for various services</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						{form.serviceEndpoints?.map((endpoint, index) => (
							<div key={index} className='space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50'>
								<div className='grid grid-cols-1 gap-3'>
									<div>
										<Label>Service Type</Label>
										<Select value={endpoint.type} onValueChange={(value) => updateServiceEndpoint(index, 'type', value)}>
											<SelectTrigger>
												<SelectValue placeholder='Select service type' />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(SERVICE_ENDPOINT_TYPES).map(([value, config]) => (
													<SelectItem key={value} value={value}>
														<div className='flex flex-col'>
															<span className='font-medium'>{config.label}</span>
															<span className='text-xs text-gray-500'>{config.description}</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{endpoint.type === 'Custom' && (
											<div className='mt-2'>
												<Input value={endpoint.customType || ''} onChange={(e) => updateServiceEndpoint(index, 'customType', e.target.value)} placeholder='Enter custom service type (e.g., FileStorageService)' className='text-sm' />
												<div className='text-xs text-gray-500 mt-1'>Enter your custom service type name</div>
											</div>
										)}
										{endpoint.type && endpoint.type !== 'Custom' && <div className='text-xs text-gray-500 mt-1'>{SERVICE_ENDPOINT_TYPES[endpoint.type as keyof typeof SERVICE_ENDPOINT_TYPES]?.description}</div>}
									</div>
								</div>
								<div>
									<Label>Service Endpoint URL</Label>
									<Input value={endpoint.serviceEndpoint} onChange={(e) => updateServiceEndpoint(index, 'serviceEndpoint', e.target.value)} placeholder={getServiceEndpointPlaceholder(endpoint.type)} className='text-sm' />
									<div className='text-xs text-gray-500 mt-1'>Service endpoint URL (must be HTTPS)</div>
								</div>
								<div className='flex justify-end'>
									<Button type='button' variant='outline' size='sm' onClick={() => removeServiceEndpoint(index)} className='hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors'>
										Remove Service
									</Button>
								</div>
							</div>
						))}

						{form.serviceEndpoints && form.serviceEndpoints.length === 0 && (
							<div className='text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg'>
								<div className='mb-2'>No service endpoints added yet</div>
								<div className='text-xs'>Service endpoints allow your DID to provide services like messaging, credential exchange, identity hub, and payment services</div>
							</div>
						)}

						<Button type='button' variant='outline' onClick={addServiceEndpoint} className='w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors'>
							+ Add Service Endpoint
						</Button>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className='flex gap-4'>
					<Button type='button' variant='outline' onClick={generatePreview} className='flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors'>
						Preview DID Document
					</Button>
					<Button type='submit' disabled={loading} className='flex-1 hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors'>
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
							<Button variant='outline' onClick={() => copyToClipboard(JSON.stringify(previewDocument, null, 2), 'preview')} className='hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors'>
								{copiedField === 'preview' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}
								Copy
							</Button>
							<Button variant='outline' onClick={() => setShowPreview(false)} className='hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors'>
								Close
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</TabsContent>

		<TabsContent value="client" className="space-y-6">
			{/* Progress indicator */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Client-side DID Registration
					</CardTitle>
					<CardDescription>
						Complete DID generation and registration workflow with cryptographic proof of control
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between mb-6">
						{['generate', 'challenge', 'sign', 'verify', 'complete'].map((step, index) => (
							<div key={step} className="flex items-center">
								<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
									clientStep === step ? 'bg-blue-600 text-white' :
									['generate', 'challenge', 'sign', 'verify'].indexOf(clientStep) > index ? 'bg-green-600 text-white' :
									'bg-gray-200 text-gray-600'
								}`}>
									{['generate', 'challenge', 'sign', 'verify'].indexOf(clientStep) > index ? (
										<CheckCircle className="h-4 w-4" />
									) : (
										index + 1
									)}
								</div>
								{index < 4 && (
									<div className={`w-16 h-0.5 mx-2 ${
										['generate', 'challenge', 'sign', 'verify'].indexOf(clientStep) > index ? 'bg-green-600' : 'bg-gray-200'
									}`} />
								)}
							</div>
						))}
					</div>
					
					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							{clientStep === 'generate' && 'Generate your DID and cryptographic keys'}
							{clientStep === 'challenge' && 'Generating cryptographic challenge...'}
							{clientStep === 'sign' && 'Sign the challenge to prove control'}
							{clientStep === 'verify' && 'Verify signature and register DID'}
							{clientStep === 'complete' && 'Registration completed successfully!'}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Step 1: Generate DID */}
			{clientStep === 'generate' && (
				<ClientDIDGenerator 
					onGenerated={handleClientDIDGenerated}
				/>
			)}

			{/* Step 2: Registration */}
			{/* Step 2: Challenge Generation */}
			{clientStep === 'challenge' && clientGeneratedResult && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Generate Challenge</CardTitle>
							<CardDescription>Request a challenge for your DID registration</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
								{clientGeneratedResult.did}
							</div>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<strong>Method:</strong> {clientGeneratedResult.did.split(':')[1]}
								</div>
								<div>
									<strong>Key Type:</strong> {clientGeneratedResult.keyPair.privateKey.length === 32 ? 'Ed25519' : 'secp256k1'}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="client-did-name">DID Name (Optional)</Label>
								<Input
									id="client-did-name"
									placeholder="My Client-Generated DID"
									value={form.name || ''}
									onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
								/>
							</div>

							<div className="flex justify-between">
								<Button
									variant="outline"
									onClick={() => setClientStep('generate')}
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Generation
								</Button>
								<Button 
									onClick={() => handleGenerateChallenge(clientGeneratedResult)}
									disabled={challengeLoading}
								>
									{challengeLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Generating...
										</>
									) : (
										<>
											Generate Challenge
											<ArrowRight className="h-4 w-4 ml-2" />
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Step 3: Signature Creation */}
			{clientStep === 'sign' && challengeResult && clientGeneratedResult && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Sign Challenge</CardTitle>
							<CardDescription>Creating signature with your private key</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label>Challenge Token</Label>
								<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
									{challengeResult.challenge}
								</div>
							</div>

							{signatureResult && (
								<div>
									<Label>Generated Signature</Label>
									<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
										{signatureResult.signature}
									</div>
								</div>
							)}

							<div className="flex justify-between">
								<Button
									variant="outline"
									onClick={() => setClientStep('challenge')}
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Challenge
								</Button>
								<Button 
									onClick={async () => {
										if (!challengeResult || !clientGeneratedResult) return
										
										setSigningLoading(true)
										try {
											// Import crypto functions
											const { signMessage } = await import('@/lib/did-generation')
											
											// Determine key type from private key length
											const keyType = clientGeneratedResult.keyPair.privateKey.length === 32 ? 'Ed25519' : 'secp256k1'
											
											// Create signature
											const signature = await signMessage(
												challengeResult.challenge,
												clientGeneratedResult.keyPair.privateKey,
												keyType
											)
											
											setSignatureResult({ signature, challenge: challengeResult.challenge })
											handleSignatureCreated(signature)
										} catch (error) {
											console.error('Signing error:', error)
											toast.error('Failed to create signature')
										} finally {
											setSigningLoading(false)
										}
									}}
									disabled={signingLoading || !!signatureResult}
								>
									{signingLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Signing...
										</>
									) : signatureResult ? (
										<>
											<CheckCircle className="h-4 w-4 mr-2" />
											Signature Created
										</>
									) : (
										<>
											Create Signature
											<ArrowRight className="h-4 w-4 ml-2" />
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Step 4: Verification */}
			{clientStep === 'verify' && challengeResult && signatureResult && clientGeneratedResult && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Verify & Register</CardTitle>
							<CardDescription>Submit signature for verification and DID registration</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label>DID to Register</Label>
								<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
									{clientGeneratedResult.did}
								</div>
							</div>
							<div>
								<Label>Challenge</Label>
								<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
									{challengeResult.challenge}
								</div>
							</div>
							<div>
								<Label>Signature</Label>
								<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
									{signatureResult.signature}
								</div>
							</div>

							<div className="flex justify-between">
								<Button
									variant="outline"
									onClick={() => setClientStep('sign')}
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Signing
								</Button>
								<Button 
									onClick={handleVerifyAndRegister}
									disabled={verificationLoading}
								>
									{verificationLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Verifying...
										</>
									) : (
										<>
											Verify & Register
											<CheckCircle className="h-4 w-4 ml-2" />
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Step 3: Complete */}
			{clientStep === 'complete' && registrationResult && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-green-600" />
								Registration Completed!
							</CardTitle>
							<CardDescription>
								Your DID has been successfully registered with proof of control
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label>Registered DID</Label>
								<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
									{registrationResult.did || registrationResult.identifier}
								</div>
							</div>
							<div>
								<Label>Registration Status</Label>
								<div className="flex items-center gap-2">
									<Badge variant="default">{registrationResult.status || 'active'}</Badge>
									<span className="text-sm text-muted-foreground">
										{registrationResult.registered_at ? 
											new Date(registrationResult.registered_at).toLocaleString() :
											new Date().toLocaleString()
										}
									</span>
								</div>
							</div>
							{registrationResult.name && (
								<div>
									<Label>DID Name</Label>
									<div className="text-sm">{registrationResult.name}</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex gap-4">
								<Button 
									onClick={() => router.push('/dashboard/dids')}
									className="flex-1"
								>
									Go to DID Dashboard
								</Button>
								<Button 
									variant="outline" 
									onClick={() => router.push(`/dashboard/dids/${encodeURIComponent(registrationResult.did || registrationResult.identifier || clientGeneratedResult?.did || '')}`)}
									className="flex-1"
								>
									View DID Details
								</Button>
								<Button
									variant="outline"
									onClick={resetClientWorkflow}
								>
									Register Another DID
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Loading states for challenge workflow */}
			{(challengeLoading || signingLoading || verificationLoading) && clientGeneratedResult && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-center py-8">
							<div className="text-center">
								<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
								<p className="text-sm text-muted-foreground">
									{challengeLoading && 'Generating challenge...'}
									{signingLoading && 'Creating signature...'}
									{verificationLoading && 'Verifying and registering DID...'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</TabsContent>
	</Tabs>
</div>
	)
}
