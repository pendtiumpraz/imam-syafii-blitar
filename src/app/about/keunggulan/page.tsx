'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Users,
  Award,
  Shield,
  Heart,
  Star,
  Globe,
  Zap,
  Home,
  Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PublicLayout from '@/components/layout/PublicLayout'

export default function KeunggulanPage() {
  const keunggulan = [
    {
      icon: BookOpen,
      title: 'Kurikulum Terpadu',
      desc: 'Memadukan kurikulum nasional dengan kurikulum pesantren dan tahfidz Al-Quran',
      color: 'bg-blue-500',
      features: [
        'Kurikulum Diknas terakreditasi A',
        'Kajian Kitab Kuning',
        'Program Tahfidz intensif',
        'Pembelajaran bahasa Arab dan Inggris'
      ]
    },
    {
      icon: Users,
      title: 'Tenaga Pendidik Berkualitas',
      desc: 'Diajar oleh ustadz/ustadzah dan guru profesional yang berpengalaman',
      color: 'bg-green-500',
      features: [
        '80% guru bersertifikat pendidik',
        'Hafidz/Hafidzah Al-Quran',
        'Lulusan pondok pesantren ternama',
        'Pelatihan berkala untuk pengajar'
      ]
    },
    {
      icon: Home,
      title: 'Fasilitas Lengkap',
      desc: 'Tersedia fasilitas modern untuk menunjang proses pembelajaran',
      color: 'bg-purple-500',
      features: [
        'Gedung sekolah ber-AC',
        'Asrama putra dan putri terpisah',
        'Masjid yang luas dan nyaman',
        'Laboratorium komputer dan IPA',
        'Lapangan olahraga'
      ]
    },
    {
      icon: Shield,
      title: 'Lingkungan Islami',
      desc: 'Suasana belajar yang kondusif dengan nuansa Islami',
      color: 'bg-teal-500',
      features: [
        'Pembiasaan ibadah harian',
        'Pemisahan santri putra dan putri',
        'Pengawasan 24 jam',
        'Pembinaan akhlak intensif'
      ]
    },
    {
      icon: Award,
      title: 'Prestasi Gemilang',
      desc: 'Konsisten meraih prestasi di berbagai kompetisi dan olimpiade',
      color: 'bg-yellow-500',
      features: [
        'Juara MTQ tingkat provinsi',
        'Medali olimpiade sains',
        'Kejuaraan olahraga antar pondok',
        'Penghargaan sekolah berprestasi'
      ]
    },
    {
      icon: Heart,
      title: 'Program Beasiswa',
      desc: 'Berbagai program beasiswa untuk siswa berprestasi dan kurang mampu',
      color: 'bg-red-500',
      features: [
        'Beasiswa prestasi akademik',
        'Beasiswa tahfidz Al-Quran',
        'Beasiswa yatim dan dhuafa',
        'Bantuan biaya pendidikan'
      ]
    },
  ]

  const achievements = [
    { label: 'Siswa Aktif', value: '1,500+' },
    { label: 'Lulusan', value: '5,000+' },
    { label: 'Hafidz/Hafidzah', value: '200+' },
    { label: 'Tahun Berdiri', value: '39+' },
  ]

  const testimonials = [
    {
      name: 'Ahmad Fadhil',
      role: 'Alumni 2020, Mahasiswa UIN Surabaya',
      text: 'Pendidikan di Imam Syafi\'i membentuk karakter saya. Ilmu agama dan umum yang saya dapat sangat bermanfaat untuk kuliah dan kehidupan sehari-hari.'
    },
    {
      name: 'Fatimah Azzahra',
      role: 'Alumni 2019, Guru TK Islam',
      text: 'Alhamdulillah berkat beasiswa tahfidz, saya bisa menyelesaikan hafalan 30 juz dan melanjutkan sebagai pengajar Al-Quran.'
    },
    {
      name: 'Bapak Sulaiman',
      role: 'Wali Santri',
      text: 'Saya sangat puas dengan pembinaan akhlak di sini. Anak saya menjadi lebih disiplin, rajin sholat, dan berbakti kepada orang tua.'
    },
  ]

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/about/yayasan">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Keunggulan Kami</h1>
            <p className="text-green-100 text-xl">Mengapa Memilih Yayasan Imam Syafi'i</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((item, index) => (
              <motion.div
                key={item.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">{item.value}</div>
                <div className="text-gray-600">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan List */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Keunggulan Utama</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Berbagai keunggulan yang menjadikan Yayasan Imam Syafi'i sebagai pilihan terbaik
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {keunggulan.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-4`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{item.desc}</p>
                    
                    <ul className="space-y-2">
                      {item.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
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

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Mengapa Memilih Kami?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Globe, text: 'Akreditasi A dari BAN-S/M' },
                { icon: Clock, text: 'Pembelajaran full day dan boarding' },
                { icon: Star, text: 'Program unggulan tahfidz 30 juz' },
                { icon: Shield, text: 'Keamanan dan pengawasan 24 jam' },
                { icon: Zap, text: 'Metode pembelajaran modern' },
                { icon: Users, text: 'Rasio guru dan siswa ideal' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Apa Kata Mereka
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm mb-4 italic">"{item.text}"</p>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bergabung Bersama Kami
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Daftarkan putra-putri Anda untuk mendapatkan pendidikan terbaik
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/pendaftaran">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Daftar Sekarang
              </Button>
            </Link>
            <Link href="/kontak">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                Kunjungi Kami
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
