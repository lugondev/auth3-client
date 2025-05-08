import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Seeds tenants into the database.
 * Ensures that each tenant has a unique slug.
 * Optionally assigns an owner from the provided userIds.
 *
 * @param prisma - The PrismaClient instance.
 * @param userIds - An array of user IDs to pick tenant owners from.
 * @returns A promise that resolves to an array of created tenant objects, each containing its id.
 */
export async function seedTenants(prisma: PrismaClient, userIds: string[]): Promise<{ id: string }[]> {
	console.log('Seeding Tenants...');
	const tenantsData: Prisma.tenantsCreateInput[] = [];
	const numberOfTenants = 10; // Create 10 tenants

	for (let i = 0; i < numberOfTenants; i++) {
		const companyName = faker.company.name();
		const slug = faker.helpers.slugify(companyName).toLowerCase();
		const now = new Date();
		const createdAt = faker.date.past({ years: 2, refDate: now });

		const tenantInput: Prisma.tenantsCreateInput = {
			name: companyName,
			slug: `${slug}-${faker.string.alphanumeric(4)}`, // Ensure slug uniqueness
			is_active: faker.datatype.boolean(0.9), // 90% chance of being active
			created_at: createdAt,
			updated_at: faker.date.between({ from: createdAt, to: now }),
			// Optionally assign an owner if userIds are available
			users: userIds.length > 0 && faker.datatype.boolean(0.7) // 70% chance to have an owner
				? { connect: { id: faker.helpers.arrayElement(userIds) } }
				: undefined,
		};
		tenantsData.push(tenantInput);
	}

	const createdTenants: { id: string }[] = [];
	for (const data of tenantsData) {
		try {
			const tenant = await prisma.tenants.create({ data });
			createdTenants.push(tenant);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				// If slug is not unique, try creating with a more unique slug
				console.warn(`Slug conflict for ${data.slug}, attempting to re-generate...`);
				const uniqueSlug = `${data.slug}-${faker.string.uuid().substring(0, 8)}`;
				try {
					const tenant = await prisma.tenants.create({
						data: { ...data, slug: uniqueSlug },
					});
					createdTenants.push(tenant);
					console.log(`-> Tenant created with fallback slug: ${uniqueSlug}`);
				} catch (retryError) {
					console.error(`Failed to create tenant even with fallback slug ${uniqueSlug}:`, retryError);
				}
			} else {
				console.error(`Error seeding tenant ${data.name}:`, error);
				// Decide if you want to throw or continue
			}
		}
	}

	console.log(`-> Seeded ${createdTenants.length} tenants.`);
	return createdTenants;
}

/**
 * Seeds tenant authentication configurations.
 * Each tenant gets a configuration.
 *
 * @param prisma - The PrismaClient instance.
 * @param tenantIds - An array of tenant IDs to create configurations for.
 */
export async function seedTenantAuthConfigs(prisma: PrismaClient, tenantIds: string[]): Promise<void> {
	console.log('Seeding Tenant Auth Configs...');
	if (tenantIds.length === 0) {
		console.log('No tenant IDs provided, skipping tenant auth config seeding.');
		return;
	}
	const authConfigsData: Prisma.tenant_auth_configsCreateInput[] = [];

	for (const tenantId of tenantIds) {
		const now = new Date();
		const createdAt = faker.date.past({ years: 1, refDate: now });
		authConfigsData.push({
			tenants: { connect: { id: tenantId } }, // Link to the tenant
			enable_rbac: faker.datatype.boolean(0.8), // 80% enable RBAC
			rbac_config: { default_role: 'member', guest_role: 'guest' },
			enable_o_auth: faker.datatype.boolean(0.3), // 30% enable OAuth
			o_auth_providers: {
				google: { client_id: faker.string.alphanumeric(20), client_secret: faker.string.alphanumeric(30) },
				github: { client_id: faker.string.alphanumeric(20), client_secret: faker.string.alphanumeric(30) },
			},
			enable_sso: faker.datatype.boolean(0.1), // 10% enable SSO
			sso_config: { type: 'saml', idp_url: faker.internet.url() },
			mfa_policy: faker.helpers.arrayElement(['disabled', 'optional', 'required_all_users']),
			password_policy: {
				min_length: faker.number.int({ min: 8, max: 12 }),
				require_uppercase: faker.datatype.boolean(),
				require_lowercase: true,
				require_numbers: faker.datatype.boolean(),
				require_symbols: faker.datatype.boolean(),
			},
			session_duration_minutes: faker.helpers.arrayElement([BigInt(60), BigInt(120), BigInt(1440), BigInt(10080)]), // 1hr, 2hr, 1day, 1week
			created_at: createdAt,
			updated_at: faker.date.between({ from: createdAt, to: now }),
		});
	}

	try {
		// Prisma doesn't have createMany for one-to-one with existing parent, so loop
		let count = 0;
		for (const data of authConfigsData) {
			await prisma.tenant_auth_configs.create({ data });
			count++;
		}
		console.log(`-> Seeded ${count} tenant auth configs.`);
	} catch (error) {
		console.error('Error seeding tenant auth configs:', error);
	}
}

/**
 * Seeds tenant users (memberships).
 * Assigns users to tenants. Each user can be part of multiple tenants.
 *
 * @param prisma - The PrismaClient instance.
 * @param userIds - An array of user IDs.
 * @param tenantIds - An array of tenant IDs.
 */
export async function seedTenantUsers(prisma: PrismaClient, userIds: string[], tenantIds: string[]): Promise<void> {
	console.log('Seeding Tenant Users (Memberships)...');
	if (userIds.length === 0 || tenantIds.length === 0) {
		console.log('No user or tenant IDs provided, skipping tenant user seeding.');
		return;
	}
	const tenantUsersData: Prisma.tenant_usersCreateManyInput[] = [];
	const numberOfMemberships = Math.min(userIds.length * 2, 30); // Create up to 30 memberships or 2 per user

	const existingMemberships = new Set<string>(); // To avoid duplicate (user_id, tenant_id) pairs

	for (let i = 0; i < numberOfMemberships; i++) {
		const userId = faker.helpers.arrayElement(userIds);
		const tenantId = faker.helpers.arrayElement(tenantIds);
		const membershipKey = `${userId}-${tenantId}`;

		if (existingMemberships.has(membershipKey)) {
			continue; // Skip if this combination already added
		}
		existingMemberships.add(membershipKey);

		const now = new Date();
		const createdAt = faker.date.past({ years: 1, refDate: now });
		tenantUsersData.push({
			user_id: userId,
			tenant_id: tenantId,
			status: faker.helpers.arrayElement(['active', 'pending_approval', 'invited', 'disabled']),
			created_at: createdAt,
			updated_at: faker.date.between({ from: createdAt, to: now }),
		});
	}

	if (tenantUsersData.length > 0) {
		try {
			await prisma.tenant_users.createMany({
				data: tenantUsersData,
				skipDuplicates: true, // Important for many-to-many if re-running
			});
			console.log(`-> Seeded ${tenantUsersData.length} tenant user memberships.`);
		} catch (error) {
			console.error('Error seeding tenant users:', error);
		}
	} else {
		console.log('No new tenant user memberships to seed.');
	}
}
