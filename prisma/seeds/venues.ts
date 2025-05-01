import { PrismaClient, Prisma, venue_categories } from '@prisma/client'; // Correct type import: venue_categories
import { faker } from '@faker-js/faker';
import { randomDecimal } from './helpers'; // Import helper

// Remove duplicate id field
export interface CreatedVenue {
	id: string;
	owner_id: string;
}

// Update function signature to accept seeded categories with correct type
export async function seedVenues(prisma: PrismaClient, userIds: string[], venueCategories: venue_categories[]): Promise<CreatedVenue[]> {
	console.log('Seeding Venues...');
	const createdVenues: CreatedVenue[] = [];
	const categoryIds = venueCategories.map(cat => cat.id); // Extract category IDs

	if (categoryIds.length === 0) {
		console.warn("⚠️ Warning: No venue categories provided to seedVenues. Venues will be created without categories.");
	}

	for (let i = 0; i < 8; i++) { // Increase venue count slightly
		const ownerId = faker.helpers.arrayElement(userIds);
		try {
			// Base data without category_id first
			const venueData: Prisma.venuesCreateInput = {
				name: faker.company.name() + ` ${faker.helpers.arrayElement(['Club', 'Lounge', 'Bar', 'Restaurant'])}`,
				description: faker.lorem.paragraph(2),
				address: faker.location.streetAddress(true),
				latitude: randomDecimal(10.0, 21.0, 8), // VN coordinates
				longitude: randomDecimal(102.0, 109.0, 8),
				website: faker.internet.url(), // Corrected field name
				phone_number: faker.phone.number(), // Corrected field name
				email: faker.internet.email(),
				status: faker.helpers.arrayElement(['active', 'pending', 'closed', 'renovation']),
				timezone: faker.location.timeZone(),
				currency: 'VND',
				is_active: faker.datatype.boolean(0.9), // 90% active
				users: { connect: { id: ownerId } }, // Connect to owner
				created_at: faker.date.past({ years: 2 }),
				updated_at: faker.date.recent({ days: 60 }),
			};

			// Conditionally connect venue_categories if categories exist
			if (categoryIds.length > 0) {
				venueData.venue_categories = { connect: { id: faker.helpers.arrayElement(categoryIds) } };
			}

			const venue = await prisma.venues.create({
				data: venueData,
				select: { id: true, owner_id: true } // Select necessary fields
			});
			createdVenues.push(venue);
		} catch (error) {
			console.error(`Error seeding venue ${i + 1}:`, error);
		}
	}
	console.log(`-> Seeded ${createdVenues.length} venues.`);
	return createdVenues;
}

export async function seedVenueRelatedData(prisma: PrismaClient, venues: CreatedVenue[], userIds: string[]) {
	console.log('Seeding Venue Settings, Staff, and Photos...');
	let createdSettingsCount = 0;
	let createdStaffCount = 0;
	let createdPhotosCount = 0;

	for (const venue of venues) {
		const baseDate = faker.date.past({ years: 1 });

		// --- Seed Venue Settings (One-to-One) ---
		try {
			await prisma.venue_settings.create({
				data: {
					venues: { connect: { id: venue.id } },
					timezone: faker.location.timeZone(),
					currency: 'VND',
					business_hours: { // Example JSON
						mon: { open: '10:00', close: '23:00' },
						tue: { open: '10:00', close: '23:00' },
						wed: { open: '10:00', close: '23:00' },
						thu: { open: '10:00', close: '00:00' },
						fri: { open: '10:00', close: '01:00' },
						sat: { open: '11:00', close: '01:00' },
						sun: null, // Closed on Sunday example
					},
					booking_settings: { allow_online: true, min_lead_time_hours: 2, max_lead_time_days: 60 },
					loyalty_settings: { enabled: true, points_per_vnd: 0.01, reward_threshold_points: 500 },
					affiliate_settings: { enabled: false },
					created_at: baseDate,
					updated_at: faker.date.between({ from: baseDate, to: new Date() }),
				}
			});
			createdSettingsCount++;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				console.warn(`Skipping duplicate venue settings for venue: ${venue.id}`);
			} else {
				console.error(`Error seeding settings for venue ${venue.id}:`, error);
			}
		}

		// --- Seed Venue Staff (Many-to-Many implicit) ---
		const staffCount = faker.number.int({ min: 3, max: 8 });
		const potentialStaffIds = userIds.filter(id => id !== venue.owner_id); // Exclude owner
		const staffUserIds = faker.helpers.arrayElements(potentialStaffIds, Math.min(staffCount, potentialStaffIds.length));

		for (const userId of staffUserIds) {
			try {
				await prisma.venue_staffs.create({
					data: {
						venues: { connect: { id: venue.id } },
						user_id: userId,
						role: faker.helpers.arrayElement(['manager', 'waiter', 'bartender', 'host', 'kitchen']),
						permissions: faker.helpers.arrayElements(['orders:create', 'orders:read', 'tables:update', 'inventory:read', 'events:read'], faker.number.int({ min: 1, max: 4 })),
						status: 'active',
						created_at: baseDate,
						updated_at: faker.date.between({ from: baseDate, to: new Date() }),
					}
				});
				createdStaffCount++;
			} catch (error) {
				console.error(`Error seeding staff ${userId} for venue ${venue.id}:`, error);
			}
		}

		// --- Seed Venue Photos (One-to-Many) ---
		const photoCount = faker.number.int({ min: 4, max: 10 });
		let hasPrimary = false;
		for (let i = 0; i < photoCount; i++) {
			const isPrimary = !hasPrimary && faker.datatype.boolean(0.2); // Ensure only one primary photo
			try {
				await prisma.venue_photos.create({
					data: {
						venues: { connect: { id: venue.id } },
						url: faker.image.urlPicsumPhotos(),
						caption: faker.lorem.sentence(5),
						is_primary: isPrimary,
						created_at: baseDate,
						updated_at: faker.date.between({ from: baseDate, to: new Date() }),
					}
				});
				if (isPrimary) hasPrimary = true;
				createdPhotosCount++;
			} catch (error) {
				console.error(`Error seeding photo ${i + 1} for venue ${venue.id}:`, error);
			}
		}
	}
	console.log(`-> Seeded ${createdSettingsCount} venue settings.`);
	console.log(`-> Seeded ${createdStaffCount} venue staff members.`);
	console.log(`-> Seeded ${createdPhotosCount} venue photos.`);
}
