'use client'

import {useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {MessageCircle, Users, Shield, FileText, Zap, Settings, Search, CheckCircle} from 'lucide-react'
import {DIDCommProtocol} from '@/types/didcomm'
import {cn} from '@/lib/utils'

interface ProtocolSelectorProps {
	/** Currently selected protocol */
	selectedProtocol?: DIDCommProtocol
	/** Available protocols */
	protocols?: DIDCommProtocol[]
	/** Callback when protocol is selected */
	onProtocolSelect?: (protocol: DIDCommProtocol) => void
	/** Whether to show protocol details */
	showDetails?: boolean
	/** Whether to allow custom protocol input */
	allowCustom?: boolean
	/** Custom CSS classes */
	className?: string
}

/**
 * ProtocolSelector Component
 * Advanced DIDComm protocol selection with details and custom protocol support
 */
export function ProtocolSelector({selectedProtocol, protocols = [], onProtocolSelect, showDetails = true, allowCustom = false, className}: ProtocolSelectorProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [showCustomForm, setShowCustomForm] = useState(false)
	const [customProtocol, setCustomProtocol] = useState<Partial<DIDCommProtocol>>({
		id: '',
		name: '',
		version: '1.0',
		description: '',
		roles: [],
		message_types: [],
	})

	// Default protocols if none provided
	const defaultProtocols: DIDCommProtocol[] = [
		{
			id: 'https://didcomm.org/basicmessage/2.0',
			name: 'Basic Message',
			version: '2.0',
			description: 'Basic message protocol for simple text exchange',
			roles: ['sender', 'receiver'],
			message_types: ['basic-message'],
		},
		{
			id: 'https://didcomm.org/trust-ping/2.0',
			name: 'Trust Ping',
			version: '2.0',
			description: 'Protocol for testing connection and trust between agents',
			roles: ['sender', 'receiver'],
			message_types: ['trust-ping'],
		},
		{
			id: 'https://didcomm.org/connections/1.0',
			name: 'Connection Protocol',
			version: '1.0',
			description: 'Protocol for establishing and managing DIDComm connections',
			roles: ['inviter', 'invitee'],
			message_types: ['connection-invitation', 'connection-request', 'connection-response'],
		},
		{
			id: 'https://didcomm.org/issue-credential/3.0',
			name: 'Issue Credential',
			version: '3.0',
			description: 'Protocol for issuing Verifiable Credentials',
			roles: ['issuer', 'holder'],
			message_types: ['credential-offer', 'credential-request', 'credential-issue'],
		},
		{
			id: 'https://didcomm.org/present-proof/3.0',
			name: 'Present Proof',
			version: '3.0',
			description: 'Protocol for requesting and presenting proofs',
			roles: ['verifier', 'prover'],
			message_types: ['proof-request', 'proof-presentation'],
		},
		{
			id: 'https://didcomm.org/discover-features/2.0',
			name: 'Discover Features',
			version: '2.0',
			description: 'Protocol for discovering supported features',
			roles: ['requester', 'responder'],
			message_types: ['feature-query', 'feature-disclosure'],
		},
	]

	const availableProtocols = protocols.length > 0 ? protocols : defaultProtocols

	// Filter protocols based on search term
	const filteredProtocols = availableProtocols.filter((protocol) => protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) || (protocol.description && protocol.description.toLowerCase().includes(searchTerm.toLowerCase())) || protocol.id.toLowerCase().includes(searchTerm.toLowerCase()))

	// Get protocol icon
	const getProtocolIcon = (protocol: DIDCommProtocol) => {
		if (protocol.id.includes('basicmessage')) return <MessageCircle className='h-5 w-5' />
		if (protocol.id.includes('trust-ping')) return <Zap className='h-5 w-5' />
		if (protocol.id.includes('connections')) return <Users className='h-5 w-5' />
		if (protocol.id.includes('issue-credential')) return <Shield className='h-5 w-5' />
		if (protocol.id.includes('present-proof')) return <FileText className='h-5 w-5' />
		if (protocol.id.includes('discover-features')) return <Search className='h-5 w-5' />
		return <Settings className='h-5 w-5' />
	}

	// Handle protocol selection
	const handleProtocolSelect = (protocol: DIDCommProtocol) => {
		onProtocolSelect?.(protocol)
	}

	// Handle custom protocol creation
	const handleCustomProtocolCreate = () => {
		if (!customProtocol.id || !customProtocol.name) {
			return
		}

		const newProtocol: DIDCommProtocol = {
			id: customProtocol.id,
			name: customProtocol.name,
			version: customProtocol.version || '1.0',
			description: customProtocol.description || '',
			roles: customProtocol.roles || [],
			message_types: customProtocol.message_types || [],
		}

		handleProtocolSelect(newProtocol)
		setShowCustomForm(false)
		setCustomProtocol({
			id: '',
			name: '',
			version: '1.0',
			description: '',
			roles: [],
			message_types: [],
		})
	}

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Settings className='h-5 w-5' />
					Select DIDComm Protocol
				</CardTitle>
				<CardDescription>Choose the appropriate protocol for the type of DIDComm interaction you want to perform</CardDescription>
			</CardHeader>

			<CardContent className='space-y-4'>
				{/* Search */}
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input placeholder='Search protocols...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
				</div>

				{/* Protocol List */}
				<div className='space-y-3 max-h-96 overflow-y-auto'>
					{filteredProtocols.map((protocol) => (
						<div key={protocol.id} className={cn('p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md', selectedProtocol?.id === protocol.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50')} onClick={() => handleProtocolSelect(protocol)}>
							<div className='flex items-start gap-3'>
								<div className='mt-1'>{getProtocolIcon(protocol)}</div>

								<div className='flex-1 min-w-0'>
									<div className='flex items-center gap-2 mb-1'>
										<h3 className='font-medium text-sm'>{protocol.name}</h3>
										<Badge variant='outline' className='text-xs'>
											v{protocol.version}
										</Badge>
									</div>

									<p className='text-xs text-muted-foreground mb-2'>{protocol.description}</p>

									{showDetails && (
										<div className='space-y-2'>
											{/* Protocol ID */}
											<div className='text-xs'>
												<span className='font-medium'>ID:</span>
												<code className='ml-1 px-1 py-0.5 bg-muted rounded text-xs font-mono'>{protocol.id}</code>
											</div>

											{/* Roles */}
											{protocol.roles.length > 0 && (
												<div className='flex items-center gap-1 flex-wrap'>
													<span className='text-xs font-medium'>Roles:</span>
													{protocol.roles.map((role, index) => (
														<Badge key={index} variant='secondary' className='text-xs'>
															{role}
														</Badge>
													))}
												</div>
											)}

											{/* Message Types */}
											{protocol.message_types.length > 0 && (
												<div className='flex items-center gap-1 flex-wrap'>
													<span className='text-xs font-medium'>Message types:</span>
													{protocol.message_types.map((type, index) => (
														<Badge key={index} variant='outline' className='text-xs'>
															{type}
														</Badge>
													))}
												</div>
											)}
										</div>
									)}
								</div>

								{selectedProtocol?.id === protocol.id && <CheckCircle className='h-5 w-5 text-primary mt-1' />}
							</div>
						</div>
					))}
				</div>

				{/* No results */}
				{filteredProtocols.length === 0 && (
					<div className='text-center py-8 text-muted-foreground'>
						<Search className='h-8 w-8 mx-auto mb-2 opacity-50' />
						<p className='text-sm'>No protocols found</p>
						<p className='text-xs'>Try changing your search terms</p>
					</div>
				)}

				{/* Custom Protocol */}
				{allowCustom && (
					<>
						<Separator />

						<div className='space-y-3'>
							{!showCustomForm ? (
								<Button variant='outline' onClick={() => setShowCustomForm(true)} className='w-full'>
									<Settings className='h-4 w-4 mr-2' />
									Create custom protocol
								</Button>
							) : (
								<Card>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm'>Custom Protocol</CardTitle>
										<CardDescription className='text-xs'>Create a custom DIDComm protocol for special needs</CardDescription>
									</CardHeader>

									<CardContent className='space-y-3'>
										<div className='grid grid-cols-2 gap-3'>
											<div className='space-y-1'>
												<Label htmlFor='custom-name' className='text-xs'>
													Protocol Name
												</Label>
												<Input id='custom-name' value={customProtocol.name} onChange={(e) => setCustomProtocol((prev) => ({...prev, name: e.target.value}))} placeholder='My Custom Protocol' className='text-sm' />
											</div>

											<div className='space-y-1'>
												<Label htmlFor='custom-version' className='text-xs'>
													Version
												</Label>
												<Input id='custom-version' value={customProtocol.version} onChange={(e) => setCustomProtocol((prev) => ({...prev, version: e.target.value}))} placeholder='1.0' className='text-sm' />
											</div>
										</div>

										<div className='space-y-1'>
											<Label htmlFor='custom-id' className='text-xs'>
												Protocol ID
											</Label>
											<Input id='custom-id' value={customProtocol.id} onChange={(e) => setCustomProtocol((prev) => ({...prev, id: e.target.value}))} placeholder='https://example.com/my-protocol/1.0' className='text-sm font-mono' />
										</div>

										<div className='space-y-1'>
											<Label htmlFor='custom-description' className='text-xs'>
												Description
											</Label>
											<Textarea id='custom-description' value={customProtocol.description} onChange={(e) => setCustomProtocol((prev) => ({...prev, description: e.target.value}))} placeholder='Describe your custom protocol...' rows={2} className='text-sm' />
										</div>

										<div className='flex gap-2'>
											<Button onClick={handleCustomProtocolCreate} disabled={!customProtocol.id || !customProtocol.name} className='flex-1' size='sm'>
												Create Protocol
											</Button>

											<Button variant='outline' onClick={() => setShowCustomForm(false)} size='sm'>
												Cancel
											</Button>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</>
				)}

				{/* Selected Protocol Summary */}
				{selectedProtocol && (
					<>
						<Separator />

						<div className='p-3 bg-primary/5 border border-primary/20 rounded-lg'>
							<div className='flex items-center gap-2 mb-2'>
								{getProtocolIcon(selectedProtocol)}
								<span className='font-medium text-sm'>Selected Protocol:</span>
								<Badge variant='outline'>
									{selectedProtocol.name} v{selectedProtocol.version}
								</Badge>
							</div>

							<p className='text-xs text-muted-foreground'>{selectedProtocol.description}</p>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
