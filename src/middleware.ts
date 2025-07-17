import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWTPayload } from '@/types';
import { decodeJwt } from '@/lib/jwt';

interface RoutePermission {
	path: string;
	permissions: string[];
	requireAll?: boolean; // true = AND logic, false = OR logic
	roles?: string[];
	requireAllRoles?: boolean;
	tenantRequired?: boolean;
}

// Define route permissions
const ROUTE_PERMISSIONS: RoutePermission[] = [
	// Admin routes
	{
		path: '/dashboard/admin',
		permissions: ['admin:dashboard:read'],
		roles: ['system:admin', 'SystemAdmin', 'SystemSuperAdmin'],
		requireAll: true,
		requireAllRoles: false, // OR logic for roles
	},
	{
		path: '/dashboard/admin/users',
		permissions: ['admin:users:read'],
		roles: ['system:admin', 'SystemAdmin', 'SystemSuperAdmin'],
		requireAll: true,
		requireAllRoles: false, // OR logic for roles
	},
	{
		path: '/dashboard/admin/tenants',
		permissions: ['admin:tenants:read'],
		roles: ['system:admin', 'SystemAdmin', 'SystemSuperAdmin'],
		requireAll: true,
		requireAllRoles: false, // OR logic for roles
	},
	{
		path: '/dashboard/admin/roles',
		permissions: ['admin:roles:read'],
		roles: ['system:admin', 'SystemAdmin', 'SystemSuperAdmin'],
		requireAll: true,
		requireAllRoles: false, // OR logic for roles
	},
	{
		path: '/dashboard/admin/oauth2',
		permissions: ['admin:oauth2:read'],
		roles: ['system:admin', 'SystemAdmin', 'SystemSuperAdmin'],
		requireAll: true,
		requireAllRoles: false, // OR logic for roles
	},
	// Tenant-specific routes
	{
		path: '/dashboard/tenant/',
		permissions: ['tenant:dashboard:read'],
		tenantRequired: true,
	},
	{
		path: '/dashboard/users',
		permissions: ['users.read', 'users.list'],
		requireAll: false, // OR logic
		tenantRequired: true,
	},
	{
		path: '/dashboard/roles',
		permissions: ['tenant:roles:read'],
		tenantRequired: true,
	},
];

function checkUserPermissions(payload: JWTPayload, requiredPermissions: string[], requireAll = true): boolean {
	// Check if user has wildcard permissions
	// Log permissions for debugging
	console.log('checkUserPermissions - User permissions:', payload.permissions);
	console.log('checkUserPermissions - User roles:', payload.roles);

	// Check if permissions array exists and has elements
	if (!payload.permissions || payload.permissions.length === 0) {
		console.log('checkUserPermissions - No permissions found in payload');
	}

	const hasWildcardPermissions = payload.permissions?.some(permission => {
		if (!permission) {
			return false;
		}

		// Log raw permission for debugging
		console.log('checkUserPermissions - Raw permission:', JSON.stringify(permission));

		// Handle both string and array formats
		if (Array.isArray(permission)) {
			// If permission is an array like ["*",".*"]
			console.log('checkUserPermissions - Permission is an array:', permission);
			return permission.some(p => {
				if (!p) return false;
				const trimmed = p.trim();
				const isWildcard =
					trimmed === '*' ||
					trimmed === '.*' ||
					trimmed === '*.*' ||
					trimmed === '*:*' ||
					trimmed === '.*:.*';

				if (isWildcard) {
					console.log('checkUserPermissions - Found wildcard in array permission:', trimmed);
				}
				return isWildcard;
			});
		}

		// Handle string format
		// Trim whitespace and check for wildcard patterns
		const trimmedPermission = permission.trim();
		const isWildcard =
			trimmedPermission === '*' ||
			trimmedPermission === '.*' ||
			trimmedPermission === '*.*' ||
			trimmedPermission === '*:*' ||
			trimmedPermission === '.*:.*';

		if (isWildcard) {
			console.log('checkUserPermissions - Found wildcard permission:', trimmedPermission);
		}

		return isWildcard;
	});


	console.log('checkUserPermissions - Has wildcard permissions:', hasWildcardPermissions);

	// Check if user is a system admin (multiple role formats)
	const isSystemAdmin = payload.roles?.some(role =>
		role === 'system:admin' ||
		role === 'SystemAdmin' ||
		role === 'SystemSuperAdmin'
	);

	// System admins or users with wildcard permissions have access to all permissions
	if (isSystemAdmin || hasWildcardPermissions) {
		return true;
	}

	// Extract permissions from roles
	const userPermissions = new Set<string>();

	// Add direct permissions from JWT payload
	if (payload.permissions) {
		payload.permissions.forEach(permission => {
			userPermissions.add(permission);
		});
	}

	// Add role-based permissions (simplified - in real app, you'd fetch from backend)
	payload.roles?.forEach(role => {
		// Tenant-specific roles
		if (role.includes(':admin')) {
			userPermissions.add('tenant:dashboard:read');
			userPermissions.add('tenant:roles:read');
			userPermissions.add('users.read');
			userPermissions.add('users.list');
			userPermissions.add('users.create');
			userPermissions.add('users.update');
			userPermissions.add('users.delete');
		}

		if (role.includes(':member')) {
			userPermissions.add('tenant:dashboard:read');
			userPermissions.add('users.read');
		}
	});

	if (requireAll) {
		return requiredPermissions.every(permission => userPermissions.has(permission));
	} else {
		return requiredPermissions.some(permission => userPermissions.has(permission));
	}
}

function checkUserRoles(payload: JWTPayload, requiredRoles: string[], requireAll = false): boolean {
	if (!payload.roles || payload.roles.length === 0) {
		return false;
	}

	// Check if user has wildcard permissions
	// Log permissions for debugging
	console.log('checkUserRoles - User permissions:', payload.permissions);
	console.log('checkUserRoles - User roles:', payload.roles);

	// Check if permissions array exists and has elements
	if (!payload.permissions || payload.permissions.length === 0) {
		console.log('checkUserRoles - No permissions found in payload');
	}

	const hasWildcardPermissions = payload.permissions?.some(permission => {
		if (!permission) {
			return false;
		}

		// Log raw permission for debugging
		console.log('checkUserRoles - Raw permission:', JSON.stringify(permission));

		// Handle both string and array formats
		if (Array.isArray(permission)) {
			// If permission is an array like ["*",".*"]
			console.log('checkUserRoles - Permission is an array:', permission);
			return permission.some(p => {
				if (!p) return false;
				const trimmed = p.trim();
				const isWildcard =
					trimmed === '*' ||
					trimmed === '.*' ||
					trimmed === '*.*' ||
					trimmed === '*:*' ||
					trimmed === '.*:.*';

				if (isWildcard) {
					console.log('checkUserRoles - Found wildcard in array permission:', trimmed);
				}
				return isWildcard;
			});
		}

		// Handle string format
		// Trim whitespace and check for wildcard patterns
		const trimmedPermission = permission.trim();
		const isWildcard =
			trimmedPermission === '*' ||
			trimmedPermission === '.*' ||
			trimmedPermission === '*.*' ||
			trimmedPermission === '*:*' ||
			trimmedPermission === '.*:.*';

		if (isWildcard) {
			console.log('checkUserRoles - Found wildcard permission:', trimmedPermission);
		}

		return isWildcard;
	});

	console.log('checkUserRoles - Has wildcard permissions:', hasWildcardPermissions);

	// Check if user is a system admin (multiple role formats)
	const isSystemAdmin = payload.roles.some(role =>
		role === 'system:admin' ||
		role === 'SystemAdmin' ||
		role === 'SystemSuperAdmin'
	);

	// System admins or users with wildcard permissions have access to all roles
	if (isSystemAdmin || hasWildcardPermissions) {
		return true;
	}

	// Check if user has any of the required roles
	if (requireAll) {
		return requiredRoles.every(role => payload.roles!.includes(role));
	} else {
		return requiredRoles.some(role => payload.roles!.includes(role));
	}
}

function getMatchingRoute(pathname: string): RoutePermission | null {
	// Find the most specific matching route
	const matches = ROUTE_PERMISSIONS.filter(route =>
		pathname.startsWith(route.path)
	).sort((a, b) => b.path.length - a.path.length); // Sort by specificity

	return matches[0] || null;
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip middleware for public routes
	if (pathname.startsWith('/login') ||
		pathname.startsWith('/register') ||
		pathname.startsWith('/forgot-password') ||
		pathname.startsWith('/reset-password') ||
		pathname.startsWith('/verify-email') ||
		pathname.startsWith('/dashboard/access-denied') ||
		pathname.startsWith('/dashboard/unauthorized') ||
		pathname.startsWith('/dashboard/loading-permissions') ||
		pathname.startsWith('/dashboard/tenant-management') ||
		pathname.match(/^\/dashboard\/tenant\/[^\/]+/) || // Skip tenant ID routes - let TenantGuard handle them
		pathname.startsWith('/api') ||
		pathname.startsWith('/_next') ||
		pathname === '/favicon.ico' ||
		pathname === '/') {
		return NextResponse.next();
	}

	// Get access token from cookies
	const accessToken = request.cookies.get('accessToken')?.value;

	if (!accessToken) {
		// Redirect to login if no token
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	try {
		// Decode JWT token
		const payload = decodeJwt<JWTPayload>(accessToken);

		// Extract tenant ID from payload
		const tenantId = payload.tenant_id;
		const { search } = request.nextUrl;

		// Check if token is expired
		if (payload.exp * 1000 < Date.now()) {
			const loginUrl = new URL('/login', request.url);
			loginUrl.searchParams.set('redirect', pathname);
			return NextResponse.redirect(loginUrl);
		}

		// Check if user has wildcard permissions
		// Log permissions for debugging
		console.log('User permissions:', payload.permissions);
		console.log('User roles:', payload.roles);

		// Check if permissions array exists and has elements
		if (!payload.permissions || payload.permissions.length === 0) {
			console.log('No permissions found in payload');
		}

		const hasWildcardPermissions = payload.permissions?.some(permission => {
			if (!permission) {
				return false;
			}

			// Log raw permission for debugging
			console.log('Raw permission:', JSON.stringify(permission));

			// Handle both string and array formats
			if (Array.isArray(permission)) {
				// If permission is an array like ["*",".*"]
				console.log('Permission is an array:', permission);
				return permission.some(p => {
					if (!p) return false;
					const trimmed = p.trim();
					const isWildcard =
						trimmed === '*' ||
						trimmed === '.*' ||
						trimmed === '*.*' ||
						trimmed === '*:*' ||
						trimmed === '*:.*' ||
						trimmed === '*:.*' ||
						trimmed === '.*:.*';

					if (isWildcard) {
						console.log('Found wildcard in array permission:', trimmed);
					}
					return isWildcard;
				});
			}

			// Handle string format
			// Trim whitespace and check for wildcard patterns
			const trimmedPermission = permission.trim();
			const isWildcard =
				trimmedPermission === '*' ||
				trimmedPermission === '.*' ||
				trimmedPermission === '*.*' ||
				trimmedPermission === '*:*' ||
				trimmedPermission === '.*:.*';

			if (isWildcard) {
				console.log('Found wildcard permission:', trimmedPermission);
			}

			return isWildcard;
		});

		console.log('Has wildcard permissions:', hasWildcardPermissions);

		// Check if user is a system admin (multiple role formats)
		const isSystemAdmin = payload.roles?.some(role =>
			role === 'system:admin' ||
			role === 'SystemAdmin' ||
			role === 'SystemSuperAdmin'
		);

		// Debug logging
		// Removed console.log statements for production build

		// System admin or user with wildcard permissions bypass - allow access to all routes
		if (isSystemAdmin || hasWildcardPermissions) {
			// System admin or user with wildcard permissions accessing route, bypassing all checks
			return NextResponse.next()
		}

		// Get route configuration
		const routeConfig = getMatchingRoute(pathname)

		// If no route config found, allow access (public route)
		if (!routeConfig) {
			return NextResponse.next()
		}

		// Route Config: routeConfig

		// Check if tenant is required but not present
		if (routeConfig.tenantRequired && !tenantId) {
			// Redirecting to select-tenant: tenant required but not present
			const selectTenantUrl = new URL('/select-tenant', request.url)
			selectTenantUrl.searchParams.set('returnUrl', pathname + search)
			return NextResponse.redirect(selectTenantUrl)
		}

		// Check permissions if required
		if (routeConfig.permissions && routeConfig.permissions.length > 0) {
			const hasPermissions = checkUserPermissions(
				payload,
				routeConfig.permissions,
				routeConfig.requireAll
			)
			// Permission check result: hasPermissions
			if (!hasPermissions) {
				// Access denied: insufficient permissions
				const accessDeniedUrl = new URL('/dashboard/access-denied', request.url);
				// Add requested path information to query params
				accessDeniedUrl.searchParams.set('path', pathname + search);
				accessDeniedUrl.searchParams.set('reason', 'insufficient permissions');
				return NextResponse.redirect(accessDeniedUrl);
			}
		}

		// Check roles if required
		if (routeConfig.roles && routeConfig.roles.length > 0) {
			console.log('middleware roles:', routeConfig.roles);

			const hasRoles = checkUserRoles(
				payload,
				routeConfig.roles,
				routeConfig.requireAll
			)

			// // Role check result: hasRoles
			if (!hasRoles) {
				// Access denied: insufficient roles
				const accessDeniedUrl = new URL('/dashboard/access-denied', request.url);
				// Add requested path information to query params
				accessDeniedUrl.searchParams.set('path', pathname + search);
				accessDeniedUrl.searchParams.set('reason', 'insufficient roles');
				return NextResponse.redirect(accessDeniedUrl);
			}
		}
		// Add user info to headers for downstream components
		const response = NextResponse.next();
		response.headers.set('x-user-id', payload.sub);
		response.headers.set('x-user-email', payload.email);
		if (payload.tenant_id) {
			response.headers.set('x-tenant-id', String(payload.tenant_id));
		}
		if (payload.roles) {
			response.headers.set('x-user-roles', JSON.stringify(payload.roles));
		}
		if (payload.permissions) {
			response.headers.set('x-user-permissions', JSON.stringify(payload.permissions));
		}

		return response;

	} catch (error) {
		console.error('Middleware error:', error);
		// Redirect to login on token decode error
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - login, register, forgot-password, etc. (public auth pages)
		 * - oauth2 (OAuth2 authorization flow)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|verify-email|oauth2).*)',
	],
};
