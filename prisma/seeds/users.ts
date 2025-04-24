import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/vi'

// Define types for users and roles
interface User {
	id: string
	email: string
	first_name: string
	last_name: string
}

interface Role {
	id: string
	name: string
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
				permissions: ['all:read', 'all:write', 'all:delete', 'all:manage'],
			},
		}),
		prisma.roles.create({
			data: {
				name: 'manager',
				description: 'Venue Manager',
				permissions: ['venues:read', 'venues:write', 'venues:manage', 'products:read', 'products:write', 'events:read', 'events:write'],
			},
		}),
		prisma.roles.create({
			data: {
				name: 'staff',
				description: 'Staff Member',
				permissions: ['venues:read', 'products:read', 'events:read'],
			},
		}),
		prisma.roles.create({
			data: {
				name: 'customer',
				description: 'Customer',
				permissions: ['venues:read', 'products:read', 'events:read'],
			},
		}),
	]) as Role[]

	// Create users
	const users: User[] = []

	// Create admin user
	const adminUser = await prisma.users.create({
		data: {
			email: 'admin@example.com',
			first_name: 'Admin',
			last_name: 'User',
			status: 'active',
			email_verified: true,
			email_verified_at: new Date(),
			last_login: new Date(),
			phone: '0901234567',
			avatar: 'https://storage.example.com/avatars/admin.jpg',
			role: 'admin',
			provider: 'email',
		},
	})
	users.push(adminUser)

	// Create user profile for admin
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

	// Create 15 regular users
	for (let i = 0; i < 15; i++) {
		const firstName = faker.person.firstName()
		const lastName = faker.person.lastName()
		const email = faker.internet.email({ firstName, lastName })

		const user = await prisma.users.create({
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
			},
		})
		users.push(user)

		// Create user profile for each user
		await prisma.user_profiles.create({
			data: {
				user_id: user.id,
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
	}

	// Create audit logs for activities
	const actionTypes = ['create', 'update', 'delete', 'login', 'logout', 'register']
	const resourceTypes = ['user', 'venue', 'product', 'event', 'session']

	for (let i = 0; i < 50; i++) {
		const user = faker.helpers.arrayElement(users)
		const actionType = faker.helpers.arrayElement(actionTypes)
		const resourceType = faker.helpers.arrayElement(resourceTypes)

		await prisma.audit_logs.create({
			data: {
				user_id: user.id,
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

	return { users, roles }
}