'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  School,
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
  Trophy,
  Globe,
  Brain,
  Laptop,
  Heart,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import PublicLayout from '@/components/layout/PublicLayout'
import { useSiteConfig } from '@/hooks/useSiteConfig'

interface Statistics {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  averageScore: number
}

export default function SDPage() {
  const { config, loading } = useSiteConfig()
  const [statistics, setStatistics] = useState<Statistics>({
    totalStudents: 450,
    totalTeachers: 35,
    totalClasses: 18,
    averageScore: 85
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
          totalStudents: data.totalStudentsSD,
          totalTeachers: 35,
          totalClasses: 18,
          averageScore: 85
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
      title: 'Kurikulum Merdeka',
      description: 'Implementasi kurikulum merdeka dengan pembelajaran berbasis proyek',
      icon: BookOpen,
      progress: 100,
      color: 'from-green-400 to-emerald-600'
    },
    {
      title: 'Tahfidz Quran',
      description: 'Program hafalan Al-Quran terintegrasi dengan pembelajaran',
      icon: BookOpen,
      progress: 85,
      color: 'from-blue-400 to-indigo-600'
    },
    {
      title: 'Digital Learning',
      description: 'Pembelajaran berbasis teknologi dengan lab komputer modern',
      icon: Laptop,
      progress: 90,
      color: 'from-purple-400 to-pink-600'
    },
    {
      title: 'Bilingual Program',
      description: 'Penguasaan bahasa Arab dan Inggris sejak dini',
      icon: Globe,
      progress: 80,
      color: 'from-orange-400 to-red-600'
    }
  ]

  const achievements = [
    { title: 'Juara 1 OSN Matematika', year: '2023', level: 'Kabupaten' },
    { title: 'Juara 2 Lomba Tahfidz', year: '2023', level: 'Provinsi' },
    { title: 'Juara 1 Lomba Sains', year: '2023', level: 'Kabupaten' },
    { title: 'Best School Award', year: '2022', level: 'Nasional' },
  ]

  const extracurricular = [
    { name: 'Pramuka', icon: Award, students: 250 },
    { name: 'Olahraga', icon: Trophy, students: 180 },
    { name: 'Seni & Musik', icon: Heart, students: 120 },
    { name: 'Robotika', icon: Brain, students: 60 },
    { name: 'English Club', icon: Globe, students: 90 },
    { name: 'Tahfidz Club', icon: BookOpen, students: 150 },
  ]

  const gradeDistribution = [
    { grade: 'Kelas 1', students: 75, color: 'bg-blue-500' },
    { grade: 'Kelas 2', students: 75, color: 'bg-green-500' },
    { grade: 'Kelas 3', students: 75, color: 'bg-yellow-500' },
    { grade: 'Kelas 4', students: 75, color: 'bg-purple-500' },
    { grade: 'Kelas 5', students: 75, color: 'bg-pink-500' },
    { grade: 'Kelas 6', students: 75, color: 'bg-indigo-500' },
  ]

  return (
    <PublicLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">SD Islam Imam Syafi'i</h1>
          <p className="text-purple-100 mt-2">Sekolah Dasar Unggulan Berbasis Islam</p>
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
              <Badge className="mb-4 bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Akreditasi A
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Mencetak Generasi
                <span className="block text-purple-600">Cerdas & Berkarakter</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                SD Islam Imam Syafi'i menerapkan sistem pendidikan holistik yang 
                mengintegrasikan kurikulum nasional dengan nilai-nilai Islam. Kami 
                berkomitmen membentuk siswa yang unggul dalam akademik, berkarakter 
                mulia, dan siap menghadapi tantangan global.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <School className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalStudents}</div>
                    <p className="text-xs text-gray-600">Siswa</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.totalTeachers}</div>
                    <p className="text-xs text-gray-600">Guru</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{statistics.averageScore}</div>
                    <p className="text-xs text-gray-600">Rata-rata</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-4">
                <Link href="/ppdb">
                  <Button className="bg-purple-600 hover:bg-purple-700">
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
            <motion.div variants={fadeInUp} className="relative h-[500px]">
              <Card className="h-full bg-gradient-to-br from-purple-100 to-indigo-50 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <School className="w-48 h-48 text-purple-200" />
                </div>
                <CardContent className="relative z-10 p-8 h-full flex flex-col justify-between">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4">
                    <h3 className="font-bold mb-2">Distribusi Kelas</h3>
                    <div className="space-y-2">
                      {gradeDistribution.slice(0, 3).map((grade, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{grade.grade}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${grade.color} h-2 rounded-full`}
                                style={{ width: `${(grade.students / 100) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{grade.students}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">UN Score Average</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">92.5</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 bg-white">
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
              Kurikulum terintegrasi untuk menghasilkan lulusan terbaik
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
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}>
                        <program.icon className="w-7 h-7 text-white" />
                      </div>
                      <Badge variant="secondary">{program.progress}%</Badge>
                    </div>
                    <CardTitle className="text-xl">{program.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{program.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Implementation</span>
                        <span className="font-semibold">{program.progress}%</span>
                      </div>
                      <Progress value={program.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Prestasi Terkini
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <Trophy className="w-10 h-10 text-yellow-500 mb-3" />
                    <h3 className="font-bold mb-2">{achievement.title}</h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{achievement.year}</Badge>
                      <span className="text-sm text-gray-600">{achievement.level}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extracurricular */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Ekstrakurikuler
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {extracurricular.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <activity.icon className="w-10 h-10 text-purple-600" />
                      <Badge className="bg-purple-100 text-purple-800">
                        {activity.students} siswa
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg">{activity.name}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mengapa Memilih SD Islam Imam Syafi'i?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Target, 
                title: 'Kurikulum Terpadu', 
                desc: 'Integrasi kurikulum nasional dengan nilai-nilai Islam' 
              },
              { 
                icon: Users, 
                title: 'Guru Berkualitas', 
                desc: 'Tenaga pendidik bersertifikat dan berpengalaman' 
              },
              { 
                icon: Award, 
                title: 'Prestasi Gemilang', 
                desc: 'Track record prestasi akademik dan non-akademik' 
              },
              { 
                icon: Laptop, 
                title: 'Fasilitas Modern', 
                desc: 'Lab komputer, perpustakaan, dan fasilitas olahraga lengkap' 
              },
              { 
                icon: Heart, 
                title: 'Pembinaan Karakter', 
                desc: 'Fokus pada akhlak mulia dan kepribadian Islami' 
              },
              { 
                icon: Globe, 
                title: 'Global Mindset', 
                desc: 'Mempersiapkan siswa untuk tantangan global' 
              },
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
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-purple-100">{item.desc}</p>
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
              Bergabunglah dengan Keluarga Besar Kami
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Pendaftaran tahun ajaran 2024/2025 telah dibuka
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/ppdb">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Daftar Online
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline">
                  Informasi Lebih Lanjut
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
                <MapPin className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Alamat</h3>
                <p className="text-sm text-gray-600">
                  {config.address}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="w-10 h-10 text-purple-600 mx-auto mb-3" />
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
                <Mail className="w-10 h-10 text-purple-600 mx-auto mb-3" />
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