import { PrismaClient } from '@prisma/client'

type Venue = { id: string }
type Category = {
	id: string
	name: string
	venue_id: string
}

interface Product {
	id: string
	category: string
	venue_id: string
	category_id: string | null
	name: string
	description: string | null
	price: unknown
	created_at: Date | null
	updated_at: Date | null
	deleted_at: Date | null
	nutritional_info: unknown
}

interface ProductOption {
	id: string
	product_id: string
}

export async function seedProducts(prisma: PrismaClient, params: { venues: Venue[], categories: Category[] }) {
	console.log('Seeding products...')

	const { venues, categories } = params

	// Create products for each venue
	const productsPromises = venues.map(async (venue) => {
		const venueCategories = categories.filter(c => c.venue_id === venue.id)
		const drinksCat = venueCategories.find(c => c.name === 'Đồ uống')
		const mainsCat = venueCategories.find(c => c.name === 'Món chính')
		const dessertsCat = venueCategories.find(c => c.name === 'Tráng miệng')

		return prisma.$transaction([
			// Drinks
			prisma.products.create({
				data: {
					venue_id: venue.id,
					category_id: drinksCat?.id || '',
					name: 'Cà phê sữa đá',
					description: 'Cà phê truyền thống pha với sữa đặc',
					category: 'Drinks',
					price: 45000,
					currency: 'VND',
					is_available: true,
					sku: 'DRINK001',
					tags: ['coffee', 'vietnamese', 'signature'],
					ingredients: ['robusta coffee', 'condensed milk'],
					allergens: ['dairy'],
					nutritional_info: {
						calories: 180,
						sugar: '18g',
						caffeine: '120mg',
					},
				},
			}),
			// Main dishes
			prisma.products.create({
				data: {
					venue_id: venue.id,
					category_id: mainsCat?.id || '',
					name: 'Cơm gà xối mỡ',
					description: 'Cơm với gà chiên giòn và nước mắm pha',
					category: 'Food',
					price: 85000,
					currency: 'VND',
					is_available: true,
					sku: 'FOOD001',
					tags: ['rice', 'chicken', 'main course'],
					ingredients: ['rice', 'chicken', 'fish sauce', 'herbs'],
					allergens: ['fish'],
					nutritional_info: {
						calories: 650,
						protein: '35g',
						carbs: '80g',
					},
				},
			}),
			// Desserts
			prisma.products.create({
				data: {
					venue_id: venue.id,
					category_id: dessertsCat?.id || '',
					name: 'Chè thái',
					description: 'Chè thái với các loại trái cây nhiệt đới',
					category: 'Dessert',
					price: 35000,
					currency: 'VND',
					is_available: true,
					sku: 'DESS001',
					tags: ['dessert', 'sweet', 'cold'],
					ingredients: ['coconut milk', 'jackfruit', 'palm seed', 'jelly'],
					allergens: ['dairy'],
					nutritional_info: {
						calories: 220,
						sugar: '25g',
						fat: '8g',
					},
				},
			}),
		])
	})

	// Create product options and choices
	const productResults = await Promise.all(productsPromises)
	const products = productResults.flat() as unknown as Product[]

	await Promise.all(
		products.map(async (product) => {
			// Different options based on product category
			if (product.category === 'Drinks') {
				const iceOption = await prisma.product_options.create({
					data: {
						product_id: product.id,
						name: 'Đá',
						description: 'Lựa chọn lượng đá',
						required: true,
						min_select: 1,
						max_select: 1,
					},
				}) as ProductOption

				await prisma.option_choices.createMany({
					data: [
						{
							option_id: iceOption.id,
							name: 'Đá bình thường',
							description: 'Lượng đá tiêu chuẩn',
							is_default: true,
						},
						{
							option_id: iceOption.id,
							name: 'Ít đá',
							description: 'Giảm 50% lượng đá',
						},
						{
							option_id: iceOption.id,
							name: 'Không đá',
							description: 'Không dùng đá',
						},
					],
				})
			} else if (product.category === 'Food') {
				const spicyOption = await prisma.product_options.create({
					data: {
						product_id: product.id,
						name: 'Độ cay',
						description: 'Lựa chọn độ cay',
						required: true,
						min_select: 1,
						max_select: 1,
					},
				}) as ProductOption

				const extraOption = await prisma.product_options.create({
					data: {
						product_id: product.id,
						name: 'Thêm',
						description: 'Thêm nguyên liệu',
						required: false,
						min_select: 0,
						max_select: 3,
					},
				}) as ProductOption

				await prisma.option_choices.createMany({
					data: [
						{
							option_id: spicyOption.id,
							name: 'Không cay',
							description: 'Vị nguyên bản',
							is_default: true,
						},
						{
							option_id: spicyOption.id,
							name: 'Hơi cay',
							description: 'Thêm chút ớt',
						},
						{
							option_id: spicyOption.id,
							name: 'Cay',
							description: 'Cay vừa phải',
						},
					],
				})

				await prisma.option_choices.createMany({
					data: [
						{
							option_id: extraOption.id,
							name: 'Thêm cơm',
							description: 'Thêm 1 phần cơm',
							price_adjustment: 10000,
						},
						{
							option_id: extraOption.id,
							name: 'Thêm trứng ốp la',
							description: 'Thêm 1 trứng chiên',
							price_adjustment: 15000,
						},
						{
							option_id: extraOption.id,
							name: 'Thêm rau',
							description: 'Thêm rau ăn kèm',
							price_adjustment: 5000,
						},
					],
				})
			}
		})
	)

	return { products }
}
