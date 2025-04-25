'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {useAuth} from '@/contexts/AuthContext'
import {useState} from 'react'

const formSchema = z.object({
	email: z.string().email({message: 'Invalid email address.'}),
	password: z.string().min(6, {message: 'Password must be at least 6 characters.'}),
})

export function LoginForm() {
	const {signInWithEmail} = useAuth() // We'll add this function to AuthContext later
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

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
		try {
			// Pass values as an object matching the LoginInput type
			await signInWithEmail({email: values.email, password: values.password})
			// AuthContext handles success toast and state update
			// No explicit redirect needed here, AuthStatus/layout will handle it
		} catch (err) {
			// AuthContext throws the error, so we catch it here to update local state if needed
			// AuthContext already shows an error toast
			if (err instanceof Error) {
				setError(err.message) // Display error below the form
			} else {
				setError('An unexpected error occurred.')
			}
			console.error('Email/Password Sign in error caught in form:', err)
		} finally {
			setLoading(false)
		}
	}

	return (
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
	)
}
