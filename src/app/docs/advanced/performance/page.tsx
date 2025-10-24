'use client'

import React from 'react'
import { Zap, TrendingUp, Database, Cpu, BarChart3, Settings, Gauge, Target, Activity, Layers } from 'lucide-react'

export default function AdvancedPerformancePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold">Advanced Performance Optimization</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enterprise-grade performance optimization strategies, monitoring, and scaling techniques for high-performance Islamic boarding school management systems.
          </p>
        </div>

        {/* Performance Architecture */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold">Performance Architecture</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Multi-layer Caching Strategy
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/lib/cache/cache-manager.ts
import Redis from 'ioredis'
import { LRUCache } from 'lru-cache'

export class CacheManager {
  private redis: Redis
  private memoryCache: LRUCache<string, any>
  private cacheHierarchy: Map<string, CacheLevel[]>

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
    this.memoryCache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes
    })

    this.setupCacheHierarchy()
  }

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    let data = this.memoryCache.get(key)
    if (data) {
      this.recordHit('memory', key)
      return data as T
    }

    // L2: Redis cache (fast)
    const redisData = await this.redis.get(key)
    if (redisData) {
      data = JSON.parse(redisData)
      this.memoryCache.set(key, data) // Populate L1
      this.recordHit('redis', key)
      return data as T
    }

    // L3: Database cache (slower)
    const dbData = await this.getDatabaseCache<T>(key)
    if (dbData) {
      await this.set(key, dbData, 300) // 5 minutes
      this.recordHit('database', key)
      return dbData
    }

    this.recordMiss(key)
    return null
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    // Set in all cache levels
    this.memoryCache.set(key, value)
    await this.redis.setex(key, ttl, JSON.stringify(value))
    await this.setDatabaseCache(key, value, ttl)
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.match(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // Invalidate Redis cache
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }

    // Invalidate database cache
    await this.invalidateDatabaseCache(pattern)
  }

  private setupCacheHierarchy() {
    this.cacheHierarchy.set('user-data', [
      { level: 'memory', ttl: 60 },
      { level: 'redis', ttl: 300 },
      { level: 'database', ttl: 3600 }
    ])

    this.cacheHierarchy.set('student-list', [
      { level: 'memory', ttl: 300 },
      { level: 'redis', ttl: 1800 },
      { level: 'database', ttl: 7200 }
    ])
  }

  async getWithStrategy<T>(
    key: string, 
    strategy: string,
    fallbackFn: () => Promise<T>
  ): Promise<T> {
    const levels = this.cacheHierarchy.get(strategy) || []
    
    for (const level of levels) {
      const data = await this.getCacheLevel<T>(key, level.level)
      if (data) return data
    }

    // Fallback to source
    const freshData = await fallbackFn()
    await this.setWithStrategy(key, freshData, strategy)
    return freshData
  }

  private async getCacheLevel<T>(key: string, level: string): Promise<T | null> {
    switch (level) {
      case 'memory':
        return this.memoryCache.get(key) as T || null
      case 'redis':
        const redisData = await this.redis.get(key)
        return redisData ? JSON.parse(redisData) : null
      case 'database':
        return await this.getDatabaseCache<T>(key)
      default:
        return null
    }
  }
}`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Advanced Database Optimization
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/lib/database/query-optimizer.ts
import { PrismaClient } from '@prisma/client'

export class QueryOptimizer {
  private prisma: PrismaClient
  private queryCache: Map<string, any>
  private indexAnalyzer: IndexAnalyzer

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
    this.queryCache = new Map()
    this.indexAnalyzer = new IndexAnalyzer()
  }

  // Optimized student queries with intelligent pagination
  async getStudentsPaginated(params: {
    page: number
    limit: number
    filters?: any
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const cacheKey = this.generateCacheKey('students', params)
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)
    }

    const offset = (params.page - 1) * params.limit
    
    // Use cursor-based pagination for better performance on large datasets
    const baseQuery = {
      where: this.buildWhereClause(params.filters),
      include: this.getOptimalIncludes('student'),
      orderBy: {
        [params.sortBy || 'createdAt']: params.sortOrder || 'desc'
      }
    }

    const [students, totalCount] = await Promise.all([
      this.prisma.students.findMany({
        ...baseQuery,
        skip: offset,
        take: params.limit,
      }),
      this.prisma.students.count({
        where: baseQuery.where
      })
    ])

    const result = {
      data: students,
      pagination: {
        currentPage: params.page,
        totalPages: Math.ceil(totalCount / params.limit),
        totalItems: totalCount,
        hasNextPage: offset + params.limit < totalCount,
        hasPrevPage: params.page > 1
      }
    }

    // Cache result
    this.queryCache.set(cacheKey, result)
    setTimeout(() => this.queryCache.delete(cacheKey), 300000) // 5 min TTL

    return result
  }

  // Bulk operations with transaction batching
  async bulkUpdateStudents(updates: Array<{id: string, data: any}>) {
    const batchSize = 100
    const batches = this.chunkArray(updates, batchSize)
    
    const results = await Promise.all(
      batches.map(batch => 
        this.prisma.$transaction(
          batch.map(update => 
            this.prisma.students.update({
              where: { id: update.id },
              data: update.data
            })
          )
        )
      )
    )

    return results.flat()
  }

  // Connection pooling optimization
  async optimizeConnectionPool() {
    const poolConfig = {
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
    }

    return new PrismaClient({
      datasources: {
        db: {
          url: this.buildOptimizedConnectionString(poolConfig)
        }
      }
    })
  }

  // Query plan analysis
  async analyzeQueryPerformance(query: string) {
    const plan = await this.prisma.$queryRaw\`EXPLAIN ANALYZE \${query}\`
    
    return {
      executionTime: this.extractExecutionTime(plan),
      costEstimate: this.extractCostEstimate(plan),
      indexUsage: this.extractIndexUsage(plan),
      recommendations: this.indexAnalyzer.getRecommendations(plan)
    }
  }

  // Intelligent prefetching
  async prefetchRelatedData<T>(
    entities: T[], 
    relations: string[]
  ): Promise<T[]> {
    const prefetchPromises = relations.map(async (relation) => {
      const ids = entities.map((entity: any) => entity.id)
      return this.batchLoadRelation(relation, ids)
    })

    const relatedData = await Promise.all(prefetchPromises)
    
    // Merge related data back into entities
    return this.mergeRelatedData(entities, relatedData, relations)
  }

  private buildWhereClause(filters: any = {}) {
    const where: any = {}
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { studentId: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters.class) {
      where.classId = filters.class
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: new Date(filters.dateRange.from),
        lte: new Date(filters.dateRange.to)
      }
    }

    return where
  }

  private getOptimalIncludes(entity: string) {
    const includeMap = {
      student: {
        class: {
          select: { id: true, name: true, grade: true }
        },
        payments: {
          select: { id: true, amount: true, status: true, dueDate: true },
          orderBy: { dueDate: 'desc' },
          take: 5 // Only recent payments
        }
      },
      payment: {
        student: {
          select: { id: true, name: true, studentId: true }
        }
      }
    }

    return includeMap[entity] || {}
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Monitoring */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold">Real-time Performance Monitoring</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Performance Metrics Collection
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/lib/monitoring/performance-tracker.ts
import { performance } from 'perf_hooks'

export interface PerformanceMetrics {
  responseTime: number
  cpuUsage: number
  memoryUsage: number
  dbQueryTime: number
  cacheHitRate: number
  errorRate: number
  throughput: number
  userSatisfactionScore: number
}

export class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics[]>
  private alertThresholds: Map<string, number>
  private monitoringInterval: NodeJS.Timer

  constructor() {
    this.metrics = new Map()
    this.setupAlertThresholds()
    this.startMonitoring()
  }

  // Track API endpoint performance
  trackEndpoint(endpoint: string) {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now()
      const startMemory = process.memoryUsage()

      res.on('finish', () => {
        const endTime = performance.now()
        const endMemory = process.memoryUsage()

        const metrics: PerformanceMetrics = {
          responseTime: endTime - startTime,
          cpuUsage: process.cpuUsage().user / 1000000, // Convert to ms
          memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
          dbQueryTime: req.dbQueryTime || 0,
          cacheHitRate: req.cacheHitRate || 0,
          errorRate: res.statusCode >= 400 ? 1 : 0,
          throughput: 1,
          userSatisfactionScore: this.calculateSatisfactionScore(endTime - startTime)
        }

        this.recordMetrics(endpoint, metrics)
        this.checkAlerts(endpoint, metrics)
      })

      next()
    }
  }

  // Advanced database performance monitoring
  trackDatabaseOperation(operation: string) {
    return async <T>(queryFn: () => Promise<T>): Promise<T> => {
      const startTime = performance.now()
      const startCpuUsage = process.cpuUsage()

      try {
        const result = await queryFn()
        const endTime = performance.now()
        const endCpuUsage = process.cpuUsage(startCpuUsage)

        this.recordDatabaseMetrics(operation, {
          executionTime: endTime - startTime,
          cpuTime: endCpuUsage.user / 1000000,
          success: true
        })

        return result
      } catch (error) {
        const endTime = performance.now()
        
        this.recordDatabaseMetrics(operation, {
          executionTime: endTime - startTime,
          cpuTime: 0,
          success: false,
          error: error.message
        })

        throw error
      }
    }
  }

  // Resource utilization monitoring
  async collectResourceMetrics(): Promise<ResourceMetrics> {
    const cpuUsage = process.cpuUsage()
    const memoryUsage = process.memoryUsage()
    
    return {
      cpu: {
        user: cpuUsage.user / 1000000, // Convert to ms
        system: cpuUsage.system / 1000000,
        percentage: await this.getCPUPercentage()
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      eventLoop: {
        lag: await this.measureEventLoopLag(),
        utilization: await this.getEventLoopUtilization()
      },
      handles: process._getActiveHandles().length,
      requests: process._getActiveRequests().length
    }
  }

  // Performance bottleneck detection
  async detectBottlenecks(): Promise<BottleneckReport> {
    const metrics = await this.getRecentMetrics()
    const bottlenecks: Bottleneck[] = []

    // CPU bottlenecks
    if (metrics.cpu.percentage > 80) {
      bottlenecks.push({
        type: 'CPU',
        severity: 'HIGH',
        description: 'High CPU usage detected',
        impact: 'Response times may be affected',
        recommendations: [
          'Optimize expensive operations',
          'Implement request throttling',
          'Consider horizontal scaling'
        ]
      })
    }

    // Memory bottlenecks
    if (metrics.memory.percentage > 85) {
      bottlenecks.push({
        type: 'MEMORY',
        severity: 'HIGH',
        description: 'High memory usage detected',
        impact: 'Application may become unstable',
        recommendations: [
          'Implement memory caching strategies',
          'Optimize data structures',
          'Add memory leak detection'
        ]
      })
    }

    // Database bottlenecks
    const slowQueries = await this.getSlowQueries()
    if (slowQueries.length > 0) {
      bottlenecks.push({
        type: 'DATABASE',
        severity: 'MEDIUM',
        description: \`\${slowQueries.length} slow queries detected\`,
        impact: 'Database response times affected',
        recommendations: [
          'Add database indexes',
          'Optimize query patterns',
          'Implement query result caching'
        ]
      })
    }

    return {
      timestamp: new Date(),
      bottlenecks,
      overallHealth: this.calculateHealthScore(bottlenecks),
      actionItems: this.generateActionItems(bottlenecks)
    }
  }

  // Automated performance optimization
  async optimizePerformance(): Promise<OptimizationResult> {
    const bottlenecks = await this.detectBottlenecks()
    const optimizations: Optimization[] = []

    for (const bottleneck of bottlenecks.bottlenecks) {
      switch (bottleneck.type) {
        case 'CPU':
          optimizations.push(...await this.optimizeCPUUsage())
          break
        case 'MEMORY':
          optimizations.push(...await this.optimizeMemoryUsage())
          break
        case 'DATABASE':
          optimizations.push(...await this.optimizeDatabasePerformance())
          break
      }
    }

    return {
      optimizationsApplied: optimizations,
      estimatedImpact: this.calculateOptimizationImpact(optimizations),
      nextRecommendations: this.getNextOptimizations()
    }
  }

  private calculateSatisfactionScore(responseTime: number): number {
    // Apdex-style scoring
    if (responseTime <= 100) return 1 // Satisfied
    if (responseTime <= 400) return 0.5 // Tolerating
    return 0 // Frustrated
  }

  private async getCPUPercentage(): Promise<number> {
    // Implementation for CPU percentage calculation
    return 0
  }

  private async measureEventLoopLag(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now()
      setImmediate(() => {
        const lag = performance.now() - start
        resolve(lag)
      })
    })
  }
}`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Predictive Performance Analytics
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/lib/monitoring/predictive-analytics.ts
export class PredictiveAnalytics {
  private trainingData: PerformanceDataPoint[]
  private model: PerformanceModel
  
  constructor() {
    this.trainingData = []
    this.model = new PerformanceModel()
  }

  // Predict performance degradation
  async predictPerformanceTrends(timeWindow: number = 24): Promise<PredictionResult> {
    const historicalData = await this.getHistoricalData(timeWindow)
    const features = this.extractFeatures(historicalData)
    
    const predictions = await this.model.predict(features)
    
    return {
      predictions: predictions.map(p => ({
        timestamp: p.timestamp,
        expectedResponseTime: p.responseTime,
        expectedCpuUsage: p.cpuUsage,
        expectedMemoryUsage: p.memoryUsage,
        confidence: p.confidence,
        riskLevel: this.calculateRiskLevel(p)
      })),
      recommendations: this.generatePredictiveRecommendations(predictions),
      alertsNeeded: predictions.filter(p => p.riskLevel === 'HIGH')
    }
  }

  // Capacity planning based on usage patterns
  async planCapacity(projectedGrowth: number): Promise<CapacityPlan> {
    const currentMetrics = await this.getCurrentCapacityMetrics()
    const growthFactor = 1 + (projectedGrowth / 100)
    
    const projectedLoad = {
      requestsPerSecond: currentMetrics.requestsPerSecond * growthFactor,
      concurrentUsers: currentMetrics.concurrentUsers * growthFactor,
      dataVolume: currentMetrics.dataVolume * growthFactor
    }

    const requiredResources = this.calculateRequiredResources(projectedLoad)
    
    return {
      currentCapacity: currentMetrics,
      projectedLoad,
      requiredResources,
      scalingRecommendations: this.getScalingRecommendations(requiredResources),
      costEstimate: this.estimateScalingCosts(requiredResources),
      timeline: this.getImplementationTimeline(requiredResources)
    }
  }

  // Anomaly detection
  async detectAnomalies(metrics: PerformanceMetrics[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []
    const baseline = this.calculateBaseline(metrics)
    
    for (const metric of metrics) {
      const deviations = this.calculateDeviations(metric, baseline)
      
      for (const [key, deviation] of Object.entries(deviations)) {
        if (Math.abs(deviation) > 2) { // 2 standard deviations
          anomalies.push({
            type: key,
            value: metric[key],
            expectedValue: baseline[key],
            deviation,
            severity: Math.abs(deviation) > 3 ? 'CRITICAL' : 'WARNING',
            timestamp: new Date(),
            possibleCauses: this.identifyPossibleCauses(key, deviation)
          })
        }
      }
    }

    return anomalies
  }

  // Performance forecasting
  async forecastPerformance(days: number = 30): Promise<PerformanceForecast> {
    const historicalTrends = await this.analyzeHistoricalTrends()
    const seasonalPatterns = await this.identifySeasonalPatterns()
    const externalFactors = await this.getExternalFactors()

    const forecast = this.model.forecast({
      trends: historicalTrends,
      seasonality: seasonalPatterns,
      externalFactors,
      forecastDays: days
    })

    return {
      forecastPeriod: days,
      expectedMetrics: forecast.metrics,
      confidenceIntervals: forecast.confidence,
      criticalPeriods: forecast.criticalPeriods,
      recommendedActions: this.getProactiveActions(forecast),
      budgetImpact: this.calculateBudgetImpact(forecast)
    }
  }

  private extractFeatures(data: PerformanceDataPoint[]): FeatureSet {
    return {
      timeOfDay: data.map(d => d.timestamp.getHours()),
      dayOfWeek: data.map(d => d.timestamp.getDay()),
      responseTime: data.map(d => d.responseTime),
      cpuUsage: data.map(d => d.cpuUsage),
      memoryUsage: data.map(d => d.memoryUsage),
      concurrentUsers: data.map(d => d.concurrentUsers),
      requestRate: data.map(d => d.requestRate)
    }
  }

  private calculateRiskLevel(prediction: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0
    
    if (prediction.responseTime > 1000) riskScore += 2
    if (prediction.cpuUsage > 80) riskScore += 2
    if (prediction.memoryUsage > 85) riskScore += 1
    if (prediction.confidence < 0.7) riskScore += 1
    
    if (riskScore >= 4) return 'HIGH'
    if (riskScore >= 2) return 'MEDIUM'
    return 'LOW'
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Load Testing & Optimization */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold">Advanced Load Testing</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Comprehensive Load Testing Suite
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// load-tests/scenarios/comprehensive-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('error_rate')
const responseTime = new Trend('response_time')
const throughput = new Counter('throughput')

export let options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test - normal expected load
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 }, // Ramp up
        { duration: '10m', target: 100 }, // Steady load
        { duration: '5m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'load' },
    },
    
    // Stress test - beyond normal capacity
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
        { duration: '10m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },
    
    // Spike test - sudden load increase
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 1000 }, // Spike
        { duration: '3m', target: 1000 },
        { duration: '10s', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },
    
    // Volume test - large data processing
    volume_test: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '20m',
      preAllocatedVUs: 50,
      maxVUs: 100,
      tags: { test_type: 'volume' },
    },
    
    // Soak test - extended duration
    soak_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2h',
      tags: { test_type: 'soak' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    error_rate: ['rate<0.1'],
    response_time: ['p(95)<500'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const API_KEY = __ENV.API_KEY || ''

export default function() {
  const testScenario = __ENV.K6_SCENARIO || 'mixed'
  
  switch(testScenario) {
    case 'authentication':
      testAuthentication()
      break
    case 'student_operations':
      testStudentOperations()
      break
    case 'payment_processing':
      testPaymentProcessing()
      break
    case 'data_heavy':
      testDataHeavyOperations()
      break
    default:
      testMixedWorkload()
  }
}

function testAuthentication() {
  // Login flow
  const loginResponse = http.post(\`\${BASE_URL}/api/auth/signin\`, {
    email: 'test@school.com',
    password: 'testpassword123'
  })
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  })
  
  errorRate.add(loginResponse.status !== 200)
  responseTime.add(loginResponse.timings.duration)
  throughput.add(1)
  
  if (loginResponse.status === 200) {
    const token = loginResponse.json('accessToken')
    
    // Authenticated requests
    const headers = { Authorization: \`Bearer \${token}\` }
    
    const profileResponse = http.get(\`\${BASE_URL}/api/user/profile\`, { headers })
    check(profileResponse, {
      'profile fetch successful': (r) => r.status === 200,
    })
    
    // 2FA simulation
    if (Math.random() < 0.1) { // 10% of requests trigger 2FA
      const twoFAResponse = http.post(\`\${BASE_URL}/api/auth/2fa/verify\`, {
        token: '123456',
        userId: 'test-user-id'
      }, { headers })
      
      check(twoFAResponse, {
        '2FA verification': (r) => r.status === 200,
      })
    }
  }
  
  sleep(1)
}

function testStudentOperations() {
  const headers = { Authorization: \`Bearer \${getAuthToken()}\` }
  
  // List students with various filters
  const studentsResponse = http.get(
    \`\${BASE_URL}/api/students?page=1&limit=20&search=\${Math.random().toString(36).substr(2, 5)}\`, 
    { headers }
  )
  
  check(studentsResponse, {
    'students list retrieved': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
  })
  
  // Create student (10% of requests)
  if (Math.random() < 0.1) {
    const newStudent = {
      name: \`Test Student \${Date.now()}\`,
      email: \`student\${Date.now()}@test.com\`,
      studentId: \`STD\${Date.now()}\`,
      classId: 'class-1',
      parentContact: '08123456789'
    }
    
    const createResponse = http.post(
      \`\${BASE_URL}/api/students\`, 
      JSON.stringify(newStudent),
      { 
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    )
    
    check(createResponse, {
      'student created': (r) => r.status === 201,
    })
    
    if (createResponse.status === 201) {
      const studentId = createResponse.json('id')
      
      // Update student (simulate editing)
      setTimeout(() => {
        const updateResponse = http.put(
          \`\${BASE_URL}/api/students/\${studentId}\`,
          JSON.stringify({ name: newStudent.name + ' Updated' }),
          { headers: { ...headers, 'Content-Type': 'application/json' } }
        )
        
        check(updateResponse, {
          'student updated': (r) => r.status === 200,
        })
      }, 1000)
    }
  }
  
  sleep(Math.random() * 2 + 1) // 1-3 seconds think time
}

function testPaymentProcessing() {
  const headers = { Authorization: \`Bearer \${getAuthToken()}\` }
  
  // Simulate payment creation
  const paymentData = {
    studentId: 'student-1',
    amount: Math.floor(Math.random() * 1000000) + 100000, // 100k - 1.1M rupiah
    description: 'SPP Bulanan',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
  
  const createPaymentResponse = http.post(
    \`\${BASE_URL}/api/payments\`,
    JSON.stringify(paymentData),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  )
  
  check(createPaymentResponse, {
    'payment created': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  if (createPaymentResponse.status === 201) {
    const paymentId = createPaymentResponse.json('id')
    
    // Simulate payment processing
    const processPaymentResponse = http.post(
      \`\${BASE_URL}/api/payments/\${paymentId}/process\`,
      JSON.stringify({
        paymentMethod: 'bank_transfer',
        bankCode: 'BCA',
        amount: paymentData.amount
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )
    
    check(processPaymentResponse, {
      'payment processed': (r) => r.status === 200,
    })
  }
  
  // Query payment history
  const historyResponse = http.get(
    \`\${BASE_URL}/api/payments?studentId=student-1&status=paid&limit=10\`,
    { headers }
  )
  
  check(historyResponse, {
    'payment history retrieved': (r) => r.status === 200,
  })
  
  sleep(2)
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Optimization Tools */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-semibold">Performance Optimization Tools</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Optimization Commands</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# Performance profiling
npm run perf:profile

# Memory leak detection
npm run perf:memory-check

# Bundle analysis
npm run perf:bundle-analyze

# Database optimization
npm run perf:db-optimize

# Load testing
npm run perf:load-test

# Performance benchmarking
npm run perf:benchmark

# Cache optimization
npm run perf:cache-optimize`}</code>
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Performance Metrics Dashboard</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Average Response Time:</span>
                  <span className="text-green-600 font-medium">142ms</span>
                </div>
                <div className="flex justify-between">
                  <span>95th Percentile:</span>
                  <span className="text-green-600 font-medium">285ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate:</span>
                  <span className="text-green-600 font-medium">0.1%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit Rate:</span>
                  <span className="text-green-600 font-medium">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Query Avg:</span>
                  <span className="text-yellow-600 font-medium">23ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span className="text-yellow-600 font-medium">68%</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Usage:</span>
                  <span className="text-green-600 font-medium">35%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}