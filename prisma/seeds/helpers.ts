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
	console.log('Clearing old data...');
	// Deletion order is important to avoid foreign key constraint violations
	await prisma.audit_logs.deleteMany({});
	await prisma.refresh_tokens.deleteMany({});
	await prisma.sessions.deleteMany({});
	await prisma.social_profiles.deleteMany({});
	await prisma.user_profiles.deleteMany({});
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
	await prisma.venue_photos.deleteMany({});
	await prisma.venue_settings.deleteMany({});
	await prisma.venue_staffs.deleteMany({});
	await prisma.slots.deleteMany({}); // Ensure slots are also deleted
	await prisma.venues.deleteMany({});
	await prisma.users.deleteMany({});
	await prisma.casbin_rule.deleteMany({});
	// Do not delete spatial_ref_sys as it is a PostGIS system table
	console.log('Old data cleared.');
}
