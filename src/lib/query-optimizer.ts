// Query optimization utilities for preventing N+1 queries and improving database performance

export interface OptimizedInclude {
  [key: string]: boolean | OptimizedInclude | {
    select?: OptimizedInclude
    include?: OptimizedInclude
    orderBy?: any
    take?: number
    skip?: number
    where?: any
  }
}

// Common optimized includes for frequently used relations
export const optimizedIncludes = {
  // Student optimized includes
  student: {
    minimal: {
      // TODO: students model doesn't have a creator relation
      // createdBy is just a string field, not a relation
    },
    withClass: {
      currentClass: {
        select: {
          id: true,
          name: true,
          grade: true,
          level: true
        }
      }
    },
    withParent: {
      // TODO: students model doesn't have direct parentAccount relation
      // Need to go through parent_students -> parent_accounts -> users
    },
    full: {
      currentClass: {
        select: {
          id: true,
          name: true,
          grade: true,
          level: true
        }
      }
      // TODO: Add parent relations when schema is updated
    }
  },

  // Activity optimized includes
  activity: {
    minimal: {
      // TODO: activities model may not have a creator relation
      // Check actual schema structure
    },
    withParticipants: {
      participants: {
        select: {
          id: true,
          studentId: true,
          student: {
            select: {
              id: true,
              fullName: true,
              nis: true
            }
          }
        }
      }
    }
  },

  // Hafalan optimized includes
  hafalan: {
    minimal: {
      student: {
        select: {
          id: true,
          fullName: true,
          nis: true
        }
      },
      teacher: {
        select: {
          id: true,
          name: true
        }
      }
    },
    withSurah: {
      student: {
        select: {
          id: true,
          fullName: true,
          nis: true,
          institutionType: true,
          grade: true
        }
      },
      teacher: {
        select: {
          id: true,
          name: true
        }
      },
      surah: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          number: true,
          totalAyat: true
        }
      }
    }
  },

  // Finance/Transaction optimized includes
  transaction: {
    minimal: {
      // TODO: transactions model may not have creator relation
      // createdBy may just be a string field
      category: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    withAccount: {
      category: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      account: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  },

  // User optimized includes
  user: {
    minimal: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    withProfile: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  }
}

// Batch loading utility to prevent N+1 queries
export class BatchLoader {
  private batches = new Map<string, {
    ids: Set<string>,
    promises: Array<{ resolve: Function, reject: Function }>,
    timer?: NodeJS.Timeout
  }>()

  async load<T>(
    key: string,
    id: string,
    loader: (ids: string[]) => Promise<T[]>,
    keyExtractor: (item: T) => string,
    batchDelay = 10 // milliseconds
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, {
          ids: new Set(),
          promises: []
        })
      }

      const batch = this.batches.get(key)!
      batch.ids.add(id)
      batch.promises.push({ resolve, reject })

      // Clear existing timer
      if (batch.timer) {
        clearTimeout(batch.timer)
      }

      // Set new timer to batch the requests
      batch.timer = setTimeout(async () => {
        const idsArray = Array.from(batch.ids)
        const promises = [...batch.promises]
        
        // Clear batch
        this.batches.delete(key)

        try {
          const results = await loader(idsArray)
          const resultsMap = new Map(results.map(item => [keyExtractor(item), item]))

          promises.forEach(({ resolve }, index) => {
            const requestedId = idsArray[Math.floor(index / batch.ids.size * idsArray.length)]
            resolve(resultsMap.get(requestedId) || null)
          })
        } catch (error) {
          promises.forEach(({ reject }) => reject(error))
        }
      }, batchDelay)
    })
  }
}

// Global batch loader instance
export const batchLoader = new BatchLoader()

// Common batch loaders for frequently accessed data
export const commonLoaders = {
  async loadUsers(ids: string[]) {
    const { default: prisma } = await import('@/lib/prisma')
    return prisma.users.findMany({
      where: { id: { in: ids } },
      select: optimizedIncludes.user.withProfile
    })
  },

  async loadStudents(ids: string[]) {
    const { default: prisma } = await import('@/lib/prisma')
    return prisma.students.findMany({
      where: { id: { in: ids } },
      include: optimizedIncludes.student.minimal
    })
  },

  async loadClasses(ids: string[]) {
    const { default: prisma } = await import('@/lib/prisma')
    return prisma.classes.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        grade: true,
        level: true
      }
    })
  }
}

// Query performance monitoring
export const withQueryMetrics = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now()
  
  try {
    const result = await queryFn()
    const duration = performance.now() - startTime
    
    // Log slow queries (> 500ms)
    if (duration > 500) {
      console.warn(`Slow query detected: ${queryName}`, {
        duration: `${duration.toFixed(2)}ms`
      })
    }
    
    // Log query metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query: ${queryName} - ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    console.error(`Query failed: ${queryName}`, {
      duration: `${duration.toFixed(2)}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// Prefetch utility for related data
export const prefetchRelatedData = async (
  baseData: any[],
  relations: {
    field: string,
    loader: (ids: string[]) => Promise<any[]>,
    keyExtractor?: (item: any) => string
  }[]
) => {
  const prefetchPromises = relations.map(async ({ field, loader, keyExtractor }) => {
    const relatedIds = baseData
      .map(item => item[field])
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index) // unique

    if (relatedIds.length === 0) return

    const relatedData = await loader(relatedIds)
    const relatedMap = new Map(
      relatedData.map(item => [
        keyExtractor ? keyExtractor(item) : item.id,
        item
      ])
    )

    // Attach related data to base data
    baseData.forEach(item => {
      if (item[field]) {
        item[field + '_data'] = relatedMap.get(item[field])
      }
    })
  })

  await Promise.all(prefetchPromises)
  return baseData
}

// Database connection pool monitoring
export const dbMetrics = {
  activeConnections: 0,
  totalQueries: 0,
  slowQueries: 0,
  
  incrementQuery: () => {
    dbMetrics.totalQueries++
  },
  
  incrementSlowQuery: () => {
    dbMetrics.slowQueries++
  },
  
  getMetrics: () => ({
    activeConnections: dbMetrics.activeConnections,
    totalQueries: dbMetrics.totalQueries,
    slowQueries: dbMetrics.slowQueries,
    slowQueryPercentage: dbMetrics.totalQueries > 0 
      ? (dbMetrics.slowQueries / dbMetrics.totalQueries * 100).toFixed(2)
      : '0.00'
  })
}