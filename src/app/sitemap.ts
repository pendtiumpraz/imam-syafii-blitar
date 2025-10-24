import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://imamsyafiiblitar.ponpes.id';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about/yayasan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about/pondok`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about/tk`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about/sd`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about/pengajar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about/struktur`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ppdb`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/ppdb/register`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ppdb/status`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/donasi`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/donasi/donate`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/donasi/ota`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/donasi/zakat-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tanya-ustadz`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Dynamic routes - Donation Campaigns
    const campaigns = await prisma.donation_campaigns.findMany({
      where: {
        status: 'ACTIVE',
        isDeleted: false,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((campaign) => ({
      url: `${BASE_URL}/donasi/campaign/${campaign.slug}`,
      lastModified: campaign.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Dynamic routes - Teachers/Ustadz
    const teachers = await prisma.teachers.findMany({
      where: {
        status: 'ACTIVE',
        isDeleted: false,
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const teacherRoutes: MetadataRoute.Sitemap = teachers.map((teacher) => ({
      url: `${BASE_URL}/about/pengajar/${teacher.id}`,
      lastModified: teacher.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    // Dynamic routes - Announcements (if public)
    const announcements = await prisma.announcements.findMany({
      where: {
        status: 'PUBLISHED',
        isDeleted: false,
        publishDate: {
          lte: new Date(),
        },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        publishDate: 'desc',
      },
      take: 100,
    });

    const announcementRoutes: MetadataRoute.Sitemap = announcements.map((announcement) => ({
      url: `${BASE_URL}/announcements/${announcement.id}`,
      lastModified: announcement.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...campaignRoutes, ...teacherRoutes, ...announcementRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static routes if database query fails
    return staticRoutes;
  }
}
