'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTenantById, getTenantUserDetails } from '@/services/tenantService';
import { UserDIDsTable } from '@/components/tenants/UserDIDsTable';
import { 
	Card, 
	CardContent, 
	CardDescription, 
	CardHeader, 
	CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
	ArrowLeft, 
	User, 
	Building2, 
	Calendar, 
	Shield,
	Mail,
	UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function TenantUserDIDsPage() {
	const params = useParams();
	const tenantId = params.tenantId as string;
	const userId = params.userId as string;

	// Fetch tenant details
	const {
		data: tenant,
		isLoading: isLoadingTenant,
		error: tenantError
	} = useQuery({
		queryKey: ['tenant', tenantId],
		queryFn: () => getTenantById(tenantId),
		enabled: !!tenantId,
	});

	// Fetch user details in tenant
	const {
		data: tenantUser,
		isLoading: isLoadingUser,
		error: userError
	} = useQuery({
		queryKey: ['tenant-user', tenantId, userId],
		queryFn: () => getTenantUserDetails(tenantId, userId),
		enabled: !!tenantId && !!userId,
	});

	const getStatusBadge = (status: string) => {
		const statusColors = {
			active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
		};

		return (
			<Badge 
				variant="secondary" 
				className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
			>
				{status}
			</Badge>
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	if (isLoadingTenant || isLoadingUser) {
		return (
			<div className="container mx-auto p-6 space-y-6">
				{/* Header skeleton */}
				<div className="flex items-center gap-4 mb-6">
					<Skeleton className="h-6 w-6" />
					<Skeleton className="h-8 w-64" />
				</div>

				{/* User info skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-72" />
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{[...Array(6)].map((_, i) => (
								<div key={i} className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-6 w-48" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* DIDs table skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-72" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (tenantError || userError) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center gap-4 mb-6">
					<Link href={`/dashboard/admin/tenants/${tenantId}/users`}>
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Users
						</Button>
					</Link>
				</div>

				<Alert>
					<AlertDescription>
						{tenantError ? 'Failed to load tenant information.' : 'Failed to load user information.'}
						Please try again or contact support.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!tenant || !tenantUser) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center gap-4 mb-6">
					<Link href={`/dashboard/admin/tenants/${tenantId}/users`}>
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Users
						</Button>
					</Link>
				</div>

				<Alert>
					<AlertDescription>
						Tenant or user not found.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link href={`/dashboard/admin/tenants/${tenantId}/users`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Users
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">User DIDs</h1>
					<p className="text-muted-foreground">
						DIDs for {tenantUser.first_name} {tenantUser.last_name} in {tenant.name}
					</p>
				</div>
			</div>

			{/* User Information Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						User Information
					</CardTitle>
					<CardDescription>
						Details about this user's membership in the tenant
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
								<User className="h-4 w-4" />
								Full Name
							</div>
							<div className="text-lg font-semibold">
								{tenantUser.first_name} {tenantUser.last_name}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
								<Mail className="h-4 w-4" />
								Email
							</div>
							<div className="text-lg">
								{tenantUser.email}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
								<UserCheck className="h-4 w-4" />
								Status
							</div>
							<div>
								{getStatusBadge(tenantUser.status_in_tenant)}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
								<Building2 className="h-4 w-4" />
								Tenant
							</div>
							<div className="text-lg">
								{tenant.name}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
								<Shield className="h-4 w-4" />
								Roles
							</div>
							<div className="flex flex-wrap gap-1">
								{tenantUser.roles && tenantUser.roles.length > 0 ? (
									tenantUser.roles.map((role, index) => (
										<Badge key={index} variant="outline">
											{role}
										</Badge>
									))
								) : (
									<span className="text-gray-500">No roles assigned</span>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
								<Calendar className="h-4 w-4" />
								Joined
							</div>
							<div className="text-sm text-gray-600">
								{formatDate(tenantUser.joined_at)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* User DIDs Table */}
			<UserDIDsTable 
				tenantId={tenantId}
				userId={userId}
				userName={`${tenantUser.first_name} ${tenantUser.last_name}`}
				tenantName={tenant.name}
			/>
		</div>
	);
}
