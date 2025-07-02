'use client'

import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {AlertCircle, CheckCircle, FileText} from 'lucide-react'

/**
 * Template Analytics Test Component
 * Simple component to test if React hooks work correctly in analytics tab
 */
export function TemplateAnalyticsTest() {
	const [count, setCount] = React.useState(0)
	const [loading, setLoading] = React.useState(false)

	const handleTest = React.useCallback(async () => {
		setLoading(true)
		// Simulate async operation
		await new Promise(resolve => setTimeout(resolve, 1000))
		setCount(prev => prev + 1)
		setLoading(false)
	}, [])

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Template Analytics Test
					</CardTitle>
					<CardDescription>
						Testing React hooks in analytics tab
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-4">
						<Badge variant="outline">
							Test Count: {count}
						</Badge>
						{loading ? (
							<div className="flex items-center gap-2 text-yellow-600">
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
								<span>Testing...</span>
							</div>
						) : (
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-4 w-4" />
								<span>Ready</span>
							</div>
						)}
					</div>

					<Button onClick={handleTest} disabled={loading}>
						{loading ? 'Testing...' : 'Test React Hooks'}
					</Button>

					<div className="p-4 bg-muted rounded text-sm">
						<p className="font-semibold mb-2">React Hooks Status:</p>
						<ul className="space-y-1">
							<li className="flex items-center gap-2">
								<CheckCircle className="h-3 w-3 text-green-500" />
								useState working
							</li>
							<li className="flex items-center gap-2">
								<CheckCircle className="h-3 w-3 text-green-500" />
								useCallback working
							</li>
							<li className="flex items-center gap-2">
								<CheckCircle className="h-3 w-3 text-green-500" />
								Component renders correctly
							</li>
						</ul>
					</div>

					{count > 0 && (
						<div className="p-3 bg-green-50 border border-green-200 rounded">
							<p className="text-green-800 text-sm">
								✅ React hooks are working correctly! Test executed {count} time{count !== 1 ? 's' : ''}.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
