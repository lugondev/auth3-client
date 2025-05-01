import { PrismaClient, Prisma } from '@prisma/client';

export async function seedCasbinRules(prisma: PrismaClient, userIds: string[]) {
	console.log('Seeding Casbin Rules...');

	// Define policy rules (p, subject, object, action)
	const policyRules: Prisma.casbin_ruleCreateManyInput[] = [
		// --- Admin Role ---
		{ ptype: 'p', v0: 'admin', v1: '*', v2: '.*' }, // Super admin can manage everything

		// --- Manager Role --- (Scope often needs to be enforced in application logic based on venue association)
		{ ptype: 'p', v0: 'manager', v1: 'venue_settings', v2: 'manage' },
		{ ptype: 'p', v0: 'manager', v1: 'product', v2: 'manage' },
		{ ptype: 'p', v0: 'manager', v1: 'category', v2: 'manage' },
		{ ptype: 'p', v0: 'manager', v1: 'event', v2: 'manage' },
		{ ptype: 'p', v0: 'manager', v1: 'table', v2: 'manage' },
		{ ptype: 'p', v0: 'manager', v1: 'slot', v2: 'manage' },
		{ ptype: 'p', v0: 'manager', v1: 'staff', v2: 'manage' }, // Manage staff within their venue
		{ ptype: 'p', v0: 'manager', v1: 'order', v2: 'read' }, // Managers can usually read orders
		{ ptype: 'p', v0: 'manager', v1: 'report', v2: 'read' }, // Read reports

		// --- Waiter Role ---
		{ ptype: 'p', v0: 'waiter', v1: 'order', v2: 'create' },
		{ ptype: 'p', v0: 'waiter', v1: 'order', v2: 'read_own' }, // Read their own orders (example)
		{ ptype: 'p', v0: 'waiter', v1: 'table', v2: 'read' },
		{ ptype: 'p', v0: 'waiter', v1: 'table', v2: 'update_status' }, // Update table status (e.g., occupied, available)
		{ ptype: 'p', v0: 'waiter', v1: 'product', v2: 'read' }, // Read products/menu
		{ ptype: 'p', v0: 'waiter', v1: 'slot', v2: 'read' }, // View slots/map

		// --- Host Role ---
		{ ptype: 'p', v0: 'host', v1: 'table', v2: 'read' },
		{ ptype: 'p', v0: 'host', v1: 'table', v2: 'reserve' }, // Assign/reserve tables
		{ ptype: 'p', v0: 'host', v1: 'slot', v2: 'read' },
		{ ptype: 'p', v0: 'host', v1: 'slot', v2: 'update_status' }, // Update slot status

		// --- Bartender Role ---
		{ ptype: 'p', v0: 'bartender', v1: 'order', v2: 'create_drink' }, // Specific create action
		{ ptype: 'p', v0: 'bartender', v1: 'order', v2: 'read_drink' },
		{ ptype: 'p', v0: 'bartender', v1: 'product', v2: 'read_drink' }, // Read drink menu

		// --- Kitchen Role ---
		{ ptype: 'p', v0: 'kitchen', v1: 'order', v2: 'read_food' }, // Read food orders
		{ ptype: 'p', v0: 'kitchen', v1: 'order', v2: 'update_status' }, // Update order item status (e.g., preparing, ready)
		{ ptype: 'p', v0: 'kitchen', v1: 'inventory', v2: 'read' },
	];

	// Define role hierarchy/inheritance (g, user/role, inherited_role)
	const roleHierarchy: Prisma.casbin_ruleCreateManyInput[] = [
		{ ptype: 'g', v0: 'manager', v1: 'waiter' }, // Manager inherits waiter permissions
		{ ptype: 'g', v0: 'manager', v1: 'host' },   // Manager inherits host permissions
		// Add other inheritance if needed
	];

	// Assign roles to specific users (g, user_id, role)
	const userRoleAssignments: Prisma.casbin_ruleCreateManyInput[] = [];
	if (userIds.length > 0) {
		// Assign Admin to the first user
		userRoleAssignments.push({ ptype: 'g', v0: userIds[0], v1: 'admin', v2: null, v3: null, v4: null, v5: null });
	}
	if (userIds.length > 1) {
		// Assign Manager to the second user
		userRoleAssignments.push({ ptype: 'g', v0: userIds[1], v1: 'manager', v2: null, v3: null, v4: null, v5: null });
	}
	// Assign Waiter role to a few more users
	userIds.slice(2, 5).forEach(userId => {
		userRoleAssignments.push({ ptype: 'g', v0: userId, v1: 'waiter', v2: null, v3: null, v4: null, v5: null });
	});
	// Assign Host role
	if (userIds.length > 5) {
		userRoleAssignments.push({ ptype: 'g', v0: userIds[5], v1: 'host', v2: null, v3: null, v4: null, v5: null });
	}
	// Assign Bartender role
	if (userIds.length > 6) {
		userRoleAssignments.push({ ptype: 'g', v0: userIds[6], v1: 'bartender', v2: null, v3: null, v4: null, v5: null });
	}

	const allRules = [...policyRules, ...roleHierarchy, ...userRoleAssignments];

	try {
		// It might be safer to delete existing rules before seeding if duplicates are an issue
		await prisma.casbin_rule.deleteMany({}); // Clear existing rules first
		await prisma.casbin_rule.createMany({ data: allRules });
		console.log(`-> Seeded ${allRules.length} casbin rules.`);
	} catch (error) {
		console.error('Error seeding casbin rules:', error);
	}
}
