import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedAuditLogs(prisma: PrismaClient, userIds: (string | null)[], tenantIds: (string | null)[]) {
	console.log('Seeding Audit Logs...');
	const auditLogsData: Prisma.audit_logsCreateManyInput[] = [];
	const resourceTypes = ['user', 'tenant', 'role', 'permission', 'profile', 'setting', 'auth_config', 'casbin_rule']; // Updated resource types
	const actionTypes = ['create', 'update', 'delete', 'login', 'logout', 'view', 'assign_role', 'change_status', 'invite_user', 'verify_email', 'reset_password']; // Expanded action types

	for (let i = 0; i < 150; i++) { // Number of logs
		const randomUserId = userIds.length > 0 ? faker.helpers.arrayElement(userIds) : null;
		const randomTenantId = tenantIds.length > 0 && faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(tenantIds) : null; // 70% chance to have a tenant_id
		const resourceType = faker.helpers.arrayElement(resourceTypes);
		const actionType = faker.helpers.arrayElement(actionTypes);
		const now = new Date();
		const createdAt = faker.date.past({ years: 1, refDate: now }); // Define createdAt here

		auditLogsData.push({
			user_id: randomUserId,
			tenant_id: randomTenantId,
			action_type: actionType,
			resource_type: resourceType,
			resource_id: faker.string.uuid(),
			description: `User ${randomUserId ? randomUserId.substring(0, 8) : 'SYSTEM'} performed ${actionType} on ${resourceType} ${faker.string.uuid().substring(0, 8)}. Tenant: ${randomTenantId ? randomTenantId.substring(0, 8) : 'N/A'}`,
			metadata: {
				details: faker.lorem.sentence(),
				target: faker.lorem.word(),
				change_summary: `Field ${faker.lorem.word()} changed from ${faker.lorem.word()} to ${faker.lorem.word()}`,
			},
			ip_address: faker.internet.ip(),
			user_agent: faker.internet.userAgent(),
			created_at: createdAt,
			updated_at: faker.date.between({ from: createdAt, to: now }), // Ensure updated_at is after created_at
		});
	}

	try {
		await prisma.audit_logs.createMany({ data: auditLogsData });
		console.log(`-> Seeded ${auditLogsData.length} audit logs.`);
	} catch (error) {
		console.error('Error seeding audit logs:', error);
	}
}
