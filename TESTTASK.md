# Test Task: Implement Stock History with Undo Feature

## Overview
Implement a history feature that allows users to:
1. View a history of all stock movements
2. Undo recent stock movements
3. See the status of each movement (Completed/Undone)

## Requirements

### 1. Stock History Page
Create a new page at `/stock/history` that shows:
- Date and time of movement
- Type of movement (Putaway/Move/Remove)
- Items involved (SKU, quantity)
- Locations (from/to)
- Status (Completed/Undone)
- Undo button (if movement can be undone)

### 2. Undo Functionality
- Allow undoing the most recent movement if it's still valid
- Prevent undoing if it would create negative stock
- Show clear feedback when undo succeeds/fails
- Update all relevant stock levels when undoing

### 3. Database Changes
Add necessary fields to the Transaction model:
- status field (COMPLETED/UNDONE)
- undoneAt timestamp
- undoneBy user reference

## Technical Requirements

1. Use TypeScript for all new code
2. Add proper error handling
3. Include loading states
4. Add basic tests
5. Follow existing code style
6. Use Prisma for database operations

## Example Implementation

```typescript
// Example schema addition
model Transaction {
  // ... existing fields
  status    String    @default("COMPLETED") // "COMPLETED" or "UNDONE"
  undoneAt  DateTime?
  undoneBy  String?   // Reference to user who undid the transaction
}

// Example API endpoint
async function undoTransaction(transactionId: string) {
  // 1. Check if transaction can be undone
  // 2. Update stock levels
  // 3. Mark transaction as undone
  // 4. Return updated transaction
}
```

## Evaluation Criteria

1. Code Quality
   - Clean, readable code
   - Proper error handling
   - Type safety

2. Functionality
   - Works as specified
   - Handles edge cases
   - Provides good user feedback

3. Testing
   - Basic test coverage
   - Tests for edge cases

4. UI/UX
   - Clear, intuitive interface
   - Proper loading states
   - Error messages

## Submission
- Create a new branch for your implementation
- Include any necessary database migrations
- Add tests for core functionality
- Update documentation if needed

## Time Expectation
- 2-4 hours

## Bonus Points
- Add filtering/sorting to history page
- Implement redo functionality
- Add detailed audit logging
- Improve UI/UX beyond basic requirements 