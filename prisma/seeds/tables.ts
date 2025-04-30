import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace
import { faker } from '@faker-js/faker';
import { randomBigInt, randomDecimal } from './helpers';
import { CreatedVenue } from './venues';

interface CreatedTable {
	id: string;
	venue_id: string;
	name: string;
}

interface CreatedMap {
	id: string;
	venue_id: string;
}

export async function seedTables(prisma: PrismaClient, venues: CreatedVenue[]): Promise<CreatedTable[]> {
	console.log('Seeding Tables...');
	const createdTables: CreatedTable[] = [];
	const tableTypes = ['standard', 'booth', 'high_top', 'communal', 'bar_stool', 'outdoor'];
	const locations = ['Main Dining', 'Patio', 'Bar Area', 'VIP Section', 'Window Side', 'Rooftop'];

	for (const venue of venues) {
		const tableCount = faker.number.int({ min: 15, max: 40 }); // More tables
		for (let i = 0; i < tableCount; i++) {
			const capacity = randomBigInt(1, 12); // Capacity from 1 (bar stool) to 12
			const tableType = faker.helpers.arrayElement(tableTypes);
			const minSpend = (tableType === 'VIP Section' || capacity > 8) && faker.datatype.boolean(0.4)
				? randomDecimal(500000, 3000000, 0) // Higher min spend for VIP/large tables
				: new Prisma.Decimal(0);

			try {
				const table = await prisma.tables.create({
					data: {
						venues: { connect: { id: venue.id } },
						name: `T${i + 1}`, // Simpler names T1, T2...
						description: `${faker.word.adjective()} ${tableType} table`,
						capacity: capacity,
						status: faker.helpers.arrayElement(['available', 'occupied', 'reserved', 'unavailable', 'cleaning']),
						location: faker.helpers.arrayElement(locations),
						min_spend: minSpend,
						table_type: tableType,
						is_active: faker.datatype.boolean(0.98), // Most tables are active
						created_at: faker.date.past({ years: 1 }),
						updated_at: faker.date.recent({ days: 45 }),
					},
					select: { id: true, venue_id: true, name: true }
				});
				createdTables.push(table);
			} catch (error) {
				console.error(`Error seeding table ${i + 1} for venue ${venue.id}:`, error);
			}
		}
	}
	console.log(`-> Seeded ${createdTables.length} tables.`);
	return createdTables;
}

export async function seedTableMapsAndPositions(prisma: PrismaClient, venues: CreatedVenue[], tables: CreatedTable[]) {
	console.log('Seeding Table Maps and Positions...');
	let createdMapsCount = 0;
	let createdPositionsCount = 0;
	const createdMaps: CreatedMap[] = [];

	// Create maps first
	for (const venue of venues) {
		const mapCount = faker.number.int({ min: 1, max: 3 }); // 1-3 maps per venue (e.g., floors)
		for (let i = 0; i < mapCount; i++) {
			try {
				const map = await prisma.table_maps.create({
					data: {
						venue_id: venue.id,
						name: `${faker.helpers.arrayElement(['Ground Floor', 'Upstairs', 'Patio', 'Main Area'])} Map ${i + 1}`,
						map_data: { // Example JSON structure
							svgUrl: faker.image.urlPicsumPhotos({}), // Link to an SVG background/layout
							width: 1200,
							height: 800,
							gridSize: 10,
						},
						created_at: faker.date.past({ years: 1 }),
						updated_at: faker.date.recent({ days: 30 }),
					},
					select: { id: true, venue_id: true }
				});
				createdMaps.push(map);
				createdMapsCount++;
			} catch (error) {
				console.error(`Error seeding map ${i + 1} for venue ${venue.id}:`, error);
			}
		}
	}

	// Create positions linking tables to maps
	const venueMapsMap = new Map<string, string[]>(); // venueId -> [mapId1, mapId2, ...]
	createdMaps.forEach(map => {
		if (!venueMapsMap.has(map.venue_id)) {
			venueMapsMap.set(map.venue_id, []);
		}
		venueMapsMap.get(map.venue_id)?.push(map.id);
	});

	for (const table of tables) {
		const venueMapIds = venueMapsMap.get(table.venue_id);
		if (venueMapIds && venueMapIds.length > 0) {
			const mapId = faker.helpers.arrayElement(venueMapIds); // Assign table to a random map of the venue
			try {
				await prisma.table_positions.create({
					data: {
						map_id: mapId,
						table_id: table.id,
						x: randomBigInt(50, 1150), // Coordinates within map bounds
						y: randomBigInt(50, 750),
						width: randomBigInt(40, 100), // Size of table representation
						height: randomBigInt(40, 100),
						rotation: BigInt(faker.helpers.arrayElement([0, 45, 90, 135, 180, 225, 270, 315])), // More rotation options
						created_at: faker.date.past({ years: 1 }),
						updated_at: faker.date.recent({ days: 30 }),
					}
				});
				createdPositionsCount++;
			} catch (error) {
				console.error(`Error seeding position for table ${table.id} on map ${mapId}:`, error);
			}
		} else {
			console.warn(`No map found for venue ${table.venue_id} when seeding position for table ${table.id}`);
		}
	}

	console.log(`-> Seeded ${createdMapsCount} table maps.`);
	console.log(`-> Seeded ${createdPositionsCount} table positions.`);
}
