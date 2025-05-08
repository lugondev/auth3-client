import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Seeds permissions into the database.
 * Creates a diverse set of permissions.
 *
 * @param prisma - The PrismaClient instance.
 * @returns A promise that resolves to an array of created permission objects, each containing its id and name.
 */
export async function seedPermissions(prisma: PrismaClient): Promise<{ id: string; name: string }[]> {
	console.log('Seeding Permissions...');
	const permissionsData: Prisma.permissionsCreateInput[] = [
		// User Management
		{ name: 'users:create', group_name: 'User Management', description: 'Allow creating new users.' },
		{ name: 'users:read', group_name: 'User Management', description: 'Allow reading user information.' },
		{ name: 'users:update', group_name: 'User Management', description: 'Allow updating user information.' },
		{ name: 'users:delete', group_name: 'User Management', description: 'Allow deleting users.' },
		{ name: 'users:manage_roles', group_name: 'User Management', description: 'Allow assigning/revoking user roles.' },

		// Tenant Management
		{ name: 'tenants:create', group_name: 'Tenant Management', description: 'Allow creating new tenants.' },
		{ name: 'tenants:read', group_name: 'Tenant Management', description: 'Allow reading tenant information.' },
		{ name: 'tenants:update', group_name: 'Tenant Management', description: 'Allow updating tenant information.' },
		{ name: 'tenants:delete', group_name: 'Tenant Management', description: 'Allow deleting tenants.' },
		{ name: 'tenants:manage_members', group_name: 'Tenant Management', description: 'Allow managing tenant members.' },
		{ name: 'tenants:configure_auth', group_name: 'Tenant Management', description: 'Allow configuring tenant authentication settings.' },

		// Role & Permission Management (RBAC specific)
		{ name: 'rbac:manage_roles', group_name: 'RBAC Management', description: 'Allow creating, updating, and deleting roles.' },
		{ name: 'rbac:manage_permissions', group_name: 'RBAC Management', description: 'Allow managing permissions (view only, typically).' },

		// Audit Log Access
		{ name: 'audit_logs:read', group_name: 'Audit Logs', description: 'Allow reading audit logs.' },

		// Application Specific (examples, expand as needed)
		{ name: 'dashboard:view', group_name: 'Application', description: 'Allow viewing the main dashboard.' },
		{ name: 'settings:manage_general', group_name: 'Application Settings', description: 'Allow managing general application settings.' },
		{ name: 'reports:generate', group_name: 'Reporting', description: 'Allow generating various reports.' },
	];

	// Add some more generic permissions
	const actions = ['create', 'read', 'update', 'delete', 'manage'];
	const resources = ['profile', 'billing', 'notifications', 'documents', 'support_tickets'];
	for (const resource of resources) {
		for (const action of actions) {
			permissionsData.push({
				name: `${resource}:${action}`,
				group_name: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Management`,
				description: `Allow ${action} ${resource}.`,
				created_at: faker.date.past({ years: 1 }),
				updated_at: new Date(),
			});
		}
	}

	const createdPermissions: { id: string; name: string }[] = [];
	for (const data of permissionsData) {
		try {
			// Use upsert to avoid conflicts if re-seeding with same permission names
			const permission = await prisma.permissions.upsert({
				where: { name: data.name },
				update: { ...data, updated_at: new Date() },
				create: { ...data, created_at: data.created_at || new Date(), updated_at: data.updated_at || new Date() },
			});
			createdPermissions.push({ id: permission.id, name: permission.name }); // Ensure name is returned
		} catch (error) {
			console.error(`Error seeding permission ${data.name}:`, error);
		}
	}
	console.log(`-> Seeded ${createdPermissions.length} permissions.`);
	return createdPermissions;
}

/**
 * Seeds roles into the database.
 * Creates roles associated with specific tenants.
 *
 * @param prisma - The PrismaClient instance.
 * @param tenantIds - An array of tenant IDs to associate roles with.
 * @returns A promise that resolves to an array of created role objects, each containing id, tenant_id, name, and is_system_role.
 */
export async function seedRoles(prisma: PrismaClient, tenantIds: string[]): Promise<{ id: string; tenant_id: string; name: string; is_system_role: boolean }[]> {
	console.log('Seeding Roles...');
	if (tenantIds.length === 0) {
		console.log('No tenant IDs provided, skipping role seeding.');
		return [];
	}
	const rolesData: Prisma.rolesCreateInput[] = [];
	const roleDefinitions = [
		{ name: 'Super Administrator', description: 'Has all permissions globally (system role).', is_system_role: true },
		{ name: 'Tenant Administrator', description: 'Manages all aspects of a specific tenant.', is_system_role: false },
		{ name: 'Tenant Manager', description: 'Manages operational aspects of a tenant.', is_system_role: false },
		{ name: 'Tenant Editor', description: 'Can edit content within a tenant.', is_system_role: false },
		{ name: 'Tenant Viewer', description: 'Can view content within a tenant.', is_system_role: false },
		{ name: 'Member', description: 'Default role for users within a tenant.', is_system_role: false },
	];

	for (const tenantId of tenantIds) {
		for (const roleDef of roleDefinitions) {
			// System roles are typically not tenant-specific in the same way,
			// but for this schema, roles are tied to tenants.
			// We can create a "system" tenant or handle system roles differently if needed.
			// For now, creating all roles under each tenant.
			const now = new Date();
			rolesData.push({
				tenants: { connect: { id: tenantId } },
				name: roleDef.name,
				description: roleDef.description,
				is_system_role: roleDef.is_system_role,
				created_at: faker.date.past({ years: 1, refDate: now }),
			});
		}
	}
	// Add one global Super Admin role if not strictly tenant bound (requires schema adjustment or a dedicated "system" tenant)
	// For now, we assume Super Admin is also created per tenant, or a specific tenant is designated for system roles.

	const createdRoles: { id: string; tenant_id: string; name: string; is_system_role: boolean }[] = [];
	for (const data of rolesData) {
		try {
			// Use upsert to avoid conflicts if re-seeding with same role names for a tenant
			const role = await prisma.roles.upsert({
				where: { tenant_id_name: { tenant_id: (data.tenants!.connect!.id as string), name: data.name! } },
				update: { ...data, description: data.description ?? undefined, updated_at: new Date() },
				create: data,
			});
			createdRoles.push({
				id: role.id,
				tenant_id: role.tenant_id,
				name: role.name,
				is_system_role: role.is_system_role,
			}); // Ensure all needed fields are returned
		} catch (error) {
			console.error(`Error seeding role ${data.name} for tenant ${(data.tenants!.connect!.id as string)}:`, error);
		}
	}

	console.log(`-> Seeded ${createdRoles.length} roles.`);
	return createdRoles;
}

/**
 * Seeds role-permission associations.
 * Assigns permissions to roles.
 *
 * @param prisma - The PrismaClient instance.
 * @param roles - An array of role objects (containing id and tenant_id).
 * @param permissions - An array of permission objects (containing id).
 */
export async function seedRolePermissions(
	prisma: PrismaClient,
	roles: { id: string; tenant_id: string; name: string; is_system_role: boolean }[],
	permissions: { id: string; name: string }[],
): Promise<void> {
	console.log('Seeding Role-Permission Associations...');
	if (roles.length === 0 || permissions.length === 0) {
		console.log('No roles or permissions provided, skipping role-permission seeding.');
		return;
	}

	const rolePermissionsData: Prisma.role_permissionsCreateManyInput[] = [];
	const permissionMap = new Map(permissions.map(p => [p.name, p.id]));

	for (const role of roles) {
		let assignedPermissions: string[] = [];

		// Assign permissions based on role name (example logic)
		if (role.name === 'Super Administrator' || (role.is_system_role && role.name.toLowerCase().includes('admin'))) {
			assignedPermissions = permissions.map(p => p.id); // Assign all permissions
		} else if (role.name === 'Tenant Administrator') {
			permissions.forEach(p => {
				if (p.name.startsWith('tenants:') || p.name.startsWith('users:') || p.name.startsWith('rbac:') || p.name.startsWith('audit_logs:')) {
					assignedPermissions.push(p.id);
				}
			});
			// Add some general app permissions
			['dashboard:view', 'settings:manage_general', 'reports:generate'].forEach(name => {
				if (permissionMap.has(name)) assignedPermissions.push(permissionMap.get(name)!);
			});
		} else if (role.name === 'Tenant Manager') {
			permissions.forEach(p => {
				if (p.name.startsWith('users:read') || p.name.startsWith('users:update') || p.name.startsWith('tenants:read') || p.name.startsWith('tenants:manage_members')) {
					assignedPermissions.push(p.id);
				}
			});
			['dashboard:view', 'reports:generate'].forEach(name => {
				if (permissionMap.has(name)) assignedPermissions.push(permissionMap.get(name)!);
			});
		} else if (role.name === 'Tenant Editor') {
			permissions.forEach(p => {
				if (p.name.includes(':create') || p.name.includes(':update') || p.name.includes(':read')) {
					if (!p.name.startsWith('tenants:') && !p.name.startsWith('rbac:') && !p.name.startsWith('users:delete')) {
						assignedPermissions.push(p.id);
					}
				}
			});
			['dashboard:view'].forEach(name => {
				if (permissionMap.has(name)) assignedPermissions.push(permissionMap.get(name)!);
			});
		} else if (role.name === 'Tenant Viewer' || role.name === 'Member') {
			permissions.forEach(p => {
				if (p.name.includes(':read') || p.name === 'profile:update' || p.name === 'profile:create') { // Members can manage their own profile
					if (!p.name.startsWith('tenants:') && !p.name.startsWith('rbac:') && !p.name.startsWith('users:') && !p.name.startsWith('audit_logs:')) {
						assignedPermissions.push(p.id);
					}
				}
			});
			['dashboard:view'].forEach(name => {
				if (permissionMap.has(name)) assignedPermissions.push(permissionMap.get(name)!);
			});
		}

		// Ensure unique permissions per role before adding
		assignedPermissions = [...new Set(assignedPermissions)];

		for (const permissionId of assignedPermissions) {
			rolePermissionsData.push({
				role_id: role.id,
				permission_id: permissionId,
			});
		}
	}

	if (rolePermissionsData.length > 0) {
		try {
			await prisma.role_permissions.createMany({
				data: rolePermissionsData,
				skipDuplicates: true, // Important for many-to-many if re-running
			});
			console.log(`-> Seeded ${rolePermissionsData.length} role-permission associations.`);
		} catch (error) {
			console.error('Error seeding role-permissions:', error);
		}
	} else {
		console.log('No new role-permission associations to seed.');
	}
}

/**
 * Seeds user-role associations.
 * Assigns roles to users within their respective tenants.
 *
 * @param prisma - The PrismaClient instance.
 * @param users - An array of user objects (containing id).
 * @param roles - An array of role objects (containing id, tenant_id, name).
 * @param tenantUsers - An array of tenant_user membership objects (user_id, tenant_id).
 */
export async function seedUserRoles(
	prisma: PrismaClient,
	users: { id: string; email: string }[],
	roles: { id: string; tenant_id: string; name: string; is_system_role: boolean }[],
	tenantUsers: { user_id: string; tenant_id: string }[],
): Promise<void> {
	console.log('Seeding User-Role Associations...');
	if (users.length === 0 || roles.length === 0 || tenantUsers.length === 0) {
		console.log('Missing users, roles, or tenant memberships. Skipping user-role seeding.');
		return;
	}

	const userRolesData: Prisma.user_rolesCreateManyInput[] = [];
	const adminUserEmail = 'lugon@util.vn'; // From users.ts

	// Create a map for quick lookup of roles by tenant_id and name
	const tenantRolesMap = new Map<string, Map<string, string>>();
	for (const role of roles) {
		if (!tenantRolesMap.has(role.tenant_id)) {
			tenantRolesMap.set(role.tenant_id, new Map());
		}
		tenantRolesMap.get(role.tenant_id)!.set(role.name, role.id);
	}

	for (const membership of tenantUsers) {
		const user = users.find(u => u.id === membership.user_id);
		if (!user) continue;

		let roleNameToAssign: string | null = null;

		// Assign Super Administrator to the admin user for one of their tenants (e.g., the first one they are part of)
		if (user.email === adminUserEmail) {
			roleNameToAssign = 'Super Administrator';
		} else {
			// For other users, assign a role based on some logic, e.g., randomly or based on user index
			// Ensure the role exists for the tenant
			const availableRoleNamesForTenant = Array.from(tenantRolesMap.get(membership.tenant_id)?.keys() || []);
			if (availableRoleNamesForTenant.length > 0) {
				// Avoid assigning Super Admin randomly
				const nonSuperAdminRoles = availableRoleNamesForTenant.filter(name => name !== 'Super Administrator');
				if (nonSuperAdminRoles.length > 0) {
					roleNameToAssign = faker.helpers.arrayElement(nonSuperAdminRoles);
				} else {
					roleNameToAssign = faker.helpers.arrayElement(availableRoleNamesForTenant); // Fallback if only Super Admin exists
				}
			}
		}

		if (roleNameToAssign) {
			const roleId = tenantRolesMap.get(membership.tenant_id)?.get(roleNameToAssign);
			if (roleId) {
				userRolesData.push({
					user_id: membership.user_id,
					role_id: roleId,
				});
			} else {
				console.warn(`Role "${roleNameToAssign}" not found for tenant "${membership.tenant_id}" when assigning to user "${user.email}".`);
			}
		}
	}

	// Ensure each user has at least one role in each tenant they belong to, default to 'Member' if no other role assigned
	for (const membership of tenantUsers) {
		const userHasRoleInTenant = userRolesData.some(ur => ur.user_id === membership.user_id && roles.find(r => r.id === ur.role_id)?.tenant_id === membership.tenant_id);
		if (!userHasRoleInTenant) {
			const memberRoleId = tenantRolesMap.get(membership.tenant_id)?.get('Member');
			if (memberRoleId) {
				userRolesData.push({
					user_id: membership.user_id,
					role_id: memberRoleId,
				});
			} else {
				console.warn(`Default role "Member" not found for tenant "${membership.tenant_id}" for user "${membership.user_id}".`);
			}
		}
	}


	if (userRolesData.length > 0) {
		try {
			// Remove duplicates before inserting
			const uniqueUserRolesData = userRolesData.filter((value, index, self) =>
				index === self.findIndex((t) => (
					t.user_id === value.user_id && t.role_id === value.role_id
				))
			);

			await prisma.user_roles.createMany({
				data: uniqueUserRolesData,
				skipDuplicates: true, // Should be redundant due to manual filter, but good for safety
			});
			console.log(`-> Seeded ${uniqueUserRolesData.length} user-role associations.`);
		} catch (error) {
			console.error('Error seeding user-roles:', error);
		}
	} else {
		console.log('No new user-role associations to seed.');
	}
}
