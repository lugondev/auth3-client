import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	console.log('Starting seed...')

	// Clean existing data
	await prisma.$transaction([
		prisma.audit_logs.deleteMany(),
		prisma.sessions.deleteMany(),
		prisma.social_profiles.deleteMany(),
		prisma.user_profiles.deleteMany(),
		prisma.user_roles.deleteMany(),
		prisma.roles.deleteMany(),
		prisma.refresh_tokens.deleteMany(),
		prisma.users.deleteMany(),
	])

	// Create roles with permissions
	const roles = await prisma.$transaction([
		prisma.roles.create({
			data: {
				name: 'admin',
				description: 'Full system access',
				permissions: ['all:*'],
				created_at: new Date('2024-01-01T00:00:00Z'),
				updated_at: new Date('2024-01-01T00:00:00Z'),
			},
		}),
		prisma.roles.create({
			data: {
				name: 'manager',
				description: 'Department management access',
				permissions: ['read:*', 'write:users', 'write:audit_logs'],
				created_at: new Date('2024-01-02T00:00:00Z'),
				updated_at: new Date('2024-01-02T00:00:00Z'),
			},
		}),
		prisma.roles.create({
			data: {
				name: 'user',
				description: 'Standard user access',
				permissions: ['read:profile', 'write:profile'],
				created_at: new Date('2024-01-03T00:00:00Z'),
				updated_at: new Date('2024-01-03T00:00:00Z'),
			},
		}),
	])

	// Create users
	const users = await Promise.all([
		prisma.users.create({
			data: {
				email: 'admin@example.com',
				first_name: 'Admin',
				last_name: 'User',
				status: 'active',
				email_verified: true,
				email_verified_at: new Date('2024-01-01T00:00:00Z'),
				last_login: new Date('2024-04-22T15:30:00Z'),
				created_at: new Date('2024-01-01T00:00:00Z'),
				updated_at: new Date('2024-01-01T00:00:00Z'),
				phone: '+1234567890',
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
				role: 'admin',
			},
		}),
		prisma.users.create({
			data: {
				email: 'manager@example.com',
				first_name: 'Manager',
				last_name: 'User',
				status: 'active',
				email_verified: true,
				email_verified_at: new Date('2024-01-02T00:00:00Z'),
				last_login: new Date('2024-04-21T09:15:00Z'),
				created_at: new Date('2024-01-02T00:00:00Z'),
				updated_at: new Date('2024-01-02T00:00:00Z'),
				phone: '+1234567891',
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
				role: 'manager',
			},
		}),
		prisma.users.create({
			data: {
				email: 'user1@example.com',
				first_name: 'John',
				last_name: 'Doe',
				status: 'active',
				email_verified: true,
				email_verified_at: new Date('2024-01-03T00:00:00Z'),
				last_login: new Date('2024-04-20T14:20:00Z'),
				created_at: new Date('2024-01-03T00:00:00Z'),
				updated_at: new Date('2024-01-03T00:00:00Z'),
				phone: '+1234567892',
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
				role: 'user',
				provider: 'google',
				provider_id: 'google_123',
			},
		}),
		prisma.users.create({
			data: {
				email: 'user2@example.com',
				first_name: 'Jane',
				last_name: 'Smith',
				status: 'pending',
				email_verified: false,
				created_at: new Date('2024-01-04T00:00:00Z'),
				updated_at: new Date('2024-01-04T00:00:00Z'),
				phone: '+1234567893',
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
				role: 'user',
				provider: 'facebook',
				provider_id: 'facebook_123',
			},
		}),
		prisma.users.create({
			data: {
				email: 'user3@example.com',
				first_name: 'Bob',
				last_name: 'Wilson',
				status: 'inactive',
				email_verified: true,
				email_verified_at: new Date('2024-01-05T00:00:00Z'),
				last_login: new Date('2024-03-15T11:45:00Z'),
				created_at: new Date('2024-01-05T00:00:00Z'),
				updated_at: new Date('2024-01-05T00:00:00Z'),
				phone: '+1234567894',
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
				role: 'user',
			},
		}),
	])

	// Create user profiles
	await prisma.$transaction([
		prisma.user_profiles.create({
			data: {
				user_id: users[0].id,
				bio: 'System administrator with extensive experience',
				date_of_birth: new Date('1985-01-15'),
				address: '123 Admin Street, Tech City',
				interests: ['technology', 'system administration', 'security'],
				preferences: {
					theme: 'dark',
					notifications: {
						email: true,
						push: true,
					},
				},
			},
		}),
		prisma.user_profiles.create({
			data: {
				user_id: users[1].id,
				bio: 'Department manager focused on team growth',
				date_of_birth: new Date('1988-03-20'),
				address: '456 Manager Lane, Business District',
				interests: ['team management', 'leadership', 'business strategy'],
				preferences: {
					theme: 'light',
					notifications: {
						email: true,
						push: false,
					},
				},
			},
		}),
		prisma.user_profiles.create({
			data: {
				user_id: users[2].id,
				bio: 'Software developer passionate about web technologies',
				date_of_birth: new Date('1992-07-10'),
				address: '789 Developer Ave, Code Valley',
				interests: ['web development', 'open source', 'AI'],
				preferences: {
					theme: 'system',
					notifications: {
						email: true,
						push: true,
					},
				},
			},
		}),
	])

	// Create social profiles
	await prisma.$transaction([
		prisma.social_profiles.create({
			data: {
				user_id: users[2].id,
				provider: 'google',
				provider_user_id: 'google_123',
				email: 'user1@gmail.com',
				display_name: 'John Doe',
				photo_url: 'https://lh3.googleusercontent.com/photo',
				access_token: 'google_access_token_123',
				refresh_token: 'google_refresh_token_123',
				token_expires_at: new Date('2024-05-20T14:20:00Z'),
				raw_data: {
					locale: 'en',
					verified_email: true,
				},
			},
		}),
		prisma.social_profiles.create({
			data: {
				user_id: users[3].id,
				provider: 'facebook',
				provider_user_id: 'facebook_123',
				email: 'user2@facebook.com',
				display_name: 'Jane Smith',
				photo_url: 'https://graph.facebook.com/photo',
				access_token: 'facebook_access_token_123',
				refresh_token: 'facebook_refresh_token_123',
				token_expires_at: new Date('2024-05-21T09:15:00Z'),
				raw_data: {
					timezone: -7,
					verified: true,
				},
			},
		}),
	])

	// Assign roles to users
	await prisma.$transaction([
		// Admin has all roles
		prisma.user_roles.create({
			data: {
				user_id: users[0].id,
				role_id: roles[0].id,
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[0].id,
				role_id: roles[1].id,
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[0].id,
				role_id: roles[2].id,
			},
		}),
		// Manager has manager and user roles
		prisma.user_roles.create({
			data: {
				user_id: users[1].id,
				role_id: roles[1].id,
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[1].id,
				role_id: roles[2].id,
			},
		}),
		// Regular users have user role
		prisma.user_roles.create({
			data: {
				user_id: users[2].id,
				role_id: roles[2].id,
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[3].id,
				role_id: roles[2].id,
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[4].id,
				role_id: roles[2].id,
			},
		}),
	])

	// Create sessions and refresh tokens
	const currentDate = new Date()
	const futureDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

	await prisma.$transaction([
		prisma.sessions.create({
			data: {
				user_id: users[0].id,
				access_token: 'admin-access-token-1',
				refresh_token: 'admin-refresh-token-1',
				expires_at: futureDate,
			},
		}),
		prisma.refresh_tokens.create({
			data: {
				user_id: users[0].id,
				token: 'admin-long-lived-refresh-token-1',
				device_id: 'device_123',
				user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0',
				ip_address: '192.168.1.1',
				expires_at: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
			},
		}),
	])

	// Create audit logs
	await prisma.$transaction([
		// User creation
		prisma.audit_logs.create({
			data: {
				user_id: users[0].id,
				action_type: 'CREATE',
				resource_type: 'USER',
				resource_id: users[3].id,
				description: 'Created new user account',
				metadata: {
					email: users[3].email,
					status: 'pending',
					provider: 'facebook',
				},
				ip_address: '192.168.1.1',
				user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0',
			},
		}),
		// Profile update
		prisma.audit_logs.create({
			data: {
				user_id: users[2].id,
				action_type: 'UPDATE',
				resource_type: 'USER_PROFILE',
				resource_id: users[2].id,
				description: 'Updated user profile',
				metadata: {
					updated_fields: ['bio', 'interests'],
					previous_values: {
						bio: 'Old bio content',
						interests: ['coding'],
					},
				},
				ip_address: '192.168.1.2',
				user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1) AppleWebKit/605.1.15',
			},
		}),
		// Role assignment
		prisma.audit_logs.create({
			data: {
				user_id: users[0].id,
				action_type: 'ASSIGN',
				resource_type: 'ROLE',
				resource_id: roles[1].id,
				description: 'Assigned manager role to user',
				metadata: {
					assigned_to: users[1].email,
					role_name: 'manager',
				},
				ip_address: '192.168.1.3',
				user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
			},
		}),
		// Social login
		prisma.audit_logs.create({
			data: {
				user_id: users[2].id,
				action_type: 'LOGIN',
				resource_type: 'SOCIAL_PROFILE',
				resource_id: 'google_123',
				description: 'User logged in via Google',
				metadata: {
					provider: 'google',
					email: 'user1@gmail.com',
				},
				ip_address: '192.168.1.4',
				user_agent: 'Mozilla/5.0 (Linux; Android 11) Chrome/99.0.4844.88',
			},
		}),
		// System maintenance
		prisma.audit_logs.create({
			data: {
				action_type: 'SYSTEM',
				resource_type: 'MAINTENANCE',
				resource_id: 'maintenance-1',
				description: 'Scheduled system maintenance',
				metadata: {
					type: 'database_backup',
					status: 'completed',
					duration_seconds: 180,
				},
				ip_address: '192.168.1.100',
			},
		}),
	])

	console.log('Seed completed successfully')
}

main()
	.catch((e) => {
		console.error('Error during seeding:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
