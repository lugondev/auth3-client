import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserDIDsInTenant } from '@/services/tenantService';
import { 
	Card, 
	CardContent, 
	CardDescription, 
	CardHeader, 
	CardTitle 
} from '@/components/ui/card';
import { 
	Table, 
	TableBody, 
	TableCell, 
	TableHead, 
	TableHeader, 
	TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
	ChevronLeft, 
	ChevronRight, 
	ExternalLink, 
	Shield, 
	Key,
	Calendar,
	User,
	Building2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TenantUserDIDInfo } from '@/types/tenantUserDID';

interface UserDIDsTableProps {
	tenantId: string;
	userId: string;
	userName?: string;
	tenantName?: string;
}

export function UserDIDsTable({ tenantId, userId, userName, tenantName }: UserDIDsTableProps) {
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const {
		data: response,
		isLoading,
		error,
		refetch
	} = useQuery({
		queryKey: ['tenant-user-dids', tenantId, userId, page],
		queryFn: () => getUserDIDsInTenant(tenantId, userId, pageSize, (page - 1) * pageSize),
		enabled: !!tenantId && !!userId,
	});

	const getStatusBadge = (status: string) => {
		const statusColors = {
			active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			deactivated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			revoked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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

	const getMethodIcon = (method: string) => {
		switch (method) {
			case 'key':
				return <Key className="h-4 w-4" />;
			case 'web':
				return <ExternalLink className="h-4 w-4" />;
			default:
				return <Shield className="h-4 w-4" />;
		}
	};

	const getOwnershipBadge = (ownershipType: string) => {
		const ownershipColors = {
			personal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			tenant: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			user_managed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
		};

		const ownershipIcons = {
			personal: <User className="h-3 w-3 mr-1" />,
			tenant: <Building2 className="h-3 w-3 mr-1" />,
			user_managed: <Shield className="h-3 w-3 mr-1" />
		};

		return (
			<Badge 
				variant="outline" 
				className={ownershipColors[ownershipType as keyof typeof ownershipColors] || 'bg-gray-100 text-gray-800'}
			>
				{ownershipIcons[ownershipType as keyof typeof ownershipIcons]}
				{ownershipType.replace('_', ' ')}
			</Badge>
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const totalPages = response ? Math.ceil(response.total / pageSize) : 0;

	if (isLoading) {
		return (
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
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-red-600">Error Loading DIDs</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertDescription>
							Failed to load DIDs for this user. Please try again.
						</AlertDescription>
					</Alert>
					<Button onClick={() => refetch()} className="mt-4">
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!response || response.dids.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						User DIDs in Tenant
					</CardTitle>
					<CardDescription>
						{userName ? `${userName}'s` : 'User'} DIDs in {tenantName || 'this tenant'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-500">This user has no DIDs in this tenant context.</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Shield className="h-5 w-5" />
					User DIDs in Tenant
				</CardTitle>
				<CardDescription>
					{userName ? `${userName}'s` : 'User'} DIDs in {tenantName || 'this tenant'} 
					({response.total} total)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>DID</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Ownership</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Usage</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{response.dids.map((did: TenantUserDIDInfo) => (
								<TableRow key={did.did_id}>
									<TableCell className="font-mono text-sm max-w-xs">
										<div className="truncate" title={did.did}>
											{did.did}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											{getMethodIcon(did.method)}
											<span className="capitalize">{did.method}</span>
										</div>
									</TableCell>
									<TableCell>
										{getStatusBadge(did.status)}
									</TableCell>
									<TableCell>
										{getOwnershipBadge(did.ownership_type)}
									</TableCell>
									<TableCell>
										<div className="max-w-xs">
											<div className="truncate font-medium">
												{did.name || 'Unnamed DID'}
											</div>
											{did.description && (
												<div className="text-xs text-gray-500 truncate mt-1">
													{did.description}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1 text-sm text-gray-600">
											<Calendar className="h-3 w-3" />
											{formatDate(did.created_at)}
										</div>
									</TableCell>
									<TableCell>
										{did.usage_count !== undefined ? (
											<div className="text-sm">
												<div className="font-medium">{did.usage_count} uses</div>
												{did.last_used_at && (
													<div className="text-xs text-gray-500">
														Last: {formatDate(did.last_used_at)}
													</div>
												)}
											</div>
										) : (
											<span className="text-gray-400">-</span>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between space-x-2 py-4">
						<div className="text-sm text-muted-foreground">
							Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, response.total)} of {response.total} entries
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page - 1)}
								disabled={page <= 1}
							>
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>
							<div className="text-sm font-medium">
								Page {page} of {totalPages}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page + 1)}
								disabled={page >= totalPages}
							>
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default UserDIDsTable;
