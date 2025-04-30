import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomDecimal } from './helpers'; // Import helper
import { CreatedVenue } from './venues'; // Import type

interface CreatedCategory {
	id: string;
	venue_id: string;
	name: string;
}

interface CreatedProduct {
	id: string;
	category_id: string;
	venue_id: string;
}

interface CreatedOption {
	id: string;
	product_id: string;
	name: string;
}

export async function seedProductCategories(prisma: PrismaClient, venues: CreatedVenue[]): Promise<CreatedCategory[]> {
	console.log('Seeding Product Categories...');
	const createdCategories: CreatedCategory[] = [];
	let displayOrderCounter = 0;

	for (const venue of venues) {
		const categoryCount = faker.number.int({ min: 5, max: 10 }); // More categories
		const categoryNames = faker.helpers.uniqueArray(faker.commerce.department, categoryCount); // Ensure unique names per venue

		for (const name of categoryNames) {
			try {
				const category = await prisma.product_categories.create({
					data: {
						venues: { connect: { id: venue.id } },
						name: name,
						description: faker.lorem.sentence(),
						display_order: BigInt(displayOrderCounter++),
						is_active: faker.datatype.boolean(0.95),
						created_at: faker.date.past({ years: 1 }),
						updated_at: faker.date.recent({ days: 20 }),
					},
					select: { id: true, venue_id: true, name: true }
				});
				createdCategories.push(category);
			} catch (error) {
				console.error(`Error seeding category "${name}" for venue ${venue.id}:`, error);
			}
		}
	}
	console.log(`-> Seeded ${createdCategories.length} product categories.`);
	return createdCategories;
}

export async function seedProducts(prisma: PrismaClient, categories: CreatedCategory[]): Promise<CreatedProduct[]> {
	console.log('Seeding Products...');
	const createdProducts: CreatedProduct[] = [];

	for (const category of categories) {
		const productCount = faker.number.int({ min: 8, max: 25 }); // More products per category
		for (let i = 0; i < productCount; i++) {
			const price = randomDecimal(10000, 500000, 0); // VND prices
			const hasDiscount = faker.datatype.boolean(0.25);
			// Ensure discount price is lower than original price
			const discountPrice = hasDiscount ? randomDecimal(Number(price) * 0.5, Number(price) * 0.9, 0) : null;

			try {
				const product = await prisma.products.create({
					data: {
						venues: { connect: { id: category.venue_id } },
						product_categories: { connect: { id: category.id } }, // Connect via relation
						name: `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${category.name}`, // More descriptive names
						description: faker.commerce.productDescription(),
						price: price,
						discount_price: discountPrice,
						currency: 'VND',
						is_available: faker.datatype.boolean(0.9),
						sku: faker.string.alphanumeric(10).toUpperCase(),
						tags: faker.helpers.uniqueArray(faker.lorem.word, faker.number.int({ min: 0, max: 5 })),
						ingredients: faker.helpers.uniqueArray(faker.lorem.word, faker.number.int({ min: 3, max: 8 })),
						allergens: faker.helpers.arrayElements(['gluten', 'dairy', 'nuts', 'soy', 'shellfish'], faker.number.int({ min: 0, max: 3 })),
						nutritional_info: { // Example JSON
							calories: faker.number.int({ min: 50, max: 1200 }),
							protein_g: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
							fat_g: faker.number.float({ min: 1, max: 80, fractionDigits: 1 }),
							carbs_g: faker.number.float({ min: 5, max: 150, fractionDigits: 1 }),
						},
						created_at: faker.date.past({ years: 1 }),
						updated_at: faker.date.recent({ days: 15 }),
					},
					select: { id: true, category_id: true, venue_id: true }
				});
				createdProducts.push(product);
			} catch (error) {
				console.error(`Error seeding product ${i + 1} for category ${category.id}:`, error);
			}
		}
	}
	console.log(`-> Seeded ${createdProducts.length} products.`);
	return createdProducts;
}


export async function seedProductRelatedData(prisma: PrismaClient, products: CreatedProduct[]) {
	console.log('Seeding Product Photos, Options, and Choices...');
	let createdPhotosCount = 0;
	let createdOptionsCount = 0;
	let createdChoicesCount = 0;
	const createdOptions: CreatedOption[] = []; // Store created options for choice seeding

	for (const product of products) {
		const baseDate = faker.date.past({ years: 1 });

		// --- Seed Product Photos (One-to-Many) ---
		const photoCount = faker.number.int({ min: 1, max: 6 });
		let hasPrimary = false;
		for (let i = 0; i < photoCount; i++) {
			const isPrimary = !hasPrimary && faker.datatype.boolean(0.3); // Only one primary
			try {
				await prisma.product_photos.create({
					data: {
						products: { connect: { id: product.id } },
						url: faker.image.urlPicsumPhotos(),
						caption: faker.lorem.sentence(4),
						is_primary: isPrimary,
						created_at: baseDate,
						updated_at: faker.date.between({ from: baseDate, to: new Date() }),
					}
				});
				if (isPrimary) hasPrimary = true;
				createdPhotosCount++;
			} catch (error) {
				console.error(`Error seeding photo ${i + 1} for product ${product.id}:`, error);
			}
		}

		// --- Seed Product Options (One-to-Many) ---
		if (faker.datatype.boolean(0.5)) { // 50% chance of having options
			const optionCount = faker.number.int({ min: 1, max: 3 });
			for (let i = 0; i < optionCount; i++) {
				const minSelect = BigInt(faker.number.int({ min: 0, max: 1 })); // 0 or 1
				const maxSelect = BigInt(faker.number.int({ min: Number(minSelect), max: 4 })); // Allow selecting multiple
				try {
					const option = await prisma.product_options.create({
						data: {
							products: { connect: { id: product.id } },
							name: faker.helpers.arrayElement(['Size', 'Add-ons', 'Spice Level', 'Sweetness', 'Temperature']),
							description: faker.lorem.sentence(),
							required: minSelect > 0,
							min_select: minSelect,
							max_select: maxSelect,
							created_at: baseDate,
							updated_at: faker.date.between({ from: baseDate, to: new Date() }),
						},
						select: { id: true, product_id: true, name: true }
					});
					createdOptions.push(option); // Save for choices
					createdOptionsCount++;
				} catch (error) {
					console.error(`Error seeding option ${i + 1} for product ${product.id}:`, error);
				}
			}
		}
	} // End product loop

	// --- Seed Option Choices (Logical relation to Product Options) ---
	for (const option of createdOptions) {
		const choiceCount = faker.number.int({ min: 2, max: 6 });
		let hasDefault = false;
		let possibleChoiceNames: string[] = [];

		// Determine possible choices based on option name
		switch (option.name) {
			case 'Size': possibleChoiceNames = ['Small', 'Medium', 'Large', 'Extra Large']; break;
			case 'Add-ons': possibleChoiceNames = faker.helpers.uniqueArray(faker.commerce.productMaterial, 10); break; // Generate a few unique add-ons
			case 'Spice Level': possibleChoiceNames = ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot']; break;
			case 'Sweetness': possibleChoiceNames = ['0%', '30%', '50%', '70%', '100%']; break;
			case 'Temperature': possibleChoiceNames = ['Hot', 'Iced', 'Warm']; break;
			default: possibleChoiceNames = faker.helpers.uniqueArray(faker.lorem.word, 10); // Generic words
		}

		// Shuffle and take the required number of unique choices, capped at the number available
		const uniqueChoiceNames = faker.helpers.shuffle(possibleChoiceNames).slice(0, choiceCount);

		for (const choiceName of uniqueChoiceNames) {
			const isDefault = !hasDefault && faker.datatype.boolean(0.15);

			try {
				await prisma.option_choices.create({
					data: {
						option_id: option.id, // Link to the parent option
						name: choiceName,
						description: faker.lorem.sentence(3),
						price_adjustment: randomDecimal(-10000, 50000, 0), // Can be negative (discount) or positive (upcharge)
						is_default: isDefault,
						created_at: faker.date.past({ years: 1 }), // Use different creation date for choices
						updated_at: faker.date.recent({ days: 5 }),
					}
				});
				if (isDefault) hasDefault = true;
				createdChoicesCount++;
			} catch (error) {
				console.error(`Error seeding choice "${choiceName}" for option ${option.id}:`, error);
			}
		}
	}

	console.log(`-> Seeded ${createdPhotosCount} product photos.`);
	console.log(`-> Seeded ${createdOptionsCount} product options.`);
	console.log(`-> Seeded ${createdChoicesCount} option choices.`);
}
