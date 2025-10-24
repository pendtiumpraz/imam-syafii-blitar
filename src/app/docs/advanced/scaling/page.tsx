'use client'

import React from 'react'
import { Layers, ArrowUpCircle, Globe, Server, Database, Cloud, Users, Shield, Zap, Activity } from 'lucide-react'

export default function AdvancedScalingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ArrowUpCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Advanced Scaling Strategies</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enterprise-grade scaling solutions, microservices architecture, and infrastructure optimization for growing Islamic boarding school management systems.
          </p>
        </div>

        {/* Horizontal Scaling */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold">Horizontal Scaling Architecture</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Server className="w-5 h-5" />
                Load Balancer Configuration
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# docker-compose.prod.yml
version: '3.8'

services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app-1
      - app-2
      - app-3
    networks:
      - app-network

  app-1:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
      - INSTANCE_ID=app-1
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - app-network

  app-2:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3001
      - INSTANCE_ID=app-2
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    deploy:
      replicas: 3
    networks:
      - app-network

  app-3:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3002
      - INSTANCE_ID=app-3
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    deploy:
      replicas: 3
    networks:
      - app-network

  redis-cluster:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes
    ports:
      - "7000-7005:7000-7005"
    volumes:
      - redis-data:/data
    deploy:
      replicas: 6
    networks:
      - app-network

  postgres-master:
    image: postgres:15
    environment:
      POSTGRES_DB: school_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: \${REPLICATION_PASSWORD}
    volumes:
      - postgres-master-data:/var/lib/postgresql/data
      - ./postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    ports:
      - "5432:5432"
    networks:
      - app-network

  postgres-replica-1:
    image: postgres:15
    environment:
      POSTGRES_DB: school_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      PGUSER: postgres
    volumes:
      - postgres-replica-1-data:/var/lib/postgresql/data
    command: |
      bash -c "
      until pg_isready -h postgres-master -p 5432; do sleep 1; done
      pg_basebackup -h postgres-master -D /var/lib/postgresql/data -U replicator -v -P -W
      echo 'standby_mode = \\'on\\'' >> /var/lib/postgresql/data/recovery.conf
      echo 'primary_conninfo = \\'host=postgres-master port=5432 user=replicator\\'' >> /var/lib/postgresql/data/recovery.conf
      postgres
      "
    depends_on:
      - postgres-master
    networks:
      - app-network

volumes:
  postgres-master-data:
  postgres-replica-1-data:
  redis-data:

networks:
  app-network:
    driver: overlay`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                NGINX Load Balancer Configuration
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app_servers {
        # Weighted round-robin with health checks
        server app-1:3000 weight=3 max_fails=3 fail_timeout=30s;
        server app-2:3001 weight=3 max_fails=3 fail_timeout=30s;
        server app-3:3002 weight=3 max_fails=3 fail_timeout=30s;
        
        # Sticky sessions for stateful operations
        ip_hash;
    }

    upstream api_servers {
        # Least connections for API endpoints
        least_conn;
        server app-1:3000;
        server app-2:3001;
        server app-3:3002;
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=200r/m;

    # Connection limiting
    limit_conn_zone \$binary_remote_addr zone=conn_limit_per_ip:10m;

    server {
        listen 80;
        server_name school.example.com;
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name school.example.com;

        # SSL Configuration
        ssl_certificate /etc/ssl/certs/school.crt;
        ssl_certificate_key /etc/ssl/certs/school.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Connection limits
        limit_conn conn_limit_per_ip 50;

        # Static files with caching
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
            
            # Try local files first, then proxy to app
            try_files \$uri @app_servers;
        }

        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_servers;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Timeout settings
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 30s;
            
            # Buffer settings
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        # Authentication endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=3 nodelay;
            
            proxy_pass http://api_servers;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # WebSocket support for real-time features
        location /socket.io/ {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Main application
        location / {
            limit_req zone=general burst=50 nodelay;
            
            proxy_pass http://app_servers;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Health check
            proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Microservices Architecture */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-semibold">Microservices Architecture</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Service Decomposition Strategy
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/services/auth/auth-service.ts
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

export class AuthService {
  private prisma: PrismaClient
  private app: express.Application

  constructor() {
    this.prisma = new PrismaClient()
    this.app = express()
    this.setupRoutes()
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'auth', timestamp: new Date() })
    })

    // Authentication endpoints
    this.app.post('/login', this.login.bind(this))
    this.app.post('/register', this.register.bind(this))
    this.app.post('/refresh', this.refreshToken.bind(this))
    this.app.post('/logout', this.logout.bind(this))
    this.app.post('/verify-2fa', this.verify2FA.bind(this))
    
    // Token validation for other services
    this.app.post('/validate', this.validateToken.bind(this))
  }

  async login(req: express.Request, res: express.Response) {
    try {
      const { email, password } = req.body
      
      // Rate limiting check
      await this.checkRateLimit(req.ip, 'login')
      
      const user = await this.prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          twoFactorEnabled: true,
          status: true
        }
      })

      if (!user || !await bcrypt.compare(password, user.password)) {
        await this.recordFailedLogin(req.ip, email)
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Account inactive' })
      }

      // Check if 2FA is required
      if (user.twoFactorEnabled) {
        const tempToken = this.generateTempToken(user.id)
        return res.json({ requiresTwoFactor: true, tempToken })
      }

      const tokens = this.generateTokens(user)
      await this.recordSuccessfulLogin(user.id, req.ip)

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private generateTokens(user: any) {
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  start(port: number = 3001) {
    this.app.listen(port, () => {
      console.log(\`Auth service running on port \${port}\`)
    })
  }
}

// Start the service
if (require.main === module) {
  const authService = new AuthService()
  authService.start()
}`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Student Management Service
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/services/student/student-service.ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { MessageQueue } from '../shared/message-queue'
import { CacheManager } from '../shared/cache-manager'

export class StudentService {
  private prisma: PrismaClient
  private app: express.Application
  private messageQueue: MessageQueue
  private cache: CacheManager

  constructor() {
    this.prisma = new PrismaClient()
    this.app = express()
    this.messageQueue = new MessageQueue('student-events')
    this.cache = new CacheManager('student-cache')
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    this.app.use(express.json())
    this.app.use(this.authMiddleware.bind(this))
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'student', timestamp: new Date() })
    })

    // Student CRUD operations
    this.app.get('/students', this.getStudents.bind(this))
    this.app.get('/students/:id', this.getStudent.bind(this))
    this.app.post('/students', this.createStudent.bind(this))
    this.app.put('/students/:id', this.updateStudent.bind(this))
    this.app.delete('/students/:id', this.deleteStudent.bind(this))
    
    // Bulk operations
    this.app.post('/students/bulk', this.bulkCreateStudents.bind(this))
    this.app.put('/students/bulk', this.bulkUpdateStudents.bind(this))
    
    // Advanced queries
    this.app.get('/students/search', this.searchStudents.bind(this))
    this.app.get('/students/class/:classId', this.getStudentsByClass.bind(this))
    this.app.get('/students/graduation/:year', this.getGraduationList.bind(this))
  }

  async getStudents(req: express.Request, res: express.Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        class: classId,
        status,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query

      const cacheKey = \`students:\${JSON.stringify(req.query)}\`
      
      // Try cache first
      let result = await this.cache.get(cacheKey)
      if (result) {
        return res.json(result)
      }

      const offset = (Number(page) - 1) * Number(limit)
      
      const where: any = {}
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { studentId: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
      
      if (classId) where.classId = classId
      if (status) where.status = status

      const [students, totalCount] = await Promise.all([
        this.prisma.students.findMany({
          where,
          include: {
            class: {
              select: { id: true, name: true, grade: true }
            },
            _count: {
              select: { payments: true }
            }
          },
          orderBy: { [sortBy as string]: sortOrder },
          skip: offset,
          take: Number(limit)
        }),
        this.prisma.students.count({ where })
      ])

      result = {
        data: students,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          hasNextPage: offset + Number(limit) < totalCount,
          hasPrevPage: Number(page) > 1
        }
      }

      // Cache result
      await this.cache.set(cacheKey, result, 300) // 5 minutes
      
      res.json(result)
    } catch (error) {
      console.error('Get students error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async createStudent(req: express.Request, res: express.Response) {
    try {
      const studentData = req.body
      
      // Validate required fields
      const requiredFields = ['name', 'email', 'studentId', 'classId']
      const missingFields = requiredFields.filter(field => !studentData[field])
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missingFields
        })
      }

      // Check for duplicate student ID
      const existingStudent = await this.prisma.students.findUnique({
        where: { studentId: studentData.studentId }
      })

      if (existingStudent) {
        return res.status(409).json({
          error: 'Student ID already exists'
        })
      }

      const student = await this.prisma.students.create({
        data: studentData,
        include: {
          class: {
            select: { id: true, name: true, grade: true }
          }
        }
      })

      // Publish event for other services
      await this.messageQueue.publish('student.created', {
        studentId: student.id,
        studentData: student,
        timestamp: new Date()
      })

      // Invalidate related caches
      await this.cache.invalidatePattern('students:*')
      
      res.status(201).json(student)
    } catch (error) {
      console.error('Create student error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async authMiddleware(
    req: express.Request, 
    res: express.Response, 
    next: express.NextFunction
  ) {
    // Skip auth for health check
    if (req.path === '/health') {
      return next()
    }

    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    try {
      // Validate token with auth service
      const response = await fetch('http://auth-service:3001/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const userData = await response.json()
      req.user = userData
      next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      res.status(500).json({ error: 'Authentication service error' })
    }
  }

  private setupEventHandlers() {
    // Handle payment events
    this.messageQueue.subscribe('payment.created', async (data) => {
      // Update student payment status
      await this.updateStudentPaymentStatus(data.studentId)
    })

    // Handle class updates
    this.messageQueue.subscribe('class.updated', async (data) => {
      // Invalidate student cache for affected class
      await this.cache.invalidatePattern(\`students:*class=\${data.classId}*\`)
    })
  }

  start(port: number = 3002) {
    this.app.listen(port, () => {
      console.log(\`Student service running on port \${port}\`)
    })
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Auto-scaling Configuration */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-semibold">Auto-scaling Configuration</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Kubernetes Auto-scaling
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: school-app
  labels:
    app: school-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: school-app
  template:
    metadata:
      labels:
        app: school-app
    spec:
      containers:
      - name: school-app
        image: school-management:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: school-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: school-secrets
              key: redis-url
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: school-app-service
spec:
  selector:
    app: school-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: school-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: school-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min

---
apiVersion: autoscaling/v2
kind: VerticalPodAutoscaler
metadata:
  name: school-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: school-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: school-app
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
      controlledResources: ["cpu", "memory"]`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Custom Metrics Scaling
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`// src/lib/scaling/custom-metrics.ts
import { PrometheusRegistry, Counter, Histogram, Gauge } from 'prom-client'

export class CustomMetricsCollector {
  private registry: PrometheusRegistry
  private httpRequests: Counter<string>
  private responseTime: Histogram<string>
  private activeUsers: Gauge<string>
  private databaseConnections: Gauge<string>
  private queueDepth: Gauge<string>

  constructor() {
    this.registry = new PrometheusRegistry()
    
    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status_code', 'endpoint'],
      registers: [this.registry]
    })

    this.responseTime = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry]
    })

    this.activeUsers = new Gauge({
      name: 'active_users_total',
      help: 'Number of active users',
      registers: [this.registry]
    })

    this.databaseConnections = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry]
    })

    this.queueDepth = new Gauge({
      name: 'message_queue_depth',
      help: 'Number of messages in queue',
      labelNames: ['queue_name'],
      registers: [this.registry]
    })
  }

  // Middleware to collect HTTP metrics
  collectHttpMetrics() {
    return (req: any, res: any, next: any) => {
      const start = Date.now()
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000
        
        this.httpRequests.inc({
          method: req.method,
          status_code: res.statusCode,
          endpoint: this.normalizeEndpoint(req.path)
        })

        this.responseTime.observe({
          method: req.method,
          endpoint: this.normalizeEndpoint(req.path)
        }, duration)
      })

      next()
    }
  }

  // Business-specific metrics
  async collectBusinessMetrics() {
    // Active users (last 5 minutes)
    const activeUsersCount = await this.getActiveUsersCount()
    this.activeUsers.set(activeUsersCount)

    // Database connection pool
    const dbConnections = await this.getDatabaseConnectionsCount()
    this.databaseConnections.set(dbConnections)

    // Message queue depths
    const queueDepths = await this.getQueueDepths()
    for (const [queueName, depth] of Object.entries(queueDepths)) {
      this.queueDepth.set({ queue_name: queueName }, depth as number)
    }
  }

  // Custom scaling decision logic
  async getScalingDecision(): Promise<ScalingDecision> {
    const metrics = await this.getLatestMetrics()
    
    let scaleUp = false
    let scaleDown = false
    const reasons: string[] = []

    // CPU-based scaling
    if (metrics.cpuUtilization > 70) {
      scaleUp = true
      reasons.push('High CPU utilization')
    }

    // Memory-based scaling
    if (metrics.memoryUtilization > 80) {
      scaleUp = true
      reasons.push('High memory utilization')
    }

    // Response time based scaling
    if (metrics.avgResponseTime > 1000) {
      scaleUp = true
      reasons.push('High response time')
    }

    // Queue depth based scaling
    if (metrics.queueDepth > 1000) {
      scaleUp = true
      reasons.push('High queue depth')
    }

    // Active users based scaling
    const expectedUsers = await this.predictUserLoad()
    if (metrics.activeUsers > expectedUsers * 0.8) {
      scaleUp = true
      reasons.push('High user load predicted')
    }

    // Scale down conditions
    if (!scaleUp) {
      if (metrics.cpuUtilization < 20 && 
          metrics.memoryUtilization < 30 && 
          metrics.avgResponseTime < 200 &&
          metrics.activeUsers < expectedUsers * 0.3) {
        scaleDown = true
        reasons.push('Low resource utilization')
      }
    }

    return {
      action: scaleUp ? 'SCALE_UP' : scaleDown ? 'SCALE_DOWN' : 'MAINTAIN',
      reasons,
      recommendedReplicas: this.calculateOptimalReplicas(metrics),
      confidence: this.calculateDecisionConfidence(metrics)
    }
  }

  private normalizeEndpoint(path: string): string {
    // Replace IDs with placeholders for consistent grouping
    return path
      .replace(/\\/\\d+/g, '/:id')
      .replace(/\\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/:uuid')
  }

  private async getActiveUsersCount(): Promise<number> {
    // Implementation to count active users from Redis/Database
    return 0
  }

  private async getDatabaseConnectionsCount(): Promise<number> {
    // Implementation to get active DB connections
    return 0
  }

  private async getQueueDepths(): Promise<Record<string, number>> {
    // Implementation to get message queue depths
    return {}
  }

  private async predictUserLoad(): Promise<number> {
    // Implementation for user load prediction based on historical data
    return 0
  }

  private calculateOptimalReplicas(metrics: any): number {
    // Algorithm to calculate optimal number of replicas
    const baseReplicas = 3
    const cpuFactor = Math.max(1, metrics.cpuUtilization / 70)
    const memoryFactor = Math.max(1, metrics.memoryUtilization / 80)
    const userFactor = Math.max(1, metrics.activeUsers / 1000)
    
    const recommended = Math.ceil(baseReplicas * Math.max(cpuFactor, memoryFactor, userFactor))
    
    return Math.min(Math.max(recommended, 3), 20) // Between 3-20 replicas
  }

  private calculateDecisionConfidence(metrics: any): number {
    // Calculate confidence score based on data quality and consistency
    return 0.85
  }

  getMetrics(): string {
    return this.registry.metrics()
  }
}

interface ScalingDecision {
  action: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN'
  reasons: string[]
  recommendedReplicas: number
  confidence: number
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Database Scaling */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-semibold">Database Scaling Strategies</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Read Replicas & Sharding</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# Read replica configuration
MASTER_DB_URL=postgresql://user:pass@master:5432/db
REPLICA_DB_URLS=postgresql://user:pass@replica1:5432/db,postgresql://user:pass@replica2:5432/db

# Sharding configuration
SHARD_1_URL=postgresql://user:pass@shard1:5432/db
SHARD_2_URL=postgresql://user:pass@shard2:5432/db
SHARD_3_URL=postgresql://user:pass@shard3:5432/db

# Connection pooling
DB_POOL_SIZE=20
DB_POOL_MAX=100
DB_POOL_IDLE_TIMEOUT=30000`}</code>
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Scaling Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current Load:</span>
                  <span className="text-green-600 font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-scaling Status:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Replicas:</span>
                  <span className="text-blue-600 font-medium">5/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Queue Processing:</span>
                  <span className="text-green-600 font-medium">Normal</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="text-green-600 font-medium">125ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Throughput:</span>
                  <span className="text-green-600 font-medium">2.3k req/s</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}