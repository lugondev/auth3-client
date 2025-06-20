import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
	sub: string;
	email: string;
	roles?: string[];
	tenant_id?: string;
	exp: number;
}

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
		roles: ['system:admin'],
		requireAll: true,
		requireAllRoles: true,
	},
	{
		path: '/dashboard/admin/users',
		permissions: ['admin:users:read'],
		roles: ['system:admin'],
		requireAll: true,
		requireAllRoles: true,
	},
	{
		path: '/dashboard/admin/tenants',
		permissions: ['admin:tenants:read'],
		roles: ['system:admin'],
		requireAll: true,
		requireAllRoles: true,
	},
	{
		path: '/dashboard/admin/roles',
		permissions: ['admin:roles:read'],
		roles: ['system:admin'],
		requireAll: true,
		requireAllRoles: true,
	},
	{
		path: '/dashboard/admin/oauth2',
		permissions: ['admin:oauth2:read'],
		roles: ['system:admin'],
		requireAll: true,
		requireAllRoles: true,
	},
	// Tenant-specific routes
	{
		path: '/dashboard/tenant',
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
	if (!payload.roles || payload.roles.length === 0) {
		return false;
	}

	// Extract permissions from roles
	const userPermissions = new Set<string>();
	
	// Add role-based permissions (simplified - in real app, you'd fetch from backend)
	payload.roles.forEach(role => {
		// System admin has all permissions
		if (role === 'system:admin') {
			userPermissions.add('admin:dashboard:read');
			userPermissions.add('admin:users:read');
			userPermissions.add('admin:tenants:read');
			userPermissions.add('admin:roles:read');
			userPermissions.add('admin:oauth2:read');
		}
		
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

function checkUserRoles(payload: JWTPayload, requiredRoles: string[], requireAll = true): boolean {
	if (!payload.roles || payload.roles.length === 0) {
		return false;
	}

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
		const payload = jwtDecode<JWTPayload>(accessToken);
		
		// Check if token is expired
		if (payload.exp * 1000 < Date.now()) {
			const loginUrl = new URL('/login', request.url);
			loginUrl.searchParams.set('redirect', pathname);
			return NextResponse.redirect(loginUrl);
		}

		// Check route permissions
		const routeConfig = getMatchingRoute(pathname);
		
		if (routeConfig) {
			// Check tenant requirement
			if (routeConfig.tenantRequired && !payload.tenant_id) {
				const response = NextResponse.redirect(new URL('/dashboard/select-tenant', request.url));
				return response;
			}
			
			// Check permissions
			if (routeConfig.permissions && routeConfig.permissions.length > 0) {
				const hasPermissions = checkUserPermissions(
					payload, 
					routeConfig.permissions, 
					routeConfig.requireAll
				);
				
				if (!hasPermissions) {
					return NextResponse.redirect(new URL('/dashboard/access-denied', request.url));
				}
			}
			
			// Check roles
			if (routeConfig.roles && routeConfig.roles.length > 0) {
				const hasRoles = checkUserRoles(
					payload, 
					routeConfig.roles, 
					routeConfig.requireAllRoles
				);
				
				if (!hasRoles) {
					return NextResponse.redirect(new URL('/dashboard/access-denied', request.url));
				}
			}
		}
		
		// Add user info to headers for downstream components
		const response = NextResponse.next();
		response.headers.set('x-user-id', payload.sub);
		response.headers.set('x-user-email', payload.email);
		if (payload.tenant_id) {
			response.headers.set('x-tenant-id', payload.tenant_id);
		}
		if (payload.roles) {
			response.headers.set('x-user-roles', JSON.stringify(payload.roles));
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
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|verify-email).*)',
	],
};
