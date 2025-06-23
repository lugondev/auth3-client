// @/hooks/useAuthGuard.ts
"use client";

import React, { useEffect, ComponentType } from 'react'; // Added ComponentType and React
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth'; // Use our real authentication hook

// Define a user type (adjust according to your actual user object structure)
interface User {
	id: string;
	email?: string | null;
	roles?: string[]; // e.g., ['system:admin', 'tenant:123:admin']
	tenants?: string[]; // e.g., ['tenantId1', 'tenantId2']
	// Add other relevant user properties
}

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
	const { user, isLoading: loading } = useAuth();
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
		const { user, isLoading: loading } = useAuth();

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
