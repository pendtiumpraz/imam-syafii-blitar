import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Setup test database
  try {
    console.log('📊 Setting up test database...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./test-e2e.db' }
    })
    console.log('✅ Test database ready')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }

  // Seed test data
  // TODO: Re-enable after fixing test-data/seed.ts with correct Prisma model names
  // try {
  //   console.log('🌱 Seeding test data...')
  //   const { seedTestData } = await import('./test-data/seed')
  //   await seedTestData()
  //   console.log('✅ Test data seeded')
  // } catch (error) {
  //   console.error('❌ Failed to seed test data:', error)
  //   throw error
  // }

  // Pre-authenticate users for tests that need authentication
  try {
    console.log('🔐 Pre-authenticating test users...')
    const browser = await chromium.launch()
    const context = await browser.newContext({
      baseURL: config.projects[0].use?.baseURL || 'http://localhost:3000',
    })

    // Create admin authentication
    const adminPage = await context.newPage()
    await adminPage.goto('/auth/signin')
    await adminPage.fill('[name="username"]', 'admin')
    await adminPage.fill('[name="password"]', 'admin123')
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('/dashboard')
    
    // Save admin auth state
    await context.storageState({ 
      path: path.join(__dirname, 'auth', 'admin.json') 
    })

    // Create staff authentication
    const staffPage = await context.newPage()
    await staffPage.goto('/auth/signin')
    await staffPage.fill('[name="username"]', 'staff')
    await staffPage.fill('[name="password"]', 'staff123')
    await staffPage.click('button[type="submit"]')
    await staffPage.waitForURL('/dashboard')
    
    // Save staff auth state
    await context.storageState({ 
      path: path.join(__dirname, 'auth', 'staff.json') 
    })

    await browser.close()
    console.log('✅ Authentication states saved')
  } catch (error) {
    console.warn('⚠️ Could not pre-authenticate (app might not be running yet):', error instanceof Error ? error.message : String(error))
    // This is not critical for setup, continue
  }

  console.log('✅ Global setup completed')
}

export default globalSetup