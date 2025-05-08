import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Seeds social profiles for a subset of users.
 * Each user can have multiple social profiles from different providers.
 *
 * @param prisma - The PrismaClient instance.
 * @param userIds - An array of user IDs.
 */
export async function seedSocialProfiles(prisma: PrismaClient, userIds: string[]): Promise<void> {
	console.log('Seeding Social Profiles...');
	if (userIds.length === 0) {
		console.log('No user IDs provided, skipping social profile seeding.');
		return;
	}

	const socialProfilesData: Prisma.social_profilesCreateManyInput[] = []; // Correct type for createMany
	const providers = ['google', 'facebook', 'github', 'twitter', 'linkedin'];
	const numberOfProfilesToCreate = Math.min(userIds.length * 2, 15); // Create up to 15 profiles

	const existingProviderUserPairs = new Set<string>(); // To avoid duplicate (provider, provider_user_id)

	for (let i = 0; i < numberOfProfilesToCreate; i++) {
		const userId = faker.helpers.arrayElement(userIds);
		const provider = faker.helpers.arrayElement(providers);
		const providerUserId = faker.string.uuid(); // Unique ID from the social provider

		const uniqueKey = `${provider}-${providerUserId}`;
		if (existingProviderUserPairs.has(uniqueKey)) {
			continue; // Skip if this provider-ID pair already used (simulates global uniqueness)
		}
		existingProviderUserPairs.add(uniqueKey);

		// Avoid creating multiple profiles of the same provider for the same user in this seed run
		// When using CreateManyInput, we check against the user_id directly in the accumulated data.
		if (socialProfilesData.some(p => p.user_id === userId && p.provider === provider)) {
			continue;
		}

		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();

		socialProfilesData.push({
			user_id: userId, // Correct for social_profilesCreateManyInput
			provider: provider,
			provider_user_id: providerUserId,
			email: faker.internet.email({ firstName, lastName, provider: `${provider}.com` }).toLowerCase(),
			name: `${firstName} ${lastName}`,
			photo_url: faker.image.avatar(),
			// created_at and updated_at are not in the social_profiles schema model
		});
	}

	if (socialProfilesData.length > 0) {
		try {
			// Using createMany with skipDuplicates for the @@unique([provider, provider_user_id])
			await prisma.social_profiles.createMany({
				data: socialProfilesData,
				skipDuplicates: true,
			});
			console.log(`-> Seeded ${socialProfilesData.length} social profiles (actual count may be lower due to skipDuplicates).`);
			// To get exact count, you might need to query or create one by one if precision is critical.
			// For seeding, createMany with skipDuplicates is often sufficient.
		} catch (error) {
			console.error('Error seeding social profiles:', error);
		}
	} else {
		console.log('No new social profiles to seed.');
	}
}
