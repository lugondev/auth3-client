import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Local instance

// Renamed from 'categories' to avoid confusion with the return value
const categoriesData = [
	{
		id: 'd2a0d4e0-9b9b-4b9c-8b9c-8b9c8b9c8b9c', // Fixed UUID for consistency
		name: 'Restaurant',
		slug: 'restaurant',
		icon: '🍔',
	},
	{
		id: 'e3b1e5f1-acac-5cac-9cac-9cac9cac9cac', // Fixed UUID for consistency
		name: 'Bar',
		slug: 'bar',
		icon: '🍺',
	},
	{
		id: 'f4c2f6a2-bdbd-6dbd-adbd-adbdadbdadbd', // Fixed UUID for consistency
		name: 'Cafe',
		slug: 'cafe',
		icon: '☕',
	},
];

export async function seedVenueCategories() { // Removed prisma argument
	console.log('Seeding venue categories...');
	for (const category of categoriesData) { // Use renamed array
		await prisma.venue_categories.upsert({ // Correct model name: venue_categories
			where: { id: category.id },
			update: {},
			create: category,
		});
	}
	console.log('Venue categories seeded.');

	// Fetch the seeded categories from the DB to get the full Prisma type
	const seededCategories = await prisma.venue_categories.findMany({ // Correct model name: venue_categories
		where: {
			// Fetch only the ones we just seeded/updated based on the initial data IDs
			id: { in: categoriesData.map(cat => cat.id) }
		}
	});
	console.log(`-> Fetched ${seededCategories.length} venue categories from DB.`);
	return seededCategories; // Return the actual DB records with the full type
}
// Removed main() call as this file is likely just exporting the function
