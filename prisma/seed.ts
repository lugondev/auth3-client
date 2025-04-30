import { PrismaClient } from '@prisma/client';
import { clearDatabase } from './seeds/helpers';
import { seedUsers, seedUserRelatedData } from './seeds/users';
import { seedVenues, seedVenueRelatedData } from './seeds/venues';
import { seedEvents, seedEventRelatedData } from './seeds/events';
import { seedProductCategories, seedProducts, seedProductRelatedData } from './seeds/products';
import { seedTables, seedTableMapsAndPositions } from './seeds/tables';
import { seedSlots } from './seeds/slots';
import { seedAuditLogs } from './seeds/auditLogs';
import { seedCasbinRules } from './seeds/casbinRules';

const prisma = new PrismaClient();

async function main() {
	console.log('Start seeding data...');

	// Clear existing data (optional, uncomment to enable)
	await clearDatabase(prisma);

	// --- Seed Data in Order ---
	const users = await seedUsers(prisma);
	const userIds = users.map(u => u.id);
	await seedUserRelatedData(prisma, userIds); // Seed profiles, tokens etc.

	const venues = await seedVenues(prisma, userIds);
	await seedVenueRelatedData(prisma, venues, userIds); // Seed settings, staff, photos

	const events = await seedEvents(prisma, venues);
	await seedEventRelatedData(prisma, events); // Seed performers, photos, tickets

	const categories = await seedProductCategories(prisma, venues);
	const products = await seedProducts(prisma, categories);
	await seedProductRelatedData(prisma, products); // Seed photos, options, choices

	const tables = await seedTables(prisma, venues);
	await seedTableMapsAndPositions(prisma, venues, tables); // Seed maps and positions

	await seedSlots(prisma, venues); // Seed slots

	await seedAuditLogs(prisma, userIds); // Seed audit logs

	await seedCasbinRules(prisma, userIds); // Seed RBAC rules

	console.log('\Complete seed data.');
}

main()
	.catch(async (e) => {
		console.error('seed data failed:', e);
		await prisma.$disconnect();
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
