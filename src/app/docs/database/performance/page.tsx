'use client'

import React, { useState } from 'react'
import { Database, Zap, BarChart3, Settings, Monitor, AlertTriangle, CheckCircle, Code, Copy, Check, TrendingUp } from 'lucide-react'

export default function DatabasePerformancePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Database },
    { id: 'indexing', label: 'Indexing', icon: Zap },
    { id: 'queries', label: 'Query Optimization', icon: BarChart3 },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'scaling', label: 'Scaling', icon: TrendingUp }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Database className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold">Database Performance Optimization</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Comprehensive guide to optimize PostgreSQL and MySQL performance for school management systems
        </p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-8">
        {activeTab === 'overview' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Performance Optimization Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                  <h3 className="font-semibold mb-2">Indexing Strategy</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Primary and foreign key indexes</li>
                    <li>• Composite indexes</li>
                    <li>• Partial indexes</li>
                    <li>• Index maintenance</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-2">Query Optimization</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Query plan analysis</li>
                    <li>• N+1 query problems</li>
                    <li>• Join optimization</li>
                    <li>• Pagination strategies</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Settings className="w-8 h-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-2">Configuration Tuning</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Memory settings</li>
                    <li>• Connection pooling</li>
                    <li>• Buffer configuration</li>
                    <li>• WAL settings</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Common Performance Issues</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Slow Student Queries</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Large student tables without proper indexing on search fields like name, NISN, class</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Payment Report Performance</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly payment reports scanning entire payment history without date indexes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Grade Calculation Bottlenecks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complex grade calculations without proper aggregation strategies</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">Quick Wins</h3>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Add indexes on frequently queried columns</li>
                    <li>• Enable query caching</li>
                    <li>• Use connection pooling</li>
                    <li>• Implement database connection limits</li>
                    <li>• Regular VACUUM and ANALYZE operations</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'indexing' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Indexing Strategy for School Data</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Essential Indexes for Student Management</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Essential indexes for students table
CREATE INDEX idx_students_nisn ON students(nisn);
CREATE INDEX idx_students_name_gin ON students USING gin(to_tsvector('indonesian', name));
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status) WHERE status = 'active';
CREATE INDEX idx_students_created_at ON students(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_students_class_status ON students(class_id, status);
CREATE INDEX idx_students_active_name ON students(name) WHERE status = 'active';

-- Index for parent searches
CREATE INDEX idx_students_parent_phone ON students(parent_phone);
CREATE INDEX idx_students_parent_email ON students(parent_email);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Payment System Indexes</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Payment indexes for fast queries
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Composite indexes for payment reports
CREATE INDEX idx_payments_student_month ON payments(student_id, month, year);
CREATE INDEX idx_payments_status_due ON payments(status, due_date) 
  WHERE status IN ('pending', 'overdue');

-- Index for payment history
CREATE INDEX idx_payments_paid_at ON payments(paid_at) WHERE paid_at IS NOT NULL;

-- Covering index for payment summaries
CREATE INDEX idx_payments_summary ON payments(student_id, status, amount, month, year);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Academic Records Indexes</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Grades and academic performance
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_subject_id ON grades(subject_id);
CREATE INDEX idx_grades_semester ON grades(semester, academic_year);
CREATE INDEX idx_grades_student_semester ON grades(student_id, semester, academic_year);

-- Assignment indexes
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Submission tracking
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Full-Text Search Indexes</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- PostgreSQL full-text search
CREATE INDEX idx_students_search ON students 
  USING gin(to_tsvector('indonesian', name || ' ' || COALESCE(nisn, '')));

CREATE INDEX idx_announcements_search ON announcements
  USING gin(to_tsvector('indonesian', title || ' ' || content));

-- Add search function
CREATE OR REPLACE FUNCTION search_students(search_term text)
RETURNS TABLE(id uuid, name varchar, nisn varchar, class_name varchar) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.nisn, c.name as class_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE to_tsvector('indonesian', s.name || ' ' || COALESCE(s.nisn, '')) 
        @@ plainto_tsquery('indonesian', search_term)
  ORDER BY ts_rank(to_tsvector('indonesian', s.name), plainto_tsquery('indonesian', search_term)) DESC;
END;
$$ LANGUAGE plpgsql;`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Index Maintenance and Monitoring</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Check index bloat
SELECT 
  schemaname, 
  tablename, 
  indexname,
  pg_size_pretty(pg_total_relation_size(indexname::regclass)) as size,
  CASE WHEN avg_leaf_density IS NULL THEN 'N/A'
       ELSE ROUND(avg_leaf_density, 2) || '%' END as density
FROM pg_stat_user_indexes pgsui
LEFT JOIN (
  SELECT indexname, avg_leaf_density 
  FROM pgstattuple_approx_index(indexname::regclass)
) pts ON pgsui.indexname = pts.indexname
WHERE schemaname = 'public';

-- Rebuild fragmented indexes
REINDEX INDEX CONCURRENTLY idx_students_name;
REINDEX TABLE CONCURRENTLY students;`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'queries' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Query Optimization Techniques</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Optimizing Student Queries</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">❌ Slow Query</h4>
                      <div className="bg-red-900/20 rounded-lg p-3">
                        <pre className="text-sm text-red-300">
{`-- Bad: No indexes, scanning entire table
SELECT * FROM students 
WHERE name LIKE '%Ahmad%' 
  AND status = 'active'
ORDER BY name;`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">✅ Optimized Query</h4>
                      <div className="bg-green-900/20 rounded-lg p-3">
                        <pre className="text-sm text-green-300">
{`-- Good: Uses indexes and limits results
SELECT id, name, nisn, class_id
FROM students 
WHERE status = 'active' 
  AND to_tsvector('indonesian', name) @@ plainto_tsquery('indonesian', 'Ahmad')
ORDER BY name
LIMIT 20;`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Payment Report Optimization</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">❌ Slow Aggregation</h4>
                      <div className="bg-red-900/20 rounded-lg p-3">
                        <pre className="text-sm text-red-300">
{`-- Bad: Full table scan for each student
SELECT 
  s.name,
  (SELECT COUNT(*) FROM payments p WHERE p.student_id = s.id AND p.status = 'paid') as paid_count,
  (SELECT SUM(amount) FROM payments p WHERE p.student_id = s.id AND p.status = 'paid') as total_paid
FROM students s
WHERE s.class_id = $1;`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">✅ Optimized with JOIN</h4>
                      <div className="bg-green-900/20 rounded-lg p-3">
                        <pre className="text-sm text-green-300">
{`-- Good: Single query with proper JOIN
SELECT 
  s.name,
  COALESCE(p.paid_count, 0) as paid_count,
  COALESCE(p.total_paid, 0) as total_paid
FROM students s
LEFT JOIN (
  SELECT 
    student_id,
    COUNT(*) as paid_count,
    SUM(amount) as total_paid
  FROM payments 
  WHERE status = 'paid'
  GROUP BY student_id
) p ON s.id = p.student_id
WHERE s.class_id = $1;`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Prisma Query Optimization</h3>
                    <button
                      onClick={() => copyToClipboard(`// Bad: N+1 query problem
const students = await prisma.students.findMany()
for (const student of students) {
  const payments = await prisma.payments.findMany({
    where: { studentId: student.id }
  })
  // Process payments...
}

// Good: Use include to join data
const students = await prisma.students.findMany({
  include: {
    payments: {
      where: { status: 'paid' },
      select: {
        amount: true,
        paidAt: true,
        month: true
      }
    },
    class: {
      select: { name: true }
    }
  }
})

// Good: Use aggregation
const paymentSummary = await prisma.payments.groupBy({
  by: ['studentId'],
  where: {
    status: 'paid',
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  _sum: { amount: true },
  _count: { id: true }
})

// Good: Use pagination with cursor
const students = await prisma.students.findMany({
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { name: 'asc' },
  where: {
    status: 'active',
    name: { contains: searchTerm, mode: 'insensitive' }
  }
})

// Good: Optimize for common dashboard queries
const dashboardData = await prisma.$transaction([
  // Get student count by class
  prisma.students.groupBy({
    by: ['classId'],
    where: { status: 'active' },
    _count: { id: true }
  }),
  
  // Get payment summary for current month
  prisma.payments.aggregate({
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { amount: true },
    _count: { id: true }
  }),
  
  // Get overdue payments count
  prisma.payments.count({
    where: {
      status: 'pending',
      dueDate: { lt: new Date() }
    }
  })
])`, 'prisma-optimization')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copiedCode === 'prisma-optimization' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Bad: N+1 query problem
const students = await prisma.students.findMany()
for (const student of students) {
  const payments = await prisma.payments.findMany({
    where: { studentId: student.id }
  })
  // Process payments...
}

// Good: Use include to join data
const students = await prisma.students.findMany({
  include: {
    payments: {
      where: { status: 'paid' },
      select: {
        amount: true,
        paidAt: true,
        month: true
      }
    },
    class: {
      select: { name: true }
    }
  }
})

// Good: Use aggregation
const paymentSummary = await prisma.payments.groupBy({
  by: ['studentId'],
  where: {
    status: 'paid',
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  _sum: { amount: true },
  _count: { id: true }
})

// Good: Use pagination with cursor
const students = await prisma.students.findMany({
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { name: 'asc' },
  where: {
    status: 'active',
    name: { contains: searchTerm, mode: 'insensitive' }
  }
})

// Good: Optimize for common dashboard queries
const dashboardData = await prisma.$transaction([
  // Get student count by class
  prisma.students.groupBy({
    by: ['classId'],
    where: { status: 'active' },
    _count: { id: true }
  }),
  
  // Get payment summary for current month
  prisma.payments.aggregate({
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { amount: true },
    _count: { id: true }
  }),
  
  // Get overdue payments count
  prisma.payments.count({
    where: {
      status: 'pending',
      dueDate: { lt: new Date() }
    }
  })
])`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Query Performance Analysis</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT s.name, c.name as class_name, COUNT(p.id) as payment_count
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'paid'
WHERE s.status = 'active'
GROUP BY s.id, s.name, c.name
ORDER BY s.name;

-- Find slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time,
  stddev_time,
  (total_time / sum(total_time) OVER()) * 100 as percentage
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Monitor table statistics
SELECT 
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'configuration' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Database Configuration Tuning</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">PostgreSQL Configuration</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# postgresql.conf optimization for school system

# Memory Settings
shared_buffers = 256MB                  # 25% of total RAM for small servers
effective_cache_size = 1GB              # Available OS cache
work_mem = 4MB                          # Per-query sort/hash memory
maintenance_work_mem = 64MB             # For VACUUM, CREATE INDEX

# Connection Settings
max_connections = 100                   # Adjust based on your needs
max_prepared_transactions = 0          # Disable if not using 2PC

# Write-Ahead Logging (WAL)
wal_buffers = 16MB
checkpoint_segments = 32                # For older PostgreSQL versions
checkpoint_completion_target = 0.9
wal_level = replica                     # For replication

# Query Planner
random_page_cost = 1.1                 # Lower for SSD storage
effective_io_concurrency = 200         # For SSD storage
seq_page_cost = 1.0                    # Default

# Autovacuum Settings (Critical for Performance)
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 20s               # More frequent than default
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1   # Vacuum when 10% of table changes
autovacuum_analyze_scale_factor = 0.05 # Analyze when 5% changes

# Statistics
track_activities = on
track_counts = on
track_io_timing = on                   # Enable I/O timing statistics
track_functions = all
log_statement_stats = off

# Logging for Performance Analysis
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_size = 100MB
log_min_duration_statement = 1000      # Log queries > 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Connection Pooling with PgBouncer</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# pgbouncer.ini configuration
[databases]
pondok_imam_syafii = host=localhost port=5432 dbname=pondok_imam_syafii

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool settings for school system
pool_mode = transaction              # Good for web applications
server_reset_query = DISCARD ALL    # Reset connection state
max_client_conn = 200               # Maximum client connections
default_pool_size = 25              # Connections per database
reserve_pool_size = 5               # Reserved connections
reserve_pool_timeout = 5            # Timeout for reserved pool

# Memory and timing
pkt_buf = 4096                      # Packet buffer size
listen_backlog = 128                # Connection backlog
server_round_robin = 1              # Round-robin server selection

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

# Application configuration
DATABASE_URL="postgresql://username:password@localhost:6432/pondok_imam_syafii"

# Docker compose for PgBouncer
version: '3.8'
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: pgbouncer
    environment:
      - DATABASES_HOST=postgres
      - DATABASES_PORT=5432
      - DATABASES_USER=postgres
      - DATABASES_PASSWORD=password
      - DATABASES_DBNAME=pondok_imam_syafii
      - POOL_MODE=transaction
      - SERVER_RESET_QUERY=DISCARD ALL
      - MAX_CLIENT_CONN=200
      - DEFAULT_POOL_SIZE=25
    ports:
      - "6432:6432"
    depends_on:
      - postgres`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Prisma Configuration Optimization</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pg_trgm, unaccent]
}

// lib/prisma.ts - Connection optimization
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
})

// Connection pool configuration via DATABASE_URL
DATABASE_URL="postgresql://username:password@localhost:5432/pondok_imam_syafii?connection_limit=20&pool_timeout=20"

// Alternative: Direct Prisma configuration
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' }
  ]
})

// Query optimization middleware
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  
  console.log(\`Query \${params.model}.\${params.action} took \${after - before}ms\`)
  
  return result
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">MySQL Configuration (Alternative)</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# my.cnf MySQL optimization
[mysqld]
# Memory settings
innodb_buffer_pool_size = 512M      # 70-80% of available RAM
innodb_log_buffer_size = 16M
key_buffer_size = 32M               # For MyISAM tables
query_cache_size = 32M              # Enable query cache
query_cache_type = ON

# Connection settings
max_connections = 150
max_connect_errors = 10000
connect_timeout = 60
wait_timeout = 300
interactive_timeout = 300

# InnoDB settings
innodb_file_per_table = 1
innodb_flush_log_at_trx_commit = 2  # Better performance, slight risk
innodb_log_file_size = 64M
innodb_flush_method = O_DIRECT

# Query optimization
tmp_table_size = 32M
max_heap_table_size = 32M
join_buffer_size = 2M
sort_buffer_size = 2M
read_buffer_size = 1M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1                 # Log queries > 1 second
log_queries_not_using_indexes = 1

# Binary logging (for replication)
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'monitoring' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Database Performance Monitoring</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Performance Monitoring Service</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/db-performance-monitor.ts
class DatabasePerformanceMonitor {
  private metricsBuffer: any[] = []
  private alertThresholds = {
    slowQueryThreshold: 1000,     // 1 second
    connectionThreshold: 80,      // 80% of max connections
    lockWaitThreshold: 5000,      // 5 seconds
    diskUsageThreshold: 85        // 85% disk usage
  }

  async collectMetrics(): Promise<any> {
    const [
      connectionStats,
      queryStats,
      lockStats,
      indexStats,
      diskStats
    ] = await Promise.all([
      this.getConnectionStats(),
      this.getQueryPerformanceStats(),
      this.getLockStats(),
      this.getIndexUsageStats(),
      this.getDiskUsageStats()
    ])

    const metrics = {
      timestamp: new Date(),
      connections: connectionStats,
      queries: queryStats,
      locks: lockStats,
      indexes: indexStats,
      disk: diskStats
    }

    // Store metrics for analysis
    await this.storeMetrics(metrics)
    
    // Check for alerts
    await this.checkAlerts(metrics)
    
    return metrics
  }

  private async getConnectionStats(): Promise<any> {
    const result = await prisma.$queryRaw\`
      SELECT 
        count(*) as current_connections,
        current_setting('max_connections')::int as max_connections,
        count(*) filter (where state = 'active') as active_connections,
        count(*) filter (where state = 'idle') as idle_connections,
        count(*) filter (where state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity 
      WHERE datname = current_database()
    \`

    return result[0]
  }

  private async getQueryPerformanceStats(): Promise<any> {
    const slowQueries = await prisma.$queryRaw\`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        stddev_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_time > \${this.alertThresholds.slowQueryThreshold}
      ORDER BY total_time DESC 
      LIMIT 10
    \`

    const topQueries = await prisma.$queryRaw\`
      SELECT 
        query,
        calls,
        total_time,
        mean_time
      FROM pg_stat_statements 
      ORDER BY total_time DESC 
      LIMIT 20
    \`

    return {
      slowQueries,
      topQueries
    }
  }

  private async getLockStats(): Promise<any> {
    const locks = await prisma.$queryRaw\`
      SELECT 
        mode,
        locktype,
        count(*) as count,
        max(now() - query_start) as max_wait_time
      FROM pg_locks l
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE not granted
      GROUP BY mode, locktype
    \`

    return locks
  }

  private async getIndexUsageStats(): Promise<any> {
    const indexStats = await prisma.$queryRaw\`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC
      LIMIT 20
    \`

    const unusedIndexes = await prisma.$queryRaw\`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      WHERE idx_scan = 0 
        AND schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC
    \`

    return {
      topIndexes: indexStats,
      unusedIndexes
    }
  }

  private async getDiskUsageStats(): Promise<any> {
    const tableStats = await prisma.$queryRaw\`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
        pg_total_relation_size(tablename::regclass) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(tablename::regclass) DESC
      LIMIT 10
    \`

    return {
      tables: tableStats
    }
  }

  private async storeMetrics(metrics: any): Promise<void> {
    try {
      await prisma.performanceMetric.create({
        data: {
          timestamp: metrics.timestamp,
          metricType: 'database_performance',
          data: metrics
        }
      })
    } catch (error) {
      console.error('Failed to store performance metrics:', error)
    }
  }

  private async checkAlerts(metrics: any): Promise<void> {
    const alerts = []

    // Check connection usage
    const connectionUsage = (metrics.connections.current_connections / metrics.connections.max_connections) * 100
    if (connectionUsage > this.alertThresholds.connectionThreshold) {
      alerts.push({
        type: 'high_connection_usage',
        severity: 'warning',
        message: \`Database connection usage at \${connectionUsage.toFixed(1)}%\`,
        value: connectionUsage
      })
    }

    // Check for slow queries
    if (metrics.queries.slowQueries.length > 0) {
      alerts.push({
        type: 'slow_queries_detected',
        severity: 'warning',
        message: \`\${metrics.queries.slowQueries.length} slow queries detected\`,
        queries: metrics.queries.slowQueries.slice(0, 3)
      })
    }

    // Check for locks
    if (metrics.locks.length > 0) {
      const maxWaitTime = Math.max(...metrics.locks.map(l => l.max_wait_time || 0))
      if (maxWaitTime > this.alertThresholds.lockWaitThreshold) {
        alerts.push({
          type: 'long_lock_waits',
          severity: 'error',
          message: \`Lock wait time: \${maxWaitTime}ms\`,
          locks: metrics.locks
        })
      }
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts)
    }
  }

  private async sendAlerts(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      console.error('Database Performance Alert:', alert)
      
      // Store alert in database
      await prisma.performanceAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          data: alert,
          resolved: false
        }
      })

      // Send notification (implement based on your notification system)
      // await notificationService.sendAlert(alert)
    }
  }

  async generatePerformanceReport(startDate: Date, endDate: Date): Promise<any> {
    const metrics = await prisma.performanceMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        metricType: 'database_performance'
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Analyze trends
    const report = {
      period: { startDate, endDate },
      summary: {
        totalMetrics: metrics.length,
        avgConnectionUsage: this.calculateAverage(metrics, 'connections.current_connections'),
        slowQueryCount: this.calculateSum(metrics, 'queries.slowQueries.length'),
        lockWaitEvents: this.calculateSum(metrics, 'locks.length')
      },
      trends: {
        connectionUsage: metrics.map(m => ({
          timestamp: m.timestamp,
          value: m.data.connections.current_connections
        })),
        queryPerformance: metrics.map(m => ({
          timestamp: m.timestamp,
          slowQueries: m.data.queries.slowQueries.length
        }))
      },
      recommendations: this.generateRecommendations(metrics)
    }

    return report
  }

  private generateRecommendations(metrics: any[]): string[] {
    const recommendations = []

    // Analyze patterns and generate recommendations
    const avgConnections = this.calculateAverage(metrics, 'connections.current_connections')
    if (avgConnections > 50) {
      recommendations.push('Consider implementing connection pooling to reduce database load')
    }

    const hasSlowQueries = metrics.some(m => m.data.queries.slowQueries.length > 0)
    if (hasSlowQueries) {
      recommendations.push('Review and optimize slow queries, consider adding indexes')
    }

    return recommendations
  }

  private calculateAverage(metrics: any[], path: string): number {
    const values = metrics.map(m => this.getNestedValue(m.data, path)).filter(v => v !== null)
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
  }

  private calculateSum(metrics: any[], path: string): number {
    const values = metrics.map(m => this.getNestedValue(m.data, path)).filter(v => v !== null)
    return values.reduce((sum, v) => sum + v, 0)
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj)
  }
}

export const dbPerformanceMonitor = new DatabasePerformanceMonitor()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Monitoring Dashboard API</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// api/admin/database/performance.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbPerformanceMonitor } from '@/lib/db-performance-monitor'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('range') || '1h'
  
  try {
    const metrics = await dbPerformanceMonitor.collectMetrics()
    
    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Cron job for periodic monitoring
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const metrics = await dbPerformanceMonitor.collectMetrics()
    
    return NextResponse.json({
      success: true,
      message: 'Performance monitoring completed',
      metricsCollected: true
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Essential Monitoring Queries</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Monitor database size
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor connection activity
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';

-- Check cache hit ratios
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Monitor autovacuum activity
SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  vacuum_count,
  autovacuum_count,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'scaling' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Database Scaling Strategies</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Read Replicas Setup</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# PostgreSQL Read Replica Configuration

# Master server configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
synchronous_commit = on

# Create replication user
CREATE USER replica_user REPLICATION LOGIN ENCRYPTED PASSWORD 'replica_password';

# Configure pg_hba.conf on master
host replication replica_user replica_server_ip/32 md5

# Slave server setup
pg_basebackup -h master_server_ip -D /var/lib/postgresql/data -U replica_user -P -W -R

# recovery.conf on slave (PostgreSQL < 12)
standby_mode = 'on'
primary_conninfo = 'host=master_server_ip port=5432 user=replica_user password=replica_password'
trigger_file = '/tmp/postgresql.trigger'

# Docker Compose for Master-Slave setup
version: '3.8'
services:
  postgres-master:
    image: postgres:15
    environment:
      - POSTGRES_DB=pondok_imam_syafii
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_REPLICATION_USER=replica_user
      - POSTGRES_REPLICATION_PASSWORD=replica_password
    volumes:
      - master_data:/var/lib/postgresql/data
      - ./postgresql-master.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf

  postgres-slave:
    image: postgres:15
    environment:
      - PGUSER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_MASTER_SERVICE=postgres-master
      - POSTGRES_REPLICATION_USER=replica_user
      - POSTGRES_REPLICATION_PASSWORD=replica_password
    volumes:
      - slave_data:/var/lib/postgresql/data
    depends_on:
      - postgres-master`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Application-Level Read/Write Splitting</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/database-router.ts
class DatabaseRouter {
  private masterClient: PrismaClient
  private replicaClient: PrismaClient

  constructor() {
    this.masterClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_MASTER_URL
        }
      }
    })

    this.replicaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_MASTER_URL
        }
      }
    })
  }

  // Route read operations to replica
  async findMany(model: string, args: any) {
    try {
      return await (this.replicaClient as any)[model].findMany(args)
    } catch (error) {
      console.warn('Replica query failed, falling back to master:', error)
      return await (this.masterClient as any)[model].findMany(args)
    }
  }

  async findUnique(model: string, args: any) {
    try {
      return await (this.replicaClient as any)[model].findUnique(args)
    } catch (error) {
      console.warn('Replica query failed, falling back to master:', error)
      return await (this.masterClient as any)[model].findUnique(args)
    }
  }

  async findFirst(model: string, args: any) {
    try {
      return await (this.replicaClient as any)[model].findFirst(args)
    } catch (error) {
      console.warn('Replica query failed, falling back to master:', error)
      return await (this.masterClient as any)[model].findFirst(args)
    }
  }

  // Route write operations to master
  async create(model: string, args: any) {
    return await (this.masterClient as any)[model].create(args)
  }

  async update(model: string, args: any) {
    return await (this.masterClient as any)[model].update(args)
  }

  async delete(model: string, args: any) {
    return await (this.masterClient as any)[model].delete(args)
  }

  async upsert(model: string, args: any) {
    return await (this.masterClient as any)[model].upsert(args)
  }

  // Transaction always goes to master
  async $transaction(queries: any[]) {
    return await this.masterClient.$transaction(queries)
  }

  // Health check for both databases
  async healthCheck() {
    const masterHealth = await this.checkConnection(this.masterClient, 'master')
    const replicaHealth = await this.checkConnection(this.replicaClient, 'replica')

    return {
      master: masterHealth,
      replica: replicaHealth
    }
  }

  private async checkConnection(client: PrismaClient, type: string) {
    try {
      await client.$queryRaw\`SELECT 1\`
      return { status: 'healthy', type }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        type, 
        error: error.message 
      }
    }
  }
}

// Service wrapper for easy usage
class DatabaseService {
  private router: DatabaseRouter

  constructor() {
    this.router = new DatabaseRouter()
  }

  // Student queries (read operations use replica)
  async getStudents(args: any) {
    return await this.router.findMany('student', args)
  }

  async getStudent(id: string) {
    return await this.router.findUnique('student', { where: { id } })
  }

  async createStudent(data: any) {
    return await this.router.create('student', { data })
  }

  async updateStudent(id: string, data: any) {
    return await this.router.update('student', { 
      where: { id }, 
      data 
    })
  }

  // Payment queries
  async getPaymentHistory(studentId: string) {
    return await this.router.findMany('payment', {
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async createPayment(data: any) {
    return await this.router.create('payment', { data })
  }

  // Dashboard queries (heavy read operations)
  async getDashboardStats() {
    // Use transaction on replica for consistent snapshot
    return await this.router.$transaction([
      this.router.findMany('student', {
        where: { status: 'active' },
        select: { _count: true }
      }),
      this.router.findMany('payment', {
        where: { 
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        select: { amount: true }
      })
    ])
  }

  async getHealthStatus() {
    return await this.router.healthCheck()
  }
}

export const db = new DatabaseService()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Database Partitioning</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`-- Partition payments table by month for better performance
CREATE TABLE payments_partitioned (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE payments_2024_01 PARTITION OF payments_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE payments_2024_02 PARTITION OF payments_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add indexes to each partition
CREATE INDEX idx_payments_2024_01_student_id ON payments_2024_01(student_id);
CREATE INDEX idx_payments_2024_01_status ON payments_2024_01(status);
CREATE INDEX idx_payments_2024_02_student_id ON payments_2024_02(student_id);
CREATE INDEX idx_payments_2024_02_status ON payments_2024_02(status);

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
    
    -- Add indexes
    EXECUTE format('CREATE INDEX idx_%I_student_id ON %I(student_id)', 
                   partition_name, partition_name);
    EXECUTE format('CREATE INDEX idx_%I_status ON %I(status)', 
                   partition_name, partition_name);
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic partition creation
SELECT cron.schedule('create-monthly-partitions', '0 0 1 * *', 
'SELECT create_monthly_partition(''payments_partitioned'', date_trunc(''month'', now() + interval ''1 month''));');`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Caching Strategies</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/cache-service.ts
import Redis from 'ioredis'

class CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  // Cache wrapper for database queries
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached) {
      return cached
    }

    // Execute query and cache result
    const result = await queryFn()
    await this.set(key, result, ttl)
    return result
  }
}

// Usage examples
export class CachedDatabaseService extends DatabaseService {
  private cache: CacheService

  constructor() {
    super()
    this.cache = new CacheService()
  }

  async getStudent(id: string) {
    return await this.cache.cacheQuery(
      \`student:\${id}\`,
      () => super.getStudent(id),
      1800 // 30 minutes
    )
  }

  async getStudentsByClass(classId: string) {
    return await this.cache.cacheQuery(
      \`students:class:\${classId}\`,
      () => super.getStudents({ where: { classId } }),
      600 // 10 minutes
    )
  }

  async getDashboardStats() {
    return await this.cache.cacheQuery(
      'dashboard:stats',
      () => super.getDashboardStats(),
      300 // 5 minutes
    )
  }

  async updateStudent(id: string, data: any) {
    const result = await super.updateStudent(id, data)
    
    // Invalidate related cache entries
    await this.cache.del(\`student:\${id}\`)
    await this.cache.invalidatePattern(\`students:class:*\`)
    await this.cache.del('dashboard:stats')
    
    return result
  }
}

export const cachedDb = new CachedDatabaseService()`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}