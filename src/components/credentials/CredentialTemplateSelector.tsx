'use client'

import {TemplateSelector} from './templates/TemplateSelector'
import type {CredentialTemplate} from '@/types/template'

interface CredentialTemplateSelectorProps {
	templates?: CredentialTemplate[]
	selectedTemplate?: CredentialTemplate
	onSelectTemplate: (template: CredentialTemplate | null) => void
	onCreateCustom: () => void
	className?: string
}

/**
 * CredentialTemplateSelector Component - Wrapper for the enhanced TemplateSelector
 * 
 * This component provides backward compatibility while leveraging the new
 * optimized TemplateSelector with all its enhanced features.
 */
export function CredentialTemplateSelector({
	selectedTemplate,
	onSelectTemplate,
	onCreateCustom,
	className = ''
}: CredentialTemplateSelectorProps) {
	return (
		<TemplateSelector
			selectedTemplate={selectedTemplate}
			onTemplateSelect={onSelectTemplate}
			onCreateCustom={onCreateCustom}
			className={className}
			showAnalytics={false}
			enableBulkSelection={false}
			viewMode="grid"
			compactMode={false}
		/>
	)
}
