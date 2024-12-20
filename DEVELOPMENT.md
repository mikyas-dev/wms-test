# Development Guide

## Prerequisites
- Node.js 18+ 
- npm 9+
- Git

## Getting Started

1. Install dependencies:
```bash
npm run setup
```

2. Start the development server:
```bash
npm run dev
```

3. Access the application:
- URL: http://localhost:3000
- Test credentials:
  - Password: test123 (this is set in the .env file as SITE_PASSWORD)

## Development Process

1. Review the requirements in TASKS.md
2. Plan your implementation
3. Write tests for new features
4. Implement the features
5. Test your changes
6. Submit your solution

## Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch
```

## Database Management

```bash
# Reset database to initial state
npm run seed

# Update database after schema changes
npx prisma db push
```

## Common Issues

1. If you see TypeScript errors after schema changes:
```bash
npx prisma generate
```

2. If the database gets corrupted:
```bash
rm prisma/dev.db
npm run setup
```

## Project Structure

```
├── app/                 # Next.js pages and API routes
│   ├── (main)/         # Main application routes
│   └── api/            # API endpoints
├── components/         # Reusable React components
├── lib/               # Utilities and configurations
├── prisma/            # Database schema and migrations
└── __tests__/         # Test files
``` 