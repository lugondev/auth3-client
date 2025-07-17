'use client'

import {useState} from 'react'
import {Link2, AlertCircle, CheckCircle} from 'lucide-react'
import {toast} from 'sonner'

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Alert, AlertDescription} from '@/components/ui/alert'

// Interface for raw credential data during import
interface RawCredentialData {
	'@context'?: string[] | Record<string, unknown>
	id?: string
	type?: string[]
	issuer?: string | {id: string; name?: string}
	issuanceDate?: string
	expirationDate?: string
	credentialSubject?: Record<string, unknown>
	proof?: Record<string, unknown>
	[key: string]: unknown // Allow additional fields during import
}

interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
}

interface ImportCredentialModalProps {
	isOpen: boolean
	onClose: () => void
	onImport: (credentialData: RawCredentialData, source?: string) => Promise<void>
}

/**
 * ImportCredentialModal Component - Allows users to import credentials from various sources
 *
 * Features:
 * - Import from JSON file upload
 * - Import from JSON text paste
 * - Import from URL
 * - Credential validation before import
 */
export function ImportCredentialModal({isOpen, onClose, onImport}: ImportCredentialModalProps) {
	const [loading, setLoading] = useState(false)
	const [jsonText, setJsonText] = useState('')
	const [url, setUrl] = useState('')
	const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

	// Reset state when modal closes
	const handleClose = () => {
		setJsonText('')
		setUrl('')
		setValidationResult(null)
		onClose()
	}

	// Validate credential JSON structure
	const validateCredential = (credentialData: RawCredentialData): ValidationResult => {
		const errors: string[] = []
		const warnings: string[] = []

		// Check required W3C VC fields
		if (!credentialData['@context']) {
			errors.push('Missing @context field')
		}
		if (!credentialData.type || !Array.isArray(credentialData.type)) {
			errors.push('Missing or invalid type field')
		}
		if (!credentialData.issuer) {
			errors.push('Missing issuer field')
		}
		if (!credentialData.credentialSubject) {
			errors.push('Missing credentialSubject field')
		}
		if (!credentialData.issuanceDate) {
			errors.push('Missing issuanceDate field')
		}

		// Check for warnings
		if (!credentialData.id) {
			warnings.push('No credential ID found - one will be generated')
		}
		if (!credentialData.proof) {
			warnings.push('No cryptographic proof found - credential may not be verifiable')
		}
		if (credentialData.expirationDate && new Date(credentialData.expirationDate) < new Date()) {
			warnings.push('Credential appears to be expired')
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		}
	}

	// Handle file upload
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			const text = await file.text()
			const credentialData = JSON.parse(text)
			const validation = validateCredential(credentialData)
			setValidationResult(validation)
			setJsonText(JSON.stringify(credentialData, null, 2))
		} catch {
			toast.error('Invalid JSON file')
			setValidationResult({
				isValid: false,
				errors: ['Invalid JSON format'],
				warnings: [],
			})
		}
	}

	// Handle JSON text validation
	const handleJsonValidation = () => {
		if (!jsonText.trim()) {
			setValidationResult(null)
			return
		}

		try {
			const credentialData = JSON.parse(jsonText)
			const validation = validateCredential(credentialData)
			setValidationResult(validation)
		} catch {
			setValidationResult({
				isValid: false,
				errors: ['Invalid JSON format'],
				warnings: [],
			})
		}
	}

	// Handle URL import
	const handleUrlImport = async () => {
		if (!url.trim()) {
			toast.error('Please enter a URL')
			return
		}

		setLoading(true)
		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			const credentialData = await response.json()
			const validation = validateCredential(credentialData)
			setValidationResult(validation)
			setJsonText(JSON.stringify(credentialData, null, 2))
			toast.success('Credential fetched from URL')
		} catch (error) {
			console.error('Error fetching credential from URL:', error)
			toast.error('Failed to fetch credential from URL')
			setValidationResult({
				isValid: false,
				errors: ['Failed to fetch or parse credential from URL'],
				warnings: [],
			})
		} finally {
			setLoading(false)
		}
	}

	// Handle import submission
	const handleImport = async () => {
		if (!jsonText.trim()) {
			toast.error('Please provide credential data')
			return
		}

		if (!validationResult?.isValid) {
			toast.error('Please fix validation errors before importing')
			return
		}

		setLoading(true)
		try {
			const credentialData = JSON.parse(jsonText)
			const source = url ? `URL: ${url}` : 'Manual import'
			await onImport(credentialData, source)
			handleClose()
		} catch (error) {
			console.error('Error importing credential:', error)
			toast.error('Failed to import credential')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Import Credential</DialogTitle>
					<DialogDescription>Import a verifiable credential from various sources. The credential will be validated before being added to your wallet.</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue='file' className='w-full'>
					<TabsList className='grid w-full grid-cols-3'>
						<TabsTrigger value='file'>File Upload</TabsTrigger>
						<TabsTrigger value='text'>JSON Text</TabsTrigger>
						<TabsTrigger value='url'>From URL</TabsTrigger>
					</TabsList>

					<TabsContent value='file' className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='credential-file'>Select Credential File</Label>
							<Input id='credential-file' type='file' accept='.json,application/json' onChange={handleFileUpload} className='cursor-pointer' />
							<p className='text-sm text-muted-foreground'>Upload a JSON file containing the verifiable credential</p>
						</div>
					</TabsContent>

					<TabsContent value='text' className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='credential-json'>Credential JSON</Label>
							<Textarea id='credential-json' placeholder='Paste the credential JSON here...' value={jsonText} onChange={(e) => setJsonText(e.target.value)} onBlur={handleJsonValidation} className='min-h-[200px] font-mono text-sm' />
							<Button onClick={handleJsonValidation} variant='outline' size='sm'>
								Validate JSON
							</Button>
						</div>
					</TabsContent>

					<TabsContent value='url' className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='credential-url'>Credential URL</Label>
							<div className='flex gap-2'>
								<Input id='credential-url' type='url' placeholder='https://example.com/credential.json' value={url} onChange={(e) => setUrl(e.target.value)} />
								<Button onClick={handleUrlImport} disabled={loading} variant='outline'>
									<Link2 className='h-4 w-4 mr-2' />
									Fetch
								</Button>
							</div>
							<p className='text-sm text-muted-foreground'>Enter a URL that serves a verifiable credential in JSON format</p>
						</div>
					</TabsContent>
				</Tabs>

				{/* Validation Results */}
				{validationResult && (
					<div className='space-y-2'>
						{validationResult.isValid ? (
							<Alert className='border-green-200 bg-green-50'>
								<CheckCircle className='h-4 w-4 text-green-600' />
								<AlertDescription className='text-green-800'>Credential structure is valid and ready to import</AlertDescription>
							</Alert>
						) : (
							<Alert variant='destructive'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>
									<div className='space-y-1'>
										<div className='font-medium'>Validation Errors:</div>
										{validationResult.errors.map((error, index) => (
											<div key={index} className='text-sm'>
												• {error}
											</div>
										))}
									</div>
								</AlertDescription>
							</Alert>
						)}

						{validationResult.warnings.length > 0 && (
							<Alert className='border-yellow-200 bg-yellow-50'>
								<AlertCircle className='h-4 w-4 text-yellow-600' />
								<AlertDescription className='text-yellow-800'>
									<div className='space-y-1'>
										<div className='font-medium'>Warnings:</div>
										{validationResult.warnings.map((warning, index) => (
											<div key={index} className='text-sm'>
												• {warning}
											</div>
										))}
									</div>
								</AlertDescription>
							</Alert>
						)}
					</div>
				)}

				{/* Preview */}
				{jsonText && validationResult?.isValid && (
					<div className='space-y-2'>
						<Label>Credential Preview</Label>
						<pre className='pre-code-json'>{JSON.stringify(JSON.parse(jsonText), null, 2)}</pre>
					</div>
				)}

				{/* Actions */}
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleImport} disabled={!validationResult?.isValid || loading}>
						{loading ? 'Importing...' : 'Import Credential'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
