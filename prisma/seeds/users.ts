import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/vi'
import bcrypt from 'bcryptjs'

// Define types for users and roles
interface User {
	id: string
	email: string
	first_name: string
	last_name: string
	status: string
	avatar: string | null
	role: string | null // Allow role to be null
	provider?: string | null
}

interface Role {
	id: string
	name: string
	permissions: string[] // Added permissions property
}

export async function seedUsers(prisma: PrismaClient) {
	console.log('Seeding users and related data...')

	// Create roles
	// Many-to-many relationship between users and roles through the user_roles table
	const roles = await prisma.$transaction([
		prisma.roles.create({
			data: {
				name: 'admin',
				description: 'System Administrator',
				// Using slugs defined in seed.ts for consistency, assuming admin needs all
				permissions: [
					'view_users', 'create_users', 'edit_users', 'delete_users',
					'view_venues', 'create_venues', 'edit_venues', 'delete_venues',
					'view_products', 'manage_products',
					'view_events', 'manage_events',
					'manage_roles', 'manage_permissions'
				],
			},
		}),
		prisma.roles.create({
			data: {
				name: 'manager',
				description: 'Venue Manager',
				// Using slugs defined in seed.ts
				permissions: [
					'view_venues', 'create_venues', 'edit_venues', 'delete_venues', // Full Venue Management (implied by Casbin rule)
					'view_products', 'manage_products',                         // Full Product Management (implied by Casbin rule)
					'view_events', 'manage_events',                           // Full Event Management (implied by Casbin rule)
					'view_users', 'edit_users'                                // Specific user permissions
				],
			},
		}),
		prisma.roles.create({
			data: {
				name: 'staff',
				description: 'Staff Member',
				// Using slugs defined in seed.ts
				permissions: ['view_venues', 'view_products', 'view_events'],
			},
		}),
		prisma.roles.create({
			data: {
				name: 'customer',
				description: 'Customer',
				// Using slugs defined in seed.ts
				permissions: ['view_venues', 'view_products', 'view_events'],
			},
		}),
	]) as Role[]

	// Create users
	const users: User[] = []

	// Create admin user (kept separate for simplicity, original logic)
	const adminUser = await prisma.users.create({
		data: {
			email: 'luongle96@yahoo.com',
			first_name: 'Admin',
			last_name: 'User',
			status: 'active',
			email_verified: true,
			email_verified_at: new Date(),
			last_login: new Date(),
			phone: '0909123456',
			avatar: 'https://storage.example.com/avatars/admin.jpg',
			role: 'admin',
			provider: 'email',
			password: bcrypt.hashSync("password123", 10),
		},
	})
	users.push(adminUser)

	// Create user profile for admin (original logic)
	await prisma.user_profiles.create({
		data: {
			user_id: adminUser.id,
			bio: 'System Administrator',
			date_of_birth: new Date('1990-01-01'),
			address: 'Ho Chi Minh City, Vietnam',
			interests: ['technology', 'management', 'food'],
			preferences: {
				theme: 'dark',
				notifications: {
					email: true,
					push: true,
				},
			},
		},
	})

	// Assign admin role to admin user
	await prisma.user_roles.create({
		data: {
			user_id: adminUser.id,
			role_id: roles[0].id, // admin role
		},
	})

	// Create 15 regular users transactionally
	for (let i = 0; i < 15; i++) {
		const firstName = faker.person.firstName()
		const lastName = faker.person.lastName()
		const email = faker.internet.email({ firstName, lastName })

		try {
			// Wrap user and profile creation in an interactive transaction
			const user = await prisma.$transaction(async (tx) => {
				const createdUser = await tx.users.create({
					data: {
						email,
						first_name: firstName,
						last_name: lastName,
						status: faker.helpers.arrayElement(['active', 'pending', 'inactive']),
						email_verified: faker.datatype.boolean(0.7), // 70% have verified email
						email_verified_at: faker.datatype.boolean(0.7) ? faker.date.past() : null,
						last_login: faker.datatype.boolean(0.8) ? faker.date.recent() : null,
						phone: faker.phone.number(),
						avatar: faker.datatype.boolean(0.6) ? `https://storage.example.com/avatars/user${i}.jpg` : null,
						role: faker.helpers.arrayElement(['customer', 'staff', 'manager']),
						provider: faker.helpers.arrayElement(['email', 'google', 'facebook']),
						provider_id: faker.string.uuid(),
						password: faker.internet.password(), // Add password
					},
				})

				// Create the profile using the ID from the newly created user within the transaction
				await tx.user_profiles.create({
					data: {
						user_id: createdUser.id,
						bio: faker.datatype.boolean(0.7) ? faker.lorem.paragraph() : null,
						date_of_birth: faker.datatype.boolean(0.8) ? faker.date.birthdate({ min: 18, max: 65, mode: 'age' }) : null,
						address: faker.datatype.boolean(0.9) ? faker.location.streetAddress() + ', ' + faker.location.city() : null,
						interests: faker.helpers.arrayElements(['food', 'music', 'art', 'sports', 'travel', 'technology', 'fashion'], { min: 0, max: 4 }),
						preferences: {
							theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
							notifications: {
								email: faker.datatype.boolean(),
								push: faker.datatype.boolean(),
							},
						},
					},
				})

				// Return the created user so it can be used outside the transaction block if needed
				return createdUser
			})

			// If transaction succeeded, add the user to the list
			users.push(user)

			// --- Operations dependent on the user existing (kept outside transaction) ---

			// Assign role to user
			const roleIndex = faker.number.int({ min: 1, max: roles.length - 1 }) // Don't assign admin role
			await prisma.user_roles.create({
				data: {
					user_id: user.id,
					role_id: roles[roleIndex].id,
				},
			})

			// Create social profile for some users
			if (user.provider !== 'email') {
				await prisma.social_profiles.create({
					data: {
						user_id: user.id,
						provider: user.provider as string,
						provider_user_id: faker.string.uuid(),
						email: user.email,
						display_name: `${user.first_name} ${user.last_name}`,
						photo_url: user.avatar,
						access_token: faker.string.alphanumeric(64),
						refresh_token: faker.string.alphanumeric(64),
						token_expires_at: faker.date.future(),
						raw_data: {
							id: faker.string.uuid(),
							name: `${user.first_name} ${user.last_name}`,
							email: user.email,
						},
					},
				})
			}

			// Create session for some users
			if (user.status === 'active') {
				await prisma.sessions.create({
					data: {
						user_id: user.id,
						access_token: faker.string.alphanumeric(64),
						refresh_token: faker.string.alphanumeric(64),
						expires_at: faker.date.future(),
					},
				})
			}

			// Create refresh token for some users
			if (user.status === 'active') {
				await prisma.refresh_tokens.create({
					data: {
						user_id: user.id,
						token: faker.string.alphanumeric(64),
						device_id: faker.string.uuid(),
						user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
						ip_address: faker.internet.ip(),
						expires_at: faker.date.future(),
						revoked_at: faker.datatype.boolean(0.2) ? faker.date.recent() : null,
					},
				})
			}

		} catch (error) {
			// Log error if the transaction fails for a user
			console.error(`Failed to create user ${i} and profile transactionally:`, error)
			// Continue to the next iteration to attempt creating the next user
		}
	}

	// Create audit logs for activities
	const actionTypes = ['create', 'update', 'delete', 'login', 'logout', 'register']
	const resourceTypes = ['user', 'venue', 'product', 'event', 'session']

	for (let i = 0; i < 50; i++) {
		// Ensure users array is not empty before trying to access elements
		if (users.length === 0) {
			console.warn("Skipping audit log creation as no users were successfully created.");
			break;
		}
		const user = faker.helpers.arrayElement(users)
		const actionType = faker.helpers.arrayElement(actionTypes)
		const resourceType = faker.helpers.arrayElement(resourceTypes)

		await prisma.audit_logs.create({
			data: {
				// user_id: user.id, // Replaced with connect syntax
				users: { // Corrected relation name to 'users'
					connect: { id: user.id },
				},
				action_type: actionType,
				resource_type: resourceType,
				resource_id: faker.string.uuid(),
				description: `User ${user.email} ${actionType}d a ${resourceType}`,
				metadata: {
					browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
					os: faker.helpers.arrayElement(['Windows', 'MacOS', 'iOS', 'Android']),
					timestamp: faker.date.recent().toISOString(),
				},
				ip_address: faker.internet.ip(),
				user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
			},
		})
	}

	console.log('Finished seeding users and related data.')
	return { users, roles }
}
