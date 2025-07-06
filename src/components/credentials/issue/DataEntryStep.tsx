'use client'

import React, {useState, useMemo, useCallback, useRef, useEffect} from 'react'
import {useForm, Controller} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Calendar} from '@/components/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Badge} from '@/components/ui/badge'
import {EnhancedDatePicker} from '@/components/ui/enhanced-date-picker'
import {CalendarIcon, User, Mail, AlertCircle, Info, Plus, X, CheckCircle} from 'lucide-react'
import {format} from 'date-fns'

import {CredentialTemplate, JSONValue, JSONSchemaProperty} from '@/types/template'
import {getCurrentDateString} from '@/utils/dateUtils'
import {DIDResponse} from '@/types/did'

interface DataEntryStepProps {
	template: CredentialTemplate
	credentialData: Record<string, JSONValue>
	recipientInfo: {
		did?: string
		email?: string
	}
	issuanceOptions: {
		issuanceDate?: string
		expirationDate?: string
		additionalContext?: string[]
	}
	issuerOptions: {
		selectedDID?: string
		customDID?: string
		useCustomDID: boolean
	}
	availableDIDs: DIDResponse[]
	templateHasIssuerDID: boolean
	onDataChange: (data: Record<string, JSONValue>) => void
	onRecipientChange: (recipient: {did?: string; email?: string}) => void
	onOptionsChange: (options: {issuanceDate?: string; expirationDate?: string; additionalContext?: string[]}) => void
	onIssuerChange: (issuerOptions: {selectedDID?: string; customDID?: string; useCustomDID: boolean}) => void
	errors: Record<string, string>
}

export function DataEntryStep({template, credentialData, recipientInfo, issuanceOptions, issuerOptions, availableDIDs, templateHasIssuerDID, onDataChange, onRecipientChange, onOptionsChange, onIssuerChange, errors}: DataEntryStepProps) {
	const [newContext, setNewContext] = useState('')
	const [selectedDIDKey, setSelectedDIDKey] = useState<string>('')

	// Update selected DID key when issuerOptions change
	useEffect(() => {
		setSelectedDIDKey(issuerOptions.selectedDID || '')
		console.log('DataEntryStep: issuerOptions updated:', issuerOptions)
	}, [issuerOptions.selectedDID])

	// Log available DIDs for debugging
	useEffect(() => {
		console.log('DataEntryStep: availableDIDs updated:', availableDIDs.length)
		if (availableDIDs.length > 0) {
			console.log('First DID structure:', availableDIDs[0])
			console.log('First DID full object:', JSON.stringify(availableDIDs[0], null, 2))
		}
	}, [availableDIDs])

	// Early return if template is not provided to prevent issues
	if (!template || !template.schema) {
		return (
			<div className='p-4 text-center'>
				<p className='text-muted-foreground'>No template selected</p>
			</div>
		)
	}

	const schemaProperties = (template.schema.properties as unknown as Record<string, JSONSchemaProperty>) || {}
	const requiredFields = (template.schema.required as string[]) || []

	// Generate form schema based on template schema (memoized to prevent re-renders)
	const formSchema = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const schemaFields: Record<string, any> = {}

		Object.entries(schemaProperties).forEach(([key, property]) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let fieldSchema: any

			switch (property.type) {
				case 'string':
					fieldSchema = z.string()
					if (property.minLength) fieldSchema = fieldSchema.min(property.minLength)
					if (property.maxLength) fieldSchema = fieldSchema.max(property.maxLength)
					if (property.format === 'email') fieldSchema = fieldSchema.email()
					if (property.pattern) {
						try {
							fieldSchema = fieldSchema.regex(new RegExp(property.pattern))
						} catch {
							// Invalid regex, skip pattern validation
						}
					}
					break
				case 'number':
				case 'integer':
					fieldSchema = z.number()
					if (property.minimum !== undefined) fieldSchema = fieldSchema.min(property.minimum)
					if (property.maximum !== undefined) fieldSchema = fieldSchema.max(property.maximum)
					if (property.type === 'integer') fieldSchema = fieldSchema.int()
					break
				case 'boolean':
					fieldSchema = z.boolean()
					break
				case 'array':
					fieldSchema = z.array(z.string())
					break
				default:
					fieldSchema = z.string()
			}

			if (!requiredFields.includes(key)) {
				fieldSchema = fieldSchema.optional()
			}

			schemaFields[key] = fieldSchema
		})

		return z.object(schemaFields)
	}, [schemaProperties, requiredFields])

	const {
		control,
		formState: {errors: formErrors},
	} = useForm<{
		[key in keyof typeof schemaProperties]: any
	}>({
		resolver: zodResolver(formSchema),
		defaultValues: credentialData,
	})

	// Use a ref to hold the timeout ID to avoid creating new callbacks
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Use refs to store the latest callback functions to avoid dependency issues
	const onDataChangeRef = useRef(onDataChange)
	const onRecipientChangeRef = useRef(onRecipientChange)
	const onOptionsChangeRef = useRef(onOptionsChange)

	// Update refs directly without useEffect to avoid re-renders
	onDataChangeRef.current = onDataChange
	onRecipientChangeRef.current = onRecipientChange
	onOptionsChangeRef.current = onOptionsChange

	// Simple callback that only passes the field change without merging
	const handleDataChange = useCallback(
		(fieldName: string, value: JSONValue) => {
			// Clear existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}

			// Set new timeout to debounce the call
			timeoutRef.current = setTimeout(() => {
				// Only pass the single field change - let parent handle merging
				onDataChangeRef.current({[fieldName]: value})
			}, 100) // Increased timeout to prevent infinite loops
		},
		// No dependencies to prevent re-creation
		[],
	)

	const renderFormField = (fieldName: string, property: JSONSchemaProperty) => {
		const isRequired = requiredFields.includes(fieldName)
		const fieldError = formErrors[fieldName]?.message || errors[fieldName]

		const baseProps = {
			required: isRequired,
			className: fieldError ? 'border-red-500' : '',
		}

		switch (property.type) {
			case 'string':
				if (property.enum && property.enum.length > 0) {
					// Select dropdown for enum values
					return (
						<Controller
							name={fieldName}
							control={control}
							render={({field}) => (
								<Select
									onValueChange={(value) => {
										field.onChange(value)
										handleDataChange(fieldName, value)
									}}
									value={field.value as string}>
									<SelectTrigger {...baseProps}>
										<SelectValue placeholder={`Select ${property.title || fieldName}`} />
									</SelectTrigger>
									<SelectContent>
										{property.enum!.map((option, index) => (
											<SelectItem key={index} value={String(option)}>
												{String(option)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					)
				} else if (property.format === 'date') {
					// Enhanced date picker with month/year navigation and direct input
					return (
						<Controller
							name={fieldName}
							control={control}
							render={({field}) => (
								<EnhancedDatePicker
									value={field.value as string}
									onChange={(date) => {
										field.onChange(date)
										handleDataChange(fieldName, date)
									}}
									placeholder={`Select ${property.title || fieldName}`}
									className={fieldError ? 'border-red-500' : ''}
								/>
							)}
						/>
					)
				} else if (property.maxLength && property.maxLength > 100) {
					// Textarea for long text
					return <Controller name={fieldName} control={control} render={({field}) => <Textarea {...field} {...baseProps} placeholder={property.description || `Enter ${property.title || fieldName}`} rows={3} value={(field.value as string) || ''} />} />
				} else {
					// Regular text input
					return (
						<Controller
							name={fieldName}
							control={control}
							render={({field}) => (
								<Input
									{...field}
									{...baseProps}
									type={property.format === 'email' ? 'email' : 'text'}
									placeholder={property.description || `Enter ${property.title || fieldName}`}
									value={(field.value as string) || ''}
									onChange={(e) => {
										field.onChange(e.target.value)
										handleDataChange(fieldName, e.target.value)
									}}
								/>
							)}
						/>
					)
				}

			case 'number':
			case 'integer':
				return (
					<Controller
						name={fieldName}
						control={control}
						render={({field}) => (
							<Input
								{...baseProps}
								type='number'
								step={property.type === 'integer' ? '1' : '0.01'}
								min={property.minimum}
								max={property.maximum}
								placeholder={property.description || `Enter ${property.title || fieldName}`}
								value={(field.value as number) || ''}
								onChange={(e) => {
									const value = property.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)
									const finalValue = isNaN(value) ? '' : value
									field.onChange(finalValue)
									handleDataChange(fieldName, finalValue)
								}}
							/>
						)}
					/>
				)

			case 'boolean':
				return (
					<Controller
						name={fieldName}
						control={control}
						render={({field}) => (
							<div className='flex items-center space-x-2'>
								<Checkbox id={fieldName} checked={field.value as boolean} onCheckedChange={field.onChange} />
								<Label htmlFor={fieldName} className='text-sm'>
									{property.title || fieldName}
								</Label>
							</div>
						)}
					/>
				)

			case 'array':
				return (
					<Controller
						name={fieldName}
						control={control}
						render={({field}) => {
							const values = (field.value as string[]) || []
							return (
								<div className='space-y-2'>
									<div className='flex flex-wrap gap-2'>
										{values.map((value, index) => (
											<Badge key={index} variant='secondary' className='flex items-center gap-1'>
												{value}
												<X
													className='h-3 w-3 cursor-pointer'
													onClick={() => {
														const newValues = values.filter((_, i) => i !== index)
														field.onChange(newValues)
													}}
												/>
											</Badge>
										))}
									</div>
									<div className='flex gap-2'>
										<Input
											placeholder={`Add ${property.title || fieldName}`}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault()
													const input = e.target as HTMLInputElement
													if (input.value.trim()) {
														field.onChange([...values, input.value.trim()])
														input.value = ''
													}
												}
											}}
										/>
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={() => {
												const input = document.querySelector(`input[placeholder*="${fieldName}"]`) as HTMLInputElement
												if (input?.value.trim()) {
													field.onChange([...values, input.value.trim()])
													input.value = ''
												}
											}}>
											<Plus className='h-4 w-4' />
										</Button>
									</div>
								</div>
							)
						}}
					/>
				)

			default:
				return <Controller name={fieldName} control={control} render={({field}) => <Input {...field} {...baseProps} placeholder={property.description || `Enter ${property.title || fieldName}`} value={(field.value as string) || ''} />} />
		}
	}

	// Pattern 3: Memoize context handlers using refs to avoid dependency issues
	const addContext = useCallback(() => {
		if (newContext.trim() && !issuanceOptions.additionalContext?.includes(newContext.trim())) {
			const updatedContexts = [...(issuanceOptions.additionalContext || []), newContext.trim()]
			onOptionsChangeRef.current({...issuanceOptions, additionalContext: updatedContexts})
			setNewContext('')
		}
	}, [newContext, issuanceOptions])

	const removeContext = useCallback(
		(contextToRemove: string) => {
			const updatedContexts = issuanceOptions.additionalContext?.filter((c) => c !== contextToRemove) || []
			onOptionsChangeRef.current({...issuanceOptions, additionalContext: updatedContexts})
		},
		[issuanceOptions],
	)

	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-lg font-semibold mb-2'>Enter Credential Data</h3>
				<p className='text-muted-foreground'>
					Fill in the information for the credential based on the selected template: <strong>{template.name}</strong>
				</p>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Credential Data Form */}
				<div className='lg:col-span-2 space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<User className='h-5 w-5' />
								Credential Subject Data
							</CardTitle>
							<CardDescription>Enter the data that will be included in the credential</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{Object.entries(schemaProperties).map(([fieldName, property]) => (
								<div key={fieldName} className='space-y-2'>
									<Label htmlFor={fieldName} className='flex items-center gap-2'>
										{property.title || fieldName}
										{requiredFields.includes(fieldName) && <span className='text-red-500'>*</span>}
										{property.description && (
											<div className='group relative'>
												<Info className='h-4 w-4 text-muted-foreground cursor-help' />
												<div className='absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-black text-white text-xs rounded shadow-lg'>{property.description}</div>
											</div>
										)}
									</Label>
									{renderFormField(fieldName, property)}
									{(formErrors[fieldName]?.message || errors[fieldName]) && (
										<p className='text-sm text-red-600 flex items-center gap-1'>
											<AlertCircle className='h-4 w-4' />
											{String(formErrors[fieldName]?.message || errors[fieldName])}
										</p>
									)}
								</div>
							))}
						</CardContent>
					</Card>

					{/* Issuer Selection - Only show if template doesn't have issuerDID */}
					{!templateHasIssuerDID && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<User className='h-5 w-5' />
									Issuer DID
								</CardTitle>
								<CardDescription>Select the DID that will issue this credential</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								{/* Current Selected DID Display */}
								{(issuerOptions.selectedDID || issuerOptions.customDID) && (
									<div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
										<div className='flex items-center gap-2'>
											<CheckCircle className='h-4 w-4 text-green-600' />
											<span className='text-sm font-medium text-green-800'>Selected Issuer DID:</span>
										</div>
										<p className='mt-1 text-sm text-green-700 font-mono break-all'>{issuerOptions.useCustomDID ? issuerOptions.customDID : issuerOptions.selectedDID}</p>
									</div>
								)}

								<div className='space-y-3'>
									<div className='flex items-center space-x-2'>
										<input
											type='radio'
											id='use-existing-did'
											name='issuer-type'
											checked={!issuerOptions.useCustomDID}
											onChange={() => {
												console.log('Switching to existing DID mode')
												setSelectedDIDKey('')
												onIssuerChange({...issuerOptions, useCustomDID: false, selectedDID: undefined})
											}}
											className='h-4 w-4 text-primary'
										/>
										<Label htmlFor='use-existing-did'>Use existing DID</Label>
									</div>

									{!issuerOptions.useCustomDID && (
										<div className='ml-6 space-y-2'>
											<Label htmlFor='selected-did'>Select DID</Label>
											<Select
												value={selectedDIDKey}
												onValueChange={(value) => {
													console.log('DID selected:', value)
													console.log('Current issuerOptions before update:', issuerOptions)
													setSelectedDIDKey(value)
													const newOptions = {...issuerOptions, selectedDID: value}
													console.log('New issuerOptions after update:', newOptions)
													onIssuerChange(newOptions)
												}}>
												<SelectTrigger>
													<SelectValue placeholder='Choose a DID'>{selectedDIDKey && <span className='font-mono text-sm truncate block'>{selectedDIDKey}</span>}</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{availableDIDs.map((did, index) => {
														// Based on DIDResponse interface: did.did.did should be the correct path
														// But let's handle multiple possible structures from API
														let didValue: string

														if (did.did && typeof did.did === 'object' && did.did) {
															// Expected structure: DIDResponse.did.DIDData.did
															didValue = did.did
														} else if (did.did && typeof did.did === 'string') {
															// Alternative: DIDResponse.did is directly the DID string
															didValue = did.did
														} else if (did.identifier) {
															// Fallback: use identifier field
															didValue = did.identifier
														} else {
															// Last resort: generate a placeholder
															didValue = `Unknown-DID-${index}`
														}

														console.log(`DID ${index} processed:`, didValue, 'from object:', did)

														return (
															<SelectItem key={`${did.id || index}-${index}`} value={String(didValue)}>
																<div className='flex flex-col'>
																	<span className='font-medium text-sm truncate max-w-[200px]'>{String(didValue)}</span>
																	<span className='text-xs text-muted-foreground'>
																		{did.method || 'unknown'} • Created {did.created_at ? new Date(did.created_at).toLocaleDateString() : 'unknown'}
																	</span>
																</div>
															</SelectItem>
														)
													})}
												</SelectContent>
											</Select>
											{availableDIDs.length === 0 && <p className='text-sm text-muted-foreground'>No active DIDs found. Please create a DID first.</p>}
											{availableDIDs.length > 0 && <p className='text-xs text-muted-foreground'>Found {availableDIDs.length} available DIDs</p>}
										</div>
									)}

									<div className='flex items-center space-x-2'>
										<input
											type='radio'
											id='use-custom-did'
											name='issuer-type'
											checked={issuerOptions.useCustomDID}
											onChange={() => {
												console.log('Switching to custom DID mode')
												setSelectedDIDKey('')
												onIssuerChange({...issuerOptions, useCustomDID: true, selectedDID: undefined})
											}}
											className='h-4 w-4 text-primary'
										/>
										<Label htmlFor='use-custom-did'>Use custom DID</Label>
									</div>

									{issuerOptions.useCustomDID && (
										<div className='ml-6 space-y-2'>
											<Label htmlFor='custom-did'>Custom DID</Label>
											<Input id='custom-did' placeholder='did:method:identifier' value={issuerOptions.customDID || ''} onChange={(e) => onIssuerChange({...issuerOptions, customDID: e.target.value})} />
											<p className='text-xs text-muted-foreground'>Enter a valid DID that you control and can use to sign credentials</p>
										</div>
									)}
								</div>

								{errors.issuerDID && (
									<p className='text-sm text-red-600 flex items-center gap-1'>
										<AlertCircle className='h-4 w-4' />
										{errors.issuerDID}
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Template has issuerDID - show info card */}
					{templateHasIssuerDID && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<User className='h-5 w-5' />
									Issuer DID
								</CardTitle>
								<CardDescription>This template has a predefined issuer DID</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
									<div className='flex items-center gap-2'>
										<Info className='h-4 w-4 text-blue-600' />
										<span className='text-sm font-medium text-blue-800'>Template Issuer DID:</span>
									</div>
									<p className='mt-1 text-sm text-blue-700 font-mono break-all'>{template.issuerDID}</p>
									<p className='mt-2 text-xs text-blue-600'>This credential will be issued using the DID configured in the template.</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Issuance Options */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<CalendarIcon className='h-5 w-5' />
								Issuance Options
							</CardTitle>
							<CardDescription>Configure when the credential is issued and expires</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='issuanceDate'>Issuance Date</Label>
									<EnhancedDatePicker
										value={issuanceOptions.issuanceDate || getCurrentDateString()}
										onChange={(date) => onOptionsChangeRef.current({...issuanceOptions, issuanceDate: date})}
										placeholder='Select issuance date'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='expirationDate'>Expiration Date (Optional)</Label>
									<EnhancedDatePicker
										value={issuanceOptions.expirationDate || ''}
										onChange={(date) => onOptionsChangeRef.current({...issuanceOptions, expirationDate: date || undefined})}
										placeholder='Select expiration date'
										minDate={issuanceOptions.issuanceDate ? new Date(issuanceOptions.issuanceDate) : new Date()}
									/>
								</div>
							</div>

							{/* Additional Context URLs */}
							<div className='space-y-2'>
								<Label>Additional Context URLs</Label>
								<div className='flex gap-2'>
									<Input placeholder='https://example.com/contexts/custom' value={newContext} onChange={(e) => setNewContext(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addContext())} />
									<Button type='button' onClick={addContext} size='sm'>
										<Plus className='h-4 w-4' />
									</Button>
								</div>
								{issuanceOptions.additionalContext && issuanceOptions.additionalContext.length > 0 && (
									<div className='flex flex-wrap gap-2 mt-2'>
										{issuanceOptions.additionalContext.map((context, index) => (
											<Badge key={index} variant='outline' className='flex items-center gap-1'>
												{context}
												<X className='h-3 w-3 cursor-pointer' onClick={() => removeContext(context)} />
											</Badge>
										))}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Recipient Information */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Mail className='h-5 w-5' />
								Recipient Information
							</CardTitle>
							<CardDescription>Specify who will receive this credential</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='recipientDID'>Recipient DID</Label>
								<Input id='recipientDID' placeholder='did:example:recipient123' value={recipientInfo.did || ''} onChange={(e) => onRecipientChangeRef.current({...recipientInfo, did: e.target.value})} className={errors.recipient ? 'border-red-500' : ''} />
							</div>

							<div className='text-center text-muted-foreground'>
								<span>OR</span>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='recipientEmail'>Recipient Email</Label>
								<Input id='recipientEmail' type='email' placeholder='recipient@example.com' value={recipientInfo.email || ''} onChange={(e) => onRecipientChangeRef.current({...recipientInfo, email: e.target.value})} className={errors.recipient ? 'border-red-500' : ''} />
							</div>

							{errors.recipient && (
								<p className='text-sm text-red-600 flex items-center gap-1'>
									<AlertCircle className='h-4 w-4' />
									{errors.recipient}
								</p>
							)}

							<div className='text-xs text-muted-foreground'>
								<Info className='h-4 w-4 inline mr-1' />
								Provide either a DID or email address for the credential recipient.
							</div>
						</CardContent>
					</Card>

					{/* Template Info */}
					<Card>
						<CardHeader>
							<CardTitle>Template Information</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div>
								<span className='text-sm font-medium'>Template:</span>
								<p className='text-sm text-muted-foreground'>{template.name}</p>
							</div>
							<div>
								<span className='text-sm font-medium'>Version:</span>
								<p className='text-sm text-muted-foreground'>{template.version}</p>
							</div>
							<div>
								<span className='text-sm font-medium'>Required Fields:</span>
								<div className='flex flex-wrap gap-1 mt-1'>
									{requiredFields.map((field) => (
										<Badge key={field} variant='secondary' className='text-xs'>
											{field}
										</Badge>
									))}
								</div>
							</div>
							<div>
								<span className='text-sm font-medium'>Types:</span>
								<div className='flex flex-wrap gap-1 mt-1'>
									{template.type.map((type, index) => (
										<Badge key={index} variant='outline' className='text-xs'>
											{type}
										</Badge>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
