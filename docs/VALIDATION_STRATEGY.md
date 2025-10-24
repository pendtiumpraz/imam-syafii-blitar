# Validation Strategy

## Overview

This document outlines the comprehensive validation strategy for the Pondok Imam Syafii application, using Zod for schema validation and implementing validation at multiple layers.

## Table of Contents

1. [Validation Layers](#validation-layers)
2. [Schema Definitions](#schema-definitions)
3. [Client-Side Validation](#client-side-validation)
4. [Server-Side Validation](#server-side-validation)
5. [File Upload Validation](#file-upload-validation)
6. [Testing Strategy](#testing-strategy)
7. [Error Handling](#error-handling)

## Validation Layers

### Multi-Layer Validation

```
┌─────────────────────────────────────┐
│   1. Client-Side (React Hook Form)  │
│      - Immediate feedback           │
│      - Zod resolver                 │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   2. API Route (Server-Side)        │
│      - Request validation           │
│      - Zod schema parsing           │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   3. Database Constraints           │
│      - Prisma validation            │
│      - Database rules               │
└─────────────────────────────────────┘
```

## Schema Definitions

### Location

All validation schemas are located in `/src/lib/validations/`:

```
src/lib/validations/
├── ppdb.ts           # PPDB registration schemas
├── donation.ts       # Donation and campaign schemas
├── common.ts         # Reusable common schemas
└── server.ts         # Server-side utilities
```

### PPDB Registration Schema

**File:** `/src/lib/validations/ppdb.ts`

```typescript
import { ppdbRegistrationSchema } from '@/lib/validations/ppdb';

// Example usage
const result = ppdbRegistrationSchema.safeParse(data);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors);
}
```

**Validated Fields:**
- Personal information (name, birthdate, gender, etc.)
- Identification numbers (NIK, NISN)
- Contact information (phone, email)
- Address details
- Parent/guardian information
- Education background
- Health information

**Special Validations:**
- Age validation (3-25 years)
- Phone number format (Indonesian)
- NIK format (16 digits)
- NISN format (10 digits)
- Email format
- Postal code format (5 digits)

### Donation Schema

**File:** `/src/lib/validations/donation.ts`

```typescript
import { donationSchema, otaSponsorSchema } from '@/lib/validations/donation';

// Donation validation
const donation = donationSchema.safeParse(formData);

// OTA sponsorship validation
const sponsor = otaSponsorSchema.safeParse(sponsorData);
```

**Validated Fields:**
- Amount validation (min/max limits)
- Donor information
- Payment method selection
- Campaign/category selection
- Anonymous option
- Message/notes

**Special Validations:**
- Minimum donation: Rp 10,000
- Maximum donation: Rp 1,000,000,000
- OTA minimum: Rp 50,000
- Month format: YYYY-MM
- UUID validation for IDs

### Common Schemas

**File:** `/src/lib/validations/common.ts`

Reusable schemas for:
- Contact forms
- Questions (Tanya Ustadz)
- Search and pagination
- URLs and social links
- Date ranges
- File uploads

## Client-Side Validation

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ppdbRegistrationSchema } from '@/lib/validations/ppdb';

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ppdbRegistrationSchema),
    mode: 'onBlur', // Validate on blur
  });

  const onSubmit = async (data) => {
    // Data is already validated
    await submitRegistration(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('fullName')}
        placeholder="Nama Lengkap"
      />
      {errors.fullName && (
        <span className="error">{errors.fullName.message}</span>
      )}
      {/* More fields... */}
    </form>
  );
}
```

### Validation Modes

1. **onChange**: Validate on every change (use sparingly)
2. **onBlur**: Validate when field loses focus (recommended)
3. **onSubmit**: Validate only on submit (default)
4. **onTouched**: Validate after field is touched

### Custom Validation

```typescript
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

## Server-Side Validation

### API Route Validation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/validations/server';
import { ppdbRegistrationSchema } from '@/lib/validations/ppdb';

export async function POST(request: NextRequest) {
  // Validate request body
  const validation = await validateRequest(request, ppdbRegistrationSchema);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        errors: validation.errors,
      },
      { status: 400 }
    );
  }

  const data = validation.data!;

  // Process validated data
  try {
    const registration = await createRegistration(data);
    return NextResponse.json(registration);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
```

### Helper Function: validateRequestOrRespond

```typescript
import { validateRequestOrRespond } from '@/lib/validations/server';

export async function POST(request: NextRequest) {
  const result = await validateRequestOrRespond(
    request,
    ppdbRegistrationSchema
  );

  // If validation failed, result is NextResponse with errors
  if (result instanceof NextResponse) {
    return result;
  }

  // Validation passed, result contains data
  const data = result.data;
  // ... process data
}
```

### Query Parameter Validation

```typescript
import { validateSearchParams } from '@/lib/validations/server';
import { paginationSchema } from '@/lib/validations/common';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const validation = validateSearchParams(searchParams, paginationSchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', errors: validation.errors },
      { status: 400 }
    );
  }

  const { page, limit, sortBy, sortOrder } = validation.data!;
  // ... use validated parameters
}
```

## File Upload Validation

### Single File Validation

```typescript
import { fileUploadSchema } from '@/lib/validations/ppdb';
import { validateFile } from '@/lib/validations/server';

async function handleFileUpload(file: File) {
  // Using Zod schema
  const schemaResult = fileUploadSchema.safeParse({ file });
  if (!schemaResult.success) {
    throw new Error('Invalid file');
  }

  // Or using helper function
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  });

  if (!validation.success) {
    return { error: validation.errors };
  }

  // File is valid, proceed with upload
  const url = await uploadToStorage(file);
  return { url };
}
```

### Multiple Files Validation

```typescript
import { multipleFileUploadSchema } from '@/lib/validations/ppdb';

async function handleMultipleFiles(files: File[]) {
  const result = multipleFileUploadSchema.safeParse({ files });

  if (!result.success) {
    return { error: result.error.errors };
  }

  // All files are valid
  const urls = await Promise.all(
    files.map(file => uploadToStorage(file))
  );

  return { urls };
}
```

### File Type Validation

```typescript
import { validateImage, validateDocument } from '@/lib/validations/common';

// Validate image
const imageResult = validateImage(file);
if (!imageResult.valid) {
  console.error(imageResult.error);
}

// Validate document
const docResult = validateDocument(file);
if (!docResult.valid) {
  console.error(docResult.error);
}
```

## Testing Strategy

### Unit Tests

**Location:** `/src/__tests__/validations/`

```bash
npm test
```

**Test Coverage:**
- All validation schemas
- Edge cases (min/max values)
- Invalid formats
- Optional fields
- Required fields
- Custom validations

**Example Test:**

```typescript
describe('PPDB Registration Validation', () => {
  it('should accept valid data', () => {
    const data = {
      fullName: 'Ahmad Zaki',
      birthPlace: 'Blitar',
      birthDate: new Date('2015-01-01'),
      // ... other fields
    };

    const result = ppdbRegistrationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone number', () => {
    const data = {
      // ... valid fields
      phone: '12345',
    };

    const result = ppdbRegistrationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

**Setup:**

```javascript
// jest.integration.config.js
module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['<rootDir>/__tests__/integration/**/*.test.(js|ts)'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup.ts'],
};
```

**Run:**

```bash
npm run test:integration
```

**Example:**

```typescript
describe('PPDB API Integration', () => {
  it('should create registration with valid data', async () => {
    const response = await fetch('/api/ppdb/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validRegistrationData),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.registrationNo).toBeDefined();
  });

  it('should reject invalid data', async () => {
    const response = await fetch('/api/ppdb/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.errors).toBeDefined();
  });
});
```

### E2E Tests

**Location:** `/e2e/`

```bash
npm run test:e2e
```

**Coverage:**
- Complete user flows
- Form validation UX
- Error message display
- Success scenarios
- Edge cases

**Example:**

```typescript
test('should validate PPDB form fields', async ({ page }) => {
  await page.goto('/ppdb/register');

  // Try to submit empty form
  await page.click('button[type="submit"]');

  // Check for validation errors
  await expect(page.getByText(/nama lengkap.*wajib/i)).toBeVisible();
  await expect(page.getByText(/tanggal lahir.*wajib/i)).toBeVisible();

  // Fill valid data
  await page.fill('input[name="fullName"]', 'Ahmad Zaki');
  await page.fill('input[name="birthDate"]', '2015-01-01');

  // Errors should disappear
  await expect(page.getByText(/nama lengkap.*wajib/i)).not.toBeVisible();
});
```

## Error Handling

### Error Response Format

```typescript
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "fullName": "Nama lengkap minimal 3 karakter",
    "phone": "Format nomor telepon tidak valid",
    "amount": "Nominal donasi minimal Rp 10.000"
  }
}
```

### Client-Side Error Display

```typescript
function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="text-red-600 text-sm mt-1">
      {message}
    </div>
  );
}

// Usage
<ErrorMessage message={errors.fullName?.message} />
```

### Server-Side Error Handling

```typescript
import { ZodError } from 'zod';

try {
  const data = schema.parse(input);
  // Process data
} catch (error) {
  if (error instanceof ZodError) {
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        errors,
      },
      { status: 400 }
    );
  }

  // Handle other errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Custom Error Messages

```typescript
const schema = z.object({
  email: z.string().email('Email tidak valid'),
  amount: z.number()
    .min(10000, 'Nominal minimal Rp 10.000')
    .max(1000000000, 'Nominal maksimal Rp 1.000.000.000'),
  phone: z.string().regex(
    /^(\+62|62|0)[0-9]{9,12}$/,
    'Format nomor telepon tidak valid'
  ),
});
```

## Best Practices

### 1. Always Validate on Server

Never trust client-side validation alone. Always validate on the server.

```typescript
// ❌ Bad: Only client-side validation
function ClientForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    // Directly submitting to database without server validation
    await prisma.registration.create({ data });
  };
}

// ✅ Good: Client + Server validation
export async function POST(request: NextRequest) {
  const validation = await validateRequest(request, schema);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Now safe to process
  await prisma.registration.create({ data: validation.data });
}
```

### 2. Use Type-Safe Schemas

```typescript
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
});

// Extract type
type User = z.infer<typeof userSchema>;

// Type-safe usage
function processUser(user: User) {
  // user is fully typed!
  console.log(user.name, user.email, user.age);
}
```

### 3. Sanitize Input

```typescript
import { sanitizeObject } from '@/lib/validations/server';

const validatedData = schema.parse(input);
const sanitized = sanitizeObject(validatedData);

// Safe to use in database
await prisma.user.create({ data: sanitized });
```

### 4. Provide Clear Error Messages

```typescript
// ❌ Bad: Generic messages
z.string().min(3) // "String must contain at least 3 character(s)"

// ✅ Good: Specific messages
z.string().min(3, 'Nama lengkap minimal 3 karakter')
```

### 5. Validate Files Properly

```typescript
// Validate size, type, and content
const validation = validateFile(file, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
});

if (!validation.success) {
  return { error: validation.errors };
}

// Additional security: Check file content (magic numbers)
const buffer = await file.arrayBuffer();
const fileType = await import('file-type');
const type = await fileType.fromBuffer(buffer);

if (!['image/jpeg', 'image/png'].includes(type?.mime || '')) {
  return { error: 'Invalid file type' };
}
```

## Migration Safety

### Testing Migrations

Before running migrations in production:

1. **Test on Development Database**
```bash
npm run db:push
```

2. **Verify Data Integrity**
```sql
-- Check for null values in required fields
SELECT COUNT(*) FROM students WHERE fullName IS NULL;

-- Verify constraints
SELECT * FROM students WHERE length(nik) != 16;
```

3. **Backup Database**
```bash
pg_dump -h localhost -U user -d database > backup.sql
```

4. **Run Migration**
```bash
npm run db:migrate
```

5. **Rollback Plan**
```sql
-- Create rollback script
-- Keep copy of previous schema
```

### Validation After Migration

```typescript
// Validate existing data against new schema
async function validateExistingData() {
  const students = await prisma.students.findMany();

  const invalid = students.filter((student) => {
    const result = studentSchema.safeParse(student);
    return !result.success;
  });

  if (invalid.length > 0) {
    console.error('Invalid records:', invalid);
    // Log or fix invalid data
  }
}
```

## Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Validation](https://www.prisma.io/docs/concepts/components/prisma-client/crud#data-validation)
