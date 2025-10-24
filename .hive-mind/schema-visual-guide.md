# Schema Visual Guide

## Database Schema Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN-CONFIGURABLE CONTENT SYSTEM                │
│                          16 Models / 5 Domains                       │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ 1. ORGANIZATION DOMAIN (3 Models)                                     │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────┐                                            │
│   │ organization_info   │  ◄─── Foundation-level data                │
│   ├─────────────────────┤                                            │
│   │ • name              │       • Vision & Mission                   │
│   │ • vision/mission    │       • Contact info                       │
│   │ • contact details   │       • Social media                       │
│   │ • social media      │       • Legal info                         │
│   │ • structure (JSON)  │                                            │
│   └─────────────────────┘                                            │
│                                                                       │
│   ┌─────────────────────┐                                            │
│   │ institution_info    │  ◄─── TK, SD, SMP, Pondok                  │
│   ├─────────────────────┤                                            │
│   │ • type (TK/SD/...)  │       • Individual vision/mission          │
│   │ • accreditation     │       • Programs & facilities              │
│   │ • capacity          │       • Leadership info                    │
│   │ • programs (JSON)   │                                            │
│   └─────────────────────┘                                            │
│                                                                       │
│   ┌──────────────────────────┐                                       │
│   │ organization_structure   │  ◄─── Hierarchical org chart          │
│   ├──────────────────────────┤                                       │
│   │ • parentId (self-ref)    │       • Board of Directors            │
│   │ • level (0,1,2,...)      │       • Management                    │
│   │ • position name          │       • Staff positions               │
│   │ • person details         │                                       │
│   └──────────────────────────┘                                       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ 2. SITE CONFIGURATION DOMAIN (3 Models)                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────┐                                                │
│   │  site_config    │  ◄─── Key-value configuration store            │
│   ├─────────────────┤                                                │
│   │ • key (unique)  │       Categories:                              │
│   │ • value         │       • GENERAL                                │
│   │ • dataType      │       • NAVBAR                                 │
│   │ • category      │       • FOOTER                                 │
│   │ • isEditable    │       • SEO                                    │
│   │ • isPublic      │       • THEME                                  │
│   └─────────────────┘       • FEATURES                               │
│                                                                       │
│   ┌─────────────────────┐                                            │
│   │   navbar_items      │  ◄─── Dynamic navigation menu              │
│   ├─────────────────────┤                                            │
│   │ • parentId          │       • Hierarchical structure             │
│   │ • level             │       • Dropdown support                   │
│   │ • label/icon        │       • Multiple link types                │
│   │ • linkType/linkUrl  │       • Role-based visibility              │
│   │ • pageId (FK)       │───────┐                                    │
│   └─────────────────────┘       │                                    │
│                                 │                                    │
│   ┌─────────────────────┐       │                                    │
│   │  footer_sections    │       │   ◄─── Configurable footer         │
│   ├─────────────────────┤       │                                    │
│   │ • title             │       │       • Column-based layout        │
│   │ • type              │       │       • LINKS, CONTACT, SOCIAL     │
│   │ • content (JSON)    │       │       • Flexible content           │
│   │ • column (1-4)      │       │                                    │
│   └─────────────────────┘       │                                    │
│                                 │                                    │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────┐
│ 3. FINANCIAL TRANSACTIONS (3 Models)                                 │
├─────────────────────────────────┼───────────────────────────────────┤
│                                 │                                    │
│   ┌─────────────────────────────┐                                    │
│   │  general_transactions       │  ◄─── All financial transactions   │
│   ├─────────────────────────────┤                                    │
│   │ • transactionNo (unique)    │       • Income & Expense           │
│   │ • type (INCOME/EXPENSE)     │       • General donations          │
│   │ • category                  │       • OTA donations              │
│   │ • amount                    │       • Operational costs          │
│   │ • description               │       • Verification workflow      │
│   │ • bulkEntryId (FK)          │───┐                                │
│   │ • isOtaRelated              │   │                                │
│   │ • otaProgramId (FK)         │───┼───► Links to ota_programs      │
│   └─────────────────────────────┘   │                                │
│                                     │                                │
│   ┌──────────────────────────────┐  │                                │
│   │ transaction_bulk_entries     │◄─┘  ◄─── Bulk entry tracking      │
│   ├──────────────────────────────┤                                   │
│   │ • bulkEntryNo (unique)       │       • Groups transactions       │
│   │ • totalTransactions          │       • Summary calculations      │
│   │ • totalIncome/Expense        │       • Workflow status           │
│   │ • status (DRAFT/VERIFIED)    │                                   │
│   └──────────────────────────────┘                                   │
│                                                                       │
│   ┌──────────────────────┐                                           │
│   │ transaction_reports  │  ◄─── Pre-generated reports               │
│   ├──────────────────────┤                                           │
│   │ • reportNo           │       • Monthly/Quarterly/Yearly          │
│   │ • reportType         │       • Custom date ranges                │
│   │ • summary (JSON)     │       • OTA-specific reports              │
│   │ • pdfUrl/excelUrl    │       • Cached data                       │
│   └──────────────────────┘                                           │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ 4. CONTENT MANAGEMENT SYSTEM (4 Models)                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────┐        ┌─────────────────────┐             │
│   │  cms_categories     │        │    cms_media        │             │
│   ├─────────────────────┤        ├─────────────────────┤             │
│   │ • name/slug         │        │ • filename          │             │
│   │ • parentId          │◄───┐   │ • fileUrl           │             │
│   │ • description       │    │   │ • mimeType          │             │
│   │ • icon/color        │    │   │ • fileSize          │             │
│   └─────────────────────┘    │   │ • width/height      │             │
│            ▲                 │   │ • altText           │             │
│            │                 │   └─────────────────────┘             │
│            │                 │            ▲                          │
│            │                 │            │ (referenced via JSON)    │
│            │                 │            │                          │
│   ┌────────┴──────────────────────────────┴───────────────────┐      │
│   │              cms_pages                                    │      │
│   ├───────────────────────────────────────────────────────────┤      │
│   │ • slug (unique)                                           │      │
│   │ • title/content/excerpt                                   │      │
│   │ • type (PAGE/ARTICLE/POST/NEWS)                           │      │
│   │ • category ────────────────────────────────────────────┘  │      │
│   │ • status (DRAFT/PUBLISHED/SCHEDULED)                      │      │
│   │ • featuredImage/galleryImages (JSON)                      │      │
│   │                                                            │      │
│   │ SEO Fields:                                                │      │
│   │ • metaTitle/metaDescription/metaKeywords                   │      │
│   │ • ogTitle/ogDescription/ogImage                            │      │
│   │ • twitterCard/twitterTitle/twitterDescription              │      │
│   │ • canonicalUrl/robotsIndex/robotsFollow                    │      │
│   │ • structuredData (JSON-LD)                                 │      │
│   │                                                            │      │
│   │ Analytics:                                                 │      │
│   │ • viewCount/shareCount/likeCount                           │      │
│   │                                                            │      │
│   │ Publishing:                                                │      │
│   │ • publishedAt/scheduledFor                                 │      │
│   └────────────────────────────────────────────────────────────┤      │
│            │                                                          │
│            │                                                          │
│            ▼                                                          │
│   ┌─────────────────────────┐                                        │
│   │  cms_page_revisions     │  ◄─── Version history                  │
│   ├─────────────────────────┤                                        │
│   │ • pageId (FK)           │       • Content snapshots              │
│   │ • version               │       • Change tracking                │
│   │ • title/content         │       • Rollback support               │
│   │ • changesSummary        │                                        │
│   └─────────────────────────┘                                        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ 5. SEO SYSTEM (3 Models)                                              │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────────────────────┐                                       │
│   │ seo_global_settings      │  ◄─── Site-wide SEO config             │
│   ├──────────────────────────┤       (Usually 1 record)              │
│   │ • siteName/tagline       │                                        │
│   │ • defaultMetaTitle       │       • Default meta tags             │
│   │ • defaultMetaDescription │       • Verification codes            │
│   │ • googleVerification     │       • Analytics IDs                 │
│   │ • googleAnalyticsId      │       • Structured data               │
│   │ • organizationSchema     │       • Robots.txt                    │
│   │ • robotsTxt              │                                        │
│   │ • sitemapEnabled         │                                        │
│   └──────────────────────────┘                                       │
│                                                                       │
│   ┌──────────────────────┐                                           │
│   │   seo_redirects      │  ◄─── URL redirects                       │
│   ├──────────────────────┤                                           │
│   │ • fromPath (unique)  │       • 301/302/307/308                   │
│   │ • toPath             │       • Hit tracking                      │
│   │ • redirectType       │       • Active/inactive                   │
│   │ • hitCount           │                                           │
│   └──────────────────────┘                                           │
│                                                                       │
│   ┌─────────────────────────┐                                        │
│   │ seo_sitemap_entries     │  ◄─── Dynamic sitemap                  │
│   ├─────────────────────────┤                                        │
│   │ • loc (URL, unique)     │       • Change frequency               │
│   │ • changefreq            │       • Priority                       │
│   │ • priority              │       • Multi-language support         │
│   │ • lastmod               │       • Image/video sitemaps           │
│   │ • contentType/contentId │                                        │
│   │ • alternates (JSON)     │                                        │
│   │ • images/videos (JSON)  │                                        │
│   └─────────────────────────┘                                        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Publishing Content

```
┌─────────┐       ┌───────────┐       ┌──────────────┐       ┌─────────┐
│ Editor  │──────►│ cms_pages │──────►│ cms_page_    │──────►│ Sitemap │
│ Creates │       │  (DRAFT)  │       │  revisions   │       │ Update  │
└─────────┘       └───────────┘       └──────────────┘       └─────────┘
                        │
                        ▼
                  ┌───────────┐
                  │ cms_pages │
                  │(PUBLISHED)│
                  └───────────┘
                        │
                        ▼
                  ┌─────────────────┐
                  │ seo_sitemap_    │
                  │    entries      │
                  └─────────────────┘
```

### Flow 2: Financial Transaction Entry

```
┌─────────┐       ┌──────────────────┐       ┌────────────┐
│ Finance │──────►│     general_     │──────►│  Verify    │
│  Staff  │       │   transactions   │       │   Status   │
└─────────┘       │    (PENDING)     │       └────────────┘
                  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐
                  │     general_     │
                  │   transactions   │
                  │   (VERIFIED)     │
                  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐
                  │   transaction_   │
                  │     reports      │
                  └──────────────────┘
```

### Flow 3: Bulk Transaction Entry

```
┌─────────┐       ┌─────────────────────┐       ┌──────────────────┐
│ Finance │──────►│  transaction_bulk_  │──────►│    Multiple      │
│  Staff  │       │     entries         │       │ general_trans... │
└─────────┘       │     (DRAFT)         │       │   (PENDING)      │
                  └─────────────────────┘       └──────────────────┘
                          │                              │
                          │                              │
                          ▼                              ▼
                  ┌─────────────────────┐       ┌──────────────────┐
                  │  transaction_bulk_  │       │    Multiple      │
                  │     entries         │       │ general_trans... │
                  │    (SUBMITTED)      │       │   (VERIFIED)     │
                  └─────────────────────┘       └──────────────────┘
```

---

## Relationship Patterns

### Self-Referential Hierarchies

```
organization_structure
├── Level 0: Board of Directors
│   ├── Chairman (parentId: null)
│   └── Vice Chairman (parentId: null)
│
├── Level 1: Directors
│   ├── Pondok Director (parentId: Chairman.id)
│   ├── SD Director (parentId: Chairman.id)
│   └── TK Director (parentId: Chairman.id)
│
└── Level 2: Department Heads
    ├── Academic Head (parentId: PondokDirector.id)
    ├── Finance Head (parentId: PondokDirector.id)
    └── Student Affairs (parentId: PondokDirector.id)
```

### Categorization

```
cms_categories
├── News (parentId: null)
│   ├── School News (parentId: News.id)
│   ├── Community News (parentId: News.id)
│   └── Events (parentId: News.id)
│
└── Blog (parentId: null)
    ├── Islamic Studies (parentId: Blog.id)
    ├── Education Tips (parentId: Blog.id)
    └── Student Life (parentId: Blog.id)
```

---

## Index Strategy

### High-Traffic Queries

```sql
-- Most common: Get published pages
SELECT * FROM cms_pages
WHERE status = 'PUBLISHED' AND isDeleted = false
ORDER BY publishedAt DESC;
-- ✅ Index: (status, isDeleted, publishedAt)

-- Get transactions by date range
SELECT * FROM general_transactions
WHERE date BETWEEN ? AND ?
  AND isDeleted = false;
-- ✅ Index: (date, isDeleted)

-- Get navbar menu
SELECT * FROM navbar_items
WHERE isActive = true AND level = 0
ORDER BY sortOrder;
-- ✅ Index: (isActive, level, sortOrder)
```

### Foreign Key Indexes

```sql
-- All foreign key fields are indexed
-- Examples:
cms_pages.categoryId         ─► cms_categories.id
navbar_items.pageId          ─► cms_pages.id
cms_page_revisions.pageId    ─► cms_pages.id
general_transactions.bulkEntryId ─► transaction_bulk_entries.id
```

---

## JSON Field Structures

### site_config.value (when dataType = 'JSON')

```json
{
  "primaryColor": "#3B82F6",
  "secondaryColor": "#10B981",
  "fontFamily": "Inter, sans-serif",
  "borderRadius": "0.5rem"
}
```

### institution_info.programs

```json
[
  {
    "name": "Tahfidz Al-Qur'an",
    "target": "5 Juz",
    "duration": "6 years"
  },
  {
    "name": "Bilingual Program",
    "languages": ["Arabic", "English"],
    "hours": 10
  }
]
```

### cms_pages.galleryImages

```json
[
  {
    "url": "/images/gallery-1.jpg",
    "alt": "School building",
    "caption": "Our main building"
  },
  {
    "url": "/images/gallery-2.jpg",
    "alt": "Classroom",
    "caption": "Modern classroom"
  }
]
```

### footer_sections.content

```json
{
  "items": [
    {
      "label": "About Us",
      "url": "/about"
    },
    {
      "label": "Contact",
      "url": "/contact"
    }
  ]
}
```

---

## Common Query Patterns

### Organization Info

```typescript
// Get complete organization data
const orgData = {
  foundation: await prisma.organization_info.findFirst({
    where: { isActive: true }
  }),

  institutions: await prisma.institution_info.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  }),

  leadership: await prisma.organization_structure.findMany({
    where: {
      level: { lte: 1 },
      isActive: true,
      showOnWebsite: true
    },
    orderBy: { sortOrder: 'asc' }
  })
};
```

### Site Layout

```typescript
// Get navbar and footer for layout
const layout = {
  config: await getConfigObject('NAVBAR'),

  navbar: await prisma.navbar_items.findMany({
    where: { isActive: true, level: 0 },
    orderBy: { sortOrder: 'asc' }
  }),

  footer: await prisma.footer_sections.findMany({
    where: { isActive: true },
    orderBy: [
      { column: 'asc' },
      { sortOrder: 'asc' }
    ]
  })
};
```

### Blog Homepage

```typescript
// Get featured articles and recent posts
const blogData = {
  featured: await prisma.cms_pages.findMany({
    where: {
      type: 'ARTICLE',
      isFeatured: true,
      status: 'PUBLISHED',
      isDeleted: false
    },
    take: 3,
    orderBy: { publishedAt: 'desc' }
  }),

  recent: await prisma.cms_pages.findMany({
    where: {
      type: 'ARTICLE',
      status: 'PUBLISHED',
      isDeleted: false
    },
    take: 10,
    orderBy: { publishedAt: 'desc' }
  }),

  categories: await prisma.cms_categories.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
};
```

---

## Performance Considerations

### Caching Strategy

```
┌─────────────────────┐
│  High Cache Priority │
├─────────────────────┤
│ • organization_info  │  Cache: 24 hours
│ • institution_info   │  Cache: 24 hours
│ • site_config        │  Cache: 1 hour
│ • navbar_items       │  Cache: 1 hour
│ • footer_sections    │  Cache: 1 hour
│ • seo_global_settings│ Cache: 24 hours
└─────────────────────┘

┌─────────────────────┐
│ Medium Cache Priority│
├─────────────────────┤
│ • cms_categories     │  Cache: 1 hour
│ • cms_pages (list)   │  Cache: 15 minutes
└─────────────────────┘

┌─────────────────────┐
│  No Cache / Short   │
├─────────────────────┤
│ • cms_pages (detail) │  Cache: 5 minutes (invalidate on update)
│ • transactions       │  No cache (real-time data)
│ • reports            │  Cache: Until regenerated
└─────────────────────┘
```

---

## Summary

This visual guide provides:

✅ Architecture overview of all 16 models
✅ Data flow diagrams for common operations
✅ Relationship patterns and hierarchies
✅ Index strategy visualization
✅ JSON structure examples
✅ Query pattern templates
✅ Performance and caching strategy

Use this guide alongside the detailed documentation for a complete understanding of the schema design.
