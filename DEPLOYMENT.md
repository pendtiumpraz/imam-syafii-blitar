# Deployment Guide for Vercel

## ⚡ Quick Fix: Admin Login Issue

**Problem:** Admin login (admin / admin123) tidak bisa digunakan di production
**Solution:** Panggil API init setelah deploy

```
https://your-domain.vercel.app/api/auth/init?secret=init-secret-2024
```

Ini akan otomatis create user admin, staff, dan ustadz dengan credentials default.

---

## Prerequisites

1. A Vercel account
2. A PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)

## Database Setup

### Option 1: Neon (Recommended for Vercel)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option 2: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

### Option 3: PlanetScale
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get the connection string from the Connect modal

## Environment Variables

Set these in your Vercel project settings:

```
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate_using_openssl_rand_-base64_32
INIT_SECRET=init-secret-2024
```

## Deployment Steps

1. **Fork or clone the repository**

2. **Set up database**
   - Create a PostgreSQL database using one of the options above
   - Copy the connection string

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

4. **Set environment variables in Vercel Dashboard**
   - Go to your project settings
   - Add the environment variables listed above

5. **Initialize database**

   **Option A: Via API (Recommended)**
   ```
   https://your-domain.vercel.app/api/auth/init?secret=init-secret-2024
   ```

   **Option B: Via CLI**
   ```bash
   # Run migrations
   npx prisma migrate deploy

   # Seed initial data
   npx prisma db seed
   ```

6. **Default Login Credentials**

   After initialization, use these credentials:

   - **Admin**: `admin` / `admin123`
   - **Staff**: `staff` / `staff123`
   - **Ustadz**: `ustadz` / `ustadz123`

   ⚠️ **IMPORTANT**: Change these passwords immediately in production!

## Local Development with PostgreSQL

If you want to use PostgreSQL locally:

1. Install PostgreSQL
2. Create a database
3. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/pondok_imam_syafii"
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## Troubleshooting

### Build fails with "Failed to collect page data"
- Make sure all environment variables are set correctly
- Ensure DATABASE_URL is a valid PostgreSQL connection string

### "Invalid `prisma.user.findUnique()` invocation"
- Run `npx prisma generate` 
- Run `npx prisma migrate deploy`

### Authentication not working
- Verify NEXTAUTH_URL matches your deployment URL
- Ensure NEXTAUTH_SECRET is set and secure

### Admin login not working
1. Make sure database has been initialized
2. Call the init API: `/api/auth/init?secret=init-secret-2024`
3. Or run: `npx prisma db seed`
4. Try login with: `admin` / `admin123`

### Users not found in database
- Database hasn't been seeded
- Run init API or `npx prisma db seed`
- Check logs for seed errors