'use client'

import React from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {
	BarChart3,
	Users,
	FileText,
	TrendingUp,
	Download,
	Upload,
	Settings,
	Search,
	Filter,
	Star,
	Clock,
	Activity,
	PlusCircle,
	Folder,
	Tags,
	Eye,
} from 'lucide-react'

interface TemplateSidebarProps {
	activeTab: 'selector' | 'analytics' | 'bulk'
	onTabChange: (tab: 'selector' | 'analytics' | 'bulk') => void
	selectedTemplateCount: number
	totalTemplates?: number
	className?: string
}

/**
 * Template Management Sidebar Component
 * 
 * Features:
 * - Quick navigation between sections
 * - Template statistics overview
 * - Quick actions and shortcuts
 * - Recent activity summary
 * - Filter and search shortcuts
 */
export function TemplateSidebar({
	activeTab,
	onTabChange,
	selectedTemplateCount,
	totalTemplates = 0,
	className = '',
}: TemplateSidebarProps) {
	const navigationItems = [
		{
			id: 'selector' as const,
			label: 'Template Selector',
			icon: FileText,
			description: 'Browse and select templates',
			badge: totalTemplates > 0 ? totalTemplates.toString() : null,
		},
		{
			id: 'analytics' as const,
			label: 'Analytics',
			icon: BarChart3,
			description: 'Performance insights',
			badge: null,
		},
		{
			id: 'bulk' as const,
			label: 'Bulk Operations',
			icon: Users,
			description: 'Batch processing',
			badge: selectedTemplateCount > 0 ? selectedTemplateCount.toString() : null,
		},
	]

	const quickActions = [
		{
			label: 'Create Template',
			icon: PlusCircle,
			action: () => console.log('Create template'),
			variant: 'default' as const,
		},
		{
			label: 'Import Templates',
			icon: Upload,
			action: () => console.log('Import templates'),
			variant: 'outline' as const,
		},
		{
			label: 'Export Data',
			icon: Download,
			action: () => console.log('Export data'),
			variant: 'outline' as const,
		},
	]

	const filterShortcuts = [
		{
			label: 'All Templates',
			icon: Folder,
			count: totalTemplates,
		},
		{
			label: 'Popular',
			icon: Star,
			count: Math.floor(totalTemplates * 0.3),
		},
		{
			label: 'Recent',
			icon: Clock,
			count: Math.floor(totalTemplates * 0.2),
		},
		{
			label: 'Active',
			icon: Activity,
			count: Math.floor(totalTemplates * 0.8),
		},
	]

	const recentActivity = [
		{
			action: 'Template created',
			name: 'Education Certificate v2.1',
			time: '2 hours ago',
			icon: PlusCircle,
		},
		{
			action: 'Bulk issuance completed',
			name: '245 credentials issued',
			time: '5 hours ago',
			icon: Users,
		},
		{
			action: 'Template updated',
			name: 'Employment Badge',
			time: '1 day ago',
			icon: Settings,
		},
	]

	return (
		<div className={`w-80 space-y-6 ${className}`}>
			{/* Navigation */}
			<Card>
				<CardContent className="p-4">
					<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
						Navigation
					</h3>
					<div className="space-y-2">
						{navigationItems.map((item) => {
							const Icon = item.icon
							const isActive = activeTab === item.id
							
							return (
								<Button
									key={item.id}
									variant={isActive ? 'default' : 'ghost'}
									className={`w-full justify-start h-auto p-3 ${
										isActive ? 'bg-primary text-primary-foreground' : ''
									}`}
									onClick={() => onTabChange(item.id)}
								>
									<div className="flex items-center gap-3 w-full">
										<Icon className="h-4 w-4" />
										<div className="flex-1 text-left">
											<div className="font-medium text-sm">{item.label}</div>
											<div className={`text-xs ${
												isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
											}`}>
												{item.description}
											</div>
										</div>
										{item.badge && (
											<Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
												{item.badge}
											</Badge>
										)}
									</div>
								</Button>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<Card>
				<CardContent className="p-4">
					<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
						Quick Actions
					</h3>
					<div className="space-y-2">
						{quickActions.map((action, index) => {
							const Icon = action.icon
							return (
								<Button
									key={index}
									variant={action.variant}
									size="sm"
									className="w-full justify-start"
									onClick={action.action}
								>
									<Icon className="h-4 w-4 mr-2" />
									{action.label}
								</Button>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Filter Shortcuts */}
			<Card>
				<CardContent className="p-4">
					<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
						Quick Filters
					</h3>
					<div className="space-y-2">
						{filterShortcuts.map((filter, index) => {
							const Icon = filter.icon
							return (
								<Button
									key={index}
									variant="ghost"
									size="sm"
									className="w-full justify-between h-auto p-2"
								>
									<div className="flex items-center gap-2">
										<Icon className="h-3 w-3" />
										<span className="text-xs">{filter.label}</span>
									</div>
									<Badge variant="outline" className="text-xs">
										{filter.count}
									</Badge>
								</Button>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Template Categories */}
			<Card>
				<CardContent className="p-4">
					<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
						Categories
					</h3>
					<div className="space-y-2">
						{[
							{ name: 'Education', count: 12, color: 'bg-blue-500' },
							{ name: 'Employment', count: 8, color: 'bg-green-500' },
							{ name: 'Identity', count: 5, color: 'bg-purple-500' },
							{ name: 'Licenses', count: 3, color: 'bg-orange-500' },
							{ name: 'Other', count: 2, color: 'bg-gray-500' },
						].map((category) => (
							<Button
								key={category.name}
								variant="ghost"
								size="sm"
								className="w-full justify-between h-auto p-2"
							>
								<div className="flex items-center gap-2">
									<div className={`h-2 w-2 rounded-full ${category.color}`} />
									<span className="text-xs">{category.name}</span>
								</div>
								<Badge variant="outline" className="text-xs">
									{category.count}
								</Badge>
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card>
				<CardContent className="p-4">
					<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
						Recent Activity
					</h3>
					<div className="space-y-3">
						{recentActivity.map((activity, index) => {
							const Icon = activity.icon
							return (
								<div key={index} className="flex items-start gap-3">
									<div className="rounded-full bg-muted p-1">
										<Icon className="h-3 w-3" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium truncate">{activity.action}</p>
										<p className="text-xs text-muted-foreground truncate">{activity.name}</p>
										<p className="text-xs text-muted-foreground">{activity.time}</p>
									</div>
								</div>
							)
						})}
					</div>
					<div className="border-t my-3" />
					<Button variant="ghost" size="sm" className="w-full text-xs">
						<Eye className="h-3 w-3 mr-1" />
						View All Activity
					</Button>
				</CardContent>
			</Card>

			{/* Usage Statistics */}
			<Card>
				<CardContent className="p-4">
					<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
						Usage This Month
					</h3>
					<div className="space-y-3">
						<div className="flex justify-between items-center">
							<span className="text-xs">Credentials Issued</span>
							<span className="text-xs font-medium">1,247</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs">Success Rate</span>
							<span className="text-xs font-medium text-green-600">94.2%</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs">Templates Used</span>
							<span className="text-xs font-medium">{Math.floor(totalTemplates * 0.6)}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
