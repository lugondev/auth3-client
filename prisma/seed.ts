import { PrismaClient } from '@prisma/client';
import { clearDatabase } from './seeds/helpers';
import { seedUsers, seedUserRelatedData, SeededUser } from './seeds/users';
import { seedAuditLogs } from './seeds/auditLogs';
import { seedCasbinRules } from './seeds/casbinRules';
import { seedTenants, seedTenantAuthConfigs, seedTenantUsers } from './seeds/tenants';
import { seedPermissions, seedRoles, seedRolePermissions, seedUserRoles } from './seeds/rbacDb';
import { seedPasswordResetTokens, seedPhoneVerificationTokens, seedEmailVerificationTokens } from './seeds/userTokens';
import { seedSocialProfiles } from './seeds/socialProfiles';

const prisma = new PrismaClient();

async function main() {
	console.log('🚀 Starting database seeding process...');

	// 1. Clear existing data (optional, uncomment to enable)
	// Make sure clearDatabase is comprehensive and in the correct order.
	await clearDatabase(prisma);
	console.log('✅ Database cleared.');

	// --- Seed Core Data ---
	// 2. Seed Users: Returns users with id, email, phone
	const seededUsers: SeededUser[] = await seedUsers(prisma);
	const userIds = seededUsers.map(u => u.id); // Extract just IDs for functions that need string[]
	if (seededUsers.length === 0) {
		console.warn('No users were seeded. Subsequent dependent seeds might be skipped or fail.');
		// Optionally, decide if seeding should stop here.
	}

	// 3. Seed Tenants: Returns tenants with id
	// Tenants can have an owner_user_id, so pass userIds.
	const tenants = await seedTenants(prisma, userIds);
	const tenantIds = tenants.map(t => t.id);
	if (tenants.length === 0) {
		console.warn('No tenants were seeded. Subsequent dependent seeds might be skipped or fail.');
	}

	// --- Seed Tenant-Specific Configurations ---
	// 4. Seed Tenant Auth Configs (One-to-One with Tenants)
	await seedTenantAuthConfigs(prisma, tenantIds);

	// 5. Seed Tenant User Memberships (Many-to-Many between Users and Tenants)
	// This tells us which user belongs to which tenant.
	await seedTenantUsers(prisma, userIds, tenantIds);
	// For seedUserRoles, we might need the actual tenant_user records if roles are tenant-specific
	// and users are assigned roles *within* a tenant context.
	// Let's fetch them back for clarity, or adjust seedUserRoles to take userIds and tenantIds
	// and figure out memberships internally if simpler.
	// For now, assuming seedUserRoles will use the `roles` (which are tenant-linked) and `userIds`.
	const tenantUserMemberships = await prisma.tenant_users.findMany({
		select: { user_id: true, tenant_id: true },
	});


	// --- Seed RBAC Data (Database-backed RBAC, not Casbin yet) ---
	// 6. Seed Permissions (Global list of available permissions)
	const permissions = await seedPermissions(prisma);
	// const permissionIds = permissions.map(p => p.id); // Unused, can be removed
	const permissionsWithName = permissions.map(p => ({ id: p.id, name: p.name }));


	// 7. Seed Roles (Roles are per tenant)
	// seedRoles returns { id: string, tenant_id: string, name: string, is_system_role: boolean }[]
	const roles = await seedRoles(prisma, tenantIds);
	if (roles.length === 0 && tenantIds.length > 0) {
		console.warn('No roles were seeded even though tenants exist. RBAC assignment might be incomplete.');
	}


	// 8. Seed Role-Permission Associations (Many-to-Many)
	// Pass full role and permission objects if name/type is needed for logic
	await seedRolePermissions(prisma, roles.map(r => ({ ...r, name: r.name || '', is_system_role: r.is_system_role || false })), permissionsWithName);


	// 9. Seed User-Role Associations (Many-to-Many)
	// Users are assigned roles within the context of their tenant memberships.
	await seedUserRoles(prisma, seededUsers.map(u => ({ id: u.id, email: u.email })), roles, tenantUserMemberships);


	// --- Seed User-Related Data (Tokens, Profiles, etc.) ---
	// 10. Seed various user tokens
	await seedPasswordResetTokens(prisma, userIds);
	await seedPhoneVerificationTokens(prisma, seededUsers); // Needs users with phone numbers
	await seedEmailVerificationTokens(prisma, userIds);

	// 11. Seed Social Profiles
	await seedSocialProfiles(prisma, userIds);

	// 12. Seed other user-related data (UserProfiles, RefreshTokens, Sessions)
	// This function is already in users.ts and takes SeededUser[]
	await seedUserRelatedData(prisma, seededUsers);


	// --- Seed Audit Logs & Casbin Rules (Often depend on other data) ---
	// 13. Seed Audit Logs
	// Audit logs can be associated with users and tenants.
	// Pass (string | null)[] for userIds and tenantIds to allow for system logs or logs not tied to a specific tenant/user.
	const allUserIdsForAudit = [null, ...userIds];
	const allTenantIdsForAudit = [null, ...tenantIds];
	await seedAuditLogs(prisma, allUserIdsForAudit, allTenantIdsForAudit);

	// 14. Seed Casbin Rules (For policy-based access control)
	// Fetch the user-role assignments with tenant context for Casbin
	const userRoleAssignmentsForCasbin = await prisma.user_roles.findMany({
		select: {
			user_id: true,
			role_id: true,
			roles: { // Access the related role
				select: {
					tenant_id: true, // Get tenant_id from the role
				}
			}
		}
	});
	const casbinUserRoles = userRoleAssignmentsForCasbin.map(ur => ({
		user_id: ur.user_id,
		role_id: ur.role_id,
		tenant_id: ur.roles.tenant_id,
	}));

	// Pass all created roles and the tenant-specific user-role assignments to Casbin seeder
	await seedCasbinRules(prisma, roles, casbinUserRoles);

	console.log('✅ Database seeding completed successfully!');
}

main()
	.catch(async (e) => {
		console.error('❌ Database seeding failed:', e);
		await prisma.$disconnect();
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
