'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ArrowLeft, UserPlus, QrCode, Link, Copy, Check} from 'lucide-react'
import {didcommService} from '@/services/didcommService'
import {CreateConnectionRequest} from '@/types/didcomm'
import {toast} from 'sonner'

/**
 * Create Connection Page
 * Allows users to create new DIDComm connections via invitation or direct connection
 */
export default function CreateConnectionPage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [activeTab, setActiveTab] = useState('invitation')
	const [copied, setCopied] = useState(false)
	const [generatedInvitation, setGeneratedInvitation] = useState<string | null>(null)

	// Invitation form state
	const [invitationForm, setInvitationForm] = useState({
		my_did: '',
		my_label: '',
		invitation_url: '',
		auto_accept: true,
	})

	// Direct connection form state
	const [directForm, setDirectForm] = useState({
		my_did: '',
		their_did: '',
		my_label: '',
		their_label: '',
		auto_accept: false,
	})

	// Accept invitation form state
	const [acceptForm, setAcceptForm] = useState({
		invitation_url: '',
		my_did: '',
		my_label: '',
	})

	// Generate connection invitation
	const generateInvitation = async () => {
		if (!invitationForm.my_did || !invitationForm.my_label) {
			toast.error('Please fill in all required information')
			return
		}

		try {
			setLoading(true)
			const request: CreateConnectionRequest = {
				my_did: invitationForm.my_did,
				my_label: invitationForm.my_label,
				auto_accept: invitationForm.auto_accept,
			}

			const response = await didcommService.createConnectionInvitation(request)
			// Create invitation URL from the invitation object
			const invitationUrl = response.invitation ? `${window.location.origin}/invitation?data=${encodeURIComponent(JSON.stringify(response.invitation))}` : ''
			setGeneratedInvitation(invitationUrl)
			toast.success('Connection invitation created successfully')
		} catch (error) {
			console.error('Error generating invitation:', error)
			toast.error('Failed to create connection invitation')
		} finally {
			setLoading(false)
		}
	}

	// Create direct connection
	const createDirectConnection = async () => {
		if (!directForm.my_did || !directForm.their_did || !directForm.my_label) {
			toast.error('Please fill in all required fields')
			return
		}

		try {
			setLoading(true)
			const request: CreateConnectionRequest = {
				my_did: directForm.my_did,
				their_did: directForm.their_did,
				my_label: directForm.my_label,
				their_label: directForm.their_label,
				auto_accept: directForm.auto_accept,
			}

			await didcommService.createConnection(request)
			toast.success('Direct connection created successfully')
			router.push('/dashboard/connections')
		} catch (error) {
			console.error('Error creating direct connection:', error)
			toast.error('Failed to create direct connection')
		} finally {
			setLoading(false)
		}
	}

	// Accept connection invitation
	const acceptInvitation = async () => {
		if (!acceptForm.invitation_url || !acceptForm.my_did || !acceptForm.my_label) {
			toast.error('Please fill in all required information')
			return
		}

		try {
			setLoading(true)
			const request: CreateConnectionRequest = {
				my_did: acceptForm.my_did,
				my_label: acceptForm.my_label,
				invitation_url: acceptForm.invitation_url,
			}

			await didcommService.acceptConnectionInvitation(request.invitation_url!)
			toast.success('Connection invitation accepted successfully')
			router.push('/dashboard/connections')
		} catch (error) {
			console.error('Error accepting invitation:', error)
			toast.error('Failed to accept connection invitation')
		} finally {
			setLoading(false)
		}
	}

	// Copy invitation URL to clipboard
	const copyInvitation = async () => {
		if (!generatedInvitation) return

		try {
			await navigator.clipboard.writeText(generatedInvitation)
			setCopied(true)
			toast.success('Invitation copied to clipboard')
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			console.log('Error copying invitation URL:', error)
			toast.error('Failed to copy to clipboard')
		}
	}

	return (
		<div className='container mx-auto p-6 max-w-4xl'>
			{/* Header */}
			<div className='flex items-center gap-4 mb-6'>
				<Button variant='outline' onClick={() => router.back()}>
					<ArrowLeft className='h-4 w-4' />
				</Button>
				<div>
					<h1 className='text-3xl font-bold'>Create DIDComm Connection</h1>
					<p className='text-muted-foreground'>Create connection invitation or connect directly with other DIDs</p>
				</div>
			</div>

			{/* Connection Creation Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='invitation' className='flex items-center gap-2'>
						<QrCode className='h-4 w-4' />
						Create Invitation
					</TabsTrigger>
					<TabsTrigger value='direct' className='flex items-center gap-2'>
						<Link className='h-4 w-4' />
						Direct Connection
					</TabsTrigger>
					<TabsTrigger value='accept' className='flex items-center gap-2'>
						<UserPlus className='h-4 w-4' />
						Accept Invitation
					</TabsTrigger>
				</TabsList>

				{/* Generate Invitation Tab */}
				<TabsContent value='invitation' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Create Connection Invitation</CardTitle>
							<CardDescription>Create a connection invitation to share with others</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='my-did'>My DID *</Label>
									<Input id='my-did' placeholder='did:example:123...' value={invitationForm.my_did} onChange={(e) => setInvitationForm((prev) => ({...prev, my_did: e.target.value}))} />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='my-label'>My Label *</Label>
									<Input id='my-label' placeholder='Display name' value={invitationForm.my_label} onChange={(e) => setInvitationForm((prev) => ({...prev, my_label: e.target.value}))} />
								</div>
							</div>

							<div className='flex items-center space-x-2'>
								<input type='checkbox' id='auto-accept' checked={invitationForm.auto_accept} onChange={(e) => setInvitationForm((prev) => ({...prev, auto_accept: e.target.checked}))} className='rounded' />
								<Label htmlFor='auto-accept'>Auto-accept connection</Label>
							</div>

							<Button onClick={generateInvitation} disabled={loading} className='w-full'>
								{loading ? 'Creating...' : 'Create Invitation'}
							</Button>

							{generatedInvitation && (
								<div className='space-y-4 p-4 bg-muted rounded-lg'>
									<div className='space-y-2'>
										<Label>Generated Connection Invitation</Label>
										<div className='flex gap-2'>
											<Input value={generatedInvitation} readOnly className='font-mono text-sm' />
											<Button variant='outline' onClick={copyInvitation} className='shrink-0'>
												{copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
											</Button>
										</div>
									</div>

									<div className='text-sm text-muted-foreground'>
										<p>Share this URL with the person you want to connect with. They can use this URL to accept the connection invitation.</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Direct Connection Tab */}
				<TabsContent value='direct' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Direct Connection</CardTitle>
							<CardDescription>Create a direct connection with a known DID</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='direct-my-did'>My DID *</Label>
									<Input id='direct-my-did' placeholder='did:example:123...' value={directForm.my_did} onChange={(e) => setDirectForm((prev) => ({...prev, my_did: e.target.value}))} />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='direct-their-did'>Their DID *</Label>
									<Input id='direct-their-did' placeholder='did:example:456...' value={directForm.their_did} onChange={(e) => setDirectForm((prev) => ({...prev, their_did: e.target.value}))} />
								</div>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='direct-my-label'>My Label *</Label>
									<Input id='direct-my-label' placeholder='My display name' value={directForm.my_label} onChange={(e) => setDirectForm((prev) => ({...prev, my_label: e.target.value}))} />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='direct-their-label'>Their Label</Label>
									<Input id='direct-their-label' placeholder='Their display name (optional)' value={directForm.their_label} onChange={(e) => setDirectForm((prev) => ({...prev, their_label: e.target.value}))} />
								</div>
							</div>

							<div className='flex items-center space-x-2'>
								<input type='checkbox' id='direct-auto-accept' checked={directForm.auto_accept} onChange={(e) => setDirectForm((prev) => ({...prev, auto_accept: e.target.checked}))} className='rounded' />
								<Label htmlFor='direct-auto-accept'>Auto-accept response</Label>
							</div>

							<Button onClick={createDirectConnection} disabled={loading} className='w-full'>
								{loading ? 'Creating...' : 'Create Connection'}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Accept Invitation Tab */}
				<TabsContent value='accept' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Accept Connection Invitation</CardTitle>
							<CardDescription>Accept a connection invitation from someone else</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='invitation-url'>Invitation URL *</Label>
								<Textarea id='invitation-url' placeholder='Paste the connection invitation URL here...' value={acceptForm.invitation_url} onChange={(e) => setAcceptForm((prev) => ({...prev, invitation_url: e.target.value}))} rows={3} />
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='accept-my-did'>My DID *</Label>
									<Input id='accept-my-did' placeholder='did:example:123...' value={acceptForm.my_did} onChange={(e) => setAcceptForm((prev) => ({...prev, my_did: e.target.value}))} />
								</div>

								<div className='space-y-2'>
									<Label htmlFor='accept-my-label'>My Label *</Label>
									<Input id='accept-my-label' placeholder='Display name' value={acceptForm.my_label} onChange={(e) => setAcceptForm((prev) => ({...prev, my_label: e.target.value}))} />
								</div>
							</div>

							<Button onClick={acceptInvitation} disabled={loading} className='w-full'>
								{loading ? 'Accepting...' : 'Accept Invitation'}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
