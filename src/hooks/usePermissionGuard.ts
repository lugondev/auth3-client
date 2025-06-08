'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';

export interface PermissionGuardOptions {
	// Single permission or array of permissions
	permission?: string;
	permissions?: string[];
	// Logic for multiple permissions (true = AND, false = OR)
	requireAll?: boolean;
	// Role requirements
	role?: string;
	roles?: string[];
	requireAllRoles?: boolean;
	// Tenant requirements
	tenantRequired?: boolean;
	// Redirect options
	redirectTo?: string;
	redirectOnDenied?: string;
	// Loading and error handling
	showLoading?: boolean;
	showError?: boolean;
	// Callbacks
	onAccessGranted?: () => void;
	onAccessDenied?: () => void;
	onLoading?: () => void;
	onError?: (error: string) => void;
}

export interface PermissionGuardResult {
	hasAccess: boolean;
	isLoading: boolean;
	error: string | null;
	checkAccess: () => Promise<boolean>;
	refresh: () => void;
}

/**
 * Advanced permission guard hook with comprehensive access control
 * Supports multiple permissions, roles, tenant requirements, and dynamic checking
 */
export function usePermissionGuard(options: PermissionGuardOptions = {}): PermissionGuardResult {
	const {
		permission,
		permissions = [],
		requireAll = true,
		role,
		roles = [],
		requireAllRoles = true,
		tenantRequired = false,
		redirectTo,
		redirectOnDenied = '/dashboard/access-denied',
		showLoading = true,
		showError = true,
		onAccessGranted,
		onAccessDenied,
		onLoading,
		onError,
	} = options;

	const router = useRouter();
	const { user, isAuthenticated, currentTenantId, loading: authLoading } = useAuth();
	const { hasPermission, hasRole, loading: permissionsLoading, error: permissionsError, refreshPermissions } = usePermissions();

	const [hasAccess, setHasAccess] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Build permission and role arrays using useMemo for optimization
	const permissionChecks = useMemo(() => {
		const checks: string[] = [];
		if (permission) checks.push(permission);
		if (permissions.length > 0) checks.push(...permissions);
		return checks;
	}, [permission, permissions]);

	const roleChecks = useMemo(() => {
		const checks: string[] = [];
		if (role) checks.push(role);
		if (roles.length > 0) checks.push(...roles);
		return checks;
	}, [role, roles]);

	// Check access function
	const checkAccess = useCallback(async (): Promise<boolean> => {
		try {
			setError(null);
			
			// Check authentication
			if (!isAuthenticated || !user) {
				setError('User not authenticated');
				if (redirectTo) {
					router.push(redirectTo);
				}
				return false;
			}

			// Check tenant requirement
			if (tenantRequired && !currentTenantId) {
				setError('Tenant context required');
				if (redirectOnDenied) {
					router.push('/dashboard/select-tenant');
				}
				return false;
			}

			// Check permissions
			let hasRequiredPermissions = true;
			if (permissionChecks.length > 0) {
				if (requireAll) {
					// AND logic - user must have ALL permissions
					hasRequiredPermissions = permissionChecks.every((perm) => hasPermission(perm));
				} else {
					// OR logic - user must have ANY permission
					hasRequiredPermissions = permissionChecks.some((perm) => hasPermission(perm));
				}
			}

			// Check roles
			let hasRequiredRoles = true;
			if (roleChecks.length > 0) {
				if (requireAllRoles) {
					// AND logic - user must have ALL roles
					hasRequiredRoles = roleChecks.every((r) => hasRole(r));
				} else {
					// OR logic - user must have ANY role
					hasRequiredRoles = roleChecks.some((r) => hasRole(r));
				}
			}

			const accessGranted = hasRequiredPermissions && hasRequiredRoles;

			if (accessGranted) {
				onAccessGranted?.();
			} else {
				const missingPermissions = permissionChecks.filter(perm => !hasPermission(perm));
				const missingRoles = roleChecks.filter(r => !hasRole(r));
				
				let errorMessage = 'Access denied';
				if (missingPermissions.length > 0) {
					errorMessage += `. Missing permissions: ${missingPermissions.join(', ')}`;
				}
				if (missingRoles.length > 0) {
					errorMessage += `. Missing roles: ${missingRoles.join(', ')}`;
				}
				
				setError(errorMessage);
				onAccessDenied?.();
				
				if (redirectOnDenied) {
					router.push(redirectOnDenied);
				}
			}

			return accessGranted;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			onError?.(errorMessage);
			return false;
		}
	}, [
		isAuthenticated,
		user,
		currentTenantId,
		tenantRequired,
		permissionChecks,
		roleChecks,
		requireAll,
		requireAllRoles,
		hasPermission,
		hasRole,
		redirectTo,
		redirectOnDenied,
		onAccessGranted,
		onAccessDenied,
		onError,
		router,
	]);

	// Refresh function
	const refresh = useCallback(() => {
		refreshPermissions();
	}, [refreshPermissions]);

	// Effect to check access when dependencies change
	useEffect(() => {
		const performCheck = async () => {
			if (authLoading || permissionsLoading) {
				setIsLoading(true);
				onLoading?.();
				return;
			}

			setIsLoading(true);
			const access = await checkAccess();
			setHasAccess(access);
			setIsLoading(false);
		};

		performCheck();
	}, [
		authLoading,
		permissionsLoading,
		checkAccess,
		onLoading,
	]);

	// Handle permissions error
	useEffect(() => {
		if (permissionsError && showError) {
			setError(`Permissions error: ${permissionsError}`);
			onError?.(permissionsError);
		}
	}, [permissionsError, showError, onError]);

	return {
		hasAccess,
		isLoading: showLoading ? isLoading : false,
		error: showError ? error : null,
		checkAccess,
		refresh,
	};
}

/**
 * Simplified permission guard hook for single permission
 */
export function useSimplePermissionGuard(permission: string, redirectOnDenied?: string): PermissionGuardResult {
	return usePermissionGuard({
		permission,
		redirectOnDenied,
	});
}

/**
 * Role-based guard hook
 */
export function useRoleGuard(role: string, redirectOnDenied?: string): PermissionGuardResult {
	return usePermissionGuard({
		role,
		redirectOnDenied,
	});
}

/**
 * Tenant-aware permission guard
 */
export function useTenantPermissionGuard(
	permission: string,
	redirectOnDenied?: string
): PermissionGuardResult {
	return usePermissionGuard({
		permission,
		tenantRequired: true,
		redirectOnDenied,
	});
}

/**
 * Multi-permission guard with OR logic
 */
export function useAnyPermissionGuard(
	permissions: string[],
	redirectOnDenied?: string
): PermissionGuardResult {
	return usePermissionGuard({
		permissions,
		requireAll: false, // OR logic
		redirectOnDenied,
	});
}

/**
 * Multi-permission guard with AND logic
 */
export function useAllPermissionsGuard(
	permissions: string[],
	redirectOnDenied?: string
): PermissionGuardResult {
	return usePermissionGuard({
		permissions,
		requireAll: true, // AND logic
		redirectOnDenied,
	});
}