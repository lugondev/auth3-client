import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient): Promise<{ id: string }[]> {
	console.log('Seeding Users...');
	const usersData: Prisma.usersCreateInput[] = [];

	// --- Add Specific Admin User ---
	console.log('Adding specific admin user...');
	const adminEmail = 'luongle96@yahoo.com';
	const adminPassword = 'password123'; // WARNING: Use a hashed password in production!

	// Check if admin user already exists to avoid duplicate errors on re-seed
	const existingAdmin = await prisma.users.findUnique({ where: { email: adminEmail } });

	if (!existingAdmin) {
		usersData.push({
			email: adminEmail,
			// IMPORTANT: In a real application, hash the password securely (e.g., using bcrypt) BEFORE storing it.
			// Storing plain text passwords is a major security risk.
			password: bcrypt.hashSync(adminPassword, 10), // Still truncate just in case, but hashing is essential.
			first_name: 'Admin',
			last_name: 'User',
			status: 'active', // Ensure admin is active
			email_verified: true, // Ensure admin email is verified
			email_verified_at: new Date(), // Set verification date
			provider: 'local',
			created_at: new Date(),
			updated_at: new Date(),
			phone: '0909123456'.substring(0, 20), // Example phone
			avatar: faker.image.avatar().substring(0, 255), // Generic avatar
		});
		console.log(`-> Admin user ${adminEmail} prepared for seeding.`);
	} else {
		console.log(`-> Admin user ${adminEmail} already exists, skipping creation.`);
	}

	// --- Add Random Users ---
	console.log('Generating random users...');
	for (let i = 0; i < 20; i++) { // Generate 20 random users
		const randomEmail = faker.internet.email({ firstName: faker.person.firstName().toLowerCase(), lastName: faker.person.lastName().toLowerCase() }).substring(0, 255);
		// Skip if the random email conflicts with the admin email
		if (randomEmail === adminEmail) continue;

		usersData.push({
			email: randomEmail, // Ensure email within limit
			// In a real application, hash the password here using bcrypt
			// Ensure generated password doesn't exceed the DB limit
			password: faker.internet.password({ length: 30 }).substring(0, 255), // Generate reasonably sized password & truncate just in case
			first_name: faker.person.firstName().substring(0, 100), // Ensure first name within limit
			last_name: faker.person.lastName().substring(0, 100), // Ensure last name within limit
			status: faker.helpers.arrayElement(['active', 'pending', 'inactive']),
			email_verified: faker.datatype.boolean(0.8), // 80% chance of being verified
			email_verified_at: faker.datatype.boolean() ? faker.date.past({ years: 1 }) : null,
			last_login: faker.date.recent({ days: 90 }),
			// Ensure phone doesn't exceed the strict 20 character limit
			phone: faker.phone.number().substring(0, 20),
			avatar: faker.image.avatar().substring(0, 255), // Ensure avatar URL within limit
			// Keep 'local' provider for password-based auth, add others for social
			provider: 'local', // Default to local, social profiles will handle others
			provider_id: null, // Null for local provider
			created_at: faker.date.past({ years: 2 }),
			updated_at: faker.date.recent({ days: 30 }),
		});
	}

	const createdUsers: { id: string }[] = [];
	for (const userData of usersData) {
		try {
			const user = await prisma.users.create({ data: userData });
			createdUsers.push(user);
		} catch (error) {
			// Handle potential duplicate email errors gracefully during seeding
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				console.warn(`Skipping duplicate user email during seed: ${userData.email}`);
			} else {
				throw error; // Re-throw other errors
			}
		}
	}
	console.log(`-> Seeded ${createdUsers.length} users.`);
	return createdUsers;
}

export async function seedUserRelatedData(prisma: PrismaClient, userIds: string[]) {
	console.log('Seeding User Profiles, Social Profiles, Tokens & Sessions...');
	let createdUserProfilesCount = 0;
	let createdRefreshTokensCount = 0;
	let createdSessionsCount = 0;

	for (const userId of userIds) {
		const baseDate = faker.date.past({ years: 1 }); // Base creation date for related items

		// --- Seed User Profiles (One-to-One) ---
		if (faker.datatype.boolean(0.7)) { // 70% chance of having a profile
			try {
				await prisma.user_profiles.create({
					data: {
						users: { connect: { id: userId } },
						bio: faker.lorem.sentence(),
						date_of_birth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
						address: faker.location.streetAddress(),
						interests: faker.lorem.words(faker.number.int({ min: 2, max: 5 })).split(' '),
						preferences: { theme: faker.helpers.arrayElement(['light', 'dark']), language: 'vi' },
						created_at: baseDate,
						updated_at: faker.date.between({ from: baseDate, to: new Date() }),
					}
				});
				createdUserProfilesCount++;
			} catch (error) {
				// Handle potential unique constraint violation if re-seeding
				if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
					console.warn(`Skipping duplicate user profile for user: ${userId}`);
				} else {
					throw error;
				}
			}
		}

		// --- Seed Refresh Tokens & Sessions (One-to-Many) ---
		if (faker.datatype.boolean(0.8)) { // 80% chance of having an active session
			try {
				const now = new Date();
				const refreshTokenExpires = faker.date.future({ years: 1 }); // Refresh tokens usually last longer
				const accessTokenExpires = faker.date.soon({ days: 1 }); // Access tokens are short-lived

				const refreshTokenString = faker.string.uuid() + faker.string.hexadecimal({ length: 64 }); // Longer token
				const accessTokenString = faker.string.uuid() + faker.string.hexadecimal({ length: 128 }); // Longer JWT-like

				await prisma.refresh_tokens.create({
					data: {
						users: { connect: { id: userId } },
						token: refreshTokenString,
						device_id: faker.string.uuid(),
						user_agent: faker.internet.userAgent(),
						ip_address: faker.internet.ip(),
						expires_at: refreshTokenExpires,
						created_at: now,
						updated_at: now,
					}
				});
				createdRefreshTokensCount++;

				await prisma.sessions.create({
					data: {
						users: { connect: { id: userId } },
						access_token: accessTokenString,
						refresh_token: refreshTokenString, // Link to the refresh token created above
						expires_at: accessTokenExpires,
						created_at: now,
						updated_at: now,
					}
				});
				createdSessionsCount++;
			} catch (error) {
				console.error(`Error seeding tokens/session for user ${userId}:`, error);
			}
		}
	}
	console.log(`-> Seeded ${createdUserProfilesCount} user profiles.`);
	console.log(`-> Seeded ${createdRefreshTokensCount} refresh tokens.`);
	console.log(`-> Seeded ${createdSessionsCount} sessions.`);
}
