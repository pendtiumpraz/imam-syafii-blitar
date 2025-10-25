'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Baby,
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
  Heart,
  Music,
  Palette,
  Brain,
  Gamepad2,
  Home
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

interface Statistics {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  ratio: string
}

export default function TKPage() {
  const { config, loading } = useSiteConfig()
  const [statistics, setStatistics] = useState<Statistics>({
    totalStudents: 120,
    totalTeachers: 12,
    totalClasses: 6,
    ratio: '1:10'
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
          totalStudents: data.totalStudentsTK,
          totalTeachers: 12, // Default
          totalClasses: 6,
          ratio: '1:10'
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
      title: 'Tahfidz Juz Amma',
      description: 'Program hafalan Juz 30 dengan metode fun learning',
      icon: BookOpen,
      features: ['Metode gerakan', 'Lagu & nyanyian', 'Target 2 tahun'],
      color: 'from-blue-400 to-cyan-600'
    },
    {
      title: 'Pembelajaran Sentra',
      description: 'Metode pembelajaran berbasis sentra untuk pengembangan optimal',
      icon: Brain,
      features: ['Sentra balok', 'Sentra seni', 'Sentra peran'],
      color: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Bahasa & Literasi',
      description: 'Pengembangan kemampuan berbahasa dan literasi dini',
      icon: BookOpen,
      features: ['Baca tulis dasar', 'Bahasa Arab', 'Bahasa Inggris'],
      color: 'from-green-400 to-emerald-600'
    },
    {
      title: 'Kreativitas & Seni',
      description: 'Pengembangan bakat seni dan kreativitas anak',
      icon: Palette,
      features: ['Menggambar', 'Mewarnai', 'Prakarya'],
      color: 'from-orange-400 to-red-600'
    }
  ]

  const facilities = [
    { name: 'Ruang Kelas AC', count: '6 kelas', icon: Home },
    { name: 'Playground', count: 'Indoor & Outdoor', icon: Gamepad2 },
    { name: 'Perpustakaan Mini', count: '500+ buku', icon: BookOpen },
    { name: 'Ruang Musik', count: 'Alat musik lengkap', icon: Music },
    { name: 'Ruang Makan', count: 'Katering sehat', icon: Heart },
    { name: 'UKS', count: 'Perawat standby', icon: Heart },
  ]

  const dailySchedule = [
    { time: '07:00', activity: 'Penyambutan & Morning Circle', icon: Heart },
    { time: '07:30', activity: 'Ikrar & Doa', icon: BookOpen },
    { time: '08:00', activity: 'Kegiatan Sentra', icon: Brain },
    { time: '09:00', activity: 'Snack Time', icon: Heart },
    { time: '09:30', activity: 'Kegiatan Inti', icon: BookOpen },
    { time: '10:30', activity: 'Istirahat & Bermain', icon: Gamepad2 },
    { time: '11:00', activity: 'Makan Siang', icon: Heart },
    { time: '11:30', activity: 'Persiapan Pulang', icon: Home },
    { time: '12:00', activity: 'Penjemputan', icon: Users },
  ]

  const ageGroups = [
    { name: 'Kelompok A', age: '4-5 tahun', students: 60, color: 'bg-blue-100 text-blue-800' },
    { name: 'Kelompok B', age: '5-6 tahun', students: 60, color: 'bg-green-100 text-green-800' },
  ]

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">TK Islam Imam Syafi'i</h1>
          <p className="text-blue-100 mt-2">Pendidikan Anak Usia Dini Berbasis Islam</p>
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
              <Badge className="mb-4 bg-blue-100 text-blue-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Fun Learning Method
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Membentuk Generasi
                <span className="block text-blue-600">Cerdas & Berakhlak</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                TK Islam Imam Syafi'i menerapkan pembelajaran holistik yang mengembangkan 
                aspek spiritual, kognitif, fisik-motorik, sosial-emosional, bahasa, dan 
                seni anak usia dini dengan pendekatan Islami yang menyenangkan.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <Baby className="w-8 h-8 text-blue-600 mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{statistics.totalStudents}</div>
                    <p className="text-sm text-gray-600">Siswa Aktif</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Users className="w-8 h-8 text-green-600 mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{statistics.ratio}</div>
                    <p className="text-sm text-gray-600">Rasio Guru:Siswa</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-4">
                <Link href="/ppdb">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Daftar Sekarang
                  </Button>
                </Link>
                <Link href="#programs">
                  <Button variant="outline">
                    Lihat Program
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative h-[400px]">
              <Card className="h-full bg-gradient-to-br from-blue-100 to-cyan-50 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Baby className="w-48 h-48 text-blue-200" />
                </div>
                <CardContent className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Prestasi</span>
                      <div className="flex">
                        {[1, 2, 3].map((i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="font-semibold">Akreditasi A</p>
                    <p className="text-sm text-gray-600">Sejak 2020</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Age Groups */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-center mb-8">Kelompok Usia</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {ageGroups.map((group, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold">{group.name}</h4>
                      <Badge className={group.color}>{group.age}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Baby className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600">{group.students} siswa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600">3 kelas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
              Kurikulum terintegrasi untuk perkembangan optimal anak
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
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

          <div className="max-w-3xl mx-auto">
            {dailySchedule.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="mb-4"
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.activity}</p>
                        <p className="text-sm text-gray-600">{item.time}</p>
                      </div>
                    </div>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
            Fasilitas TK
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
                  <CardContent className="p-6 text-center">
                    <facility.icon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold mb-1">{facility.name}</h3>
                    <p className="text-sm text-gray-600">{facility.count}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Keunggulan TK Islam Imam Syafi'i
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Kurikulum Merdeka', desc: 'Pembelajaran berbasis proyek yang menyenangkan' },
              { title: 'Guru Bersertifikat', desc: 'Pengajar profesional dan berpengalaman' },
              { title: 'Full Day School', desc: 'Pengasuhan dan pembelajaran optimal' },
              { title: 'Metode Montessori', desc: 'Pembelajaran mandiri dan eksploratif' },
              { title: 'Bilingual Program', desc: 'Pengenalan bahasa Arab dan Inggris' },
              { title: 'Parenting Class', desc: 'Program pendampingan orang tua' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-blue-100">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Daftarkan Buah Hati Anda Sekarang
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Kuota terbatas untuk tahun ajaran 2024/2025
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/ppdb">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Formulir Pendaftaran
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline">
                  Hubungi Kami
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Kontak & Lokasi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Alamat</h3>
                <p className="text-sm text-gray-600">
                  {config.address}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="w-10 h-10 text-blue-600 mx-auto mb-3" />
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
                <Mail className="w-10 h-10 text-blue-600 mx-auto mb-3" />
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