import { PrismaClient } from '@prisma/client'

interface Venue {
	id: string
	name: string // Added name property
}

interface Table {
	id: string
	venue_id: string
	capacity: number | bigint // Ensure capacity field is here
}

interface TableMap {
	id: string
	venue_id: string
}

// Add userId parameter
export async function seedVenues(prisma: PrismaClient, params: { userId: string }) {
	console.log('Seeding venues...')
	const { userId } = params

	// Create venues
	const venues = await prisma.$transaction([
		prisma.venues.create({
			data: {
				name: 'Nhà Hàng Sen',
				description: 'Nhà hàng ẩm thực Việt Nam cao cấp',
				address: '123 Đồng Khởi, Quận 1, TP.HCM',
				latitude: 10.762622,
				longitude: 106.660172,
				website_url: 'https://nhasen.example.com',
				phone: '+84283822xxxx',
				email: 'info@nhasen.example.com',
				status: 'active',
				timezone: 'Asia/Ho_Chi_Minh',
				currency: 'VND',
				is_active: true,
				users: { // Connect to user
					connect: { id: userId },
				},
			},
		}),
		prisma.venues.create({
			data: {
				name: 'Sky Lounge Saigon',
				description: 'Rooftop bar với view panorama thành phố',
				address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
				latitude: 10.772622,
				longitude: 106.692172,
				website_url: 'https://skylounge.example.com',
				phone: '+84283823xxxx',
				email: 'info@skylounge.example.com',
				status: 'active',
				timezone: 'Asia/Ho_Chi_Minh',
				currency: 'VND',
				is_active: true,
				users: { // Connect to user
					connect: { id: userId },
				},
			},
		}),
	]) as Venue[]

	// Create venue settings, photos, tables, maps, and positions for each venue
	await Promise.all(
		venues.map(async (venue) => {
			// Venue Settings
			await prisma.venue_settings.create({
				data: {
					venue_id: venue.id,
					timezone: 'Asia/Ho_Chi_Minh',
					currency: 'VND',
					business_hours: {
						monday: { open: '10:00', close: '22:00' },
						tuesday: { open: '10:00', close: '22:00' },
						wednesday: { open: '10:00', close: '22:00' },
						thursday: { open: '10:00', close: '22:00' },
						friday: { open: '10:00', close: '23:00' },
						saturday: { open: '11:00', close: '23:00' },
						sunday: { open: '11:00', close: '22:00' },
					},
					booking_settings: {
						min_advance_hours: 24,
						max_advance_days: 90,
						min_party_size: 2,
						max_party_size: 20,
						deposit_required: true,
						deposit_amount: 500000,
					},
					loyalty_settings: { enabled: true, points_per_vnd: 0.1, vnd_per_point: 100 },
					affiliate_settings: { enabled: true, commission_rate: 0.1, payment_threshold: 1000000 },
				},
			})

			// Venue Photos
			await prisma.venue_photos.createMany({
				data: [
					{ venue_id: venue.id, url: `https://storage.example.com/venues/${venue.id}/main.jpg`, caption: 'Không gian chính', is_primary: true },
					{ venue_id: venue.id, url: `https://storage.example.com/venues/${venue.id}/entrance.jpg`, caption: 'Lối vào', is_primary: false },
					{ venue_id: venue.id, url: `https://storage.example.com/venues/${venue.id}/dining.jpg`, caption: 'Khu vực ẩm thực', is_primary: false },
				],
			})

			// Tables
			const tables = await prisma.$transaction(
				Array.from({ length: 10 }, (_, i) =>
					prisma.tables.create({
						data: {
							venue_id: venue.id,
							name: `Bàn ${i + 1}`,
							description: `Bàn ${i % 2 === 0 ? '2' : '4'} người`,
							capacity: i % 2 === 0 ? 2 : 4, // Ensure capacity uses BigInt if necessary, or adjust schema/seed
							status: 'available',
							location: 'Tầng trệt',
							table_type: 'standard',
							is_active: true,
						},
					})
				)
			) as Table[]

			// Table Map
			const tableMap = await prisma.table_maps.create({
				data: {
					venue_id: venue.id,
					name: 'Sơ đồ tầng trệt',
					map_data: { width: 1200, height: 900, background: 'floorplan-ground.png' },
				},
			}) as TableMap

			// Table Positions
			await prisma.table_positions.createMany({
				data: tables.map((table, i) => ({
					map_id: tableMap.id,
					table_id: table.id,
					x: 50 + (i % 5) * 200, // Grid layout: 5 columns
					y: 100 + Math.floor(i / 5) * 250, // Grid layout: 2 rows
					width: table.capacity === 2 ? 80 : 120, // Correctly reference capacity
					height: table.capacity === 2 ? 80 : 120, // Correctly reference capacity
					rotation: 0, // No rotation for simplicity
				})),
			})
		})
	)

	// Create product categories (must happen after venues)
	const categories = await Promise.all(
		venues.map((venue) =>
			prisma.$transaction([
				prisma.product_categories.create({
					data: { venue_id: venue.id, name: 'Đồ uống', description: 'Các loại thức uống', display_order: 1, is_active: true },
				}),
				prisma.product_categories.create({
					data: { venue_id: venue.id, name: 'Món chính', description: 'Các món ăn chính', display_order: 2, is_active: true },
				}),
				prisma.product_categories.create({
					data: { venue_id: venue.id, name: 'Tráng miệng', description: 'Các món tráng miệng', display_order: 3, is_active: true },
				}),
			])
		)
	)

	return { venues, categories: categories.flat() }
}
