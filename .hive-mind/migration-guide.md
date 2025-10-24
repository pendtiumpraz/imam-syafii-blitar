# Migration Guide - Admin-Configurable Content System

## Overview

This guide provides step-by-step instructions for safely migrating the new schema models into your existing Prisma database.

---

## Pre-Migration Checklist

- [ ] Backup your database
- [ ] Review all new models in `schema-design.prisma`
- [ ] Ensure Prisma CLI is up to date: `npm install -D prisma@latest`
- [ ] Test migration on development database first
- [ ] Have rollback plan ready

---

## Migration Steps

### Step 1: Copy Models to Main Schema

Open your `prisma/schema.prisma` file and add the new models at the end. It's recommended to add them in phases:

#### Phase 1: Organization Models (Recommended First)

Add these models:
- `organization_info`
- `institution_info`
- `organization_structure`

```bash
# After adding to schema.prisma
npx prisma format
npx prisma migrate dev --name add_organization_models
```

#### Phase 2: Site Configuration

Add these models:
- `site_config`
- `navbar_items`
- `footer_sections`

```bash
npx prisma format
npx prisma migrate dev --name add_site_config_models
```

#### Phase 3: Financial Transactions

Add these models:
- `general_transactions`
- `transaction_bulk_entries`
- `transaction_reports`

```bash
npx prisma format
npx prisma migrate dev --name add_transaction_models
```

#### Phase 4: CMS Models

Add these models:
- `cms_categories`
- `cms_media`
- `cms_pages`
- `cms_page_revisions`

```bash
npx prisma format
npx prisma migrate dev --name add_cms_models
```

#### Phase 5: SEO Models

Add these models:
- `seo_global_settings`
- `seo_redirects`
- `seo_sitemap_entries`

```bash
npx prisma format
npx prisma migrate dev --name add_seo_models
```

### Step 2: Generate Prisma Client

After each migration:

```bash
npx prisma generate
```

### Step 3: Seed Initial Data

Create seed files for initial data.

---

## Seeding Guide

### Seed File: `prisma/seeds/organization.seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedOrganization() {
  // Create foundation info
  const orgInfo = await prisma.organization_info.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Yayasan Pondok Imam Syafii',
      nameArabic: 'مؤسسة معهد الإمام الشافعي',
      shortName: 'YPIS',
      legalName: 'Yayasan Pondok Pesantren Imam Syafii',

      // Contact
      address: 'Jl. Raya No. 123',
      city: 'Malang',
      province: 'Jawa Timur',
      postalCode: '65100',
      phone: '+62 341 xxxxxxx',
      email: 'info@pondokimamsyafii.com',
      website: 'https://pondokimamsyafii.com',

      // Vision & Mission
      vision: 'Menjadi lembaga pendidikan Islam terdepan...',
      visionArabic: 'أن نكون مؤسسة تعليمية إسلامية رائدة...',
      mission: 'Menyelenggarakan pendidikan berkualitas...',
      missionArabic: 'تنظيم التعليم الجيد...',

      // Social media
      facebook: 'https://facebook.com/pondokimamsyafii',
      instagram: 'https://instagram.com/pondokimamsyafii',
      youtube: 'https://youtube.com/@pondokimamsyafii',

      isActive: true,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Organization info seeded:', orgInfo.id);

  // Create institutions
  const institutions = [
    {
      type: 'TK',
      code: 'TK-PIS',
      name: 'TK Imam Syafii',
      nameArabic: 'روضة الأطفال الإمام الشافعي',
      npsn: '12345678',
      accreditation: 'A',
      studentCapacity: 60,
      vision: 'Membentuk generasi Qur\'ani sejak dini',
      programs: JSON.stringify(['Tahfidz', 'Bilingual', 'Character Building']),
      facilities: JSON.stringify(['Ruang Kelas Ber-AC', 'Playground', 'Perpustakaan']),
      showOnWebsite: true,
      sortOrder: 1,
      isActive: true,
    },
    {
      type: 'SD',
      code: 'SD-PIS',
      name: 'SD Imam Syafii',
      nameArabic: 'المدرسة الابتدائية الإمام الشافعي',
      npsn: '12345679',
      accreditation: 'A',
      studentCapacity: 240,
      vision: 'Mencetak generasi berakhlak mulia dan berprestasi',
      programs: JSON.stringify(['Tahfidz 5 Juz', 'Bilingual Program', 'IT Integration']),
      facilities: JSON.stringify(['Lab Komputer', 'Lab IPA', 'Perpustakaan', 'Masjid']),
      showOnWebsite: true,
      sortOrder: 2,
      isActive: true,
    },
    {
      type: 'PONDOK',
      code: 'PONDOK-PIS',
      name: 'Pondok Pesantren Imam Syafii',
      nameArabic: 'معهد الإمام الشافعي',
      npsn: '12345680',
      studentCapacity: 300,
      vision: 'Mencetak kader ulama yang berilmu dan berakhlak',
      programs: JSON.stringify(['Tahfidz 30 Juz', 'Kitab Kuning', 'Bahasa Arab & Inggris']),
      facilities: JSON.stringify(['Asrama', 'Masjid', 'Aula', 'Perpustakaan', 'Kantin']),
      showOnWebsite: true,
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const inst of institutions) {
    await prisma.institution_info.create({ data: inst });
  }

  console.log(`✅ ${institutions.length} institutions seeded`);

  // Create organizational structure
  const structure = [
    {
      level: 0,
      positionName: 'Ketua Yayasan',
      positionNameAr: 'رئيس المؤسسة',
      personName: 'Dr. H. Muhammad, M.Pd',
      sortOrder: 1,
      showOnWebsite: true,
      isActive: true,
    },
    {
      level: 1,
      positionName: 'Direktur Pondok',
      positionNameAr: 'مدير المعهد',
      personName: 'Ust. Ahmad, Lc., M.A',
      sortOrder: 1,
      showOnWebsite: true,
      isActive: true,
    },
    {
      level: 1,
      positionName: 'Kepala SD',
      positionNameAr: 'مدير المدرسة',
      personName: 'Ustadzah Fatimah, S.Pd.I',
      sortOrder: 2,
      showOnWebsite: true,
      isActive: true,
    },
  ];

  for (const pos of structure) {
    await prisma.organization_structure.create({ data: pos });
  }

  console.log(`✅ ${structure.length} structure positions seeded`);
}
```

### Seed File: `prisma/seeds/site-config.seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSiteConfig() {
  const configs = [
    // General
    {
      key: 'site.name',
      value: 'Pondok Imam Syafii',
      dataType: 'STRING',
      category: 'GENERAL',
      label: 'Site Name',
      description: 'The name of the website',
      isEditable: true,
      isPublic: true,
      sortOrder: 1,
    },
    {
      key: 'site.tagline',
      value: 'Membentuk Generasi Qur\'ani',
      dataType: 'STRING',
      category: 'GENERAL',
      label: 'Site Tagline',
      isEditable: true,
      isPublic: true,
      sortOrder: 2,
    },
    {
      key: 'site.logo.main',
      value: '/images/logo.png',
      dataType: 'STRING',
      category: 'GENERAL',
      label: 'Main Logo URL',
      isEditable: true,
      isPublic: true,
      sortOrder: 3,
    },

    // Navbar
    {
      key: 'navbar.position',
      value: 'sticky',
      dataType: 'STRING',
      category: 'NAVBAR',
      label: 'Navbar Position',
      description: 'Options: fixed, sticky, static',
      isEditable: true,
      isPublic: true,
      sortOrder: 1,
    },
    {
      key: 'navbar.transparent',
      value: 'false',
      dataType: 'BOOLEAN',
      category: 'NAVBAR',
      label: 'Transparent Navbar',
      isEditable: true,
      isPublic: true,
      sortOrder: 2,
    },

    // Footer
    {
      key: 'footer.copyright',
      value: '© 2024 Pondok Imam Syafii. All rights reserved.',
      dataType: 'STRING',
      category: 'FOOTER',
      label: 'Copyright Text',
      isEditable: true,
      isPublic: true,
      sortOrder: 1,
    },
    {
      key: 'footer.showSocialMedia',
      value: 'true',
      dataType: 'BOOLEAN',
      category: 'FOOTER',
      label: 'Show Social Media Icons',
      isEditable: true,
      isPublic: true,
      sortOrder: 2,
    },

    // Features
    {
      key: 'features.blog.enabled',
      value: 'true',
      dataType: 'BOOLEAN',
      category: 'FEATURES',
      label: 'Enable Blog',
      isEditable: true,
      isPublic: false,
      sortOrder: 1,
    },
    {
      key: 'features.donations.enabled',
      value: 'true',
      dataType: 'BOOLEAN',
      category: 'FEATURES',
      label: 'Enable Donations',
      isEditable: true,
      isPublic: false,
      sortOrder: 2,
    },
  ];

  for (const config of configs) {
    await prisma.site_config.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log(`✅ ${configs.length} site configs seeded`);

  // Navbar items
  const navItems = [
    {
      label: 'Beranda',
      labelArabic: 'الرئيسية',
      linkType: 'INTERNAL',
      linkUrl: '/',
      level: 0,
      isActive: true,
      sortOrder: 1,
    },
    {
      label: 'Tentang',
      labelArabic: 'عن',
      linkType: 'INTERNAL',
      linkUrl: '#',
      level: 0,
      isActive: true,
      sortOrder: 2,
    },
    {
      label: 'Lembaga',
      labelArabic: 'المؤسسات',
      linkType: 'INTERNAL',
      linkUrl: '/institutions',
      level: 0,
      isActive: true,
      sortOrder: 3,
    },
    {
      label: 'Berita',
      labelArabic: 'الأخبار',
      linkType: 'INTERNAL',
      linkUrl: '/news',
      level: 0,
      isActive: true,
      sortOrder: 4,
    },
    {
      label: 'Donasi',
      labelArabic: 'التبرعات',
      linkType: 'INTERNAL',
      linkUrl: '/donations',
      level: 0,
      isActive: true,
      sortOrder: 5,
    },
    {
      label: 'Kontak',
      labelArabic: 'اتصل',
      linkType: 'INTERNAL',
      linkUrl: '/contact',
      level: 0,
      isActive: true,
      sortOrder: 6,
    },
  ];

  for (const item of navItems) {
    await prisma.navbar_items.create({ data: item });
  }

  console.log(`✅ ${navItems.length} navbar items seeded`);

  // Footer sections
  const footerSections = [
    {
      title: 'Tentang Kami',
      titleArabic: 'عنا',
      type: 'LINKS',
      content: JSON.stringify({
        items: [
          { label: 'Profil Yayasan', url: '/about/yayasan' },
          { label: 'Visi & Misi', url: '/about/vision-mission' },
          { label: 'Struktur Organisasi', url: '/about/structure' },
        ],
      }),
      column: 1,
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'Kontak',
      titleArabic: 'اتصل',
      type: 'CONTACT',
      content: JSON.stringify({
        address: 'Jl. Raya No. 123, Malang',
        phone: '+62 341 xxxxxxx',
        email: 'info@pondokimamsyafii.com',
        whatsapp: '+62 812 xxxx xxxx',
      }),
      column: 2,
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'Ikuti Kami',
      titleArabic: 'تابعنا',
      type: 'SOCIAL',
      content: JSON.stringify({
        items: [
          { platform: 'facebook', url: 'https://facebook.com/pondokimamsyafii' },
          { platform: 'instagram', url: 'https://instagram.com/pondokimamsyafii' },
          { platform: 'youtube', url: 'https://youtube.com/@pondokimamsyafii' },
        ],
      }),
      column: 3,
      isActive: true,
      sortOrder: 1,
    },
  ];

  for (const section of footerSections) {
    await prisma.footer_sections.create({ data: section });
  }

  console.log(`✅ ${footerSections.length} footer sections seeded`);
}
```

### Seed File: `prisma/seeds/seo.seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSEO() {
  // Global SEO settings
  const seoSettings = await prisma.seo_global_settings.upsert({
    where: { id: 'default-seo' },
    update: {},
    create: {
      id: 'default-seo',
      siteName: 'Pondok Imam Syafii',
      siteNameArabic: 'معهد الإمام الشافعي',
      siteTagline: 'Membentuk Generasi Qur\'ani',
      siteDescription: 'Lembaga pendidikan Islam terpadu yang fokus pada pembentukan karakter Qur\'ani',

      defaultMetaTitle: 'Pondok Imam Syafii - Membentuk Generasi Qur\'ani',
      defaultMetaDescription: 'Lembaga pendidikan Islam terpadu yang menyelenggarakan pendidikan dari TK hingga Pondok Pesantren dengan fokus pada tahfidz Al-Qur\'an dan pembentukan akhlak mulia.',
      defaultMetaKeywords: 'pondok pesantren, pendidikan islam, tahfidz quran, islamic school, boarding school',

      defaultOgImage: '/images/og-default.jpg',
      defaultOgType: 'website',

      googleAnalyticsId: 'G-XXXXXXXXXX',
      sitemapEnabled: true,
      sitemapChangefreq: 'weekly',
      sitemapPriority: 0.5,

      defaultRobotsIndex: true,
      defaultRobotsFollow: true,

      organizationSchema: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Pondok Imam Syafii',
        url: 'https://pondokimamsyafii.com',
        logo: 'https://pondokimamsyafii.com/images/logo.png',
        description: 'Lembaga pendidikan Islam terpadu',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jl. Raya No. 123',
          addressLocality: 'Malang',
          addressRegion: 'Jawa Timur',
          postalCode: '65100',
          addressCountry: 'ID',
        },
      }),
    },
  });

  console.log('✅ SEO global settings seeded:', seoSettings.id);
}
```

### Main Seed File: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { seedOrganization } from './seeds/organization.seed';
import { seedSiteConfig } from './seeds/site-config.seed';
import { seedSEO } from './seeds/seo.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  try {
    await seedOrganization();
    await seedSiteConfig();
    await seedSEO();

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seeds

Add to `package.json`:

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

Run:

```bash
npm run db:seed
```

---

## Testing Migrations

### Test Script: `scripts/test-migrations.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMigrations() {
  console.log('🧪 Testing migrations...\n');

  try {
    // Test organization_info
    console.log('Testing organization_info...');
    const org = await prisma.organization_info.findFirst();
    console.log('✅ organization_info:', org ? 'OK' : 'No data');

    // Test institution_info
    console.log('Testing institution_info...');
    const institutions = await prisma.institution_info.findMany();
    console.log(`✅ institution_info: ${institutions.length} records`);

    // Test site_config
    console.log('Testing site_config...');
    const configs = await prisma.site_config.findMany();
    console.log(`✅ site_config: ${configs.length} records`);

    // Test navbar_items
    console.log('Testing navbar_items...');
    const navItems = await prisma.navbar_items.findMany();
    console.log(`✅ navbar_items: ${navItems.length} records`);

    // Test cms_pages
    console.log('Testing cms_pages...');
    const pages = await prisma.cms_pages.findMany();
    console.log(`✅ cms_pages: ${pages.length} records`);

    // Test general_transactions
    console.log('Testing general_transactions...');
    const transactions = await prisma.general_transactions.findMany();
    console.log(`✅ general_transactions: ${transactions.length} records`);

    // Test seo_global_settings
    console.log('Testing seo_global_settings...');
    const seo = await prisma.seo_global_settings.findFirst();
    console.log('✅ seo_global_settings:', seo ? 'OK' : 'No data');

    console.log('\n✅ All migration tests passed!');
  } catch (error) {
    console.error('\n❌ Migration test failed:', error);
    throw error;
  }
}

testMigrations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run:

```bash
npx tsx scripts/test-migrations.ts
```

---

## Rollback Plan

If you need to rollback a migration:

### Option 1: Migrate to Previous Version

```bash
# List all migrations
npx prisma migrate status

# Rollback to specific migration
npx prisma migrate resolve --rolled-back <migration_name>

# Apply migrations again
npx prisma migrate deploy
```

### Option 2: Manual Rollback (PostgreSQL)

```sql
-- Drop tables in reverse order (respecting dependencies)
DROP TABLE IF EXISTS seo_sitemap_entries;
DROP TABLE IF EXISTS seo_redirects;
DROP TABLE IF EXISTS seo_global_settings;

DROP TABLE IF EXISTS cms_page_revisions;
DROP TABLE IF EXISTS cms_pages;
DROP TABLE IF EXISTS cms_media;
DROP TABLE IF EXISTS cms_categories;

DROP TABLE IF EXISTS transaction_reports;
DROP TABLE IF EXISTS transaction_bulk_entries;
DROP TABLE IF EXISTS general_transactions;

DROP TABLE IF EXISTS footer_sections;
DROP TABLE IF EXISTS navbar_items;
DROP TABLE IF EXISTS site_config;

DROP TABLE IF EXISTS organization_structure;
DROP TABLE IF EXISTS institution_info;
DROP TABLE IF EXISTS organization_info;
```

---

## Production Migration Checklist

Before migrating to production:

- [ ] Full database backup completed
- [ ] All migrations tested on staging
- [ ] Seed data reviewed and approved
- [ ] API endpoints updated to use new models
- [ ] Frontend updated to consume new APIs
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on new models
- [ ] Monitoring configured
- [ ] Rollback plan tested
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified

---

## Post-Migration Tasks

After successful migration:

1. **Verify Data Integrity**
   ```bash
   npx tsx scripts/test-migrations.ts
   ```

2. **Update API Documentation**
   - Update Swagger/OpenAPI specs
   - Update API documentation site

3. **Monitor Performance**
   - Check slow query logs
   - Monitor database load
   - Review index usage

4. **Train Users**
   - Create admin panel tutorials
   - Document new features
   - Conduct training sessions

---

## Troubleshooting

### Common Issues

#### Issue: Migration fails with "relation already exists"

**Solution**: The table might already exist from a previous migration attempt.

```bash
# Reset the database (DEVELOPMENT ONLY!)
npx prisma migrate reset

# Or manually drop the conflicting table
psql -d your_database -c "DROP TABLE IF EXISTS table_name CASCADE;"
```

#### Issue: Foreign key constraint violations

**Solution**: Ensure related tables are created in the correct order. The migration order in this guide respects dependencies.

#### Issue: Data type mismatch

**Solution**: Review the Prisma schema and ensure it matches your PostgreSQL setup:

```bash
npx prisma db pull  # Pull current schema
npx prisma format   # Format the schema
npx prisma migrate dev --create-only  # Create migration without applying
# Review the generated migration file
npx prisma migrate dev  # Apply the migration
```

---

## Support

If you encounter issues:

1. Check Prisma documentation: https://www.prisma.io/docs
2. Review migration logs: Check `.prisma/migrations` folder
3. Consult team lead or database administrator
4. Create detailed issue report with:
   - Error messages
   - Migration step that failed
   - Database version
   - Prisma version

---

## Summary

This migration guide provides:

✅ Step-by-step migration process
✅ Comprehensive seed data
✅ Testing procedures
✅ Rollback strategies
✅ Production checklist
✅ Troubleshooting guide

Follow the phases in order, test thoroughly, and you'll have a successful migration!
