'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  Search, 
  Copy, 
  Check, 
  Terminal,
  Database,
  Globe,
  Server,
  Wifi,
  Shield,
  Package,
  Code,
  Zap,
  RefreshCw,
  XCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Bug,
  FileText,
  Monitor,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  Settings
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

export default function TroubleshootingPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'bash' }: { 
    code: string; 
    id: string; 
    language?: string;
  }) => (
    <div className="relative bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto group">
      <button
        onClick={() => handleCopy(code, id)}
        className="absolute top-2 right-2 p-2 bg-gray-800 rounded hover:bg-gray-700 transition opacity-0 group-hover:opacity-100"
      >
        {copiedId === id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
      <pre className="text-sm font-mono">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );

  const categories = [
    { id: 'all', name: 'All Issues', icon: AlertCircle },
    { id: 'build', name: 'Build & Compilation', icon: Package },
    { id: 'runtime', name: 'Runtime Errors', icon: XCircle },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'auth', name: 'Authentication', icon: Shield },
    { id: 'api', name: 'API & Network', icon: Globe },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'deployment', name: 'Deployment', icon: Server }
  ];

  const issues = [
    {
      id: 'build-1',
      category: 'build',
      severity: 'high',
      title: 'Module not found: Can\'t resolve',
      description: 'Dependencies are missing or incorrectly installed',
      symptoms: [
        'Error: Cannot find module \'@prisma/client\'',
        'Module not found: Can\'t resolve \'component\'',
        'Build fails with missing dependencies'
      ],
      solutions: [
        {
          title: 'Reinstall dependencies',
          code: `# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with specific clearing
npm cache clean --force
npm install`
        },
        {
          title: 'Generate Prisma Client',
          code: `# If @prisma/client is missing
npx prisma generate`
        },
        {
          title: 'Check import paths',
          code: `// Incorrect
import Component from 'components/Component'

// Correct (with @ alias)
import Component from '@/components/Component'`
        }
      ]
    },
    {
      id: 'build-2',
      category: 'build',
      severity: 'high',
      title: 'TypeScript errors during build',
      description: 'Type errors preventing successful compilation',
      symptoms: [
        'Type error: Property does not exist',
        'Cannot find name \'X\'',
        'Type \'undefined\' is not assignable'
      ],
      solutions: [
        {
          title: 'Check TypeScript errors',
          code: `# Run type check
npx tsc --noEmit

# Fix specific file
npx tsc --noEmit --skipLibCheck`
        },
        {
          title: 'Update type definitions',
          code: `# Install missing types
npm install --save-dev @types/node @types/react

# Update tsconfig.json
{
  "compilerOptions": {
    "strict": false,  // Temporarily disable strict mode
    "skipLibCheck": true
  }
}`
        }
      ]
    },
    {
      id: 'runtime-1',
      category: 'runtime',
      severity: 'critical',
      title: 'Application crashes on startup',
      description: 'App fails to start or crashes immediately',
      symptoms: [
        'Port already in use',
        'EADDRINUSE error',
        'Application exits with code 1'
      ],
      solutions: [
        {
          title: 'Kill process using port',
          code: `# Find process using port 3030
lsof -i :3030  # Mac/Linux
netstat -ano | findstr :3030  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows`
        },
        {
          title: 'Change port',
          code: `# Run on different port
npm run dev -- -p 3031

# Or update package.json
"scripts": {
  "dev": "next dev -p 3031"
}`
        }
      ]
    },
    {
      id: 'database-1',
      category: 'database',
      severity: 'critical',
      title: 'P1001: Can\'t reach database server',
      description: 'Cannot connect to PostgreSQL database',
      symptoms: [
        'P1001: Can\'t reach database server',
        'Connection timeout',
        'ECONNREFUSED'
      ],
      solutions: [
        {
          title: 'Check database status',
          code: `# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # Mac
pg_ctl status  # Windows

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # Mac`
        },
        {
          title: 'Verify DATABASE_URL',
          code: `# Check format
postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Local example
DATABASE_URL="postgresql://postgres:password@localhost:5432/imam_syafii_db"

# Supabase example
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"`
        },
        {
          title: 'Test connection',
          code: `# Test with psql
psql "postgresql://user:password@localhost:5432/dbname"

# Test with Prisma
npx prisma db pull`
        }
      ]
    },
    {
      id: 'database-2',
      category: 'database',
      severity: 'high',
      title: 'P2002: Unique constraint failed',
      description: 'Attempting to insert duplicate value in unique field',
      symptoms: [
        'Unique constraint failed on the fields: (`email`)',
        'P2002 error during user creation',
        'Duplicate key value violates unique constraint'
      ],
      solutions: [
        {
          title: 'Check for existing data',
          code: `// Before creating, check if exists
const existingUser = await prisma.users.findUnique({
  where: { email: userData.email }
});

if (existingUser) {
  return { error: 'User already exists' };
}`
        },
        {
          title: 'Use upsert instead',
          code: `// Create or update
const user = await prisma.users.upsert({
  where: { email: userData.email },
  update: { name: userData.name },
  create: userData
});`
        }
      ]
    },
    {
      id: 'auth-1',
      category: 'auth',
      severity: 'high',
      title: 'NEXTAUTH_URL missing or incorrect',
      description: 'NextAuth configuration error',
      symptoms: [
        'Callback URL mismatch',
        'Redirect URI error',
        'Sign in not working'
      ],
      solutions: [
        {
          title: 'Set correct NEXTAUTH_URL',
          code: `# Development
NEXTAUTH_URL="http://localhost:3030"

# Production (no trailing slash!)
NEXTAUTH_URL="https://yourdomain.com"

# Vercel (automatic)
# NEXTAUTH_URL is set automatically`
        },
        {
          title: 'Generate NEXTAUTH_SECRET',
          code: `# Generate secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="your-generated-secret"`
        }
      ]
    },
    {
      id: 'auth-2',
      category: 'auth',
      severity: 'medium',
      title: 'Session not persisting',
      description: 'User gets logged out unexpectedly',
      symptoms: [
        'Session expires immediately',
        'Cookies not being set',
        'Authentication state lost on refresh'
      ],
      solutions: [
        {
          title: 'Check session configuration',
          code: `// pages/api/auth/[...nextauth].ts
export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
})`
        }
      ]
    },
    {
      id: 'api-1',
      category: 'api',
      severity: 'medium',
      title: 'CORS errors in API calls',
      description: 'Cross-Origin Resource Sharing blocked',
      symptoms: [
        'Access to fetch blocked by CORS policy',
        'No \'Access-Control-Allow-Origin\' header',
        'Preflight request failed'
      ],
      solutions: [
        {
          title: 'Configure CORS in API routes',
          code: `// pages/api/your-endpoint.ts
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Your API logic
}`
        },
        {
          title: 'Use Next.js middleware',
          code: `// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  
  return response
}`
        }
      ]
    },
    {
      id: 'api-2',
      category: 'api',
      severity: 'high',
      title: 'API routes returning 404',
      description: 'API endpoints not found or not working',
      symptoms: [
        '404 Not Found for API routes',
        'API routes work locally but not in production',
        'Incorrect API path'
      ],
      solutions: [
        {
          title: 'Check API route structure',
          code: `// Correct App Router API structure
// app/api/users/route.ts
export async function GET(request: Request) {
  // Handle GET request
}

export async function POST(request: Request) {
  // Handle POST request
}`
        },
        {
          title: 'Verify API call paths',
          code: `// Correct API calls
fetch('/api/users')  // Not '/api/users/'
fetch('/api/users/123')  // Dynamic routes

// With base URL for production
const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
fetch(\`\${baseUrl}/api/users\`)`
        }
      ]
    },
    {
      id: 'performance-1',
      category: 'performance',
      severity: 'medium',
      title: 'Slow page load times',
      description: 'Application takes too long to load',
      symptoms: [
        'High Time to First Byte (TTFB)',
        'Large bundle size',
        'Slow initial page load'
      ],
      solutions: [
        {
          title: 'Analyze bundle size',
          code: `# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Configure in next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build`
        },
        {
          title: 'Implement code splitting',
          code: `// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <p>Loading...</p>,
    ssr: false 
  }
)`
        }
      ]
    },
    {
      id: 'performance-2',
      category: 'performance',
      severity: 'medium',
      title: 'High memory usage',
      description: 'Application consuming too much memory',
      symptoms: [
        'Node.js heap out of memory',
        'Server crashes with memory errors',
        'Gradual performance degradation'
      ],
      solutions: [
        {
          title: 'Increase Node memory limit',
          code: `# Increase memory for build
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or in package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}`
        },
        {
          title: 'Fix memory leaks',
          code: `// Cleanup subscriptions and timers
useEffect(() => {
  const timer = setTimeout(() => {}, 1000)
  const subscription = subscribe()
  
  return () => {
    clearTimeout(timer)
    subscription.unsubscribe()
  }
}, [])`
        }
      ]
    },
    {
      id: 'deployment-1',
      category: 'deployment',
      severity: 'high',
      title: 'Vercel deployment fails',
      description: 'Build fails on Vercel but works locally',
      symptoms: [
        'Build error on Vercel',
        'Environment variables not working',
        'Different behavior in production'
      ],
      solutions: [
        {
          title: 'Check build logs',
          code: `# View Vercel logs
vercel logs

# Or in Vercel dashboard
# Project → Functions → View Logs`
        },
        {
          title: 'Verify environment variables',
          code: `# List Vercel env vars
vercel env ls

# Pull to local
vercel env pull .env.local

# Add missing variable
vercel env add DATABASE_URL`
        },
        {
          title: 'Clear cache and redeploy',
          code: `# Force new deployment
vercel --force

# Or in dashboard:
# Settings → Functions → Clear Cache`
        }
      ]
    },
    {
      id: 'deployment-2',
      category: 'deployment',
      severity: 'medium',
      title: 'Static generation timeout',
      description: 'Pages timing out during build',
      symptoms: [
        'Generating static pages (0/100) timeout',
        'Build exceeds time limit',
        'ISR pages not updating'
      ],
      solutions: [
        {
          title: 'Increase timeout or use ISR',
          code: `// Use ISR instead of SSG
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 60 // Revalidate every 60 seconds
  }
}

// Or use on-demand revalidation
export default async function handler(req, res) {
  await res.revalidate('/path-to-revalidate')
  return res.json({ revalidated: true })
}`
        }
      ]
    }
  ];

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
          <div className="container mx-auto px-6">
            <Link
              href="/docs"
              className="inline-flex items-center text-red-100 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Docs
            </Link>
            <div className="flex items-center mb-4">
              <AlertCircle className="h-12 w-12 mr-4" />
              <h1 className="text-4xl font-bold">Troubleshooting Guide</h1>
            </div>
            <p className="text-xl text-red-100">
              Quick solutions to common issues with Pondok Imam Syafi\'i system
            </p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Quick Help Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <HelpCircle className="h-6 w-6 text-blue-600 mr-2" />
              Need Quick Help?
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4">
              <Link 
                href="/docs/troubleshooting/errors"
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <XCircle className="h-8 w-8 text-red-500 mb-2" />
                <h3 className="font-semibold">Error Codes</h3>
                <p className="text-sm text-gray-600">Lookup error codes</p>
              </Link>
              
              <Link 
                href="/docs/troubleshooting/debug"
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <Bug className="h-8 w-8 text-purple-500 mb-2" />
                <h3 className="font-semibold">Debug Guide</h3>
                <p className="text-sm text-gray-600">Debugging techniques</p>
              </Link>
              
              <Link 
                href="/docs/troubleshooting/performance"
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                <h3 className="font-semibold">Performance</h3>
                <p className="text-sm text-gray-600">Fix slow performance</p>
              </Link>
              
              <a 
                href="https://github.com/pendtiumpraz/imam-syafii-blitar/issues"
                target="_blank"
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
                <h3 className="font-semibold">Report Issue</h3>
                <p className="text-sm text-gray-600">GitHub Issues</p>
              </a>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for issues, errors, or symptoms..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-6">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedSection(expandedSection === issue.id ? null : issue.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          {categories.find(c => c.id === issue.category)?.name}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{issue.title}</h3>
                      <p className="text-gray-600">{issue.description}</p>
                      
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Common symptoms:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {issue.symptoms.slice(0, 2).map((symptom, idx) => (
                            <li key={idx}>{symptom}</li>
                          ))}
                          {issue.symptoms.length > 2 && (
                            <li className="text-blue-600">
                              +{issue.symptoms.length - 2} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {expandedSection === issue.id ? (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedSection === issue.id && (
                  <div className="border-t px-6 py-6 bg-gray-50">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold mb-3 flex items-center">
                          <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                          All Symptoms
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {issue.symptoms.map((symptom, idx) => (
                            <li key={idx}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-bold mb-3 flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          Solutions
                        </h4>
                        <div className="space-y-4">
                          {issue.solutions.map((solution, idx) => (
                            <div key={idx}>
                              <h5 className="font-semibold mb-2">{solution.title}</h5>
                              <CodeBlock
                                code={solution.code}
                                id={`${issue.id}-solution-${idx}`}
                                language={solution.code.includes('//') ? 'javascript' : 'bash'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredIssues.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No issues found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          {/* Additional Resources */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Still Need Help?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3">Community Support</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://github.com/pendtiumpraz/imam-syafii-blitar/discussions" 
                       className="text-blue-600 hover:underline flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      GitHub Discussions
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/pendtiumpraz/imam-syafii-blitar/issues" 
                       className="text-blue-600 hover:underline flex items-center">
                      <Bug className="h-4 w-4 mr-2" />
                      Report a Bug
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">Documentation</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/docs/api" className="text-blue-600 hover:underline flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      API Reference
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/deployment" className="text-blue-600 hover:underline flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Deployment Guides
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}