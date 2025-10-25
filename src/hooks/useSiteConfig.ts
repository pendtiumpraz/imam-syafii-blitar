'use client'

import { useState, useEffect } from 'react'
import { SiteConfig, getDefaultNavbarItems, getDefaultFooterLinks } from '@/lib/site-config'

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'Pondok Imam Syafii',
  siteDescription: 'Lembaga Pendidikan Islam Terpadu',
  contactEmail: 'info@pondokimamsyafii.sch.id',
  contactPhone: '(0342) 123456',
  contactWhatsapp: '+62 812-3456-7890',
  address: 'Jl. Raya Ponpes Imam Syafii, Blitar, Jawa Timur',
  navbarItems: getDefaultNavbarItems(),
  footerAbout: 'Pondok Imam Syafii adalah lembaga pendidikan Islam terpadu yang menyelenggarakan pendidikan dari TK, SD, hingga Pondok Pesantren.',
  footerLinks: getDefaultFooterLinks(),
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true)
        const response = await fetch('/api/site-config')

        if (!response.ok) {
          throw new Error('Failed to fetch site config')
        }

        const data = await response.json()

        // Merge with default config to ensure all fields exist
        const mergedConfig = {
          ...DEFAULT_CONFIG,
          ...data,
          navbarItems: data.navbarItems?.length > 0 ? data.navbarItems : DEFAULT_CONFIG.navbarItems,
          footerLinks: data.footerLinks?.length > 0 ? data.footerLinks : DEFAULT_CONFIG.footerLinks,
        }

        setConfig(mergedConfig)
        setError(null)
      } catch (err) {
        console.error('Error fetching site config:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Keep default config on error
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading, error }
}
