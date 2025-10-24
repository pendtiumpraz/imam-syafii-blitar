'use client'

import React from 'react'
import { Zap, Monitor, Database, Globe, AlertTriangle, TrendingUp } from 'lucide-react'

export default function PerformanceTroubleshootingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold">Performance Troubleshooting</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Diagnose and fix performance issues for optimal application speed
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Monitor className="w-6 h-6 text-blue-500" />
            Performance Monitoring
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Key Metrics to Monitor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Core Web Vitals</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• LCP: &lt; 2.5s (good)</li>
                    <li>• FID: &lt; 100ms</li>
                    <li>• CLS: &lt; 0.1</li>
                    <li>• TTFB: &lt; 800ms</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Server Metrics</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Response time &lt; 200ms</li>
                    <li>• CPU usage &lt; 70%</li>
                    <li>• Memory usage &lt; 80%</li>
                    <li>• Disk I/O &lt; 80%</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Database Metrics</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• Query time &lt; 100ms</li>
                    <li>• Connection pool &lt; 80%</li>
                    <li>• Index hit ratio &gt; 95%</li>
                    <li>• Buffer cache &gt; 90%</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Monitoring Tools Setup</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// lib/performance-monitoring.ts
import { performance } from 'perf_hooks'

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  
  startTimer(label: string): () => number {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
      return duration
    }
  }
  
  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)
    
    // Keep only last 100 measurements
    if (this.metrics.get(label)!.length > 100) {
      this.metrics.get(label)!.shift()
    }
  }
  
  getMetrics(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null
    
    const sorted = [...values].sort((a, b) => a - b)
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      count: values.length
    }
  }
  
  middleware() {
    return (req: any, res: any, next: any) => {
      const timer = this.startTimer(\`\${req.method} \${req.path}\`)
      
      res.on('finish', () => {
        const duration = timer()
        console.log(\`\${req.method} \${req.path} - \${duration.toFixed(2)}ms\`)
      })
      
      next()
    }
  }
}

export const perfMonitor = new PerformanceMonitor()

// Usage in API routes
export async function GET(request: Request) {
  const timer = perfMonitor.startTimer('api-users-get')
  
  try {
    const users = await prisma.users.findMany()
    return Response.json({ users })
  } finally {
    timer()
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-green-500" />
            Frontend Performance Issues
          </h2>
          <div className="space-y-6">
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-red-700 dark:text-red-300">🐌 Slow Initial Load</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Common Causes:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• Large JavaScript bundles</li>
                    <li>• Unoptimized images</li>
                    <li>• Blocking render resources</li>
                    <li>• Too many external requests</li>
                    <li>• No code splitting</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Solutions:</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// 1. Implement code splitting
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <div>Loading...</div>,
    ssr: false 
  }
)

// 2. Optimize bundle size
npm install --save-dev @next/bundle-analyzer

// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  // Remove unused dependencies
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
      ],
    },
  },
})

// 3. Image optimization
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// 4. Preload critical resources
// In _document.tsx
<Head>
  <link rel="preload" href="/api/critical-data" as="fetch" crossOrigin="anonymous" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="//external-api.com" />
</Head>`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-orange-700 dark:text-orange-300">⚡ Poor Runtime Performance</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">React Performance Issues:</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// 1. Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Heavy rendering */}</div>
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id
})

// 2. Use useMemo and useCallback
const Component = ({ items, onItemClick }) => {
  const expensiveValue = useMemo(() => {
    return items.reduce((acc, item) => acc + item.value, 0)
  }, [items])
  
  const handleClick = useCallback((id) => {
    onItemClick(id)
  }, [onItemClick])
  
  return <div>/* Component JSX */</div>
}

// 3. Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const VirtualList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
)

// 4. Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce'

const SearchInput = () => {
  const debouncedSearch = useDebouncedCallback(
    async (searchTerm) => {
      const results = await searchAPI(searchTerm)
      setResults(results)
    },
    500
  )
  
  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  )
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-500" />
            Database Performance Issues
          </h2>
          <div className="space-y-6">
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-red-700 dark:text-red-300">🐌 Slow Database Queries</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Query Optimization:</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- 1. Add proper indexes
CREATE INDEX idx_students_institution_grade ON students(institution_level, grade);
CREATE INDEX idx_bills_student_month_year ON bills(student_id, month, year);
CREATE INDEX idx_bills_status_due_date ON bills(status, due_date);

-- 2. Analyze slow queries
EXPLAIN ANALYZE 
SELECT s.full_name, b.amount, b.due_date
FROM students s
JOIN bills b ON s.id = b.student_id
WHERE b.status = 'PENDING' AND b.due_date < NOW();

-- 3. Optimize with partial indexes
CREATE INDEX idx_bills_pending_overdue 
ON bills(due_date) 
WHERE status = 'PENDING';

-- 4. Use database views for complex queries
CREATE VIEW student_bill_summary AS
SELECT 
  s.id,
  s.full_name,
  COUNT(b.id) as total_bills,
  SUM(CASE WHEN b.status = 'PAID' THEN b.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN b.status = 'PENDING' THEN b.amount ELSE 0 END) as pending_amount
FROM students s
LEFT JOIN bills b ON s.id = b.student_id
GROUP BY s.id, s.full_name;`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Prisma Optimization:</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// 1. Use select to limit fields
const students = await prisma.students.findMany({
  select: {
    id: true,
    fullName: true,
    grade: true,
    // Don't select all fields
  },
  take: 20,
  skip: (page - 1) * 20
})

// 2. Use includeand pagination properly  
const studentsWithBills = await prisma.students.findMany({
  include: {
    bills: {
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { dueDate: 'asc' }
    }
  },
  take: 10
})

// 3. Use transactions for related operations
await prisma.$transaction(async (tx) => {
  const bill = await tx.bill.update({
    where: { id: billId },
    data: { status: 'PAID', paidAt: new Date() }
  })
  
  await tx.transaction.create({
    data: {
      billId: bill.id,
      amount: bill.amount,
      type: 'PAYMENT'
    }
  })
})

// 4. Connection pooling configuration
// DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=10"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-orange-700 dark:text-orange-300">📊 Database Monitoring</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`-- Database performance queries
-- 1. Find slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. Check index usage
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch,
  idx_tup_read / NULLIF(idx_tup_fetch, 0) as ratio
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- 3. Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY bytes DESC;

-- 4. Check connection status
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Performance Testing & Benchmarking
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Load Testing Setup</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// Install k6 for load testing
// npm install -g k6

// load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
  },
}

export default function () {
  // Test homepage
  const homeResponse = http.get('http://localhost:3030/')
  check(homeResponse, {
    'status is 200': (r) => r.status === 200,
    'page loads in <2s': (r) => r.timings.duration < 2000,
  })

  // Test API endpoint
  const apiResponse = http.get('http://localhost:3030/api/students')
  check(apiResponse, {
    'api status is 200': (r) => r.status === 200,
    'api responds in <500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)
}

// Run with: k6 run load-test.js`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Lighthouse CI Integration</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// .github/workflows/performance.yml
name: Performance Tests
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build app
        run: npm run build
      
      - name: Start app
        run: npm start &
        
      - name: Wait for app
        run: sleep 10
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}

// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3030/', 'http://localhost:3030/login'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Performance Budget</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Performance Budget Targets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-sm">Bundle Sizes</h5>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• JS Bundle: &lt; 250KB gzipped</li>
                      <li>• CSS Bundle: &lt; 50KB gzipped</li>
                      <li>• Images: &lt; 1MB total</li>
                      <li>• Fonts: &lt; 100KB</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Loading Times</h5>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• First Paint: &lt; 1.5s</li>
                      <li>• LCP: &lt; 2.5s</li>
                      <li>• TTI: &lt; 3.5s</li>
                      <li>• Speed Index: &lt; 2.5s</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Performance Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Frontend Optimization</h3>
              <ul className="space-y-2 text-sm">
                <li>□ Implement code splitting</li>
                <li>□ Optimize images (WebP, proper sizing)</li>
                <li>□ Use React.memo for heavy components</li>
                <li>□ Enable compression (gzip/brotli)</li>
                <li>□ Minimize bundle size</li>
                <li>□ Use CDN for static assets</li>
                <li>□ Implement service worker caching</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Backend Optimization</h3>
              <ul className="space-y-2 text-sm">
                <li>□ Add database indexes</li>
                <li>□ Implement query optimization</li>
                <li>□ Use connection pooling</li>
                <li>□ Add Redis caching</li>
                <li>□ Enable API response compression</li>
                <li>□ Implement request rate limiting</li>
                <li>□ Monitor database performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}