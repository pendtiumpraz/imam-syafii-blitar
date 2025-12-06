'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Eye,
  Target,
  ArrowLeft,
  CheckCircle,
  Star,
  Heart,
  BookOpen,
  Users,
  Award
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

export default function VisiMisiPage() {
  const { config, loading } = useSiteConfig()

  const misiItems = [
    {
      icon: BookOpen,
      title: 'Pendidikan Berkualitas',
      desc: 'Menyelenggarakan pendidikan formal dan non-formal yang berkualitas dengan kurikulum terpadu antara ilmu umum dan ilmu agama Islam.'
    },
    {
      icon: Heart,
      title: 'Pembentukan Akhlak',
      desc: 'Membentuk karakter peserta didik yang berakhlakul karimah sesuai dengan tuntunan Al-Quran dan Sunnah Rasulullah SAW.'
    },
    {
      icon: Users,
      title: 'Pengembangan Potensi',
      desc: 'Mengembangkan potensi dan bakat peserta didik secara optimal melalui berbagai program ekstrakurikuler dan pengembangan diri.'
    },
    {
      icon: Award,
      title: 'Prestasi Unggul',
      desc: 'Menciptakan lingkungan belajar yang kondusif untuk meraih prestasi akademik dan non-akademik tingkat lokal hingga nasional.'
    },
    {
      icon: Star,
      title: 'Hafalan Al-Quran',
      desc: 'Mencetak generasi penghafal Al-Quran yang memahami dan mengamalkan isi kandungan Al-Quran dalam kehidupan sehari-hari.'
    },
  ]

  const values = [
    { title: 'Iman', desc: 'Menjadikan iman sebagai landasan dalam setiap aktivitas' },
    { title: 'Ilmu', desc: 'Menuntut ilmu dengan sungguh-sungguh untuk bekal dunia dan akhirat' },
    { title: 'Amal', desc: 'Mengamalkan ilmu yang didapat untuk kebaikan umat' },
    { title: 'Akhlak', desc: 'Menjunjung tinggi akhlak mulia dalam berinteraksi' },
    { title: 'Ukhuwah', desc: 'Membangun persaudaraan yang kuat sesama Muslim' },
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Visi & Misi</h1>
            <p className="text-green-100 text-xl">Arah dan Tujuan Pendidikan Kami</p>
          </div>
        </div>
      </div>

      {/* Visi Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
              <Eye className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-6">VISI</h2>
            
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
              <CardContent className="p-8">
                <p className="text-2xl md:text-3xl font-medium text-green-800 leading-relaxed">
                  "Menjadi Lembaga Pendidikan Islam Terdepan yang Mencetak Generasi Muslim 
                  Beriman, Berilmu, Berakhlak Mulia, dan Berdaya Saing Global"
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Misi Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <Target className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">MISI</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Langkah-langkah strategis untuk mewujudkan visi kami
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {misiItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <item.icon className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nilai-Nilai Inti</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Prinsip yang menjadi landasan dalam setiap aktivitas pendidikan
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="text-center hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-lg">{value.title.charAt(0)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{value.title}</h3>
                      <p className="text-gray-500 text-xs">{value.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tujuan Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Tujuan Pendidikan</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Menghasilkan lulusan yang beriman dan bertakwa kepada Allah SWT',
                'Mencetak generasi yang menguasai ilmu pengetahuan dan teknologi',
                'Membentuk pribadi yang berakhlak mulia dan berkarakter Islami',
                'Mengembangkan kreativitas dan inovasi dalam pembelajaran',
                'Mempersiapkan peserta didik untuk melanjutkan ke jenjang pendidikan yang lebih tinggi',
                'Mencetak penghafal Al-Quran yang memahami dan mengamalkan isinya',
              ].map((tujuan, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span className="text-green-50">{tujuan}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Wujudkan Cita-Cita Bersama Kami
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan keluarga besar Yayasan Imam Syafi'i
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/pendaftaran">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Daftar Sekarang
              </Button>
            </Link>
            <Link href="/about/latar-belakang">
              <Button size="lg" variant="outline">
                Sejarah Yayasan
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
