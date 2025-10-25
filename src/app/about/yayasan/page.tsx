'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Building2,
  Target,
  Eye,
  Users,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Heart,
  BookOpen
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

export default function YayasanPage() {
  const { config, loading } = useSiteConfig()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const timeline = [
    { year: '1985', event: 'Pendirian Yayasan Imam Syafi\'i', desc: 'Dimulai dengan 20 santri' },
    { year: '1990', event: 'Pembukaan TK Islam', desc: 'Ekspansi pendidikan anak usia dini' },
    { year: '1995', event: 'Pembukaan SD Islam', desc: 'Melengkapi jenjang pendidikan dasar' },
    { year: '2000', event: 'Pembangunan Asrama Putri', desc: 'Menerima santri putri' },
    { year: '2010', event: 'Akreditasi A', desc: 'Pengakuan kualitas pendidikan' },
    { year: '2020', event: 'Digitalisasi Sistem', desc: 'Transformasi digital pendidikan' },
  ]

  const pengurus = [
    { name: 'KH. Ahmad Muzakki', position: 'Ketua Yayasan', photo: '/images/ketua.jpg' },
    { name: 'Ustadz Muhammad Ridwan', position: 'Sekretaris', photo: '/images/sekretaris.jpg' },
    { name: 'H. Sulaiman', position: 'Bendahara', photo: '/images/bendahara.jpg' },
    { name: 'Ustadzah Fatimah', position: 'Bidang Pendidikan', photo: '/images/pendidikan.jpg' },
  ]

  const programs = [
    { icon: BookOpen, title: 'Pendidikan Formal', count: '3 Unit', desc: 'TK, SD, dan Pondok Pesantren' },
    { icon: Heart, title: 'Program Sosial', count: '10+', desc: 'Santunan yatim dan dhuafa' },
    { icon: Users, title: 'Pemberdayaan', count: '5 Program', desc: 'Pelatihan dan keterampilan' },
    { icon: TrendingUp, title: 'Unit Usaha', count: '8 Unit', desc: 'Koperasi, kantin, dan lainnya' },
  ]

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Profil Yayasan</h1>
            <p className="text-green-100 text-xl">Yayasan Pendidikan Islam Imam Syafi'i Blitar</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerChildren}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-green-100 text-green-800">
                Sejak 1985
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Yayasan Pendidikan Islam
                <span className="block text-green-600">Imam Syafi'i Blitar</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Yayasan Pendidikan Islam Imam Syafi'i Blitar didirikan pada tahun 1985 dengan 
                tujuan menciptakan lembaga pendidikan Islam yang berkualitas, modern, dan 
                berlandaskan Al-Quran dan Sunnah. Selama lebih dari 39 tahun, yayasan telah 
                berkembang menjadi salah satu lembaga pendidikan Islam terkemuka di Jawa Timur.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-green-600">39+</div>
                    <p className="text-sm text-gray-600">Tahun Pengabdian</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-green-600">5000+</div>
                    <p className="text-sm text-gray-600">Alumni</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative h-[400px]">
              <Card className="h-full bg-gradient-to-br from-green-100 to-green-50">
                <CardContent className="p-0 h-full flex items-center justify-center">
                  <Building2 className="w-32 h-32 text-green-600" />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Visi Misi */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-center mb-12">
              Visi & Misi
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div variants={fadeInUp}>
                <Card className="h-full border-green-200">
                  <CardContent className="p-8">
                    <Eye className="w-12 h-12 text-green-600 mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Visi</h3>
                    <p className="text-gray-600 leading-relaxed">
                      "Menjadi yayasan pendidikan Islam terkemuka yang melahirkan generasi Qurani, 
                      berakhlak mulia, cerdas, mandiri, dan bermanfaat bagi umat serta bangsa."
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Card className="h-full border-green-200">
                  <CardContent className="p-8">
                    <Target className="w-12 h-12 text-green-600 mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Misi</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Menyelenggarakan pendidikan Islam berkualitas dari TK hingga Pesantren</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Mengembangkan kurikulum terpadu antara ilmu agama dan umum</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Membentuk karakter santri berakhlakul karimah</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Mengembangkan sarana prasarana pendidikan modern</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Sejarah & Perkembangan
          </motion.h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-green-200"></div>
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center mb-8 ${
                  index % 2 === 0 ? 'justify-end pr-8 md:pr-1/2' : 'justify-start pl-8 md:pl-1/2'
                }`}
              >
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <Card className="inline-block">
                    <CardContent className="p-6">
                      <Badge className="mb-2 bg-green-100 text-green-800">{item.year}</Badge>
                      <h3 className="text-xl font-bold mb-1">{item.event}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-600 rounded-full border-4 border-white"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pengurus */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Struktur Pengurus
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-6">
            {pengurus.map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="font-bold mb-1">{person.name}</h3>
                    <p className="text-sm text-gray-600">{person.position}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Program Yayasan
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-6">
            {programs.map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <program.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">{program.title}</h3>
                <div className="text-3xl font-bold mb-2">{program.count}</div>
                <p className="text-green-100 text-sm">{program.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Kontak Yayasan
          </motion.h2>
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