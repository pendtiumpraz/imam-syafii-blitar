import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedWebsiteContent() {
  console.log('🌱 Seeding website content (v2 - adapted to schema)...')

  try {
    // 1. SITE CONFIG using key-value pairs
    console.log('Creating site configuration...')

    const siteConfigs = [
      { key: 'site.name', value: 'Pondok Pesantren Imam Syafi\'i Blitar', label: 'Site Name', category: 'GENERAL', dataType: 'STRING' },
      { key: 'site.tagline', value: 'Lembaga Pendidikan Islam Terpadu', label: 'Site Tagline', category: 'GENERAL', dataType: 'STRING' },
      { key: 'site.logo_url', value: '/images/logo-pondok.png', label: 'Logo URL', category: 'GENERAL', dataType: 'STRING' },
      { key: 'site.favicon_url', value: '/images/favicon.ico', label: 'Favicon URL', category: 'GENERAL', dataType: 'STRING' },
      { key: 'site.primary_color', value: '#059669', label: 'Primary Color', category: 'GENERAL', dataType: 'STRING' },
      { key: 'site.secondary_color', value: '#10b981', label: 'Secondary Color', category: 'GENERAL', dataType: 'STRING' },
      { key: 'contact.address', value: 'Jl. Raya Imam Syafi\'i No. 123, Kel. Sananwetan, Kec. Sananwetan, Kota Blitar, Jawa Timur 66137', label: 'Address', category: 'CONTACT', dataType: 'STRING' },
      { key: 'contact.phone', value: '(0342) 801234', label: 'Phone', category: 'CONTACT', dataType: 'STRING' },
      { key: 'contact.whatsapp', value: '628123456789', label: 'WhatsApp', category: 'CONTACT', dataType: 'STRING' },
      { key: 'contact.email', value: 'info@imamsyafii-blitar.sch.id', label: 'Email', category: 'CONTACT', dataType: 'STRING' },
      { key: 'social.facebook', value: 'https://facebook.com/imamsyafiiblitar', label: 'Facebook URL', category: 'SOCIAL', dataType: 'STRING' },
      { key: 'social.instagram', value: 'https://instagram.com/imamsyafiiblitar', label: 'Instagram URL', category: 'SOCIAL', dataType: 'STRING' },
      { key: 'social.youtube', value: 'https://youtube.com/@imamsyafiiblitar', label: 'YouTube URL', category: 'SOCIAL', dataType: 'STRING' },
      { key: 'social.whatsapp', value: 'https://wa.me/628123456789', label: 'WhatsApp Link', category: 'SOCIAL', dataType: 'STRING' },
    ]

    for (const config of siteConfigs) {
      await prisma.site_config.upsert({
        where: { key: config.key },
        update: { value: config.value, updatedAt: new Date() },
        create: {
          id: `config-${config.key.replace(/\./g, '-')}`,
          ...config,
          isEditable: true,
          isPublic: true,
          sortOrder: 0,
          updatedAt: new Date(),
        },
      })
    }

    // 2. NAVBAR ITEMS
    console.log('Creating navbar items...')

    const navbarItems = [
      { label: 'Beranda', linkUrl: '/', sortOrder: 1, parentId: null, level: 0 },
      { label: 'Profil', linkUrl: '#', sortOrder: 2, parentId: null, level: 0 },
      { label: 'Yayasan', linkUrl: '/about/yayasan', sortOrder: 21, parentId: 'profil', level: 1 },
      { label: 'Struktur Organisasi', linkUrl: '/about/struktur', sortOrder: 22, parentId: 'profil', level: 1 },
      { label: 'Ustadz & Ustadzah', linkUrl: '/about/pengajar', sortOrder: 23, parentId: 'profil', level: 1 },
      { label: 'Pondok Pesantren', linkUrl: '/about/pondok', sortOrder: 24, parentId: 'profil', level: 1 },
      { label: 'TK Islam', linkUrl: '/about/tk', sortOrder: 25, parentId: 'profil', level: 1 },
      { label: 'SD Islam', linkUrl: '/about/sd', sortOrder: 26, parentId: 'profil', level: 1 },
      { label: 'Donasi', linkUrl: '#', sortOrder: 3, parentId: null, level: 0 },
      { label: 'Donasi Umum', linkUrl: '/donasi', sortOrder: 31, parentId: 'donasi', level: 1 },
      { label: 'Program OTA', linkUrl: '/donasi/ota', sortOrder: 32, parentId: 'donasi', level: 1 },
      { label: 'Kalkulator Zakat', linkUrl: '/donasi/zakat-calculator', sortOrder: 33, parentId: 'donasi', level: 1 },
      { label: 'Galeri', linkUrl: '/gallery', sortOrder: 4, parentId: null, level: 0 },
      { label: 'Kajian', linkUrl: '/kajian', sortOrder: 5, parentId: null, level: 0 },
      { label: 'Perpustakaan', linkUrl: '/library', sortOrder: 6, parentId: null, level: 0 },
      { label: 'Tanya Ustadz', linkUrl: '/tanya-ustadz', sortOrder: 7, parentId: null, level: 0 },
      { label: 'PPDB', linkUrl: '/ppdb', sortOrder: 8, parentId: null, level: 0 },
    ]

    for (const item of navbarItems) {
      await prisma.navbar_items.upsert({
        where: { id: `navbar-${item.sortOrder}` },
        update: {
          label: item.label,
          linkUrl: item.linkUrl,
          sortOrder: item.sortOrder,
          parentId: item.parentId,
          level: item.level,
          updatedAt: new Date()
        },
        create: {
          id: `navbar-${item.sortOrder}`,
          label: item.label,
          linkUrl: item.linkUrl,
          linkType: 'INTERNAL',
          parentId: item.parentId,
          level: item.level,
          sortOrder: item.sortOrder,
          icon: null,
          isActive: true,
          openInNewTab: false,
          showOnMobile: true,
          showOnDesktop: true,
          requiresAuth: false,
          cssClass: null,
          updatedAt: new Date(),
        },
      })
    }

    // 3. FOOTER SECTIONS
    console.log('Creating footer sections...')

    const footerSections = [
      {
        id: 'footer-profil',
        title: 'Profil',
        type: 'LINKS',
        content: JSON.stringify([
          { label: 'Yayasan', href: '/about/yayasan' },
          { label: 'Struktur Organisasi', href: '/about/struktur' },
          { label: 'Ustadz & Ustadzah', href: '/about/pengajar' },
          { label: 'Visi & Misi', href: '/about/yayasan#visi-misi' },
        ]),
        column: 1,
        sortOrder: 1,
      },
      {
        id: 'footer-pendidikan',
        title: 'Pendidikan',
        type: 'LINKS',
        content: JSON.stringify([
          { label: 'Pondok Pesantren', href: '/about/pondok' },
          { label: 'TK Islam', href: '/about/tk' },
          { label: 'SD Islam', href: '/about/sd' },
          { label: 'PPDB Online', href: '/ppdb' },
        ]),
        column: 2,
        sortOrder: 2,
      },
      {
        id: 'footer-layanan',
        title: 'Layanan',
        type: 'LINKS',
        content: JSON.stringify([
          { label: 'Portal Wali', href: '/parent-portal/dashboard' },
          { label: 'Perpustakaan Digital', href: '/library' },
          { label: 'Tanya Ustadz', href: '/tanya-ustadz' },
          { label: 'Video Kajian', href: '/kajian' },
          { label: 'Galeri Kegiatan', href: '/gallery' },
        ]),
        column: 3,
        sortOrder: 3,
      },
      {
        id: 'footer-donasi',
        title: 'Donasi',
        type: 'LINKS',
        content: JSON.stringify([
          { label: 'Donasi Umum', href: '/donasi' },
          { label: 'Program OTA', href: '/donasi/ota' },
          { label: 'Kalkulator Zakat', href: '/donasi/zakat-calculator' },
          { label: 'Laporan Keuangan', href: '/donasi#laporan' },
        ]),
        column: 4,
        sortOrder: 4,
      },
    ]

    for (const section of footerSections) {
      await prisma.footer_sections.upsert({
        where: { id: section.id },
        update: { ...section, updatedAt: new Date() },
        create: {
          ...section,
          isActive: true,
          updatedAt: new Date(),
        },
      })
    }

    // 4. ORGANIZATION INFO (YAYASAN)
    console.log('Creating organization info...')

    await prisma.organization_info.upsert({
      where: { id: 'org-yayasan' },
      update: {
        name: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar',
        shortName: 'Yayasan Imam Syafi\'i',
        updatedAt: new Date(),
      },
      create: {
        id: 'org-yayasan',
        name: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar',
        shortName: 'Yayasan Imam Syafi\'i',
        legalName: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar',
        establishmentDate: new Date('1985-01-01'),
        address: 'Jl. Raya Imam Syafi\'i No. 123, Kel. Sananwetan',
        city: 'Kota Blitar',
        province: 'Jawa Timur',
        postalCode: '66137',
        phone: '(0342) 801234',
        email: 'yayasan@imamsyafii-blitar.sch.id',
        website: 'https://imamsyafiiblitar.ponpes.id',
        updatedAt: new Date(),
      },
    })

    // 5. ORGANIZATIONAL STRUCTURE
    console.log('Creating organizational structure...')

    const structure = [
      // Dewan Syuro
      { personName: 'Bpk. Syamsul', positionName: 'Anggota Dewan Syuro', level: 0, sortOrder: 1 },
      { personName: 'Bpk. Syaiful', positionName: 'Anggota Dewan Syuro', level: 0, sortOrder: 2 },
      { personName: 'Bpk. Bowo', positionName: 'Anggota Dewan Syuro', level: 0, sortOrder: 3 },
      { personName: 'Ust. Fuad', positionName: 'Anggota Dewan Syuro', level: 0, sortOrder: 4 },

      // Dewan Pembina
      { personName: 'Bpk. Hadi', positionName: 'Anggota Dewan Pembina', level: 0, sortOrder: 5 },
      { personName: 'Ust. Anwar Zen', positionName: 'Anggota Dewan Pembina', level: 0, sortOrder: 7 },

      // Dewan Pengawas
      { personName: 'Bu Umi', positionName: 'Anggota Dewan Pengawas', level: 0, sortOrder: 9 },
      { personName: 'Bpk. Fadhli', positionName: 'Anggota Dewan Pengawas', level: 0, sortOrder: 10 },

      // Pengurus Inti
      { personName: 'Ust. Abu Haitsami Iqbal', positionName: 'Ketua Yayasan', level: 1, sortOrder: 11 },
      { personName: 'Bpk. Bowo', positionName: 'Sekretaris', level: 1, sortOrder: 12 },
      { personName: 'Bpk. Syaiful', positionName: 'Bendahara', level: 1, sortOrder: 13 },
      { personName: 'Ummu Rafa', positionName: 'Admin Keuangan', level: 2, sortOrder: 14 },

      // Koordinator Divisi
      { personName: 'Bpk. Bowo', positionName: 'Koordinator BMT & Unit Usaha', level: 2, department: 'BMT & Unit Usaha', sortOrder: 15 },
      { personName: 'Ust. Abu Haitsami', positionName: 'Koordinator Dakwah', level: 2, department: 'Dakwah', sortOrder: 21 },
      { personName: 'Bpk. Syamsul', positionName: 'Koordinator Pendidikan', level: 2, department: 'Pendidikan', sortOrder: 26 },
      { personName: 'Ust. Fuad', positionName: 'Koordinator Divisi Lain-lain', level: 2, department: 'Lain-lain', sortOrder: 31 },
    ]

    for (const person of structure) {
      await prisma.organization_structure.upsert({
        where: { id: `struktur-${person.sortOrder}` },
        update: {
          ...person,
          updatedAt: new Date(),
        },
        create: {
          id: `struktur-${person.sortOrder}`,
          ...person,
          parentId: null,
          department: person.department || null,
          isActive: true,
          sortOrder: person.sortOrder,
          updatedAt: new Date(),
        },
      })
    }

    // 6. INSTITUTION INFO (TK, SD, PONDOK)
    console.log('Creating institution info...')

    const institutions = [
      {
        id: 'inst-tk',
        type: 'TK',
        code: 'TK-001',
        name: 'TK Islam Imam Syafi\'i',
        shortName: 'TK Imam Syafi\'i',
        accreditation: 'A',
        establishmentDate: new Date('1990-01-01'),
      },
      {
        id: 'inst-sd',
        type: 'SD',
        code: 'SD-001',
        name: 'SD Islam Imam Syafi\'i',
        shortName: 'SD Imam Syafi\'i',
        accreditation: 'A',
        establishmentDate: new Date('1995-01-01'),
      },
      {
        id: 'inst-pondok',
        type: 'PONDOK',
        code: 'PONDOK-001',
        name: 'Pondok Pesantren Imam Syafi\'i',
        shortName: 'Ponpes Imam Syafi\'i',
        accreditation: 'Terakreditasi',
        establishmentDate: new Date('1985-01-01'),
      },
    ]

    for (const inst of institutions) {
      await prisma.institution_info.upsert({
        where: { id: inst.id },
        update: {
          ...inst,
          updatedAt: new Date(),
        },
        create: {
          ...inst,
          address: 'Jl. Raya Imam Syafi\'i No. 123',
          city: 'Kota Blitar',
          province: 'Jawa Timur',
          updatedAt: new Date(),
        },
      })
    }

    console.log('✅ Website content seeding completed successfully!')

    // Print summary
    const siteConfigCount = await prisma.site_config.count()
    const navbarCount = await prisma.navbar_items.count()
    const footerCount = await prisma.footer_sections.count()
    const orgCount = await prisma.organization_info.count()
    const structureCount = await prisma.organization_structure.count()
    const instCount = await prisma.institution_info.count()

    console.log('\n📊 Website Content Summary:')
    console.log(`   • Site Configurations: ${siteConfigCount}`)
    console.log(`   • Navbar Items: ${navbarCount}`)
    console.log(`   • Footer Sections: ${footerCount}`)
    console.log(`   • Organization Info: ${orgCount}`)
    console.log(`   • Structure Members: ${structureCount}`)
    console.log(`   • Institutions: ${instCount}`)

  } catch (error) {
    console.error('❌ Error seeding website content:', error)
    throw error
  }
}

export default seedWebsiteContent

// Run directly if this file is executed
if (require.main === module) {
  seedWebsiteContent()
    .then(() => {
      console.log('✅ Website content seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Website content seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
