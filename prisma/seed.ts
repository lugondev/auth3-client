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
	// Removed deletion for non-existent models: permissions, user_roles
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
	// Removed deletion for non-existent roles table
	console.log('Existing data deleted.');

	try {

		// --- 3. Seed Users (using imported function) ---
		// Assuming seedUsers assigns roles as strings in the user.roles array
		const { users: createdUsers } = await seedUsers(prisma);
		console.log(`Seeded ${createdUsers.length} users.`);

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
		// Define potential staff roles (these map to Casbin roles)
		const potentialStaffRoles = ['manager', 'staff'];
		// Find the admin/owner user (assuming the first created user is admin/owner)
		const adminUser = createdUsers[0];
		// Select users who are NOT the admin/owner
		const potentialStaffUsers = createdUsers.filter(u => u.id !== adminUser?.id);

		if (potentialStaffUsers.length === 0) {
			console.warn("No non-admin users available to assign as venue staff. Skipping.");
		} else {
			for (const venue of createdVenues) {
				// Ensure we don't try to assign more staff than available
				const maxStaffToAdd = Math.min(3, potentialStaffUsers.length);
				if (maxStaffToAdd <= 0) continue; // Skip if no potential staff left

				const staffCount = faker.number.int({ min: 1, max: maxStaffToAdd });
				// Select random non-admin users to be staff for this venue
				const staffUsersForVenue = faker.helpers.arrayElements(potentialStaffUsers, staffCount);

				for (const staffUser of staffUsersForVenue) {
					// Assign a random staff role
					const assignedRole = faker.helpers.arrayElement(potentialStaffRoles);
					// Permissions array seeded as empty. Casbin rules + venue_staffs.role define base permissions.
					// This field can be used for specific overrides later if needed.

					try {
						// Check if assignment exists first
						const existingStaff = await prisma.venue_staffs.findFirst({
							where: { venue_id: venue.id, user_id: staffUser.id },
						});
						if (!existingStaff) {
							await prisma.venue_staffs.create({
								data: {
									venue_id: venue.id,
									user_id: staffUser.id,
									role: assignedRole, // Assign the role string (used by Casbin)
									permissions: [], // Seed empty array; use for specific overrides if needed
									status: 'active',
								},
							});
							console.log(`Assigned user ${staffUser.email} as ${assignedRole} to venue ${venue.name}`);
						}
					} catch (staffError) {
						console.error(`Error assigning staff user ${staffUser.id} (${assignedRole}) to venue ${venue.id}:`, staffError);
					}
				}
			}
		}
		// Note: venueStaffAssignments variable removed as it was unused.
		// We will query venue_staffs directly later to generate 'g' rules.
		console.log('Finished seeding venue staff.');


		// --- 9. Seed Casbin Rules ---
		console.log('Seeding Casbin policy (p) and grouping (g) rules...');

		// Policy (p) rules define permissions for roles
		const policyRules = [
			// Admin
			{ ptype: 'p', v0: 'admin', v1: '*', v2: '.*' }, // Admin gets all permissions globally
			// Manager (assuming role name is 'manager')
			// Manager (permissions apply within the context of their assigned venue - enforced by v2 in 'g' rules)
			{ ptype: 'p', v0: 'manager', v1: 'Venue Management', v2: 'read' }, // Example: Read venue details
			{ ptype: 'p', v0: 'manager', v1: 'Venue Management', v2: 'update' },// Example: Update venue details
			{ ptype: 'p', v0: 'manager', v1: 'Product Management', v2: '.*' },   // Example: Full product control
			{ ptype: 'p', v0: 'manager', v1: 'Event Management', v2: '.*' },     // Example: Full event control
			{ ptype: 'p', v0: 'manager', v1: 'Staff Management', v2: '.*' },   // Example: Manage staff for the venue
			// Staff (permissions apply within the context of their assigned venue - enforced by v2 in 'g' rules)
			{ ptype: 'p', v0: 'staff', v1: 'Venue Management', v2: 'read' },  // Example: Read venue details
			{ ptype: 'p', v0: 'staff', v1: 'Product Management', v2: 'read' }, // Example: Read products
			{ ptype: 'p', v0: 'staff', v1: 'Event Management', v2: 'read' },   // Example: Read events
			// Customer (global permissions)
			{ ptype: 'p', v0: 'customer', v1: 'Venue Public Info', v2: 'read' }, // Example: View public venue info
			{ ptype: 'p', v0: 'customer', v1: 'Product Public Info', v2: 'read' },// Example: View public product info
			{ ptype: 'p', v0: 'customer', v1: 'Event Public Info', v2: 'read' },  // Example: View public event info
		];

		// Grouping (g) rules assign roles to users, potentially within a domain/venue (v2)
		const groupingRules = [];

		// 1. Assign 'admin' role globally to the first user
		if (adminUser?.id) {
			console.log(`Assigning admin role to user ${adminUser.email}`);
			groupingRules.push({ ptype: 'g', v0: adminUser.id, v1: 'admin' });
		}

		// 2. Assign 'manager'/'staff' roles per venue based on venue_staffs
		const staffUserIds = new Set<string>();
		for (const venue of createdVenues) {
			const staffForVenue = await prisma.venue_staffs.findMany({
				where: { venue_id: venue.id },
				select: { user_id: true, role: true },
			});
			for (const staff of staffForVenue) {
				groupingRules.push({ ptype: 'g', v0: staff.user_id, v1: staff.role, v2: venue.id });
				staffUserIds.add(staff.user_id); // Keep track of users assigned a staff/manager role
			}
		}

		// 3. Assign 'customer' role globally to users who are not admin and not staff/manager in any venue
		const customerUsers = createdUsers.filter(u => u.id !== adminUser?.id && !staffUserIds.has(u.id));
		for (const customer of customerUsers) {
			groupingRules.push({ ptype: 'g', v0: customer.id, v1: 'customer' });
		}

		// Combine policy and grouping rules
		const allCasbinRules = [...policyRules, ...groupingRules];

		// Seed all rules
		await prisma.casbin_rule.createMany({
			data: allCasbinRules,
			skipDuplicates: true,
		});
		console.log(`Seeded ${allCasbinRules.length} Casbin rules (${policyRules.length} policy, ${groupingRules.length} grouping).`);

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
