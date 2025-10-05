# Soft Delete Migration Plan

## Current State
- **95 database models** using hard delete
- **37+ API routes** with `prisma.*.delete()` operations
- **No `deletedAt` or `isDeleted` fields** in schema
- **Risk**: Data loss, broken relations, no audit trail

## Recommended Implementation Strategy

### Phase 1: Add Soft Delete Fields (Critical Models First)
Priority models that should NEVER be hard deleted:
1. `Student` - Enrollment data
2. `Teacher` - Employment records
3. `HafalanRecord` - Progress tracking
4. `Transaction` - Financial records
5. `Donation` - Donation history
6. `Payment` - Payment records
7. `Alumni` - Historical data
8. `Grade` - Academic records
9. `Attendance` - Attendance history
10. `SPPPayment` - Billing records

### Phase 2: Create Soft Delete Utilities

```typescript
// src/lib/soft-delete.ts
export async function softDelete<T>(
  model: any,
  where: any
): Promise<T> {
  return await model.update({
    where,
    data: {
      deletedAt: new Date(),
      isDeleted: true
    }
  });
}

export function excludeDeleted(where: any = {}) {
  return {
    ...where,
    deletedAt: null,
    isDeleted: false
  };
}
```

### Phase 3: Database Migration

```prisma
// Add to critical models:
model Student {
  // ... existing fields
  deletedAt  DateTime?
  isDeleted  Boolean   @default(false)
  deletedBy  String?
}

// Repeat for all priority models
```

### Phase 4: Update API Routes Gradually

Start with critical routes:
1. `/api/students` - Student CRUD
2. `/api/hafalan/record` - Hafalan records
3. `/api/donations` - Donations
4. `/api/spp/payments` - Payments

### Phase 5: Prisma Middleware (Advanced)

Add global soft delete behavior:

```typescript
// src/lib/prisma.ts
prisma.$use(async (params, next) => {
  // Soft delete
  if (params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = {
      deletedAt: new Date(),
      isDeleted: true
    };
  }

  // Auto-exclude deleted
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.args.where = excludeDeleted(params.args.where);
  }

  if (params.action === 'findMany') {
    if (params.args.where) {
      params.args.where = excludeDeleted(params.args.where);
    } else {
      params.args.where = { isDeleted: false };
    }
  }

  return next(params);
});
```

## Immediate Action Required

### Quick Fix for Critical Data
Add soft delete to these models NOW:

1. **Student** - Educational records must be preserved
2. **HafalanRecord** - Progress tracking
3. **Transaction/Payment** - Financial audit trail
4. **Donation** - Donor records

### Migration Script

```bash
# 1. Create migration
npx prisma migrate create add_soft_delete_to_critical_models

# 2. Add fields to schema
# 3. Apply migration
npx prisma migrate deploy
```

## Testing Strategy

1. Test each model separately
2. Verify cascading behavior
3. Check query performance
4. Audit trail validation
5. Recovery procedures

## Rollback Plan

If issues occur:
1. Keep old hard delete as `forceDelete()`
2. Soft delete as default `delete()`
3. Admin UI to recover deleted records
4. Purge old deleted records after 90 days

## Timeline

- **Week 1**: Add soft delete to 10 critical models
- **Week 2**: Update API routes for critical models
- **Week 3**: Add Prisma middleware
- **Week 4**: Migrate remaining models
- **Week 5**: Testing & validation
- **Week 6**: Deploy to production

## Notes

- All deleted records should keep `deletedBy` user ID
- Add `deletedAt` timestamp
- Create admin interface to view/restore deleted records
- Set up automated purge after retention period (e.g., 90 days)
