'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

export default function LoadingPermissionsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, currentTenantId } = useAuth();

	const requestedPath = searchParams.get('path') || 'the requested resource';
	const [progress, setProgress] = React.useState(0);

	// Simulate loading progress
	React.useEffect(() => {
		const timer = setInterval(() => {
			setProgress((oldProgress) => {
				if (oldProgress >= 90) {
					return 90; // Stop at 90% to avoid completing without actual permission check
				}
				return Math.min(oldProgress + Math.random() * 10, 90);
			});
		}, 200);

		// Auto redirect after 10 seconds if still loading
		const redirectTimer = setTimeout(() => {
			router.push('/dashboard');
		}, 10000);

		return () => {
			clearInterval(timer);
			clearTimeout(redirectTimer);
		};
	}, [router]);

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
						<Shield className="h-8 w-8 text-blue-600 animate-pulse" />
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Checking Permissions
					</CardTitle>
					<CardDescription className="text-gray-600">
						Verifying your access to {requestedPath}
					</CardDescription>
				</CardHeader>
				
				<CardContent className="space-y-6">
					{/* Loading Animation */}
					<div className="flex items-center justify-center space-x-2">
						<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
						<span className="text-sm text-gray-600">Authenticating...</span>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm text-gray-600">
							<span>Progress</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className="w-full" />
					</div>

					{/* Current User Info */}
					{user && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
								<Clock className="h-4 w-4 mr-1" />
								Current Session
							</h4>
							<div className="space-y-1 text-sm text-blue-700">
								<p><span className="font-medium">User:</span> {user.email}</p>
								{user.roles && user.roles.length > 0 && (
									<p><span className="font-medium">Roles:</span> {user.roles.join(', ')}</p>
								)}
								{currentTenantId && (
									<p><span className="font-medium">Tenant:</span> {currentTenantId}</p>
								)}
							</div>
						</div>
					)}

					{/* Loading Steps */}
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<h4 className="text-sm font-medium text-gray-800 mb-3">Verification Steps</h4>
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								<span className="text-sm text-gray-600">Authentication verified</span>
							</div>
							<div className="flex items-center space-x-2">
								{progress > 30 ? (
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								) : (
									<Loader2 className="w-2 h-2 animate-spin text-blue-600" />
								)}
								<span className="text-sm text-gray-600">Loading user permissions</span>
							</div>
							<div className="flex items-center space-x-2">
								{progress > 60 ? (
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								) : progress > 30 ? (
									<Loader2 className="w-2 h-2 animate-spin text-blue-600" />
								) : (
									<div className="w-2 h-2 bg-gray-300 rounded-full"></div>
								)}
								<span className="text-sm text-gray-600">Checking tenant access</span>
							</div>
							<div className="flex items-center space-x-2">
								{progress > 80 ? (
									<Loader2 className="w-2 h-2 animate-spin text-blue-600" />
								) : (
									<div className="w-2 h-2 bg-gray-300 rounded-full"></div>
								)}
								<span className="text-sm text-gray-600">Validating route permissions</span>
							</div>
						</div>
					</div>

					{/* Info Message */}
					<div className="text-center">
						<p className="text-xs text-gray-500">
							This may take a few seconds. You&#39;ll be redirected automatically.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}