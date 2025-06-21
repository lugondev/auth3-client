'use client'

import React from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Copy, Download, ExternalLink} from 'lucide-react'
import {toast} from 'sonner'

import {CredentialTemplate, JSONValue} from '@/types/template'

interface TemplatePreviewProps {
	template: CredentialTemplate
	onExport?: () => void
	onClose?: () => void
}

export function TemplatePreview({template, onExport, onClose}: TemplatePreviewProps) {
	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(`${label} copied to clipboard`)
		} catch {
			toast.error('Failed to copy to clipboard')
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString()
	}

	const renderJSONValue = (value: JSONValue, depth = 0): React.ReactNode => {
		if (value === null) return <span className='text-muted-foreground'>null</span>
		if (typeof value === 'boolean') return <span className='text-blue-600'>{value.toString()}</span>
		if (typeof value === 'number') return <span className='text-green-600'>{value}</span>
		if (typeof value === 'string') return <span className='text-orange-600'>"{value}"</span>

		if (Array.isArray(value)) {
			if (value.length === 0) return <span>[]</span>
			return (
				<div className={`${depth > 0 ? 'ml-4' : ''}`}>
					<span>[</span>
					{value.map((item, index) => (
						<div key={index} className='ml-4'>
							{renderJSONValue(item, depth + 1)}
							{index < value.length - 1 && <span>,</span>}
						</div>
					))}
					<span>]</span>
				</div>
			)
		}

		if (typeof value === 'object' && value !== null) {
			const entries = Object.entries(value)
			if (entries.length === 0) return <span>{'{}'}</span>

			return (
				<div className={`${depth > 0 ? 'ml-4' : ''}`}>
					<span>{'{'}</span>
					{entries.map(([key, val], index) => (
						<div key={key} className='ml-4'>
							<span className='text-purple-600'>"{key}"</span>: {renderJSONValue(val, depth + 1)}
							{index < entries.length - 1 && <span>,</span>}
						</div>
					))}
					<span>{'}'}</span>
				</div>
			)
		}

		return <span>{String(value)}</span>
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-start justify-between'>
				<div>
					<h2 className='text-2xl font-bold'>{template.name}</h2>
					<p className='text-muted-foreground mt-1'>{template.description}</p>
				</div>
				<div className='flex gap-2'>
					{onExport && (
						<Button onClick={onExport} variant='outline' size='sm'>
							<Download className='h-4 w-4 mr-2' />
							Export
						</Button>
					)}
					{onClose && (
						<Button onClick={onClose} variant='outline' size='sm'>
							Close
						</Button>
					)}
				</div>
			</div>

			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<h4 className='font-medium text-sm'>Template ID</h4>
							<div className='flex items-center gap-2'>
								<code className='text-sm bg-muted px-2 py-1 rounded'>{template.id}</code>
								<Button variant='ghost' size='sm' onClick={() => copyToClipboard(template.id, 'Template ID')}>
									<Copy className='h-3 w-3' />
								</Button>
							</div>
						</div>
						<div>
							<h4 className='font-medium text-sm'>Version</h4>
							<Badge variant='outline'>{template.version}</Badge>
						</div>
						<div>
							<h4 className='font-medium text-sm'>Status</h4>
							<Badge variant={template.active ? 'default' : 'secondary'}>{template.active ? 'Active' : 'Inactive'}</Badge>
						</div>
						{template.issuerDID && (
							<div>
								<h4 className='font-medium text-sm'>Issuer DID</h4>
								<div className='flex items-center gap-2'>
									<code className='text-sm bg-muted px-2 py-1 rounded truncate flex-1'>{template.issuerDID}</code>
									<Button variant='ghost' size='sm' onClick={() => copyToClipboard(template.issuerDID!, 'Issuer DID')}>
										<Copy className='h-3 w-3' />
									</Button>
								</div>
							</div>
						)}
						<div>
							<h4 className='font-medium text-sm'>User ID</h4>
							<div className='flex items-center gap-2'>
								<code className='text-sm bg-muted px-2 py-1 rounded truncate flex-1'>{template.userID}</code>
								<Button variant='ghost' size='sm' onClick={() => copyToClipboard(template.userID, 'User ID')}>
									<Copy className='h-3 w-3' />
								</Button>
							</div>
						</div>
						<div>
							<h4 className='font-medium text-sm'>Created</h4>
							<p className='text-sm text-muted-foreground'>{formatDate(template.createdAt)}</p>
						</div>
						<div>
							<h4 className='font-medium text-sm'>Updated</h4>
							<p className='text-sm text-muted-foreground'>{formatDate(template.updatedAt)}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Credential Types */}
			<Card>
				<CardHeader>
					<CardTitle>Credential Types</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-2'>
						{template.type.map((type, index) => (
							<Badge key={index} variant='secondary'>
								{type}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			{/* JSON-LD Contexts */}
			<Card>
				<CardHeader>
					<CardTitle>JSON-LD Contexts</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						{template['@context'].map((context, index) => (
							<div key={index} className='flex items-center gap-2'>
								<code className='text-sm bg-muted px-2 py-1 rounded flex-1'>{context}</code>
								<Button variant='ghost' size='sm' onClick={() => copyToClipboard(context, 'Context URL')}>
									<Copy className='h-3 w-3' />
								</Button>
								{context.startsWith('http') && (
									<Button variant='ghost' size='sm' onClick={() => window.open(context, '_blank')}>
										<ExternalLink className='h-3 w-3' />
									</Button>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Tags */}
			{template.tags && template.tags.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Tags</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex flex-wrap gap-2'>
							{template.tags.map((tag, index) => (
								<Badge key={index} variant='default'>
									{tag}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Schema */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>Credential Schema</CardTitle>
						<Button variant='outline' size='sm' onClick={() => copyToClipboard(JSON.stringify(template.schema, null, 2), 'Schema')}>
							<Copy className='h-4 w-4 mr-2' />
							Copy Schema
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className='bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto'>{renderJSONValue(template.schema)}</div>
				</CardContent>
			</Card>

			{/* Metadata */}
			{template.metadata && Object.keys(template.metadata).length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Metadata</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto'>{renderJSONValue(template.metadata)}</div>
					</CardContent>
				</Card>
			)}

			{/* Sample Credential Structure */}
			<Card>
				<CardHeader>
					<CardTitle>Sample Credential Structure</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto'>
						<pre>
							{JSON.stringify(
								{
									'@context': template['@context'],
									'type': template.type,
									'issuer': template.issuerDID,
									'issuanceDate': new Date().toISOString(),
									'credentialSubject': {
										'id': 'did:example:subject123',
										'...': 'credential data matching schema',
									},
									'proof': {
										'type': 'Ed25519Signature2020',
										'created': new Date().toISOString(),
										'verificationMethod': `${template.issuerDID}#key-1`,
										'proofPurpose': 'assertionMethod',
										'proofValue': '...',
									},
								},
								null,
								2,
							)}
						</pre>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
