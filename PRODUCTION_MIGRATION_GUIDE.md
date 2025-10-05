# 🚨 Production Database Migration Guide - Soft Delete

## Status
- ✅ Development: Soft delete ACTIVE
- ⏳ Production: Soft delete DISABLED (temporary)

## Quick Fix Applied
Soft delete middleware sekarang **disabled di production** sampai database migration selesai.
Login production sudah bisa digunakan kembali!

## Migration Steps untuk Production

### Step 1: Backup Database (CRITICAL!)
```bash
# Backup production database terlebih dahulu!
pg_dump $PRODUCTION_DATABASE_URL > backup_before_soft_delete_$(date +%Y%m%d).sql
```

### Step 2: Run Migration di Production

#### Option A: Via Vercel Dashboard (RECOMMENDED)
1. Login ke https://vercel.com/dashboard
2. Pilih project: `imam-syafii-blitar`
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - Key: `ENABLE_SOFT_DELETE`
   - Value: `true`
   - Save

5. Go to **Deployments** → Latest → **... menu** → **Redeploy**
6. **IMPORTANT**: Uncheck "Use existing Build Cache"
7. Deploy

8. After deployment, run migration via terminal:
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Run migration command in production
vercel env pull .env.production
npx prisma db push --accept-data-loss
```

#### Option B: Direct Database Access
```bash
# Set production database URL
export DATABASE_URL="your-production-postgres-url"

# Run schema push
npx prisma db push --accept-data-loss

# Or create and run migration
npx prisma migrate dev --name add_soft_delete_fields
npx prisma migrate deploy
```

### Step 3: Verify Migration
1. Check database schema memiliki columns baru:
   - `deletedAt` (DateTime nullable)
   - `isDeleted` (Boolean default false)
   - `deletedBy` (String nullable)

2. Test query di production database:
```sql
-- Check User table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('deletedAt', 'isDeleted', 'deletedBy');
```

### Step 4: Enable Soft Delete
Setelah migration sukses:
1. Di Vercel → Environment Variables
2. Set `ENABLE_SOFT_DELETE=true`
3. Redeploy

### Step 5: Test Production
1. Login: admin / admin123
2. Test delete record → harus soft delete
3. Check deleted record masih ada di database

## Rollback Plan

Jika ada masalah:

```bash
# Option 1: Disable soft delete
# Di Vercel Environment Variables, set:
ENABLE_SOFT_DELETE=false

# Option 2: Restore backup
psql $PRODUCTION_DATABASE_URL < backup_before_soft_delete_YYYYMMDD.sql

# Option 3: Revert code
git revert a31604f
git push origin main
```

## Current System Behavior

### Development (Local)
- ✅ Soft delete ACTIVE
- ✅ All delete operations are soft delete
- ✅ Deleted records filtered from queries
- ✅ Full audit trail

### Production (Before Migration)
- ⚠️ Soft delete DISABLED
- ⚠️ Delete operations are HARD DELETE
- ⚠️ No soft delete protection
- ⚠️ Login works normally

### Production (After Migration + ENABLE_SOFT_DELETE=true)
- ✅ Soft delete ACTIVE
- ✅ All delete operations are soft delete
- ✅ Deleted records filtered from queries
- ✅ Full audit trail
- ✅ Zero data loss guarantee

## Timeline Recommendation
1. **Immediately**: Production login works (DONE ✅)
2. **This week**: Schedule maintenance window for migration
3. **During maintenance**: 
   - Backup DB
   - Run migration
   - Enable soft delete
   - Test thoroughly
4. **After migration**: Full soft delete protection in production

## Support
Jika ada issue:
1. Check Vercel deployment logs
2. Check database connection
3. Verify environment variables
4. Contact: admin@pondok-imam-syafii.id

---
*Last Updated: 5 October 2025*
*Quick Fix Commit: a31604f*
