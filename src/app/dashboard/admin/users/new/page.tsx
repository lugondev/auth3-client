'use client'

import React, {useState} from 'react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {UserStatus} from '@/types/user'

// Since we don't have a createUser service yet, we'll create a placeholder
interface CreateUserRequest {
	email: string
	first_name: string
	last_name: string
	phone?: string
	status: UserStatus
	password: string
}

// Placeholder function - this should be implemented in userService.ts
const createUser = async (data: CreateUserRequest) => {
	console.log('createUser', data)
	// This is a placeholder - implement the actual API call
	throw new Error('createUser API not implemented yet')
}

export default function CreateUserPage() {
	const router = useRouter()
	const [saving, setSaving] = useState(false)

	// Form state
	const [formData, setFormData] = useState<CreateUserRequest>({
		email: '',
		first_name: '',
		last_name: '',
		phone: '',
		status: 'pending',
		password: '',
	})

	const [errors, setErrors] = useState<Partial<CreateUserRequest>>({})

	const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: undefined,
			}))
		}
	}

	const validateForm = (): boolean => {
		const newErrors: Partial<CreateUserRequest> = {}

		if (!formData.email.trim()) {
			newErrors.email = 'Email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = 'Invalid email format'
		}

		if (!formData.first_name.trim()) {
			newErrors.first_name = 'First name is required'
		}

		if (!formData.last_name.trim()) {
			newErrors.last_name = 'Last name is required'
		}

		if (!formData.password.trim()) {
			newErrors.password = 'Password is required'
		} else if (formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setSaving(true)

		try {
			await createUser(formData)
			toast.success('User created successfully!')
			router.push('/dashboard/admin/users')
		} catch (err) {
			console.error('Failed to create user:', err)
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
			toast.error(`Failed to create user: ${errorMessage}`)
		} finally {
			setSaving(false)
		}
	}

	const userStatuses: UserStatus[] = ['active', 'pending', 'suspended']

	return (
		<div>
			<div className='flex items-center gap-2 mb-4'>
				<Link href='/dashboard/admin/users'>
					<Button variant='ghost' size='sm'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Users
					</Button>
				</Link>
				<h1 className='text-2xl font-semibold'>Create New User</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>User Information</CardTitle>
					<CardDescription>Create a new user account</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='first_name'>First Name *</Label>
								<Input id='first_name' value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} placeholder='Enter first name' className={errors.first_name ? 'border-red-500' : ''} />
								{errors.first_name && <p className='text-sm text-red-500'>{errors.first_name}</p>}
							</div>
							<div className='space-y-2'>
								<Label htmlFor='last_name'>Last Name *</Label>
								<Input id='last_name' value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} placeholder='Enter last name' className={errors.last_name ? 'border-red-500' : ''} />
								{errors.last_name && <p className='text-sm text-red-500'>{errors.last_name}</p>}
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='email'>Email *</Label>
							<Input id='email' type='email' value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder='Enter email address' className={errors.email ? 'border-red-500' : ''} />
							{errors.email && <p className='text-sm text-red-500'>{errors.email}</p>}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='password'>Password *</Label>
							<Input id='password' type='password' value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder='Enter password' className={errors.password ? 'border-red-500' : ''} />
							{errors.password && <p className='text-sm text-red-500'>{errors.password}</p>}
							<p className='text-sm text-muted-foreground'>Password must be at least 8 characters long</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='phone'>Phone</Label>
							<Input id='phone' value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder='Enter phone number (optional)' />
						</div>

						<div className='space-y-2'>
							<Label htmlFor='status'>Status</Label>
							<Select value={formData.status} onValueChange={(value: UserStatus) => handleInputChange('status', value)}>
								<SelectTrigger>
									<SelectValue placeholder='Select status' />
								</SelectTrigger>
								<SelectContent>
									{userStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status.charAt(0).toUpperCase() + status.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='flex gap-2 pt-4'>
							<Button type='submit' disabled={saving}>
								{saving ? 'Creating...' : 'Create User'}
							</Button>
							<Link href='/dashboard/admin/users'>
								<Button type='button' variant='outline'>
									Cancel
								</Button>
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>

			<div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
				<p className='text-sm text-yellow-800'>
					<strong>Note:</strong> The create user API endpoint is not yet implemented. This form is ready but will show an error until the backend API is available.
				</p>
			</div>
		</div>
	)
}
