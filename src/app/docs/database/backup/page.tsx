'use client'

import React, { useState } from 'react'
import { Database, Shield, Clock, Download, Upload, AlertTriangle, CheckCircle, Code, Copy, Check, Server, Settings } from 'lucide-react'

export default function DatabaseBackupPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Database },
    { id: 'automated', label: 'Automated Backups', icon: Clock },
    { id: 'manual', label: 'Manual Backups', icon: Download },
    { id: 'restore', label: 'Restore Procedures', icon: Upload },
    { id: 'monitoring', label: 'Monitoring', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Database className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold">Database Backup Procedures</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Comprehensive database backup and restore strategies for PostgreSQL and MySQL
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
                  ? 'bg-blue-500 text-white'
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
              <h2 className="text-2xl font-bold mb-4">Backup Strategy Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-2">Automated Daily Backups</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Full database backup</li>
                    <li>• Compressed storage</li>
                    <li>• Rotation policy</li>
                    <li>• Cloud storage sync</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Download className="w-8 h-8 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-2">Manual Backups</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• On-demand backups</li>
                    <li>• Pre-deployment backups</li>
                    <li>• Partial data exports</li>
                    <li>• Schema-only backups</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-2">Security & Encryption</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Encrypted backups</li>
                    <li>• Secure storage</li>
                    <li>• Access controls</li>
                    <li>• Audit logging</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Backup Types & Schedules</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Backup Type</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Schedule</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Retention</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Storage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Full Daily</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Every day at 2:00 AM</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">30 days</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Local + Cloud</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Weekly Archive</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Every Sunday at 1:00 AM</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">12 weeks</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Cloud Storage</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Monthly Archive</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">1st of each month</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">12 months</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Long-term Storage</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Pre-deployment</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Manual trigger</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Until next deployment</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Local</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Critical Backup Locations</h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Student records and academic data</li>
                    <li>• Payment transactions and financial records</li>
                    <li>• User authentication and access logs</li>
                    <li>• System configuration and settings</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'automated' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Automated Backup Setup</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">PostgreSQL Automated Backup Service</h3>
                    <button
                      onClick={() => copyToClipboard(`#!/bin/bash
# PostgreSQL Automated Backup Script
# Save as: /opt/backup/postgres-backup.sh

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="pondok_imam_syafii"
DB_USER="backup_user"
BACKUP_DIR="/opt/backups/postgres"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${DATE}.sql.gz"
LOG_FILE="/var/log/postgres-backup.log"

# Create backup directory if it doesn't exist
mkdir -p \$BACKUP_DIR

# Function to log messages
log_message() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$1" | tee -a \$LOG_FILE
}

# Function to send notification
send_notification() {
    local status=\$1
    local message=\$2
    
    # Send notification via webhook or email
    curl -X POST "\$WEBHOOK_URL" \\
        -H "Content-Type: application/json" \\
        -d "{
            \"status\": \"\$status\",
            \"message\": \"\$message\",
            \"timestamp\": \"\$(date -Iseconds)\",
            \"server\": \"\$(hostname)\"
        }" \\
        --silent --show-error
}

# Start backup process
log_message "Starting PostgreSQL backup for database: \$DB_NAME"

# Set PostgreSQL password from environment
export PGPASSWORD=\$DB_PASSWORD

# Create backup with compression
if pg_dump -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME \\
    --verbose --no-owner --no-privileges \\
    --format=custom --compress=9 \\
    --file="\${BACKUP_FILE%.gz}" 2>&1 | tee -a \$LOG_FILE; then
    
    # Compress the backup
    gzip "\${BACKUP_FILE%.gz}"
    
    # Get file size
    BACKUP_SIZE=\$(du -h "\$BACKUP_FILE" | cut -f1)
    
    log_message "Backup completed successfully: \$BACKUP_FILE (\$BACKUP_SIZE)"
    
    # Upload to cloud storage (optional)
    if [ ! -z "\$CLOUD_STORAGE_BUCKET" ]; then
        log_message "Uploading backup to cloud storage..."
        
        if aws s3 cp "\$BACKUP_FILE" "s3://\$CLOUD_STORAGE_BUCKET/postgres/\$(basename \$BACKUP_FILE)"; then
            log_message "Cloud upload completed successfully"
        else
            log_message "ERROR: Cloud upload failed"
            send_notification "warning" "Backup created but cloud upload failed"
        fi
    fi
    
    # Clean up old backups
    log_message "Cleaning up backups older than \$RETENTION_DAYS days..."
    find \$BACKUP_DIR -name "*.sql.gz" -type f -mtime +\$RETENTION_DAYS -delete
    
    send_notification "success" "PostgreSQL backup completed successfully (\$BACKUP_SIZE)"
    
else
    log_message "ERROR: Backup failed"
    send_notification "error" "PostgreSQL backup failed - check logs immediately"
    exit 1
fi

# Cleanup
unset PGPASSWORD
log_message "Backup process finished"`, 'postgres-backup-script')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copiedCode === 'postgres-backup-script' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`#!/bin/bash
# PostgreSQL Automated Backup Script
# Save as: /opt/backup/postgres-backup.sh

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="pondok_imam_syafii"
DB_USER="backup_user"
BACKUP_DIR="/opt/backups/postgres"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${DATE}.sql.gz"
LOG_FILE="/var/log/postgres-backup.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Function to log messages
log_message() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send notification via webhook or email
    curl -X POST "$WEBHOOK_URL" \\
        -H "Content-Type: application/json" \\
        -d "{
            \"status\": \"$status\",
            \"message\": \"$message\",
            \"timestamp\": \"\$(date -Iseconds)\",
            \"server\": \"\$(hostname)\"
        }" \\
        --silent --show-error
}

# Start backup process
log_message "Starting PostgreSQL backup for database: $DB_NAME"

# Set PostgreSQL password from environment
export PGPASSWORD=$DB_PASSWORD

# Create backup with compression
if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \\
    --verbose --no-owner --no-privileges \\
    --format=custom --compress=9 \\
    --file="\${BACKUP_FILE%.gz}" 2>&1 | tee -a $LOG_FILE; then
    
    # Compress the backup
    gzip "\${BACKUP_FILE%.gz}"
    
    # Get file size
    BACKUP_SIZE=\$(du -h "$BACKUP_FILE" | cut -f1)
    
    log_message "Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)"
    
    # Upload to cloud storage (optional)
    if [ ! -z "$CLOUD_STORAGE_BUCKET" ]; then
        log_message "Uploading backup to cloud storage..."
        
        if aws s3 cp "$BACKUP_FILE" "s3://$CLOUD_STORAGE_BUCKET/postgres/\$(basename $BACKUP_FILE)"; then
            log_message "Cloud upload completed successfully"
        else
            log_message "ERROR: Cloud upload failed"
            send_notification "warning" "Backup created but cloud upload failed"
        fi
    fi
    
    # Clean up old backups
    log_message "Cleaning up backups older than $RETENTION_DAYS days..."
    find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    send_notification "success" "PostgreSQL backup completed successfully ($BACKUP_SIZE)"
    
else
    log_message "ERROR: Backup failed"
    send_notification "error" "PostgreSQL backup failed - check logs immediately"
    exit 1
fi

# Cleanup
unset PGPASSWORD
log_message "Backup process finished"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Node.js Backup Service</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/backup-service.ts
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

interface BackupConfig {
  dbType: 'postgresql' | 'mysql'
  host: string
  port: number
  database: string
  username: string
  password: string
  backupDir: string
  retentionDays: number
  cloudStorage?: {
    bucket: string
    region: string
  }
}

class DatabaseBackupService {
  private config: BackupConfig
  private s3Client?: S3Client

  constructor(config: BackupConfig) {
    this.config = config
    
    if (config.cloudStorage) {
      this.s3Client = new S3Client({
        region: config.cloudStorage.region
      })
    }
  }

  async createBackup(): Promise<{
    success: boolean
    backupFile?: string
    size?: string
    error?: string
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFileName = \`\${this.config.database}_\${timestamp}.sql.gz\`
      const backupPath = path.join(this.config.backupDir, backupFileName)

      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true })
      }

      // Create backup based on database type
      if (this.config.dbType === 'postgresql') {
        await this.createPostgreSQLBackup(backupPath)
      } else {
        await this.createMySQLBackup(backupPath)
      }

      // Get file size
      const stats = fs.statSync(backupPath)
      const size = this.formatFileSize(stats.size)

      // Upload to cloud storage if configured
      if (this.s3Client && this.config.cloudStorage) {
        await this.uploadToCloud(backupPath, backupFileName)
      }

      // Clean up old backups
      await this.cleanupOldBackups()

      // Log success
      await this.logBackupResult({
        status: 'success',
        backupFile: backupFileName,
        size,
        timestamp: new Date()
      })

      return {
        success: true,
        backupFile: backupFileName,
        size
      }
    } catch (error) {
      await this.logBackupResult({
        status: 'error',
        error: error.message,
        timestamp: new Date()
      })

      return {
        success: false,
        error: error.message
      }
    }
  }

  private async createPostgreSQLBackup(backupPath: string): Promise<void> {
    const command = [
      'pg_dump',
      \`-h \${this.config.host}\`,
      \`-p \${this.config.port}\`,
      \`-U \${this.config.username}\`,
      \`-d \${this.config.database}\`,
      '--verbose',
      '--no-owner',
      '--no-privileges',
      '--format=custom',
      '--compress=9',
      \`--file=\${backupPath.replace('.gz', '')}\`
    ].join(' ')

    // Set password via environment variable
    const env = {
      ...process.env,
      PGPASSWORD: this.config.password
    }

    execSync(command, { env })
    
    // Compress the backup
    execSync(\`gzip "\${backupPath.replace('.gz', '')}"\`)
  }

  private async createMySQLBackup(backupPath: string): Promise<void> {
    const command = [
      'mysqldump',
      \`-h\${this.config.host}\`,
      \`-P\${this.config.port}\`,
      \`-u\${this.config.username}\`,
      \`-p\${this.config.password}\`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--compress',
      this.config.database,
      \`| gzip > "\${backupPath}"\`
    ].join(' ')

    execSync(command, { shell: true })
  }

  private async uploadToCloud(localPath: string, fileName: string): Promise<void> {
    if (!this.s3Client || !this.config.cloudStorage) return

    const fileStream = fs.createReadStream(localPath)
    const key = \`database-backups/\${fileName}\`

    const command = new PutObjectCommand({
      Bucket: this.config.cloudStorage.bucket,
      Key: key,
      Body: fileStream,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA'
    })

    await this.s3Client.send(command)
  }

  private async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

    const files = fs.readdirSync(this.config.backupDir)
    
    for (const file of files) {
      if (file.endsWith('.sql.gz')) {
        const filePath = path.join(this.config.backupDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          console.log(\`Deleted old backup: \${file}\`)
        }
      }
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString())
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  private async logBackupResult(result: any): Promise<void> {
    await prisma.backupLog.create({
      data: {
        ...result,
        database: this.config.database,
        backupType: 'automated'
      }
    })
  }
}

// Usage
const backupService = new DatabaseBackupService({
  dbType: 'postgresql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'pondok_imam_syafii',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  backupDir: '/opt/backups/postgres',
  retentionDays: 30,
  cloudStorage: {
    bucket: process.env.BACKUP_S3_BUCKET || 'school-backups',
    region: process.env.AWS_REGION || 'ap-southeast-1'
  }
})

export { DatabaseBackupService, backupService }`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Cron Job Setup</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# Add to crontab: sudo crontab -e

# Daily backup at 2:00 AM
0 2 * * * /opt/backup/postgres-backup.sh >> /var/log/postgres-backup.log 2>&1

# Weekly backup cleanup at 3:00 AM on Sundays
0 3 * * 0 find /opt/backups/postgres -name "*.sql.gz" -type f -mtime +7 -delete

# Monthly archive backup at 1:00 AM on 1st of each month
0 1 1 * * /opt/backup/postgres-archive.sh >> /var/log/postgres-backup.log 2>&1

# Or using Node.js cron job
// api/cron/database-backup.ts
import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup-service'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await backupService.createBackup()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database backup completed',
        ...result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
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
              </div>
            </div>
          </>
        )}

        {activeTab === 'manual' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Manual Backup Procedures</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">PostgreSQL Manual Backup Commands</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Full Database Backup</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Full database backup with compression
pg_dump -h localhost -p 5432 -U username -d database_name \\
  --format=custom --compress=9 \\
  --file=backup_\$(date +%Y%m%d_%H%M%S).dump

# Alternative: SQL format with gzip compression
pg_dump -h localhost -p 5432 -U username -d database_name \\
  --format=plain \\
  | gzip > backup_\$(date +%Y%m%d_%H%M%S).sql.gz`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Schema-Only Backup</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Backup database schema only (no data)
pg_dump -h localhost -p 5432 -U username -d database_name \\
  --schema-only \\
  --file=schema_\$(date +%Y%m%d_%H%M%S).sql`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Data-Only Backup</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Backup data only (no schema)
pg_dump -h localhost -p 5432 -U username -d database_name \\
  --data-only \\
  --file=data_\$(date +%Y%m%d_%H%M%S).sql`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Specific Tables Backup</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Backup specific tables
pg_dump -h localhost -p 5432 -U username -d database_name \\
  --table=students --table=payments --table=grades \\
  --file=critical_tables_\$(date +%Y%m%d_%H%M%S).sql`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">MySQL Manual Backup Commands</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Full Database Backup</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Full database backup with compression
mysqldump -h localhost -P 3306 -u username -p \\
  --single-transaction --routines --triggers \\
  database_name | gzip > backup_\$(date +%Y%m%d_%H%M%S).sql.gz`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Multiple Databases</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Backup multiple databases
mysqldump -h localhost -P 3306 -u username -p \\
  --databases db1 db2 db3 \\
  | gzip > multi_db_backup_\$(date +%Y%m%d_%H%M%S).sql.gz`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">All Databases</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Backup all databases
mysqldump -h localhost -P 3306 -u username -p \\
  --all-databases --single-transaction \\
  | gzip > all_databases_\$(date +%Y%m%d_%H%M%S).sql.gz`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Pre-Deployment Backup Script</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`#!/bin/bash
# Pre-deployment backup script
# Usage: ./pre-deploy-backup.sh [deployment-version]

DEPLOYMENT_VERSION=\${1:-"unknown"}
BACKUP_DIR="/opt/backups/pre-deployment"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="pondok_imam_syafii"

echo "Creating pre-deployment backup for version: \$DEPLOYMENT_VERSION"

# Create backup directory
mkdir -p "\$BACKUP_DIR"

# Create database backup
BACKUP_FILE="\${BACKUP_DIR}/pre_deploy_\${DEPLOYMENT_VERSION}_\${DATE}.dump"

echo "Backing up database to: \$BACKUP_FILE"

if pg_dump -h localhost -p 5432 -U postgres -d \$DB_NAME \\
    --format=custom --compress=9 \\
    --file="\$BACKUP_FILE"; then
    
    echo "Database backup completed successfully"
    
    # Create metadata file
    cat > "\${BACKUP_FILE}.meta" <<EOF
{
  "deployment_version": "\$DEPLOYMENT_VERSION",
  "backup_date": "\$(date -Iseconds)",
  "database": "\$DB_NAME",
  "backup_type": "pre-deployment",
  "server": "\$(hostname)",
  "backup_size": "\$(du -h "\$BACKUP_FILE" | cut -f1)"
}
EOF
    
    echo "Pre-deployment backup completed: \$BACKUP_FILE"
    echo "Backup size: \$(du -h "\$BACKUP_FILE" | cut -f1)"
    
    # Optional: Upload to cloud
    if [ ! -z "\$BACKUP_S3_BUCKET" ]; then
        echo "Uploading to S3..."
        aws s3 cp "\$BACKUP_FILE" "s3://\$BACKUP_S3_BUCKET/pre-deployment/"
        aws s3 cp "\${BACKUP_FILE}.meta" "s3://\$BACKUP_S3_BUCKET/pre-deployment/"
    fi
    
else
    echo "ERROR: Database backup failed!"
    exit 1
fi`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Manual Backup via Admin Panel</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// API endpoint for manual backup
// api/admin/backup/create.ts
import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup-service'

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { backupType, includeTables } = await request.json()
    
    let result
    
    switch (backupType) {
      case 'full':
        result = await backupService.createBackup()
        break
        
      case 'schema_only':
        result = await backupService.createSchemaBackup()
        break
        
      case 'data_only':
        result = await backupService.createDataBackup()
        break
        
      case 'selective':
        result = await backupService.createSelectiveBackup(includeTables)
        break
        
      default:
        return NextResponse.json({ error: 'Invalid backup type' }, { status: 400 })
    }
    
    if (result.success) {
      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: session.user.id,
          action: 'manual_backup_created',
          details: {
            backupType,
            backupFile: result.backupFile,
            size: result.size
          }
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        ...result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Frontend component for manual backup
export function ManualBackupPanel() {
  const [isCreating, setIsCreating] = useState(false)
  const [backupType, setBackupType] = useState('full')
  
  const createBackup = async () => {
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupType })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(\`Backup created: \${result.backupFile} (\${result.size})\`)
      } else {
        toast.error(\`Backup failed: \${result.error}\`)
      }
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Create Manual Backup</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Backup Type</label>
        <select 
          value={backupType} 
          onChange={(e) => setBackupType(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="full">Full Database</option>
          <option value="schema_only">Schema Only</option>
          <option value="data_only">Data Only</option>
          <option value="selective">Selective Tables</option>
        </select>
      </div>
      
      <button
        onClick={createBackup}
        disabled={isCreating}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isCreating ? 'Creating Backup...' : 'Create Backup'}
      </button>
    </div>
  )
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'restore' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Database Restore Procedures</h2>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">⚠️ Critical Warning</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Database restoration will overwrite existing data. Always create a backup before restoring 
                      and test the restoration process in a staging environment first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">PostgreSQL Restore Commands</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Restore from Custom Format (.dump)</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Restore from custom format backup
pg_restore -h localhost -p 5432 -U username -d database_name \\
  --clean --if-exists \\
  --verbose \\
  backup_file.dump

# Restore with create database option
pg_restore -h localhost -p 5432 -U username \\
  --create --clean --if-exists \\
  --verbose \\
  backup_file.dump`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Restore from SQL File</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Restore from plain SQL file
psql -h localhost -p 5432 -U username -d database_name \\
  -f backup_file.sql

# Restore from compressed SQL file
gunzip -c backup_file.sql.gz | psql -h localhost -p 5432 -U username -d database_name`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Selective Table Restore</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Restore specific tables only
pg_restore -h localhost -p 5432 -U username -d database_name \\
  --table=students --table=payments \\
  --clean --if-exists \\
  backup_file.dump`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">MySQL Restore Commands</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Restore from SQL File</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Restore from SQL file
mysql -h localhost -P 3306 -u username -p database_name < backup_file.sql

# Restore from compressed file
gunzip -c backup_file.sql.gz | mysql -h localhost -P 3306 -u username -p database_name`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Restore Multiple Databases</h4>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
{`# Restore multiple databases
mysql -h localhost -P 3306 -u username -p < multi_db_backup.sql`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Automated Restore Script</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`#!/bin/bash
# Database restore script with safety checks
# Usage: ./restore-database.sh <backup_file> [database_name]

BACKUP_FILE=\$1
DB_NAME=\${2:-"pondok_imam_syafii"}
RESTORE_LOG="/var/log/database-restore.log"
SAFETY_BACKUP_DIR="/opt/backups/pre-restore"

# Function to log messages
log_message() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$1" | tee -a \$RESTORE_LOG
}

# Validation checks
if [ -z "\$BACKUP_FILE" ]; then
    echo "Usage: \$0 <backup_file> [database_name]"
    exit 1
fi

if [ ! -f "\$BACKUP_FILE" ]; then
    log_message "ERROR: Backup file not found: \$BACKUP_FILE"
    exit 1
fi

# Safety backup before restore
log_message "Creating safety backup before restore..."
mkdir -p \$SAFETY_BACKUP_DIR
SAFETY_BACKUP="\${SAFETY_BACKUP_DIR}/pre_restore_\$(date +%Y%m%d_%H%M%S).dump"

if pg_dump -h localhost -p 5432 -U postgres -d \$DB_NAME \\
    --format=custom --compress=9 \\
    --file="\$SAFETY_BACKUP"; then
    log_message "Safety backup created: \$SAFETY_BACKUP"
else
    log_message "ERROR: Failed to create safety backup"
    exit 1
fi

# Confirm restore operation
echo "About to restore database '\$DB_NAME' from '\$BACKUP_FILE'"
echo "Safety backup created at: \$SAFETY_BACKUP"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "\$confirm" != "yes" ]; then
    log_message "Restore operation cancelled by user"
    exit 0
fi

# Perform restore
log_message "Starting database restore from: \$BACKUP_FILE"

if [ "\${BACKUP_FILE##*.}" = "dump" ]; then
    # Custom format restore
    if pg_restore -h localhost -p 5432 -U postgres -d \$DB_NAME \\
        --clean --if-exists \\
        --verbose \\
        "\$BACKUP_FILE" 2>&1 | tee -a \$RESTORE_LOG; then
        log_message "Database restore completed successfully"
    else
        log_message "ERROR: Database restore failed"
        echo "Safety backup is available at: \$SAFETY_BACKUP"
        exit 1
    fi
elif [ "\${BACKUP_FILE##*.}" = "gz" ]; then
    # Compressed SQL restore
    if gunzip -c "\$BACKUP_FILE" | psql -h localhost -p 5432 -U postgres -d \$DB_NAME 2>&1 | tee -a \$RESTORE_LOG; then
        log_message "Database restore completed successfully"
    else
        log_message "ERROR: Database restore failed"
        echo "Safety backup is available at: \$SAFETY_BACKUP"
        exit 1
    fi
else
    # Plain SQL restore
    if psql -h localhost -p 5432 -U postgres -d \$DB_NAME -f "\$BACKUP_FILE" 2>&1 | tee -a \$RESTORE_LOG; then
        log_message "Database restore completed successfully"
    else
        log_message "ERROR: Database restore failed"
        echo "Safety backup is available at: \$SAFETY_BACKUP"
        exit 1
    fi
fi

# Post-restore verification
log_message "Running post-restore verification..."

# Check table count
TABLE_COUNT=\$(psql -h localhost -p 5432 -U postgres -d \$DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
log_message "Database contains \$TABLE_COUNT tables"

# Check for critical tables
CRITICAL_TABLES=("users" "students" "payments" "grades")
for table in "\${CRITICAL_TABLES[@]}"; do
    if psql -h localhost -p 5432 -U postgres -d \$DB_NAME -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '\$table');" | grep -q 't'; then
        log_message "✓ Critical table '\$table' exists"
    else
        log_message "⚠ WARNING: Critical table '\$table' missing"
    fi
done

log_message "Database restore process completed"
echo "Restore log: \$RESTORE_LOG"
echo "Safety backup: \$SAFETY_BACKUP"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Point-in-Time Recovery</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# PostgreSQL Point-in-Time Recovery (PITR)
# Requires WAL archiving to be enabled

# 1. Stop PostgreSQL service
sudo systemctl stop postgresql

# 2. Backup current data directory
mv /var/lib/postgresql/data /var/lib/postgresql/data.backup

# 3. Restore base backup
tar -xzf base_backup.tar.gz -C /var/lib/postgresql/

# 4. Create recovery configuration
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp /opt/wal_archive/%f %p'
recovery_target_time = '2024-01-15 10:30:00'
recovery_target_timeline = 'latest'
EOF

# 5. Start PostgreSQL (will enter recovery mode)
sudo systemctl start postgresql

# 6. Check recovery status
psql -c "SELECT pg_is_in_recovery();"

# 7. Once recovery is complete, promote to primary
psql -c "SELECT pg_promote();"

# Note: This is a simplified example. 
# Production PITR requires proper WAL archiving setup.`}
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
              <h2 className="text-2xl font-bold mb-4">Backup Monitoring & Alerting</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Backup Status Dashboard</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// components/BackupStatusDashboard.tsx
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface BackupStatus {
  id: string
  database: string
  backupType: string
  status: 'success' | 'failed' | 'running' | 'scheduled'
  startTime: string
  endTime?: string
  size?: string
  error?: string
  nextScheduled?: string
}

export function BackupStatusDashboard() {
  const [backups, setBackups] = useState<BackupStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBackupStatus()
    const interval = setInterval(fetchBackupStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch('/api/admin/backup/status')
      const data = await response.json()
      setBackups(data.backups)
    } catch (error) {
      console.error('Failed to fetch backup status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case 'scheduled':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading backup status...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Backup Status</h3>
        <button 
          onClick={fetchBackupStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Summary Cards */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600">Successful</p>
              <p className="text-2xl font-bold text-green-700">
                {backups.filter(b => b.status === 'success').length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-700">
                {backups.filter(b => b.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Running</p>
              <p className="text-2xl font-bold text-blue-700">
                {backups.filter(b => b.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Scheduled</p>
              <p className="text-2xl font-bold text-yellow-700">
                {backups.filter(b => b.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Database</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Start Time</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Duration</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Size</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Next</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((backup) => (
              <tr key={backup.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  <div className={\`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border \${getStatusColor(backup.status)}\`}>
                    {getStatusIcon(backup.status)}
                    {backup.status}
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2">{backup.database}</td>
                <td className="border border-gray-200 px-4 py-2">{backup.backupType}</td>
                <td className="border border-gray-200 px-4 py-2">
                  {new Date(backup.startTime).toLocaleString()}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {backup.endTime ? 
                    \`\${Math.round((new Date(backup.endTime).getTime() - new Date(backup.startTime).getTime()) / 1000)}s\` 
                    : '-'}
                </td>
                <td className="border border-gray-200 px-4 py-2">{backup.size || '-'}</td>
                <td className="border border-gray-200 px-4 py-2">
                  {backup.nextScheduled ? new Date(backup.nextScheduled).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Backup Monitoring Service</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/backup-monitor.ts
class BackupMonitorService {
  private alerts = {
    email: process.env.BACKUP_ALERT_EMAIL,
    webhook: process.env.BACKUP_ALERT_WEBHOOK,
    slack: process.env.BACKUP_ALERT_SLACK
  }

  async checkBackupHealth(): Promise<{
    healthy: boolean
    issues: string[]
    lastBackup?: Date
  }> {
    const issues: string[] = []
    let healthy = true

    // Check if daily backup ran in last 25 hours
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000)
    const lastBackup = await prisma.backupLog.findFirst({
      where: {
        status: 'success',
        backupType: 'automated',
        createdAt: {
          gte: yesterday
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!lastBackup) {
      issues.push('No successful backup in last 25 hours')
      healthy = false
    }

    // Check for consecutive failures
    const recentFailures = await prisma.backupLog.findMany({
      where: {
        status: 'failed',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    if (recentFailures.length >= 3) {
      issues.push('3 or more backup failures in last 7 days')
      healthy = false
    }

    // Check backup storage space
    const backupDir = process.env.BACKUP_DIR || '/opt/backups'
    try {
      const stats = await this.getDiskUsage(backupDir)
      if (stats.usagePercent > 90) {
        issues.push(\`Backup storage \${stats.usagePercent}% full\`)
        healthy = false
      }
    } catch (error) {
      issues.push('Cannot check backup storage space')
      healthy = false
    }

    // Check cloud sync status
    if (process.env.CLOUD_STORAGE_ENABLED === 'true') {
      const cloudSyncIssues = await this.checkCloudSyncHealth()
      issues.push(...cloudSyncIssues)
      if (cloudSyncIssues.length > 0) {
        healthy = false
      }
    }

    return {
      healthy,
      issues,
      lastBackup: lastBackup?.createdAt
    }
  }

  private async getDiskUsage(path: string): Promise<{
    total: number
    used: number
    free: number
    usagePercent: number
  }> {
    const { execSync } = require('child_process')
    const output = execSync(\`df -B1 \${path}\`, { encoding: 'utf8' })
    const lines = output.split('\\n')
    const data = lines[1].split(/\\s+/)
    
    const total = parseInt(data[1])
    const used = parseInt(data[2])
    const free = parseInt(data[3])
    const usagePercent = Math.round((used / total) * 100)

    return { total, used, free, usagePercent }
  }

  private async checkCloudSyncHealth(): Promise<string[]> {
    const issues: string[] = []

    // Check recent cloud uploads
    const recentCloudUploads = await prisma.backupLog.findMany({
      where: {
        cloudStatus: 'success',
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48 hours
        }
      }
    })

    if (recentCloudUploads.length === 0) {
      issues.push('No successful cloud uploads in last 48 hours')
    }

    return issues
  }

  async sendAlert(type: 'warning' | 'error', message: string, details?: any) {
    const alertData = {
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
      server: process.env.SERVER_NAME || 'unknown'
    }

    // Send email alert
    if (this.alerts.email) {
      await this.sendEmailAlert(alertData)
    }

    // Send webhook alert
    if (this.alerts.webhook) {
      await this.sendWebhookAlert(alertData)
    }

    // Send Slack alert
    if (this.alerts.slack) {
      await this.sendSlackAlert(alertData)
    }

    // Log alert
    await prisma.backupAlert.create({
      data: {
        type,
        message,
        details: JSON.stringify(details),
        resolved: false
      }
    })
  }

  private async sendEmailAlert(alert: any) {
    // Implement email sending logic
    console.log('Sending email alert:', alert.message)
  }

  private async sendWebhookAlert(alert: any) {
    try {
      await fetch(this.alerts.webhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }

  private async sendSlackAlert(alert: any) {
    const color = alert.type === 'error' ? 'danger' : 'warning'
    const payload = {
      attachments: [{
        color,
        title: \`Backup Alert: \${alert.type.toUpperCase()}\`,
        text: alert.message,
        fields: [
          {
            title: 'Server',
            value: alert.server,
            short: true
          },
          {
            title: 'Time',
            value: alert.timestamp,
            short: true
          }
        ]
      }]
    }

    try {
      await fetch(this.alerts.slack!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  // Cron job to run health checks
  async runHealthCheck() {
    const health = await this.checkBackupHealth()
    
    if (!health.healthy) {
      await this.sendAlert('error', 'Backup system health check failed', {
        issues: health.issues,
        lastBackup: health.lastBackup
      })
    }
  }
}

export const backupMonitor = new BackupMonitorService()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Health Check API Endpoint</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// api/admin/backup/health.ts
import { NextRequest, NextResponse } from 'next/server'
import { backupMonitor } from '@/lib/backup-monitor'

export async function GET(request: NextRequest) {
  try {
    const health = await backupMonitor.checkBackupHealth()
    
    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString()
    }, {
      status: health.healthy ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Cron job endpoint
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await backupMonitor.runHealthCheck()
    
    return NextResponse.json({
      success: true,
      message: 'Health check completed'
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
              </div>
            </div>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Backup Security & Encryption</h2>
              
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">Security Best Practices</h3>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• Encrypt all backup files</li>
                        <li>• Use secure storage with access controls</li>
                        <li>• Regularly rotate encryption keys</li>
                        <li>• Audit backup access and operations</li>
                        <li>• Test restore procedures regularly</li>
                        <li>• Keep backup credentials secure</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Encrypted Backup Implementation</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`#!/bin/bash
# Encrypted PostgreSQL backup script

# Configuration
BACKUP_DIR="/opt/backups/encrypted"
DB_NAME="pondok_imam_syafii"
ENCRYPTION_KEY_FILE="/opt/backup/encryption.key"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \$BACKUP_DIR

# Generate encryption key if it doesn't exist
if [ ! -f "\$ENCRYPTION_KEY_FILE" ]; then
    echo "Generating new encryption key..."
    openssl rand -base64 32 > "\$ENCRYPTION_KEY_FILE"
    chmod 600 "\$ENCRYPTION_KEY_FILE"
    chown postgres:postgres "\$ENCRYPTION_KEY_FILE"
fi

# Create backup and encrypt in one step
echo "Creating encrypted backup..."
pg_dump -h localhost -p 5432 -U postgres -d \$DB_NAME \\
  --format=custom --compress=9 \\
  | gpg --cipher-algo AES256 --compress-algo 1 --symmetric \\
    --output "\${BACKUP_DIR}/\${DB_NAME}_\${DATE}.dump.gpg" \\
    --batch --passphrase-file "\$ENCRYPTION_KEY_FILE"

if [ \$? -eq 0 ]; then
    echo "Encrypted backup created successfully"
    
    # Set secure permissions
    chmod 600 "\${BACKUP_DIR}/\${DB_NAME}_\${DATE}.dump.gpg"
    
    # Create checksum for integrity verification
    sha256sum "\${BACKUP_DIR}/\${DB_NAME}_\${DATE}.dump.gpg" > "\${BACKUP_DIR}/\${DB_NAME}_\${DATE}.dump.gpg.sha256"
    
    # Log the backup
    echo "\$(date -Iseconds): Encrypted backup created - \${DB_NAME}_\${DATE}.dump.gpg" >> /var/log/encrypted-backup.log
else
    echo "ERROR: Encrypted backup failed"
    exit 1
fi

# Alternative: Using OpenSSL for encryption
# pg_dump ... | openssl enc -aes-256-cbc -salt -k "\$(cat \$ENCRYPTION_KEY_FILE)" > backup.sql.enc`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Node.js Encrypted Backup Service</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/encrypted-backup-service.ts
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

class EncryptedBackupService {
  private encryptionKey: Buffer
  private algorithm = 'aes-256-gcm'

  constructor() {
    this.loadOrCreateEncryptionKey()
  }

  private loadOrCreateEncryptionKey() {
    const keyPath = process.env.BACKUP_ENCRYPTION_KEY_PATH || '/opt/backup/encryption.key'
    
    if (fs.existsSync(keyPath)) {
      // Load existing key
      const keyData = fs.readFileSync(keyPath, 'utf8')
      this.encryptionKey = Buffer.from(keyData, 'base64')
    } else {
      // Generate new key
      this.encryptionKey = crypto.randomBytes(32)
      fs.writeFileSync(keyPath, this.encryptionKey.toString('base64'), { mode: 0o600 })
      console.log('Generated new encryption key:', keyPath)
    }
  }

  async createEncryptedBackup(backupPath: string): Promise<{
    encryptedPath: string
    checksumPath: string
  }> {
    const encryptedPath = backupPath + '.enc'
    const checksumPath = encryptedPath + '.sha256'

    // Create cipher
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey)
    cipher.setAAD(Buffer.from(path.basename(backupPath)))

    // Encrypt file
    const inputStream = fs.createReadStream(backupPath)
    const outputStream = fs.createWriteStream(encryptedPath)

    // Write IV at the beginning of encrypted file
    outputStream.write(iv)

    await pipeline(
      inputStream,
      cipher,
      outputStream
    )

    // Get authentication tag
    const authTag = cipher.getAuthTag()
    
    // Append auth tag to encrypted file
    fs.appendFileSync(encryptedPath, authTag)

    // Create checksum for integrity verification
    const checksum = await this.createChecksum(encryptedPath)
    fs.writeFileSync(checksumPath, checksum + '  ' + path.basename(encryptedPath))

    // Set secure permissions
    fs.chmodSync(encryptedPath, 0o600)
    fs.chmodSync(checksumPath, 0o600)

    // Remove unencrypted backup
    fs.unlinkSync(backupPath)

    return {
      encryptedPath,
      checksumPath
    }
  }

  async decryptBackup(encryptedPath: string, outputPath: string): Promise<void> {
    // Read encrypted file
    const encryptedData = fs.readFileSync(encryptedPath)
    
    // Extract IV (first 16 bytes)
    const iv = encryptedData.slice(0, 16)
    
    // Extract auth tag (last 16 bytes)
    const authTag = encryptedData.slice(-16)
    
    // Extract encrypted data
    const encrypted = encryptedData.slice(16, -16)

    // Create decipher
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey)
    decipher.setAuthTag(authTag)
    decipher.setAAD(Buffer.from(path.basename(outputPath.replace('.enc', ''))))

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])

    // Write decrypted data
    fs.writeFileSync(outputPath, decrypted)
    fs.chmodSync(outputPath, 0o600)
  }

  async verifyIntegrity(encryptedPath: string, checksumPath: string): Promise<boolean> {
    if (!fs.existsSync(checksumPath)) {
      return false
    }

    const storedChecksum = fs.readFileSync(checksumPath, 'utf8').split('  ')[0]
    const currentChecksum = await this.createChecksum(encryptedPath)

    return storedChecksum === currentChecksum
  }

  private async createChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)

      stream.on('data', (data) => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  async rotateEncryptionKey(): Promise<void> {
    const keyPath = process.env.BACKUP_ENCRYPTION_KEY_PATH || '/opt/backup/encryption.key'
    const oldKeyPath = keyPath + '.old'

    // Backup current key
    if (fs.existsSync(keyPath)) {
      fs.copyFileSync(keyPath, oldKeyPath)
    }

    // Generate new key
    const newKey = crypto.randomBytes(32)
    fs.writeFileSync(keyPath, newKey.toString('base64'), { mode: 0o600 })

    this.encryptionKey = newKey

    console.log('Encryption key rotated successfully')
    
    // Log key rotation
    await prisma.securityLog.create({
      data: {
        event: 'backup_encryption_key_rotated',
        timestamp: new Date(),
        details: {
          oldKeyBackup: oldKeyPath,
          newKeyPath: keyPath
        }
      }
    })
  }
}

export const encryptedBackupService = new EncryptedBackupService()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Backup Access Control</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// lib/backup-access-control.ts
class BackupAccessControl {
  private allowedUsers = [
    'admin',
    'dba',
    'backup_operator'
  ]

  private allowedIPs = [
    '192.168.1.0/24',  // Internal network
    '10.0.0.0/8'       // VPN network
  ]

  async authorizeBackupAccess(
    userId: string,
    action: 'create' | 'restore' | 'download' | 'delete',
    ipAddress: string
  ): Promise<{ authorized: boolean, reason?: string }> {
    
    // Check user authorization
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { roles: true }
    })

    if (!user) {
      return { authorized: false, reason: 'User not found' }
    }

    const hasBackupRole = user.roles.some(role => 
      this.allowedUsers.includes(role.name.toLowerCase())
    )

    if (!hasBackupRole) {
      await this.logUnauthorizedAccess(userId, action, ipAddress, 'Insufficient privileges')
      return { authorized: false, reason: 'Insufficient privileges' }
    }

    // Check IP address restriction
    if (!this.isIPAllowed(ipAddress)) {
      await this.logUnauthorizedAccess(userId, action, ipAddress, 'IP not allowed')
      return { authorized: false, reason: 'Access denied from this IP address' }
    }

    // Check time restrictions (backup operations only during maintenance hours)
    if (action === 'restore' && !this.isMaintenanceHours()) {
      return { 
        authorized: false, 
        reason: 'Restore operations only allowed during maintenance hours (2-6 AM)' 
      }
    }

    // Additional security checks for destructive operations
    if (['restore', 'delete'].includes(action)) {
      const recentAuth = await this.checkRecentAuthentication(userId)
      if (!recentAuth) {
        return { 
          authorized: false, 
          reason: 'Recent authentication required for destructive operations' 
        }
      }
    }

    // Log authorized access
    await this.logAuthorizedAccess(userId, action, ipAddress)

    return { authorized: true }
  }

  private isIPAllowed(ipAddress: string): boolean {
    // Implement IP range checking logic
    // This is a simplified example
    return this.allowedIPs.some(range => {
      if (range.includes('/')) {
        // CIDR notation checking would go here
        const [network, bits] = range.split('/')
        // Simplified check - in production, use proper CIDR matching
        return ipAddress.startsWith(network.split('.').slice(0, -1).join('.'))
      }
      return ipAddress === range
    })
  }

  private isMaintenanceHours(): boolean {
    const hour = new Date().getHours()
    return hour >= 2 && hour <= 6
  }

  private async checkRecentAuthentication(userId: string): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentAuth = await prisma.usersSession.findFirst({
      where: {
        userId,
        lastActivity: {
          gte: fiveMinutesAgo
        }
      }
    })

    return !!recentAuth
  }

  private async logAuthorizedAccess(userId: string, action: string, ipAddress: string) {
    await prisma.backupAccessLog.create({
      data: {
        userId,
        action,
        ipAddress,
        authorized: true,
        timestamp: new Date()
      }
    })
  }

  private async logUnauthorizedAccess(
    userId: string, 
    action: string, 
    ipAddress: string, 
    reason: string
  ) {
    await prisma.backupAccessLog.create({
      data: {
        userId,
        action,
        ipAddress,
        authorized: false,
        reason,
        timestamp: new Date()
      }
    })

    // Send security alert for unauthorized access attempts
    await this.sendSecurityAlert({
      type: 'unauthorized_backup_access',
      userId,
      action,
      ipAddress,
      reason,
      timestamp: new Date()
    })
  }

  private async sendSecurityAlert(alert: any) {
    // Send immediate notification for security events
    console.log('SECURITY ALERT:', alert)
    
    // In production, integrate with your alerting system
    // await notificationService.sendSecurityAlert(alert)
  }

  async requireTwoFactorForBackupOps(userId: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    })

    return user?.twoFactorEnabled || false
  }
}

export const backupAccessControl = new BackupAccessControl()

// Middleware for backup API endpoints
export async function withBackupAuthorization(
  handler: Function,
  action: string
) {
  return async (req: NextRequest, res: NextResponse) => {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    const authorization = await backupAccessControl.authorizeBackupAccess(
      session.user.id,
      action,
      ipAddress
    )

    if (!authorization.authorized) {
      return NextResponse.json({ 
        error: 'Access denied',
        reason: authorization.reason 
      }, { status: 403 })
    }

    return handler(req, res)
  }
}`}
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