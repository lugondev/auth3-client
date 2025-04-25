import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate random BigInt
function randomBigInt(max: number): bigint {
	return BigInt(faker.number.int({ min: 1, max }));
}

async function main() {
	console.log('Start seeding ...');

	// --- Clean existing data (optional but recommended for repeatable seeds) ---
	console.log('Deleting existing data...');
	// Delete in reverse order of creation due to FK constraints
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
	await prisma.venue_staffs.deleteMany({});
	await prisma.venue_settings.deleteMany({});
	await prisma.venue_photos.deleteMany({});
	await prisma.venues.deleteMany({});
	await prisma.audit_logs.deleteMany({});
	await prisma.sessions.deleteMany({});
	await prisma.refresh_tokens.deleteMany({});
	await prisma.social_profiles.deleteMany({});
	await prisma.user_profiles.deleteMany({});
	await prisma.user_roles.deleteMany({});
	await prisma.users.deleteMany({});
	await prisma.roles.deleteMany({});
	console.log('Existing data deleted.');

	// --- 1. Seed Roles ---
	console.log('Seeding roles...');
	const rolesData = [
		{ name: 'admin', description: 'Administrator with full access', permissions: ['*'] },
		{ name: 'venue_manager', description: 'Manages a specific venue', permissions: ['manage_venue', 'manage_events', 'manage_products'] },
		{ name: 'staff', description: 'Venue staff member', permissions: ['view_orders', 'manage_tables'] },
		{ name: 'customer', description: 'Regular user/customer', permissions: ['place_order', 'view_events'] },
	];
	const createdRoles = [];
	for (const role of rolesData) {
		const createdRole = await prisma.roles.create({ data: role });
		createdRoles.push(createdRole);
		console.log(`Created role with id: ${createdRole.id} (${createdRole.name})`);
	}

	// --- 2. Seed Users ---
	console.log('Seeding users...');
	const createdUsers = [];
	const userCount = 20;
	for (let i = 0; i < userCount; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const user = await prisma.users.create({
			data: {
				email: faker.internet.email({ firstName, lastName }).toLowerCase(),
				first_name: firstName,
				last_name: lastName,
				password: bcrypt.hashSync("password123", 10), // Hash password
				email_verified: faker.datatype.boolean(0.8), // 80% chance of being verified
				status: faker.helpers.arrayElement(['active', 'pending', 'inactive']),
				phone: faker.phone.number().substring(0, 20), // Truncate to fit VarChar(20)
				avatar: faker.image.avatar(),
				created_at: faker.date.past(),
				updated_at: faker.date.recent(),
				last_login: faker.date.recent(),
				role: faker.helpers.arrayElement(createdRoles.map(r => r.name)), // Assign one of the created role names (can be refined with user_roles)
			},
		});
		createdUsers.push(user);
		console.log(`Created user with id: ${user.id} (${user.email})`);

		// --- 2a. Seed User Profiles (One-to-One with Users) ---
		// For ~70% of users, create a profile
		if (faker.datatype.boolean(0.7)) {
			// Define count before using it inside the data object
			const interestCount = faker.number.int({ min: 1, max: 4 });
			await prisma.user_profiles.create({
				data: {
					user_id: user.id, // Link to the created user
					bio: faker.lorem.sentence(),
					date_of_birth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
					address: faker.location.streetAddress(),
					interests: faker.helpers.arrayElements(['music', 'sports', 'movies', 'tech', 'food', 'travel'], interestCount),
					preferences: {
						theme: faker.helpers.arrayElement(['light', 'dark']),
						notifications: faker.datatype.boolean(),
					},
					created_at: user.created_at,
					updated_at: user.updated_at,
				},
			});
			console.log(`Created profile for user id: ${user.id}`);
		}

		// --- 2b. Seed User Roles (Many-to-Many between Users and Roles) ---
		// Assign 1-2 roles to each user
		const rolesToAssign = faker.helpers.arrayElements(createdRoles, faker.number.int({ min: 1, max: 2 }));
		for (const role of rolesToAssign) {
			await prisma.user_roles.create({
				data: {
					user_id: user.id, // Link to the created user
					role_id: role.id, // Link to one of the created roles
				},
			});
			console.log(`Assigned role ${role.name} to user ${user.id}`);
		}

		// --- 2c. Seed Social Profiles (One-to-Many with Users) ---
		// For ~30% of users, create a social profile
		if (faker.datatype.boolean(0.3)) {
			const provider = faker.helpers.arrayElement(['google', 'facebook', 'github']);
			await prisma.social_profiles.create({
				data: {
					user_id: user.id, // Link to the created user
					provider: provider,
					provider_user_id: faker.string.alphanumeric(15),
					email: user.email, // Often the same email
					display_name: `${user.first_name} ${user.last_name}`,
					photo_url: user.avatar,
					created_at: user.created_at,
					updated_at: user.updated_at,
				}
			});
			console.log(`Created ${provider} social profile for user id: ${user.id}`);
		}
	}

	// --- 3. Seed Venues ---
	console.log('Seeding venues...');
	const createdVenues = [];
	const venueCount = 5;
	for (let i = 0; i < venueCount; i++) {
		const venue = await prisma.venues.create({
			data: {
				name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Hall', 'Lounge', 'Club', 'Arena']),
				description: faker.lorem.paragraph(),
				address: faker.location.streetAddress(true),
				latitude: new Prisma.Decimal(faker.location.latitude().toFixed(8)),
				longitude: new Prisma.Decimal(faker.location.longitude().toFixed(8)),
				website_url: faker.internet.url(),
				phone: faker.phone.number(),
				email: faker.internet.email(),
				status: faker.helpers.arrayElement(['active', 'pending', 'inactive']),
				timezone: faker.location.timeZone(),
				currency: faker.finance.currencyCode(),
				is_active: faker.datatype.boolean(0.9), // 90% active
				created_at: faker.date.past(),
				updated_at: faker.date.recent(),
			},
		});
		createdVenues.push(venue);
		console.log(`Created venue with id: ${venue.id} (${venue.name})`);

		// --- 3a. Seed Venue Settings (One-to-One with Venues) ---
		await prisma.venue_settings.create({
			data: {
				venue_id: venue.id, // Link to the created venue
				timezone: venue.timezone,
				currency: venue.currency,
				business_hours: [ // Example structure
					{ day: 'Monday', open: '09:00', close: '22:00' },
					{ day: 'Tuesday', open: '09:00', close: '22:00' },
					{ day: 'Wednesday', open: '09:00', close: '22:00' },
					{ day: 'Thursday', open: '09:00', close: '23:00' },
					{ day: 'Friday', open: '09:00', close: '01:00' },
					{ day: 'Saturday', open: '10:00', close: '02:00' },
					{ day: 'Sunday', open: '11:00', close: '20:00', closed: faker.datatype.boolean(0.2) }, // 20% closed Sunday
				],
				booking_settings: { allowOnlineBooking: true, minNoticeHours: 2 },
				loyalty_settings: { enabled: faker.datatype.boolean(), pointsPerDollar: 10 },
				affiliate_settings: { enabled: faker.datatype.boolean() },
				created_at: venue.created_at,
				updated_at: venue.updated_at,
			},
		});
		console.log(`Created settings for venue id: ${venue.id}`);

		// --- 3b. Seed Venue Photos (One-to-Many with Venues) ---
		const photoCount = faker.number.int({ min: 3, max: 8 });
		let hasPrimaryPhoto = false;
		for (let p = 0; p < photoCount; p++) {
			let isPrimary = false;
			if (!hasPrimaryPhoto && (p === photoCount - 1 || faker.datatype.boolean(0.3))) {
				isPrimary = true;
				hasPrimaryPhoto = true;
			}
			await prisma.venue_photos.create({
				data: {
					venue_id: venue.id, // Link to the created venue
					url: faker.image.urlLoremFlickr({ category: 'building' }),
					caption: faker.lorem.sentence(),
					is_primary: isPrimary,
					created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				}
			});
		}
		console.log(`Created ${photoCount} photos for venue id: ${venue.id}`);

		// --- 3c. Seed Venue Staff (Many-to-One with Venues, Many-to-One with Users) ---
		const staffCount = faker.number.int({ min: 2, max: 5 });
		const staffUsers = faker.helpers.arrayElements(createdUsers, staffCount); // Pick some users
		const staffRoles = createdRoles.filter(r => ['venue_manager', 'staff'].includes(r.name)); // Pick venue-related roles
		for (const staffUser of staffUsers) {
			const assignedRole = faker.helpers.arrayElement(staffRoles);
			await prisma.venue_staffs.create({
				data: {
					venue_id: venue.id,       // Link to the created venue
					user_id: staffUser.id,    // Link to one of the created users
					role: assignedRole.name,
					permissions: assignedRole.permissions, // Inherit permissions from role
					status: 'active',
					created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				}
			});
			console.log(`Assigned user ${staffUser.id} as ${assignedRole.name} to venue ${venue.id}`);
		}

		// --- 3d. Seed Tables (One-to-Many with Venues) ---
		const createdTables = [];
		const tableCount = faker.number.int({ min: 5, max: 15 });
		for (let t = 0; t < tableCount; t++) {
			const table = await prisma.tables.create({
				data: {
					venue_id: venue.id, // Link to the created venue
					name: `Table ${t + 1}`,
					description: faker.lorem.sentence(),
					capacity: randomBigInt(12), // Max 12 capacity
					status: faker.helpers.arrayElement(['available', 'reserved', 'occupied', 'maintenance']),
					location: faker.helpers.arrayElement(['Patio', 'Main Hall', 'VIP Area', 'Bar Side', null]),
					min_spend: faker.datatype.boolean(0.2) ? new Prisma.Decimal(faker.commerce.price({ min: 50, max: 500, dec: 2 })) : null,
					table_type: faker.helpers.arrayElement(['standard', 'booth', 'high_top', 'bar_stool']),
					is_active: true,
					created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				},
			});
			createdTables.push(table);
		}
		console.log(`Created ${tableCount} tables for venue id: ${venue.id}`);

		// --- 3e. Seed Product Categories (One-to-Many with Venues) ---
		const createdCategories = [];
		const categoryNames = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Specials'];
		for (let c = 0; c < categoryNames.length; c++) {
			const category = await prisma.product_categories.create({
				data: {
					venue_id: venue.id, // Link to the created venue
					name: categoryNames[c],
					description: faker.lorem.sentence(),
					display_order: BigInt(c),
					is_active: true,
					created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				}
			});
			createdCategories.push(category);
		}
		console.log(`Created ${categoryNames.length} product categories for venue id: ${venue.id}`);

		// --- 3f. Seed Products (Many-to-One with Venues) ---
		// Note: category_id in products is just a string, not a FK to product_categories.id
		// category field in products is also just a string. We'll use the names from createdCategories.
		const createdProducts = [];
		const productCount = faker.number.int({ min: 10, max: 20 });
		for (let p = 0; p < productCount; p++) {
			const category = faker.helpers.arrayElement(createdCategories);
			const price = new Prisma.Decimal(faker.commerce.price({ min: 5, max: 100, dec: 2 }));
			// Removed unused const declarations here
			const product = await prisma.products.create({
				data: {
					venue_id: venue.id,        // Link to the created venue
					category_id: category.id, // Using the category ID for reference if needed elsewhere
					name: faker.commerce.productName(),
					description: faker.commerce.productDescription(),
					category: category.name,   // Using the category name string
					price: price,
					discount_price: faker.datatype.boolean(0.15) ? new Prisma.Decimal(parseFloat(price.toString()) * 0.8) : null, // 15% chance of 20% discount
					currency: venue.currency,
					is_available: faker.datatype.boolean(0.95), // 95% available
					sku: faker.string.alphanumeric(8).toUpperCase(),
					tags: faker.helpers.arrayElements(['vegan', 'gluten-free', 'spicy', 'popular', 'new'], faker.number.int({ min: 0, max: 3 })), // Keep inline number count
					ingredients: faker.lorem.words(faker.number.int({ min: 3, max: 8 })).split(' '),
					allergens: faker.helpers.arrayElements(['nuts', 'dairy', 'soy', 'shellfish'], faker.number.int({ min: 0, max: 2 })), // Keep inline number count
					nutritional_info: { calories: faker.number.int({ min: 100, max: 1500 }), protein: `${faker.number.int({ min: 5, max: 50 })}g` },
					created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				},
			});
			createdProducts.push(product);

			// --- 3f-i. Seed Product Photos (One-to-Many with Products) ---
			const productPhotoCount = faker.number.int({ min: 1, max: 4 });
			let hasProductPrimaryPhoto = false;
			for (let pp = 0; pp < productPhotoCount; pp++) {
				let isPrimary = false;
				if (!hasProductPrimaryPhoto && (pp === productPhotoCount - 1 || faker.datatype.boolean(0.5))) {
					isPrimary = true;
					hasProductPrimaryPhoto = true;
				}
				await prisma.product_photos.create({
					data: {
						product_id: product.id, // Link to the created product
						url: faker.image.urlLoremFlickr({ category: 'food' }),
						caption: faker.lorem.words(3),
						is_primary: isPrimary,
						created_at: faker.date.between({ from: product.created_at!, to: new Date() }),
						updated_at: faker.date.recent(),
					}
				});
			}

			// --- 3f-ii. Seed Product Options (One-to-Many with Products) ---
			const createdOptions = [];
			const optionCount = faker.number.int({ min: 0, max: 3 }); // 0 to 3 options per product
			for (let po = 0; po < optionCount; po++) {
				const option = await prisma.product_options.create({
					data: {
						product_id: product.id, // Link to the created product
						name: faker.helpers.arrayElement(['Size', 'Add-ons', 'Spice Level', 'Cooking Preference']),
						description: faker.lorem.sentence(),
						required: faker.datatype.boolean(0.4), // 40% required
						min_select: BigInt(1),
						max_select: BigInt(faker.number.int({ min: 1, max: 3 })), // Allow selecting multiple for some options
						created_at: faker.date.between({ from: product.created_at!, to: new Date() }),
						updated_at: faker.date.recent(),
					}
				});
				createdOptions.push(option);

				// --- 3f-iii. Seed Option Choices (Many-to-One with Product Options) ---
				const choiceCount = faker.number.int({ min: 2, max: 5 });
				let hasDefaultChoice = false;
				for (let oc = 0; oc < choiceCount; oc++) {
					let isDefault = false;
					if (!hasDefaultChoice && !option.required && (oc === choiceCount - 1 || faker.datatype.boolean(0.3))) {
						isDefault = true;
						hasDefaultChoice = true;
					}
					await prisma.option_choices.create({
						data: {
							option_id: option.id, // Link to the created product option
							name: faker.commerce.productAdjective() + ' ' + faker.lorem.word(),
							description: faker.lorem.words(5),
							price_adjustment: faker.datatype.boolean(0.6) ? new Prisma.Decimal(faker.commerce.price({ min: -5, max: 10, dec: 2 })) : null,
							is_default: isDefault,
							created_at: faker.date.between({ from: option.created_at!, to: new Date() }),
							updated_at: faker.date.recent(),
						}
					});
				}
			}
		}
		console.log(`Created ${productCount} products with photos and options for venue id: ${venue.id}`);

		// --- 3g. Seed Events (Many-to-One with Venues) ---
		const createdEvents = [];
		const eventCount = faker.number.int({ min: 5, max: 10 });
		for (let e = 0; e < eventCount; e++) {
			const startTime = faker.date.future({ years: 1 });
			const endTime = new Date(startTime.getTime() + faker.number.int({ min: 1, max: 5 }) * 60 * 60 * 1000); // 1-5 hours duration
			const event = await prisma.events.create({
				data: {
					venue_id: venue.id, // Link to the created venue
					name: faker.music.songName() + ' ' + faker.helpers.arrayElement(['Night', 'Festival', 'Party', 'Show']),
					description: faker.lorem.paragraphs(2),
					category: faker.helpers.arrayElement(['Music', 'Concert', 'Comedy', 'Theater', 'Conference', 'Workshop']),
					start_time: startTime,
					end_time: endTime,
					timezone: venue.timezone,
					is_recurring: faker.datatype.boolean(0.1), // 10% recurring
					// recurrence_rule: // Could add iCalendar rule here if recurring
					max_capacity: randomBigInt(500),
					ticket_price: new Prisma.Decimal(faker.commerce.price({ min: 10, max: 150, dec: 2 })),
					is_featured: faker.datatype.boolean(0.2), // 20% featured
					is_cancelled: faker.datatype.boolean(0.05), // 5% cancelled
					status: faker.helpers.arrayElement(['draft', 'published', 'completed', 'cancelled']),
					created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				}
			});
			createdEvents.push(event);

			// --- 3g-i. Seed Event Tickets (One-to-Many with Events) ---
			const ticketTypeCount = faker.number.int({ min: 1, max: 4 });
			for (let et = 0; et < ticketTypeCount; et++) {
				const fromDate = event.created_at || new Date(); // Ensure 'from' is a Date
				const toDate = event.start_time; // Ensure 'to' is a Date
				const saleStartTime = faker.date.between({ from: fromDate, to: toDate }); // Stick with options object
				const saleEndTime = faker.date.between({ from: saleStartTime, to: toDate }); // Stick with options object
				await prisma.event_tickets.create({
					data: {
						event_id: event.id, // Link to the created event
						name: faker.helpers.arrayElement(['General Admission', 'VIP', 'Early Bird', 'Student']),
						description: faker.lorem.sentence(),
						price: new Prisma.Decimal(parseFloat(event.ticket_price!.toString()) * faker.number.float({ min: 0.8, max: 2.5 })), // Price variation based on base
						currency: venue.currency,
						quantity: randomBigInt(200),
						quantity_sold: randomBigInt(150), // Sold less than total quantity
						sale_start_time: saleStartTime,
						sale_end_time: saleEndTime,
						status: faker.helpers.arrayElement(['on_sale', 'sold_out', 'coming_soon', 'off_sale']),
						created_at: faker.date.between({ from: event.created_at!, to: new Date() }),
						updated_at: faker.date.recent(),
					}
				});
			}

			// --- 3g-ii. Seed Event Photos (One-to-Many with Events) ---
			const eventPhotoCount = faker.number.int({ min: 2, max: 5 });
			let hasEventPrimaryPhoto = false;
			for (let ep = 0; ep < eventPhotoCount; ep++) {
				let isPrimary = false;
				if (!hasEventPrimaryPhoto && (ep === eventPhotoCount - 1 || faker.datatype.boolean(0.4))) {
					isPrimary = true;
					hasEventPrimaryPhoto = true;
				}
				await prisma.event_photos.create({
					data: {
						event_id: event.id, // Link to the created event
						url: faker.image.urlLoremFlickr({ category: 'party' }),
						caption: faker.lorem.words(4),
						is_primary: isPrimary,
						created_at: faker.date.between({ from: event.created_at!, to: new Date() }),
						updated_at: faker.date.recent(),
					}
				});
			}

			// --- 3g-iii. Seed Event Performers (One-to-Many with Events) ---
			const performerCount = faker.number.int({ min: 1, max: 3 });
			for (let pf = 0; pf < performerCount; pf++) {
				await prisma.event_performers.create({
					data: {
						event_id: event.id, // Link to the created event
						name: faker.person.fullName(),
						description: faker.lorem.paragraph(),
						photo_url: faker.image.avatar(),
						website: faker.internet.url(),
						social_media: {
							twitter: `https://twitter.com/${faker.internet.username()}`,
							instagram: `https://instagram.com/${faker.internet.username()}`,
						},
						created_at: faker.date.between({ from: event.created_at!, to: new Date() }),
						updated_at: faker.date.recent(),
					}
				});
			}
		}
		console.log(`Created ${eventCount} events with tickets, photos, performers for venue id: ${venue.id}`);


		// --- 3h. Seed Table Maps (One-to-Many with Venues - assuming logical relation) ---
		const createdMaps = [];
		const map = await prisma.table_maps.create({
			data: {
				venue_id: venue.id, // Link to the created venue
				name: `${venue.name} Floor Plan`,
				map_data: { /* Could store SVG, canvas data, or coordinates */
					width: 1000,
					height: 800,
					backgroundImage: faker.image.urlLoremFlickr({ category: 'architecture' }),
					version: "1.0"
				},
				created_at: faker.date.between({ from: venue.created_at!, to: new Date() }),
				updated_at: faker.date.recent(),
			},
		});
		createdMaps.push(map);
		console.log(`Created table map for venue id: ${venue.id}`);

		// --- 3i. Seed Table Positions (Many-to-One with TableMaps, Many-to-One with Tables) ---
		for (const table of createdTables) {
			await prisma.table_positions.create({
				data: {
					map_id: map.id,         // Link to the created map
					table_id: table.id,     // Link to one of the created tables
					x: randomBigInt(900),   // Position within map_data width
					y: randomBigInt(700),   // Position within map_data height
					width: randomBigInt(100),
					height: randomBigInt(100),
					rotation: faker.helpers.arrayElement([0, 45, 90, 180, 270]),
					created_at: faker.date.between({ from: map.created_at!, to: new Date() }),
					updated_at: faker.date.recent(),
				}
			});
		}
		console.log(`Created table positions for map id: ${map.id}`);

	} // End of venue loop

	// --- 4. Seed Audit Logs (Optional, Many-to-One with Users) ---
	console.log('Seeding audit logs...');
	const auditLogCount = 50;
	for (let i = 0; i < auditLogCount; i++) {
		const user = faker.helpers.arrayElement(createdUsers);
		const resourceType = faker.helpers.arrayElement(['user', 'venue', 'event', 'product', 'role']);
		const actionType = faker.helpers.arrayElement(['create', 'update', 'delete', 'login', 'logout']);
		await prisma.audit_logs.create({
			data: {
				user_id: user.id, // Link to a random user
				action_type: actionType,
				resource_type: resourceType,
				resource_id: faker.string.uuid(), // Ideally link to actual resource IDs
				description: `User ${actionType} ${resourceType}`,
				metadata: { details: faker.lorem.sentence() },
				ip_address: faker.internet.ip(),
				user_agent: faker.internet.userAgent(),
				created_at: faker.date.recent({ days: 30 }),
				updated_at: faker.date.recent({ days: 30 }),
			}
		});
	}
	console.log(`Created ${auditLogCount} audit log entries.`);


	console.log('Seeding finished.');
}

main()
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
