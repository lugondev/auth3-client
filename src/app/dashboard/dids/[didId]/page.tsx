'use client'

import React, {useState, useEffect} from 'react'
import {PageHeader} from '@/components/layout/PageHeader'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Key, Globe, Coins, Network, Users, Copy, Check, Power, Trash2, Shield, Link as LinkIcon, History, Download} from 'lucide-react'
import {useParams, useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {getDID, resolveDID, deactivateDID, revokeDID} from '@/services/didService'
import {ResolveDIDResult, DIDActivity, DIDData} from '@/types/did'
import {formatDate} from '@/lib/utils'
import {DIDSkeleton} from '@/components/did'

/**
 * DID Details Page - Display complete DID document and metadata
 * Shows verification methods, service endpoints, and DID history
 */
export default function DIDDetailsPage() {
	const params = useParams()
	const router = useRouter()
	const didId = decodeURIComponent(params.didId as string)

	const [didData, setDidData] = useState<DIDData | null>(null)
	const [resolutionResult, setResolutionResult] = useState<ResolveDIDResult | null>(null)
	const [history, setHistory] = useState<DIDActivity[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [copiedField, setCopiedField] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState('document')

	// Fetch DID document and metadata
	useEffect(() => {
		const fetchDIDData = async () => {
			try {
				setLoading(true)
				setError(null)

				// Fetch DID data and resolution result
				const [didResponse, resolutionResponse] = await Promise.all([getDID(didId), resolveDID(didId)])

				console.log('DID Response:', didResponse)
				console.log('Resolution Response:', resolutionResponse)

				setDidData(didResponse.did)
				setResolutionResult(resolutionResponse)

				// Convert DID data to history format for display
				const historyData: DIDActivity[] = [
					{
						did_string: didResponse.did.did,
						action: 'created',
						timestamp: didResponse.did.created_at,
						user_id: didResponse.did.user_id,
					},
				]

				if (didResponse.did.updated_at !== didResponse.did.created_at) {
					historyData.push({
						did_string: didResponse.did.did,
						action: 'updated',
						timestamp: didResponse.did.updated_at,
						user_id: didResponse.did.user_id,
					})
				}
				console.log('History Data:', historyData)

				setHistory(historyData)
			} catch (err) {
				console.error('Error fetching DID data:', err)
				setError('Failed to load DID data')
				toast.error('Failed to load DID data')
			} finally {
				setLoading(false)
			}
		}

		fetchDIDData()
	}, [didId])

	/**
	 * Get method icon based on DID method
	 */
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

	/**
	 * Get status badge variant based on DID status
	 */
	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'active':
				return (
					<Badge variant='default' className='bg-green-100 text-green-800'>
						Active
					</Badge>
				)
			case 'deactivated':
				return <Badge variant='secondary'>Deactivated</Badge>
			case 'revoked':
				return <Badge variant='destructive'>Revoked</Badge>
			default:
				return <Badge variant='outline'>Unknown</Badge>
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
			console.error('Failed to copy to clipboard:', error)
			toast.error('Failed to copy to clipboard')
		}
	}

	/**
	 * Handle DID deactivation
	 */
	const handleDeactivate = async () => {
		try {
			if (!didData) return

			await deactivateDID({
				id: didData.id,
				did: didData.did,
				user_id: didData.user_id,
				reason: 'User requested deactivation',
			})

			toast.success('DID deactivated successfully')

			// Refresh the data
			const [updatedDidResponse, updatedResolutionResponse] = await Promise.all([getDID(didId), resolveDID(didId)])

			setDidData(updatedDidResponse.did)
			setResolutionResult(updatedResolutionResponse)
		} catch (err) {
			console.error('Error deactivating DID:', err)
			toast.error('Failed to deactivate DID')
		}
	}

	/**
	 * Handle DID revocation
	 */
	const handleRevoke = async () => {
		try {
			if (!didData) return

			await revokeDID({
				id: didData.id,
				did: didData.did,
				user_id: didData.user_id,
				reason: 'User requested revocation',
			})

			toast.success('DID revoked successfully')

			// Refresh the data
			const [updatedDidResponse, updatedResolutionResponse] = await Promise.all([getDID(didId), resolveDID(didId)])

			setDidData(updatedDidResponse.did)
			setResolutionResult(updatedResolutionResponse)
		} catch (err) {
			console.error('Error revoking DID:', err)
			toast.error('Failed to revoke DID')
		}
	}

	/**
	 * Download DID document as JSON
	 */
	const downloadDocument = () => {
		if (!resolutionResult?.document) return

		const dataStr = JSON.stringify(resolutionResult.document, null, 2)
		const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

		const exportFileDefaultName = `did-document-${didId.replace(/[^a-zA-Z0-9]/g, '-')}.json`

		const linkElement = document.createElement('a')
		linkElement.setAttribute('href', dataUri)
		linkElement.setAttribute('download', exportFileDefaultName)
		linkElement.click()
	}

	if (loading) {
		return (
			<div className='space-y-6'>
				<DIDSkeleton variant='details' />
			</div>
		)
	}

	if (error || !didData || !resolutionResult) {
		return (
			<div className='text-center py-12'>
				<p className='text-red-600 mb-4'>{error || 'DID not found'}</p>
				<Button onClick={() => router.push('/dashboard/dids')}>Back to DIDs</Button>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='DID Details'
				description={didId}
				backButton={{href: '/dashboard/dids', text: 'Back to DIDs'}}
				actions={
					<div className='flex gap-2'>
						<Button variant='outline' onClick={downloadDocument}>
							<Download className='h-4 w-4 mr-2' />
							Download
						</Button>
						{didData.status === 'active' && (
							<div>
								<Button variant='outline' onClick={handleDeactivate} className='text-orange-600 hover:text-orange-700'>
									<Power className='h-4 w-4 mr-2' />
									Deactivate
								</Button>
								<Button variant='outline' onClick={handleRevoke} className='text-red-600 hover:text-red-700'>
									<Trash2 className='h-4 w-4 mr-2' />
									Revoke
								</Button>
							</div>
						)}
					</div>
				}
			/>

			{/* Status and Metadata Cards */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Method</CardTitle>
						{getMethodIcon(didData.method)}
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold capitalize'>{didData.method}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Status</CardTitle>
						<Shield className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{getStatusBadge(didData.status)}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>Created</CardTitle>
						<History className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{formatDate(didData.created_at)}</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-4'>
					<TabsTrigger value='document'>Document</TabsTrigger>
					<TabsTrigger value='verification'>Verification Methods</TabsTrigger>
					<TabsTrigger value='services'>Services</TabsTrigger>
					<TabsTrigger value='history'>History</TabsTrigger>
				</TabsList>

				{/* DID Document Tab */}
				<TabsContent value='document' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>DID Document</CardTitle>
							<CardDescription>Complete DID document in JSON format</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex gap-2'>
								<Button variant='outline' onClick={() => copyToClipboard(JSON.stringify(resolutionResult.document, null, 2), 'document')}>
									{copiedField === 'document' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}
									Copy Document
								</Button>
								<Button variant='outline' onClick={() => copyToClipboard(didId, 'did-id')}>
									{copiedField === 'did-id' ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}
									Copy DID
								</Button>
							</div>
							<Textarea value={JSON.stringify(resolutionResult.document, null, 2)} readOnly className='font-mono text-sm h-96' />
						</CardContent>
					</Card>
				</TabsContent>

				{/* Verification Methods Tab */}
				<TabsContent value='verification' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Verification Methods</CardTitle>
							<CardDescription>Cryptographic keys and verification methods</CardDescription>
						</CardHeader>
						<CardContent>
							{!resolutionResult.document.verificationMethod || resolutionResult.document.verificationMethod.length === 0 ? (
								<p className='text-gray-500 text-center py-8'>No verification methods found</p>
							) : (
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									{resolutionResult.document.verificationMethod.map((method, index) => (
										<div key={index} className='space-y-2'>
											<Label className='text-sm font-medium'>{method.type}</Label>
											<div className='space-y-1'>
												<div>
													<Label className='text-xs text-muted-foreground'>ID</Label>
													<div className='text-sm font-mono bg-muted p-2 rounded-md break-all'>{method.id}</div>
												</div>
												<div>
													<Label className='text-xs text-muted-foreground'>Controller</Label>
													<div className='text-sm font-mono bg-muted p-2 rounded-md break-all'>{method.controller}</div>
												</div>
												<div>
													<Label className='text-xs text-muted-foreground'>Public Key</Label>
													<div className='flex items-center gap-2'>
														<div className='text-sm font-mono bg-muted p-2 rounded-md break-all flex-1'>{method.publicKeyMultibase || method.blockchainAccountId || 'N/A'}</div>
														<Button variant='outline' size='sm' onClick={() => copyToClipboard(method.publicKeyMultibase || method.blockchainAccountId || '', `key-${index}`)}>
															{copiedField === `key-${index}` ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
														</Button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Key Usage */}
					<Card>
						<CardHeader>
							<CardTitle>Key Usage</CardTitle>
							<CardDescription>How verification methods are used</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label className='text-sm font-medium'>Authentication</Label>
									<div className='space-y-1'>
										{resolutionResult.document.authentication?.map((auth, index) => (
											<div key={index} className='text-sm font-mono bg-muted p-2 rounded-md break-all'>
												{typeof auth === 'string' ? auth : auth.id}
											</div>
										)) || <div className='text-sm text-muted-foreground'>No authentication methods</div>}
									</div>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm font-medium'>Assertion Method</Label>
									<div className='space-y-1'>
										{resolutionResult.document.assertionMethod?.map((assertion, index) => (
											<div key={index} className='text-sm font-mono bg-muted p-2 rounded-md break-all'>
												{typeof assertion === 'string' ? assertion : assertion.id}
											</div>
										)) || <div className='text-sm text-muted-foreground'>No assertion methods</div>}
									</div>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm font-medium'>Key Agreement</Label>
									<div className='space-y-1'>
										{resolutionResult.document.keyAgreement?.map((agreement, index) => (
											<div key={index} className='text-sm font-mono bg-muted p-2 rounded-md break-all'>
												{typeof agreement === 'string' ? agreement : agreement.id}
											</div>
										)) || <div className='text-sm text-muted-foreground'>No key agreement methods</div>}
									</div>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm font-medium'>Capability Invocation</Label>
									<div className='space-y-1'>
										{resolutionResult.document.capabilityInvocation?.map((capability, index) => (
											<div key={index} className='text-sm font-mono bg-muted p-2 rounded-md break-all'>
												{typeof capability === 'string' ? capability : capability.id}
											</div>
										)) || <div className='text-sm text-muted-foreground'>No capability invocation methods</div>}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Services Tab */}
				<TabsContent value='services' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Service Endpoints</CardTitle>
							<CardDescription>Services and endpoints associated with this DID</CardDescription>
						</CardHeader>
						<CardContent>
							{!resolutionResult.document?.service || resolutionResult.document.service.length === 0 ? (
								<p className='text-gray-500 text-center py-8'>No service endpoints found</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Service Endpoint</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{resolutionResult.document?.service?.map((service, index) => (
											<TableRow key={index}>
												<TableCell className='font-mono text-sm'>
													<div className='max-w-xs truncate' title={service.id}>
														{service.id}
													</div>
												</TableCell>
												<TableCell>
													<Badge variant='outline'>{service.type}</Badge>
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-2'>
														<LinkIcon className='h-4 w-4' />
														<span className='font-mono text-sm truncate max-w-xs'>{typeof service.serviceEndpoint === 'string' ? service.serviceEndpoint : Array.isArray(service.serviceEndpoint) ? service.serviceEndpoint[0] : JSON.stringify(service.serviceEndpoint)}</span>
													</div>
												</TableCell>
												<TableCell>
													<div className='flex gap-2'>
														<Button
															variant='outline'
															size='sm'
															onClick={() => {
																const endpoint = typeof service.serviceEndpoint === 'string' ? service.serviceEndpoint : Array.isArray(service.serviceEndpoint) ? service.serviceEndpoint.join(', ') : JSON.stringify(service.serviceEndpoint)
																copyToClipboard(endpoint, `service-${index}`)
															}}>
															{copiedField === `service-${index}` ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
														</Button>
														{typeof service.serviceEndpoint === 'string' && service.serviceEndpoint.startsWith('http') && (
															<Button variant='outline' size='sm' onClick={() => window.open(service.serviceEndpoint as string, '_blank')}>
																<LinkIcon className='h-4 w-4' />
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* History Tab */}
				<TabsContent value='history' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>DID History</CardTitle>
							<CardDescription>Timeline of changes to this DID</CardDescription>
						</CardHeader>
						<CardContent>
							{history.length === 0 ? (
								<p className='text-gray-500 text-center py-8'>No history found</p>
							) : (
								<div className='space-y-4'>
									{history.map((event, index) => (
										<div key={index} className='flex items-start gap-4 p-4 border rounded-lg'>
											<div className='flex-shrink-0'>
												<div className={`w-3 h-3 rounded-full ${event.action === 'created' ? 'bg-green-500' : event.action === 'updated' ? 'bg-blue-500' : event.action === 'deactivated' ? 'bg-orange-500' : 'bg-red-500'}`} />
											</div>
											<div className='flex-1'>
												<div className='flex items-center gap-2 mb-1'>
													<span className='font-medium capitalize'>{event.action}</span>
													{event.versionId && (
														<Badge variant='outline' className='text-xs'>
															v{event.versionId}
														</Badge>
													)}
												</div>
												<p className='text-sm text-gray-600 mb-1'>{event.action === 'created' ? 'DID created' : event.action === 'updated' ? 'DID updated' : event.action === 'deactivated' ? 'DID deactivated' : 'DID deleted'}</p>
												<p className='text-xs text-gray-500'>{formatDate(event.timestamp)}</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
