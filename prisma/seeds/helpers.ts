import { Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Helper function to generate a random BigInt
export function randomBigInt(min: number, max: number): bigint {
	return BigInt(faker.number.int({ min, max }));
}

// Helper function to generate a random Decimal
export function randomDecimal(min: number, max: number, fractionDigits: number = 2): Prisma.Decimal {
	return new Prisma.Decimal(faker.number.float({ min, max, fractionDigits }));
}

// Helper function to clear data (can be called from the main seed)
export async function clearDatabase(prisma: PrismaClient) {
	console.log('Clearing old data from database...');

	// Deletion order is crucial to avoid foreign key constraint violations.
	// Start with tables that are "leaves" in the dependency tree or have ON DELETE CASCADE (though explicit is safer).

	// Junction tables / tables with multiple FKs first
	await prisma.audit_logs.deleteMany({});
	await prisma.role_permissions.deleteMany({});
	await prisma.user_roles.deleteMany({});
	await prisma.tenant_users.deleteMany({});

	// Tables related to users
	await prisma.password_reset_tokens.deleteMany({});
	await prisma.phone_verification_tokens.deleteMany({});
	await prisma.verification_tokens.deleteMany({});
	await prisma.refresh_tokens.deleteMany({});
	await prisma.sessions.deleteMany({});
	await prisma.social_profiles.deleteMany({});
	await prisma.user_profiles.deleteMany({});

	// RBAC and Tenant specific tables
	await prisma.permissions.deleteMany({});
	await prisma.roles.deleteMany({}); // Depends on tenants
	await prisma.tenant_auth_configs.deleteMany({}); // Depends on tenants

	// Core tables
	await prisma.casbin_rule.deleteMany({});
	await prisma.tenants.deleteMany({}); // Depends on users (for owner_user_id)
	await prisma.users.deleteMany({});

	// Do not delete spatial_ref_sys as it is a PostGIS system table
	console.log('Old data cleared from database.');
}
