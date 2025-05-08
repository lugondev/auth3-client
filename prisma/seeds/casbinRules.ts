import { PrismaClient, Prisma } from '@prisma/client';

// Define a type for the roles passed to this function
// This should match the structure returned by seedRoles in rbacDb.ts
type TenantRole = {
	id: string;
	tenant_id: string;
	name: string;
	is_system_role: boolean; // Keep this if it's used for specific logic
};

// Define a type for the user-role assignments passed to this function
type CasbinUserRole = {
	user_id: string;
	role_id: string;
	tenant_id: string;
};

export async function seedCasbinRules(
	prisma: PrismaClient,
	allTenantRoles: TenantRole[],
	userRoleAssignments: CasbinUserRole[],
) {
	console.log('Seeding Tenant-Aware Casbin Rules...');

	const casbinRules: Prisma.casbin_ruleCreateManyInput[] = [];

	// --- 1. Policy Rules (p, subject_role_id, domain_tenant_id, object, action) ---
	// These rules define what a role can do within a specific tenant (domain).
	// The 'subject' (v0) will be the role's ID.
	// The 'domain' (v1) will be the tenant_id associated with that role.
	allTenantRoles.forEach(role => {
		const tenantId = role.tenant_id; // Domain for Casbin

		// Example: 'admin' role (by name) within its specific tenant
		if (role.name === 'admin') {
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: '*', v3: '.*' });
		}
		// Example: 'manager' role (by name) within its specific tenant
		if (role.name === 'manager') {
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'venue_settings', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'product', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'category', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'event', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'table', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'slot', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'staff', v3: 'manage' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'read' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'report', v3: 'read' });
		}
		// Example: 'waiter' role
		if (role.name === 'waiter') {
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'create' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'read_own' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'table', v3: 'read' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'table', v3: 'update_status' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'product', v3: 'read' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'slot', v3: 'read' });
		}
		// Add other role-specific policies here, using role.id as v0 and role.tenant_id as v1
		if (role.name === 'host') {
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'table', v3: 'read' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'table', v3: 'reserve' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'slot', v3: 'read' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'slot', v3: 'update_status' });
		}
		if (role.name === 'bartender') {
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'create_drink' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'read_drink' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'product', v3: 'read_drink' });
		}
		if (role.name === 'kitchen') {
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'read_food' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'order', v3: 'update_status' });
			casbinRules.push({ ptype: 'p', v0: role.id, v1: tenantId, v2: 'inventory', v3: 'read' });
		}
	});

	// --- 2. Role Hierarchy/Inheritance (g, child_role_id, parent_role_id, domain_tenant_id) ---
	// These rules define role inheritance within a specific tenant.
	// Example: In Tenant A, ManagerRoleA inherits WaiterRoleA.
	// We need to find roles by name within the *same tenant* to establish hierarchy.
	const rolesByTenantAndName: Record<string, Record<string, TenantRole>> = {};
	allTenantRoles.forEach(role => {
		if (!rolesByTenantAndName[role.tenant_id]) {
			rolesByTenantAndName[role.tenant_id] = {};
		}
		rolesByTenantAndName[role.tenant_id][role.name] = role;
	});

	Object.keys(rolesByTenantAndName).forEach(tenantId => {
		const tenantRoles = rolesByTenantAndName[tenantId];
		const managerRole = tenantRoles['manager'];
		const waiterRole = tenantRoles['waiter'];
		const hostRole = tenantRoles['host'];

		if (managerRole && waiterRole) {
			casbinRules.push({ ptype: 'g', v0: waiterRole.id, v1: managerRole.id, v2: tenantId });
		}
		if (managerRole && hostRole) {
			casbinRules.push({ ptype: 'g', v0: hostRole.id, v1: managerRole.id, v2: tenantId });
		}
		// Add other inheritance rules here, ensuring both roles exist in the current tenant.
		// For Casbin: g, user_or_role_being_assigned, role_being_inherited, domain
		// So if manager inherits waiter: g, manager.id, waiter.id, tenantId
		// Corrected: If waiter is child of manager: g, waiter.id, manager.id, tenantId
		// If you mean manager has all permissions of waiter (manager is "more powerful"):
		// g, manager.id (user/role), waiter.id (inherited_role/group), tenantId (domain)
		// Let's assume manager inherits (is a superset of) waiter and host
		if (managerRole && waiterRole) {
			// This means manager role (v0) inherits waiter role (v1) in tenantId (v2)
			// So, a user with 'manager' role also has 'waiter' permissions.
			casbinRules.push({ ptype: 'g', v0: managerRole.id, v1: waiterRole.id, v2: tenantId });
		}
		if (managerRole && hostRole) {
			casbinRules.push({ ptype: 'g', v0: managerRole.id, v1: hostRole.id, v2: tenantId });
		}
	});


	// --- 3. User-Role Assignments (g, user_id, role_id, domain_tenant_id) ---
	// These rules assign a user to a role within a specific tenant.
	userRoleAssignments.forEach(assignment => {
		casbinRules.push({
			ptype: 'g',
			v0: assignment.user_id,    // User ID
			v1: assignment.role_id,    // Role ID they are assigned
			v2: assignment.tenant_id,  // Tenant ID (domain) for this assignment
		});
	});

	try {
		// Clear existing rules before seeding to prevent duplicates or conflicts
		await prisma.casbin_rule.deleteMany({});
		if (casbinRules.length > 0) {
			await prisma.casbin_rule.createMany({ data: casbinRules });
			console.log(`-> Seeded ${casbinRules.length} tenant-aware casbin rules.`);
		} else {
			console.log('-> No casbin rules were generated to seed.');
		}
	} catch (error) {
		console.error('Error seeding tenant-aware casbin rules:', error);
		// Consider re-throwing the error if the seed script should halt on failure
		throw error;
	}
}
