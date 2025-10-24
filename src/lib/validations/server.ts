import { ZodError, ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validate data against a Zod schema
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}

/**
 * Validate data and return either the data or throw an error
 */
export function validateOrThrow<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Safe parse that returns a result object
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors: ValidationError[] = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    errors,
  };
}

/**
 * Validate request body in API route
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON in request body' }],
    };
  }
}

/**
 * Validate request and return NextResponse on error
 */
export async function validateRequestOrRespond<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  const result = await validateRequest(request, schema);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        errors: result.errors,
      },
      { status: 400 }
    );
  }

  return { data: result.data! };
}

/**
 * Validate query parameters
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const params: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    // Try to parse numbers
    if (!isNaN(Number(value))) {
      params[key] = Number(value);
    }
    // Try to parse booleans
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    }
    // Keep as string
    else {
      params[key] = value;
    }
  });

  return validate(schema, params);
}

/**
 * Format validation errors for client response
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Check if data is valid against schema (returns boolean)
 */
export function isValid<T>(schema: ZodSchema<T>, data: unknown): boolean {
  const result = schema.safeParse(data);
  return result.success;
}

/**
 * Validate multiple fields independently
 */
export function validateFields(
  fields: Array<{ schema: ZodSchema<any>; data: unknown; name: string }>
): ValidationResult<Record<string, any>> {
  const errors: ValidationError[] = [];
  const validatedData: Record<string, any> = {};

  for (const field of fields) {
    const result = field.schema.safeParse(field.data);

    if (result.success) {
      validatedData[field.name] = result.data;
    } else {
      result.error.errors.forEach((err) => {
        errors.push({
          field: field.name,
          message: err.message,
        });
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: validatedData };
}

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): ValidationResult<File> {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    required = true,
  } = options;

  if (!file && required) {
    return {
      success: false,
      errors: [{ field: 'file', message: 'File is required' }],
    };
  }

  if (!file && !required) {
    return { success: true, data: file };
  }

  const errors: ValidationError[] = [];

  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must not exceed ${maxSize / (1024 * 1024)}MB`,
    });
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: file };
}

/**
 * Create standardized error response
 */
export function createValidationErrorResponse(errors: ValidationError[], status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors: formatValidationErrors(errors),
    },
    { status }
  );
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Sanitize object with string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}
