const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/, /_buildManifest.js$/, /_ssgManifest.js$/],
  manifestTransforms: [
    (manifestEntries, compilation) => {
      const manifest = manifestEntries.map(entry => {
        if (entry.url.startsWith('/_next/static/')) {
          entry.revision = null
        }
        return entry
      })
      return { manifest }
    }
  ],
  additionalManifestEntries: [
    { url: '/offline.html', revision: null },
    { url: '/pwa/install', revision: null }
  ],
  runtimeCaching: [
    // Auth routes - always network only
    {
      urlPattern: /^https?.*\/api\/auth\/.*/i,
      handler: 'NetworkOnly',
    },
    // API routes - Network first with background sync
    {
      urlPattern: /^https?.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60 // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        networkTimeoutSeconds: 8
      }
    },
    // Static assets - Cache first with long expiration
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Fonts - Cache first with long expiration
    {
      urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // CSS and JS files - Stale while revalidate
    {
      urlPattern: /\.(?:css|js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Next.js static files
    {
      urlPattern: /^https?.*\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    // External CDN resources
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    // App pages - Network first with offline fallback
    {
      urlPattern: /^https?.*\//i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'export' for development - only use for static build
  // output: 'export',
  trailingSlash: false, // Changed to false to fix LINE webhook 308 redirect issue
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    domains: [], // Deprecated - use remotePatterns instead
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    path: '/_next/image',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        canvas: false,
      }
    }
    // Handle canvas module for PDF.js
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    return config
  },
}

module.exports = withPWA(nextConfig)