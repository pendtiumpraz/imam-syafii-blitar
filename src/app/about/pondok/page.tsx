'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Home,
  BookOpen,
  Users,
  Award,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  Star,
  Sparkles,
  GraduationCap,
  Heart,
  Globe,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

interface Statistics {
  totalSantri: number
  totalUstadz: number
  totalHafidz: number
  totalPrograms: number
}

export default function PondokPage() {
  const { config, loading } = useSiteConfig()
  const [statistics, setStatistics] = useState<Statistics>({
    totalSantri: 280,
    totalUstadz: 35,
    totalHafidz: 45,
    totalPrograms: 8
  })

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/public/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics({
          totalSantri: data.totalSantri,
          totalUstadz: data.totalTeachers,
          totalHafidz: 45, // Default, bisa ditambah field di DB
          totalPrograms: data.totalPrograms
        })
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const programs = [
    {
      title: 'Tahfidz Al-Quran',
      description: 'Program menghafal 30 juz dengan metode mutqin dan muraja\'ah intensif',
      icon: BookOpen,
      features: ['Target 3 tahun', 'Setoran harian', 'Wisuda tahfidz'],
      color: 'from-emerald-400 to-green-600'
    },
    {
      title: 'Kitab Kuning',
      description: 'Kajian kitab-kitab klasik dengan sanad bersambung',
      icon: BookOpen,
      features: ['Nahwu Shorof', 'Fiqih', 'Tafsir & Hadits'],
      color: 'from-blue-400 to-indigo-600'
    },
    {
      title: 'Bahasa Arab',
      description: 'Program intensif bahasa Arab dengan metode langsung',
      icon: Globe,
      features: ['Muhadatsah', 'Kitabah', 'Qira\'ah'],
      color: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Leadership Islam',
      description: 'Pembentukan karakter kepemimpinan Islami',
      icon: Award,
      features: ['Public speaking', 'Organisasi', 'Manajemen'],
      color: 'from-orange-400 to-red-600'
    }
  ]

  const facilities = [
    { name: 'Masjid', capacity: '500 jamaah', icon: Home },
    { name: 'Asrama Putra', capacity: '200 santri', icon: Home },
    { name: 'Asrama Putri', capacity: '150 santriwati', icon: Home },
    { name: 'Aula Serbaguna', capacity: '300 orang', icon: Users },
    { name: 'Perpustakaan', capacity: '5000+ kitab', icon: BookOpen },
    { name: 'Lab Komputer', capacity: '40 unit', icon: Globe },
  ]

  const dailySchedule = [
    { time: '03:30', activity: 'Qiyamul Lail', type: 'ibadah' },
    { time: '04:00', activity: 'Sholat Subuh Berjamaah', type: 'ibadah' },
    { time: '05:00', activity: 'Hafalan Al-Quran', type: 'tahfidz' },
    { time: '06:00', activity: 'Sarapan', type: 'break' },
    { time: '07:00', activity: 'Sekolah Formal', type: 'academic' },
    { time: '12:00', activity: 'Sholat Dzuhur & Makan Siang', type: 'ibadah' },
    { time: '13:00', activity: 'Istirahat', type: 'break' },
    { time: '14:00', activity: 'Madrasah Diniyah', type: 'diniyah' },
    { time: '15:30', activity: 'Sholat Ashar', type: 'ibadah' },
    { time: '16:00', activity: 'Muraja\'ah', type: 'tahfidz' },
    { time: '18:00', activity: 'Sholat Maghrib', type: 'ibadah' },
    { time: '18:30', activity: 'Kajian Kitab', type: 'diniyah' },
    { time: '19:30', activity: 'Sholat Isya', type: 'ibadah' },
    { time: '20:00', activity: 'Makan Malam', type: 'break' },
    { time: '20:30', activity: 'Belajar Malam', type: 'academic' },
    { time: '21:30', activity: 'Istirahat', type: 'break' },
  ]

  const typeColors = {
    ibadah: 'bg-green-100 text-green-800',
    tahfidz: 'bg-blue-100 text-blue-800',
    academic: 'bg-purple-100 text-purple-800',
    diniyah: 'bg-orange-100 text-orange-800',
    break: 'bg-gray-100 text-gray-800'
  }

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Pondok Pesantren</h1>
            <p className="text-green-100 text-xl">Pusat Pendidikan Islam Terpadu</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-green-100 text-green-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Pendidikan 24 Jam
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Pondok Pesantren
                <span className="block text-green-600">Imam Syafi'i Blitar</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Pondok Pesantren dengan sistem pendidikan terpadu yang memadukan kurikulum 
                pesantren salaf dan modern. Fokus pada pembentukan karakter, hafalan Al-Quran, 
                penguasaan kitab kuning, dan keterampilan hidup.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <Users className="w-8 h-8 text-green-600 mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{statistics.totalSantri}</div>
                    <p className="text-sm text-gray-600">Santri Aktif</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <GraduationCap className="w-8 h-8 text-blue-600 mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{statistics.totalUstadz}</div>
                    <p className="text-sm text-gray-600">Ustadz & Ustadzah</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-4">
                <Link href="#programs">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Lihat Program
                  </Button>
                </Link>
                <Link href="/ppdb">
                  <Button variant="outline">
                    Daftar Sekarang
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative h-[400px]">
              <Card className="h-full bg-gradient-to-br from-green-100 to-green-50 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Home className="w-48 h-48 text-green-200" />
                </div>
                <CardContent className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Program Unggulan</span>
                      <Badge className="bg-green-100 text-green-800">
                        {statistics.totalPrograms} Program
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Tahfidz 30 Juz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-green-600 mb-2">{statistics.totalSantri}+</div>
              <p className="text-gray-600">Santri Aktif</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">{statistics.totalHafidz}+</div>
              <p className="text-gray-600">Hafidz/Hafidzah</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <p className="text-gray-600">Kelulusan</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-orange-600 mb-2">A</div>
              <p className="text-gray-600">Akreditasi</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Program Unggulan
            </h2>
            <p className="text-xl text-gray-600">
              Berbagai program untuk membentuk santri yang unggul dalam ilmu dan taqwa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center mb-4`}>
                      <program.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{program.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{program.description}</p>
                    <ul className="space-y-2">
                      {program.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Jadwal Kegiatan Harian
          </motion.h2>

          <Tabs defaultValue="weekday" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="weekday">Hari Biasa</TabsTrigger>
              <TabsTrigger value="weekend">Akhir Pekan</TabsTrigger>
            </TabsList>
            <TabsContent value="weekday" className="mt-8">
              <div className="grid md:grid-cols-2 gap-4">
                {dailySchedule.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold text-gray-700 w-16">
                            {item.time}
                          </div>
                          <div>
                            <p className="font-medium">{item.activity}</p>
                          </div>
                        </div>
                        <Badge className={typeColors[item.type as keyof typeof typeColors]}>
                          {item.type}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="weekend" className="mt-8">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">
                    Jadwal akhir pekan disesuaikan dengan kegiatan ekstrakurikuler, 
                    olahraga, dan program pengembangan diri santri.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Fasilitas Pondok
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <facility.icon className="w-10 h-10 text-green-600 mb-3" />
                    <h3 className="font-bold mb-1">{facility.name}</h3>
                    <p className="text-sm text-gray-600">{facility.capacity}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Bergabunglah dengan Kami
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Daftarkan putra-putri Anda untuk menjadi bagian dari generasi Qurani
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/ppdb">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  Daftar Sekarang
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Hubungi Kami
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Kontak & Lokasi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Alamat</h3>
                <p className="text-sm text-gray-600">
                  {config.address}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Telepon</h3>
                <p className="text-sm text-gray-600">
                  {config.contactPhone}
                  {config.contactWhatsapp && (
                    <>
                      <br />
                      {config.contactWhatsapp}
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Email</h3>
                <p className="text-sm text-gray-600">
                  {config.contactEmail}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}