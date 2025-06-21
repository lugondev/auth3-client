'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {ChevronLeft, ChevronRight, CheckCircle, AlertCircle, FileText, User, Eye, Send} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate, JSONValue} from '@/types/template'
import {IssuedCredential} from '@/types/credentials'
import {credentialService} from '@/services/credentialService'
import {getCurrentDateString} from '@/utils/dateUtils'
import {TemplateSelectionStep} from './TemplateSelectionStep'
import {DataEntryStep} from './DataEntryStep'
import {ReviewStep} from './ReviewStep'
import {IssueResultStep} from './IssueResultStep'
import {listDIDs} from '@/services/didService'
import {DIDStatus, DIDResponse} from '@/types/did'

interface SimpleWizardData {
	selectedTemplate?: CredentialTemplate
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
	issuedCredential?: IssuedCredential
	isSuccess?: boolean
	error?: string
}

interface SimpleCredentialWizardProps {
	onComplete?: (result: IssuedCredential) => void
	onCancel?: () => void
	initialTemplate?: CredentialTemplate
	className?: string
}

const STEPS = [
	{
		id: 'template',
		title: 'Select Template',
		description: 'Choose the credential template',
		icon: FileText,
	},
	{
		id: 'data',
		title: 'Enter Data',
		description: 'Fill in credential information',
		icon: User,
	},
	{
		id: 'review',
		title: 'Review',
		description: 'Preview and confirm details',
		icon: Eye,
	},
	{
		id: 'result',
		title: 'Issue',
		description: 'Credential issuance result',
		icon: Send,
	},
]

export function SimpleCredentialWizard({onComplete, onCancel, initialTemplate, className}: SimpleCredentialWizardProps) {
	const [currentStep, setCurrentStep] = useState(0)
	const [wizardData, setWizardData] = useState<SimpleWizardData>({
		selectedTemplate: initialTemplate,
		credentialData: {},
		recipientInfo: {},
		issuanceOptions: {
			issuanceDate: getCurrentDateString(),
		},
		issuerOptions: {
			useCustomDID: false,
		},
	})
	const [loading, setLoading] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [availableDIDs, setAvailableDIDs] = useState<DIDResponse[]>([])
	const [loadingDIDs, setLoadingDIDs] = useState(true)

	// Fetch user's DIDs on component mount
	useEffect(() => {
		const fetchDIDs = async () => {
			try {
				setLoadingDIDs(true)
				const response = await listDIDs({
					status: DIDStatus.ACTIVE,
					limit: 100, // Get all active DIDs
				})

				if (response.dids && response.dids.length > 0) {
					setAvailableDIDs(response.dids)
					// Do not set any default DID - require explicit selection
				} else {
					console.warn('No active DIDs found for current user')
					toast.warning('No active DIDs found. You may need to create a DID first.')
				}
			} catch (error) {
				console.error('Failed to fetch DIDs:', error)
				toast.error('Failed to load DID information')
			} finally {
				setLoadingDIDs(false)
			}
		}

		fetchDIDs()
	}, [])

	// Debug effect to track issuer options changes
	useEffect(() => {
		console.log('Issuer options changed:', wizardData.issuerOptions)
	}, [wizardData.issuerOptions])

	// Helper function to get the current issuer DID
	const getCurrentIssuerDID = () => {
		if (wizardData.issuerOptions.useCustomDID) {
			return wizardData.issuerOptions.customDID || ''
		}
		return wizardData.issuerOptions.selectedDID || ''
	}

	// Helper function to check if template has issuer DID
	const templateHasIssuerDID = () => {
		return wizardData.selectedTemplate?.issuerDID && wizardData.selectedTemplate.issuerDID.trim() !== ''
	}

	// Simple validation function
	const validateStep = (stepIndex: number) => {
		const newErrors: Record<string, string> = {}

		switch (stepIndex) {
			case 0: // Template Selection
				if (!wizardData.selectedTemplate) {
					newErrors.template = 'Please select a template'
				}
				break

			case 1: // Data Entry
				if (!wizardData.selectedTemplate) {
					newErrors.template = 'Template is required'
					break
				}

				// Validate required fields
				const schema = wizardData.selectedTemplate.schema
				const requiredFields = (schema.required as string[]) || []

				requiredFields.forEach((field) => {
					if (!wizardData.credentialData[field] || wizardData.credentialData[field] === '') {
						newErrors[field] = `${field} is required`
					}
				})

				// Validate recipient info
				if (!wizardData.recipientInfo.did && !wizardData.recipientInfo.email) {
					newErrors.recipient = 'Either DID or email is required for the recipient'
				}

				// Validate issuer DID selection only if template doesn't have issuerDID
				if (!templateHasIssuerDID()) {
					const issuerDIDValue = getCurrentIssuerDID()
					if (!issuerDIDValue) {
						newErrors.issuerDID = 'Please select or enter an issuer DID'
					}
				}
				break

			case 2: // Review Step
				// Only validate issuer DID if template doesn't have one
				if (!templateHasIssuerDID()) {
					const currentIssuerDID = getCurrentIssuerDID()
					if (!currentIssuerDID) {
						newErrors.issuerDID = 'Please select or enter an issuer DID.'
					}
				}
				break
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Simple event handlers
	const handleTemplateSelect = (template: CredentialTemplate) => {
		setWizardData((prev) => ({...prev, selectedTemplate: template}))
		setErrors({})
	}

	const handleDataChange = (data: Record<string, JSONValue>) => {
		setWizardData((prev) => ({
			...prev,
			credentialData: {...prev.credentialData, ...data},
		}))
		setErrors({})
	}

	const handleRecipientChange = (recipient: {did?: string; email?: string}) => {
		setWizardData((prev) => ({...prev, recipientInfo: recipient}))
		setErrors({})
	}

	const handleOptionsChange = (options: {issuanceDate?: string; expirationDate?: string; additionalContext?: string[]}) => {
		setWizardData((prev) => ({...prev, issuanceOptions: options}))
		setErrors({})
	}

	const handleIssuerChange = (issuerOptions: {selectedDID?: string; customDID?: string; useCustomDID: boolean}) => {
		console.log('handleIssuerChange called with:', issuerOptions)
		console.log('Current wizard data before update:', wizardData.issuerOptions)

		setWizardData((prev) => {
			const newData = {...prev, issuerOptions: {...issuerOptions}}
			console.log('New wizard data after update:', newData.issuerOptions)
			return newData
		})
		setErrors({})
	}

	const handleNext = () => {
		if (validateStep(currentStep)) {
			if (currentStep < STEPS.length - 1) {
				setCurrentStep(currentStep + 1)
			}
		} else {
			toast.error('Please fix the errors before proceeding')
		}
	}

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleStepClick = (stepIndex: number) => {
		if (stepIndex < currentStep || (stepIndex === currentStep + 1 && validateStep(currentStep))) {
			setCurrentStep(stepIndex)
		}
	}

	const isStepCompleted = (stepIndex: number): boolean => {
		if (stepIndex > currentStep) return false

		switch (stepIndex) {
			case 0:
				return !!wizardData.selectedTemplate
			case 1:
				const hasCredentialData = Object.keys(wizardData.credentialData).length > 0
				const hasRecipient = !!wizardData.recipientInfo.did || !!wizardData.recipientInfo.email
				// Only require issuer DID if template doesn't have one
				const hasIssuerDID = templateHasIssuerDID() || !!getCurrentIssuerDID()
				return hasCredentialData && hasRecipient && hasIssuerDID
			case 2:
				return !!wizardData.issuedCredential
			case 3:
				return !!wizardData.issuedCredential
			default:
				return false
		}
	}

	const isStepAccessible = (stepIndex: number): boolean => {
		if (stepIndex === 0) return true
		if (stepIndex <= currentStep) return true
		return isStepCompleted(stepIndex - 1)
	}

	const getStepIcon = (stepIndex: number) => {
		const step = STEPS[stepIndex]
		const IconComponent = step.icon

		if (isStepCompleted(stepIndex)) {
			return <CheckCircle className='h-5 w-5 text-green-500' />
		}

		if (currentStep === stepIndex) {
			return <IconComponent className='h-5 w-5 text-primary' />
		}

		return <IconComponent className='h-5 w-5 text-muted-foreground' />
	}

	const issueCredential = async () => {
		if (!wizardData.selectedTemplate) {
			toast.error('No template selected')
			return
		}

		// Determine issuer DID: priority to template, fallback to user selection
		let issuerDIDToUse: string
		if (templateHasIssuerDID()) {
			issuerDIDToUse = wizardData.selectedTemplate.issuerDID!
			console.log('Issue credential - using issuer DID from template:', issuerDIDToUse)
		} else {
			const currentIssuerDID = getCurrentIssuerDID()
			if (!currentIssuerDID) {
				toast.error('Please select or enter an issuer DID.')
				return
			}
			issuerDIDToUse = currentIssuerDID
			console.log('Issue credential - using issuer DID from user selection:', issuerDIDToUse)
		}

		console.log('Issue credential - final issuerDID:', issuerDIDToUse)
		console.log('Issue credential - wizardData.issuerOptions:', wizardData.issuerOptions)

		setLoading(true)
		try {
			const requestPayload = {
				templateId: wizardData.selectedTemplate.id,
				credentialSubject: wizardData.credentialData,
				issuerDID: issuerDIDToUse,
				recipientDID: wizardData.recipientInfo.did,
				recipientEmail: wizardData.recipientInfo.email,
				issuanceDate: wizardData.issuanceOptions.issuanceDate,
				expirationDate: wizardData.issuanceOptions.expirationDate,
				additionalContext: wizardData.issuanceOptions.additionalContext,
			}

			console.log('Issue credential - request payload:', requestPayload)

			const response = await credentialService.issueCredential(requestPayload)

			setWizardData((prev) => ({
				...prev,
				issuedCredential: {
					id: response.id,
					issuedAt: new Date().toISOString(),
					templateName: wizardData.selectedTemplate?.name || '',
					templateVersion: wizardData.selectedTemplate?.version || '',
					credentialTypes: [],
					credentialSubject: wizardData.credentialData,
					recipient: wizardData.recipientInfo.did || wizardData.recipientInfo.email || '',
					status: response.status,
					verifiableCredential: response.credential,
				} as IssuedCredential,
				isSuccess: true,
				error: undefined,
			}))
			setCurrentStep(3)
			toast.success('Credential issued successfully!')
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to issue credential'
			setWizardData((prev) => ({
				...prev,
				isSuccess: false,
				error: errorMessage,
			}))
			setCurrentStep(3)
			toast.error(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 0:
				return <TemplateSelectionStep selectedTemplate={wizardData.selectedTemplate} onTemplateSelect={handleTemplateSelect} />

			case 1:
				if (!wizardData.selectedTemplate) {
					return <div className='p-4 text-center'>Please select a template first</div>
				}
				return <DataEntryStep template={wizardData.selectedTemplate} credentialData={wizardData.credentialData} recipientInfo={wizardData.recipientInfo} issuanceOptions={wizardData.issuanceOptions} issuerOptions={wizardData.issuerOptions} availableDIDs={availableDIDs} templateHasIssuerDID={Boolean(templateHasIssuerDID())} onDataChange={handleDataChange} onRecipientChange={handleRecipientChange} onOptionsChange={handleOptionsChange} onIssuerChange={handleIssuerChange} errors={errors} />

			case 2:
				if (!wizardData.selectedTemplate) {
					return <div className='p-4 text-center'>Please select a template first</div>
				}
				return <ReviewStep template={wizardData.selectedTemplate} credentialData={wizardData.credentialData} recipientInfo={wizardData.recipientInfo} issuanceOptions={wizardData.issuanceOptions} issuerDID={getCurrentIssuerDID()} onIssue={issueCredential} onBack={handlePrevious} isLoading={loading} />

			case 3:
				return (
					<IssueResultStep
						credential={wizardData.issuedCredential}
						isSuccess={!!wizardData.isSuccess}
						error={wizardData.error}
						onStartOver={() => {
							setCurrentStep(0)
							setWizardData({
								selectedTemplate: undefined,
								credentialData: {},
								recipientInfo: {},
								issuanceOptions: {
									issuanceDate: getCurrentDateString(),
								},
								issuerOptions: {
									useCustomDID: false,
								},
							})
							setErrors({})
						}}
						onViewCredential={() => wizardData.issuedCredential && onComplete?.(wizardData.issuedCredential)}
					/>
				)

			default:
				return <div>Unknown step</div>
		}
	}

	const progress = ((currentStep + 1) / STEPS.length) * 100

	return (
		<div className={className}>
			<Card>
				<CardHeader>
					<CardTitle>Issue New Credential</CardTitle>
					<CardDescription>Follow the steps below to create and issue a verifiable credential</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Progress */}
					<div className='space-y-2'>
						<div className='flex justify-between text-sm'>
							<span>Progress</span>
							<span>{Math.round(progress)}% Complete</span>
						</div>
						<Progress value={progress} className='w-full' />
					</div>

					{/* Step Navigation */}
					<div className='flex items-center justify-between'>
						{STEPS.map((step, index) => (
							<div key={step.id} className='flex items-center'>
								<button onClick={() => handleStepClick(index)} disabled={!isStepAccessible(index)} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${currentStep === index ? 'bg-primary text-primary-foreground border-primary' : isStepCompleted(index) ? 'bg-green-50 text-green-700 border-green-200' : isStepAccessible(index) ? 'bg-background text-foreground border-border hover:bg-muted' : 'bg-muted text-muted-foreground border-muted cursor-not-allowed'}`}>
									{getStepIcon(index)}
									<div className='text-left hidden sm:block'>
										<div className='text-sm font-medium'>{step.title}</div>
										<div className='text-xs opacity-75'>{step.description}</div>
									</div>
								</button>
								{index < STEPS.length - 1 && <ChevronRight className='h-4 w-4 text-muted-foreground mx-2' />}
							</div>
						))}
					</div>

					{/* Step Content */}
					<div className='min-h-[400px]'>
						{loadingDIDs ? (
							<div className='flex items-center justify-center h-64'>
								<div className='text-center space-y-2'>
									<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
									<p className='text-sm text-muted-foreground'>Loading DID information...</p>
								</div>
							</div>
						) : (
							renderCurrentStep()
						)}
					</div>

					{/* Navigation Buttons */}
					{currentStep < 3 && (
						<div className='flex justify-between'>
							<Button variant='outline' onClick={onCancel} disabled={loading || loadingDIDs}>
								Cancel
							</Button>

							<div className='space-x-2'>
								{currentStep > 0 && (
									<Button variant='outline' onClick={handlePrevious} disabled={loading || loadingDIDs}>
										<ChevronLeft className='h-4 w-4 mr-2' />
										Previous
									</Button>
								)}

								{currentStep < 2 && (
									<Button onClick={handleNext} disabled={loading || loadingDIDs}>
										Next
										<ChevronRight className='h-4 w-4 ml-2' />
									</Button>
								)}
							</div>
						</div>
					)}

					{/* Display errors */}
					{Object.keys(errors).length > 0 && (
						<div className='rounded-lg border border-red-200 bg-red-50 p-4'>
							<div className='flex items-center space-x-2 text-red-800'>
								<AlertCircle className='h-4 w-4' />
								<span className='text-sm font-medium'>Please fix the following errors:</span>
							</div>
							<ul className='mt-2 text-sm text-red-700 space-y-1'>
								{Object.entries(errors).map(([field, error]) => (
									<li key={field}>• {error}</li>
								))}
							</ul>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
