import { PrismaClient } from '@prisma/client'
import { seedVenues } from './seeds/venues'
import { seedProducts } from './seeds/products'
import { seedEvents } from './seeds/events'
import { seedUsers } from './seeds/users'
import { seedTables } from './seeds/tables'

const prisma = new PrismaClient()

async function main() {
	console.log('Starting database seed...')

	try {
		// Clean existing data in correct order (respect foreign key constraints)
		await prisma.$transaction([
			// Audit related
			prisma.audit_logs.deleteMany(),
			
			// User related
			prisma.refresh_tokens.deleteMany(),
			prisma.sessions.deleteMany(),
			prisma.social_profiles.deleteMany(),
			prisma.user_profiles.deleteMany(),
			prisma.user_roles.deleteMany(),
			
			// Event related
			prisma.event_performers.deleteMany(),
			prisma.event_photos.deleteMany(),
			prisma.event_tickets.deleteMany(),
			prisma.events.deleteMany(),

			// Product related
			prisma.option_choices.deleteMany(),
			prisma.product_options.deleteMany(),
			prisma.product_photos.deleteMany(),
			prisma.products.deleteMany(),
			prisma.product_categories.deleteMany(),

			// Table related
			prisma.table_positions.deleteMany(),
			prisma.table_maps.deleteMany(),
			prisma.tables.deleteMany(),

			// Venue related
			prisma.venue_photos.deleteMany(),
			prisma.venue_settings.deleteMany(),
			prisma.venue_staffs.deleteMany(),
			prisma.venues.deleteMany(),
			
			// Role related
			prisma.roles.deleteMany(),
			
			// User related (delete last)
			prisma.users.deleteMany(),
		])

		// Seed users and roles first
		const { users, roles } = await seedUsers(prisma)
		console.log(`Created ${users.length} users and ${roles.length} roles`)

		// Seed venues and related data
		const { venues, categories } = await seedVenues(prisma)
		console.log(`Created ${venues.length} venues and ${categories.length} categories`)

		// Seed products with options and choices
		const { products } = await seedProducts(prisma, { venues, categories })
		console.log(`Created ${products.length} products`)

		// Seed events with performers and tickets
		const { events } = await seedEvents(prisma, { venues })
		console.log(`Created ${events.length} events`)
		
		// Seed tables and table maps
		const { tables } = await seedTables(prisma, { venues })
		console.log(`Created ${tables.length} tables`)

		console.log('Seed completed successfully')
	} catch (error) {
		console.error('Error during seeding:', error)
		throw error
	}
}

main()
	.catch((e) => {
		console.error('Failed to seed database:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
