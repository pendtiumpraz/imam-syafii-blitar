import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedWebsiteContent() {
  console.log('🌱 Seeding website content...')

  try {
    // 1. SITE CONFIG (Logo, Navbar, Footer, Social Media)
    console.log('Creating site configuration...')

    const siteConfig = await prisma.site_config.upsert({
      where: { id: 'main-site-config' },
      update: {
        siteName: 'Pondok Pesantren Imam Syafi\'i Blitar',
        siteTagline: 'Lembaga Pendidikan Islam Terpadu',
        logoUrl: '/images/logo-pondok.png',
        faviconUrl: '/images/favicon.ico',
        primaryColor: '#059669', // green-600
        secondaryColor: '#10b981', // green-500
        updatedAt: new Date(),
      },
      create: {
        id: 'main-site-config',
        siteName: 'Pondok Pesantren Imam Syafi\'i Blitar',
        siteTagline: 'Lembaga Pendidikan Islam Terpadu',
        logoUrl: '/images/logo-pondok.png',
        faviconUrl: '/images/favicon.ico',
        primaryColor: '#059669',
        secondaryColor: '#10b981',
        updatedAt: new Date(),
      },
    })

    // 2. NAVBAR ITEMS
    console.log('Creating navbar items...')

    const navbarItems = [
      { label: 'Beranda', href: '/', icon: 'HomeIcon', sortOrder: 1, isActive: true, parentId: null },
      { label: 'Profil', href: '#', icon: null, sortOrder: 2, isActive: true, parentId: null },
      { label: 'Yayasan', href: '/about/yayasan', icon: null, sortOrder: 21, isActive: true, parentId: 'profil-menu' },
      { label: 'Struktur Organisasi', href: '/about/struktur', icon: null, sortOrder: 22, isActive: true, parentId: 'profil-menu' },
      { label: 'Ustadz & Ustadzah', href: '/about/pengajar', icon: null, sortOrder: 23, isActive: true, parentId: 'profil-menu' },
      { label: 'Pondok Pesantren', href: '/about/pondok', icon: null, sortOrder: 24, isActive: true, parentId: 'profil-menu' },
      { label: 'TK Islam', href: '/about/tk', icon: null, sortOrder: 25, isActive: true, parentId: 'profil-menu' },
      { label: 'SD Islam', href: '/about/sd', icon: null, sortOrder: 26, isActive: true, parentId: 'profil-menu' },
      { label: 'Donasi', href: '#', icon: 'HeartIcon', sortOrder: 3, isActive: true, parentId: null },
      { label: 'Donasi Umum', href: '/donasi', icon: null, sortOrder: 31, isActive: true, parentId: 'donasi-menu' },
      { label: 'Program OTA', href: '/donasi/ota', icon: null, sortOrder: 32, isActive: true, parentId: 'donasi-menu' },
      { label: 'Kalkulator Zakat', href: '/donasi/zakat-calculator', icon: null, sortOrder: 33, isActive: true, parentId: 'donasi-menu' },
      { label: 'Galeri', href: '/gallery', icon: 'PhotoIcon', sortOrder: 4, isActive: true, parentId: null },
      { label: 'Kajian', href: '/kajian', icon: 'PlayCircleIcon', sortOrder: 5, isActive: true, parentId: null },
      { label: 'Perpustakaan', href: '/library', icon: 'BookOpenIcon', sortOrder: 6, isActive: true, parentId: null },
      { label: 'Tanya Ustadz', href: '/tanya-ustadz', icon: 'ChatBubbleBottomCenterTextIcon', sortOrder: 7, isActive: true, parentId: null },
      { label: 'PPDB', href: '/ppdb', icon: 'AcademicCapIcon', sortOrder: 8, isActive: true, parentId: null },
    ]

    for (const item of navbarItems) {
      await prisma.navbar_items.upsert({
        where: { href: item.href },
        update: item,
        create: {
          id: `navbar-${item.sortOrder}`,
          ...item,
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
        sortOrder: 1,
        isActive: true,
        links: JSON.stringify([
          { label: 'Yayasan', href: '/about/yayasan' },
          { label: 'Struktur Organisasi', href: '/about/struktur' },
          { label: 'Ustadz & Ustadzah', href: '/about/pengajar' },
          { label: 'Visi & Misi', href: '/about/yayasan#visi-misi' },
        ]),
        updatedAt: new Date(),
      },
      {
        id: 'footer-pendidikan',
        title: 'Pendidikan',
        sortOrder: 2,
        isActive: true,
        links: JSON.stringify([
          { label: 'Pondok Pesantren', href: '/about/pondok' },
          { label: 'TK Islam', href: '/about/tk' },
          { label: 'SD Islam', href: '/about/sd' },
          { label: 'PPDB Online', href: '/ppdb' },
        ]),
        updatedAt: new Date(),
      },
      {
        id: 'footer-layanan',
        title: 'Layanan',
        sortOrder: 3,
        isActive: true,
        links: JSON.stringify([
          { label: 'Portal Wali', href: '/parent-portal/dashboard' },
          { label: 'Perpustakaan Digital', href: '/library' },
          { label: 'Tanya Ustadz', href: '/tanya-ustadz' },
          { label: 'Video Kajian', href: '/kajian' },
          { label: 'Galeri Kegiatan', href: '/gallery' },
        ]),
        updatedAt: new Date(),
      },
      {
        id: 'footer-donasi',
        title: 'Donasi',
        sortOrder: 4,
        isActive: true,
        links: JSON.stringify([
          { label: 'Donasi Umum', href: '/donasi' },
          { label: 'Program OTA', href: '/donasi/ota' },
          { label: 'Kalkulator Zakat', href: '/donasi/zakat-calculator' },
          { label: 'Laporan Keuangan', href: '/donasi#laporan' },
        ]),
        updatedAt: new Date(),
      },
    ]

    for (const section of footerSections) {
      await prisma.footer_sections.upsert({
        where: { id: section.id },
        update: section,
        create: section,
      })
    }

    // 4. CONTACT INFO & SOCIAL MEDIA
    console.log('Updating contact info...')

    await prisma.site_config.update({
      where: { id: 'main-site-config' },
      data: {
        contactAddress: 'Jl. Raya Imam Syafi\'i No. 123, Kel. Sananwetan, Kec. Sananwetan, Kota Blitar, Jawa Timur 66137',
        contactPhone: '(0342) 801234',
        contactWhatsapp: '628123456789',
        contactEmail: 'info@imamsyafii-blitar.sch.id',
        websiteUrl: 'https://imamsyafiiblitar.ponpes.id',
        socialFacebook: 'https://facebook.com/imamsyafiiblitar',
        socialInstagram: 'https://instagram.com/imamsyafiiblitar',
        socialYoutube: 'https://youtube.com/@imamsyafiiblitar',
        socialTwitter: null,
        updatedAt: new Date(),
      },
    })

    // 5. ORGANIZATION INFO (YAYASAN)
    console.log('Creating organization info...')

    const orgInfo = await prisma.organization_info.upsert({
      where: { type: 'YAYASAN' },
      update: {
        name: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar',
        shortName: 'Yayasan Imam Syafi\'i',
        description: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar didirikan pada tahun 1985 dengan tujuan menciptakan lembaga pendidikan Islam yang berkualitas, modern, dan berlandaskan Al-Quran dan Sunnah. Selama lebih dari 39 tahun, yayasan telah berkembang menjadi salah satu lembaga pendidikan Islam terkemuka di Jawa Timur.',
        vision: 'Menjadi yayasan pendidikan Islam terkemuka yang melahirkan generasi Qurani, berakhlak mulia, cerdas, mandiri, dan bermanfaat bagi umat serta bangsa.',
        mission: JSON.stringify([
          'Menyelenggarakan pendidikan Islam berkualitas dari TK hingga Pesantren',
          'Mengembangkan kurikulum terpadu antara ilmu agama dan umum',
          'Membentuk karakter santri berakhlakul karimah',
          'Mengembangkan sarana prasarana pendidikan modern',
          'Memberdayakan masyarakat melalui program sosial dan ekonomi',
        ]),
        foundedYear: 1985,
        achievements: JSON.stringify([
          '5000+ Alumni yang tersebar di seluruh Indonesia',
          'Akreditasi A untuk semua unit pendidikan',
          'Prestasi tingkat nasional dan internasional',
          '8 Unit Usaha yang mendukung kemandirian finansial',
        ]),
        photoUrl: '/images/yayasan-hero.jpg',
        logoUrl: '/images/logo-yayasan.png',
        updatedAt: new Date(),
      },
      create: {
        id: 'org-yayasan',
        type: 'YAYASAN',
        name: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar',
        shortName: 'Yayasan Imam Syafi\'i',
        description: 'Yayasan Pendidikan Islam Imam Syafi\'i Blitar didirikan pada tahun 1985 dengan tujuan menciptakan lembaga pendidikan Islam yang berkualitas, modern, dan berlandaskan Al-Quran dan Sunnah. Selama lebih dari 39 tahun, yayasan telah berkembang menjadi salah satu lembaga pendidikan Islam terkemuka di Jawa Timur.',
        vision: 'Menjadi yayasan pendidikan Islam terkemuka yang melahirkan generasi Qurani, berakhlak mulia, cerdas, mandiri, dan bermanfaat bagi umat serta bangsa.',
        mission: JSON.stringify([
          'Menyelenggarakan pendidikan Islam berkualitas dari TK hingga Pesantren',
          'Mengembangkan kurikulum terpadu antara ilmu agama dan umum',
          'Membentuk karakter santri berakhlakul karimah',
          'Mengembangkan sarana prasarana pendidikan modern',
          'Memberdayakan masyarakat melalui program sosial dan ekonomi',
        ]),
        foundedYear: 1985,
        achievements: JSON.stringify([
          '5000+ Alumni yang tersebar di seluruh Indonesia',
          'Akreditasi A untuk semua unit pendidikan',
          'Prestasi tingkat nasional dan internasional',
          '8 Unit Usaha yang mendukung kemandirian finansial',
        ]),
        photoUrl: '/images/yayasan-hero.jpg',
        logoUrl: '/images/logo-yayasan.png',
        updatedAt: new Date(),
      },
    })

    // 6. ORGANIZATIONAL STRUCTURE
    console.log('Creating organizational structure...')

    const structure = [
      // Dewan Syuro
      { name: 'Bpk. Syamsul', position: 'Dewan Syuro', level: 1, sortOrder: 1, category: 'DEWAN_SYURO' },
      { name: 'Bpk. Syaiful', position: 'Dewan Syuro', level: 1, sortOrder: 2, category: 'DEWAN_SYURO' },
      { name: 'Bpk. Bowo', position: 'Dewan Syuro', level: 1, sortOrder: 3, category: 'DEWAN_SYURO' },
      { name: 'Ust. Fuad', position: 'Dewan Syuro', level: 1, sortOrder: 4, category: 'DEWAN_SYURO' },

      // Dewan Pembina
      { name: 'Bpk. Hadi', position: 'Dewan Pembina', level: 1, sortOrder: 5, category: 'DEWAN_PEMBINA' },
      { name: 'Bpk. Syamsul', position: 'Dewan Pembina', level: 1, sortOrder: 6, category: 'DEWAN_PEMBINA' },
      { name: 'Ust. Anwar Zen', position: 'Dewan Pembina', level: 1, sortOrder: 7, category: 'DEWAN_PEMBINA' },
      { name: 'Ust. Fuad', position: 'Dewan Pembina', level: 1, sortOrder: 8, category: 'DEWAN_PEMBINA' },

      // Dewan Pengawas
      { name: 'Bu Umi', position: 'Dewan Pengawas', level: 1, sortOrder: 9, category: 'DEWAN_PENGAWAS' },
      { name: 'Bpk. Fadhli', position: 'Dewan Pengawas', level: 1, sortOrder: 10, category: 'DEWAN_PENGAWAS' },

      // Pengurus Inti
      { name: 'Ust. Abu Haitsami Iqbal', position: 'Ketua Yayasan', level: 2, sortOrder: 11, category: 'PENGURUS_INTI' },
      { name: 'Bpk. Bowo', position: 'Sekretaris', level: 2, sortOrder: 12, category: 'PENGURUS_INTI' },
      { name: 'Bpk. Syaiful', position: 'Bendahara', level: 2, sortOrder: 13, category: 'PENGURUS_INTI' },
      { name: 'Ummu Rafa', position: 'Admin Keuangan', level: 2, sortOrder: 14, category: 'PENGURUS_INTI' },

      // Divisi BMT & Unit Usaha
      { name: 'Bpk. Bowo', position: 'Koordinator BMT & Unit Usaha', level: 3, sortOrder: 15, category: 'DIVISI', parentId: null },
      { name: 'Bpk. Syaiful', position: 'PIC Gunung Gamping', level: 4, sortOrder: 16, category: 'UNIT_USAHA', parentId: 'struktur-15' },
      { name: 'Ummu Rafa', position: 'PIC Koperasi', level: 4, sortOrder: 17, category: 'UNIT_USAHA', parentId: 'struktur-15' },
      { name: 'Bpk. Warno', position: 'PIC Barang Bekas & Rosok', level: 4, sortOrder: 18, category: 'UNIT_USAHA', parentId: 'struktur-15' },
      { name: 'Bpk. Hamzah', position: 'PIC Donasi', level: 4, sortOrder: 19, category: 'UNIT_USAHA', parentId: 'struktur-15' },
      { name: 'Bpk. Irfan', position: 'PIC Sarpras & Logistik', level: 4, sortOrder: 20, category: 'UNIT_USAHA', parentId: 'struktur-15' },

      // Divisi Dakwah
      { name: 'Ust. Abu Haitsami', position: 'Koordinator Dakwah', level: 3, sortOrder: 21, category: 'DIVISI', parentId: null },
      { name: 'Bpk. Budi', position: 'PIC Masjid', level: 4, sortOrder: 22, category: 'DIVISI_DAKWAH', parentId: 'struktur-21' },
      { name: 'Akh Sofwan', position: 'PIC Kajian Rutin', level: 4, sortOrder: 23, category: 'DIVISI_DAKWAH', parentId: 'struktur-21' },
      { name: 'Ust. Ahmad', position: 'PIC Medsos', level: 4, sortOrder: 24, category: 'DIVISI_DAKWAH', parentId: 'struktur-21' },
      { name: 'Ummu Dzakiyah', position: 'PIC MTU', level: 4, sortOrder: 25, category: 'DIVISI_DAKWAH', parentId: 'struktur-21' },

      // Divisi Pendidikan
      { name: 'Bpk. Syamsul', position: 'Koordinator Pendidikan', level: 3, sortOrder: 26, category: 'DIVISI', parentId: null },
      { name: 'Ummu Dzakiyah', position: 'PIC RA & TK', level: 4, sortOrder: 27, category: 'DIVISI_PENDIDIKAN', parentId: 'struktur-26' },
      { name: 'Ust. Syamsul', position: 'PIC MTQ', level: 4, sortOrder: 28, category: 'DIVISI_PENDIDIKAN', parentId: 'struktur-26' },
      { name: 'Ust. Imam', position: 'PIC MSW Ikhwan', level: 4, sortOrder: 29, category: 'DIVISI_PENDIDIKAN', parentId: 'struktur-26' },
      { name: 'Ummu Dzakiyah', position: 'PIC MSW Akhwat', level: 4, sortOrder: 30, category: 'DIVISI_PENDIDIKAN', parentId: 'struktur-26' },

      // Divisi Lain-lain
      { name: 'Ust. Fuad', position: 'Koordinator Divisi Lain-lain', level: 3, sortOrder: 31, category: 'DIVISI', parentId: null },
      { name: 'Ust. Fuad', position: 'PIC Humas', level: 4, sortOrder: 32, category: 'DIVISI_LAINNYA', parentId: 'struktur-31' },
      { name: 'Ust. Fuad', position: 'PIC Komunikasi', level: 4, sortOrder: 33, category: 'DIVISI_LAINNYA', parentId: 'struktur-31' },
      { name: 'Bpk. Syamsul', position: 'PIC Baksos', level: 4, sortOrder: 34, category: 'DIVISI_LAINNYA', parentId: 'struktur-31' },
    ]

    for (const person of structure) {
      await prisma.organization_structure.upsert({
        where: { id: `struktur-${person.sortOrder}` },
        update: {
          ...person,
          photoUrl: null,
          email: null,
          phone: null,
          bio: null,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          id: `struktur-${person.sortOrder}`,
          ...person,
          photoUrl: null,
          email: null,
          phone: null,
          bio: null,
          isActive: true,
          updatedAt: new Date(),
        },
      })
    }

    // 7. INSTITUTION INFO (TK, SD, PONDOK)
    console.log('Creating institution info...')

    const institutions = [
      {
        id: 'inst-tk',
        type: 'TK',
        name: 'TK Islam Imam Syafi\'i',
        description: 'Taman Kanak-Kanak Islam yang mengembangkan potensi anak usia dini dengan pendekatan Islami dan metode pembelajaran yang menyenangkan.',
        established: 1990,
        accreditation: 'A',
        studentCount: 120,
        teacherCount: 8,
        facilities: JSON.stringify(['Ruang Kelas AC', 'Playground', 'Perpustakaan Mini', 'Ruang Multimedia']),
        programs: JSON.stringify(['Tahfidz', 'Bahasa Arab & Inggris', 'Seni & Kreativitas', 'Outing Class']),
      },
      {
        id: 'inst-sd',
        type: 'SD',
        name: 'SD Islam Imam Syafi\'i',
        description: 'Sekolah Dasar Islam yang memadukan kurikulum nasional dengan pendidikan agama yang kuat, membentuk siswa yang cerdas dan berakhlak mulia.',
        established: 1995,
        accreditation: 'A',
        studentCount: 350,
        teacherCount: 20,
        facilities: JSON.stringify(['Lab Komputer', 'Lab IPA', 'Perpustakaan', 'Masjid', 'Lapangan Olahraga']),
        programs: JSON.stringify(['Tahfidz Quran', 'Bahasa Arab & Inggris', 'Komputer', 'Ekstrakurikuler']),
      },
      {
        id: 'inst-pondok',
        type: 'PONDOK',
        name: 'Pondok Pesantren Imam Syafi\'i',
        description: 'Pondok Pesantren yang menggabungkan pendidikan salaf dan modern, mencetak santri yang hafidz Quran, berilmu, dan siap menghadapi tantangan zaman.',
        established: 1985,
        accreditation: 'Terakreditasi',
        studentCount: 500,
        teacherCount: 35,
        facilities: JSON.stringify(['Asrama Putra & Putri', 'Masjid', 'Aula', 'Perpustakaan', 'Lab Komputer', 'Ruang Tahfidz']),
        programs: JSON.stringify(['Tahfidz 30 Juz', 'Kitab Kuning', 'Bahasa Arab', 'Tahsin & Tilawah', 'Kewirausahaan']),
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
