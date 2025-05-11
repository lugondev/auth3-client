// @/hooks/useAuthGuard.ts
"use client";

import React, { useEffect, ComponentType } from 'react'; // Added ComponentType and React
import { useRouter } from 'next/navigation';
// Assuming you have an AuthContext similar to the one in README.md
// import { useAuth } from '@/contexts/AuthContext'; 

// Define a user type (adjust according to your actual user object structure)
interface User {
	id: string;
	email?: string | null;
	roles?: string[]; // e.g., ['system:admin', 'tenant:123:admin']
	tenants?: string[]; // e.g., ['tenantId1', 'tenantId2']
	// Add other relevant user properties
}

// Placeholder for auth context hook
const useAuth = (): { user: User | null; loading: boolean } => {
	// Replace with your actual auth context logic
	// This is a mock implementation
	console.warn(
		"useAuth is a placeholder. Implement with your actual AuthContext."
	);
	// Simulate a logged-in system admin for testing admin routes
	// Simulate a user part of a tenant for testing tenant routes
	const mockUser: User = {
		id: 'mock-user-id',
		email: 'admin@example.com',
		roles: ['system:admin', 'tenant:tenant-abc:member'],
		tenants: ['tenant-abc', 'tenant-xyz'],
	};
	return { user: mockUser, loading: false };
	// return { user: null, loading: false }; // Simulate logged out
	// return { user: { id: 'user1', roles: ['user'], tenants: ['tenant-abc'] }, loading: false }; // Simulate regular user
};


type RoleOrCheckerFn = string | ((user: User | null) => boolean);

/**
 * Hook to protect routes based on user authentication and roles.
 * @param requiredRoleOrFn - The role string (e.g., 'system:admin') or a function that takes the user object and returns true if access is allowed.
 * @param redirectPath - The path to redirect to if access is denied (e.g., '/login' or '/dashboard').
 */
export function useAuthGuard(
	requiredRoleOrFn: RoleOrCheckerFn,
	redirectPath: string = '/login'
) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) {
			return; // Wait until authentication status is resolved
		}

		let hasAccess = false;

		if (!user) {
			hasAccess = false; // No user, no access
		} else if (typeof requiredRoleOrFn === 'function') {
			hasAccess = requiredRoleOrFn(user);
		} else if (typeof requiredRoleOrFn === 'string') {
			hasAccess = user.roles?.includes(requiredRoleOrFn) ?? false;
		}

		if (!hasAccess) {
			router.push(redirectPath);
		}
	}, [user, loading, requiredRoleOrFn, redirectPath, router]);

	return { user, loading }; // Optionally return user and loading state
}

/**
 * Higher-Order Component (HOC) for protecting pages.
 * This is an alternative to the hook if you prefer HOCs.
 */
export function withRoleGuard<P extends object>( // Changed {} to object as per ESLint suggestion
	WrappedComponent: ComponentType<P>,
	requiredRoleOrFn: RoleOrCheckerFn,
	redirectPath: string = '/login'
): React.FC<P> {
	const ComponentWithAuthGuard: React.FC<P> = (props) => {
		useAuthGuard(requiredRoleOrFn, redirectPath);
		const { user, loading } = useAuth();

		if (loading || !user) {
			// You might want to render a loading spinner or null
			return null;
		}

		// Check access again, primarily for the initial render before useEffect in useAuthGuard runs
		let hasAccess = false;
		if (typeof requiredRoleOrFn === 'function') {
			hasAccess = requiredRoleOrFn(user);
		} else if (typeof requiredRoleOrFn === 'string') {
			hasAccess = user.roles?.includes(requiredRoleOrFn) ?? false;
		}

		if (!hasAccess) {
			// This might cause a flash of content if redirection is not immediate.
			// The hook's useEffect should handle redirection.
			// Consider returning a loader or null here too if redirection is not instant.
			return null;
		}

		// Using React.createElement to bypass potential JSX parsing issues for this line
		return React.createElement(WrappedComponent, props);
	};

	// Set a display name for easier debugging
	const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
	ComponentWithAuthGuard.displayName = `withRoleGuard(${displayName})`;

	return ComponentWithAuthGuard;
}
