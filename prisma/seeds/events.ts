import { PrismaClient } from '@prisma/client'

export async function seedEvents(prisma: PrismaClient, params: { venues: { id: string }[] }) {
  console.log('Seeding events...')

  const { venues } = params

  // Clean existing data first
  await prisma.$executeRaw`TRUNCATE TABLE "event_performers" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "event_photos" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "event_tickets" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "events" CASCADE`

  const allEvents = []

  // Process venues sequentially to avoid race conditions
  for (const venue of venues) {
    // Create music event
    const musicEvent = await prisma.events.create({
      data: {
        venue_id: venue.id,
        name: 'Đêm nhạc acoustic',
        description: 'Đêm nhạc acoustic với các nghệ sĩ trẻ',
        category: 'Music',
        start_time: new Date('2024-05-01T19:00:00+07:00'),
        end_time: new Date('2024-05-01T22:00:00+07:00'),
        timezone: 'Asia/Ho_Chi_Minh',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=FR,SA',
        max_capacity: 100,
        ticket_price: 150000,
        is_featured: true,
        status: 'published',
      },
    })

    // Create workshop event
    const workshopEvent = await prisma.events.create({
      data: {
        venue_id: venue.id,
        name: 'Workshop pha chế cocktail',
        description: 'Học cách pha chế các loại cocktail cơ bản',
        category: 'Workshop',
        start_time: new Date('2024-05-15T18:00:00+07:00'),
        end_time: new Date('2024-05-15T21:00:00+07:00'),
        timezone: 'Asia/Ho_Chi_Minh',
        is_recurring: false,
        max_capacity: 20,
        ticket_price: 850000,
        is_featured: true,
        status: 'published',
      },
    })

    const events = [musicEvent, workshopEvent]
    allEvents.push(...events)

    // Create event photos and performers for each event
    for (const event of events) {
      // Create event photos
      await prisma.event_photos.createMany({
        data: [
          {
            event_id: event.id,
            url: `https://storage.example.com/events/${event.id}/main.jpg`,
            caption: 'Ảnh chính',
            is_primary: true,
          },
          {
            event_id: event.id,
            url: `https://storage.example.com/events/${event.id}/venue.jpg`,
            caption: 'Không gian tổ chức',
            is_primary: false,
          },
        ],
      })

      // Create performers based on event category
      if (event.category === 'Music') {
        await prisma.event_performers.create({
          data: {
            event_id: event.id,
            name: 'Trịnh Acoustic Band',
            description: 'Ban nhạc acoustic trẻ với nhiều bản hit',
            photo_url: 'https://storage.example.com/performers/trinh-band.jpg',
            website: 'https://trinhband.example.com',
            social_media: {
              facebook: 'trinhacoustic',
              instagram: '@trinhband',
            },
          },
        })
      } else if (event.category === 'Workshop') {
        await prisma.event_performers.create({
          data: {
            event_id: event.id,
            name: 'Bartender Minh',
            description: 'Chuyên gia pha chế với 10 năm kinh nghiệm',
            photo_url: 'https://storage.example.com/performers/bartender-minh.jpg',
            website: 'https://bartenderminh.example.com',
            social_media: {
              facebook: 'bartenderminh',
              instagram: '@mixologist_minh',
            },
          },
        })
      }

      // Create event tickets
      const ticketConfig = event.category === 'Music'
        ? { regular: 150000, vip: 250000, regularQty: 80, vipQty: 20 }
        : { regular: 850000, vip: 1200000, regularQty: 15, vipQty: 5 }

      await prisma.event_tickets.createMany({
        data: [
          {
            event_id: event.id,
            name: 'Vé thường',
            description: 'Vé vào cửa tiêu chuẩn',
            price: ticketConfig.regular,
            currency: 'VND',
            quantity: BigInt(ticketConfig.regularQty),
            quantity_sold: BigInt(0),
            sale_start_time: new Date('2024-04-01T00:00:00+07:00'),
            sale_end_time: event.start_time,
            status: 'on_sale',
          },
          {
            event_id: event.id,
            name: 'Vé VIP',
            description: event.category === 'Music' ? 'Bao gồm đồ uống miễn phí' : 'Bao gồm bộ dụng cụ pha chế',
            price: ticketConfig.vip,
            currency: 'VND',
            quantity: BigInt(ticketConfig.vipQty),
            quantity_sold: BigInt(0),
            sale_start_time: new Date('2024-04-01T00:00:00+07:00'),
            sale_end_time: event.start_time,
            status: 'on_sale',
          },
        ],
      })
    }
  }

  return { events: allEvents }
}
