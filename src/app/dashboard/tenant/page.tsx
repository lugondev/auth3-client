'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {LayoutDashboard, Users, ShieldCheck, Settings, Globe, Building2, CreditCard, Presentation} from 'lucide-react'
import Link from 'next/link'

export default function TenantDashboard() {
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
							This is the organization dashboard. It's only available when you switch to a tenant context. 
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
					<h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome to your organization workspace
					</p>
				</div>

				{/* Context Info Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
							<ShieldCheck className="h-4 w-4 text-muted-foreground" />
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
							<p className="text-xs text-muted-foreground">Organization context</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">User Email</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-sm font-medium">{user?.email || 'N/A'}</div>
							<p className="text-xs text-muted-foreground">Organization member</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Manage Members
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								View and manage organization members, invite new users, and assign roles.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/members">
									<Users className="mr-2 h-4 w-4" />
									Members
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldCheck className="h-5 w-5" />
								Roles & Permissions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								Configure roles, permissions, and access control for your organization.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/roles">
									<ShieldCheck className="mr-2 h-4 w-4" />
									Roles
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								Credentials
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								Manage verifiable credentials for your organization.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/credentials">
									<CreditCard className="mr-2 h-4 w-4" />
									Credentials
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Presentation className="h-5 w-5" />
								Presentations
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								Create and manage verifiable presentations.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/presentations">
									<Presentation className="mr-2 h-4 w-4" />
									Presentations
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-5 w-5" />
								Organization Settings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								Configure organization settings, security policies, and preferences.
							</p>
							<Button asChild className="w-full">
								<Link href="/dashboard/tenant/settings">
									<Settings className="mr-2 h-4 w-4" />
									Settings
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
