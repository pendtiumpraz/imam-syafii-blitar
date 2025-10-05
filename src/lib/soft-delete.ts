/**
 * Soft Delete Utility Functions
 *
 * Provides comprehensive utilities for soft deletion patterns in Prisma.
 * Soft deletion marks records as deleted without removing them from the database,
 * allowing for recovery and audit trails.
 */

/**
 * Options for soft delete operations
 */
export interface SoftDeleteOptions {
  /** User ID performing the deletion (for audit trails) */
  userId?: string;
  /** Timestamp for deletion (defaults to current time) */
  deletedAt?: Date;
}

/**
 * Options for restore operations
 */
export interface RestoreOptions {
  /** User ID performing the restoration (for audit trails) */
  userId?: string;
}

/**
 * Result of a bulk operation
 */
export interface BulkOperationResult {
  /** Number of records affected */
  count: number;
}

/**
 * Soft deletes a single record by marking it as deleted.
 *
 * @template T - The type of the model being deleted
 * @param model - The Prisma model to perform the operation on
 * @param where - The where clause to identify the record
 * @param userId - Optional user ID for audit trail
 * @returns The updated record with deletedAt and deletedBy set
 *
 * @example
 * ```typescript
 * const deletedUser = await softDelete(
 *   prisma.user,
 *   { id: '123' },
 *   'admin-user-id'
 * );
 * ```
 */
export async function softDelete<T>(
  model: any,
  where: any,
  userId?: string
): Promise<T> {
  try {
    if (!model || typeof model.update !== 'function') {
      throw new Error('Invalid model: model must have an update method');
    }

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Where clause is required and cannot be empty');
    }

    const updateData: any = {
      deletedAt: new Date(),
    };

    // Add deletedBy field if userId is provided and the model supports it
    if (userId) {
      updateData.deletedBy = userId;
    }

    const result = await model.update({
      where,
      data: updateData,
    });

    return result as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Soft delete failed: ${error.message}`);
    }
    throw new Error('Soft delete failed: Unknown error');
  }
}

/**
 * Restores a soft-deleted record by clearing the deletedAt field.
 *
 * @template T - The type of the model being restored
 * @param model - The Prisma model to perform the operation on
 * @param where - The where clause to identify the record
 * @returns The restored record with deletedAt and deletedBy cleared
 *
 * @example
 * ```typescript
 * const restoredUser = await restore(
 *   prisma.user,
 *   { id: '123' }
 * );
 * ```
 */
export async function restore<T>(
  model: any,
  where: any
): Promise<T> {
  try {
    if (!model || typeof model.update !== 'function') {
      throw new Error('Invalid model: model must have an update method');
    }

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Where clause is required and cannot be empty');
    }

    const updateData: any = {
      deletedAt: null,
    };

    // Also clear deletedBy if the field exists
    try {
      updateData.deletedBy = null;
    } catch {
      // deletedBy field may not exist, ignore
    }

    const result = await model.update({
      where,
      data: updateData,
    });

    return result as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
    throw new Error('Restore failed: Unknown error');
  }
}

/**
 * Permanently deletes a record from the database.
 * This operation cannot be undone.
 *
 * @template T - The type of the model being deleted
 * @param model - The Prisma model to perform the operation on
 * @param where - The where clause to identify the record
 * @returns The deleted record
 *
 * @example
 * ```typescript
 * const deletedUser = await forceDelete(
 *   prisma.user,
 *   { id: '123' }
 * );
 * ```
 *
 * @warning This operation is irreversible. Use with caution.
 */
export async function forceDelete<T>(
  model: any,
  where: any
): Promise<T> {
  try {
    if (!model || typeof model.delete !== 'function') {
      throw new Error('Invalid model: model must have a delete method');
    }

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Where clause is required and cannot be empty');
    }

    const result = await model.delete({
      where,
    });

    return result as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Force delete failed: ${error.message}`);
    }
    throw new Error('Force delete failed: Unknown error');
  }
}

/**
 * Modifies a where clause to exclude soft-deleted records.
 *
 * @param where - The base where clause (optional)
 * @returns A new where clause that excludes deleted records
 *
 * @example
 * ```typescript
 * const activeUsers = await prisma.user.findMany({
 *   where: excludeDeleted({ role: 'ADMIN' })
 * });
 *
 * // Or without additional conditions
 * const allActiveUsers = await prisma.user.findMany({
 *   where: excludeDeleted()
 * });
 * ```
 */
export function excludeDeleted(where: any = {}): any {
  return {
    ...where,
    deletedAt: null,
  };
}

/**
 * Modifies a where clause to include only soft-deleted records.
 *
 * @param where - The base where clause (optional)
 * @returns A new where clause that includes only deleted records
 *
 * @example
 * ```typescript
 * const deletedUsers = await prisma.user.findMany({
 *   where: onlyDeleted({ role: 'ADMIN' })
 * });
 *
 * // Or without additional conditions
 * const allDeletedUsers = await prisma.user.findMany({
 *   where: onlyDeleted()
 * });
 * ```
 */
export function onlyDeleted(where: any = {}): any {
  return {
    ...where,
    deletedAt: {
      not: null,
    },
  };
}

/**
 * Soft deletes multiple records matching the where clause.
 *
 * @template T - The type of the model being deleted
 * @param model - The Prisma model to perform the operation on
 * @param where - The where clause to identify records
 * @param userId - Optional user ID for audit trail
 * @returns Object containing the count of affected records
 *
 * @example
 * ```typescript
 * const result = await softDeleteMany(
 *   prisma.user,
 *   { role: 'GUEST' },
 *   'admin-user-id'
 * );
 * console.log(`Deleted ${result.count} users`);
 * ```
 */
export async function softDeleteMany(
  model: any,
  where: any,
  userId?: string
): Promise<BulkOperationResult> {
  try {
    if (!model || typeof model.updateMany !== 'function') {
      throw new Error('Invalid model: model must have an updateMany method');
    }

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Where clause is required and cannot be empty');
    }

    const updateData: any = {
      deletedAt: new Date(),
    };

    // Add deletedBy field if userId is provided and the model supports it
    if (userId) {
      updateData.deletedBy = userId;
    }

    const result = await model.updateMany({
      where,
      data: updateData,
    });

    return {
      count: result.count,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Soft delete many failed: ${error.message}`);
    }
    throw new Error('Soft delete many failed: Unknown error');
  }
}

/**
 * Restores multiple soft-deleted records matching the where clause.
 *
 * @template T - The type of the model being restored
 * @param model - The Prisma model to perform the operation on
 * @param where - The where clause to identify records
 * @returns Object containing the count of affected records
 *
 * @example
 * ```typescript
 * const result = await restoreMany(
 *   prisma.user,
 *   { role: 'GUEST' }
 * );
 * console.log(`Restored ${result.count} users`);
 * ```
 */
export async function restoreMany(
  model: any,
  where: any
): Promise<BulkOperationResult> {
  try {
    if (!model || typeof model.updateMany !== 'function') {
      throw new Error('Invalid model: model must have an updateMany method');
    }

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Where clause is required and cannot be empty');
    }

    const updateData: any = {
      deletedAt: null,
    };

    // Also clear deletedBy if the field exists
    try {
      updateData.deletedBy = null;
    } catch {
      // deletedBy field may not exist, ignore
    }

    const result = await model.updateMany({
      where,
      data: updateData,
    });

    return {
      count: result.count,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Restore many failed: ${error.message}`);
    }
    throw new Error('Restore many failed: Unknown error');
  }
}

/**
 * Permanently deletes multiple records from the database.
 * This operation cannot be undone.
 *
 * @param model - The Prisma model to perform the operation on
 * @param where - The where clause to identify records
 * @returns Object containing the count of affected records
 *
 * @example
 * ```typescript
 * const result = await forceDeleteMany(
 *   prisma.user,
 *   { deletedAt: { lt: new Date('2024-01-01') } }
 * );
 * console.log(`Permanently deleted ${result.count} users`);
 * ```
 *
 * @warning This operation is irreversible. Use with caution.
 */
export async function forceDeleteMany(
  model: any,
  where: any
): Promise<BulkOperationResult> {
  try {
    if (!model || typeof model.deleteMany !== 'function') {
      throw new Error('Invalid model: model must have a deleteMany method');
    }

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Where clause is required and cannot be empty');
    }

    const result = await model.deleteMany({
      where,
    });

    return {
      count: result.count,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Force delete many failed: ${error.message}`);
    }
    throw new Error('Force delete many failed: Unknown error');
  }
}

/**
 * Utility type for models with soft delete support
 */
export type SoftDeletableModel = {
  deletedAt: Date | null;
  deletedBy?: string | null;
};

/**
 * Check if a record is soft deleted
 *
 * @param record - The record to check
 * @returns True if the record is soft deleted, false otherwise
 *
 * @example
 * ```typescript
 * const user = await prisma.user.findUnique({ where: { id: '123' } });
 * if (isSoftDeleted(user)) {
 *   console.log('User is deleted');
 * }
 * ```
 */
export function isSoftDeleted(record: SoftDeletableModel | null | undefined): boolean {
  return record?.deletedAt !== null && record?.deletedAt !== undefined;
}

/**
 * Check if a record is active (not soft deleted)
 *
 * @param record - The record to check
 * @returns True if the record is active, false otherwise
 *
 * @example
 * ```typescript
 * const user = await prisma.user.findUnique({ where: { id: '123' } });
 * if (isActive(user)) {
 *   console.log('User is active');
 * }
 * ```
 */
export function isActive(record: SoftDeletableModel | null | undefined): boolean {
  return !isSoftDeleted(record);
}
