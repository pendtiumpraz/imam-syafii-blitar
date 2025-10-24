# SEO Implementation Guide

## Overview

This document describes the comprehensive SEO implementation for the Pondok Imam Syafii website, following Next.js 14 best practices and Google Search Console requirements.

## Table of Contents

1. [Metadata Configuration](#metadata-configuration)
2. [Structured Data (Schema.org)](#structured-data)
3. [Sitemap Generation](#sitemap-generation)
4. [Robots.txt Configuration](#robotstxt-configuration)
5. [Image Optimization](#image-optimization)
6. [Performance Optimization](#performance-optimization)
7. [Testing & Validation](#testing--validation)

## Metadata Configuration

### Global Configuration

Located in `/src/lib/seo/metadata.ts`, this file contains:

- Site-wide configuration (name, description, URLs)
- Metadata generation utilities
- Schema.org structured data generators

### Usage Example

```typescript
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata = generatePageMetadata({
  title: 'PPDB 2024',
  description: 'Pendaftaran Peserta Didik Baru Pondok Imam Syafii Blitar tahun ajaran 2024/2025',
  keywords: ['PPDB', 'pendaftaran', 'pesantren', 'blitar'],
  canonical: 'https://pondokimamsyafii.org/ppdb',
});
```

### Page-Level Metadata

Each page should implement `generateMetadata` function:

```typescript
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Your Page Title',
    description: 'Your page description',
    keywords: ['relevant', 'keywords'],
  });
}
```

## Structured Data

### Available Schemas

1. **Organization Schema** - For homepage
2. **LocalBusiness Schema** - For contact/location pages
3. **Article Schema** - For blog posts and announcements
4. **Course Schema** - For education programs
5. **Event Schema** - For activities and events
6. **FAQ Schema** - For frequently asked questions
7. **Breadcrumb Schema** - For navigation

### Implementation Example

```typescript
import { StructuredData } from '@/lib/seo/structured-data';
import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
} from '@/lib/seo/metadata';

export default function HomePage() {
  return (
    <>
      <StructuredData
        data={[
          generateOrganizationSchema(),
          generateLocalBusinessSchema(),
        ]}
      />
      {/* Page content */}
    </>
  );
}
```

### Campaign/Article Page Example

```typescript
import { generateArticleSchema } from '@/lib/seo/metadata';

const articleSchema = generateArticleSchema({
  title: campaign.title,
  description: campaign.description,
  datePublished: campaign.createdAt.toISOString(),
  dateModified: campaign.updatedAt.toISOString(),
  authorName: 'Pondok Imam Syafii',
  image: campaign.mainImage,
  url: `https://pondokimamsyafii.org/donasi/campaign/${campaign.slug}`,
});

<StructuredData data={articleSchema} />
```

## Sitemap Generation

### Location

`/src/app/sitemap.ts`

### Features

- **Static Routes**: Core pages (home, about, contact, etc.)
- **Dynamic Routes**: Generated from database
  - Donation campaigns
  - Teachers/Ustadz profiles
  - Announcements
- **Priority Levels**:
  - 1.0: Homepage, PPDB, Donation pages
  - 0.9: About pages, Active campaigns
  - 0.8: Other important pages
  - 0.7: Secondary pages
- **Change Frequency**: Optimized per content type
- **Last Modified**: From database timestamps

### Accessing Sitemap

```
https://pondokimamsyafii.org/sitemap.xml
```

### Update Frequency

- Sitemap regenerates on each request (in production)
- Caches for performance
- Includes up to 100 most recent items per category

## Robots.txt Configuration

### Location

`/src/app/robots.ts`

### Rules

**Allowed for all bots:**
- Public pages (/, /about, /ppdb, /donasi)
- Static assets

**Disallowed:**
- `/api/` - API routes
- `/dashboard/` - Admin dashboard
- `/(authenticated)/` - Authenticated routes
- `/parent-portal/` - Parent portal
- `/auth/` - Authentication pages
- `/ppdb/payment/` - Payment pages

### Accessing Robots.txt

```
https://pondokimamsyafii.org/robots.txt
```

## Image Optimization

### Next.js Image Component

All images use Next.js `<Image>` component for automatic optimization:

```typescript
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="Descriptive alt text"
  width={1200}
  height={630}
  priority // for above-the-fold images
  placeholder="blur" // for better UX
/>
```

### Configuration

From `next.config.js`:

```javascript
{
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  }
}
```

### Best Practices

1. Always provide descriptive `alt` text
2. Use appropriate image dimensions
3. Use `priority` prop for hero images
4. Compress images before upload
5. Use WebP/AVIF format when possible

## Performance Optimization

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Implemented Optimizations

1. **Code Splitting**: Automatic via Next.js
2. **Dynamic Imports**: For heavy components
3. **Font Optimization**: Using next/font
4. **PWA Support**: Service worker for offline access
5. **CDN**: Vercel Edge Network
6. **Compression**: Gzip/Brotli enabled
7. **Caching**:
   - Static pages: ISR (Incremental Static Regeneration)
   - Images: 30-day cache
   - API: Strategic caching

### Monitoring

Use built-in Next.js analytics:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Testing & Validation

### 1. Google Search Console

**Setup:**
1. Add site property in GSC
2. Verify ownership using HTML tag method
3. Add verification meta tag to `/src/app/layout.tsx`:

```typescript
export const metadata = {
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};
```

**Submit Sitemap:**
```
https://pondokimamsyafii.org/sitemap.xml
```

### 2. Schema.org Validation

**Tools:**
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

**Testing:**
1. Copy page URL
2. Paste into validator
3. Check for errors/warnings
4. Fix issues and retest

### 3. Lighthouse Audit

**Run Audit:**
```bash
npm install -g lighthouse
lighthouse https://pondokimamsyafii.org --view
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: 100

### 4. Manual Testing

**Checklist:**
- [ ] All pages have unique titles
- [ ] All pages have meta descriptions
- [ ] All images have alt text
- [ ] Sitemap loads correctly
- [ ] Robots.txt loads correctly
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Canonical URLs set correctly
- [ ] Mobile-responsive design
- [ ] Fast page load times

### 5. Automated Testing

Run SEO tests:
```bash
npm run test:e2e -- seo.spec.ts
```

## Best Practices

### Content Guidelines

1. **Title Tags**:
   - Length: 50-60 characters
   - Include primary keyword
   - Unique per page
   - Format: "Page Title | Site Name"

2. **Meta Descriptions**:
   - Length: 150-160 characters
   - Include call-to-action
   - Summarize page content
   - Include target keywords

3. **Headings**:
   - One H1 per page
   - Logical hierarchy (H1 > H2 > H3)
   - Include keywords naturally
   - Descriptive and clear

4. **URLs**:
   - Use kebab-case
   - Include keywords
   - Keep short and descriptive
   - Avoid special characters

5. **Images**:
   - Descriptive alt text
   - Compress before upload
   - Use next/image component
   - Lazy load below fold

### Technical Guidelines

1. **Mobile-First**: Ensure mobile experience is excellent
2. **Page Speed**: Target < 3s load time
3. **Security**: Always use HTTPS
4. **Accessibility**: Follow WCAG 2.1 AA standards
5. **Structured Data**: Implement relevant schemas
6. **Internal Linking**: Link related content
7. **External Links**: Use rel="noopener noreferrer"

## Monitoring & Maintenance

### Weekly Tasks

- [ ] Check Google Search Console for errors
- [ ] Review Core Web Vitals
- [ ] Check for broken links
- [ ] Monitor search rankings

### Monthly Tasks

- [ ] Run full Lighthouse audit
- [ ] Update sitemap if needed
- [ ] Review and update meta descriptions
- [ ] Analyze top-performing pages
- [ ] Check mobile usability

### Quarterly Tasks

- [ ] Comprehensive SEO audit
- [ ] Update structured data
- [ ] Review and update content
- [ ] Competitive analysis
- [ ] Update target keywords

## Resources

### Documentation

- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Web.dev](https://web.dev/)

### Tools

- [Google Search Console](https://search.google.com/search-console)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://github.com/GoogleChrome/lighthouse)
- [Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/)

### Chrome Extensions

- [Lighthouse](https://chrome.google.com/webstore/detail/lighthouse/)
- [SEO Meta in 1 Click](https://chrome.google.com/webstore/detail/seo-meta-in-1-click/)
- [Detailed SEO Extension](https://chrome.google.com/webstore/detail/detailed-seo-extension/)

## Support

For questions or issues, contact the development team or refer to the Next.js documentation.
