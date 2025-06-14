'use client'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {Separator} from '@/components/ui/separator'
import {Plus, Edit, Trash2, Key, Shield, Eye, EyeOff, Copy} from 'lucide-react'
import {VerificationMethod, JWK} from '@/types/did'
import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {toast} from 'sonner'

interface DIDVerificationMethodsProps {
	verificationMethods: VerificationMethod[]
	onAdd?: (method: Omit<VerificationMethod, 'id'>) => void
	onEdit?: (id: string, method: Partial<VerificationMethod>) => void
	onDelete?: (id: string) => void
	readonly?: boolean
	allowedTypes?: string[]
}

// Form schema for verification method
const verificationMethodSchema = z.object({
	type: z.string().min(1, 'Type is required'),
	controller: z.string().min(1, 'Controller is required'),
	publicKeyJwk: z.string().optional(),
	publicKeyMultibase: z.string().optional(),
	blockchainAccountId: z.string().optional(),
})

type VerificationMethodFormData = z.infer<typeof verificationMethodSchema>

/**
 * DIDVerificationMethods component manages verification methods
 * with add, edit, and delete functionality
 */
export function DIDVerificationMethods({verificationMethods, onAdd, onEdit, onDelete, readonly = false, allowedTypes = ['Ed25519VerificationKey2020', 'EcdsaSecp256k1VerificationKey2019', 'RsaVerificationKey2018', 'X25519KeyAgreementKey2020', 'EcdsaSecp256k1RecoveryMethod2020']}: DIDVerificationMethodsProps) {
	const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({})
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [editingMethod, setEditingMethod] = useState<VerificationMethod | null>(null)

	const form = useForm<VerificationMethodFormData>({
		resolver: zodResolver(verificationMethodSchema),
		defaultValues: {
			type: '',
			controller: '',
			publicKeyJwk: '',
			publicKeyMultibase: '',
			blockchainAccountId: '',
		},
	})

	// Toggle sensitive data visibility
	const toggleSensitiveData = (methodId: string) => {
		setShowSensitiveData((prev) => ({
			...prev,
			[methodId]: !prev[methodId],
		}))
	}

	// Copy to clipboard
	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(`${label} copied to clipboard`)
		} catch (error) {
			console.log('Error copying to clipboard:', error)
			toast.error(`Failed to copy ${label}`)
		}
	}

	// Handle form submission
	const onSubmit = (data: VerificationMethodFormData) => {
		try {
			const method: Omit<VerificationMethod, 'id'> = {
				type: data.type,
				controller: data.controller,
			}

			// Add optional fields
			if (data.publicKeyJwk) {
				try {
					method.publicKeyJwk = JSON.parse(data.publicKeyJwk) as JWK
				} catch (error) {
					console.log('Error parsing JWK:', error)
					toast.error('Invalid JWK format')
					return
				}
			}

			if (data.publicKeyMultibase) {
				method.publicKeyMultibase = data.publicKeyMultibase
			}

			if (data.blockchainAccountId) {
				method.blockchainAccountId = data.blockchainAccountId
			}

			if (editingMethod) {
				onEdit?.(editingMethod.id, method)
				setEditingMethod(null)
			} else {
				onAdd?.(method)
			}

			form.reset()
			setIsAddDialogOpen(false)
			toast.success(editingMethod ? 'Verification method updated' : 'Verification method added')
		} catch (error) {
			console.log('Error saving verification method:', error)
			toast.error('Failed to save verification method')
		}
	}

	// Start editing a method
	const startEdit = (method: VerificationMethod) => {
		setEditingMethod(method)
		form.reset({
			type: method.type,
			controller: method.controller,
			publicKeyJwk: method.publicKeyJwk ? JSON.stringify(method.publicKeyJwk, null, 2) : '',
			publicKeyMultibase: method.publicKeyMultibase || '',
			blockchainAccountId: method.blockchainAccountId || '',
		})
		setIsAddDialogOpen(true)
	}

	// Cancel editing
	const cancelEdit = () => {
		setEditingMethod(null)
		form.reset()
		setIsAddDialogOpen(false)
	}

	// Render verification method card
	const renderVerificationMethod = (method: VerificationMethod) => {
		const isVisible = showSensitiveData[method.id] || false

		return (
			<Card key={method.id} className='relative'>
				<CardHeader className='pb-3'>
					<div className='flex items-start justify-between'>
						<div className='space-y-1'>
							<CardTitle className='text-base flex items-center gap-2'>
								<Key className='h-4 w-4' />
								{method.id}
							</CardTitle>
							<div className='flex items-center gap-2'>
								<Badge variant='outline'>{method.type}</Badge>
								<Badge variant='secondary' className='text-xs'>
									{method.publicKeyJwk ? 'JWK' : method.publicKeyMultibase ? 'Multibase' : 'Blockchain'}
								</Badge>
							</div>
						</div>
						{!readonly && (
							<div className='flex items-center gap-1'>
								<Button variant='ghost' size='sm' onClick={() => toggleSensitiveData(method.id)}>
									{isVisible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
								</Button>
								<Button variant='ghost' size='sm' onClick={() => startEdit(method)}>
									<Edit className='h-4 w-4' />
								</Button>
								<Button variant='ghost' size='sm' onClick={() => onDelete?.(method.id)} className='text-destructive hover:text-destructive'>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className='space-y-3'>
					{/* Controller */}
					<div className='space-y-1'>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-medium text-muted-foreground'>Controller</span>
							<Button variant='ghost' size='sm' onClick={() => copyToClipboard(method.controller, 'Controller')}>
								<Copy className='h-3 w-3' />
							</Button>
						</div>
						<div className='p-2 bg-muted rounded text-xs font-mono break-all'>{method.controller}</div>
					</div>

					{/* Public Key JWK */}
					{method.publicKeyJwk && (
						<div className='space-y-1'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>Public Key (JWK)</span>
								<Button variant='ghost' size='sm' onClick={() => copyToClipboard(JSON.stringify(method.publicKeyJwk), 'JWK')}>
									<Copy className='h-3 w-3' />
								</Button>
							</div>
							<div className='p-2 bg-muted rounded text-xs font-mono'>{isVisible ? <pre className='whitespace-pre-wrap break-all'>{JSON.stringify(method.publicKeyJwk, null, 2)}</pre> : <span className='text-muted-foreground'>••• Hidden (click eye icon to show)</span>}</div>
						</div>
					)}

					{/* Public Key Multibase */}
					{method.publicKeyMultibase && (
						<div className='space-y-1'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>Public Key (Multibase)</span>
								<Button variant='ghost' size='sm' onClick={() => copyToClipboard(method.publicKeyMultibase!, 'Multibase key')}>
									<Copy className='h-3 w-3' />
								</Button>
							</div>
							<div className='p-2 bg-muted rounded text-xs font-mono break-all'>{isVisible ? method.publicKeyMultibase : '••• Hidden'}</div>
						</div>
					)}

					{/* Blockchain Account ID */}
					{method.blockchainAccountId && (
						<div className='space-y-1'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>Blockchain Account</span>
								<Button variant='ghost' size='sm' onClick={() => copyToClipboard(method.blockchainAccountId!, 'Blockchain account')}>
									<Copy className='h-3 w-3' />
								</Button>
							</div>
							<div className='p-2 bg-muted rounded text-xs font-mono break-all'>{method.blockchainAccountId}</div>
						</div>
					)}
				</CardContent>
			</Card>
		)
	}

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='text-lg font-semibold flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Verification Methods
					</h3>
					<p className='text-sm text-muted-foreground'>Cryptographic keys used for authentication and authorization</p>
				</div>
				{!readonly && (
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger asChild>
							<Button onClick={() => setEditingMethod(null)}>
								<Plus className='h-4 w-4 mr-2' />
								Add Method
							</Button>
						</DialogTrigger>
						<DialogContent className='max-w-2xl'>
							<DialogHeader>
								<DialogTitle>{editingMethod ? 'Edit Verification Method' : 'Add Verification Method'}</DialogTitle>
								<DialogDescription>{editingMethod ? 'Update the verification method details' : 'Add a new verification method to your DID document'}</DialogDescription>
							</DialogHeader>

							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
									<FormField
										control={form.control}
										name='type'
										render={({field}) => (
											<FormItem>
												<FormLabel>Type</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select verification method type' />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{allowedTypes.map((type) => (
															<SelectItem key={type} value={type}>
																{type}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>The cryptographic signature suite type</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='controller'
										render={({field}) => (
											<FormItem>
												<FormLabel>Controller</FormLabel>
												<FormControl>
													<Input placeholder='did:example:123...' {...field} />
												</FormControl>
												<FormDescription>The DID that controls this verification method</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Separator />

									<div className='space-y-4'>
										<h4 className='font-medium'>Public Key (choose one format)</h4>

										<FormField
											control={form.control}
											name='publicKeyJwk'
											render={({field}) => (
												<FormItem>
													<FormLabel>Public Key JWK (JSON)</FormLabel>
													<FormControl>
														<Textarea placeholder='{"kty":"OKP","crv":"Ed25519","x":"..."}' className='font-mono text-xs' rows={4} {...field} />
													</FormControl>
													<FormDescription>JSON Web Key format (recommended for most use cases)</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name='publicKeyMultibase'
											render={({field}) => (
												<FormItem>
													<FormLabel>Public Key Multibase</FormLabel>
													<FormControl>
														<Input placeholder='z6Mk...' {...field} />
													</FormControl>
													<FormDescription>Multibase-encoded public key</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name='blockchainAccountId'
											render={({field}) => (
												<FormItem>
													<FormLabel>Blockchain Account ID</FormLabel>
													<FormControl>
														<Input placeholder='eip155:1:0x...' {...field} />
													</FormControl>
													<FormDescription>CAIP-10 blockchain account identifier</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className='flex justify-end gap-2'>
										<Button type='button' variant='outline' onClick={cancelEdit}>
											Cancel
										</Button>
										<Button type='submit'>{editingMethod ? 'Update' : 'Add'} Method</Button>
									</div>
								</form>
							</Form>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* Verification Methods List */}
			{verificationMethods.length === 0 ? (
				<Card>
					<CardContent className='flex flex-col items-center justify-center py-8'>
						<Shield className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='font-semibold mb-2'>No Verification Methods</h3>
						<p className='text-sm text-muted-foreground text-center mb-4'>Add verification methods to enable authentication and signing capabilities.</p>
						{!readonly && (
							<Button onClick={() => setIsAddDialogOpen(true)}>
								<Plus className='h-4 w-4 mr-2' />
								Add First Method
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-4'>{verificationMethods.map(renderVerificationMethod)}</div>
			)}

			{/* Summary */}
			{verificationMethods.length > 0 && (
				<div className='text-sm text-muted-foreground bg-muted/50 p-3 rounded'>
					<p className='font-medium mb-1'>Summary:</p>
					<ul className='space-y-1'>
						<li>• Total verification methods: {verificationMethods.length}</li>
						<li>• JWK methods: {verificationMethods.filter((m) => m.publicKeyJwk).length}</li>
						<li>• Multibase methods: {verificationMethods.filter((m) => m.publicKeyMultibase).length}</li>
						<li>• Blockchain methods: {verificationMethods.filter((m) => m.blockchainAccountId).length}</li>
					</ul>
				</div>
			)}
		</div>
	)
}
