'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldX, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';

function UnauthorizedPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, currentTenantId } = useAuth();
	const { refreshPermissions, loading } = usePermissions();

	const requestedPath = searchParams.get('path') || 'the requested resource';
	const reason = searchParams.get('reason') || 'insufficient permissions';

	const handleGoBack = () => {
		if (window.history.length > 1) {
			router.back();
		} else {
			router.push('/dashboard');
		}
	};

	const handleGoHome = () => {
		router.push('/dashboard');
	};

	const handleRefreshPermissions = async () => {
		await refreshPermissions();
		// Try to navigate back to the requested path after refresh
		if (requestedPath && requestedPath !== 'the requested resource') {
			router.push(requestedPath);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
						<ShieldX className="h-8 w-8 text-red-600" />
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Unauthorized Access
					</CardTitle>
					<CardDescription className="text-gray-600">
						You don't have permission to access {requestedPath}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<p className="text-sm text-red-800">
							<strong>Reason:</strong> {reason}
						</p>
						{user && (
							<p className="text-sm text-red-800 mt-2">
								<strong>User:</strong> {user.email}
							</p>
						)}
						{currentTenantId && (
							<p className="text-sm text-red-800 mt-1">
								<strong>Tenant:</strong> {currentTenantId}
							</p>
						)}
					</div>

					<div className="space-y-3">
						<Button
							onClick={handleRefreshPermissions}
							disabled={loading}
							variant="outline"
							className="w-full"
						>
							<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
							{loading ? 'Refreshing...' : 'Refresh Permissions'}
						</Button>

						<Button
							onClick={handleGoBack}
							variant="outline"
							className="w-full"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Go Back
						</Button>

						<Button
							onClick={handleGoHome}
							className="w-full"
						>
							<Home className="h-4 w-4 mr-2" />
							Go to Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function UnauthorizedPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<UnauthorizedPageContent />
		</Suspense>
	);
}