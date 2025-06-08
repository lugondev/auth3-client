/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { ComponentType, forwardRef } from 'react';
import { usePermissionGuard, PermissionGuardOptions } from '@/hooks/usePermissionGuard';
import { Loader2, ShieldX, AlertTriangle } from 'lucide-react';

export interface WithPermissionGuardOptions extends PermissionGuardOptions {
	// Custom loading component
	loadingComponent?: React.ComponentType;
	// Custom access denied component
	accessDeniedComponent?: React.ComponentType<{ error?: string }>;
	// Custom error component
	errorComponent?: React.ComponentType<{ error: string }>;
	// Whether to render nothing when access is denied (instead of access denied component)
	renderNothingOnDenied?: boolean;
	// Whether to render nothing when loading (instead of loading component)
	renderNothingOnLoading?: boolean;
	// Custom wrapper className
	wrapperClassName?: string;
}

// Default loading component
const DefaultLoadingComponent: React.FC = () => (
	<div className="flex items-center justify-center p-4">
		<Loader2 className="h-6 w-6 animate-spin text-blue-500" />
		<span className="ml-2 text-sm text-gray-600">Checking permissions...</span>
	</div>
);

// Default access denied component
const DefaultAccessDeniedComponent: React.FC<{ error?: string }> = ({ error }) => (
	<div className="flex flex-col items-center justify-center p-8 text-center">
		<ShieldX className="h-12 w-12 text-red-500 mb-4" />
		<h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
		<p className="text-sm text-gray-600 mb-4">
			You don&apos;t have permission to access this resource.
		</p>
		{error && (
			<details className="text-xs text-gray-500">
				<summary className="cursor-pointer hover:text-gray-700">Details</summary>
				<p className="mt-2 p-2 bg-gray-100 rounded">{error}</p>
			</details>
		)}
	</div>
);

// Default error component
const DefaultErrorComponent: React.FC<{ error: string }> = ({ error }) => (
	<div className="flex flex-col items-center justify-center p-8 text-center">
		<AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
		<h3 className="text-lg font-semibold text-gray-900 mb-2">Permission Check Error</h3>
		<p className="text-sm text-gray-600 mb-4">
			An error occurred while checking permissions.
		</p>
		<details className="text-xs text-gray-500">
			<summary className="cursor-pointer hover:text-gray-700">Error Details</summary>
			<p className="mt-2 p-2 bg-red-100 rounded text-red-700">{error}</p>
		</details>
	</div>
);

/**
 * Higher-Order Component that wraps a component with permission checking
 * @param WrappedComponent - The component to wrap
 * @param options - Permission guard options
 * @returns Protected component
 */
export function withPermissionGuard<P extends object>(
	WrappedComponent: ComponentType<P>,
	options: WithPermissionGuardOptions = {}
) {
	const {
		loadingComponent: LoadingComponent = DefaultLoadingComponent,
		accessDeniedComponent: AccessDeniedComponent = DefaultAccessDeniedComponent,
		errorComponent: ErrorComponent = DefaultErrorComponent,
		renderNothingOnDenied = false,
		renderNothingOnLoading = false,
		wrapperClassName = '',
		...guardOptions
	} = options;

	const PermissionGuardedComponent = forwardRef<any, P>((props, ref) => {
		const { hasAccess, isLoading, error } = usePermissionGuard(guardOptions);

		// Handle loading state
		if (isLoading) {
			if (renderNothingOnLoading) {
				return null;
			}
			return (
				<div className={wrapperClassName}>
					<LoadingComponent />
				</div>
			);
		}

		// Handle error state
		if (error && !hasAccess) {
			return (
				<div className={wrapperClassName}>
					<ErrorComponent error={error} />
				</div>
			);
		}

		// Handle access denied
		if (!hasAccess) {
			if (renderNothingOnDenied) {
				return null;
			}
			return (
				<div className={wrapperClassName}>
					<AccessDeniedComponent error={error || undefined} />
				</div>
			);
		}

		// Render the wrapped component if access is granted
		return <WrappedComponent {...(props as P)} ref={ref} />;
	});

	// Set display name for debugging
	PermissionGuardedComponent.displayName = `withPermissionGuard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

	return PermissionGuardedComponent;
}

/**
 * HOC for single permission check
 */
export function withPermission<P extends object>(
	WrappedComponent: ComponentType<P>,
	permission: string,
	options: Omit<WithPermissionGuardOptions, 'permission'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		permission,
	});
}

/**
 * HOC for role-based access control
 */
export function withRole<P extends object>(
	WrappedComponent: ComponentType<P>,
	role: string,
	options: Omit<WithPermissionGuardOptions, 'role'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		role,
	});
}

/**
 * HOC for multiple permissions with AND logic
 */
export function withAllPermissions<P extends object>(
	WrappedComponent: ComponentType<P>,
	permissions: string[],
	options: Omit<WithPermissionGuardOptions, 'permissions' | 'requireAll'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		permissions,
		requireAll: true,
	});
}

/**
 * HOC for multiple permissions with OR logic
 */
export function withAnyPermission<P extends object>(
	WrappedComponent: ComponentType<P>,
	permissions: string[],
	options: Omit<WithPermissionGuardOptions, 'permissions' | 'requireAll'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		permissions,
		requireAll: false,
	});
}

/**
 * HOC for tenant-specific permission check
 */
export function withTenantPermission<P extends object>(
	WrappedComponent: ComponentType<P>,
	permission: string,
	options: Omit<WithPermissionGuardOptions, 'permission' | 'tenantRequired'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		permission,
		tenantRequired: true,
	});
}

/**
 * HOC for system admin only access
 */
export function withSystemAdmin<P extends object>(
	WrappedComponent: ComponentType<P>,
	options: Omit<WithPermissionGuardOptions, 'role'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		role: 'system:admin',
	});
}

/**
 * HOC that renders nothing when access is denied (useful for conditional rendering)
 */
export function withPermissionHide<P extends object>(
	WrappedComponent: ComponentType<P>,
	permission: string,
	options: Omit<WithPermissionGuardOptions, 'permission' | 'renderNothingOnDenied'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		permission,
		renderNothingOnDenied: true,
	});
}

/**
 * HOC that renders nothing when loading (useful for conditional rendering)
 */
export function withPermissionSilent<P extends object>(
	WrappedComponent: ComponentType<P>,
	permission: string,
	options: Omit<WithPermissionGuardOptions, 'permission' | 'renderNothingOnLoading' | 'renderNothingOnDenied'> = {}
) {
	return withPermissionGuard(WrappedComponent, {
		...options,
		permission,
		renderNothingOnLoading: true,
		renderNothingOnDenied: true,
	});
}