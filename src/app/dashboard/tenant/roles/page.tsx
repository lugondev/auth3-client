'use client'

import React from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {ArrowRight, Globe, Building2} from 'lucide-react'
import {useRouter} from 'next/navigation'

export default function TenantRolesPage() {
	const {currentMode, currentTenantId} = useAuth()
	const router = useRouter()

	// Redirect to tenant-specific roles if in tenant context
	React.useEffect(() => {
		if (currentMode === 'tenant' && currentTenantId) {
			router.replace(`/dashboard/tenant/${currentTenantId}/roles`)
		}
	}, [currentMode, currentTenantId, router])

	// Show message if not in tenant context
	if (currentMode !== 'tenant') {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="space-y-6">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
						<p className="text-muted-foreground">
							Access role management for your organization
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Globe className="h-5 w-5 text-blue-600" />
								Tenant Context Required
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-muted-foreground">
								Role management is available at the tenant level. Please switch to a tenant context to manage roles and permissions for your organization.
							</p>
							<Button 
								onClick={() => router.push('/dashboard')}
								className="w-full sm:w-auto"
							>
								<Building2 className="h-4 w-4 mr-2" />
								Go to Dashboard
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Loading state while redirecting
	return (
		<div className="container mx-auto px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5 text-green-600" />
						Redirecting to Tenant Roles
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Redirecting you to the tenant-specific role management page...
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
