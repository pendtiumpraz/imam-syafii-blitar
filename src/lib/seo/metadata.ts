import { Metadata } from 'next';

export const SITE_CONFIG = {
  name: 'Pondok Pesantren Imam Syafi\'i Blitar',
  shortName: 'Imam Syafi\'i',
  description: 'Yayasan Imam Syafi\'i Blitar - Terwujudnya generasi Islam sesuai Al Qur\'an dan As-Sunnah dengan manhaj Ahlussunnah Wal Jama\'ah',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pondokimamsyafii.org',
  ogImage: '/images/og-image.jpg',
  links: {
    facebook: 'https://facebook.com/pondokimamsyafii',
    instagram: 'https://instagram.com/pondokimamsyafii',
    youtube: 'https://youtube.com/@pondokimamsyafii',
    whatsapp: 'https://wa.me/6281234567890',
  },
  contact: {
    email: 'info@pondokimamsyafii.org',
    phone: '+62 812-3456-7890',
    address: 'Jl. Raya Imam Syafi\'i, Blitar, Jawa Timur 66171',
  },
  keywords: [
    'pondok pesantren',
    'pesantren blitar',
    'imam syafii',
    'pendidikan islam',
    'madrasah',
    'tahfidz',
    'TK Islam',
    'SD Islam',
    'SMP Islam',
    'boarding school',
    'islamic education',
    'blitar',
    'jawa timur',
  ],
};

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  image,
  canonical,
  noindex = false,
  nofollow = false,
}: PageSEO): Metadata {
  const fullTitle = title.includes(SITE_CONFIG.shortName)
    ? title
    : `${title} | ${SITE_CONFIG.shortName}`;

  const ogImage = image || SITE_CONFIG.ogImage;
  const url = canonical || SITE_CONFIG.url;
  const allKeywords = [...SITE_CONFIG.keywords, ...keywords];

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,

    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url,
      title: fullTitle,
      description,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@pondokimamsyafii',
    },

    // Alternate languages
    alternates: {
      canonical: url,
      languages: {
        'id-ID': url,
      },
    },

    // Robots
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icon-512x512.png`,
    description: SITE_CONFIG.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Raya Imam Syafi\'i',
      addressLocality: 'Blitar',
      addressRegion: 'Jawa Timur',
      postalCode: '66171',
      addressCountry: 'ID',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.contact.phone,
      contactType: 'customer service',
      email: SITE_CONFIG.contact.email,
      availableLanguage: ['Indonesian', 'Arabic'],
    },
    sameAs: Object.values(SITE_CONFIG.links),
  };
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.url}#localbusiness`,
    name: SITE_CONFIG.name,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    telephone: SITE_CONFIG.contact.phone,
    email: SITE_CONFIG.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Raya Imam Syafi\'i',
      addressLocality: 'Blitar',
      addressRegion: 'Jawa Timur',
      postalCode: '66171',
      addressCountry: 'ID',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -8.0983,
      longitude: 112.1681,
    },
    url: SITE_CONFIG.url,
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '06:00',
        closes: '21:00',
      },
    ],
  };
}

export function generateArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  authorName,
  image,
  url,
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || SITE_CONFIG.ogImage,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/icon-512x512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export function generateCourseSchema({
  name,
  description,
  provider,
  url,
}: {
  name: string;
  description: string;
  provider: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: SITE_CONFIG.url,
    },
    url,
  };
}

export function generateEventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  url,
}: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE_CONFIG.contact.address,
        addressLocality: 'Blitar',
        addressRegion: 'Jawa Timur',
        postalCode: '66171',
        addressCountry: 'ID',
      },
    },
    image: image || SITE_CONFIG.ogImage,
    organizer: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    url,
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
