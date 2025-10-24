# Admin-Configurable Content System - Database Schema Documentation

## Overview

This document provides comprehensive documentation for the new admin-configurable content system database schema. The schema is designed to be **ADDITIVE ONLY** - it adds new models without modifying or deleting existing ones, ensuring safe migration.

---

## Table of Contents

1. [Organization Info Management](#1-organization-info-management)
2. [Site Configuration](#2-site-configuration)
3. [Financial Transactions](#3-financial-transactions)
4. [Content Management System](#4-content-management-system)
5. [SEO System](#5-seo-system)
6. [Relationships Diagram](#relationships-diagram)
7. [Migration Strategy](#migration-strategy)
8. [API Considerations](#api-considerations)
9. [Security Considerations](#security-considerations)

---

## 1. Organization Info Management

### 1.1 `organization_info` Model

**Purpose**: Stores top-level foundation (Yayasan) information.

**Key Features**:
- Single source of truth for Yayasan information
- Bilingual support (Indonesian + Arabic)
- Complete contact and legal information
- Vision, mission, about, and history
- Social media integration
- Media assets (logos, images)

**Usage Pattern**:
```typescript
// Typically only ONE active record
const yayasanInfo = await prisma.organization_info.findFirst({
  where: { isActive: true }
});
```

**Fields Breakdown**:
- **Legal**: `registrationNo`, `notarialDeed`, `taxId`, `establishmentDate`
- **Contact**: Full address fields, phone, email, website
- **Content**: Vision, mission, about, history (all with Arabic versions)
- **Structure**: JSON field for organizational hierarchy
- **Media**: `logoUrl`, `logoAltUrl`, `faviconUrl`, `coverImageUrl`
- **Social**: All major social media platforms

**Indexes**:
- `isActive`: For quickly finding the active organization record

---

### 1.2 `institution_info` Model

**Purpose**: Stores information about educational institutions (TK, SD, SMP, Pondok).

**Key Features**:
- Multiple institutions under one foundation
- Institution-specific vision/mission
- Accreditation and registration details
- Programs, facilities, and achievements
- Leadership information
- Individual media galleries

**Usage Pattern**:
```typescript
// Get all active institutions
const institutions = await prisma.institution_info.findMany({
  where: { isActive: true },
  orderBy: { sortOrder: 'asc' }
});

// Get specific institution by type
const tkInfo = await prisma.institution_info.findFirst({
  where: { type: 'TK', isActive: true }
});
```

**Institution Types**:
- `TK`: Taman Kanak-kanak (Kindergarten)
- `SD`: Sekolah Dasar (Elementary School)
- `SMP`: Sekolah Menengah Pertama (Junior High)
- `PONDOK`: Pondok Pesantren (Boarding School)

**JSON Fields**:
- `programs`: Array of educational programs offered
- `facilities`: Array of available facilities
- `achievements`: Array of achievement objects with dates, titles, descriptions
- `galleryImages`: Array of image URLs for photo galleries

**Indexes**:
- `(type, isActive)`: For filtering by institution type
- `code`: Unique identifier for each institution
- `sortOrder`: For ordered display

---

### 1.3 `organization_structure` Model

**Purpose**: Hierarchical organizational structure (Board of Directors, Management, etc.).

**Key Features**:
- Hierarchical parent-child relationships
- Person information with photos
- Position and department tracking
- Terms of service (start/end dates)
- Biographical information

**Usage Pattern**:
```typescript
// Get top-level board members
const boardMembers = await prisma.organization_structure.findMany({
  where: {
    level: 0,
    isActive: true,
    showOnWebsite: true
  },
  orderBy: { sortOrder: 'asc' }
});

// Get department hierarchy
const hierarchy = await prisma.organization_structure.findMany({
  where: { isActive: true },
  orderBy: { level: 'asc', sortOrder: 'asc' }
});
```

**Hierarchy Levels**:
- Level 0: Board of Directors / Foundation Leadership
- Level 1: Directors / Principal Leadership
- Level 2: Department Heads / Managers
- Level 3+: Staff positions

**Indexes**:
- `(parentId, sortOrder)`: For building hierarchical trees
- `(level, isActive)`: For filtering by organizational level

---

## 2. Site Configuration

### 2.1 `site_config` Model

**Purpose**: Key-value store for global site configuration.

**Key Features**:
- Flexible configuration system
- Type-safe values (STRING, JSON, BOOLEAN, NUMBER)
- Categorized settings
- Validation rules support
- Public/private configuration separation

**Configuration Categories**:
- `GENERAL`: Site-wide settings
- `NAVBAR`: Navigation configuration
- `FOOTER`: Footer settings
- `SEO`: SEO defaults
- `THEME`: Appearance settings
- `FEATURES`: Feature flags
- `INTEGRATIONS`: Third-party integrations

**Usage Pattern**:
```typescript
// Get navbar settings
const navbarConfig = await prisma.site_config.findMany({
  where: { category: 'NAVBAR', isPublic: true }
});

// Get specific config
const siteLogo = await prisma.site_config.findUnique({
  where: { key: 'site.logo.main' }
});

// Update config
await prisma.site_config.update({
  where: { key: 'site.name' },
  data: {
    value: 'Pondok Imam Syafii',
    updatedBy: userId
  }
});
```

**Example Configuration Keys**:
```
site.name
site.tagline
site.logo.main
site.logo.dark
site.favicon
navbar.position (fixed, sticky, static)
navbar.transparent
footer.copyright
footer.showSocialMedia
theme.primaryColor
theme.secondaryColor
features.blog.enabled
features.donations.enabled
```

**Data Types**:
- `STRING`: Simple text values
- `JSON`: Complex objects/arrays
- `BOOLEAN`: True/false flags
- `NUMBER`: Numeric values

**Indexes**:
- `(category, key)`: For efficient category-based queries
- `isPublic`: For separating public/admin-only configs

---

### 2.2 `navbar_items` Model

**Purpose**: Dynamic, admin-configurable navigation menu.

**Key Features**:
- Hierarchical menu structure (dropdowns)
- Multiple link types
- Conditional display (mobile/desktop)
- Role-based access control
- Custom styling per item

**Link Types**:
- `INTERNAL`: Internal site paths (/about, /contact)
- `EXTERNAL`: External URLs
- `PAGE`: Link to CMS page by ID
- `CUSTOM`: Custom handling (e.g., modal trigger)

**Usage Pattern**:
```typescript
// Get top-level menu items
const mainMenu = await prisma.navbar_items.findMany({
  where: {
    level: 0,
    isActive: true,
    showOnDesktop: true
  },
  orderBy: { sortOrder: 'asc' }
});

// Get dropdown items for a parent
const dropdownItems = await prisma.navbar_items.findMany({
  where: {
    parentId: parentMenuId,
    isActive: true
  },
  orderBy: { sortOrder: 'asc' }
});
```

**Indexes**:
- `(parentId, sortOrder)`: For building menu trees
- `(isActive, level)`: For filtering active menu items

---

### 2.3 `footer_sections` Model

**Purpose**: Configurable footer sections in column layout.

**Key Features**:
- Multi-column layout (1-4 columns)
- Flexible content types
- JSON-based content structure
- Section ordering

**Section Types**:
- `LINKS`: List of links
- `CONTACT`: Contact information
- `SOCIAL`: Social media links
- `CUSTOM`: Custom HTML/widgets

**Usage Pattern**:
```typescript
// Get all footer sections
const footerSections = await prisma.footer_sections.findMany({
  where: { isActive: true },
  orderBy: [
    { column: 'asc' },
    { sortOrder: 'asc' }
  ]
});
```

**Content Structure Examples**:

**Links Section**:
```json
{
  "items": [
    { "label": "About Us", "url": "/about" },
    { "label": "Contact", "url": "/contact" },
    { "label": "Privacy Policy", "url": "/privacy" }
  ]
}
```

**Contact Section**:
```json
{
  "address": "Jl. Example No. 123",
  "phone": "+62 xxx xxxx xxxx",
  "email": "info@example.com",
  "whatsapp": "+62 xxx xxxx xxxx"
}
```

**Indexes**:
- `(isActive, sortOrder)`: For ordered retrieval
- `column`: For column-based layout

---

## 3. Financial Transactions

### 3.1 `general_transactions` Model

**Purpose**: Comprehensive transaction tracking for income and expenses outside of school billing.

**Key Features**:
- Dual-purpose: General donations AND OTA
- Bulk entry support
- Comprehensive verification workflow
- Flexible categorization
- Recurring transaction support
- Full audit trail

**Transaction Types**:
- `INCOME`: Money received
- `EXPENSE`: Money paid out

**Categories**:
- `DONATION`: General donations
- `OTA`: Orphan support program
- `OPERATIONAL`: Day-to-day operations
- `SALARY`: Staff salaries
- `MAINTENANCE`: Facility maintenance
- `UTILITIES`: Electricity, water, etc.
- `SUPPLIES`: Office and educational supplies
- `EQUIPMENT`: Equipment purchases
- `OTHER`: Miscellaneous

**Usage Pattern**:

**Single Entry**:
```typescript
const transaction = await prisma.general_transactions.create({
  data: {
    transactionNo: 'GEN-2024-0001',
    date: new Date(),
    type: 'INCOME',
    category: 'DONATION',
    amount: 1000000,
    description: 'General donation from donor',
    partyName: 'Ahmad Fulan',
    paymentMethod: 'TRANSFER',
    status: 'PENDING',
    createdBy: userId
  }
});
```

**Bulk Entry**:
```typescript
// 1. Create bulk entry record
const bulkEntry = await prisma.transaction_bulk_entries.create({
  data: {
    bulkEntryNo: 'BULK-2024-0001',
    totalTransactions: 5,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    description: 'January OTA collections',
    createdBy: userId
  }
});

// 2. Create multiple transactions
const transactions = await prisma.general_transactions.createMany({
  data: items.map((item, index) => ({
    ...item,
    bulkEntryId: bulkEntry.id,
    entrySequence: index + 1,
    createdBy: userId
  }))
});
```

**OTA Transactions**:
```typescript
// Create OTA-related transaction
const otaTransaction = await prisma.general_transactions.create({
  data: {
    transactionNo: 'OTA-2024-0001',
    date: new Date(),
    type: 'INCOME',
    category: 'OTA',
    isOtaRelated: true,
    otaProgramId: programId,
    otaMonth: '2024-01',
    otaSponsorId: sponsorId,
    amount: 500000,
    partyName: 'Sponsor Name',
    description: 'OTA sponsorship for January',
    createdBy: userId
  }
});
```

**Indexes**:
- `(date, type)`: For date-range queries
- `(category, subCategory)`: For categorization
- `(status, verifiedAt)`: For verification workflow
- `(isOtaRelated, otaMonth)`: For OTA reporting
- `bulkEntryId`: For bulk entry tracking
- `(fiscalYear, fiscalPeriod)`: For accounting periods

---

### 3.2 `transaction_bulk_entries` Model

**Purpose**: Track bulk entry operations for multiple transactions.

**Key Features**:
- Groups related transactions
- Summary calculations
- Workflow status
- Verification tracking

**Usage Pattern**:
```typescript
// Get bulk entry with all transactions
const bulkEntry = await prisma.transaction_bulk_entries.findUnique({
  where: { id: bulkEntryId }
});

const transactions = await prisma.general_transactions.findMany({
  where: { bulkEntryId: bulkEntry.id },
  orderBy: { entrySequence: 'asc' }
});
```

**Workflow States**:
- `DRAFT`: Being edited
- `SUBMITTED`: Ready for review
- `VERIFIED`: Approved by admin
- `REJECTED`: Rejected with reason

---

### 3.3 `transaction_reports` Model

**Purpose**: Pre-generated financial reports for performance.

**Key Features**:
- Multiple report types
- Cached summary data
- Export files (PDF, Excel)
- Progress tracking for long-running reports

**Report Types**:
- `MONTHLY`: Monthly summary
- `QUARTERLY`: Quarterly summary
- `YEARLY`: Annual report
- `CUSTOM`: Custom date range
- `OTA_SPECIFIC`: OTA program reports

**Usage Pattern**:
```typescript
// Generate new report
const report = await prisma.transaction_reports.create({
  data: {
    reportNo: 'RPT-2024-0001',
    reportType: 'MONTHLY',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    fiscalYear: '2024',
    fiscalPeriod: '01',
    status: 'GENERATING',
    generatedBy: userId
  }
});

// Update with generated data
await prisma.transaction_reports.update({
  where: { id: report.id },
  data: {
    summary: JSON.stringify(summaryData),
    details: JSON.stringify(detailsData),
    chartData: JSON.stringify(chartData),
    pdfUrl: '/reports/report.pdf',
    excelUrl: '/reports/report.xlsx',
    status: 'COMPLETED',
    progress: 100,
    completedAt: new Date()
  }
});
```

---

## 4. Content Management System

### 4.1 `cms_pages` Model

**Purpose**: Full-featured content management for pages, articles, and blog posts.

**Key Features**:
- Multi-purpose content types
- Full SEO metadata
- Version control
- Publishing workflow
- Rich media support
- Access control
- Analytics tracking

**Content Types**:
- `PAGE`: Static pages (About, Contact, etc.)
- `ARTICLE`: Blog articles
- `POST`: News posts
- `NEWS`: News announcements

**Publishing Workflow**:
```
DRAFT → PUBLISHED
      → SCHEDULED → PUBLISHED
      → ARCHIVED
```

**Usage Pattern**:

**Create Page**:
```typescript
const page = await prisma.cms_pages.create({
  data: {
    slug: 'about-us',
    title: 'About Us',
    titleArabic: 'من نحن',
    content: '<p>Content here...</p>',
    contentArabic: '<p>Arabic content...</p>',
    excerpt: 'Brief summary',
    type: 'PAGE',
    status: 'PUBLISHED',
    publishedAt: new Date(),

    // SEO
    metaTitle: 'About Us - Pondok Imam Syafii',
    metaDescription: 'Learn about our institution...',

    // Open Graph
    ogTitle: 'About Pondok Imam Syafii',
    ogDescription: 'Learn about our institution...',
    ogImage: '/images/og-about.jpg',

    createdBy: userId
  }
});
```

**Create Article with Scheduling**:
```typescript
const article = await prisma.cms_pages.create({
  data: {
    slug: 'ramadan-2024-announcement',
    title: 'Ramadan 2024 Schedule',
    content: '<p>Article content...</p>',
    type: 'ARTICLE',
    category: 'announcements',
    tags: JSON.stringify(['ramadan', 'schedule', '2024']),
    status: 'SCHEDULED',
    scheduledFor: new Date('2024-03-01T00:00:00'),
    featuredImage: '/images/ramadan.jpg',
    authorId: userId,
    authorName: 'Admin',
    createdBy: userId
  }
});
```

**Query Published Articles**:
```typescript
const articles = await prisma.cms_pages.findMany({
  where: {
    type: 'ARTICLE',
    status: 'PUBLISHED',
    isDeleted: false
  },
  orderBy: { publishedAt: 'desc' },
  take: 10
});
```

**SEO Fields**:

**Basic SEO**:
- `metaTitle`: Page title for search engines
- `metaDescription`: Meta description
- `metaKeywords`: Meta keywords

**Open Graph** (Facebook, LinkedIn):
- `ogTitle`: OG title
- `ogDescription`: OG description
- `ogImage`: OG image URL
- `ogType`: OG type (article, website, etc.)

**Twitter Card**:
- `twitterCard`: Card type (summary, summary_large_image)
- `twitterTitle`: Twitter-specific title
- `twitterDescription`: Twitter-specific description
- `twitterImage`: Twitter-specific image

**Advanced SEO**:
- `canonicalUrl`: Canonical URL to prevent duplicates
- `robotsIndex`: Allow search engine indexing
- `robotsFollow`: Allow following links
- `structuredData`: JSON-LD structured data

**Indexes**:
- `slug`: Unique page identifier
- `(type, status)`: Filter by type and status
- `(category, publishedAt)`: Category browsing
- `(isFeatured, publishedAt)`: Featured content
- `(status, scheduledFor)`: Scheduled publishing
- `(authorId, publishedAt)`: Author's content

---

### 4.2 `cms_page_revisions` Model

**Purpose**: Version history for content changes.

**Key Features**:
- Full content snapshots
- Change tracking
- Version rollback capability

**Usage Pattern**:
```typescript
// Create revision before updating
await prisma.cms_page_revisions.create({
  data: {
    pageId: page.id,
    version: page.version,
    title: page.title,
    content: page.content,
    excerpt: page.excerpt,
    changesSummary: 'Updated introduction paragraph',
    createdBy: userId
  }
});

// Update page and increment version
await prisma.cms_pages.update({
  where: { id: page.id },
  data: {
    content: newContent,
    version: { increment: 1 },
    updatedBy: userId
  }
});
```

---

### 4.3 `cms_categories` Model

**Purpose**: Hierarchical categorization for articles and pages.

**Key Features**:
- Parent-child hierarchy
- SEO metadata per category
- Visual customization (icons, colors)

**Usage Pattern**:
```typescript
// Create parent category
const parent = await prisma.cms_categories.create({
  data: {
    name: 'News',
    nameArabic: 'أخبار',
    slug: 'news',
    description: 'Latest news and updates',
    icon: 'newspaper',
    color: '#3B82F6',
    createdBy: userId
  }
});

// Create child category
const child = await prisma.cms_categories.create({
  data: {
    parentId: parent.id,
    level: 1,
    name: 'School Events',
    slug: 'school-events',
    createdBy: userId
  }
});
```

---

### 4.4 `cms_media` Model

**Purpose**: Centralized media library management.

**Key Features**:
- File metadata tracking
- Folder organization
- Usage tracking
- SEO-friendly alt text

**Usage Pattern**:
```typescript
// Upload and register media
const media = await prisma.cms_media.create({
  data: {
    filename: 'img-123.jpg',
    originalName: 'school-building.jpg',
    fileUrl: '/uploads/img-123.jpg',
    thumbnailUrl: '/uploads/thumbs/img-123.jpg',
    mimeType: 'image/jpeg',
    fileSize: 245680,
    width: 1920,
    height: 1080,
    folder: '/images/buildings',
    altText: 'Main school building',
    caption: 'Our beautiful school building',
    uploadedBy: userId
  }
});

// Track usage
await prisma.cms_media.update({
  where: { id: media.id },
  data: { usageCount: { increment: 1 } }
});
```

---

## 5. SEO System

### 5.1 `seo_global_settings` Model

**Purpose**: Site-wide SEO configuration (typically only ONE record).

**Key Features**:
- Default meta tags
- Verification codes for search engines
- Analytics integration
- Structured data defaults
- Robots.txt management

**Usage Pattern**:
```typescript
// Get global SEO settings
const seoSettings = await prisma.seo_global_settings.findFirst();

// Update settings
await prisma.seo_global_settings.update({
  where: { id: seoSettings.id },
  data: {
    siteName: 'Pondok Imam Syafii',
    siteTagline: 'Islamic Education Excellence',
    defaultMetaDescription: 'Premier Islamic educational institution...',
    googleAnalyticsId: 'G-XXXXXXXXXX',
    organizationSchema: JSON.stringify(orgSchemaLD),
    updatedBy: userId
  }
});
```

**Verification Codes**:
- `googleVerification`: Google Search Console
- `bingVerification`: Bing Webmaster Tools
- `yandexVerification`: Yandex Webmaster
- `pinterestVerification`: Pinterest verification

**Analytics**:
- `googleAnalyticsId`: GA4 tracking ID
- `googleTagManagerId`: GTM container ID
- `facebookPixelId`: Facebook Pixel ID

---

### 5.2 `seo_redirects` Model

**Purpose**: Manage 301/302 redirects for SEO preservation.

**Key Features**:
- Multiple redirect types
- Hit tracking
- Active/inactive toggle

**Redirect Types**:
- `301`: Permanent redirect
- `302`: Temporary redirect
- `307`: Temporary redirect (method preserved)
- `308`: Permanent redirect (method preserved)

**Usage Pattern**:
```typescript
// Create redirect
await prisma.seo_redirects.create({
  data: {
    fromPath: '/old-about-page',
    toPath: '/about',
    redirectType: 301,
    reason: 'Page restructuring',
    isActive: true,
    createdBy: userId
  }
});

// Track redirect hit
await prisma.seo_redirects.update({
  where: { fromPath: '/old-about-page' },
  data: {
    hitCount: { increment: 1 },
    lastHitAt: new Date()
  }
});
```

---

### 5.3 `seo_sitemap_entries` Model

**Purpose**: Dynamic sitemap generation with full control.

**Key Features**:
- Custom change frequency
- Priority settings
- Multi-language support
- Image/video sitemap support

**Usage Pattern**:
```typescript
// Add page to sitemap
await prisma.seo_sitemap_entries.create({
  data: {
    loc: 'https://example.com/about',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date(),
    contentType: 'PAGE',
    contentId: page.id,
    alternates: JSON.stringify([
      { lang: 'id', url: 'https://example.com/about' },
      { lang: 'ar', url: 'https://example.com/ar/about' }
    ]),
    images: JSON.stringify([
      { loc: 'https://example.com/images/about.jpg', title: 'About Us' }
    ]),
    isActive: true
  }
});

// Generate sitemap XML
const entries = await prisma.seo_sitemap_entries.findMany({
  where: { isActive: true },
  orderBy: { lastmod: 'desc' }
});
```

---

## Relationships Diagram

```
organization_info (1) ──> Foundation-level data
                          (Vision, Mission, Contact)

institution_info (*) ───> Individual institutions
                          (TK, SD, SMP, Pondok)
                          Each with own data

organization_structure (*) ──> Hierarchical structure
                               (Board, Directors, Staff)
                               parentId → self-referential

site_config (*) ──────────> Key-value configuration
                            (categorized by type)

navbar_items (*) ─────────> Navigation menu
                            parentId → self-referential
                            pageId → cms_pages

footer_sections (*) ──────> Footer layout
                            (column-based)

general_transactions (*) ─> All financial transactions
    │
    ├─> transaction_bulk_entries (m:1)
    │
    └─> Links to ota_programs (optional)

transaction_bulk_entries (1) ──> (*) general_transactions

transaction_reports (*) ──> Pre-generated reports

cms_pages (*) ────────────> Content pages/articles
    │
    ├─> cms_page_revisions (1:*)
    │
    ├─> cms_categories (m:1)
    │
    └─> cms_media (m:*) via JSON arrays

cms_categories (*) ───────> Category hierarchy
                            parentId → self-referential

cms_media (*) ────────────> Media library

seo_global_settings (1) ──> Site-wide SEO

seo_redirects (*) ────────> URL redirects

seo_sitemap_entries (*) ──> Sitemap entries
                            contentId → various models
```

---

## Migration Strategy

### Phase 1: Core Models
1. `organization_info`
2. `institution_info`
3. `organization_structure`

### Phase 2: Configuration
4. `site_config`
5. `navbar_items`
6. `footer_sections`

### Phase 3: Transactions
7. `general_transactions`
8. `transaction_bulk_entries`
9. `transaction_reports`

### Phase 4: CMS
10. `cms_categories`
11. `cms_media`
12. `cms_pages`
13. `cms_page_revisions`

### Phase 5: SEO
14. `seo_global_settings`
15. `seo_redirects`
16. `seo_sitemap_entries`

### Migration Commands

```bash
# Add models to schema.prisma incrementally
# After adding each phase, run:

# 1. Format the schema
npx prisma format

# 2. Generate migration
npx prisma migrate dev --name add_phase_1_organization_models

# 3. Generate Prisma Client
npx prisma generate

# 4. Test the migration
npm run test:migration
```

### Rollback Strategy

All models support soft deletes (`isDeleted`, `deletedAt`), so:
- No data is ever permanently lost
- Models can be deprecated by adding a flag
- Migrations are additive, so rollback is rarely needed

---

## API Considerations

### Public vs. Admin APIs

**Public APIs** (no auth required):
- Published CMS pages/articles
- Organization info
- Institution info
- Published organizational structure
- Public site config
- Navbar items
- Footer sections

**Admin APIs** (auth required):
- All CRUD operations
- Draft content
- Transaction management
- Bulk operations
- Reports generation
- SEO management

### Caching Strategy

**Cache Keys**:
```
org:info:active
institution:type:{type}
site:config:{category}
navbar:items:main
footer:sections:all
cms:page:{slug}
cms:articles:featured
seo:global:settings
sitemap:entries:all
```

**Cache Invalidation**:
- On update: Clear specific cache key
- On bulk update: Clear category cache
- On publish: Clear related content caches

### Pagination

Standard pagination for list endpoints:
```typescript
{
  page: 1,
  limit: 20,
  total: 150,
  totalPages: 8,
  data: [...]
}
```

---

## Security Considerations

### 1. Input Validation

**Required for all text fields**:
- HTML sanitization for rich text
- XSS prevention
- SQL injection prevention (Prisma handles this)

### 2. File Uploads

**Media uploads**:
- File type validation
- File size limits
- Virus scanning
- Secure file storage

### 3. Access Control

**Role-based permissions**:
```typescript
// Example permission checks
const canEdit = await checkPermission(userId, 'cms.pages.edit');
const canPublish = await checkPermission(userId, 'cms.pages.publish');
const canDelete = await checkPermission(userId, 'cms.pages.delete');
```

### 4. Audit Trail

Track all changes:
```typescript
// Always include in mutations
{
  createdBy: userId,
  updatedBy: userId,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 5. Rate Limiting

Apply rate limits on:
- Content creation
- Bulk operations
- Report generation
- Media uploads

---

## Performance Optimization

### 1. Indexes

All models include strategic indexes on:
- Foreign keys
- Filter fields (status, type, category)
- Sort fields (sortOrder, publishedAt)
- Search fields (slug, name)

### 2. JSON Fields

Use JSON sparingly and:
- Keep JSON documents small
- Index frequently queried JSON paths (PostgreSQL)
- Consider extraction to separate table if frequently queried

### 3. N+1 Query Prevention

Use Prisma `include` and `select`:
```typescript
const pages = await prisma.cms_pages.findMany({
  include: {
    category: true,
    author: true
  }
});
```

### 4. Pagination

Always paginate large result sets:
```typescript
const pages = await prisma.cms_pages.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

---

## Best Practices

### 1. Soft Deletes

Always soft delete, never hard delete:
```typescript
// Don't do this
await prisma.cms_pages.delete({ where: { id } });

// Do this
await prisma.cms_pages.update({
  where: { id },
  data: {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId
  }
});
```

### 2. Transactions

Use transactions for multi-model operations:
```typescript
await prisma.$transaction([
  prisma.cms_pages.create({ data: pageData }),
  prisma.cms_page_revisions.create({ data: revisionData }),
  prisma.seo_sitemap_entries.create({ data: sitemapData })
]);
```

### 3. Validation

Validate before database operations:
```typescript
const schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  content: z.string().min(1)
});

const validated = schema.parse(input);
```

### 4. Error Handling

Handle Prisma errors properly:
```typescript
try {
  await prisma.cms_pages.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new Error('Slug already exists');
  }
  throw error;
}
```

---

## Summary

This schema provides a comprehensive, production-ready foundation for an admin-configurable content system with:

✅ **Organization Management**: Complete foundation and institution information
✅ **Site Configuration**: Flexible, admin-controllable site settings
✅ **Financial Tracking**: Robust transaction system with bulk entry and reporting
✅ **Content Management**: Full-featured CMS with SEO and publishing workflow
✅ **SEO System**: Complete SEO control with redirects and sitemaps

All models follow best practices:
- Soft deletes
- Audit trails
- Proper indexing
- Type safety
- Migration safety (additive only)

The schema is ready for production use and can be extended as needed.
