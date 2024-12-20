import { prisma } from '../lib/db'

async function checkDatabase() {
  try {
    // Check each table
    const companies = await prisma.company.findMany()
    const items = await prisma.item.findMany()
    const locations = await prisma.location.findMany()
    const stock = await prisma.stock.findMany()
    const transactions = await prisma.transaction.findMany()

    console.log('Database Contents:')
    console.log('=================')
    console.log(`Companies: ${companies.length}`)
    console.log(`Items: ${items.length}`)
    console.log(`Locations: ${locations.length}`)
    console.log(`Stock Records: ${stock.length}`)
    console.log(`Transactions: ${transactions.length}`)

    // Show some sample data if available
    if (companies.length > 0) {
      console.log('\nSample Company:', companies[0])
    }
    if (items.length > 0) {
      console.log('\nSample Item:', items[0])
    }
    if (locations.length > 0) {
      console.log('\nSample Location:', locations[0])
    }

  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase() 