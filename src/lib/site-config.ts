import { prisma } from './prisma'

export interface NavbarItem {
  id: string
  label: string
  href: string
  order: number
  children?: NavbarItem[]
}

export interface FooterLink {
  id: string
  category: string
  label: string
  href: string
}

export interface SiteConfig {
  // Branding
  logo?: string
  logoWhite?: string
  favicon?: string
  siteName: string
  siteDescription: string

  // Contact
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  address: string

  // Social Media
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
  linkedIn?: string

  // Navigation
  navbarItems: NavbarItem[]

  // Footer
  footerAbout: string
  footerLinks: FooterLink[]
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'Pondok Imam Syafii',
  siteDescription: 'Lembaga Pendidikan Islam Terpadu',
  contactEmail: 'info@pondokimamsyafii.sch.id',
  contactPhone: '(0342) 123456',
  contactWhatsapp: '+62 812-3456-7890',
  address: 'Jl. Raya Ponpes Imam Syafii, Blitar, Jawa Timur',
  navbarItems: [],
  footerAbout: 'Pondok Imam Syafii adalah lembaga pendidikan Islam terpadu yang menyelenggarakan pendidikan dari TK, SD, hingga Pondok Pesantren.',
  footerLinks: [],
}

const SITE_CONFIG_KEYS = [
  'logo',
  'logoWhite',
  'favicon',
  'siteName',
  'siteDescription',
  'contactEmail',
  'contactPhone',
  'contactWhatsapp',
  'address',
  'facebook',
  'instagram',
  'youtube',
  'twitter',
  'linkedIn',
  'navbarItems',
  'footerAbout',
  'footerLinks',
]

/**
 * Fetch site configuration from database (server-side only)
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: SITE_CONFIG_KEYS,
        },
      },
    })

    const config: any = { ...DEFAULT_CONFIG }
    settings.forEach((setting) => {
      try {
        // Try to parse as JSON for arrays/objects
        config[setting.key] = JSON.parse(setting.value)
      } catch {
        // If not JSON, use as string
        config[setting.key] = setting.value
      }
    })

    return config as SiteConfig
  } catch (error) {
    console.error('Error fetching site config:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Get a single config value by key
 */
export async function getConfigValue(key: string): Promise<string | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    })
    return setting?.value || null
  } catch (error) {
    console.error(`Error fetching config value for ${key}:`, error)
    return null
  }
}

/**
 * Get default navbar items (fallback)
 */
export function getDefaultNavbarItems(): NavbarItem[] {
  return [
    {
      id: '1',
      label: 'Beranda',
      href: '/',
      order: 1,
    },
    {
      id: '2',
      label: 'Profil',
      href: '#',
      order: 2,
      children: [
        { id: '2-1', label: 'Identitas Yayasan', href: '/about/yayasan', order: 1 },
        { id: '2-2', label: 'Latar Belakang', href: '/about/latar-belakang', order: 2 },
        { id: '2-3', label: 'Visi & Misi', href: '/about/visi-misi', order: 3 },
        { id: '2-4', label: 'Keunggulan', href: '/about/keunggulan', order: 4 },
        { id: '2-5', label: 'KB-TK Islam', href: '/about/tk', order: 5 },
        { id: '2-6', label: 'SD Islam', href: '/about/sd', order: 6 },
        { id: '2-7', label: 'SMP Pesantren', href: '/about/smp', order: 7 },
        { id: '2-8', label: 'SMA Pesantren', href: '/about/sma', order: 8 },
        { id: '2-9', label: 'Pondok Pesantren', href: '/about/pondok', order: 9 },
        { id: '2-10', label: 'Beasiswa', href: '/about/beasiswa', order: 10 },
        { id: '2-11', label: 'Ustadz & Ustadzah', href: '/about/pengajar', order: 11 },
        { id: '2-12', label: 'Struktur Organisasi', href: '/about/struktur', order: 12 },
      ],
    },
    {
      id: '3',
      label: 'Donasi',
      href: '#',
      order: 3,
      children: [
        { id: '3-1', label: 'Donasi Umum', href: '/donasi', order: 1 },
        { id: '3-2', label: 'Program OTA', href: '/donasi/ota', order: 2 },
        { id: '3-3', label: 'Kalkulator Zakat', href: '/donasi/zakat-calculator', order: 3 },
      ],
    },
    {
      id: '4',
      label: 'Galeri',
      href: '/gallery',
      order: 4,
    },
    {
      id: '5',
      label: 'Kajian',
      href: '/kajian',
      order: 5,
    },
    {
      id: '6',
      label: 'Perpustakaan',
      href: '/library',
      order: 6,
    },
    {
      id: '7',
      label: 'Tanya Ustadz',
      href: '/tanya-ustadz',
      order: 7,
    },
    {
      id: '8',
      label: 'PPDB',
      href: '/ppdb',
      order: 8,
    },
  ]
}

/**
 * Get default footer links (fallback)
 */
export function getDefaultFooterLinks(): FooterLink[] {
  return [
    // Profil
    { id: '1', category: 'Profil', label: 'Yayasan', href: '/about/yayasan' },
    { id: '2', category: 'Profil', label: 'Struktur Organisasi', href: '/about/struktur' },
    { id: '3', category: 'Profil', label: 'Ustadz & Ustadzah', href: '/about/pengajar' },
    { id: '4', category: 'Profil', label: 'Visi & Misi', href: '/about/yayasan#visi-misi' },

    // Pendidikan
    { id: '5', category: 'Pendidikan', label: 'Pondok Pesantren', href: '/about/pondok' },
    { id: '6', category: 'Pendidikan', label: 'TK Islam', href: '/about/tk' },
    { id: '7', category: 'Pendidikan', label: 'SD Islam', href: '/about/sd' },
    { id: '8', category: 'Pendidikan', label: 'PPDB Online', href: '/ppdb' },

    // Layanan
    { id: '9', category: 'Layanan', label: 'Portal Wali', href: '/parent-portal/dashboard' },
    { id: '10', category: 'Layanan', label: 'Perpustakaan Digital', href: '/library' },
    { id: '11', category: 'Layanan', label: 'Tanya Ustadz', href: '/tanya-ustadz' },
    { id: '12', category: 'Layanan', label: 'Video Kajian', href: '/kajian' },
    { id: '13', category: 'Layanan', label: 'Galeri Kegiatan', href: '/gallery' },

    // Donasi
    { id: '14', category: 'Donasi', label: 'Donasi Umum', href: '/donasi' },
    { id: '15', category: 'Donasi', label: 'Program OTA', href: '/donasi/ota' },
    { id: '16', category: 'Donasi', label: 'Kalkulator Zakat', href: '/donasi/zakat-calculator' },
  ]
}
