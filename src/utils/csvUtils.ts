/**
 * CSV Processing utilities for bulk credential issuance
 * Provides production-ready CSV validation, parsing, and template generation
 */

export interface CSVValidationResult {
	valid: boolean
	errors: string[]
	warnings: string[]
	rowCount: number
	validRowCount: number
}

export interface CSVRecipient {
	recipientDid?: string
	recipientEmail?: string
	credentialSubject: Record<string, unknown>
	customClaims?: Record<string, unknown>
}

/**
 * CSV Template structure for bulk credential issuance
 */
export const CSV_HEADERS = [
	'recipientDid',
	'recipientEmail',
	'name',
	'position',
	'organization',
	'department',
	'email',
	'phone',
	'customClaim1',
	'customClaim2',
	'notes',
] as const

/**
 * Generate CSV template for bulk credential issuance
 */
export function generateCSVTemplate(): string {
	const headers = CSV_HEADERS.join(',')
	const example = [
		'did:example:recipient1',
		'john.doe@example.com',
		'John Doe',
		'Software Engineer',
		'Tech Corp',
		'Engineering',
		'john.doe@techcorp.com',
		'+1-555-0123',
		'Senior Level',
		'Full-time',
		'High performer',
	].join(',')

	return [headers, example].join('\\n')
}

/**
 * Validate CSV file before processing
 */
export async function validateCSVFile(file: File): Promise<CSVValidationResult> {
	const errors: string[] = []
	const warnings: string[] = []
	let rowCount = 0
	let validRowCount = 0

	try {
		// Check file size (max 10MB)
		const maxSize = 10 * 1024 * 1024 // 10MB
		if (file.size > maxSize) {
			errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (10MB)`)
		}

		// Check file type
		if (!file.name.toLowerCase().endsWith('.csv')) {
			errors.push('File must have a .csv extension')
		}

		if (file.type && !file.type.includes('csv') && !file.type.includes('text')) {
			warnings.push('File MIME type is not CSV - proceeding with caution')
		}

		// Read and parse CSV content
		const text = await file.text()
		const lines = text.split('\\n').filter(line => line.trim())

		if (lines.length === 0) {
			errors.push('CSV file is empty')
			return { valid: false, errors, warnings, rowCount: 0, validRowCount: 0 }
		}

		rowCount = lines.length - 1 // Exclude header

		// Validate headers
		const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
		const requiredHeaders = ['recipientdid', 'recipientemail']
		const hasRequiredHeader = requiredHeaders.some(req =>
			headers.some(h => h.includes(req.replace('recipient', '')))
		)

		if (!hasRequiredHeader) {
			errors.push('CSV must contain at least one of: recipientDid, recipientEmail columns')
		}

		// Validate data rows
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim()
			if (!line) continue

			const columns = line.split(',').map(col => col.trim())

			// Check column count
			if (columns.length !== headers.length) {
				warnings.push(`Row ${i}: Column count mismatch (expected ${headers.length}, got ${columns.length})`)
			}

			// Check for required data
			const recipientDidIndex = headers.findIndex(h => h.includes('did'))
			const recipientEmailIndex = headers.findIndex(h => h.includes('email'))

			const hasRecipientId = (recipientDidIndex >= 0 && columns[recipientDidIndex]?.trim()) ||
				(recipientEmailIndex >= 0 && columns[recipientEmailIndex]?.trim())

			if (!hasRecipientId) {
				warnings.push(`Row ${i}: Missing recipient identifier (DID or email)`)
			} else {
				validRowCount++
			}

			// Validate email format if present
			if (recipientEmailIndex >= 0 && columns[recipientEmailIndex]) {
				const email = columns[recipientEmailIndex].trim()
				const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
				if (email && !emailRegex.test(email)) {
					warnings.push(`Row ${i}: Invalid email format: ${email}`)
				}
			}

			// Validate DID format if present
			if (recipientDidIndex >= 0 && columns[recipientDidIndex]) {
				const did = columns[recipientDidIndex].trim()
				if (did && !did.startsWith('did:')) {
					warnings.push(`Row ${i}: Invalid DID format: ${did}`)
				}
			}
		}

		// Check minimum valid rows
		if (validRowCount === 0) {
			errors.push('No valid rows found in CSV file')
		}

		// Check maximum rows (limit for performance)
		const maxRows = 1000
		if (rowCount > maxRows) {
			errors.push(`Too many rows (${rowCount}). Maximum allowed is ${maxRows}`)
		}

	} catch (error) {
		errors.push(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		rowCount,
		validRowCount,
	}
}

/**
 * Parse CSV file into recipients array
 */
export async function parseCSVFile(file: File): Promise<CSVRecipient[]> {
	const text = await file.text()
	const lines = text.split('\\n').filter(line => line.trim())

	if (lines.length < 2) {
		throw new Error('CSV file must contain at least header row and one data row')
	}

	const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
	const recipients: CSVRecipient[] = []

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		const columns = line.split(',').map(col => col.trim())
		const recipient: CSVRecipient = {
			credentialSubject: {},
			customClaims: {},
		}

		// Map columns to recipient fields
		headers.forEach((header, index) => {
			const value = columns[index]?.trim()
			if (!value) return

			switch (header) {
				case 'recipientdid':
				case 'recipient_did':
				case 'did':
					recipient.recipientDid = value
					break
				case 'recipientemail':
				case 'recipient_email':
				case 'email':
					recipient.recipientEmail = value
					break
				case 'name':
				case 'fullname':
				case 'full_name':
					recipient.credentialSubject.name = value
					break
				case 'position':
				case 'title':
				case 'job_title':
					recipient.credentialSubject.position = value
					break
				case 'organization':
				case 'company':
				case 'org':
					recipient.credentialSubject.organization = value
					break
				case 'department':
				case 'dept':
					recipient.credentialSubject.department = value
					break
				case 'phone':
				case 'telephone':
					recipient.credentialSubject.phone = value
					break
				default:
					// Handle custom claims
					if (header.startsWith('customclaim') || header.startsWith('custom_claim')) {
						if (!recipient.customClaims) recipient.customClaims = {}
						recipient.customClaims[header] = value
					} else {
						// Add to credential subject as generic field
						recipient.credentialSubject[header] = value
					}
					break
			}
		})

		// Only add recipients with valid identifiers
		if (recipient.recipientDid || recipient.recipientEmail) {
			recipients.push(recipient)
		}
	}

	return recipients
}

/**
 * Download CSV template file
 */
export function downloadCSVTemplate(): string {
	return generateCSVTemplate()
}

/**
 * Validate recipient data before processing
 */
export function validateRecipient(recipient: CSVRecipient): { valid: boolean; errors: string[] } {
	const errors: string[] = []

	// Check for required identifier
	if (!recipient.recipientDid && !recipient.recipientEmail) {
		errors.push('Recipient must have either DID or email')
	}

	// Validate email format
	if (recipient.recipientEmail) {
		const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
		if (!emailRegex.test(recipient.recipientEmail)) {
			errors.push('Invalid email format')
		}
	}

	// Validate DID format
	if (recipient.recipientDid) {
		if (!recipient.recipientDid.startsWith('did:')) {
			errors.push('Invalid DID format - must start with "did:"')
		}
	}

	// Check for minimum credential subject data
	if (!recipient.credentialSubject || Object.keys(recipient.credentialSubject).length === 0) {
		errors.push('Credential subject cannot be empty')
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Batch process recipients for optimal performance
 */
export function batchRecipients<T>(items: T[], batchSize: number = 50): T[][] {
	const batches: T[][] = []
	for (let i = 0; i < items.length; i += batchSize) {
		batches.push(items.slice(i, i + batchSize))
	}
	return batches
}

/**
 * Export results to CSV format
 */
export function exportResultsToCSV(results: {
	successes: Array<{ recipientDid?: string; recipientEmail?: string; credentialId: string }>
	failures: Array<{ recipientDid?: string; recipientEmail?: string; error: string }>
}): string {
	const headers = ['RecipientDID', 'RecipientEmail', 'Status', 'CredentialID', 'Error']
	const rows: string[] = [headers.join(',')]

	// Add successful issuances
	results.successes.forEach(success => {
		const row = [
			success.recipientDid || '',
			success.recipientEmail || '',
			'Success',
			success.credentialId,
			'',
		]
		rows.push(row.map(cell => `"${cell}"`).join(','))
	})

	// Add failures
	results.failures.forEach(failure => {
		const row = [
			failure.recipientDid || '',
			failure.recipientEmail || '',
			'Failed',
			'',
			failure.error,
		]
		rows.push(row.map(cell => `"${cell}"`).join(','))
	})

	return rows.join('\\n')
}
