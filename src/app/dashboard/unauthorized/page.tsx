'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Home, LogIn, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, logout } = useAuth();

	const requestedPath = searchParams.get('path') || 'the requested resource';
	const reason = searchParams.get('reason') || 'authentication required';
	const returnUrl = searchParams.get('returnUrl');

	const handleGoBack = () => {
		if (window.history.length > 1) {
			router.back();
		} else {
			router.push('/');
		}
	};

	const handleGoHome = () => {
		router.push('/');
	};

	const handleLogin = () => {
		const loginUrl = returnUrl 
			? `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`
			: '/auth/signin';
		router.push(loginUrl);
	};

	const handleLogout = async () => {
		await logout();
		router.push('/auth/signin');
	};

	const handleRefresh = () => {
		window.location.reload();
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
						<AlertTriangle className="h-8 w-8 text-yellow-600" />
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Unauthorized Access
					</CardTitle>
					<CardDescription className="text-gray-600">
						You need to be authenticated to access {requestedPath}
					</CardDescription>
				</CardHeader>
				
				<CardContent className="space-y-6">
					{/* Error Details */}
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<h4 className="text-sm font-medium text-yellow-800 mb-2">Issue</h4>
						<p className="text-sm text-yellow-700 capitalize">{reason}</p>
					</div>

					{/* Current Status */}
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<h4 className="text-sm font-medium text-gray-800 mb-2">Current Status</h4>
						<div className="space-y-1 text-sm text-gray-600">
							{user ? (
								<>
									<p><span className="font-medium">Status:</span> Logged in as {user.email}</p>
									<p><span className="font-medium">Issue:</span> Session may have expired or insufficient permissions</p>
								</>
							) : (
								<>
									<p><span className="font-medium">Status:</span> Not authenticated</p>
									<p><span className="font-medium">Required:</span> Please sign in to continue</p>
								</>
							)}
						</div>
					</div>

					{/* Suggestions */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="text-sm font-medium text-blue-800 mb-2">What you can do:</h4>
						<ul className="text-sm text-blue-700 space-y-1">
							{user ? (
								<>
									<li>• Try refreshing the page</li>
									<li>• Log out and log back in</li>
									<li>• Contact support if the issue persists</li>
								</>
							) : (
								<>
									<li>• Sign in with your account</li>
									<li>• Create an account if you don&#39;t have one</li>
									<li>• Contact support for access</li>
								</>
							)}
						</ul>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col space-y-3">
						{user ? (
							<>
								<Button 
									onClick={handleRefresh}
									variant="default"
									className="w-full"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh Page
								</Button>
								
								<Button 
									onClick={handleLogout}
									variant="outline"
									className="w-full"
								>
									<LogIn className="mr-2 h-4 w-4" />
									Sign In Again
								</Button>
							</>
						) : (
							<Button 
								onClick={handleLogin}
								variant="default"
								className="w-full"
							>
								<LogIn className="mr-2 h-4 w-4" />
								Sign In
							</Button>
						)}
						
						<div className="flex space-x-3">
							<Button 
								onClick={handleGoBack}
								variant="outline"
								className="flex-1"
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Go Back
							</Button>
							
							<Button 
								onClick={handleGoHome}
								variant="outline"
								className="flex-1"
							>
								<Home className="mr-2 h-4 w-4" />
								Home
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}