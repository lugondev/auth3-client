'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form' // Added FormDescription
import {Input} from '@/components/ui/input'
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@/components/ui/input-otp' // Import InputOTP
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {useAuth} from '@/contexts/AuthContext'
import {useState} from 'react'
import {Verify2FARequest} from '@/types/user'
import {Shield, Key, Mail} from 'lucide-react'

const formSchema = z.object({
	email: z.string().email({message: 'Invalid email address.'}),
	password: z.string().min(6, {message: 'Password must be at least 6 characters.'}),
})

// Schema for the 2FA code
const twoFactorSchema = z.object({
	code: z.string().min(6, {message: 'Your one-time code must be 6 characters.'}),
})

// Schema for DID authentication
const didAuthSchema = z.object({
	did: z.string().min(1, {message: 'Please enter your DID.'}),
	challenge: z.string().optional(),
	signature: z.string().optional(),
})

interface LoginFormProps {
	oauth2Params?: Record<string, string> | null
}

export function LoginForm({oauth2Params}: LoginFormProps) {
	// Get necessary functions and state from AuthContext
	// Added twoFactorSessionToken from context
	const {signInWithEmail, verifyTwoFactorCode, isTwoFactorPending, twoFactorSessionToken} = useAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [didAuthStep, setDidAuthStep] = useState<'input' | 'challenge' | 'signature'>('input')
	const [didChallenge, setDidChallenge] = useState<string | null>(null)
	// Removed local state for twoFactorSessionToken as it's now read from context

	// Form for email/password
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true)
		setError(null)
		console.log('Attempting email/password sign in with:', values)

		// Store OAuth2 parameters if present
		if (oauth2Params) {
			sessionStorage.setItem('oauth2_params', JSON.stringify(oauth2Params))
		}

		const payload: {email: string; password: string} = {
			email: values.email,
			password: values.password,
		}

		try {
			// Call signInWithEmail and check the result
			const result = await signInWithEmail(payload)

			if (result.success && result.twoFactorRequired && result.sessionToken) {
				// 2FA is required. AuthContext now stores the token.
				// We no longer need to set local state here.
				console.log('2FA required. Token stored in AuthContext.')
				// AuthContext sets isTwoFactorPending, UI will switch to 2FA form
			} else if (result.success && !result.twoFactorRequired) {
				// Login successful without 2FA, AuthContext handles state and redirect
				console.log('Login successful (no 2FA).')
			} else {
				// Handle potential errors returned in the result object
				if (result.error instanceof Error) {
					setError(result.error.message)
				} else if (typeof result.error === 'string') {
					setError(result.error)
				} else {
					setError('Login failed. Please check your credentials.')
				}
			}
		} catch (err) {
			// Catch errors thrown by signInWithEmail (e.g., network errors)
			// AuthContext might show a toast, but set local error state too
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError('An unexpected error occurred during login.')
			}
			console.error('Email/Password Sign in error caught in form:', err)
		} finally {
			setLoading(false)
		}
	}

	// Handler for DID authentication
	async function onDidAuthSubmit(values: z.infer<typeof didAuthSchema>) {
		setLoading(true)
		setError(null)
		console.log('DID Authentication attempt:', values)

		try {
			if (didAuthStep === 'input') {
				// Step 1: Request challenge for the DID
				const response = await fetch('/api/auth/did/challenge', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({did: values.did}),
				})

				if (!response.ok) {
					throw new Error('Failed to get challenge')
				}

				const data = await response.json()
				setDidChallenge(data.challenge)
				didAuthForm.setValue('challenge', data.challenge)
				setDidAuthStep('challenge')
			} else if (didAuthStep === 'challenge') {
				// Step 2: User needs to sign the challenge
				// This would typically involve external wallet/agent
				setDidAuthStep('signature')
			} else if (didAuthStep === 'signature') {
				// Step 3: Verify signature and complete authentication
				const response = await fetch('/api/auth/did/verify', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						did: values.did,
						challenge: values.challenge,
						signature: values.signature,
					}),
				})

				if (!response.ok) {
					throw new Error('DID authentication failed')
				}

				const data = await response.json()
				console.log('DID authentication successful:', data)
				// Handle successful authentication (similar to email/password flow)
			}
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError('DID authentication failed')
			}
			console.error('DID authentication error:', err)
		} finally {
			setLoading(false)
		}
	}

	// Reset DID authentication flow
	const resetDidAuth = () => {
		setDidAuthStep('input')
		setDidChallenge(null)
		didAuthForm.reset()
		setError(null)
	}

	// Form for 2FA code
	const twoFactorForm = useForm<z.infer<typeof twoFactorSchema>>({
		resolver: zodResolver(twoFactorSchema),
		defaultValues: {
			code: '',
		},
	})

	// Form for DID authentication
	const didAuthForm = useForm<z.infer<typeof didAuthSchema>>({
		resolver: zodResolver(didAuthSchema),
		defaultValues: {
			did: '',
			challenge: '',
			signature: '',
		},
	})

	// Handler for 2FA form submission
	async function onTwoFactorSubmit(values: z.infer<typeof twoFactorSchema>) {
		setLoading(true)
		setError(null)
		console.log('[LoginForm] onTwoFactorSubmit called with values:', values) // Log 1: Function entry

		// Read the token directly from context here
		if (!twoFactorSessionToken) {
			console.error('[LoginForm] Error: twoFactorSessionToken from context is missing!') // Log 2: Token check failure
			setError('2FA session is invalid or expired. Please try logging in again.')
			setLoading(false)
			// Optionally force back to email/password step by clearing context state?
			// Or rely on user restarting the login flow.
			return
		}

		console.log('[LoginForm] Attempting 2FA verification with token:', twoFactorSessionToken, 'and code:', values.code) // Log 3: Before calling context function
		try {
			const verifyData: Verify2FARequest = {
				two_factor_session_token: twoFactorSessionToken,
				code: values.code,
			}
			// Call the context function
			const result = await verifyTwoFactorCode(verifyData)
			console.log('[LoginForm] verifyTwoFactorCode result:', result) // Log 4: After calling context function

			if (result.success) {
				console.log('[LoginForm] 2FA verification successful.')
			} else {
				console.error('[LoginForm] 2FA verification failed:', result.error) // Log 5: Verification failure
				// Handle verification failure
				if (result.error instanceof Error) {
					setError(result.error.message)
				} else if (typeof result.error === 'string') {
					setError(result.error)
				} else {
					setError('Invalid 2FA code or session expired.')
				}
				twoFactorForm.reset() // Clear the input field on error
			}
		} catch (err) {
			console.error('[LoginForm] Error caught during verifyTwoFactorCode call:', err) // Log 6: Catch block
			// Catch errors thrown by verifyTwoFactorCode
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError('An unexpected error occurred during 2FA verification.')
			}
			twoFactorForm.reset() // Clear the input field on error
		} finally {
			console.log('[LoginForm] onTwoFactorSubmit finally block.') // Log 7: Finally block
			setLoading(false)
		}
	}

	// Conditional Rendering based on isTwoFactorPending
	if (isTwoFactorPending) {
		return (
			<Form {...twoFactorForm}>
				<form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className='space-y-6'>
					<FormField
						control={twoFactorForm.control}
						name='code'
						render={({field}) => (
							<FormItem>
								<FormLabel>One-Time Password</FormLabel>
								<FormControl>
									<InputOTP maxLength={6} {...field}>
										<InputOTPGroup>
											<InputOTPSlot index={0} />
											<InputOTPSlot index={1} />
											<InputOTPSlot index={2} />
											<InputOTPSlot index={3} />
											<InputOTPSlot index={4} />
											<InputOTPSlot index={5} />
										</InputOTPGroup>
									</InputOTP>
								</FormControl>
								<FormDescription>Please enter the 6-digit code from your authenticator app.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					{error && <p className='text-sm text-red-500'>{error}</p>}
					<Button type='submit' className='w-full' disabled={loading}>
						{loading ? 'Verifying...' : 'Verify Code'}
					</Button>
				</form>
			</Form>
		)
	}

	// Render authentication options if 2FA is not pending
	return (
		<Tabs defaultValue='email' className='w-full'>
			<TabsList className='grid w-full grid-cols-2'>
				<TabsTrigger value='email' className='flex items-center gap-2'>
					<Mail className='h-4 w-4' />
					Email
				</TabsTrigger>
				<TabsTrigger value='did' className='flex items-center gap-2'>
					<Shield className='h-4 w-4' />
					DID
				</TabsTrigger>
			</TabsList>

			{/* Email/Password Authentication */}
			<TabsContent value='email'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Mail className='h-5 w-5' />
							Email Authentication
						</CardTitle>
						<CardDescription>Sign in with your email and password</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
								<FormField
									control={form.control}
									name='email'
									render={({field}) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input placeholder='your@email.com' {...field} type='email' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='password'
									render={({field}) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<Input placeholder='********' {...field} type='password' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{error && <p className='text-sm text-red-500'>{error}</p>}
								<Button type='submit' className='w-full' disabled={loading}>
									{loading ? 'Signing in...' : 'Sign in with Email'}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</TabsContent>

			{/* DID Authentication */}
			<TabsContent value='did'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5' />
							DID Authentication
						</CardTitle>
						<CardDescription>Sign in using your Decentralized Identifier (DID)</CardDescription>
					</CardHeader>
					<CardContent>
						{/* DID Authentication Steps */}
						<div className='space-y-4'>
							{/* Step Indicator */}
							<div className='flex items-center justify-between mb-6'>
								<div className={`flex items-center gap-2 ${didAuthStep === 'input' ? 'text-primary' : didAuthStep === 'challenge' || didAuthStep === 'signature' ? 'text-green-600' : 'text-muted-foreground'}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${didAuthStep === 'input' ? 'bg-primary text-primary-foreground' : didAuthStep === 'challenge' || didAuthStep === 'signature' ? 'bg-green-600 text-white' : 'bg-muted'}`}>1</div>
									<span className='text-sm font-medium'>Enter DID</span>
								</div>
								<div className={`flex items-center gap-2 ${didAuthStep === 'challenge' ? 'text-primary' : didAuthStep === 'signature' ? 'text-green-600' : 'text-muted-foreground'}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${didAuthStep === 'challenge' ? 'bg-primary text-primary-foreground' : didAuthStep === 'signature' ? 'bg-green-600 text-white' : 'bg-muted'}`}>2</div>
									<span className='text-sm font-medium'>Sign Challenge</span>
								</div>
								<div className={`flex items-center gap-2 ${didAuthStep === 'signature' ? 'text-primary' : 'text-muted-foreground'}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${didAuthStep === 'signature' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
									<span className='text-sm font-medium'>Verify</span>
								</div>
							</div>

							<Separator />

							<Form {...didAuthForm}>
								<form onSubmit={didAuthForm.handleSubmit(onDidAuthSubmit)} className='space-y-4'>
									{/* Step 1: DID Input */}
									{didAuthStep === 'input' && (
										<div>
											<FormField
												control={didAuthForm.control}
												name='did'
												render={({field}) => (
													<FormItem>
														<FormLabel className='flex items-center gap-2'>
															<Key className='h-4 w-4' />
															Your DID
														</FormLabel>
														<FormControl>
															<Input placeholder='did:example:123456789abcdefghi' {...field} className='font-mono' />
														</FormControl>
														<FormDescription>Enter your Decentralized Identifier (DID)</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									{/* Step 2: Challenge Display */}
									{didAuthStep === 'challenge' && didChallenge && (
										<div>
											<div className='space-y-3'>
												<div className='p-4 bg-muted rounded-lg'>
													<h4 className='font-medium mb-2 flex items-center gap-2'>
														<Shield className='h-4 w-4' />
														Challenge to Sign
													</h4>
													<code className='text-sm bg-background p-2 rounded border block font-mono break-all'>{didChallenge}</code>
												</div>
												<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
													<p className='text-sm text-blue-800'>
														<strong>Instructions:</strong> Please sign this challenge using your DID's private key with your wallet or agent, then paste the signature in the next step.
													</p>
												</div>
											</div>
										</div>
									)}

									{/* Step 3: Signature Input */}
									{didAuthStep === 'signature' && (
										<div>
											<FormField
												control={didAuthForm.control}
												name='signature'
												render={({field}) => (
													<FormItem>
														<FormLabel className='flex items-center gap-2'>
															<Key className='h-4 w-4' />
															Signature
														</FormLabel>
														<FormControl>
															<Input placeholder='Paste your signature here...' {...field} className='font-mono' />
														</FormControl>
														<FormDescription>Paste the signature generated by your wallet/agent</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									{error && <p className='text-sm text-red-500'>{error}</p>}

									<div className='flex gap-2'>
										{didAuthStep !== 'input' && (
											<Button type='button' variant='outline' onClick={resetDidAuth} disabled={loading}>
												Reset
											</Button>
										)}
										<Button type='submit' className='flex-1' disabled={loading}>
											{loading ? (didAuthStep === 'input' ? 'Getting Challenge...' : didAuthStep === 'challenge' ? 'Proceeding...' : 'Verifying...') : didAuthStep === 'input' ? 'Get Challenge' : didAuthStep === 'challenge' ? 'I have signed the challenge' : 'Verify Signature'}
										</Button>
									</div>
								</form>
							</Form>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	)
}
