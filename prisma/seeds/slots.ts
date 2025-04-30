import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace
import { faker } from '@faker-js/faker';
import { randomBigInt } from './helpers';
import { CreatedVenue } from './venues';


export async function seedSlots(prisma: PrismaClient, venues: CreatedVenue[]) {
	console.log('Seeding Slots...');
	let createdSlotsCount = 0;
	const slotTypes = ['table', 'booth', 'bar_seat', 'area', 'service', 'decor']; // Shortened 'service_station' to 'service'
	const shapes = ['rect', 'circle', 'ellipse', 'longrect']; // Add polygon shape
	const zones = ['Main Dining', 'Bar Area', 'Patio', 'VIP Lounge', 'Entrance', 'Kitchen Pass'];
	const statuses = ['available', 'reserved', 'blocked', 'occupied', 'maintenance'];

	for (const venue of venues) {
		const slotCount = faker.number.int({ min: 25, max: 60 }); // More slots per venue
		for (let i = 0; i < slotCount; i++) {
			const type = faker.helpers.arrayElement(slotTypes);
			const shape = faker.helpers.arrayElement(shapes);
			// Use Prisma.JsonObject for type safety with JSON fields
			const metadata: Prisma.JsonObject = { color: faker.color.rgb() };

			// Add type-specific metadata
			if (type === 'table' || type === 'booth') {
				metadata.capacity = faker.number.int({ min: 2, max: 10 });
				metadata.isReservable = true;
			} else if (type === 'bar_seat') {
				metadata.capacity = 1;
				metadata.isReservable = false;
			} else if (type === 'area') {
				metadata.description = 'Standing Area';
				metadata.isReservable = false;
			} else {
				metadata.isReservable = false; // Decor, service stations aren't reservable
			}

			// Add shape-specific metadata (e.g., points for polygon)
			// Prisma.JsonObject allows arbitrary properties, but we ensure structure here
			if (shape === 'polygon') {
				metadata['points'] = Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => ({
					x: faker.number.int({ min: 0, max: 50 }),
					y: faker.number.int({ min: 0, max: 50 })
				}));
			}

			try {
				await prisma.slots.create({
					data: {
						venue_id: venue.id,
						label: `${type.substring(0, 1).toUpperCase()}${faker.string.alphanumeric(4)}`, // e.g., TAbc1, BDef2
						type: type,
						x: randomBigInt(10, 1180), // Position within a larger map potentially
						y: randomBigInt(10, 780),
						width: randomBigInt(20, (type === 'area' ? 150 : 80)), // Areas can be wider
						height: randomBigInt(20, (type === 'area' ? 150 : 80)),
						rotation: BigInt(faker.number.int({ min: 0, max: 359 })), // Any rotation
						shape: shape,
						zone: faker.helpers.arrayElement(zones),
						status: faker.helpers.arrayElement(statuses),
						metadata: metadata,
						created_at: faker.date.past({ years: 1 }),
						updated_at: faker.date.recent({ days: 50 }),
					}
				});
				createdSlotsCount++;
			} catch (error) {
				console.error(`Error seeding slot ${i + 1} for venue ${venue.id}:`, error);
			}
		}
	}
	console.log(`-> Seeded ${createdSlotsCount} slots.`);
}
