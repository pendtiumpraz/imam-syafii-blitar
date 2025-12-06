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
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

export default function SMPPage() {
  const { config, loading } = useSiteConfig()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const programs = [
    {
      title: 'Kurikulum Terpadu',
      description: 'Memadukan kurikulum nasional dengan kurikulum pesantren',
      icon: BookOpen,
      features: ['Kurikulum Diknas', 'Kurikulum Pesantren', 'Bahasa Arab & Inggris'],
      color: 'from-blue-400 to-indigo-600'
    },
    {
      title: 'Program Tahfidz',
      description: 'Target hafalan minimal 5 juz selama 3 tahun',
      icon: Star,
      features: ['Setoran harian', 'Muraja\'ah berkala', 'Wisuda tahfidz'],
      color: 'from-emerald-400 to-green-600'
    },
    {
      title: 'Kajian Kitab',
      description: 'Pembelajaran kitab kuning dengan sanad bersambung',
      icon: BookOpen,
      features: ['Nahwu Shorof', 'Fiqih', 'Akhlak'],
      color: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Ekstrakurikuler',
      description: 'Pengembangan bakat dan minat santri',
      icon: Award,
      features: ['Pramuka', 'Olahraga', 'Seni & Keterampilan'],
      color: 'from-orange-400 to-red-600'
    },
  ]

  const facilities = [
    { name: 'Gedung Sekolah Ber-AC', icon: Home },
    { name: 'Asrama Putra & Putri', icon: Home },
    { name: 'Masjid', icon: Star },
    { name: 'Laboratorium IPA', icon: GraduationCap },
    { name: 'Lab Komputer', icon: Globe },
    { name: 'Perpustakaan', icon: BookOpen },
    { name: 'Lapangan Olahraga', icon: Award },
    { name: 'Kantin Sehat', icon: Heart },
  ]

  const achievements = [
    'Akreditasi A dari BAN-SM',
    'Juara MTQ Tingkat Kota',
    'Juara Olimpiade Sains',
    'Juara Pidato Bahasa Arab',
    'Juara Kaligrafi',
    'Juara Pramuka',
  ]

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
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
            <Badge className="bg-white/20 text-white mb-4">Jenjang SMP</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              SMP Islam Imam Syafi'i
            </h1>
            <p className="text-blue-100 text-xl max-w-2xl mx-auto">
              Pendidikan menengah pertama berbasis pesantren yang memadukan 
              ilmu umum dan ilmu agama untuk mencetak generasi Muslim berakhlak mulia
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div {...fadeInUp}>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">150+</div>
              <div className="text-gray-600">Santri Aktif</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">25+</div>
              <div className="text-gray-600">Tenaga Pengajar</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">A</div>
              <div className="text-gray-600">Akreditasi</div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Alumni</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Program Unggulan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Program pendidikan terpadu yang dirancang untuk menghasilkan lulusan berkualitas
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

      {/* Facilities */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fasilitas</h2>
            <p className="text-gray-600">Fasilitas lengkap untuk menunjang kegiatan belajar mengajar</p>
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
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <facility.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-700">{facility.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Prestasi</h2>
              <p className="text-gray-600">Berbagai prestasi yang telah diraih</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700">{achievement}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bergabung Bersama Kami
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Daftarkan putra-putri Anda untuk mendapatkan pendidikan terbaik
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/pendaftaran">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Daftar Sekarang
              </Button>
            </Link>
            <Link href="/kontak">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                Hubungi Kami
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
