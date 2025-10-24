# Implementation Checklist

This checklist helps you integrate the SEO and validation implementations into your Pondok Imam Syafii project.

## Phase 1: SEO Implementation

### 1.1 Homepage SEO

- [ ] Update `/src/app/page.tsx`:
  ```typescript
  import { StructuredData } from '@/lib/seo/structured-data';
  import { generateOrganizationSchema, generateLocalBusinessSchema } from '@/lib/seo/metadata';

  // Add in component
  <StructuredData data={[
    generateOrganizationSchema(),
    generateLocalBusinessSchema(),
  ]} />
  ```

- [ ] Update root layout (`/src/app/layout.tsx`):
  ```typescript
  import { generatePageMetadata } from '@/lib/seo/metadata';

  export const metadata = generatePageMetadata({
    title: 'Pondok Pesantren Imam Syafii Blitar',
    description: 'Yayasan Imam Syafi\'i Blitar - Terwujudnya generasi Islam sesuai Al Qur\'an dan As-Sunnah',
  });
  ```

### 1.2 About Pages

- [ ] `/src/app/about/yayasan/page.tsx` - Add metadata
- [ ] `/src/app/about/pondok/page.tsx` - Add metadata
- [ ] `/src/app/about/tk/page.tsx` - Add metadata with CourseSchema
- [ ] `/src/app/about/sd/page.tsx` - Add metadata with CourseSchema
- [ ] `/src/app/about/pengajar/page.tsx` - Add metadata with breadcrumbs

### 1.3 PPDB Pages

- [ ] `/src/app/ppdb/page.tsx`:
  ```typescript
  export async function generateMetadata() {
    return generatePageMetadata({
      title: 'PPDB 2024 - Pendaftaran Peserta Didik Baru',
      description: 'Pendaftaran Peserta Didik Baru Pondok Imam Syafii Blitar tahun ajaran 2024/2025',
      keywords: ['PPDB', 'pendaftaran', 'pesantren', 'blitar', '2024'],
    });
  }
  ```

- [ ] `/src/app/ppdb/register/page.tsx` - Add metadata
- [ ] `/src/app/ppdb/status/page.tsx` - Add metadata

### 1.4 Donation Pages

- [ ] `/src/app/donasi/page.tsx` - Add metadata + breadcrumbs
- [ ] `/src/app/donasi/donate/page.tsx` - Add metadata
- [ ] `/src/app/donasi/ota/page.tsx` - Add metadata
- [ ] `/src/app/donasi/zakat-calculator/page.tsx` - Add metadata
- [ ] `/src/app/donasi/campaign/[slug]/page.tsx`:
  ```typescript
  export async function generateMetadata({ params }) {
    const campaign = await getCampaign(params.slug);

    return generatePageMetadata({
      title: campaign.title,
      description: campaign.description,
      image: campaign.mainImage,
    });
  }

  // Add ArticleSchema
  <StructuredData data={generateArticleSchema({
    title: campaign.title,
    description: campaign.description,
    datePublished: campaign.createdAt.toISOString(),
    dateModified: campaign.updatedAt.toISOString(),
    authorName: 'Pondok Imam Syafii',
    image: campaign.mainImage,
    url: `${SITE_CONFIG.url}/donasi/campaign/${campaign.slug}`,
  })} />
  ```

### 1.5 Other Pages

- [ ] `/src/app/tanya-ustadz/page.tsx` - Add metadata + FAQSchema if applicable

## Phase 2: Validation Implementation

### 2.1 PPDB Registration Form

- [ ] Update `/src/app/ppdb/register/page.tsx`:
  ```typescript
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { ppdbRegistrationSchema } from '@/lib/validations/ppdb';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ppdbRegistrationSchema),
    mode: 'onBlur',
  });
  ```

- [ ] Add error messages to all form fields
- [ ] Test all validation rules
- [ ] Add loading states
- [ ] Add success/error toast notifications

### 2.2 PPDB API Route

- [ ] Update `/src/app/api/ppdb/register/route.ts`:
  ```typescript
  import { validateRequest } from '@/lib/validations/server';
  import { ppdbRegistrationSchema } from '@/lib/validations/ppdb';

  export async function POST(request: NextRequest) {
    const validation = await validateRequest(request, ppdbRegistrationSchema);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Process validated data
  }
  ```

- [ ] Test with valid data
- [ ] Test with invalid data
- [ ] Test edge cases
- [ ] Add proper error logging

### 2.3 Donation Form

- [ ] Update `/src/app/donasi/donate/page.tsx`:
  ```typescript
  import { zodResolver } from '@hookform/resolvers/zod';
  import { donationSchema } from '@/lib/validations/donation';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(donationSchema),
  });
  ```

- [ ] Add quick amount buttons
- [ ] Add anonymous checkbox handler
- [ ] Add error messages
- [ ] Test all validation rules

### 2.4 Donation API Route

- [ ] Update `/src/app/api/donations/create/route.ts`:
  ```typescript
  import { validateRequest } from '@/lib/validations/server';
  import { donationSchema } from '@/lib/validations/donation';

  export async function POST(request: NextRequest) {
    const validation = await validateRequest(request, donationSchema);
    // ... handle validation
  }
  ```

- [ ] Test with valid data
- [ ] Test amount limits
- [ ] Test anonymous donations
- [ ] Add proper error handling

### 2.5 OTA Sponsorship

- [ ] Update OTA form with `otaSponsorSchema`
- [ ] Update OTA API route with validation
- [ ] Test recurring sponsorship
- [ ] Test month format validation

### 2.6 Zakat Calculator

- [ ] Update calculator form with `zakatCalculationSchema`
- [ ] Add conditional validation per zakat type
- [ ] Test all 5 zakat types
- [ ] Test calculation accuracy

### 2.7 File Uploads

- [ ] Implement file upload in PPDB:
  ```typescript
  import { validateFile } from '@/lib/validations/server';

  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  });
  ```

- [ ] Add file size/type validation
- [ ] Add preview functionality
- [ ] Test upload limits
- [ ] Add progress indicators

## Phase 3: Testing

### 3.1 Unit Tests

- [ ] Install testing dependencies (already in package.json)
- [ ] Run unit tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Ensure > 85% coverage
- [ ] Fix any failing tests

### 3.2 E2E Tests

- [ ] Install Playwright browsers: `npx playwright install`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Test PPDB registration flow
- [ ] Test donation flow
- [ ] Test accessibility
- [ ] Fix any failing tests

### 3.3 Manual Testing

PPDB Flow:
- [ ] Navigate to /ppdb
- [ ] Click "Daftar Sekarang"
- [ ] Try submitting empty form (should show errors)
- [ ] Fill valid data
- [ ] Submit successfully
- [ ] Check registration number displayed

Donation Flow:
- [ ] Navigate to /donasi
- [ ] Click campaign
- [ ] Click "Donasi Sekarang"
- [ ] Test amount validation
- [ ] Test anonymous option
- [ ] Complete donation
- [ ] Check payment instructions

## Phase 4: SEO Configuration

### 4.1 Environment Variables

- [ ] Add to `.env.local`:
  ```
  NEXT_PUBLIC_APP_URL=https://pondokimamsyafii.org
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code
  ```

- [ ] Update in production environment

### 4.2 Google Search Console

- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Add property: `https://pondokimamsyafii.org`
- [ ] Verify ownership (HTML tag method)
- [ ] Submit sitemap: `https://pondokimamsyafii.org/sitemap.xml`
- [ ] Wait 24-48 hours for indexing

### 4.3 Sitemap & Robots

- [ ] Test sitemap: Visit `/sitemap.xml`
- [ ] Verify all pages included
- [ ] Test robots.txt: Visit `/robots.txt`
- [ ] Verify correct rules

### 4.4 Schema Validation

- [ ] Visit [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test homepage
- [ ] Test campaign pages
- [ ] Fix any errors
- [ ] Verify all schemas valid

## Phase 5: Performance Optimization

### 5.1 Lighthouse Audit

- [ ] Run Lighthouse on homepage
- [ ] Run Lighthouse on PPDB page
- [ ] Run Lighthouse on donation page
- [ ] Target scores: Performance > 90, SEO = 100
- [ ] Fix any issues

### 5.2 Image Optimization

- [ ] Convert images to WebP/AVIF
- [ ] Use next/image for all images
- [ ] Add proper alt text
- [ ] Test lazy loading
- [ ] Compress large images

### 5.3 Caching

- [ ] Verify PWA service worker active
- [ ] Test offline functionality
- [ ] Check cache headers
- [ ] Monitor cache hit rates

## Phase 6: Monitoring Setup

### 6.1 Analytics

- [ ] Add Google Analytics:
  ```typescript
  import { Analytics } from '@vercel/analytics/react';

  <Analytics />
  ```

- [ ] Add Speed Insights:
  ```typescript
  import { SpeedInsights } from '@vercel/speed-insights/next';

  <SpeedInsights />
  ```

### 6.2 Error Tracking

- [ ] Set up Sentry (optional):
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard -i nextjs
  ```

- [ ] Configure error boundaries
- [ ] Test error reporting

### 6.3 Monitoring Dashboard

- [ ] Set up Vercel Analytics
- [ ] Monitor Core Web Vitals
- [ ] Set up alerts for errors
- [ ] Monitor form conversion rates

## Phase 7: Documentation

### 7.1 Update README

- [ ] Add SEO section
- [ ] Add validation section
- [ ] Add testing instructions
- [ ] Add deployment instructions

### 7.2 Create Runbooks

- [ ] SEO maintenance runbook
- [ ] Validation troubleshooting
- [ ] Testing procedures
- [ ] Deployment procedures

### 7.3 Training

- [ ] Train team on SEO best practices
- [ ] Train team on validation system
- [ ] Train team on testing procedures
- [ ] Create video tutorials if needed

## Phase 8: Deployment

### 8.1 Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Database backup created
- [ ] Rollback plan ready

### 8.2 Deployment

- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Verify sitemap accessible
- [ ] Verify robots.txt accessible
- [ ] Check all forms working

### 8.3 Post-Deployment

- [ ] Monitor error logs
- [ ] Check form submissions
- [ ] Verify SEO tags in production
- [ ] Submit sitemap to GSC
- [ ] Monitor performance metrics

### 8.4 Rollback (if needed)

- [ ] Revert deployment
- [ ] Restore database backup
- [ ] Verify rollback successful
- [ ] Investigate issues
- [ ] Fix and redeploy

## Phase 9: Continuous Improvement

### 9.1 Weekly Tasks

- [ ] Review GSC for errors
- [ ] Check Core Web Vitals
- [ ] Monitor form conversion rates
- [ ] Review validation errors

### 9.2 Monthly Tasks

- [ ] Run full Lighthouse audit
- [ ] Review and update meta descriptions
- [ ] Analyze top pages
- [ ] Update structured data if needed

### 9.3 Quarterly Tasks

- [ ] Comprehensive SEO audit
- [ ] Review validation rules
- [ ] Update test coverage
- [ ] Competitive analysis
- [ ] Update documentation

## Success Criteria

### SEO
- ✅ Lighthouse SEO Score: 100
- ✅ All pages indexed in Google
- ✅ Rich results showing in search
- ✅ Core Web Vitals: All green
- ✅ Mobile-friendly test: Pass

### Validation
- ✅ All forms validated client + server
- ✅ Clear error messages
- ✅ XSS prevention active
- ✅ File uploads validated
- ✅ No validation bypass possible

### Testing
- ✅ Unit test coverage > 85%
- ✅ All E2E tests passing
- ✅ Critical flows tested
- ✅ Accessibility tests passing
- ✅ CI/CD pipeline working

### Performance
- ✅ Page load < 3 seconds
- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1
- ✅ PWA installable

## Troubleshooting

### Sitemap not updating
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Validation not working
- Check Zod version compatibility
- Verify schema imports
- Check resolver setup
- Review error messages

### Tests failing
- Update snapshots if needed: `npm test -- -u`
- Check Playwright browsers installed
- Verify test data validity
- Review test environment setup

### SEO tags not showing
- Check metadata export
- Verify generateMetadata function
- Check for TypeScript errors
- Review Next.js documentation

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Playwright](https://playwright.dev/)
- [Google Search Console](https://search.google.com/search-console)

## Support

For issues or questions:
1. Check documentation in `/docs/`
2. Review test files for examples
3. Check Next.js official docs
4. Contact development team

---

**Last Updated:** October 24, 2025
**Version:** 1.0.0
