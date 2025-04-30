import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedAuditLogs(prisma: PrismaClient, userIds: string[]) {
	console.log('Seeding Audit Logs...');
	const auditLogsData: Prisma.audit_logsCreateManyInput[] = [];
	const resourceTypes = ['user', 'venue', 'event', 'product', 'table', 'slot', 'order', 'category', 'staff']; // Expanded resource types
	const actionTypes = ['create', 'update', 'delete', 'login', 'logout', 'view', 'assign_role', 'change_status']; // Expanded action types

	for (let i = 0; i < 200; i++) { // Increase number of logs
		// Allow logs with or without a specific user (system actions)
		const randomUserId = faker.helpers.arrayElement([...userIds, null]);
		const resourceType = faker.helpers.arrayElement(resourceTypes);
		const actionType = faker.helpers.arrayElement(actionTypes);

		auditLogsData.push({
			user_id: randomUserId, // Can be null
			action_type: actionType,
			resource_type: resourceType,
			resource_id: faker.string.uuid(), // ID of the resource acted upon
			description: `User ${randomUserId ? randomUserId.substring(0, 8) : 'SYSTEM'} performed ${actionType} on ${resourceType} ${faker.string.uuid().substring(0, 8)}`,
			metadata: { // Example metadata
				previous_status: faker.datatype.boolean(0.5) ? faker.lorem.word() : null,
				new_status: faker.lorem.word(),
				details: faker.lorem.sentence()
			},
			ip_address: faker.internet.ip(),
			user_agent: faker.internet.userAgent(),
			created_at: faker.date.recent({ days: 60 }), // Logs within the last 60 days
			updated_at: faker.date.recent({ days: 1 }), // Should ideally match created_at for logs
		});
	}

	try {
		await prisma.audit_logs.createMany({ data: auditLogsData });
		console.log(`-> Seeded ${auditLogsData.length} audit logs.`);
	} catch (error) {
		console.error('Error seeding audit logs:', error);
	}
}
