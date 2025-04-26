import { PrismaClient } from '@prisma/client'; // Need Prisma for types if used
import { faker } from '@faker-js/faker'; // Needed for venue_staffs
import { seedUsers } from './seeds/users';
import { seedVenues } from './seeds/venues';
import { seedTables } from './seeds/tables';
import { seedProducts } from './seeds/products';
import { seedEvents } from './seeds/events';

const prisma = new PrismaClient();

async function main() {
	console.log('Start seeding ...');

	// --- Clean existing data ---
	console.log('Deleting existing data...');
	// Delete in reverse order of creation due to FK constraints
	// Keep this comprehensive delete list from original seed.ts
	await prisma.casbin_rule.deleteMany({}); // Added deletion
	await prisma.permissions.deleteMany({}); // Added deletion
	await prisma.event_performers.deleteMany({});
	await prisma.event_photos.deleteMany({});
	await prisma.event_tickets.deleteMany({});
	await prisma.events.deleteMany({});
	await prisma.option_choices.deleteMany({});
	await prisma.product_options.deleteMany({});
	await prisma.product_photos.deleteMany({});
	await prisma.products.deleteMany({});
	await prisma.product_categories.deleteMany({});
	await prisma.table_positions.deleteMany({});
	await prisma.tables.deleteMany({});
	await prisma.table_maps.deleteMany({});
	await prisma.venue_staffs.deleteMany({}); // Keep this
	await prisma.venue_settings.deleteMany({});
	await prisma.venue_photos.deleteMany({});
	await prisma.venues.deleteMany({});
	await prisma.audit_logs.deleteMany({}); // seedUsers also seeds this, but deleting first is safer
	await prisma.sessions.deleteMany({}); // seedUsers also seeds this
	await prisma.refresh_tokens.deleteMany({}); // seedUsers also seeds this
	await prisma.social_profiles.deleteMany({}); // seedUsers also seeds this
	await prisma.user_profiles.deleteMany({}); // seedUsers also seeds this
	await prisma.user_roles.deleteMany({}); // seedUsers also seeds this
	await prisma.users.deleteMany({});
	await prisma.roles.deleteMany({}); // seedUsers also seeds this
	console.log('Existing data deleted.');

	// --- Seed using partials ---
	try {
		console.log('Seeding users, roles, profiles, audit logs...');
		// seedUsers creates roles, users, profiles, social profiles, sessions, refresh tokens, audit logs
		const { users, roles } = await seedUsers(prisma);
		console.log(`Seeded ${users.length} users and ${roles.length} roles.`);

		console.log('Seeding venues, categories, settings, photos...');
		// seedVenues creates venues, settings, photos, categories.
		const { venues, categories } = await seedVenues(prisma);
		console.log(`Seeded ${venues.length} venues and ${categories.length} categories.`);

		console.log('Seeding tables, maps, positions...');
		// seedTables specifically handles tables, maps, positions using the venues from seedVenues
		const { tables } = await seedTables(prisma, { venues });
		console.log(`Seeded ${tables.length} tables.`);

		console.log('Seeding products, options, choices...');
		// seedProducts uses venues and categories
		const { products } = await seedProducts(prisma, { venues, categories });
		console.log(`Seeded ${products.length} products.`);

		console.log('Seeding events, tickets, photos, performers...');
		// seedEvents uses venues and truncates its own tables (redundant due to global delete)
		const { events } = await seedEvents(prisma, { venues });
		console.log(`Seeded ${events.length} events.`);


		// --- Seed Permissions ---
		console.log('Seeding permissions...');
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
			{ name: 'View Products', slug: 'view_products', description: 'Allows viewing venue products', group: 'Product Management' }, // Added
			{ name: 'Manage Products', slug: 'manage_products', description: 'Allows managing venue products', group: 'Product Management' },
			// Event Management
			{ name: 'View Events', slug: 'view_events', description: 'Allows viewing venue events', group: 'Event Management' }, // Added
			{ name: 'Manage Events', slug: 'manage_events', description: 'Allows managing venue events', group: 'Event Management' },
			// RBAC Management
			{ name: 'Manage Roles', slug: 'manage_roles', description: 'Allows managing roles and their permissions', group: 'RBAC' },
			{ name: 'Manage Permissions', slug: 'manage_permissions', description: 'Allows managing permissions', group: 'RBAC' },
		];
		await prisma.permissions.createMany({
			data: permissionsData,
			skipDuplicates: true, // Avoid errors if re-running seed
		});
		console.log(`Seeded ${permissionsData.length} permissions.`);

		// --- Seed Casbin Rules (Basic Role Policies) ---
		console.log('Seeding Casbin rules...');
		// Assumes roles like 'admin', 'manager', 'staff' are created by seedUsers
		// ptype, subject (role), object (resource/group), action
		const casbinRulesData = [
			// Admin has full access
			{ ptype: 'p', v0: 'admin', v1: '*', v2: '*' }, // Grant admin all permissions on all resources

			// Manager permissions
			{ ptype: 'p', v0: 'manager', v1: 'Venue Management', v2: '*' }, // Full control over venues
			{ ptype: 'p', v0: 'manager', v1: 'Product Management', v2: '*' }, // Full control over products
			{ ptype: 'p', v0: 'manager', v1: 'Event Management', v2: '*' }, // Full control over events
			{ ptype: 'p', v0: 'manager', v1: 'User Management', v2: 'view_users' }, // Can view users
			{ ptype: 'p', v0: 'manager', v1: 'User Management', v2: 'edit_users' }, // Can edit users (example specific permission)

			// Staff permissions
			{ ptype: 'p', v0: 'staff', v1: 'Venue Management', v2: 'view_venues' }, // Can view venues
			{ ptype: 'p', v0: 'staff', v1: 'Product Management', v2: 'view_products' }, // Use the newly added slug
			{ ptype: 'p', v0: 'staff', v1: 'Event Management', v2: 'view_events' },   // Use the newly added slug

			// Add customer role policy (assuming read-only access like staff)
			{ ptype: 'p', v0: 'customer', v1: 'Venue Management', v2: 'view_venues' },
			{ ptype: 'p', v0: 'customer', v1: 'Product Management', v2: 'view_products' },
			{ ptype: 'p', v0: 'customer', v1: 'Event Management', v2: 'view_events' },

			// Example 'g' rule (if needed, requires user IDs - adapt if necessary)
			// Assuming 'admin_user_id' is the ID of the first user from seedUsers who should be admin
			// { ptype: 'g', v0: users[0]?.id, v1: 'admin' },
		];
		await prisma.casbin_rule.createMany({
			data: casbinRulesData,
			skipDuplicates: true, // Avoid errors if re-running seed
		});
		console.log(`Seeded ${casbinRulesData.length} Casbin rules.`);


		// --- Seed Venue Staff (Logic kept from original seed.ts as partials don't cover it) ---
		console.log('Seeding venue staff...');
		if (users.length === 0) {
			console.warn("No users available to assign as venue staff. Skipping.");
		} else {
			// Filter roles returned by seedUsers for staff/manager roles
			// Note: seedUsers.ts uses 'manager', original seed.ts used 'venue_manager'. Use 'manager'.
			const staffManagerRoles = roles.filter(r => ['manager', 'staff'].includes(r.name));

			if (staffManagerRoles.length === 0) {
				console.warn("No 'manager' or 'staff' roles found from seedUsers output. Cannot assign venue staff.");
			} else {
				for (const venue of venues) {
					const staffCount = faker.number.int({ min: 1, max: Math.min(5, users.length) }); // Assign 1 to min(5, user_count) staff
					const staffUsers = faker.helpers.arrayElements(users, staffCount);

					for (const staffUser of staffUsers) {
						const assignedRole = faker.helpers.arrayElement(staffManagerRoles);

						// Fetch role details again to ensure permissions are available
						// Assuming the 'roles' array from seedUsers might not contain the full permission details needed
						const roleDetails = await prisma.roles.findUnique({ where: { id: assignedRole.id } });

						if (!roleDetails || !roleDetails.permissions) {
							console.warn(`Could not retrieve permissions for role ${assignedRole.name} (ID: ${assignedRole.id}). Skipping staff assignment for user ${staffUser.id} at venue ${venue.id}.`);
							continue;
						}

						try {
							// Check if staff assignment already exists using findFirst as there's no @@unique constraint
							const existingStaff = await prisma.venue_staffs.findFirst({
								where: {
									venue_id: venue.id,
									user_id: staffUser.id,
								},
							});

							if (!existingStaff) {
								await prisma.venue_staffs.create({
									data: {
										venue_id: venue.id,
										user_id: staffUser.id,
										role: assignedRole.name,
										permissions: roleDetails.permissions, // Use permissions from fetched details
										status: 'active',
										// created_at, updated_at are handled by Prisma default() / @updatedAt
									}
								});
								console.log(`Assigned user ${staffUser.id} (${staffUser.email}) as ${assignedRole.name} to venue ${venue.id}`);
							} else {
								console.log(`User ${staffUser.id} is already assigned to venue ${venue.id}. Skipping.`);
							}
						} catch (staffError) {
							// Catch potential errors during creation
							console.error(`Error assigning staff user ${staffUser.id} to venue ${venue.id}:`, staffError);
						}
					}
				}
			}
		}

	} catch (error) {
		console.error('Error during seeding process:', error);
		// No need to disconnect here, finally block handles it
		process.exit(1); // Exit with error status
	}

	console.log('Seeding finished.');
}

main()
	.catch(async (e) => {
		console.error('Unhandled error in main:', e);
		// No need to disconnect here, finally block handles it
		process.exit(1); // Exit with error status
	})
	.finally(async () => {
		console.log('Disconnecting Prisma client...');
		try {
			await prisma.$disconnect();
			console.log('Prisma client disconnected successfully.');
		} catch (disconnectError) {
			console.error('Error disconnecting Prisma client:', disconnectError);
			process.exit(1); // Exit even if disconnect fails
		}
	});
