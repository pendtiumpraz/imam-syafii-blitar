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
  GraduationCap,
  Heart,
  Globe,
  Target,
  Sparkles,
  Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

export default function SMAPage() {
  const { config, loading } = useSiteConfig()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const programs = [
    {
      title: 'Kurikulum Merdeka',
      description: 'Kurikulum nasional terbaru dengan pendekatan pembelajaran mandiri',
      icon: BookOpen,
      features: ['Project Based Learning', 'Profil Pelajar Pancasila', 'Pembelajaran Diferensiasi'],
      color: 'from-green-400 to-emerald-600'
    },
    {
      title: 'Program Tahfidz',
      description: 'Target hafalan 10-30 juz selama 3 tahun',
      icon: Star,
      features: ['Setoran harian', 'Muraja\'ah intensif', 'Sanad bersambung'],
      color: 'from-emerald-400 to-teal-600'
    },
    {
      title: 'Kajian Kitab Kuning',
      description: 'Pembelajaran kitab klasik dengan metode sorogan dan bandongan',
      icon: BookOpen,
      features: ['Nahwu Shorof lanjutan', 'Fiqih 4 madzhab', 'Ushul Fiqih'],
      color: 'from-blue-400 to-indigo-600'
    },
    {
      title: 'Persiapan Perguruan Tinggi',
      description: 'Bimbingan intensif untuk melanjutkan ke perguruan tinggi',
      icon: GraduationCap,
      features: ['Bimbel UTBK', 'Persiapan Beasiswa', 'Career Counseling'],
      color: 'from-purple-400 to-pink-600'
    },
  ]

  const jurusan = [
    {
      name: 'IPA (Ilmu Pengetahuan Alam)',
      desc: 'Matematika, Fisika, Kimia, Biologi',
      icon: Target,
      color: 'bg-blue-500'
    },
    {
      name: 'IPS (Ilmu Pengetahuan Sosial)',
      desc: 'Ekonomi, Sosiologi, Geografi, Sejarah',
      icon: Globe,
      color: 'bg-green-500'
    },
    {
      name: 'Program Keagamaan',
      desc: 'Fokus pada ilmu-ilmu keislaman',
      icon: Star,
      color: 'bg-yellow-500'
    },
  ]

  const facilities = [
    { name: 'Gedung Sekolah Modern', icon: Home },
    { name: 'Asrama Putra & Putri', icon: Home },
    { name: 'Masjid Kampus', icon: Star },
    { name: 'Lab IPA Lengkap', icon: Target },
    { name: 'Lab Komputer', icon: Globe },
    { name: 'Perpustakaan Digital', icon: BookOpen },
    { name: 'Lapangan Olahraga', icon: Award },
    { name: 'Aula Serbaguna', icon: Users },
  ]

  const alumniSuccess = [
    { university: 'UIN Sunan Ampel Surabaya', count: '50+' },
    { university: 'UIN Malang', count: '30+' },
    { university: 'Universitas Brawijaya', count: '20+' },
    { university: 'Universitas Negeri Malang', count: '25+' },
    { university: 'Beasiswa Timur Tengah', count: '15+' },
    { university: 'PTN Lainnya', count: '100+' },
  ]

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/about/yayasan">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/20 text-white mb-4">Jenjang SMA</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              SMA Islam Imam Syafi'i
            </h1>
            <p className="text-green-100 text-xl max-w-2xl mx-auto">
              Pendidikan menengah atas berbasis pesantren yang mempersiapkan 
              santri untuk sukses di dunia dan akhirat
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div {...fadeInUp}>
              <div className="text-3xl md:text-4xl font-bold text-green-600">120+</div>
              <div className="text-gray-600">Santri Aktif</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="text-3xl md:text-4xl font-bold text-green-600">30+</div>
              <div className="text-gray-600">Tenaga Pengajar</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="text-3xl md:text-4xl font-bold text-green-600">95%</div>
              <div className="text-gray-600">Lulus PTN</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
              <div className="text-3xl md:text-4xl font-bold text-green-600">300+</div>
              <div className="text-gray-600">Alumni</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Jurusan */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pilihan Jurusan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tiga pilihan jurusan sesuai minat dan bakat santri
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {jurusan.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow text-center">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Program Unggulan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Program pendidikan terpadu untuk mencetak lulusan berkualitas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program, index) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${program.color} flex items-center justify-center mb-4`}>
                      <program.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{program.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                    <ul className="space-y-1">
                      {program.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
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

      {/* Alumni Success */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Jejak Alumni</h2>
            <p className="text-gray-600">Alumni kami tersebar di berbagai perguruan tinggi ternama</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {alumniSuccess.map((item, index) => (
              <motion.div
                key={item.university}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600 mb-1">{item.count}</div>
                    <p className="text-sm text-gray-600">{item.university}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fasilitas</h2>
            <p className="text-gray-600">Fasilitas modern untuk menunjang pembelajaran</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {facilities.map((facility, index) => (
              <motion.div
                key={facility.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <facility.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-700">{facility.name}</p>
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
            Raih Masa Depan Cemerlang
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah bersama kami untuk mempersiapkan masa depan yang sukses dunia dan akhirat
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/pendaftaran">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Daftar Sekarang
              </Button>
            </Link>
            <Link href="/about/beasiswa">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                Info Beasiswa
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
