'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle,
  FileText,
  Calendar,
  Users,
  Award,
  BookOpen,
  Heart,
  Star
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PublicLayout from '@/components/layout/PublicLayout'

export default function BeasiswaPage() {
  const scholarships = [
    {
      title: 'Beasiswa Prestasi Akademik',
      desc: 'Untuk siswa dengan prestasi akademik terbaik di sekolah asal',
      coverage: 'Bebas SPP 50-100%',
      icon: Award,
      color: 'bg-yellow-500',
      requirements: [
        'Nilai rapor rata-rata minimal 85',
        'Peringkat 1-3 di kelas',
        'Surat rekomendasi dari kepala sekolah'
      ]
    },
    {
      title: 'Beasiswa Tahfidz Al-Quran',
      desc: 'Untuk calon santri yang sudah hafal minimal 5 juz',
      coverage: 'Bebas SPP 75-100%',
      icon: BookOpen,
      color: 'bg-green-500',
      requirements: [
        'Hafal minimal 5 juz Al-Quran',
        'Lulus tes hafalan',
        'Bersedia mengikuti program tahfidz'
      ]
    },
    {
      title: 'Beasiswa Dhuafa',
      desc: 'Untuk siswa dari keluarga kurang mampu',
      coverage: 'Bebas SPP 50-100%',
      icon: Heart,
      color: 'bg-red-500',
      requirements: [
        'Surat keterangan tidak mampu (SKTM)',
        'Penghasilan orang tua dibawah UMR',
        'Lolos verifikasi data ekonomi'
      ]
    },
    {
      title: 'Beasiswa Yatim/Piatu',
      desc: 'Untuk anak yatim, piatu, atau yatim piatu',
      coverage: 'Bebas SPP 100%',
      icon: Users,
      color: 'bg-blue-500',
      requirements: [
        'Akta kematian orang tua',
        'Surat keterangan dari RT/RW',
        'Kartu Keluarga'
      ]
    },
    {
      title: 'Beasiswa Bakat & Minat',
      desc: 'Untuk siswa dengan bakat khusus di bidang tertentu',
      coverage: 'Bebas SPP 25-75%',
      icon: Star,
      color: 'bg-purple-500',
      requirements: [
        'Sertifikat kejuaraan minimal tingkat kota/kabupaten',
        'Portofolio prestasi',
        'Lolos seleksi bakat'
      ]
    },
  ]

  const steps = [
    { step: 1, title: 'Registrasi Online', desc: 'Daftar melalui website dan lengkapi data diri' },
    { step: 2, title: 'Upload Dokumen', desc: 'Unggah dokumen persyaratan yang diperlukan' },
    { step: 3, title: 'Verifikasi', desc: 'Tim seleksi akan memverifikasi data dan dokumen' },
    { step: 4, title: 'Tes Seleksi', desc: 'Mengikuti tes sesuai jenis beasiswa' },
    { step: 5, title: 'Pengumuman', desc: 'Hasil seleksi diumumkan melalui website' },
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Program Beasiswa</h1>
            <p className="text-green-100 text-xl">Kesempatan Pendidikan untuk Semua</p>
          </div>
        </div>
      </div>

      {/* Intro */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GraduationCap className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Wujudkan Mimpi Pendidikan Anda
            </h2>
            <p className="text-gray-600 text-lg">
              Yayasan Imam Syafi'i berkomitmen untuk memberikan akses pendidikan berkualitas 
              kepada seluruh lapisan masyarakat melalui berbagai program beasiswa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Scholarship Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Jenis Beasiswa
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {scholarships.map((scholarship, index) => (
              <motion.div
                key={scholarship.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${scholarship.color} rounded-lg flex items-center justify-center mb-4`}>
                      <scholarship.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{scholarship.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{scholarship.desc}</p>
                    <Badge className="bg-green-100 text-green-800 mb-4">{scholarship.coverage}</Badge>
                    
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Persyaratan:</p>
                      <ul className="space-y-1">
                        {scholarship.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Alur Pendaftaran
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  className="flex-1 text-center relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-full h-0.5 bg-green-200" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Dokumen yang Diperlukan
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Fotokopi Kartu Keluarga',
                'Fotokopi KTP Orang Tua/Wali',
                'Fotokopi Akta Kelahiran',
                'Pas Foto 3x4 (3 lembar)',
                'Fotokopi Rapor Terakhir',
                'Surat Keterangan dari Sekolah Asal',
                'Dokumen pendukung sesuai jenis beasiswa',
                'Formulir pendaftaran yang sudah diisi lengkap',
              ].map((doc, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{doc}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Jadwal Pendaftaran
            </h2>
            <p className="text-gray-600 mb-8">
              Pendaftaran beasiswa dibuka setiap tahun ajaran baru
            </p>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Pendaftaran</p>
                    <p className="font-semibold text-green-800">Januari - Mei</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seleksi</p>
                    <p className="font-semibold text-green-800">Juni</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pengumuman</p>
                    <p className="font-semibold text-green-800">Juli</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Mendaftar?
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Jangan lewatkan kesempatan untuk mendapatkan pendidikan berkualitas dengan beasiswa
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/pendaftaran">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Daftar Beasiswa
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
