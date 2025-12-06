'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  History,
  Calendar,
  Users,
  ArrowLeft,
  Quote,
  BookOpen,
  Heart,
  MapPin
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

export default function LatarBelakangPage() {
  const { config, loading } = useSiteConfig()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const timeline = [
    { 
      year: '1985', 
      title: 'Awal Mula Pendirian',
      desc: 'Berawal dari keprihatinan terhadap kondisi pendidikan Islam di Blitar, para tokoh masyarakat dan ulama setempat bersepakat untuk mendirikan lembaga pendidikan Islam yang terpadu.'
    },
    { 
      year: '1990', 
      title: 'Pengembangan Pendidikan Anak Usia Dini',
      desc: 'Membuka KB-TK Islam Imam Syafi\'i untuk melayani pendidikan anak usia dini dengan kurikulum Islam yang terintegrasi.'
    },
    { 
      year: '1995', 
      title: 'Pendirian SD Islam',
      desc: 'Melanjutkan misi pendidikan dengan mendirikan SD Islam Imam Syafi\'i untuk memberikan pendidikan dasar berkualitas dengan nilai-nilai Islam.'
    },
    { 
      year: '2000', 
      title: 'Pembukaan Pondok Pesantren',
      desc: 'Mendirikan Pondok Pesantren untuk santri putra dan putri dengan fokus pada hafalan Al-Quran dan kajian kitab kuning.'
    },
    { 
      year: '2010', 
      title: 'Akreditasi dan Pengakuan',
      desc: 'Seluruh unit pendidikan berhasil meraih akreditasi A dan mendapat pengakuan dari masyarakat luas.'
    },
    { 
      year: '2020', 
      title: 'Transformasi Digital',
      desc: 'Menerapkan sistem digital untuk manajemen pendidikan dan membuka akses pembelajaran online.'
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Latar Belakang</h1>
            <p className="text-green-100 text-xl">Sejarah dan Perjalanan Yayasan Imam Syafi'i</p>
          </div>
        </div>
      </div>

      {/* Intro Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <Quote className="w-12 h-12 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-lg text-gray-700 italic mb-4">
                      "Yayasan Pendidikan Islam Imam Syafi'i didirikan dengan semangat untuk mencetak generasi 
                      Muslim yang beriman, berilmu, dan berakhlak mulia. Kami berkomitmen untuk memberikan 
                      pendidikan terbaik yang memadukan kurikulum nasional dengan nilai-nilai Islam."
                    </p>
                    <p className="text-gray-500">- Para Pendiri Yayasan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Background Story */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Kisah Pendirian
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <p className="mb-6">
                  Pada tahun 1985, di tengah keprihatinan terhadap kondisi pendidikan Islam di Kota Blitar, 
                  sekelompok tokoh masyarakat dan ulama berkumpul untuk membahas solusi atas tantangan tersebut. 
                  Mereka melihat perlunya lembaga pendidikan yang tidak hanya mengajarkan ilmu duniawi, 
                  tetapi juga membekali generasi muda dengan pemahaman agama yang kuat.
                </p>
                
                <p className="mb-6">
                  Dengan semangat perjuangan dan tekad yang bulat, para pendiri sepakat untuk mendirikan 
                  Yayasan Pendidikan Islam Imam Syafi'i. Nama Imam Syafi'i dipilih sebagai bentuk penghormatan 
                  kepada salah satu ulama besar dalam Islam yang dikenal dengan keilmuan dan akhlaknya yang mulia.
                </p>
                
                <p className="mb-6">
                  Bermula dari sebuah bangunan sederhana dengan fasilitas terbatas, yayasan ini terus berkembang 
                  berkat dukungan masyarakat dan dedikasi para pengajar. Saat ini, Yayasan Imam Syafi'i telah 
                  menjadi salah satu lembaga pendidikan Islam terkemuka di Blitar dengan berbagai unit pendidikan 
                  mulai dari KB-TK hingga Pondok Pesantren.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Perjalanan Waktu
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-200" />
              
              {timeline.map((item, index) => (
                <motion.div
                  key={item.year}
                  className="relative pl-20 pb-12 last:pb-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-5 h-5 bg-green-600 rounded-full border-4 border-white shadow" />
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-bold">{item.year}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">39+</div>
              <div className="text-green-100">Tahun Berdiri</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">7</div>
              <div className="text-green-100">Unit Pendidikan</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-green-100">Alumni</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-green-100">Tenaga Pendidik</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bergabunglah Bersama Kami
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Jadilah bagian dari perjalanan kami dalam mencetak generasi Muslim yang unggul
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/pendaftaran">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Daftar Sekarang
              </Button>
            </Link>
            <Link href="/about/visi-misi">
              <Button size="lg" variant="outline">
                Lihat Visi Misi
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
