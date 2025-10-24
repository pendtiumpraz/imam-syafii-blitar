# API Quick Reference - Admin-Configurable Content System

## Overview

This document provides quick reference for common API operations using the new schema models.

---

## Organization Management

### Get Foundation Information

```typescript
// GET /api/organization/info
const getOrganizationInfo = async () => {
  return await prisma.organization_info.findFirst({
    where: { isActive: true }
  });
};
```

### Update Foundation Information

```typescript
// PUT /api/organization/info/:id
const updateOrganizationInfo = async (id: string, data: any) => {
  return await prisma.organization_info.update({
    where: { id },
    data: {
      ...data,
      updatedBy: userId,
    }
  });
};
```

### Get All Institutions

```typescript
// GET /api/institutions
const getInstitutions = async (type?: string) => {
  return await prisma.institution_info.findMany({
    where: {
      isActive: true,
      ...(type && { type })
    },
    orderBy: { sortOrder: 'asc' }
  });
};
```

### Get Organizational Structure

```typescript
// GET /api/organization/structure
const getOrgStructure = async () => {
  const allPositions = await prisma.organization_structure.findMany({
    where: {
      isActive: true,
      showOnWebsite: true
    },
    orderBy: [
      { level: 'asc' },
      { sortOrder: 'asc' }
    ]
  });

  // Build hierarchy
  const buildTree = (parentId: string | null, level: number) => {
    return allPositions
      .filter(p => p.parentId === parentId && p.level === level)
      .map(p => ({
        ...p,
        children: buildTree(p.id, level + 1)
      }));
  };

  return buildTree(null, 0);
};
```

---

## Site Configuration

### Get Site Config

```typescript
// GET /api/config
const getSiteConfig = async (category?: string) => {
  return await prisma.site_config.findMany({
    where: {
      isPublic: true,
      ...(category && { category })
    },
    orderBy: { sortOrder: 'asc' }
  });
};

// Convert to key-value object
const getConfigObject = async (category?: string) => {
  const configs = await getSiteConfig(category);
  return configs.reduce((acc, config) => {
    let value = config.value;

    // Parse based on dataType
    if (config.dataType === 'JSON') {
      value = JSON.parse(value || '{}');
    } else if (config.dataType === 'BOOLEAN') {
      value = value === 'true';
    } else if (config.dataType === 'NUMBER') {
      value = parseFloat(value || '0');
    }

    acc[config.key] = value;
    return acc;
  }, {} as Record<string, any>);
};
```

### Update Site Config

```typescript
// PUT /api/config/:key
const updateSiteConfig = async (key: string, value: any) => {
  const config = await prisma.site_config.findUnique({
    where: { key }
  });

  if (!config || !config.isEditable) {
    throw new Error('Config not found or not editable');
  }

  let stringValue = value;
  if (config.dataType === 'JSON') {
    stringValue = JSON.stringify(value);
  } else if (config.dataType === 'BOOLEAN') {
    stringValue = value ? 'true' : 'false';
  } else if (config.dataType === 'NUMBER') {
    stringValue = value.toString();
  }

  return await prisma.site_config.update({
    where: { key },
    data: {
      value: stringValue,
      updatedBy: userId
    }
  });
};
```

### Get Navbar Menu

```typescript
// GET /api/navbar
const getNavbarMenu = async () => {
  const items = await prisma.navbar_items.findMany({
    where: { isActive: true },
    orderBy: [
      { level: 'asc' },
      { sortOrder: 'asc' }
    ]
  });

  // Build hierarchical menu
  const buildMenu = (parentId: string | null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildMenu(item.id)
      }));
  };

  return buildMenu(null);
};
```

### Get Footer Sections

```typescript
// GET /api/footer
const getFooterSections = async () => {
  const sections = await prisma.footer_sections.findMany({
    where: { isActive: true },
    orderBy: [
      { column: 'asc' },
      { sortOrder: 'asc' }
    ]
  });

  // Parse content JSON
  return sections.map(section => ({
    ...section,
    content: JSON.parse(section.content)
  }));
};
```

---

## Financial Transactions

### Create Transaction

```typescript
// POST /api/transactions
const createTransaction = async (data: {
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  partyName?: string;
  paymentMethod?: string;
  proofUrl?: string;
}) => {
  // Generate transaction number
  const count = await prisma.general_transactions.count({
    where: {
      date: {
        gte: new Date(new Date().getFullYear(), 0, 1),
        lt: new Date(new Date().getFullYear() + 1, 0, 1)
      }
    }
  });

  const year = new Date().getFullYear();
  const number = (count + 1).toString().padStart(4, '0');
  const transactionNo = `${data.type}-${year}-${number}`;

  return await prisma.general_transactions.create({
    data: {
      transactionNo,
      date: data.date,
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description,
      partyName: data.partyName,
      paymentMethod: data.paymentMethod,
      proofUrl: data.proofUrl,
      status: 'PENDING',
      createdBy: userId
    }
  });
};
```

### Create Bulk Transactions

```typescript
// POST /api/transactions/bulk
const createBulkTransactions = async (data: {
  description: string;
  transactions: Array<{
    date: Date;
    type: string;
    category: string;
    amount: number;
    description: string;
  }>;
}) => {
  // Create bulk entry
  const bulkEntry = await prisma.transaction_bulk_entries.create({
    data: {
      bulkEntryNo: `BULK-${Date.now()}`,
      totalTransactions: data.transactions.length,
      startDate: data.transactions[0].date,
      endDate: data.transactions[data.transactions.length - 1].date,
      description: data.description,
      status: 'DRAFT',
      createdBy: userId,

      totalIncome: data.transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0),

      totalExpense: data.transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0),
    }
  });

  // Create transactions
  const transactions = await Promise.all(
    data.transactions.map(async (txn, index) => {
      const transactionNo = `${txn.type}-${Date.now()}-${index + 1}`;

      return await prisma.general_transactions.create({
        data: {
          transactionNo,
          bulkEntryId: bulkEntry.id,
          entrySequence: index + 1,
          ...txn,
          status: 'PENDING',
          createdBy: userId
        }
      });
    })
  );

  return { bulkEntry, transactions };
};
```

### Get Transaction Report

```typescript
// GET /api/transactions/report
const getTransactionReport = async (params: {
  startDate: Date;
  endDate: Date;
  category?: string;
  type?: string;
}) => {
  const transactions = await prisma.general_transactions.findMany({
    where: {
      date: {
        gte: params.startDate,
        lte: params.endDate
      },
      isDeleted: false,
      status: 'VERIFIED',
      ...(params.category && { category: params.category }),
      ...(params.type && { type: params.type })
    },
    orderBy: { date: 'asc' }
  });

  // Calculate summary
  const summary = {
    totalIncome: transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0),

    totalExpense: transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0),

    netAmount: 0,

    byCategory: {} as Record<string, number>,

    count: transactions.length
  };

  summary.netAmount = summary.totalIncome - summary.totalExpense;

  // Group by category
  transactions.forEach(t => {
    const amount = Number(t.amount);
    if (!summary.byCategory[t.category]) {
      summary.byCategory[t.category] = 0;
    }
    summary.byCategory[t.category] += t.type === 'INCOME' ? amount : -amount;
  });

  return { summary, transactions };
};
```

---

## Content Management

### Create Page/Article

```typescript
// POST /api/cms/pages
const createPage = async (data: {
  slug: string;
  title: string;
  content: string;
  type: 'PAGE' | 'ARTICLE' | 'POST' | 'NEWS';
  category?: string;
  excerpt?: string;
  featuredImage?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  scheduledFor?: Date;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
}) => {
  return await prisma.cms_pages.create({
    data: {
      slug: data.slug,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      type: data.type,
      category: data.category,
      featuredImage: data.featuredImage,
      status: data.status || 'DRAFT',
      scheduledFor: data.scheduledFor,

      // SEO defaults
      metaTitle: data.metaTitle || data.title,
      metaDescription: data.metaDescription || data.excerpt,

      // Author
      authorId: userId,
      authorName: userName,

      // Publishing
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,

      createdBy: userId
    }
  });
};
```

### Update Page with Revision

```typescript
// PUT /api/cms/pages/:id
const updatePage = async (id: string, data: any) => {
  const currentPage = await prisma.cms_pages.findUnique({
    where: { id }
  });

  if (!currentPage) {
    throw new Error('Page not found');
  }

  // Create revision before updating
  await prisma.cms_page_revisions.create({
    data: {
      pageId: currentPage.id,
      version: currentPage.version,
      title: currentPage.title,
      content: currentPage.content,
      excerpt: currentPage.excerpt,
      changesSummary: data.changesSummary || 'Page updated',
      createdBy: userId
    }
  });

  // Update page
  return await prisma.cms_pages.update({
    where: { id },
    data: {
      ...data,
      version: { increment: 1 },
      lastEditedBy: userId,
      updatedBy: userId
    }
  });
};
```

### Get Published Pages

```typescript
// GET /api/cms/pages
const getPages = async (params: {
  type?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const where = {
    status: 'PUBLISHED',
    isDeleted: false,
    publishedAt: { lte: new Date() },
    ...(params.type && { type: params.type }),
    ...(params.category && { category: params.category })
  };

  const [pages, total] = await Promise.all([
    prisma.cms_pages.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        publishedAt: true,
        authorName: true,
        viewCount: true,
        readingTime: true
      }
    }),
    prisma.cms_pages.count({ where })
  ]);

  return {
    data: pages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

### Get Page by Slug

```typescript
// GET /api/cms/pages/:slug
const getPageBySlug = async (slug: string) => {
  const page = await prisma.cms_pages.findUnique({
    where: { slug },
    include: {
      // Optional: include related data
    }
  });

  if (!page || page.isDeleted) {
    throw new Error('Page not found');
  }

  if (page.status !== 'PUBLISHED') {
    throw new Error('Page not published');
  }

  // Increment view count
  await prisma.cms_pages.update({
    where: { id: page.id },
    data: { viewCount: { increment: 1 } }
  });

  return page;
};
```

### Upload Media

```typescript
// POST /api/cms/media
const uploadMedia = async (file: File, metadata: {
  folder?: string;
  altText?: string;
  caption?: string;
}) => {
  // Upload file to storage (S3, Cloudinary, etc.)
  const uploadResult = await uploadFile(file);

  // Register in database
  return await prisma.cms_media.create({
    data: {
      filename: uploadResult.filename,
      originalName: file.name,
      fileUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      mimeType: file.type,
      fileSize: file.size,
      width: uploadResult.width,
      height: uploadResult.height,
      folder: metadata.folder || '/',
      altText: metadata.altText,
      caption: metadata.caption,
      uploadedBy: userId
    }
  });
};
```

---

## SEO Management

### Get Global SEO Settings

```typescript
// GET /api/seo/global
const getGlobalSEO = async () => {
  const settings = await prisma.seo_global_settings.findFirst();

  if (!settings) {
    // Return defaults if not configured
    return {
      siteName: 'Pondok Imam Syafii',
      defaultMetaTitle: 'Pondok Imam Syafii',
      defaultMetaDescription: 'Islamic Educational Institution',
      defaultRobotsIndex: true,
      defaultRobotsFollow: true
    };
  }

  return settings;
};
```

### Create Redirect

```typescript
// POST /api/seo/redirects
const createRedirect = async (data: {
  fromPath: string;
  toPath: string;
  redirectType?: number;
  reason?: string;
}) => {
  return await prisma.seo_redirects.create({
    data: {
      fromPath: data.fromPath,
      toPath: data.toPath,
      redirectType: data.redirectType || 301,
      reason: data.reason,
      isActive: true,
      createdBy: userId
    }
  });
};
```

### Generate Sitemap

```typescript
// GET /api/sitemap.xml
const generateSitemap = async () => {
  const entries = await prisma.seo_sitemap_entries.findMany({
    where: { isActive: true },
    orderBy: { lastmod: 'desc' }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `
  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod.toISOString()}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>
`).join('')}
</urlset>`;

  return xml;
};
```

---

## Common Queries

### Dashboard Statistics

```typescript
// GET /api/dashboard/stats
const getDashboardStats = async () => {
  const [
    totalIncome,
    totalExpense,
    totalPages,
    publishedPages,
    draftPages
  ] = await Promise.all([
    prisma.general_transactions.aggregate({
      where: {
        type: 'INCOME',
        isDeleted: false,
        status: 'VERIFIED'
      },
      _sum: { amount: true }
    }),

    prisma.general_transactions.aggregate({
      where: {
        type: 'EXPENSE',
        isDeleted: false,
        status: 'VERIFIED'
      },
      _sum: { amount: true }
    }),

    prisma.cms_pages.count({
      where: { isDeleted: false }
    }),

    prisma.cms_pages.count({
      where: {
        status: 'PUBLISHED',
        isDeleted: false
      }
    }),

    prisma.cms_pages.count({
      where: {
        status: 'DRAFT',
        isDeleted: false
      }
    })
  ]);

  return {
    finance: {
      totalIncome: totalIncome._sum.amount || 0,
      totalExpense: totalExpense._sum.amount || 0,
      netBalance: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0)
    },
    content: {
      totalPages,
      publishedPages,
      draftPages
    }
  };
};
```

### Search Content

```typescript
// GET /api/search
const searchContent = async (query: string) => {
  return await prisma.cms_pages.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } }
      ],
      status: 'PUBLISHED',
      isDeleted: false
    },
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      type: true,
      publishedAt: true
    }
  });
};
```

---

## Response Formats

### Success Response

```typescript
{
  success: true,
  data: {...},
  message?: "Operation successful"
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Error message",
    details?: {...}
  }
}
```

### Paginated Response

```typescript
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

---

## Validation Schemas (Zod Examples)

### Page Validation

```typescript
import { z } from 'zod';

const pageSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  type: z.enum(['PAGE', 'ARTICLE', 'POST', 'NEWS']),
  category: z.string().optional(),
  featuredImage: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),

  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional()
});
```

### Transaction Validation

```typescript
const transactionSchema = z.object({
  date: z.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),

  partyName: z.string().optional(),
  paymentMethod: z.string().optional(),
  proofUrl: z.string().url().optional()
});
```

---

## Summary

This quick reference provides common API patterns for:

✅ Organization management
✅ Site configuration
✅ Financial transactions
✅ Content management
✅ SEO operations
✅ Common queries
✅ Validation schemas

Use these examples as starting points and adapt them to your specific needs!
