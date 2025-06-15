'use client'

import React, {useState, useEffect} from 'react'
import {PageHeader} from '@/components/layout/PageHeader'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Key, Globe, Coins, Network, Users, Save, RefreshCw, Info, Edit} from 'lucide-react'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'

// Types for DID method configuration
interface DIDMethodConfig {
	id: string
	name: string
	method: 'key' | 'web' | 'ethr' | 'ion' | 'peer'
	enabled: boolean
	default: boolean
	priority: number
	config: {
		[key: string]: string | number | boolean
	}
	description: string
	supportedOperations: string[]
	lastUpdated: string
	status: 'active' | 'inactive' | 'error'
}

interface NetworkConfig {
	id: string
	name: string
	rpcUrl: string
	chainId?: number
	contractAddress?: string
	enabled: boolean
}

export default function DIDMethodConfiguration() {
	const [methods, setMethods] = useState<DIDMethodConfig[]>([])
	const [networks, setNetworks] = useState<NetworkConfig[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [selectedMethod, setSelectedMethod] = useState<DIDMethodConfig | null>(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

	// Fetch method configurations
	useEffect(() => {
		const fetchConfigurations = async () => {
			try {
				setLoading(true)
				// TODO: Replace with actual API calls
				// const [methodsResponse, networksResponse] = await Promise.all([
				//   didMethodService.getConfigurations(),
				//   didMethodService.getNetworkConfigurations()
				// ])

				// Mock data for demonstration
				const mockMethods: DIDMethodConfig[] = [
					{
						id: 'did-key',
						name: 'DID Key',
						method: 'key',
						enabled: true,
						default: true,
						priority: 1,
						config: {
							keyType: 'Ed25519',
							encoding: 'base58btc',
						},
						description: 'Simple cryptographic key-based DID method',
						supportedOperations: ['create', 'resolve', 'update', 'deactivate'],
						lastUpdated: new Date().toISOString(),
						status: 'active',
					},
					{
						id: 'did-web',
						name: 'DID Web',
						method: 'web',
						enabled: true,
						default: false,
						priority: 2,
						config: {
							baseDomain: 'example.com',
							path: '/.well-known/did.json',
							httpsRequired: true,
						},
						description: 'Web-based DID method using domain names',
						supportedOperations: ['create', 'resolve', 'update'],
						lastUpdated: new Date().toISOString(),
						status: 'active',
					},
					{
						id: 'did-ethr',
						name: 'DID Ethereum',
						method: 'ethr',
						enabled: false,
						default: false,
						priority: 3,
						config: {
							network: 'mainnet',
							registryAddress: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
							rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
						},
						description: 'Ethereum blockchain-based DID method',
						supportedOperations: ['create', 'resolve', 'update', 'deactivate'],
						lastUpdated: new Date().toISOString(),
						status: 'inactive',
					},
					{
						id: 'did-ion',
						name: 'DID ION',
						method: 'ion',
						enabled: false,
						default: false,
						priority: 4,
						config: {
							ionNodeUrl: 'https://ion.msidentity.com',
							bitcoinRpcUrl: 'https://bitcoin.mainnet.rpc',
						},
						description: 'Bitcoin-anchored DID method via ION network',
						supportedOperations: ['create', 'resolve', 'update', 'deactivate'],
						lastUpdated: new Date().toISOString(),
						status: 'inactive',
					},
					{
						id: 'did-peer',
						name: 'DID Peer',
						method: 'peer',
						enabled: true,
						default: false,
						priority: 5,
						config: {
							numAlgo: 2,
							encAlgo: 'X25519',
						},
						description: 'Peer-to-peer DID method for direct communication',
						supportedOperations: ['create', 'resolve'],
						lastUpdated: new Date().toISOString(),
						status: 'active',
					},
				]

				const mockNetworks: NetworkConfig[] = [
					{
						id: 'ethereum-mainnet',
						name: 'Ethereum Mainnet',
						rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
						chainId: 1,
						contractAddress: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
						enabled: false,
					},
					{
						id: 'ethereum-sepolia',
						name: 'Ethereum Sepolia',
						rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
						chainId: 11155111,
						contractAddress: '0x03d5003bf0e79c5f5223588f347eba39afbc3818',
						enabled: true,
					},
					{
						id: 'polygon-mainnet',
						name: 'Polygon Mainnet',
						rpcUrl: 'https://polygon-rpc.com',
						chainId: 137,
						contractAddress: '0x41d788c9c5d335362d713152f407692c5efc7662',
						enabled: false,
					},
				]

				setMethods(mockMethods)
				setNetworks(mockNetworks)
			} catch (error) {
				console.error('Failed to fetch DID method configurations:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchConfigurations()
	}, [])

	// Save configuration changes
	const handleSaveConfiguration = async () => {
		try {
			setSaving(true)
			// TODO: Implement actual save logic
			// await didMethodService.updateConfigurations(methods)
			console.log('Saving configurations:', methods)
			// Show success message
		} catch (error) {
			console.error('Failed to save configurations:', error)
		} finally {
			setSaving(false)
		}
	}

	// Toggle method enabled state
	const toggleMethodEnabled = (methodId: string) => {
		setMethods((prev) => prev.map((method) => (method.id === methodId ? {...method, enabled: !method.enabled} : method)))
	}

	// Set default method
	const setDefaultMethod = (methodId: string) => {
		setMethods((prev) =>
			prev.map((method) => ({
				...method,
				default: method.id === methodId,
			})),
		)
	}

	// Get method icon
	const getMethodIcon = (method: string) => {
		switch (method) {
			case 'key':
				return <Key className='h-4 w-4' />
			case 'web':
				return <Globe className='h-4 w-4' />
			case 'ethr':
				return <Coins className='h-4 w-4' />
			case 'ion':
				return <Network className='h-4 w-4' />
			case 'peer':
				return <Users className='h-4 w-4' />
			default:
				return <Key className='h-4 w-4' />
		}
	}

	// Get status badge variant
	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default'
			case 'inactive':
				return 'secondary'
			case 'error':
				return 'destructive'
			default:
				return 'outline'
		}
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<PageHeader title='DID Method Configuration' description='Configure and manage DID methods and network settings' />
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{Array.from({length: 6}).map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<div className='h-4 w-24 bg-muted animate-pulse rounded' />
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									<div className='h-3 w-full bg-muted animate-pulse rounded' />
									<div className='h-3 w-2/3 bg-muted animate-pulse rounded' />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='DID Method Configuration'
				description='Configure and manage DID methods and network settings'
				actions={
					<Button onClick={handleSaveConfiguration} disabled={saving}>
						{saving ? <RefreshCw className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
						Save Configuration
					</Button>
				}
			/>

			<Tabs defaultValue='methods' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='methods'>DID Methods</TabsTrigger>
					<TabsTrigger value='networks'>Network Configuration</TabsTrigger>
					<TabsTrigger value='advanced'>Advanced Settings</TabsTrigger>
				</TabsList>

				<TabsContent value='methods' className='space-y-4'>
					<Alert>
						<Info className='h-4 w-4' />
						<AlertTitle>DID Method Configuration</AlertTitle>
						<AlertDescription>Configure which DID methods are available for users. At least one method must be enabled and set as default.</AlertDescription>
					</Alert>

					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{methods.map((method) => (
							<Card key={method.id} className={method.enabled ? 'border-primary' : ''}>
								<CardHeader>
									<div className='flex items-center justify-between'>
										<div className='flex items-center space-x-2'>
											{getMethodIcon(method.method)}
											<CardTitle className='text-lg'>{method.name}</CardTitle>
										</div>
										<div className='flex items-center space-x-2'>
											{method.default && <Badge variant='outline'>Default</Badge>}
											<Badge variant={getStatusVariant(method.status)}>{method.status}</Badge>
										</div>
									</div>
									<CardDescription>{method.description}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										<div className='flex items-center justify-between'>
											<Label htmlFor={`enabled-${method.id}`}>Enabled</Label>
											<Switch id={`enabled-${method.id}`} checked={method.enabled} onCheckedChange={() => toggleMethodEnabled(method.id)} />
										</div>

										{method.enabled && (
											<>
												<div className='flex items-center justify-between'>
													<Label htmlFor={`default-${method.id}`}>Set as Default</Label>
													<Switch id={`default-${method.id}`} checked={method.default} onCheckedChange={() => setDefaultMethod(method.id)} />
												</div>

												<Separator />

												<div className='space-y-2'>
													<Label className='text-sm font-medium'>Supported Operations</Label>
													<div className='flex flex-wrap gap-1'>
														{method.supportedOperations.map((op) => (
															<Badge key={op} variant='secondary' className='text-xs'>
																{op}
															</Badge>
														))}
													</div>
												</div>

												<div className='flex space-x-2'>
													<Button
														variant='outline'
														size='sm'
														className='flex-1'
														onClick={() => {
															setSelectedMethod(method)
															setIsEditDialogOpen(true)
														}}>
														<Edit className='mr-1 h-3 w-3' />
														Configure
													</Button>
												</div>
											</>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value='networks' className='space-y-4'>
					<Alert>
						<Info className='h-4 w-4' />
						<AlertTitle>Network Configuration</AlertTitle>
						<AlertDescription>Configure blockchain networks for DID methods that require network connectivity.</AlertDescription>
					</Alert>

					<div className='grid gap-4'>
						{networks.map((network) => (
							<Card key={network.id}>
								<CardHeader>
									<div className='flex items-center justify-between'>
										<CardTitle>{network.name}</CardTitle>
										<div className='flex items-center space-x-2'>
											<Badge variant={network.enabled ? 'default' : 'secondary'}>{network.enabled ? 'Enabled' : 'Disabled'}</Badge>
											<Switch
												checked={network.enabled}
												onCheckedChange={(checked) => {
													setNetworks((prev) => prev.map((n) => (n.id === network.id ? {...n, enabled: checked} : n)))
												}}
											/>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className='grid gap-4 md:grid-cols-2'>
										<div className='space-y-2'>
											<Label htmlFor={`rpc-${network.id}`}>RPC URL</Label>
											<Input
												id={`rpc-${network.id}`}
												value={network.rpcUrl}
												onChange={(e) => {
													setNetworks((prev) => prev.map((n) => (n.id === network.id ? {...n, rpcUrl: e.target.value} : n)))
												}}
												disabled={!network.enabled}
											/>
										</div>
										{network.chainId && (
											<div className='space-y-2'>
												<Label htmlFor={`chain-${network.id}`}>Chain ID</Label>
												<Input
													id={`chain-${network.id}`}
													type='number'
													value={network.chainId}
													onChange={(e) => {
														setNetworks((prev) => prev.map((n) => (n.id === network.id ? {...n, chainId: parseInt(e.target.value)} : n)))
													}}
													disabled={!network.enabled}
												/>
											</div>
										)}
										{network.contractAddress && (
											<div className='space-y-2 md:col-span-2'>
												<Label htmlFor={`contract-${network.id}`}>Contract Address</Label>
												<Input
													id={`contract-${network.id}`}
													value={network.contractAddress}
													onChange={(e) => {
														setNetworks((prev) => prev.map((n) => (n.id === network.id ? {...n, contractAddress: e.target.value} : n)))
													}}
													disabled={!network.enabled}
												/>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value='advanced' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Advanced Settings</CardTitle>
							<CardDescription>Global DID method configuration and security settings</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-6'>
								<div className='grid gap-4 md:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='resolution-timeout'>Resolution Timeout (ms)</Label>
										<Input id='resolution-timeout' type='number' defaultValue={5000} placeholder='5000' />
									</div>
									<div className='space-y-2'>
										<Label htmlFor='cache-duration'>Cache Duration (minutes)</Label>
										<Input id='cache-duration' type='number' defaultValue={60} placeholder='60' />
									</div>
								</div>

								<Separator />

								<div className='space-y-4'>
									<h4 className='text-sm font-medium'>Security Settings</h4>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='space-y-0.5'>
												<Label>Require HTTPS for DID Web</Label>
												<p className='text-sm text-muted-foreground'>Force HTTPS for did:web resolution</p>
											</div>
											<Switch defaultChecked />
										</div>
										<div className='flex items-center justify-between'>
											<div className='space-y-0.5'>
												<Label>Enable DID Document Validation</Label>
												<p className='text-sm text-muted-foreground'>Validate DID documents against schema</p>
											</div>
											<Switch defaultChecked />
										</div>
										<div className='flex items-center justify-between'>
											<div className='space-y-0.5'>
												<Label>Allow Cross-Origin Requests</Label>
												<p className='text-sm text-muted-foreground'>Enable CORS for DID resolution</p>
											</div>
											<Switch />
										</div>
									</div>
								</div>

								<Separator />

								<div className='space-y-4'>
									<h4 className='text-sm font-medium'>Logging & Monitoring</h4>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='space-y-0.5'>
												<Label>Enable Audit Logging</Label>
												<p className='text-sm text-muted-foreground'>Log all DID operations</p>
											</div>
											<Switch defaultChecked />
										</div>
										<div className='flex items-center justify-between'>
											<div className='space-y-0.5'>
												<Label>Performance Monitoring</Label>
												<p className='text-sm text-muted-foreground'>Track resolution performance</p>
											</div>
											<Switch defaultChecked />
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Method Configuration Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>Configure {selectedMethod?.name}</DialogTitle>
						<DialogDescription>Modify the configuration parameters for this DID method.</DialogDescription>
					</DialogHeader>
					{selectedMethod && (
						<div className='space-y-4'>
							<div className='grid gap-4'>
								{Object.entries(selectedMethod.config).map(([key, value]) => (
									<div key={key} className='space-y-2'>
										<Label htmlFor={`config-${key}`} className='capitalize'>
											{key.replace(/([A-Z])/g, ' $1').trim()}
										</Label>
										{typeof value === 'boolean' ? (
											<Switch
												id={`config-${key}`}
												checked={value}
												onCheckedChange={(checked) => {
													setSelectedMethod((prev) =>
														prev
															? {
																	...prev,
																	config: {...prev.config, [key]: checked},
															  }
															: null,
													)
												}}
											/>
										) : typeof value === 'number' ? (
											<Input
												id={`config-${key}`}
												type='number'
												value={value}
												onChange={(e) => {
													setSelectedMethod((prev) =>
														prev
															? {
																	...prev,
																	config: {...prev.config, [key]: parseInt(e.target.value)},
															  }
															: null,
													)
												}}
											/>
										) : (
											<Input
												id={`config-${key}`}
												value={value}
												onChange={(e) => {
													setSelectedMethod((prev) =>
														prev
															? {
																	...prev,
																	config: {...prev.config, [key]: e.target.value},
															  }
															: null,
													)
												}}
											/>
										)}
									</div>
								))}
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedMethod) {
									setMethods((prev) => prev.map((method) => (method.id === selectedMethod.id ? selectedMethod : method)))
								}
								setIsEditDialogOpen(false)
							}}>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
