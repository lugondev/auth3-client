'use client'

import React, {useState} from 'react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {BarChart3, FileText} from 'lucide-react'

import {CredentialTemplate} from '@/types/template'
import {TemplateManager} from '@/components/credentials/templates'
import {TemplateAnalytics} from '@/components/credentials/templates/TemplateAnalytics'
import {SimpleTemplateAnalytics} from '@/components/credentials/templates/SimpleTemplateAnalytics'
import {ErrorBoundary} from '@/components/ui/error-boundary'

export default function CredentialTemplatesPage() {
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate>()
	const [activeTab, setActiveTab] = useState<'management' | 'analytics'>('management')
	const [useSimpleAnalytics] = useState(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_SIMPLE_ANALYTICS === 'true')

	return (
		<div className='container mx-auto py-6'>
			<div className='space-y-6'>
				{/* Header */}
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Credential Templates</h1>
					<p className='text-muted-foreground'>Manage your verifiable credential templates and analytics</p>
				</div>

				{/* Main Tabs */}
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'management' | 'analytics')}>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='management' className='flex items-center gap-2'>
							<FileText className='h-4 w-4' />
							Template Management
						</TabsTrigger>
						<TabsTrigger value='analytics' className='flex items-center gap-2'>
							<BarChart3 className='h-4 w-4' />
							Analytics
						</TabsTrigger>
					</TabsList>

					{/* Template Management */}
					<TabsContent value='management' className='space-y-6'>
						<TemplateManager />
					</TabsContent>

					{/* Template Analytics */}
					<TabsContent value='analytics' className='space-y-6'>
						<ErrorBoundary fallback={<SimpleTemplateAnalytics />}>
							{useSimpleAnalytics ? (
								<SimpleTemplateAnalytics />
							) : (
								<TemplateAnalytics
									selectedTemplate={selectedTemplate}
									onTemplateSelect={(template) => {
										setSelectedTemplate(template)
										setActiveTab('management')
									}}
								/>
							)}
						</ErrorBoundary>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
