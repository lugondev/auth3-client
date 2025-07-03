'use client'

import React, {useState, useCallback} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	BarChart3,
	Users,
	FileText,
	TrendingUp,
	Download,
	Upload,
} from 'lucide-react'

import {CredentialTemplate} from '@/types/template'
import {TemplateSelector} from '@/components/credentials/templates/TemplateSelector'
import {TemplateAnalytics} from '@/components/credentials/templates/TemplateAnalytics'
import {SimpleTemplateAnalytics} from '@/components/credentials/templates/SimpleTemplateAnalytics'
import {BulkTemplateIssuance} from '@/components/credentials/templates/BulkTemplateIssuance'
import {ErrorBoundary} from '@/components/ui/error-boundary'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'

/**
 * Enhanced Template Management Page
 * 
 * Features:
 * - Template selection with analytics
 * - Bulk credential issuance
 * - Template performance analytics
 * - Usage insights and reporting
 */
export default function EnhancedTemplateManagementPage() {
	const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate>()
	const [selectedTemplatesForBulk, setSelectedTemplatesForBulk] = useState<CredentialTemplate[]>([])
	const [showBulkIssuanceModal, setShowBulkIssuanceModal] = useState(false)
	const [activeTab, setActiveTab] = useState<'selector' | 'analytics' | 'bulk'>('selector')
	const [useSimpleAnalytics, setUseSimpleAnalytics] = useState(
		process.env.NODE_ENV === 'development' || 
		process.env.NEXT_PUBLIC_USE_SIMPLE_ANALYTICS === 'true'
	)

	const handleTemplateSelect = useCallback((template: CredentialTemplate | null) => {
		setSelectedTemplate(template || undefined)
	}, [])

	const handleBulkSelectionChange = useCallback((templates: CredentialTemplate[]) => {
		setSelectedTemplatesForBulk(templates)
	}, [])

	const handleBulkIssuanceComplete = useCallback((results: any) => {
		setShowBulkIssuanceModal(false)
		setSelectedTemplatesForBulk([])
		// Could show results in a toast or redirect to results page
	}, [])

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Enhanced Template Management</h1>
					<p className="text-muted-foreground">
						Advanced template selection, analytics, and bulk credential issuance
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setShowBulkIssuanceModal(true)}
						disabled={selectedTemplatesForBulk.length === 0}
					>
						<Users className="h-4 w-4 mr-2" />
						Bulk Issue ({selectedTemplatesForBulk.length})
					</Button>
				</div>
			</div>

			{/* Main Tabs */}
			<Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="selector" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Template Selector
					</TabsTrigger>
					<TabsTrigger value="analytics" className="flex items-center gap-2">
						<BarChart3 className="h-4 w-4" />
						Analytics
					</TabsTrigger>
					<TabsTrigger value="bulk" className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						Bulk Operations
					</TabsTrigger>
				</TabsList>

				{/* Enhanced Template Selector */}
				<TabsContent value="selector" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Enhanced Template Selector</CardTitle>
							<CardDescription>
								Select templates with advanced analytics and bulk selection capabilities
							</CardDescription>
						</CardHeader>
						<CardContent>
							<TemplateSelector
								selectedTemplate={selectedTemplate}
								onTemplateSelect={handleTemplateSelect}
								showAnalytics={true}
								enableBulkSelection={true}
								selectedTemplates={selectedTemplatesForBulk}
								onBulkSelectionChange={handleBulkSelectionChange}
							/>
						</CardContent>
					</Card>

					{/* Selected Template Details */}
					{selectedTemplate && (
						<Card>
							<CardHeader>
								<CardTitle>Selected Template Details</CardTitle>
								<CardDescription>
									Information about the selected template
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<h4 className="font-semibold">Basic Information</h4>
										<p><strong>Name:</strong> {selectedTemplate.name}</p>
										<p><strong>Description:</strong> {selectedTemplate.description}</p>
										<p><strong>Version:</strong> {selectedTemplate.version}</p>
										<p><strong>Active:</strong> {selectedTemplate.active ? 'Yes' : 'No'}</p>
									</div>
									<div className="space-y-2">
										<h4 className="font-semibold">Technical Details</h4>
										<p><strong>Types:</strong> {selectedTemplate.type.join(', ')}</p>
										<p><strong>Tags:</strong> {selectedTemplate.tags.join(', ') || 'None'}</p>
										<p><strong>Issuer DID:</strong> {selectedTemplate.issuerDID || 'Not specified'}</p>
										<p><strong>Created:</strong> {new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
									</div>
								</div>

								{/* Schema Preview */}
								<div className="mt-4">
									<h4 className="font-semibold mb-2">Schema Fields</h4>
									<div className="bg-muted p-3 rounded text-sm">
										<pre>{JSON.stringify(selectedTemplate.schema, null, 2)}</pre>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Template Analytics */}
				<TabsContent value="analytics" className="space-y-6">
					<ErrorBoundary fallback={<SimpleTemplateAnalytics />}>
						{useSimpleAnalytics ? (
							<SimpleTemplateAnalytics />
						) : (
							<TemplateAnalytics
								selectedTemplate={selectedTemplate}
								onTemplateSelect={(template) => {
									setSelectedTemplate(template)
									setActiveTab('selector')
								}}
							/>
						)}
					</ErrorBoundary>
				</TabsContent>

				{/* Bulk Operations */}
				<TabsContent value="bulk" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Bulk Template Operations</CardTitle>
							<CardDescription>
								Perform bulk operations on selected templates
							</CardDescription>
						</CardHeader>
						<CardContent>
							{selectedTemplatesForBulk.length === 0 ? (
								<div className="text-center py-8">
									<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-semibold mb-2">No Templates Selected</h3>
									<p className="text-muted-foreground mb-4">
										Switch to the Template Selector tab and enable bulk selection to choose templates for bulk operations.
									</p>
									<Button
										variant="outline"
										onClick={() => setActiveTab('selector')}
									>
										<FileText className="h-4 w-4 mr-2" />
										Go to Template Selector
									</Button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-semibold">
											Selected Templates ({selectedTemplatesForBulk.length})
										</h4>
										<Button
											variant="outline"
											onClick={() => setSelectedTemplatesForBulk([])}
										>
											Clear Selection
										</Button>
									</div>

									{/* Selected Templates List */}
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
										{selectedTemplatesForBulk.map((template) => (
											<Card key={template.id} className="p-3">
												<h5 className="font-medium text-sm truncate" title={template.name}>
													{template.name}
												</h5>
												<p className="text-xs text-muted-foreground truncate" title={template.description}>
													{template.description}
												</p>
												<div className="flex gap-1 mt-2">
													{template.type.slice(0, 2).map((type) => (
														<span
															key={type}
															className="text-xs bg-muted px-1 py-0.5 rounded"
														>
															{type}
														</span>
													))}
													{template.type.length > 2 && (
														<span className="text-xs text-muted-foreground">
															+{template.type.length - 2}
														</span>
													)}
												</div>
											</Card>
										))}
									</div>

									{/* Bulk Operations */}
									<div className="border-t pt-4">
										<h4 className="font-semibold mb-3">Available Operations</h4>
										<div className="flex gap-2 flex-wrap">
											<Button onClick={() => setShowBulkIssuanceModal(true)}>
												<Users className="h-4 w-4 mr-2" />
												Bulk Credential Issuance
											</Button>
											<Button variant="outline" disabled>
												<Download className="h-4 w-4 mr-2" />
												Export Templates
											</Button>
											<Button variant="outline" disabled>
												<TrendingUp className="h-4 w-4 mr-2" />
												Generate Analytics Report
											</Button>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Bulk Issuance Modal */}
			<Dialog open={showBulkIssuanceModal} onOpenChange={setShowBulkIssuanceModal}>
				<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Bulk Template-based Credential Issuance</DialogTitle>
						<DialogDescription>
							Issue credentials to multiple recipients using selected templates
						</DialogDescription>
					</DialogHeader>
					<BulkTemplateIssuance
						selectedTemplates={selectedTemplatesForBulk}
						onComplete={handleBulkIssuanceComplete}
						onCancel={() => setShowBulkIssuanceModal(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
