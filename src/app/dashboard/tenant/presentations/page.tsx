'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Presentation, Globe, Building2, Plus, Eye} from 'lucide-react'
import {Button} from '@/components/ui/button'
import Link from 'next/link'

export default function TenantPresentationsPage() {
	const {currentMode, currentTenantId, user} = useAuth()

	// Redirect to global if not in tenant context
	if (currentMode !== 'tenant') {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5 text-blue-600" />
							Global Context Active
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							This page is only available when you switch to a tenant context. 
							Please use the tenant selector to switch to an organization.
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Organization Presentations</h1>
					<p className="text-muted-foreground">
						Manage verifiable presentations for your organization
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Current Organization</CardTitle>
							<Building2 className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{currentTenantId}</div>
							<p className="text-xs text-muted-foreground">Tenant ID</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Your Role</CardTitle>
							<Presentation className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-1">
								{user?.roles?.map((role) => (
									<Badge key={role} variant="secondary" className="text-xs">
										{role}
									</Badge>
								)) || <Badge variant="outline">No roles</Badge>}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Context Mode</CardTitle>
							<Building2 className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold capitalize">{currentMode}</div>
							<p className="text-xs text-muted-foreground">Current context</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Plus className="h-5 w-5" />
								Create Presentation
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								Create new verifiable presentations for your organization.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/presentations/create">
									<Plus className="mr-2 h-4 w-4" />
									Create
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="h-5 w-5" />
								Verify Presentation
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								Verify incoming presentations with organization policies.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/presentations/verify">
									<Eye className="mr-2 h-4 w-4" />
									Verify
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Organization Presentation Management</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							Organization presentation management functionality would be implemented here. 
							This would include:
						</p>
						<ul className="mt-4 space-y-2 text-sm text-muted-foreground">
							<li>• View all organization presentations</li>
							<li>• Create presentations with organization credentials</li>
							<li>• Verify presentations against organization policies</li>
							<li>• Manage presentation templates</li>
							<li>• Audit presentation creation and verification</li>
							<li>• Integration with organization DID and credentials</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
