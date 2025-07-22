'use client'

import React, {useState, useEffect} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {ChevronLeft, ChevronRight, CheckCircle, FileText, User, Eye, Send} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'

import {CredentialTemplate, JSONValue} from '@/types/template'
import {IssuedCredential} from '@/types/credentials'
import {credentialService} from '@/services/credentialService'
import {getCurrentDateString} from '@/utils/dateUtils'
import {TemplateSelector} from '../templates/TemplateSelector'
import {DataEntryStep} from '../issue/DataEntryStep'
import {ReviewStep} from '../issue/ReviewStep'
import {IssueResultStep} from '../issue/IssueResultStep'
import * as tenantDIDService from '@/services/tenantDIDService'
import type {TenantDIDDocument} from '@/services/tenantDIDService'
import type {DIDResponse} from '@/types/did'

interface TenantWizardData {
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

interface TenantCredentialWizardProps {
	tenantId: string
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

export function TenantCredentialWizard({
	tenantId,
	onComplete,
	onCancel,
	initialTemplate,
	className
}: TenantCredentialWizardProps) {
	const {toast} = useToast()
	const [currentStep, setCurrentStep] = useState(0)
	const [wizardData, setWizardData] = useState<TenantWizardData>({
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
	const [tenantDIDs, setTenantDIDs] = useState<TenantDIDDocument[]>([])
	const [loadingDIDs, setLoadingDIDs] = useState(true)

	// Fetch tenant's DIDs on component mount
	useEffect(() => {
		const fetchTenantDIDs = async () => {
			try {
				setLoadingDIDs(true)
				console.log('🔍 Fetching tenant DIDs for:', tenantId)
				
				const response = await tenantDIDService.getTenantDIDs({
					tenantId,
					page: 1,
					pageSize: 100,
				})

				if (response?.dids) {
					// Filter only active DIDs
					const activeDIDs = response.dids.filter(did => did.status === 'active')
					setTenantDIDs(activeDIDs)
					
					// Auto-select first active DID if available
					if (activeDIDs.length > 0 && !wizardData.issuerOptions.selectedDID) {
						setWizardData(prev => ({
							...prev,
							issuerOptions: {
								...prev.issuerOptions,
								selectedDID: activeDIDs[0].id,
							}
						}))
					}
					
					console.log('✅ Loaded tenant DIDs:', activeDIDs)
				} else {
					console.warn('⚠️ No DIDs found for tenant:', tenantId)
					toast({
						title: "No DIDs Found",
						description: "No active DIDs found for this tenant. Please create a DID first.",
						variant: "destructive",
					})
				}
			} catch (error) {
				console.error('❌ Failed to fetch tenant DIDs:', error)
				toast({
					title: "Error",
					description: "Failed to load tenant DID information",
					variant: "destructive",
				})
			} finally {
				setLoadingDIDs(false)
			}
		}

		if (tenantId) {
			fetchTenantDIDs()
		}
	}, [tenantId, toast])

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
						newErrors.issuerDID = 'Please select an issuer DID from tenant DIDs'
					}
				}
				break

			case 2: // Review Step
				// Only validate issuer DID if template doesn't have one
				if (!templateHasIssuerDID()) {
					const currentIssuerDID = getCurrentIssuerDID()
					if (!currentIssuerDID) {
						newErrors.issuerDID = 'Please select an issuer DID from tenant DIDs'
					}
				}
				break
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Event handlers
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
		console.log('🔄 Tenant wizard - issuer change:', issuerOptions)
		setWizardData((prev) => ({
			...prev,
			issuerOptions: {...issuerOptions}
		}))
		setErrors({})
	}

	const handleNext = () => {
		if (validateStep(currentStep)) {
			if (currentStep < STEPS.length - 1) {
				setCurrentStep(currentStep + 1)
			}
		} else {
			toast({
				title: "Validation Error",
				description: "Please fix the errors before proceeding",
				variant: "destructive",
			})
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
			toast({
				title: "Error",
				description: "No template selected",
				variant: "destructive",
			})
			return
		}

		// Determine issuer DID: priority to template, fallback to tenant DID selection
		let issuerDIDToUse: string
		if (templateHasIssuerDID()) {
			issuerDIDToUse = wizardData.selectedTemplate.issuerDID!
			console.log('🎯 Using issuer DID from template:', issuerDIDToUse)
		} else {
			const currentIssuerDID = getCurrentIssuerDID()
			if (!currentIssuerDID) {
				toast({
					title: "Error",
					description: "Please select an issuer DID from tenant DIDs",
					variant: "destructive",
				})
				return
			}
			issuerDIDToUse = currentIssuerDID
			console.log('🎯 Using issuer DID from tenant selection:', issuerDIDToUse)
		}

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
				// Add tenant context
				tenantId: tenantId,
			}

			console.log('📡 Issuing credential for tenant:', tenantId, requestPayload)

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
			
			toast({
				title: "Success",
				description: "Credential issued successfully for tenant!",
			})

			// Call onComplete callback
			if (onComplete) {
				onComplete({
					id: response.id,
					issuedAt: new Date().toISOString(),
					templateName: wizardData.selectedTemplate?.name || '',
					templateVersion: wizardData.selectedTemplate?.version || '',
					credentialTypes: [],
					credentialSubject: wizardData.credentialData,
					recipient: wizardData.recipientInfo.did || wizardData.recipientInfo.email || '',
					status: response.status,
					verifiableCredential: response.credential,
				} as IssuedCredential)
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to issue credential'
			setWizardData((prev) => ({
				...prev,
				isSuccess: false,
				error: errorMessage,
			}))
			setCurrentStep(3)
			
			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}

	// Convert tenant DIDs to format expected by DataEntryStep
	const convertTenantDIDsToFormat = () => {
		return tenantDIDs.map(did => ({
			id: did.id,
			did: did.id,
			method: did.document?.id || did.id,
			status: did.status as 'active' | 'inactive' | 'revoked',
			created: did.created_at,
			user_id: 'tenant-' + tenantId,
			identifier: did.id,
			document: {
				...did.document,
				'@context': did.document?.['@context'] || [],
			},
			created_at: did.created_at,
			updated_at: did.updated_at,
		}))
	}

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 0:
				return (
					<TemplateSelector
						selectedTemplate={wizardData.selectedTemplate}
						onTemplateSelect={(template) => handleTemplateSelect(template!)}
						showAnalytics={true}
					/>
				)

			case 1:
				if (!wizardData.selectedTemplate) {
					return <div className='p-4 text-center'>Please select a template first</div>
				}
				return (
					<DataEntryStep 
						template={wizardData.selectedTemplate} 
						credentialData={wizardData.credentialData} 
						recipientInfo={wizardData.recipientInfo} 
						issuanceOptions={wizardData.issuanceOptions} 
						issuerOptions={wizardData.issuerOptions} 
						availableDIDs={convertTenantDIDsToFormat() as DIDResponse[]} 
						templateHasIssuerDID={Boolean(templateHasIssuerDID())} 
						onDataChange={handleDataChange} 
						onRecipientChange={handleRecipientChange} 
						onOptionsChange={handleOptionsChange} 
						onIssuerChange={handleIssuerChange} 
						errors={errors} 
					/>
				)

			case 2:
				if (!wizardData.selectedTemplate) {
					return <div className='p-4 text-center'>Please select a template first</div>
				}
				return (
					<ReviewStep 
						template={wizardData.selectedTemplate} 
						credentialData={wizardData.credentialData} 
						recipientInfo={wizardData.recipientInfo} 
						issuanceOptions={wizardData.issuanceOptions} 
						issuerDID={getCurrentIssuerDID()} 
						onIssue={issueCredential} 
						onBack={handlePrevious} 
						isLoading={loading} 
					/>
				)

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
									selectedDID: tenantDIDs.length > 0 ? tenantDIDs[0].id : undefined,
								},
							})
							setErrors({})
						}}
					/>
				)

			default:
				return <div>Unknown step</div>
		}
	}

	if (loadingDIDs) {
		return (
			<div className={`space-y-4 ${className}`}>
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-muted-foreground">Loading tenant DID information...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Progress Steps */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Issue Credential for Tenant</span>
						<span className="text-sm text-muted-foreground">Tenant: {tenantId}</span>
					</CardTitle>
					<CardDescription>
						Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Progress value={(currentStep / (STEPS.length - 1)) * 100} className="h-2" />
						
						<div className="flex justify-between">
							{STEPS.map((step, index) => (
								<button
									key={step.id}
									onClick={() => handleStepClick(index)}
									disabled={!isStepAccessible(index)}
									className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
										isStepAccessible(index) 
											? 'hover:bg-muted cursor-pointer' 
											: 'cursor-not-allowed opacity-50'
									}`}
								>
									{getStepIcon(index)}
									<span className={`text-xs ${
										currentStep === index ? 'text-primary font-medium' : 'text-muted-foreground'
									}`}>
										{step.title}
									</span>
								</button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Step Content */}
			<Card>
				<CardContent className="p-6">
					{renderCurrentStep()}
				</CardContent>
			</Card>

			{/* Navigation */}
			{currentStep < 3 && (
				<Card>
					<CardContent className="flex justify-between p-4">
						<Button
							variant="outline"
							onClick={handlePrevious}
							disabled={currentStep === 0}
						>
							<ChevronLeft className="h-4 w-4 mr-2" />
							Previous
						</Button>

						<div className="flex gap-2">
							{onCancel && (
								<Button variant="ghost" onClick={onCancel}>
									Cancel
								</Button>
							)}
							
							{currentStep < 2 ? (
								<Button onClick={handleNext}>
									Next
									<ChevronRight className="h-4 w-4 ml-2" />
								</Button>
							) : (
								<Button 
									onClick={issueCredential} 
									disabled={loading || !validateStep(currentStep)}
								>
									{loading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Issuing...
										</>
									) : (
										<>
											<Send className="h-4 w-4 mr-2" />
											Issue Credential
										</>
									)}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
