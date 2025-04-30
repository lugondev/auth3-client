import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomBigInt, randomDecimal } from './helpers'; // Import helpers
import { CreatedVenue } from './venues'; // Import type if needed

export interface CreatedEvent {
  id: string;
  venue_id: string; // Keep venue_id for potential later use
}

export async function seedEvents(prisma: PrismaClient, venues: CreatedVenue[]): Promise<CreatedEvent[]> {
  console.log('Seeding Events...');
  const createdEvents: CreatedEvent[] = [];
  for (const venue of venues) {
    const eventCount = faker.number.int({ min: 8, max: 20 }); // More events per venue
    for (let i = 0; i < eventCount; i++) {
      const startTime = faker.date.future({ years: 1 });
      const endTime = faker.date.between({ from: startTime, to: new Date(startTime.getTime() + faker.number.int({ min: 2, max: 8 }) * 60 * 60 * 1000) }); // Event duration 2-8 hours
      try {
        const event = await prisma.events.create({
          data: {
            venues: { connect: { id: venue.id } },
            name: `${faker.word.adjective()} ${faker.music.genre()} Night`,
            description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
            category: faker.helpers.arrayElement(['Music', 'Conference', 'Workshop', 'Party', 'Festival', 'Arts', 'Comedy', 'Networking']),
            start_time: startTime,
            end_time: endTime,
            timezone: faker.location.timeZone(),
            is_recurring: faker.datatype.boolean(0.05), // Less recurring
            // recurrence_rule: null, // Add logic if needed
            max_capacity: randomBigInt(30, 300),
            ticket_price: randomDecimal(50000, 1500000, 0), // VND
            is_featured: faker.datatype.boolean(0.15),
            is_cancelled: faker.datatype.boolean(0.02),
            status: faker.helpers.arrayElement(['draft', 'published', 'completed', 'cancelled', 'postponed']),
            created_at: faker.date.past({ years: 1, refDate: startTime }),
            updated_at: faker.date.between({ from: faker.date.past({ years: 1, refDate: startTime }), to: startTime }),
          },
          select: { id: true, venue_id: true }
        });
        createdEvents.push(event);
      } catch (error) {
        console.error(`Error seeding event ${i + 1} for venue ${venue.id}:`, error);
      }
    }
  }
  console.log(`-> Seeded ${createdEvents.length} events.`);
  return createdEvents;
}

export async function seedEventRelatedData(prisma: PrismaClient, events: CreatedEvent[]) {
  console.log('Seeding Event Performers, Photos, and Tickets...');
  let createdPerformersCount = 0;
  let createdPhotosCount = 0;
  let createdTicketsCount = 0;

  for (const event of events) {
    const baseDate = faker.date.past({ years: 1 });

    // --- Seed Event Performers (One-to-Many) ---
    const performerCount = faker.number.int({ min: 0, max: 5 }); // Some events might have no listed performers
    for (let i = 0; i < performerCount; i++) {
      try {
        await prisma.event_performers.create({
          data: {
            events: { connect: { id: event.id } },
            name: faker.person.fullName(),
            description: faker.lorem.sentence(),
            photo_url: faker.image.avatar(),
            website: faker.datatype.boolean(0.5) ? faker.internet.url() : null,
            social_media: { // Example JSON
              twitter: faker.datatype.boolean(0.7) ? `https://twitter.com/${faker.internet.username()}` : null,
              instagram: faker.datatype.boolean(0.8) ? `https://instagram.com/${faker.internet.username()}` : null,
              facebook: faker.datatype.boolean(0.6) ? `https://facebook.com/${faker.internet.username()}` : null,
            },
            created_at: baseDate,
            updated_at: faker.date.between({ from: baseDate, to: new Date() }),
          }
        });
        createdPerformersCount++;
      } catch (error) {
        console.error(`Error seeding performer ${i + 1} for event ${event.id}:`, error);
      }
    }

    // --- Seed Event Photos (One-to-Many) ---
    const photoCount = faker.number.int({ min: 3, max: 8 });
    let hasPrimary = false;
    for (let i = 0; i < photoCount; i++) {
      const isPrimary = !hasPrimary && faker.datatype.boolean(0.25);
      try {
        await prisma.event_photos.create({
          data: {
            events: { connect: { id: event.id } },
            url: faker.image.urlPicsumPhotos(),
            caption: faker.lorem.words(faker.number.int({ min: 3, max: 10 })),
            is_primary: isPrimary,
            created_at: baseDate,
            updated_at: faker.date.between({ from: baseDate, to: new Date() }),
          }
        });
        if (isPrimary) hasPrimary = true;
        createdPhotosCount++;
      } catch (error) {
        console.error(`Error seeding photo ${i + 1} for event ${event.id}:`, error);
      }
    }

    // --- Seed Event Tickets (One-to-Many) ---
    const ticketTypeCount = faker.number.int({ min: 1, max: 4 }); // Different ticket types
    for (let i = 0; i < ticketTypeCount; i++) {
      const quantity = randomBigInt(20, 500);
      // Ensure quantitySold doesn't exceed quantity
      const maxSold = Math.min(Number(quantity), Math.floor(Number(quantity) * faker.number.float({ min: 0.1, max: 0.95 })));
      const quantitySold = randomBigInt(0, maxSold);
      const saleStartTime = faker.date.soon({ days: 30 });
      const saleEndTime = faker.date.future({ years: 0.5, refDate: saleStartTime });
      try {
        await prisma.event_tickets.create({
          data: {
            events: { connect: { id: event.id } },
            name: faker.helpers.arrayElement(['General Admission', 'VIP', 'Early Bird', 'Student Discount', 'Group Package']),
            description: faker.lorem.sentence(),
            price: randomDecimal(50000, 2000000, 0), // VND
            currency: 'VND',
            quantity: quantity,
            quantity_sold: quantitySold,
            sale_start_time: saleStartTime,
            sale_end_time: saleEndTime,
            status: faker.helpers.arrayElement(['on_sale', 'sold_out', 'not_yet_on_sale', 'sale_ended', 'cancelled']),
            created_at: baseDate,
            updated_at: faker.date.between({ from: baseDate, to: new Date() }),
          }
        });
        createdTicketsCount++;
      } catch (error) {
        console.error(`Error seeding ticket type ${i + 1} for event ${event.id}:`, error);
      }
    }
  }
  console.log(`-> Seeded ${createdPerformersCount} event performers.`);
  console.log(`-> Seeded ${createdPhotosCount} event photos.`);
  console.log(`-> Seeded ${createdTicketsCount} event tickets.`);
}
