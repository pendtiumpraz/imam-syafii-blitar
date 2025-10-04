'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  X,
  Menu,
  Search,
  Share2,
  Copy
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatActivityForWhatsApp, copyToClipboard, showCopyNotification } from '@/lib/whatsapp-formatter'
import PublicLayout from '@/components/layout/PublicLayout'

interface Activity {
  id: string
  title: string
  description: string
  date: string
  location: string
  category: string
  images: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export default function GalleryPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/activities?status=all&limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      
      // Transform the API data to match our interface
      const transformedActivities = data.activities.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        location: activity.location || 'Pondok Imam Syafi\'i',
        category: activity.type, // Map 'type' field to 'category'
        images: activity.photos || [], // Use photos array
        status: activity.status,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      }))
      
      setActivities(transformedActivities)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Gagal memuat data kegiatan. Silakan coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = [
    { id: 'home', label: 'Beranda', href: '/' },
    { id: 'about', label: 'Tentang', href: '/about/yayasan' },
    { id: 'pondok', label: 'Pondok', href: '/about/pondok' },
    { id: 'tk', label: 'TK', href: '/about/tk' },
    { id: 'sd', label: 'SD', href: '/about/sd' },
    { id: 'donasi', label: 'Donasi', href: '/donasi' },
    { id: 'kegiatan', label: 'Kegiatan', href: '/gallery' },
    { id: 'kajian', label: 'Kajian', href: '/kajian' },
    { id: 'perpustakaan', label: 'Perpustakaan', href: '/library' },
  ]

  const categories = [
    { value: 'all', label: 'Semua', color: 'bg-gray-100 text-gray-800' },
    { value: 'kajian', label: 'Kajian', color: 'bg-purple-100 text-purple-800' },
    { value: 'pelatihan', label: 'Pelatihan', color: 'bg-blue-100 text-blue-800' },
    { value: 'sosial', label: 'Sosial', color: 'bg-green-100 text-green-800' },
    { value: 'seminar', label: 'Seminar', color: 'bg-orange-100 text-orange-800' },
    { value: 'kompetisi', label: 'Kompetisi', color: 'bg-red-100 text-red-800' },
    { value: 'workshop', label: 'Workshop', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'lainnya', label: 'Lainnya', color: 'bg-yellow-100 text-yellow-800' },
  ]

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || activity.category.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateString // Return original string if parsing fails
    }
  }

  const handleCopyToWhatsApp = async (activity: Activity) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pondokimamsyafii.sch.id'
    const whatsappText = formatActivityForWhatsApp({
      title: activity.title,
      description: activity.description,
      date: activity.date,
      location: activity.location,
      category: categories.find(c => c.value === activity.category.toLowerCase())?.label || activity.category,
      link: `${baseUrl}/gallery`
    })
    
    const success = await copyToClipboard(whatsappText)
    showCopyNotification(success)
  }

  return (
    <PublicLayout>
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-xl font-bold text-green-800 cursor-pointer">
                  Pondok Imam Syafi'i
                </h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    item.id === 'kegiatan'
                      ? 'text-green-600' 
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/auth/signin">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/auth/signin" className="block px-3 py-2">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white pt-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Calendar className="w-3 h-3 mr-1" />
              Dokumentasi Kegiatan
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Galeri Kegiatan
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Dokumentasi berbagai kegiatan dan momen berharga di 
              Pondok Pesantren Imam Syafi'i Blitar
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari kegiatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <Grid3x3 className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="whitespace-nowrap"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Memuat kegiatan...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
              <button 
                onClick={fetchActivities}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-500 mb-4">
                <Calendar className="mx-auto h-12 w-12 mb-2" />
                <p>Tidak ada kegiatan yang ditemukan.</p>
                {searchQuery && <p className="text-sm">Coba ubah kata kunci pencarian Anda.</p>}
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "space-y-6"
            }>
              {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="relative h-64 bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden">
                    {activity.images && activity.images.length > 0 ? (
                      <>
                        <div className="absolute inset-0 bg-black/20"></div>
                        <img
                          src={activity.images[0]}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Calendar className="w-24 h-24 text-white/30" />
                        </div>
                      </>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className={categories.find(c => c.value === activity.category.toLowerCase())?.color || 'bg-gray-100 text-gray-800'}>
                        {categories.find(c => c.value === activity.category.toLowerCase())?.label || activity.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <Badge variant="secondary" className="bg-white/90">
                        {activity.images?.length || 0} Foto
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{activity.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            activity.status === 'completed' ? 'border-green-500 text-green-700' :
                            activity.status === 'ongoing' ? 'border-yellow-500 text-yellow-700' :
                            'border-blue-500 text-blue-700'
                          }`}
                        >
                          {activity.status === 'completed' ? 'Selesai' :
                           activity.status === 'ongoing' ? 'Berlangsung' : 'Direncanakan'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-xs text-gray-500">
                        Dibuat: {new Date(activity.createdAt).toLocaleDateString('id-ID')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyToWhatsApp(activity)
                          }}
                          className="text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
                          title="Salin untuk WhatsApp"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Activity Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedActivity.title}</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedActivity(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                {/* Image Gallery */}
                <div className="mb-6">
                  <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-4">
                    {selectedActivity.images && selectedActivity.images.length > 0 ? (
                      <>
                        <img
                          src={selectedActivity.images[selectedImageIndex]}
                          alt={`${selectedActivity.title} - Foto ${selectedImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          Foto {selectedImageIndex + 1} dari {selectedActivity.images.length}
                        </div>
                        {selectedActivity.images.length > 1 && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80"
                              onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                              disabled={selectedImageIndex === 0}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80"
                              onClick={() => setSelectedImageIndex(Math.min(selectedActivity.images.length - 1, selectedImageIndex + 1))}
                              disabled={selectedImageIndex === selectedActivity.images.length - 1}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Calendar className="w-16 h-16 mx-auto mb-2" />
                          <span>Tidak ada foto tersedia</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {selectedActivity.images && selectedActivity.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedActivity.images.map((image, index) => (
                        <button
                          key={index}
                          className={`w-20 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden ${
                            index === selectedImageIndex ? 'ring-2 ring-blue-600' : ''
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <Badge className={categories.find(c => c.value === selectedActivity.category.toLowerCase())?.color || 'bg-gray-100 text-gray-800'}>
                      {categories.find(c => c.value === selectedActivity.category.toLowerCase())?.label || selectedActivity.category}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600">{selectedActivity.description}</p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span>{formatDate(selectedActivity.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{selectedActivity.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Badge 
                        variant="outline" 
                        className={`${
                          selectedActivity.status === 'completed' ? 'border-green-500 text-green-700' :
                          selectedActivity.status === 'ongoing' ? 'border-yellow-500 text-yellow-700' :
                          'border-blue-500 text-blue-700'
                        }`}
                      >
                        Status: {selectedActivity.status === 'completed' ? 'Selesai' :
                                selectedActivity.status === 'ongoing' ? 'Berlangsung' : 'Direncanakan'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button 
                      variant="outline"
                      onClick={() => handleCopyToWhatsApp(selectedActivity)}
                      className="text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Salin untuk WhatsApp
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Bagikan
                    </Button>
                    <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Dibuat: {new Date(selectedActivity.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PublicLayout>
  )
}