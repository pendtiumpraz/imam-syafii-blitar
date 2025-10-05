/**
 * Query helper functions for soft delete operations
 *
 * These utilities help manage soft-deleted records in database queries.
 * Use them to filter, include, or exclusively query deleted records.
 */

/**
 * Add soft delete filter to where clause
 *
 * Use for models that have soft delete but NOT in middleware.
 * This ensures only non-deleted records are returned.
 *
 * @template T - The type of the where clause object
 * @param where - Optional existing where clause to extend
 * @returns Where clause with isDeleted: false filter
 *
 * @example
 * ```typescript
 * const users = await prisma.user.findMany({
 *   where: withoutDeleted({ role: 'ADMIN' })
 * });
 * ```
 */
export function withoutDeleted<T extends object>(where?: T): T & { isDeleted: false } {
  return {
    ...where,
    isDeleted: false
  } as T & { isDeleted: false };
}

/**
 * Get only deleted records (for admin recovery UI)
 *
 * Returns a where clause that filters for deleted records only.
 * Useful for admin interfaces that need to show or recover deleted data.
 *
 * @template T - The type of the where clause object
 * @param where - Optional existing where clause to extend
 * @returns Where clause with isDeleted: true filter
 *
 * @example
 * ```typescript
 * const deletedUsers = await prisma.user.findMany({
 *   where: onlyDeleted({ role: 'ADMIN' })
 * });
 * ```
 */
export function onlyDeleted<T extends object>(where?: T): T & { isDeleted: true } {
  return {
    ...where,
    isDeleted: true
  } as T & { isDeleted: true };
}

/**
 * Include deleted records (admin view all)
 *
 * Returns the where clause as-is without adding any isDeleted filter.
 * Use when you need to see all records regardless of deletion status.
 *
 * @template T - The type of the where clause object
 * @param where - Optional existing where clause
 * @returns The original where clause unchanged
 *
 * @example
 * ```typescript
 * const allUsers = await prisma.user.findMany({
 *   where: includeDeleted({ role: 'ADMIN' })
 * });
 * ```
 */
export function includeDeleted<T extends object>(where?: T): T {
  return where || {} as T;
}
