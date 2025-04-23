import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
	console.log('Starting seed...')

	// Clean existing data
	await prisma.$transaction([
		prisma.audit_logs.deleteMany(),
		prisma.sessions.deleteMany(),
		prisma.user_roles.deleteMany(),
		prisma.roles.deleteMany(),
		prisma.users.deleteMany(),
	])

	// Create roles with permissions
	// Note: Creating core roles that represent common access levels
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

	// Create users with hashed passwords
	const users = await Promise.all([
		prisma.users.create({
			data: {
				email: 'admin@example.com',
				password_hash: await hash('Admin123!', 10),
				first_name: 'Admin',
				last_name: 'User',
				status: 'active',
				email_verified: true,
				last_login: new Date('2024-04-22T15:30:00Z'),
				created_at: new Date('2024-01-01T00:00:00Z'),
				updated_at: new Date('2024-01-01T00:00:00Z'),
			},
		}),
		prisma.users.create({
			data: {
				email: 'manager@example.com',
				password_hash: await hash('Manager123!', 10),
				first_name: 'Manager',
				last_name: 'User',
				status: 'active',
				email_verified: true,
				last_login: new Date('2024-04-21T09:15:00Z'),
				created_at: new Date('2024-01-02T00:00:00Z'),
				updated_at: new Date('2024-01-02T00:00:00Z'),
			},
		}),
		prisma.users.create({
			data: {
				email: 'user1@example.com',
				password_hash: await hash('User123!', 10),
				first_name: 'John',
				last_name: 'Doe',
				status: 'active',
				email_verified: true,
				last_login: new Date('2024-04-20T14:20:00Z'),
				created_at: new Date('2024-01-03T00:00:00Z'),
				updated_at: new Date('2024-01-03T00:00:00Z'),
			},
		}),
		prisma.users.create({
			data: {
				email: 'user2@example.com',
				password_hash: await hash('User123!', 10),
				first_name: 'Jane',
				last_name: 'Smith',
				status: 'pending',
				email_verified: false,
				created_at: new Date('2024-01-04T00:00:00Z'),
				updated_at: new Date('2024-01-04T00:00:00Z'),
			},
		}),
		prisma.users.create({
			data: {
				email: 'user3@example.com',
				password_hash: await hash('User123!', 10),
				first_name: 'Bob',
				last_name: 'Wilson',
				status: 'inactive',
				email_verified: true,
				last_login: new Date('2024-03-15T11:45:00Z'),
				created_at: new Date('2024-01-05T00:00:00Z'),
				updated_at: new Date('2024-01-05T00:00:00Z'),
			},
		}),
	])

	// Assign roles to users (many-to-many relationship)
	await prisma.$transaction([
		// Admin has all roles
		prisma.user_roles.create({
			data: {
				user_id: users[0].id,
				role_id: roles[0].id, // admin role
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[0].id,
				role_id: roles[1].id, // manager role
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[0].id,
				role_id: roles[2].id, // user role
			},
		}),
		// Manager has manager and user roles
		prisma.user_roles.create({
			data: {
				user_id: users[1].id,
				role_id: roles[1].id, // manager role
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[1].id,
				role_id: roles[2].id, // user role
			},
		}),
		// Regular users have user role
		prisma.user_roles.create({
			data: {
				user_id: users[2].id,
				role_id: roles[2].id, // user role
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[3].id,
				role_id: roles[2].id, // user role
			},
		}),
		prisma.user_roles.create({
			data: {
				user_id: users[4].id,
				role_id: roles[2].id, // user role
			},
		}),
	])

	// Create sessions for active users
	await prisma.$transaction([
		prisma.sessions.create({
			data: {
				user_id: users[0].id,
				access_token: 'admin-access-token-1',
				refresh_token: 'admin-refresh-token-1',
				expires_at: new Date('2024-04-23T15:30:00Z'),
			},
		}),
		prisma.sessions.create({
			data: {
				user_id: users[1].id,
				access_token: 'manager-access-token-1',
				refresh_token: 'manager-refresh-token-1',
				expires_at: new Date('2024-04-23T09:15:00Z'),
			},
		}),
		prisma.sessions.create({
			data: {
				user_id: users[2].id,
				access_token: 'user1-access-token-1',
				refresh_token: 'user1-refresh-token-1',
				expires_at: new Date('2024-04-23T14:20:00Z'),
			},
		}),
	])

	// Create audit logs for various actions
	await prisma.$transaction([
		// Admin actions
		prisma.audit_logs.create({
			data: {
				user_id: users[0].id,
				action_type: 'CREATE',
				resource_type: 'USER',
				resource_id: users[3].id,
				description: 'Created new user account',
				metadata: { email: users[3].email },
				ip_address: '192.168.1.1',
				user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0',
			},
		}),
		// Manager actions
		prisma.audit_logs.create({
			data: {
				user_id: users[1].id,
				action_type: 'UPDATE',
				resource_type: 'USER',
				resource_id: users[2].id,
				description: 'Updated user profile',
				metadata: { fields: ['first_name', 'last_name'] },
				ip_address: '192.168.1.2',
				user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
			},
		}),
		// User actions
		prisma.audit_logs.create({
			data: {
				user_id: users[2].id,
				action_type: 'LOGIN',
				resource_type: 'SESSION',
				resource_id: 'session-1',
				description: 'User login',
				ip_address: '192.168.1.3',
				user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1) AppleWebKit/605.1.15',
			},
		}),
		// System actions (no user_id)
		prisma.audit_logs.create({
			data: {
				action_type: 'SYSTEM',
				resource_type: 'MAINTENANCE',
				resource_id: 'maintenance-1',
				description: 'Scheduled system maintenance',
				metadata: { type: 'database_backup' },
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
