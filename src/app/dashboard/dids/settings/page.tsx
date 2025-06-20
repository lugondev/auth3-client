'use client'

import React, {useState, useEffect} from 'react'
import {PageHeader} from '@/components/layout/PageHeader'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Settings, Shield, Network, Save, RotateCcw, Info} from 'lucide-react'
import {toast} from 'sonner'
import {getDIDSettings, updateDIDSettings} from '@/services/didService'
import {DIDSettingsResponse, EthereumNetwork, UpdateDIDSettingsRequest} from '@/types/did'
import {DIDSkeleton} from '@/components/did'

/**
 * DID Settings Page - Configure DID management settings
 * Includes only essential settings that have backend impact
 */
export default function DIDSettingsPage() {
	const [settings, setSettings] = useState<DIDSettingsResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)
	const [activeTab, setActiveTab] = useState('general')
	const [newResolver, setNewResolver] = useState('')

	// Load settings on component mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				setLoading(true)
				const didSettings = await getDIDSettings()
				setSettings(didSettings)
				console.log('DID settings loaded successfully')
			} catch (error) {
				console.error('Failed to load DID settings:', error)
				toast.error('Failed to load DID settings')
			} finally {
				setLoading(false)
			}
		}

		loadSettings()
	}, [])

	/**
	 * Save all settings
	 */
	const handleSaveSettings = async () => {
		if (!settings) return

		try {
			setSaving(true)

			// Create update request with current settings
			const updateRequest: UpdateDIDSettingsRequest = {
				defaultMethod: settings.defaultMethod,
				enableNotifications: settings.enableNotifications,
				notificationEmail: settings.notificationEmail,
				maxDIDsPerUser: settings.maxDIDsPerUser,
				requireMFA: settings.requireMFA,
				allowWeakKeys: settings.allowWeakKeys,
				requireApprovalForRevocation: settings.requireApprovalForRevocation,
				ethereumNetwork: settings.ethereumNetwork,
				ethereumRpcUrl: settings.ethereumRpcUrl,
				ionNodeUrl: settings.ionNodeUrl,
				ipfsGateway: settings.ipfsGateway,
				customResolvers: settings.customResolvers,
				enableBatchOperations: settings.enableBatchOperations,
				maxBatchSize: settings.maxBatchSize,
			}

			const updatedSettings = await updateDIDSettings(updateRequest)
			setSettings(updatedSettings)
			setHasChanges(false)
			toast.success('DID settings saved successfully')
		} catch (error) {
			console.error('Failed to save DID settings:', error)
			toast.error('Failed to save DID settings')
		} finally {
			setSaving(false)
		}
	}

	/**
	 * Reset settings to defaults
	 */
	const handleResetSettings = async () => {
		try {
			// Reset to default values
			const defaultSettings: DIDSettingsResponse = {
				defaultMethod: 'key',
				enableNotifications: true,
				notificationEmail: '',
				maxDIDsPerUser: 100,
				requireMFA: false,
				allowWeakKeys: false,
				requireApprovalForRevocation: true,
				ethereumNetwork: 'mainnet',
				ethereumRpcUrl: '',
				ionNodeUrl: 'https://ion.msidentity.com',
				ipfsGateway: 'https://ipfs.io',
				customResolvers: [],
				enableBatchOperations: true,
				maxBatchSize: 10,
				updatedAt: new Date().toISOString(),
			}

			setSettings(defaultSettings)
			setHasChanges(true)
			toast.success('Settings reset to defaults')
		} catch (error) {
			console.error('Failed to reset settings:', error)
			toast.error('Failed to reset settings')
		}
	}

	/**
	 * Add custom resolver
	 */
	const handleAddResolver = () => {
		if (!settings || !newResolver.trim()) return
		if (settings.customResolvers.includes(newResolver.trim())) return

		setSettings({
			...settings,
			customResolvers: [...settings.customResolvers, newResolver.trim()],
		})
		setNewResolver('')
		setHasChanges(true)
	}

	/**
	 * Remove custom resolver
	 */
	const handleRemoveResolver = (resolver: string) => {
		if (!settings) return

		setSettings({
			...settings,
			customResolvers: settings.customResolvers.filter((r) => r !== resolver),
		})
		setHasChanges(true)
	}

	/**
	 * Update settings
	 */
	const updateSettings = (updates: Partial<DIDSettingsResponse>) => {
		if (!settings) return

		setSettings({...settings, ...updates})
		setHasChanges(true)
	}

	if (loading) {
		return (
			<div className='container mx-auto py-6'>
				<DIDSkeleton variant='card' />
			</div>
		)
	}

	if (!settings) {
		return (
			<div className='container mx-auto py-6'>
				<Alert>
					<Info className='h-4 w-4' />
					<AlertDescription>Failed to load DID settings.</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='DID Settings'
				description='Configure essential DID management settings'
				backButton={{href: '/dashboard/dids', text: 'Back to DIDs'}}
				actions={
					<div className='flex gap-2'>
						<Button variant='outline' onClick={handleResetSettings} disabled={saving || loading}>
							<RotateCcw className='h-4 w-4 mr-2' />
							Reset
						</Button>
						<Button onClick={handleSaveSettings} disabled={!hasChanges || saving || loading}>
							<Save className='h-4 w-4 mr-2' />
							{saving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				}
			/>

			{hasChanges && (
				<Alert>
					<Info className='h-4 w-4' />
					<AlertDescription>You have unsaved changes. Don't forget to save your settings.</AlertDescription>
				</Alert>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='general'>General</TabsTrigger>
					<TabsTrigger value='security'>Security</TabsTrigger>
					<TabsTrigger value='network'>Network & Advanced</TabsTrigger>
				</TabsList>

				{/* General Settings Tab */}
				<TabsContent value='general' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Settings className='h-5 w-5' />
								General Settings
							</CardTitle>
							<CardDescription>Basic DID management configuration</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-2'>
									<Label htmlFor='defaultMethod'>Default DID Method</Label>
									<Select value={settings.defaultMethod} onValueChange={(value: 'key' | 'web' | 'ethr' | 'ion' | 'peer') => updateSettings({defaultMethod: value})}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='key'>did:key</SelectItem>
											<SelectItem value='web'>did:web</SelectItem>
											<SelectItem value='ethr'>did:ethr</SelectItem>
											<SelectItem value='ion'>did:ion</SelectItem>
											<SelectItem value='peer'>did:peer</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='maxDIDsPerUser'>Max DIDs per User</Label>
									<Input id='maxDIDsPerUser' type='number' value={settings.maxDIDsPerUser} onChange={(e) => updateSettings({maxDIDsPerUser: parseInt(e.target.value) || 0})} min='1' max='1000' />
								</div>
							</div>

							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Notifications</Label>
										<p className='text-sm text-muted-foreground'>Receive notifications for DID events</p>
									</div>
									<Switch checked={settings.enableNotifications} onCheckedChange={(checked) => updateSettings({enableNotifications: checked})} />
								</div>

								{settings.enableNotifications && (
									<div className='space-y-2'>
										<Label htmlFor='notificationEmail'>Notification Email</Label>
										<Input id='notificationEmail' type='email' value={settings.notificationEmail} onChange={(e) => updateSettings({notificationEmail: e.target.value})} placeholder='admin@example.com' />
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Security Settings Tab */}
				<TabsContent value='security' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Shield className='h-5 w-5' />
								Security Settings
							</CardTitle>
							<CardDescription>Configure security and authentication settings</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Require Multi-Factor Authentication</Label>
										<p className='text-sm text-muted-foreground'>Require MFA for sensitive DID operations</p>
									</div>
									<Switch checked={settings.requireMFA} onCheckedChange={(checked) => updateSettings({requireMFA: checked})} />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Allow Weak Keys</Label>
										<p className='text-sm text-muted-foreground'>Allow creation of keys with weak cryptographic strength</p>
									</div>
									<Switch checked={settings.allowWeakKeys} onCheckedChange={(checked) => updateSettings({allowWeakKeys: checked})} />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Require Approval for Revocation</Label>
										<p className='text-sm text-muted-foreground'>Require approval before revoking DIDs</p>
									</div>
									<Switch checked={settings.requireApprovalForRevocation} onCheckedChange={(checked) => updateSettings({requireApprovalForRevocation: checked})} />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Network & Advanced Settings Tab */}
				<TabsContent value='network' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Network className='h-5 w-5' />
								Network & Advanced Settings
							</CardTitle>
							<CardDescription>Configure network connections and advanced features</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-2'>
									<Label htmlFor='ethereumNetwork'>Ethereum Network</Label>
									<Select value={settings.ethereumNetwork} onValueChange={(value) => updateSettings({ethereumNetwork: value as EthereumNetwork})}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='mainnet'>Mainnet</SelectItem>
											<SelectItem value='goerli'>Goerli</SelectItem>
											<SelectItem value='sepolia'>Sepolia</SelectItem>
											<SelectItem value='polygon'>Polygon</SelectItem>
											<SelectItem value='local'>Local</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='maxBatchSize'>Max Batch Size</Label>
									<Input id='maxBatchSize' type='number' value={settings.maxBatchSize} onChange={(e) => updateSettings({maxBatchSize: parseInt(e.target.value) || 1})} min='1' max='100' />
								</div>
							</div>

							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='ethereumRpcUrl'>Ethereum RPC URL</Label>
									<Input id='ethereumRpcUrl' value={settings.ethereumRpcUrl} onChange={(e) => updateSettings({ethereumRpcUrl: e.target.value})} placeholder='https://mainnet.infura.io/v3/YOUR-PROJECT-ID' />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ionNodeUrl'>ION Node URL</Label>
									<Input id='ionNodeUrl' value={settings.ionNodeUrl} onChange={(e) => updateSettings({ionNodeUrl: e.target.value})} placeholder='https://ion.msidentity.com' />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ipfsGateway'>IPFS Gateway</Label>
									<Input id='ipfsGateway' value={settings.ipfsGateway} onChange={(e) => updateSettings({ipfsGateway: e.target.value})} placeholder='https://ipfs.io' />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Batch Operations</Label>
										<p className='text-sm text-muted-foreground'>Allow batch processing of DID operations</p>
									</div>
									<Switch checked={settings.enableBatchOperations} onCheckedChange={(checked) => updateSettings({enableBatchOperations: checked})} />
								</div>
							</div>

							{/* Custom Resolvers */}
							<div className='space-y-4'>
								<div>
									<Label>Custom DID Resolvers</Label>
									<p className='text-sm text-muted-foreground mb-2'>Add custom DID resolver endpoints</p>
									<div className='flex gap-2'>
										<Input value={newResolver} onChange={(e) => setNewResolver(e.target.value)} placeholder='https://resolver.example.com' onKeyPress={(e) => e.key === 'Enter' && handleAddResolver()} />
										<Button onClick={handleAddResolver} disabled={!newResolver.trim()}>
											Add
										</Button>
									</div>
								</div>

								{settings.customResolvers.length > 0 && (
									<div className='space-y-2'>
										<Label>Current Resolvers</Label>
										<div className='space-y-2'>
											{settings.customResolvers.map((resolver, index) => (
												<div key={index} className='flex items-center justify-between p-2 border rounded'>
													<span className='font-mono text-sm'>{resolver}</span>
													<Button variant='outline' size='sm' onClick={() => handleRemoveResolver(resolver)}>
														Remove
													</Button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
