import { PrismaClient, UserRole, TransactionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.transaction.deleteMany()
  await prisma.putawayBatch.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.item.deleteMany()
  await prisma.user.deleteMany()
  await prisma.location.deleteMany()
  await prisma.company.deleteMany()

  // Create test company
  const company = await prisma.company.create({
    data: {
      code: 'TEST'
    }
  })

  // Create test locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        label: 'A-01-01',
        aisle: 'A',
        bay: '01',
        height: '01',
        type: 'STANDARD'
      }
    }),
    prisma.location.create({
      data: {
        label: 'A-01-02',
        aisle: 'A',
        bay: '01',
        height: '02',
        type: 'STANDARD'
      }
    })
  ])

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'test',
        passwordHash: 'test123',
        role: UserRole.ADMIN,
        companyId: company.id
      }
    }),
    prisma.user.create({
      data: {
        username: 'staff',
        passwordHash: 'staff123',
        role: UserRole.STAFF,
        companyId: company.id
      }
    })
  ])

  // Create test items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        sku: 'TEST001',
        name: 'Test Item 1',
        barcode: '1234567890',
        companyId: company.id
      }
    }),
    prisma.item.create({
      data: {
        sku: 'TEST002',
        name: 'Test Item 2',
        barcode: '0987654321',
        companyId: company.id
      }
    })
  ])

  const baseDate = new Date()
  
  // Create transactions and update stock in sequence to maintain consistency
  
  // 1. First PUTAWAY transaction (3 days ago)
  await prisma.transaction.create({
    data: {
      type: TransactionType.PUTAWAY,
      quantity: 10,
      itemId: items[0].id,
      toLocationId: locations[0].id,  // Only toLocationId for PUTAWAY
      userId: users[0].id,
      createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED'
    }
  })

  // Create initial stock after PUTAWAY
  await prisma.stock.create({
    data: {
      itemId: items[0].id,
      locationId: locations[0].id,
      quantity: 10
    }
  })

  // 2. MOVE transaction (2 days ago)
  await prisma.transaction.create({
    data: {
      type: TransactionType.MOVE,
      quantity: 5,
      itemId: items[0].id,
      fromLocationId: locations[0].id,  // Both locations for MOVE
      toLocationId: locations[1].id,
      userId: users[0].id,
      createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED'
    }
  })

  // Update stocks after MOVE
  await prisma.stock.update({
    where: {
      itemId_locationId: {
        itemId: items[0].id,
        locationId: locations[0].id,
      }
    },
    data: { quantity: 5 }  // Decrease by 5
  })

  await prisma.stock.create({
    data: {
      itemId: items[0].id,
      locationId: locations[1].id,
      quantity: 5
    }
  })

  // 3. Initial stock for item 2
  await prisma.stock.create({
    data: {
      itemId: items[1].id,
      locationId: locations[1].id,
      quantity: 8  // Starting with 8 to accommodate future transactions
    }
  })

  // 4. REMOVE transaction (1 day ago)
  await prisma.transaction.create({
    data: {
      type: TransactionType.REMOVE,
      quantity: 3,
      itemId: items[1].id,
      fromLocationId: locations[1].id,  // Only fromLocationId for REMOVE
      userId: users[1].id,
      createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      status: 'UNDONE',
      undoneAt: new Date(),
      undoneById: users[0].id
    }
  })

  // 5. Recent MOVE transaction (12 hours ago)
  await prisma.transaction.create({
    data: {
      type: TransactionType.MOVE,
      quantity: 2,
      itemId: items[1].id,
      fromLocationId: locations[1].id,
      toLocationId: locations[0].id,
      userId: users[1].id,
      createdAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000),
      status: 'COMPLETED'
    }
  })

  // Final stock updates after last MOVE
  await prisma.stock.update({
    where: {
      itemId_locationId: {
        itemId: items[1].id,
        locationId: locations[1].id,
      }
    },
    data: { quantity: 6 }  // 8 - 2 (moved)
  })

  await prisma.stock.create({
    data: {
      itemId: items[1].id,
      locationId: locations[0].id,
      quantity: 2
    }
  })

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })