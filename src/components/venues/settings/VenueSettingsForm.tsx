// next/src/components/venues/settings/VenueSettingsForm.tsx
'use client'

import React from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm, useFieldArray} from 'react-hook-form'
import * as z from 'zod'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {Separator} from '@/components/ui/separator'
import {toast} from 'sonner' // Use sonner instead
import venueService from '@/services/venueService'
import {BusinessHour, UpdateVenueSettingsDto} from '@/types/venue' // Keep VenueSettings as it's used by the service return type
import {Loader2} from 'lucide-react' // Removed Trash2
const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Saigon']
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'VND']
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// --- Zod Schema ---
// Validate HH:mm format
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const businessHourSchema = z.object({
	dayOfWeek: z.number().min(0).max(6),
	openTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
	closeTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
	isOpen: z.boolean(),
})

const venueSettingsSchema = z.object({
	businessHours: z.array(businessHourSchema).length(7, 'Must configure hours for all 7 days'),
	bookingSettings: z.object({
		enabled: z.boolean(),
		requireApproval: z.boolean(),
		allowCancellation: z.boolean(),
		cancellationPolicy: z.string().optional(),
	}),
	loyaltyProgram: z.object({
		enabled: z.boolean(),
		pointsPerVisit: z.coerce.number().positive().optional().or(z.literal(0)),
		rewardThreshold: z.coerce.number().positive().optional().or(z.literal(0)),
		rewardDescription: z.string().optional(),
	}),
	affiliateProgram: z.object({
		enabled: z.boolean(),
		commissionRate: z.coerce.number().min(0).max(100).optional().or(z.literal(0)), // Percentage
		cookieDuration: z.coerce.number().positive().int().optional().or(z.literal(0)), // Days
	}),
	currency: z.string().min(3, 'Currency code required'),
	timezone: z.string().min(1, 'Timezone required'),
})

type VenueSettingsFormData = z.infer<typeof venueSettingsSchema>

interface VenueSettingsFormProps {
	venueId: string
}

// Helper to create default business hours for 7 days
const createDefaultBusinessHours = (): BusinessHour[] => {
	return Array.from({length: 7}, (_, i) => ({
		dayOfWeek: i,
		openTime: '09:00',
		closeTime: '17:00',
		isOpen: true, // Default to open
	}))
}

const VenueSettingsForm: React.FC<VenueSettingsFormProps> = ({venueId}) => {
	// const { toast } = useToast(); // Removed useToast hook
	const [isLoading, setIsLoading] = React.useState(true)
	const [isSaving, setIsSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	// Initialize form with zod schema and default values
	const form = useForm<VenueSettingsFormData>({
		resolver: zodResolver(venueSettingsSchema),
		defaultValues: async () => {
			setIsLoading(true)
			setError(null)
			try {
				const settings = await venueService.getVenueSettings(venueId)
				// Ensure business hours cover all 7 days, padding if necessary
				const currentHours = settings.businessHours || []
				const fullHours = createDefaultBusinessHours().map((defaultHour) => {
					const existing = currentHours.find((h) => h.dayOfWeek === defaultHour.dayOfWeek)
					return existing || defaultHour
				})
				fullHours.sort((a, b) => a.dayOfWeek - b.dayOfWeek) // Ensure correct order

				return {
					businessHours: fullHours,
					bookingSettings: settings.bookingSettings || {enabled: false, requireApproval: false, allowCancellation: false},
					loyaltyProgram: settings.loyaltyProgram || {enabled: false},
					affiliateProgram: settings.affiliateProgram || {enabled: false},
					currency: settings.currency || 'USD',
					timezone: settings.timezone || 'UTC',
				}
			} catch (err: unknown) {
				console.error('Failed to load venue settings:', err)
				setError('Failed to load settings. Please try again.')
				const errorMessage = err instanceof Error ? err.message : 'Could not fetch venue settings.'
				toast.error('Error Loading Settings', {
					description: errorMessage,
				})
				// Return structure matching schema on error to avoid breaking form
				return {
					businessHours: createDefaultBusinessHours(),
					bookingSettings: {enabled: false, requireApproval: false, allowCancellation: false},
					loyaltyProgram: {enabled: false},
					affiliateProgram: {enabled: false},
					currency: 'USD',
					timezone: 'UTC',
				}
			} finally {
				setIsLoading(false) // Added semicolon based on user format changes
			}
		},
	})

	const {fields: businessHoursFields} = useFieldArray({
		control: form.control,
		name: 'businessHours',
	})

	const onSubmit = async (data: VenueSettingsFormData) => {
		setIsSaving(true)
		setError(null)
		console.log('Submitting data:', data) // Debug submitted data

		try {
			const updateDto: UpdateVenueSettingsDto = {
				...data,
				// Ensure numeric fields are numbers if they exist
				loyaltyProgram: data.loyaltyProgram.enabled
					? {
							enabled: true,
							pointsPerVisit: data.loyaltyProgram.pointsPerVisit ?? undefined,
							rewardThreshold: data.loyaltyProgram.rewardThreshold ?? undefined,
							rewardDescription: data.loyaltyProgram.rewardDescription ?? undefined,
					  }
					: {enabled: false},
				affiliateProgram: data.affiliateProgram.enabled
					? {
							enabled: true,
							commissionRate: data.affiliateProgram.commissionRate ?? undefined,
							cookieDuration: data.affiliateProgram.cookieDuration ?? undefined,
					  }
					: {enabled: false},
			}

			// const updatedSettings = await venueService.updateVenueSettings(venueId, updateDto) // Variable unused
			await venueService.updateVenueSettings(venueId, updateDto)
			toast.success('Venue Settings Updated', {
				description: 'Your changes have been saved successfully.',
			})
			// Optionally reset form with updated data
			// form.reset(updatedSettings); // Consider if API returns the full updated object formatted correctly
		} catch (err: unknown) {
			console.error('Failed to update venue settings:', err)
			setError('Failed to save settings. Please check your input and try again.')
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
			toast.error('Error Saving Settings', {
				description: errorMessage,
			})
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Venue Settings</CardTitle>
					<CardDescription>Loading settings...</CardDescription>
				</CardHeader>
				<CardContent className='flex justify-center items-center py-8'>
					<Loader2 className='h-8 w-8 animate-spin' />
				</CardContent>
			</Card>
		)
	}

	if (error && !form.formState.isDirty) {
		// Show error only if not caused by initial load failure with default values
		return (
			<Card>
				<CardHeader>
					<CardTitle>Venue Settings</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-destructive'>{error}</p>
					<Button onClick={() => form.trigger()} className='mt-4'>
						Retry Loading
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<Card>
					<CardHeader>
						<CardTitle>Venue Settings</CardTitle>
						<CardDescription>Manage your venue&#39;s operational settings.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-8'>
						{/* Business Hours */}
						<Card>
							<CardHeader>
								<CardTitle>Business Hours</CardTitle>
								<CardDescription>Set the opening hours for each day.</CardDescription>
							</CardHeader>
							<CardContent>
								{businessHoursFields.map((field, index) => (
									<div key={field.id} className='flex items-center space-x-4 py-2 border-b last:border-b-0'>
										<span className='w-24 font-medium'>{daysOfWeek[field.dayOfWeek]}</span>
										<FormField
											control={form.control}
											name={`businessHours.${index}.isOpen`}
											render={({field}) => (
												<FormItem className='flex items-center space-x-2'>
													<FormControl>
														<Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
													</FormControl>
													<FormLabel>{field.value ? 'Open' : 'Closed'}</FormLabel>
												</FormItem>
											)}
										/>
										{form.watch(`businessHours.${index}.isOpen`) && (
											<>
												<FormField
													control={form.control}
													name={`businessHours.${index}.openTime`}
													render={({field}) => (
														<FormItem>
															<FormLabel className='sr-only'>Open Time</FormLabel>
															<FormControl>
																<Input type='time' {...field} className='w-28' disabled={isSaving} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<span>-</span>
												<FormField
													control={form.control}
													name={`businessHours.${index}.closeTime`}
													render={({field}) => (
														<FormItem>
															<FormLabel className='sr-only'>Close Time</FormLabel>
															<FormControl>
																<Input type='time' {...field} className='w-28' disabled={isSaving} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</>
										)}
									</div>
								))}
								<FormMessage>{form.formState.errors.businessHours?.message}</FormMessage>
							</CardContent>
						</Card>

						<Separator />

						{/* Booking Settings */}
						<Card>
							<CardHeader>
								<CardTitle>Booking Settings</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<FormField
									control={form.control}
									name='bookingSettings.enabled'
									render={({field}) => (
										<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
											<div className='space-y-0.5'>
												<FormLabel>Enable Bookings</FormLabel>
												<FormDescription>Allow customers to make bookings.</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
											</FormControl>
										</FormItem>
									)}
								/>
								{form.watch('bookingSettings.enabled') && (
									<>
										<FormField
											control={form.control}
											name='bookingSettings.requireApproval'
											render={({field}) => (
												<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
													<div className='space-y-0.5'>
														<FormLabel>Require Booking Approval</FormLabel>
														<FormDescription>Manually approve bookings before confirmation.</FormDescription>
													</div>
													<FormControl>
														<Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name='bookingSettings.allowCancellation'
											render={({field}) => (
												<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
													<div className='space-y-0.5'>
														<FormLabel>Allow Cancellations</FormLabel>
														<FormDescription>Let customers cancel their bookings.</FormDescription>
													</div>
													<FormControl>
														<Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
													</FormControl>
												</FormItem>
											)}
										/>
										{form.watch('bookingSettings.allowCancellation') && (
											<FormField
												control={form.control}
												name='bookingSettings.cancellationPolicy'
												render={({field}) => (
													<FormItem>
														<FormLabel>Cancellation Policy (Optional)</FormLabel>
														<FormControl>
															<Textarea placeholder='e.g., Cancellations must be made 24 hours in advance...' {...field} disabled={isSaving} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}
									</>
								)}
							</CardContent>
						</Card>

						<Separator />

						{/* Loyalty Program */}
						<Card>
							<CardHeader>
								<CardTitle>Loyalty Program</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<FormField
									control={form.control}
									name='loyaltyProgram.enabled'
									render={({field}) => (
										<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
											<div className='space-y-0.5'>
												<FormLabel>Enable Loyalty Program</FormLabel>
												<FormDescription>Reward repeat customers.</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
											</FormControl>
										</FormItem>
									)}
								/>
								{form.watch('loyaltyProgram.enabled') && (
									<>
										<FormField
											control={form.control}
											name='loyaltyProgram.pointsPerVisit'
											render={({field}) => (
												<FormItem>
													<FormLabel>Points Per Visit (Optional)</FormLabel>
													<FormControl>
														<Input type='number' placeholder='e.g., 10' {...field} disabled={isSaving} />
													</FormControl>
													<FormDescription>Points earned per customer visit/booking.</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name='loyaltyProgram.rewardThreshold'
											render={({field}) => (
												<FormItem>
													<FormLabel>Reward Threshold (Optional)</FormLabel>
													<FormControl>
														<Input type='number' placeholder='e.g., 100' {...field} disabled={isSaving} />
													</FormControl>
													<FormDescription>Points needed to redeem a reward.</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name='loyaltyProgram.rewardDescription'
											render={({field}) => (
												<FormItem>
													<FormLabel>Reward Description (Optional)</FormLabel>
													<FormControl>
														<Input placeholder='e.g., Free Coffee, 10% Off' {...field} disabled={isSaving} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}
							</CardContent>
						</Card>

						<Separator />

						{/* Affiliate Program */}
						<Card>
							<CardHeader>
								<CardTitle>Affiliate Program</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<FormField
									control={form.control}
									name='affiliateProgram.enabled'
									render={({field}) => (
										<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
											<div className='space-y-0.5'>
												<FormLabel>Enable Affiliate Program</FormLabel>
												<FormDescription>Allow partners to earn commission for referrals.</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
											</FormControl>
										</FormItem>
									)}
								/>
								{form.watch('affiliateProgram.enabled') && (
									<>
										<FormField
											control={form.control}
											name='affiliateProgram.commissionRate'
											render={({field}) => (
												<FormItem>
													<FormLabel>Commission Rate (%) (Optional)</FormLabel>
													<FormControl>
														<Input type='number' placeholder='e.g., 10' {...field} disabled={isSaving} min='0' max='100' step='0.1' />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name='affiliateProgram.cookieDuration'
											render={({field}) => (
												<FormItem>
													<FormLabel>Cookie Duration (Days) (Optional)</FormLabel>
													<FormControl>
														<Input type='number' placeholder='e.g., 30' {...field} disabled={isSaving} min='1' step='1' />
													</FormControl>
													<FormDescription>How long the referral link is tracked.</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}
							</CardContent>
						</Card>

						<Separator />

						{/* Currency & Timezone */}
						<Card>
							<CardHeader>
								<CardTitle>Localization</CardTitle>
							</CardHeader>
							<CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<FormField
									control={form.control}
									name='currency'
									render={({field}) => (
										<FormItem>
											<FormLabel>Currency</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Select currency' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{currencies.map((c) => (
														<SelectItem key={c} value={c}>
															{c}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='timezone'
									render={({field}) => (
										<FormItem>
											<FormLabel>Timezone</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Select timezone' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{timezones.map((tz) => (
														<SelectItem key={tz} value={tz}>
															{tz}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{error && <p className='text-sm font-medium text-destructive'>{error}</p>}
					</CardContent>
					<CardFooter>
						<Button type='submit' disabled={isSaving || !form.formState.isDirty}>
							{isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Save Changes
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	)
}

export default VenueSettingsForm
