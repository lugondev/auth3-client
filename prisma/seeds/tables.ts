import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/vi'

interface Venue {
	id: string
}

export async function seedTables(prisma: PrismaClient, params: { venues: Venue[] }) {
	console.log('Seeding tables and related data...')

	const { venues } = params
	const allTables = []

	// Create table maps and tables
	for (const venue of venues) {
		// Create table map
		const tableMap = await prisma.table_maps.create({
			data: {
				venue_id: venue.id,
				name: 'Sơ đồ chính',
				map_data: {
					width: 1200,
					height: 800,
					background: '#f5f5f5',
					walls: [
						{ x1: 0, y1: 0, x2: 1200, y2: 0 },
						{ x1: 1200, y1: 0, x2: 1200, y2: 800 },
						{ x1: 1200, y1: 800, x2: 0, y2: 800 },
						{ x1: 0, y1: 800, x2: 0, y2: 0 },
					],
				},
			},
		})

		// Create table types and locations
		const tableTypes = ['standard', 'booth', 'bar', 'outdoor', 'vip']
		const tableLocations = ['main', 'window', 'corner', 'center', 'bar', 'outdoor']

		// Create random number of tables
		const tableCount = faker.number.int({ min: 10, max: 15 })

		for (let i = 1; i <= tableCount; i++) {
			const tableType = faker.helpers.arrayElement(tableTypes)
			const location = faker.helpers.arrayElement(tableLocations)
			const capacity = tableType === 'booth' ? 6 : tableType === 'bar' ? 2 : tableType === 'vip' ? 8 : 4

			// Create table
			const table = await prisma.tables.create({
				data: {
					venue_id: venue.id,
					name: `Bàn ${i}`,
					description: `${tableType === 'vip' ? 'VIP - ' : ''}${tableType === 'booth' ? 'Booth - ' : ''}${location}`,
					capacity: capacity,
					status: faker.helpers.arrayElement(['available', 'occupied', 'reserved', 'maintenance']),
					location: location,
					min_spend: tableType === 'vip' ? 1000000 : tableType === 'booth' ? 500000 : 0,
					table_type: tableType,
					is_active: true,
				},
			})

			allTables.push(table)

			// Create table position
			await prisma.table_positions.create({
				data: {
					map_id: tableMap.id,
					table_id: table.id,
					x: faker.number.int({ min: 50, max: 1100 }),
					y: faker.number.int({ min: 50, max: 700 }),
					width: tableType === 'booth' ? 120 : tableType === 'bar' ? 60 : 80,
					height: tableType === 'booth' ? 120 : tableType === 'bar' ? 60 : 80,
					rotation: faker.helpers.arrayElement([0, 45, 90, 135, 180]),
				},
			})
		}
	}

	return { tables: allTables }
}