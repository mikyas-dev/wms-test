# Warehouse Management Test Task

## Overview
A warehouse management system that allows users to track inventory across multiple locations, move stock between locations, and manage putaways and removals.

## Test Task
Please see [TESTTASK.md](./TESTTASK.md) for the specific implementation task you need to complete.

## Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
# Copy the example environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma db push

# Seed the database with test data
npx prisma db seed
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Test Credentials
- Username: test
- Password: test123

## Features to Implement

1. Stock Management
   - View current stock levels
   - Move stock between locations
   - Remove stock from locations
   - Add new stock (putaway)

2. History & Undo
   - Track all stock movements
   - Implement undo/redo functionality
   - Show audit trail of changes

3. User Interface
   - Implement barcode scanning
   - Create intuitive forms for stock operations
   - Add proper error handling and validation

## Technical Requirements

- Use TypeScript for all code
- Follow React best practices
- Implement proper error handling
- Add input validation
- Write clean, maintainable code
- Add comments for complex logic

## Bonus Points

- Add unit tests
- Implement optimistic updates
- Add loading states
- Improve UI/UX
- Add additional useful features

## Project Structure
```
├── app/                  # Next.js app directory
├── components/          # React components
├── lib/                 # Utility functions and configurations
├── prisma/             # Database schema and migrations
└── public/             # Static assets
```

## Features

- Barcode scanning for inventory management
- Location-based stock tracking
- Real-time stock updates
- Mobile-friendly interface

## Tech Stack

- Next.js 14
- TypeScript
- Prisma
- TailwindCSS
- HTML5-QRCode for barcode scanning
