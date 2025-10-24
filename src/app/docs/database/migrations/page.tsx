'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  GitBranch, 
  Copy, 
  Check, 
  Terminal,
  Database,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  FileText,
  History,
  Shield,
  Zap,
  Package,
  Clock,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Code
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

export default function DatabaseMigrationsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basics');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'bash', title = '' }: { 
    code: string; 
    id: string; 
    language?: string;
    title?: string;
  }) => (
    <div className="relative bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
          {title}
        </div>
      )}
      <div className="relative p-4 overflow-x-auto">
        <button
          onClick={() => handleCopy(code, id)}
          className="absolute top-2 right-2 p-2 bg-gray-800 rounded hover:bg-gray-700 transition opacity-0 hover:opacity-100"
        >
          {copiedId === id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
        <pre className="text-sm font-mono">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
          <div className="container mx-auto px-6">
            <Link
              href="/docs"
              className="inline-flex items-center text-blue-100 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Docs
            </Link>
            <div className="flex items-center mb-4">
              <GitBranch className="h-12 w-12 mr-4" />
              <h1 className="text-4xl font-bold">Database Migrations Guide</h1>
            </div>
            <p className="text-xl text-blue-100">
              Manage database schema changes with Prisma Migrate
            </p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Migration Concepts */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <History className="h-8 w-8 text-blue-600 mr-3" />
              Understanding Migrations
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold mb-3">What are Migrations?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Migrations are a way to track and apply changes to your database schema over time.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Version control for database schema</li>
                  <li>• Team collaboration on schema changes</li>
                  <li>• Rollback capabilities</li>
                  <li>• Deployment automation</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold mb-3">Prisma Migration Flow</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>Modify schema.prisma file</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>Create migration with descriptive name</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>Review generated SQL</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <span>Apply migration to database</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Development vs Production:</strong> Use <code className="bg-yellow-100 px-1">migrate dev</code> for development 
                    (creates and applies migrations) and <code className="bg-yellow-100 px-1">migrate deploy</code> for production 
                    (only applies existing migrations).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Workflows */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('basics')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                    activeTab === 'basics'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Basic Workflow
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                    activeTab === 'team'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Team Collaboration
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                    activeTab === 'advanced'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Advanced Scenarios
                </button>
              </div>

              <div className="p-8">
                {/* Basic Workflow */}
                {activeTab === 'basics' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold mb-6">Basic Migration Workflow</h3>

                    {/* Creating First Migration */}
                    <div>
                      <h4 className="font-bold text-lg mb-4">Creating Your First Migration</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-600 mb-3">1. Modify your schema:</p>
                          <CodeBlock
                            code={`// schema.prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  category    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
}`}
                            id="schema-example"
                            language="prisma"
                            title="schema.prisma"
                          />
                        </div>

                        <div>
                          <p className="text-gray-600 mb-3">2. Create migration:</p>
                          <CodeBlock
                            code={`# Create and apply migration in development
npx prisma migrate dev --name add_product_model

# This will:
# 1. Generate SQL migration file
# 2. Apply migration to database
# 3. Generate Prisma Client`}
                            id="create-migration"
                          />
                        </div>

                        <div>
                          <p className="text-gray-600 mb-3">3. Review generated SQL:</p>
                          <CodeBlock
                            code={`-- prisma/migrations/20240101000000_add_product_model/migration.sql
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_category_idx" ON "Product"("category");`}
                            id="migration-sql"
                            language="sql"
                            title="migration.sql"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modifying Existing Tables */}
                    <div>
                      <h4 className="font-bold text-lg mb-4">Modifying Existing Tables</h4>
                      
                      <CodeBlock
                        code={`// Add new field to existing model
model Student {
  // ... existing fields
  phoneNumber String? // New field
  isActive    Boolean @default(true) // New field with default
}

# Create migration
npx prisma migrate dev --name add_student_phone_and_status`}
                        id="modify-table"
                        language="prisma"
                      />
                      
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> Adding nullable fields or fields with defaults is safe. 
                          Adding required fields to tables with existing data requires a data migration.
                        </p>
                      </div>
                    </div>

                    {/* Common Migration Commands */}
                    <div>
                      <h4 className="font-bold text-lg mb-4">Essential Migration Commands</h4>
                      
                      <div className="space-y-4">
                        <CodeBlock
                          code={`# Create and apply migration (development)
npx prisma migrate dev --name descriptive_name

# Apply migrations without creating (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (WARNING: data loss)
npx prisma migrate reset

# Create migration without applying
npx prisma migrate dev --create-only`}
                          id="migration-commands"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Collaboration */}
                {activeTab === 'team' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold mb-6">Team Collaboration Workflow</h3>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Working with Git</h4>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-semibold mb-3">Team Member A creates migration:</h5>
                          <CodeBlock
                            code={`# 1. Create feature branch
git checkout -b feature/add-products

# 2. Modify schema and create migration
npx prisma migrate dev --name add_product_model

# 3. Commit changes
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add product model and migration"

# 4. Push to remote
git push origin feature/add-products`}
                            id="team-create"
                          />
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-semibold mb-3">Team Member B applies migration:</h5>
                          <CodeBlock
                            code={`# 1. Pull changes
git pull origin main

# 2. Apply new migrations
npx prisma migrate dev

# 3. Generate updated client
npx prisma generate`}
                            id="team-apply"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Handling Migration Conflicts</h4>
                      
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800 mb-3">
                          When two team members create migrations simultaneously:
                        </p>
                        <CodeBlock
                          code={`# 1. Pull latest changes
git pull origin main

# 2. If migrations conflict, reset local migrations
npx prisma migrate reset --skip-seed

# 3. Reapply migrations in correct order
npx prisma migrate dev

# 4. Recreate your migration if needed
npx prisma migrate dev --name your_feature`}
                          id="resolve-conflicts"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Best Practices for Teams</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                          <h5 className="font-semibold text-green-700 mb-2">DO ✓</h5>
                          <ul className="space-y-1 text-sm">
                            <li>• Commit migrations with schema changes</li>
                            <li>• Use descriptive migration names</li>
                            <li>• Review SQL before committing</li>
                            <li>• Test migrations locally first</li>
                            <li>• Keep migrations small and focused</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                          <h5 className="font-semibold text-red-700 mb-2">DON\'T ✗</h5>
                          <ul className="space-y-1 text-sm">
                            <li>• Edit existing migration files</li>
                            <li>• Delete migration files manually</li>
                            <li>• Skip migrations when pulling</li>
                            <li>• Mix schema changes in one migration</li>
                            <li>• Use migrate dev in production</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Scenarios */}
                {activeTab === 'advanced' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold mb-6">Advanced Migration Scenarios</h3>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Data Migrations</h4>
                      
                      <p className="text-gray-600 mb-3">
                        When you need to transform existing data during migration:
                      </p>
                      
                      <CodeBlock
                        code={`// 1. Create migration with --create-only
npx prisma migrate dev --create-only --name add_full_name

// 2. Edit the generated SQL to include data migration
-- migration.sql
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;

-- Migrate existing data
UPDATE "User" SET "fullName" = CONCAT("firstName", ' ', "lastName");

-- Make column required after data migration
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;

// 3. Apply the migration
npx prisma migrate dev`}
                        id="data-migration"
                        language="sql"
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Custom Migration Scripts</h4>
                      
                      <CodeBlock
                        code={`// Create a custom migration script
// prisma/migrations/20240101000000_custom_migration/migration.sql

-- Complex migration logic
BEGIN;

-- Create temporary table
CREATE TABLE "TempData" AS 
SELECT * FROM "OldTable";

-- Transform data
UPDATE "TempData" SET ...;

-- Replace old table
DROP TABLE "OldTable";
ALTER TABLE "TempData" RENAME TO "OldTable";

COMMIT;`}
                        id="custom-migration"
                        language="sql"
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Seeding After Migration</h4>
                      
                      <CodeBlock
                        code={`// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if data exists
  const adminCount = await prisma.users.count({
    where: { role: 'ADMIN' }
  })

  if (adminCount === 0) {
    // Seed admin user
    await prisma.users.create({
      data: {
        username: 'admin',
        password: await hash('admin123'),
        role: 'ADMIN'
      }
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

// Run: npx prisma db seed`}
                        id="seed-script"
                        language="typescript"
                        title="prisma/seed.ts"
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-4">Rolling Back Migrations</h4>
                      
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-start mb-3">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 mr-2" />
                          <p className="text-sm text-orange-800">
                            <strong>Note:</strong> Prisma doesn\'t support automatic rollback. 
                            You need to create a new migration to revert changes.
                          </p>
                        </div>
                        
                        <CodeBlock
                          code={`# Option 1: Create reverse migration
npx prisma migrate dev --name revert_product_changes

# Option 2: Reset to specific point (data loss!)
# First, backup your data
pg_dump your_database > backup.sql

# Reset and replay migrations
npx prisma migrate reset

# Option 3: Manual rollback
psql -d your_database -f rollback_script.sql`}
                          id="rollback"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Production Deployment */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <PlayCircle className="h-8 w-8 text-green-600 mr-3" />
              Production Deployment Strategy
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">CI/CD Pipeline Integration</h3>
                
                <CodeBlock
                  code={`# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        env:
          DATABASE_URL: \${{ secrets.PROD_DATABASE_URL }}
        run: npx prisma migrate deploy
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to server
        run: |
          # Your deployment commands here`}
                  id="cicd-pipeline"
                  language="yaml"
                  title=".github/workflows/deploy.yml"
                />
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Zero-Downtime Migration Strategy</h3>
                
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                      1
                    </span>
                    <div>
                      <p className="font-semibold">Deploy migration-compatible code</p>
                      <p className="text-sm text-gray-600">
                        Ensure your application works with both old and new schema
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                      2
                    </span>
                    <div>
                      <p className="font-semibold">Run migrations</p>
                      <CodeBlock
                        code="npx prisma migrate deploy"
                        id="prod-migrate"
                      />
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-3">
                      3
                    </span>
                    <div>
                      <p className="font-semibold">Deploy final code version</p>
                      <p className="text-sm text-gray-600">
                        Deploy code that relies on new schema
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Migration History */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              Managing Migration History
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3">View Migration Status</h3>
                <CodeBlock
                  code={`# Check migration status
npx prisma migrate status

# Output example:
3 migrations found

Following migration have not yet been applied:
20240105_add_payment_table
20240106_add_indexes

To apply migrations, run:
npx prisma migrate deploy`}
                  id="migration-status"
                />
              </div>

              <div>
                <h3 className="font-bold mb-3">Migration Table</h3>
                <CodeBlock
                  code={`-- Query migration history
SELECT * FROM "_prisma_migrations"
ORDER BY "finished_at" DESC;

-- Results show:
-- id, checksum, migration_name, 
-- started_at, finished_at, logs`}
                  id="migration-table"
                  language="sql"
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-bold mb-3">Baseline Existing Database</h3>
              <p className="text-sm text-gray-600 mb-3">
                For existing databases without migration history:
              </p>
              <CodeBlock
                code={`# 1. Introspect existing database
npx prisma db pull

# 2. Create initial migration without applying
npx prisma migrate dev --name init --create-only

# 3. Mark migration as already applied
npx prisma migrate resolve --applied "20240101000000_init"

# 4. Continue with normal migration workflow`}
                id="baseline"
              />
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
              Migration Troubleshooting
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-red-400 pl-4">
                <h3 className="font-semibold mb-2">Migration failed to apply</h3>
                <CodeBlock
                  code={`# Check the error
npx prisma migrate status

# If migration partially applied, mark as rolled back
npx prisma migrate resolve --rolled-back "migration_name"

# Fix the issue and retry
npx prisma migrate dev`}
                  id="fix-failed"
                />
              </div>

              <div className="border-l-4 border-red-400 pl-4">
                <h3 className="font-semibold mb-2">Schema drift detected</h3>
                <CodeBlock
                  code={`# Database schema doesn't match migrations
# Option 1: Accept current database state
npx prisma db pull
npx prisma migrate dev --name fix_drift

# Option 2: Force database to match migrations
npx prisma migrate reset # WARNING: Data loss!`}
                  id="fix-drift"
                />
              </div>

              <div className="border-l-4 border-red-400 pl-4">
                <h3 className="font-semibold mb-2">Migration history corrupted</h3>
                <CodeBlock
                  code={`# Backup data first!
pg_dump your_database > backup.sql

# Reset migrations table
DELETE FROM "_prisma_migrations";

# Reapply all migrations
npx prisma migrate deploy`}
                  id="fix-history"
                  language="sql"
                />
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
              Migration Best Practices
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3">Development</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <span>Test migrations on copy of production data</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <span>Keep migrations small and focused</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <span>Review generated SQL before committing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <span>Use descriptive migration names</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-3">Production</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                    <span>Always backup before migrations</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                    <span>Use migrate deploy, never migrate dev</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                    <span>Plan rollback strategy</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                    <span>Monitor migration execution time</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-lg">
            <h3 className="font-bold text-2xl mb-4">Master Database Migrations! 🚀</h3>
            <p className="text-gray-700 mb-6">
              You now understand how to manage database schema changes. Continue learning:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/docs/database/backup" className="bg-white p-4 rounded-lg hover:shadow-lg transition">
                <h4 className="font-semibold mb-2">💾 Backup Strategies</h4>
                <p className="text-sm text-gray-600">Protect your data</p>
              </Link>
              <Link href="/docs/database/performance" className="bg-white p-4 rounded-lg hover:shadow-lg transition">
                <h4 className="font-semibold mb-2">⚡ Performance</h4>
                <p className="text-sm text-gray-600">Optimize queries</p>
              </Link>
              <Link href="/docs/ci-cd" className="bg-white p-4 rounded-lg hover:shadow-lg transition">
                <h4 className="font-semibold mb-2">🔄 CI/CD Integration</h4>
                <p className="text-sm text-gray-600">Automate deployments</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}