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
import {Settings, Shield, Database, Network, Save, RotateCcw, AlertTriangle, Info} from 'lucide-react'
import {toast} from 'sonner'
import {getCurrentUser, updateCurrentUserProfile} from '@/services/userService'
import {UserProfile} from '@/types/user'

// Types for DID settings
interface DIDGeneralSettings {
	defaultMethod: 'key' | 'web' | 'ethr' | 'ion' | 'peer'
	autoBackup: boolean
	backupInterval: number // hours
	enableNotifications: boolean
	notificationEmail: string
	maxDIDsPerUser: number
	enableDIDHistory: boolean
	historyRetentionDays: number
}

interface DIDSecuritySettings {
	requireMFA: boolean
	keyRotationEnabled: boolean
	keyRotationInterval: number // days
	allowWeakKeys: boolean
	encryptPrivateKeys: boolean
	requireApprovalForRevocation: boolean
	sessionTimeout: number // minutes
	enableAuditLog: boolean
}

interface DIDNetworkSettings {
	ethereumNetwork: 'mainnet' | 'goerli' | 'sepolia' | 'polygon' | 'local'
	ethereumRpcUrl: string
	ionNodeUrl: string
	ipfsGateway: string
	enableCaching: boolean
	cacheTimeout: number // minutes
	retryAttempts: number
	requestTimeout: number // seconds
}

interface DIDAdvancedSettings {
	enableExperimentalFeatures: boolean
	debugMode: boolean
	logLevel: 'error' | 'warn' | 'info' | 'debug'
	enableMetrics: boolean
	metricsEndpoint: string
	customResolvers: string[]
	enableBatchOperations: boolean
	maxBatchSize: number
}

/**
 * DID Settings Page - Configure DID management settings
 * Includes general, security, network, and advanced settings
 */
export default function DIDSettingsPage() {
	const [generalSettings, setGeneralSettings] = useState<DIDGeneralSettings>({
		defaultMethod: 'key',
		autoBackup: true,
		backupInterval: 24,
		enableNotifications: true,
		notificationEmail: '',
		maxDIDsPerUser: 100,
		enableDIDHistory: true,
		historyRetentionDays: 365,
	})

	const [securitySettings, setSecuritySettings] = useState<DIDSecuritySettings>({
		requireMFA: false,
		keyRotationEnabled: false,
		keyRotationInterval: 90,
		allowWeakKeys: false,
		encryptPrivateKeys: true,
		requireApprovalForRevocation: true,
		sessionTimeout: 60,
		enableAuditLog: true,
	})

	const [networkSettings, setNetworkSettings] = useState<DIDNetworkSettings>({
		ethereumNetwork: 'mainnet',
		ethereumRpcUrl: '',
		ionNodeUrl: 'https://ion.msidentity.com',
		ipfsGateway: 'https://ipfs.io',
		enableCaching: true,
		cacheTimeout: 30,
		retryAttempts: 3,
		requestTimeout: 30,
	})

	const [advancedSettings, setAdvancedSettings] = useState<DIDAdvancedSettings>({
		enableExperimentalFeatures: false,
		debugMode: false,
		logLevel: 'info',
		enableMetrics: false,
		metricsEndpoint: '',
		customResolvers: [],
		enableBatchOperations: true,
		maxBatchSize: 10,
	})

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
	const [activeTab, setActiveTab] = useState('general')
	const [newResolver, setNewResolver] = useState('')

	// Load settings on component mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				setLoading(true)

				// Load user profile to get current settings
				const user = await getCurrentUser()
				// Convert UserOutput to UserProfile format for compatibility
				const userProfileData: UserProfile = {
					id: user.profile?.id || user.id,
					user_id: user.id,
					bio: user.profile?.bio,
					date_of_birth: user.profile?.date_of_birth,
					address: user.profile?.address,
					interests: user.profile?.interests,
					preferences: user.profile?.preferences,
					metadata: user.metadata, // Include metadata from UserOutput
					created_at: user.profile?.created_at || user.created_at,
					updated_at: user.profile?.updated_at || user.updated_at,
				}
				setUserProfile(userProfileData)

				// Load DID settings from user metadata if available
				if (user.metadata) {
					try {
						const metadata = typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata
						const didSettings = metadata.didSettings

						if (didSettings) {
							if (didSettings.general) setGeneralSettings((prev) => ({...prev, ...didSettings.general}))
							if (didSettings.security) setSecuritySettings((prev) => ({...prev, ...didSettings.security}))
							if (didSettings.network) setNetworkSettings((prev) => ({...prev, ...didSettings.network}))
							if (didSettings.advanced) setAdvancedSettings((prev) => ({...prev, ...didSettings.advanced}))
						}
					} catch (parseError) {
						console.warn('Failed to parse user metadata:', parseError)
					}
				}

				console.log('Settings loaded successfully')
			} catch (error) {
				console.error('Failed to load settings:', error)
				toast.error('Failed to load settings')
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
		try {
			setSaving(true)

			// Prepare DID settings data
			const didSettings = {
				general: generalSettings,
				security: securitySettings,
				network: networkSettings,
				advanced: advancedSettings,
			}

			// Get current metadata and merge with DID settings
			let currentMetadata = {}
			if (userProfile?.metadata) {
				try {
					currentMetadata = typeof userProfile.metadata === 'string' ? JSON.parse(userProfile.metadata) : userProfile.metadata
				} catch (parseError) {
					console.warn('Failed to parse existing metadata:', parseError)
				}
			}

			// Update user profile with DID settings in metadata
			const updatedMetadata = {
				...currentMetadata,
				didSettings,
			}

			await updateCurrentUserProfile({
				metadata: updatedMetadata,
			})

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
			setGeneralSettings({
				defaultMethod: 'key',
				autoBackup: true,
				backupInterval: 24,
				enableNotifications: true,
				notificationEmail: '',
				maxDIDsPerUser: 100,
				enableDIDHistory: true,
				historyRetentionDays: 365,
			})

			setSecuritySettings({
				requireMFA: false,
				keyRotationEnabled: false,
				keyRotationInterval: 90,
				allowWeakKeys: false,
				encryptPrivateKeys: true,
				requireApprovalForRevocation: true,
				sessionTimeout: 60,
				enableAuditLog: true,
			})

			setNetworkSettings({
				ethereumNetwork: 'mainnet',
				ethereumRpcUrl: '',
				ionNodeUrl: 'https://ion.msidentity.com',
				ipfsGateway: 'https://ipfs.io',
				enableCaching: true,
				cacheTimeout: 30,
				retryAttempts: 3,
				requestTimeout: 30,
			})

			setAdvancedSettings({
				enableExperimentalFeatures: false,
				debugMode: false,
				logLevel: 'info',
				enableMetrics: false,
				metricsEndpoint: '',
				customResolvers: [],
				enableBatchOperations: true,
				maxBatchSize: 10,
			})

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
		if (newResolver.trim() && !advancedSettings.customResolvers.includes(newResolver.trim())) {
			setAdvancedSettings((prev) => ({
				...prev,
				customResolvers: [...prev.customResolvers, newResolver.trim()],
			}))
			setNewResolver('')
			setHasChanges(true)
		}
	}

	/**
	 * Remove custom resolver
	 */
	const handleRemoveResolver = (resolver: string) => {
		setAdvancedSettings((prev) => ({
			...prev,
			customResolvers: prev.customResolvers.filter((r) => r !== resolver),
		}))
		setHasChanges(true)
	}

	/**
	 * Update general settings
	 */
	const updateGeneralSettings = (updates: Partial<DIDGeneralSettings>) => {
		setGeneralSettings((prev) => ({...prev, ...updates}))
		setHasChanges(true)
	}

	/**
	 * Update security settings
	 */
	const updateSecuritySettings = (updates: Partial<DIDSecuritySettings>) => {
		setSecuritySettings((prev) => ({...prev, ...updates}))
		setHasChanges(true)
	}

	/**
	 * Update network settings
	 */
	const updateNetworkSettings = (updates: Partial<DIDNetworkSettings>) => {
		setNetworkSettings((prev) => ({...prev, ...updates}))
		setHasChanges(true)
	}

	/**
	 * Update advanced settings
	 */
	const updateAdvancedSettings = (updates: Partial<DIDAdvancedSettings>) => {
		setAdvancedSettings((prev) => ({...prev, ...updates}))
		setHasChanges(true)
	}

	if (loading) {
		return (
			<div className='container mx-auto py-6'>
				<div className='flex items-center justify-center min-h-[400px]'>
					<div className='text-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
						<p className='text-muted-foreground'>Loading DID settings...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='DID Settings'
				description='Configure DID management settings and preferences'
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
				<TabsList className='grid w-full grid-cols-4'>
					<TabsTrigger value='general'>General</TabsTrigger>
					<TabsTrigger value='security'>Security</TabsTrigger>
					<TabsTrigger value='network'>Network</TabsTrigger>
					<TabsTrigger value='advanced'>Advanced</TabsTrigger>
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
									<Select value={generalSettings.defaultMethod} onValueChange={(value: 'key' | 'web' | 'ethr' | 'ion' | 'peer') => updateGeneralSettings({defaultMethod: value})}>
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
									<Input id='maxDIDsPerUser' type='number' value={generalSettings.maxDIDsPerUser} onChange={(e) => updateGeneralSettings({maxDIDsPerUser: parseInt(e.target.value) || 0})} min='1' max='1000' />
								</div>
							</div>

							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Auto Backup</Label>
										<p className='text-sm text-muted-foreground'>Automatically backup DID documents</p>
									</div>
									<Switch checked={generalSettings.autoBackup} onCheckedChange={(checked) => updateGeneralSettings({autoBackup: checked})} />
								</div>

								{generalSettings.autoBackup && (
									<div className='space-y-2'>
										<Label htmlFor='backupInterval'>Backup Interval (hours)</Label>
										<Input id='backupInterval' type='number' value={generalSettings.backupInterval} onChange={(e) => updateGeneralSettings({backupInterval: parseInt(e.target.value) || 1})} min='1' max='168' />
									</div>
								)}

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Notifications</Label>
										<p className='text-sm text-muted-foreground'>Receive email notifications for DID events</p>
									</div>
									<Switch checked={generalSettings.enableNotifications} onCheckedChange={(checked) => updateGeneralSettings({enableNotifications: checked})} />
								</div>

								{generalSettings.enableNotifications && (
									<div className='space-y-2'>
										<Label htmlFor='notificationEmail'>Notification Email</Label>
										<Input id='notificationEmail' type='email' value={generalSettings.notificationEmail} onChange={(e) => updateGeneralSettings({notificationEmail: e.target.value})} placeholder='admin@example.com' />
									</div>
								)}

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable DID History</Label>
										<p className='text-sm text-muted-foreground'>Track changes to DID documents</p>
									</div>
									<Switch checked={generalSettings.enableDIDHistory} onCheckedChange={(checked) => updateGeneralSettings({enableDIDHistory: checked})} />
								</div>

								{generalSettings.enableDIDHistory && (
									<div className='space-y-2'>
										<Label htmlFor='historyRetentionDays'>History Retention (days)</Label>
										<Input id='historyRetentionDays' type='number' value={generalSettings.historyRetentionDays} onChange={(e) => updateGeneralSettings({historyRetentionDays: parseInt(e.target.value) || 1})} min='1' max='3650' />
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
									<Switch checked={securitySettings.requireMFA} onCheckedChange={(checked) => updateSecuritySettings({requireMFA: checked})} />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Key Rotation</Label>
										<p className='text-sm text-muted-foreground'>Automatically rotate cryptographic keys</p>
									</div>
									<Switch checked={securitySettings.keyRotationEnabled} onCheckedChange={(checked) => updateSecuritySettings({keyRotationEnabled: checked})} />
								</div>

								{securitySettings.keyRotationEnabled && (
									<div className='space-y-2'>
										<Label htmlFor='keyRotationInterval'>Key Rotation Interval (days)</Label>
										<Input id='keyRotationInterval' type='number' value={securitySettings.keyRotationInterval} onChange={(e) => updateSecuritySettings({keyRotationInterval: parseInt(e.target.value) || 1})} min='1' max='365' />
									</div>
								)}

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Allow Weak Keys</Label>
										<p className='text-sm text-muted-foreground'>Allow creation of keys with weak cryptographic strength</p>
									</div>
									<Switch checked={securitySettings.allowWeakKeys} onCheckedChange={(checked) => updateSecuritySettings({allowWeakKeys: checked})} />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Encrypt Private Keys</Label>
										<p className='text-sm text-muted-foreground'>Encrypt private keys at rest</p>
									</div>
									<Switch checked={securitySettings.encryptPrivateKeys} onCheckedChange={(checked) => updateSecuritySettings({encryptPrivateKeys: checked})} />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Require Approval for Revocation</Label>
										<p className='text-sm text-muted-foreground'>Require admin approval before revoking DIDs</p>
									</div>
									<Switch checked={securitySettings.requireApprovalForRevocation} onCheckedChange={(checked) => updateSecuritySettings({requireApprovalForRevocation: checked})} />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='sessionTimeout'>Session Timeout (minutes)</Label>
									<Input id='sessionTimeout' type='number' value={securitySettings.sessionTimeout} onChange={(e) => updateSecuritySettings({sessionTimeout: parseInt(e.target.value) || 1})} min='5' max='480' />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Audit Log</Label>
										<p className='text-sm text-muted-foreground'>Log all DID operations for security auditing</p>
									</div>
									<Switch checked={securitySettings.enableAuditLog} onCheckedChange={(checked) => updateSecuritySettings({enableAuditLog: checked})} />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Network Settings Tab */}
				<TabsContent value='network' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Network className='h-5 w-5' />
								Network Settings
							</CardTitle>
							<CardDescription>Configure network and blockchain settings</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-2'>
									<Label htmlFor='ethereumNetwork'>Ethereum Network</Label>
									<Select value={networkSettings.ethereumNetwork} onValueChange={(value: 'mainnet' | 'goerli' | 'sepolia' | 'polygon' | 'local') => updateNetworkSettings({ethereumNetwork: value})}>
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
									<Label htmlFor='requestTimeout'>Request Timeout (seconds)</Label>
									<Input id='requestTimeout' type='number' value={networkSettings.requestTimeout} onChange={(e) => updateNetworkSettings({requestTimeout: parseInt(e.target.value) || 1})} min='5' max='300' />
								</div>
							</div>

							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='ethereumRpcUrl'>Ethereum RPC URL</Label>
									<Input id='ethereumRpcUrl' value={networkSettings.ethereumRpcUrl} onChange={(e) => updateNetworkSettings({ethereumRpcUrl: e.target.value})} placeholder='https://mainnet.infura.io/v3/YOUR-PROJECT-ID' />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ionNodeUrl'>ION Node URL</Label>
									<Input id='ionNodeUrl' value={networkSettings.ionNodeUrl} onChange={(e) => updateNetworkSettings({ionNodeUrl: e.target.value})} placeholder='https://ion.msidentity.com' />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='ipfsGateway'>IPFS Gateway</Label>
									<Input id='ipfsGateway' value={networkSettings.ipfsGateway} onChange={(e) => updateNetworkSettings({ipfsGateway: e.target.value})} placeholder='https://ipfs.io' />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Caching</Label>
										<p className='text-sm text-muted-foreground'>Cache DID resolution results</p>
									</div>
									<Switch checked={networkSettings.enableCaching} onCheckedChange={(checked) => updateNetworkSettings({enableCaching: checked})} />
								</div>

								{networkSettings.enableCaching && (
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='cacheTimeout'>Cache Timeout (minutes)</Label>
											<Input id='cacheTimeout' type='number' value={networkSettings.cacheTimeout} onChange={(e) => updateNetworkSettings({cacheTimeout: parseInt(e.target.value) || 1})} min='1' max='1440' />
										</div>

										<div className='space-y-2'>
											<Label htmlFor='retryAttempts'>Retry Attempts</Label>
											<Input id='retryAttempts' type='number' value={networkSettings.retryAttempts} onChange={(e) => updateNetworkSettings({retryAttempts: parseInt(e.target.value) || 1})} min='1' max='10' />
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Advanced Settings Tab */}
				<TabsContent value='advanced' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Database className='h-5 w-5' />
								Advanced Settings
							</CardTitle>
							<CardDescription>Advanced configuration options for power users</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<Alert>
								<AlertTriangle className='h-4 w-4' />
								<AlertDescription>These settings are for advanced users only. Incorrect configuration may cause issues.</AlertDescription>
							</Alert>

							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Experimental Features</Label>
										<p className='text-sm text-muted-foreground'>Enable experimental and beta features</p>
									</div>
									<Switch checked={advancedSettings.enableExperimentalFeatures} onCheckedChange={(checked) => updateAdvancedSettings({enableExperimentalFeatures: checked})} />
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Debug Mode</Label>
										<p className='text-sm text-muted-foreground'>Enable detailed debugging information</p>
									</div>
									<Switch checked={advancedSettings.debugMode} onCheckedChange={(checked) => updateAdvancedSettings({debugMode: checked})} />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='logLevel'>Log Level</Label>
									<Select value={advancedSettings.logLevel} onValueChange={(value: 'error' | 'warn' | 'info' | 'debug') => updateAdvancedSettings({logLevel: value})}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='error'>Error</SelectItem>
											<SelectItem value='warn'>Warning</SelectItem>
											<SelectItem value='info'>Info</SelectItem>
											<SelectItem value='debug'>Debug</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Metrics</Label>
										<p className='text-sm text-muted-foreground'>Collect and export performance metrics</p>
									</div>
									<Switch checked={advancedSettings.enableMetrics} onCheckedChange={(checked) => updateAdvancedSettings({enableMetrics: checked})} />
								</div>

								{advancedSettings.enableMetrics && (
									<div className='space-y-2'>
										<Label htmlFor='metricsEndpoint'>Metrics Endpoint</Label>
										<Input id='metricsEndpoint' value={advancedSettings.metricsEndpoint} onChange={(e) => updateAdvancedSettings({metricsEndpoint: e.target.value})} placeholder='http://localhost:9090/metrics' />
									</div>
								)}

								<div className='flex items-center justify-between'>
									<div className='space-y-0.5'>
										<Label>Enable Batch Operations</Label>
										<p className='text-sm text-muted-foreground'>Allow batch processing of DID operations</p>
									</div>
									<Switch checked={advancedSettings.enableBatchOperations} onCheckedChange={(checked) => updateAdvancedSettings({enableBatchOperations: checked})} />
								</div>

								{advancedSettings.enableBatchOperations && (
									<div className='space-y-2'>
										<Label htmlFor='maxBatchSize'>Max Batch Size</Label>
										<Input id='maxBatchSize' type='number' value={advancedSettings.maxBatchSize} onChange={(e) => updateAdvancedSettings({maxBatchSize: parseInt(e.target.value) || 1})} min='1' max='100' />
									</div>
								)}
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

								{advancedSettings.customResolvers.length > 0 && (
									<div className='space-y-2'>
										<Label>Current Resolvers</Label>
										<div className='space-y-2'>
											{advancedSettings.customResolvers.map((resolver, index) => (
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
