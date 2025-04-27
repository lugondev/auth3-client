import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi';

// Import seeding functions from the seeds directory
import { seedUsers } from './seeds/users';
import { seedVenues } from './seeds/venues';
import { seedTables } from './seeds/tables';
import { seedProducts } from './seeds/products';
import { seedEvents } from './seeds/events';

const prisma = new PrismaClient();

async function main() {
	console.log('Start seeding ...');

	// --- 1. Clean existing data ---
	console.log('Deleting existing data...');
	// Delete in reverse order of creation or based on potential dependencies
	// Keep this section as is, ensuring all relevant tables are truncated or deleted
	await prisma.casbin_rule.deleteMany({});
	await prisma.permissions.deleteMany({});
	await prisma.user_roles.deleteMany({});
	await prisma.venue_staffs.deleteMany({});
	await prisma.table_positions.deleteMany({});
	await prisma.table_maps.deleteMany({});
	await prisma.tables.deleteMany({});
	await prisma.option_choices.deleteMany({});
	await prisma.product_options.deleteMany({});
	await prisma.product_photos.deleteMany({});
	await prisma.products.deleteMany({});
	await prisma.product_categories.deleteMany({});
	await prisma.event_performers.deleteMany({});
	await prisma.event_photos.deleteMany({});
	await prisma.event_tickets.deleteMany({});
	await prisma.events.deleteMany({});
	await prisma.venue_settings.deleteMany({});
	await prisma.venue_photos.deleteMany({});
	await prisma.venues.deleteMany({});
	await prisma.audit_logs.deleteMany({});
	await prisma.sessions.deleteMany({});
	await prisma.refresh_tokens.deleteMany({});
	await prisma.social_profiles.deleteMany({});
	await prisma.user_profiles.deleteMany({});
	await prisma.users.deleteMany({});
	await prisma.roles.deleteMany({});
	console.log('Existing data deleted.');

	try {
		// --- 2. Seed Permissions ---
		console.log('Seeding permissions...');
		// Keep this section as is
		const permissionsData = [
			// User Management
			{ name: 'View Users', slug: 'view_users', description: 'Allows viewing user details', group: 'User Management' },
			{ name: 'Create Users', slug: 'create_users', description: 'Allows creating new users', group: 'User Management' },
			{ name: 'Edit Users', slug: 'edit_users', description: 'Allows editing existing users', group: 'User Management' },
			{ name: 'Delete Users', slug: 'delete_users', description: 'Allows deleting users', group: 'User Management' },
			// Venue Management
			{ name: 'View Venues', slug: 'view_venues', description: 'Allows viewing venue details', group: 'Venue Management' },
			{ name: 'Create Venues', slug: 'create_venues', description: 'Allows creating new venues', group: 'Venue Management' },
			{ name: 'Edit Venues', slug: 'edit_venues', description: 'Allows editing existing venues', group: 'Venue Management' },
			{ name: 'Delete Venues', slug: 'delete_venues', description: 'Allows deleting venues', group: 'Venue Management' },
			// Product Management
			{ name: 'View Products', slug: 'view_products', description: 'Allows viewing venue products', group: 'Product Management' },
			{ name: 'Manage Products', slug: 'manage_products', description: 'Allows managing venue products', group: 'Product Management' },
			// Event Management
			{ name: 'View Events', slug: 'view_events', description: 'Allows viewing venue events', group: 'Event Management' },
			{ name: 'Manage Events', slug: 'manage_events', description: 'Allows managing venue events', group: 'Event Management' },
			// RBAC Management
			{ name: 'Manage Roles', slug: 'manage_roles', description: 'Allows managing roles and their permissions', group: 'RBAC' },
			{ name: 'Manage Permissions', slug: 'manage_permissions', description: 'Allows managing permissions', group: 'RBAC' },
		];
		await prisma.permissions.createMany({
			data: permissionsData,
			skipDuplicates: true,
		});
		console.log(`Seeded ${permissionsData.length} permissions.`);

		// --- 3. Seed Users & Roles (using imported function) ---
		const { users: createdUsers, roles: createdRoles } = await seedUsers(prisma);
		console.log(`Seeded ${createdUsers.length} users and ${createdRoles.length} roles.`);

		// --- 4. Seed Venues & Categories (using imported function) ---
		// Note: seedVenues also creates categories internally
		// Ensure createdUsers is not empty and the first user exists before accessing its ID
		const adminUserId = createdUsers?.[0]?.id;
		if (!adminUserId) {
			throw new Error("Admin user was not created, cannot seed venues.");
		}
		const { venues: createdVenues, categories: createdCategories } = await seedVenues(prisma, { userId: adminUserId });
		console.log(`Seeded ${createdVenues.length} venues and ${createdCategories.length} product categories.`);

		// --- 5. Seed Tables & Maps (using imported function) ---
		const { tables: createdTables } = await seedTables(prisma, { venues: createdVenues });
		console.log(`Seeded ${createdTables.length} tables and associated maps/positions.`);

		// --- 6. Seed Products (using imported function) ---
		const { products: createdProducts } = await seedProducts(prisma, { venues: createdVenues, categories: createdCategories });
		console.log(`Seeded ${createdProducts.length} products and associated options/choices.`);

		// --- 7. Seed Events (using imported function) ---
		const { events: createdEvents } = await seedEvents(prisma, { venues: createdVenues });
		console.log(`Seeded ${createdEvents.length} events and associated tickets/photos/performers.`);


		// --- 8. Seed Venue Staff ---
		console.log('Seeding venue staff...');
		// Use roles returned from seedUsers
		const staffManagerRoles = createdRoles.filter(r => ['manager', 'staff'].includes(r.name));
		const nonAdminUsers = createdUsers.filter(u => u.role !== 'admin'); // Assuming user object has 'role' property

		if (nonAdminUsers.length === 0) {
			console.warn("No non-admin users available to assign as venue staff. Skipping.");
		} else if (staffManagerRoles.length === 0) {
			console.warn("No 'manager' or 'staff' roles found. Cannot assign venue staff.");
		} else {
			for (const venue of createdVenues) {
				const staffCount = faker.number.int({ min: 1, max: Math.min(3, nonAdminUsers.length) });
				const staffUsers = faker.helpers.arrayElements(nonAdminUsers, staffCount);

				for (const staffUser of staffUsers) {
					const assignedRole = faker.helpers.arrayElement(staffManagerRoles);
					try {
						// Check if assignment exists first (simple check)
						const existingStaff = await prisma.venue_staffs.findFirst({
							where: { venue_id: venue.id, user_id: staffUser.id }
						});
						if (!existingStaff) {
							await prisma.venue_staffs.create({
								data: {
									venue_id: venue.id,
									user_id: staffUser.id,
									role: assignedRole.name,
									permissions: assignedRole.permissions, // Use permissions from the role object
									status: 'active',
								}
							});
							console.log(`Assigned user ${staffUser.email} as ${assignedRole.name} to venue ${venue.name}`);
						}
					} catch (staffError) {
						console.error(`Error assigning staff user ${staffUser.id} to venue ${venue.id}:`, staffError);
					}
				}
			}
		}
		console.log('Finished seeding venue staff.');

		// --- 9. Seed Casbin Rules ---
		console.log('Seeding Casbin rules...');
		// Adjust rules based on role names returned from seedUsers if necessary
		const rolesMap = new Map(createdRoles.map(r => [r.name, r]));
		const casbinRulesData = [
			// Admin (assuming role name is 'admin')
			{ ptype: 'p', v0: 'admin', v1: '*', v2: '*' },
			// Manager (assuming role name is 'manager')
			{ ptype: 'p', v0: 'manager', v1: 'Venue Management', v2: '*' },
			{ ptype: 'p', v0: 'manager', v1: 'Product Management', v2: '*' },
			{ ptype: 'p', v0: 'manager', v1: 'Event Management', v2: '*' },
			{ ptype: 'p', v0: 'manager', v1: 'view_users', v2: 'read' },
			{ ptype: 'p', v0: 'manager', v1: 'edit_users', v2: 'write' },
			// Staff (assuming role name is 'staff')
			{ ptype: 'p', v0: 'staff', v1: 'view_venues', v2: 'read' },
			{ ptype: 'p', v0: 'staff', v1: 'view_products', v2: 'read' },
			{ ptype: 'p', v0: 'staff', v1: 'view_events', v2: 'read' },
			// Customer (assuming role name is 'customer')
			{ ptype: 'p', v0: 'customer', v1: 'view_venues', v2: 'read' },
			{ ptype: 'p', v0: 'customer', v1: 'view_products', v2: 'read' },
			{ ptype: 'p', v0: 'customer', v1: 'view_events', v2: 'read' },
			// Example 'g' rule - Assign user to role (Casbin adapter needs to support this)
			// { ptype: 'g', v0: createdUsers[0]?.id, v1: 'admin' }, // Example, adapt if needed
		];
		// Filter out rules with potentially undefined v0 (role name)
		const validCasbinRules = casbinRulesData.filter(rule => rolesMap.has(rule.v0));
		await prisma.casbin_rule.createMany({
			data: validCasbinRules,
			skipDuplicates: true,
		});
		console.log(`Seeded ${validCasbinRules.length} Casbin rules.`);

		// --- 10. Seed Audit Logs ---
		console.log('Seeding audit logs...');
		// Use users returned from seedUsers
		const actionTypes = ['create', 'update', 'login', 'view'];
		const resourceTypes = ['user', 'venue', 'product', 'event'];
		if (createdUsers.length > 0) {
			for (let i = 0; i < 30; i++) { // Create fewer audit logs
				const user = faker.helpers.arrayElement(createdUsers);
				const actionType = faker.helpers.arrayElement(actionTypes);
				const resourceType = faker.helpers.arrayElement(resourceTypes);
				try {
					await prisma.audit_logs.create({
						data: {
							// user_id: user.id, // Replaced with connect syntax
							users: { // Corrected relation name to 'users'
								connect: { id: user.id },
							},
							action_type: actionType,
							resource_type: resourceType,
							resource_id: faker.string.uuid(),
							description: `User ${user.email} performed ${actionType} on ${resourceType}`,
							ip_address: faker.internet.ip(),
							user_agent: faker.internet.userAgent(),
						},
					});
				} catch (auditError) {
					console.error(`Failed to create audit log for user ${user.id}:`, auditError);
				}
			}
			console.log('Seeded audit logs.');
		} else {
			console.warn('Skipping audit log seeding as no users were created.');
		}

	} catch (error) {
		console.error('Error during seeding process:', error);
		process.exit(1);
	} finally {
		console.log('Disconnecting Prisma client...');
		try {
			await prisma.$disconnect();
			console.log('Prisma client disconnected successfully.');
		} catch (disconnectError) {
			console.error('Error disconnecting Prisma client:', disconnectError);
			process.exit(1);
		}
	}

	console.log('Seeding finished.');
}

main(); // Execute the main function
