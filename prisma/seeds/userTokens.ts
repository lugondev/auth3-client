import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs'; // For hashing tokens

/**
 * Seeds password reset tokens for a subset of users.
 *
 * @param prisma - The PrismaClient instance.
 * @param userIds - An array of user IDs.
 */
export async function seedPasswordResetTokens(prisma: PrismaClient, userIds: string[]): Promise<void> {
	console.log('Seeding Password Reset Tokens...');
	if (userIds.length === 0) {
		console.log('No user IDs provided, skipping password reset token seeding.');
		return;
	}
	const tokensData: Prisma.password_reset_tokensCreateInput[] = [];
	const numberOfTokens = Math.min(userIds.length, 5); // Create for up to 5 users

	for (let i = 0; i < numberOfTokens; i++) {
		const userId = faker.helpers.arrayElement(userIds);
		// Ensure we don't create multiple tokens for the same user in this seed run for simplicity
		if (tokensData.some(t => t.users.connect?.id === userId)) continue;

		const rawToken = faker.string.alphanumeric(32);
		const hashedToken = bcrypt.hashSync(rawToken, 10); // Store hashed token
		const now = new Date();
		const expiresAt = faker.date.soon({ days: 1, refDate: now }); // Token expires in 1 day (use soon for days)

		tokensData.push({
			users: { connect: { id: userId } },
			hashed_token: hashedToken,
			expires_at: expiresAt,
			created_at: now,
			updated_at: now,
		});
	}

	if (tokensData.length > 0) {
		try {
			// Create one by one to catch unique constraint on hashed_token if by chance it collides (very unlikely)
			let count = 0;
			for (const data of tokensData) {
				try {
					await prisma.password_reset_tokens.create({ data });
					count++;
				} catch (e) {
					if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
						console.warn(`Skipping duplicate password reset token for user ${data.users.connect?.id} due to hash collision (rare).`);
					} else {
						throw e;
					}
				}
			}
			console.log(`-> Seeded ${count} password reset tokens.`);
		} catch (error) {
			console.error('Error seeding password reset tokens:', error);
		}
	} else {
		console.log('No new password reset tokens to seed.');
	}
}

/**
 * Seeds phone verification tokens for a subset of users who have phone numbers.
 *
 * @param prisma - The PrismaClient instance.
 * @param usersWithPhones - An array of user objects, each containing id and phone.
 */
export async function seedPhoneVerificationTokens(prisma: PrismaClient, usersWithPhones: { id: string; phone: string | null }[]): Promise<void> {
	console.log('Seeding Phone Verification Tokens...');
	const actualUsersWithPhones = usersWithPhones.filter(u => u.phone);
	if (actualUsersWithPhones.length === 0) {
		console.log('No users with phone numbers provided, skipping phone verification token seeding.');
		return;
	}

	const tokensData: Prisma.phone_verification_tokensCreateInput[] = [];
	const numberOfTokens = Math.min(actualUsersWithPhones.length, 5); // Create for up to 5 users

	for (let i = 0; i < numberOfTokens; i++) {
		const user = faker.helpers.arrayElement(actualUsersWithPhones);
		if (tokensData.some(t => t.users.connect?.id === user.id)) continue; // One token per user in this run

		const rawToken = faker.string.numeric(6); // e.g., 6-digit OTP
		const hashedToken = bcrypt.hashSync(rawToken, 10);
		const now = new Date();
		// For minutes, we can add to the current date directly
		const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // Token expires in 10 minutes

		tokensData.push({
			users: { connect: { id: user.id } },
			phone_number: user.phone!, // User has phone from filter
			hashed_token: hashedToken,
			expires_at: expiresAt,
			created_at: now,
			updated_at: now,
		});
	}

	if (tokensData.length > 0) {
		try {
			let count = 0;
			for (const data of tokensData) {
				try {
					await prisma.phone_verification_tokens.create({ data });
					count++;
				} catch (e) {
					if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
						console.warn(`Skipping duplicate phone verification token for user ${data.users.connect?.id} due to hash collision (rare).`);
					} else {
						throw e;
					}
				}
			}
			console.log(`-> Seeded ${count} phone verification tokens.`);
		} catch (error) {
			console.error('Error seeding phone verification tokens:', error);
		}
	} else {
		console.log('No new phone verification tokens to seed.');
	}
}

/**
 * Seeds generic email verification tokens for a subset of users.
 *
 * @param prisma - The PrismaClient instance.
 * @param userIds - An array of user IDs.
 */
export async function seedEmailVerificationTokens(prisma: PrismaClient, userIds: string[]): Promise<void> {
	console.log('Seeding Email Verification Tokens...');
	if (userIds.length === 0) {
		console.log('No user IDs provided, skipping email verification token seeding.');
		return;
	}
	const tokensData: Prisma.verification_tokensCreateInput[] = [];
	// Create for users who are not yet email_verified (assuming users array contains this info, or fetch it)
	// For simplicity, we'll just create for a random subset here.
	const numberOfTokens = Math.min(userIds.length, 5);

	for (let i = 0; i < numberOfTokens; i++) {
		const userId = faker.helpers.arrayElement(userIds);
		if (tokensData.some(t => t.users.connect?.id === userId)) continue;

		const rawToken = faker.string.alphanumeric(40);
		const hashedToken = bcrypt.hashSync(rawToken, 10);
		const now = new Date();
		const expiresAt = faker.date.soon({ days: 2, refDate: now }); // Token expires in 2 days (use soon for days)

		tokensData.push({
			users: { connect: { id: userId } },
			hashed_token: hashedToken,
			expires_at: expiresAt,
			created_at: now,
			updated_at: now,
		});
	}

	if (tokensData.length > 0) {
		try {
			let count = 0;
			for (const data of tokensData) {
				try {
					await prisma.verification_tokens.create({ data });
					count++;
				} catch (e) {
					if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
						console.warn(`Skipping duplicate email verification token for user ${data.users.connect?.id} due to hash collision (rare).`);
					} else {
						throw e;
					}
				}
			}
			console.log(`-> Seeded ${count} email verification tokens.`);
		} catch (error) {
			console.error('Error seeding email verification tokens:', error);
		}
	} else {
		console.log('No new email verification tokens to seed.');
	}
}
