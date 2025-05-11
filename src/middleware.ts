// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define a user type for middleware (similar to useAuthGuard)
interface MiddlewareUser {
	id: string;
	roles?: string[];
	tenants?: string[];
}

// Placeholder: Implement this function to get the user from the request
// This might involve decoding a JWT from a cookie, or calling an auth API.
async function getUserFromRequest(request: NextRequest): Promise<MiddlewareUser | null> {
	// Example: Read a cookie
	const sessionToken = request.cookies.get('session_token')?.value;
	if (!sessionToken) {
		console.log('Middleware: No session token found');
		return null;
	}

	// // In a real app, verify and decode the token to get user info
	// // For this placeholder, we'll mock a user based on a simple token value
	// if (sessionToken === 'mock-system-admin-token') {
	// 	// console.log('Middleware: Mocking system admin');
	// 	return { id: 'admin-user', roles: ['system:admin'], tenants: ['tenant-a'] };
	// }
	// if (sessionToken === 'mock-tenant-user-token') {
	// 	// console.log('Middleware: Mocking tenant user');
	// 	return { id: 'tenant-user', roles: ['tenant:tenant-a:member'], tenants: ['tenant-a', 'tenant-b'] };
	// }
	// if (sessionToken === 'mock-regular-user-token') {
	// 	// console.log('Middleware: Mocking regular user');
	// 	return { id: 'regular-user', roles: ['user'], tenants: [] };
	// }

	// console.log('Middleware: Invalid or unrecognized session token');
	return null;
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const user = await getUserFromRequest(request);

	console.log(`Middleware: Pathname: ${pathname}, User:`, user ? user.id : 'No User');

	// const dashboardUrl = new URL('/dashboard', request.url);
	// const loginUrl = new URL('/login', request.url); // Assuming you have a login page

	// If no user and trying to access protected areas (admin or tenant)
	// if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/tenant/'))) {
	// 	// console.log('Middleware: No user, redirecting to login for protected route.');
	// 	return NextResponse.redirect(loginUrl);
	// }

	// Admin route protection
	/*
	if (pathname.startsWith('/admin')) {
		if (!user || !user.roles?.includes('system:admin')) {
			// console.log('Middleware: Admin access denied, redirecting to dashboard.');
			return NextResponse.redirect(dashboardUrl);
		}
		// console.log('Middleware: Admin access granted.');
	}
	*/

	// // Tenant route protection
	// if (pathname.startsWith('/tenant/')) {
	// 	const tenantIdMatch = pathname.match(/^\/tenant\/([^/]+)/);
	// 	if (tenantIdMatch) {
	// 		const tenantId = tenantIdMatch[1];
	// 		if (!user || !user.tenants?.includes(tenantId)) {
	// 			// console.log(`Middleware: Tenant (${tenantId}) access denied, redirecting to dashboard.`);
	// 			return NextResponse.redirect(dashboardUrl);
	// 		}
	// 		// console.log(`Middleware: Tenant (${tenantId}) access granted.`);
	// 	}
	// }

	return NextResponse.next();
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
