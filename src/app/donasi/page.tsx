'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { DonationCategory, DonationCampaign, Donation } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  HeartIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ClockIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolidIcon,
  FireIcon
} from '@heroicons/react/24/solid'
import {
  Building2,
  GraduationCap,
  Award,
  Heart as HeartLucide,
  Settings,
  Church,
  Coins,
  Beef,
  AlertCircle,
  Gift
} from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import { DonationProgress } from '@/components/donasi/donation-progress'
import { DonorList } from '@/components/donasi/donor-list'
import { SocialShare } from '@/components/donasi/social-share'

type SortOption = 'newest' | 'highest' | 'almost' | 'urgent'

// Icon mapping
const iconMap: { [key: string]: any } = {
  Building: Building2,
  Building2: Building2,
  GraduationCap: GraduationCap,
  Award: Award,
  Heart: HeartLucide,
  Settings: Settings,
  Mosque: Church,
  Church: Church,
  Coins: Coins,
  Beef: Beef,
  AlertCircle: AlertCircle,
  Gift: Gift
}

const getIconComponent = (iconName: string | null) => {
  if (!iconName) return null
  const IconComponent = iconMap[iconName]
  return IconComponent ? <IconComponent className="w-4 h-4" /> : null
}

export default function DonasiPage() {
  const [categories, setCategories] = useState<DonationCategory[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<DonationCampaign[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [campaignDonations, setCampaignDonations] = useState<Donation[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalCollected: 0,
    totalDonors: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [campaigns, selectedCategory, sortBy, searchQuery])

  const fetchData = async () => {
    try {
      const [categoriesRes, campaignsRes] = await Promise.all([
        fetch('/api/donations/categories'),
        fetch('/api/donations/campaigns?status=ACTIVE&status=COMPLETED')
      ])

      const categoriesData = await categoriesRes.json()
      const campaignsData = await campaignsRes.json()

      setCategories(categoriesData || [])

      const activeCampaigns = (campaignsData.campaigns || []).filter(
        (c: DonationCampaign) => c.status === 'ACTIVE' || c.status === 'COMPLETED'
      )

      setCampaigns(activeCampaigns)

      // Calculate stats
      const totalCollected = activeCampaigns.reduce((sum: number, c: DonationCampaign) => sum + c.currentAmount, 0)
      const totalDonors = activeCampaigns.reduce((sum: number, c: DonationCampaign) => sum + (c._count?.donations || 0), 0)

      setStats({
        totalCampaigns: activeCampaigns.length,
        totalCollected,
        totalDonors
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...campaigns]

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.categoryId === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'highest':
        filtered.sort((a, b) => b.targetAmount - a.targetAmount)
        break
      case 'almost':
        filtered.sort((a, b) => {
          const progressA = (a.currentAmount / a.targetAmount) * 100
          const progressB = (b.currentAmount / b.targetAmount) * 100
          return progressB - progressA
        })
        break
      case 'urgent':
        filtered.sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1
          if (!a.isUrgent && b.isUrgent) return 1
          return 0
        })
        break
    }

    setFilteredCampaigns(filtered)
  }

  const openModal = async (campaign: DonationCampaign) => {
    setSelectedCampaign(campaign)
    setCurrentImageIndex(0)
    setModalOpen(true)

    // Fetch campaign donations
    try {
      const res = await fetch(`/api/donations/campaigns/${campaign.slug}/donations`)
      const data = await res.json()
      setCampaignDonations(data.donations || [])
    } catch (error) {
      console.error('Error fetching donations:', error)
      setCampaignDonations([])
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedCampaign(null)
    setCampaignDonations([])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Berakhir'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} hari lagi`

    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours} jam lagi`
  }

  const getImageUrl = (campaign: DonationCampaign) => {
    if (campaign.mainImage) return campaign.mainImage
    if (campaign.images && campaign.images.length > 0) {
      return campaign.images[0]
    }
    return null
  }

  const nextImage = () => {
    if (selectedCampaign && selectedCampaign.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === selectedCampaign.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (selectedCampaign && selectedCampaign.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedCampaign.images.length - 1 : prev - 1
      )
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-200 h-96 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 to-green-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Donasi & Sedekah
            </h1>
            <p className="text-xl mb-8 text-green-100">
              Salurkan donasi Anda untuk mendukung program-program pesantren
            </p>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <div className="text-3xl font-bold mb-2">{stats.totalCampaigns}</div>
                <div className="text-green-100">Total Campaign</div>
              </Card>
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <div className="text-3xl font-bold mb-2">{formatCurrency(stats.totalCollected)}</div>
                <div className="text-green-100">Total Terkumpul</div>
              </Card>
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                <div className="text-3xl font-bold mb-2">{stats.totalDonors}</div>
                <div className="text-green-100">Total Donatur</div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          {/* Category Tabs */}
          <div className="mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="whitespace-nowrap"
              >
                Semua
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  {getIconComponent(cat.icon)}
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={sortBy === 'newest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('newest')}
              >
                Terbaru
              </Button>
              <Button
                variant={sortBy === 'highest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('highest')}
              >
                Target Tertinggi
              </Button>
              <Button
                variant={sortBy === 'almost' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('almost')}
              >
                Hampir Tercapai
              </Button>
              <Button
                variant={sortBy === 'urgent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('urgent')}
              >
                Mendesak
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak ada campaign ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah filter atau kata kunci pencarian Anda
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const progress = calculateProgress(campaign.currentAmount, campaign.targetAmount)
              const remaining = Math.max(campaign.targetAmount - campaign.currentAmount, 0)
              const imageUrl = getImageUrl(campaign)

              return (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={campaign.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <HeartIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {campaign.isUrgent && (
                        <Badge className="bg-red-500 text-white">
                          <FireIcon className="w-3 h-3 mr-1" />
                          Mendesak
                        </Badge>
                      )}
                      {campaign.isFeatured && (
                        <Badge className="bg-yellow-500 text-white">
                          ⭐ Pilihan
                        </Badge>
                      )}
                    </div>

                    {campaign.endDate && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatTimeRemaining(campaign.endDate)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs">
                        {campaign.category?.name}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-3 line-clamp-2">
                      {campaign.title}
                    </h3>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            campaign.isUrgent ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Target</div>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(campaign.targetAmount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Terkumpul</div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(campaign.currentAmount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Sisa</div>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(remaining)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          {campaign._count?.donations || 0} donatur
                        </div>
                        <div>{Math.round(progress)}%</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => openModal(campaign)}
                      className="w-full"
                      variant="outline"
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCampaign && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedCampaign.title}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">
                        {selectedCampaign.category?.name}
                      </Badge>
                      {selectedCampaign.isUrgent && (
                        <Badge className="bg-red-500">
                          <FireIcon className="w-3 h-3 mr-1" />
                          Mendesak
                        </Badge>
                      )}
                      {selectedCampaign.isFeatured && (
                        <Badge className="bg-yellow-500">⭐ Pilihan</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Image Gallery */}
              {selectedCampaign.images && selectedCampaign.images.length > 0 && (
                <div className="relative">
                  <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={selectedCampaign.images[currentImageIndex]}
                      alt={selectedCampaign.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {selectedCampaign.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {selectedCampaign.images.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Video Embed */}
              {selectedCampaign.video && (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {selectedCampaign.video.includes('youtube.com') || selectedCampaign.video.includes('youtu.be') ? (
                      <iframe
                        src={selectedCampaign.video.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <a
                          href={selectedCampaign.video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                          <PlayIcon className="w-16 h-16" />
                          <span>Tonton Video</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Details */}
              <DonationProgress
                campaign={selectedCampaign}
                donorCount={campaignDonations.length}
                showDetails={true}
              />

              {/* Full Story */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cerita Campaign</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedCampaign.story || selectedCampaign.description}
                  </p>
                </div>
              </div>

              {/* Recent Donations */}
              {campaignDonations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Donatur Terbaru</h3>
                  <DonorList
                    donations={campaignDonations}
                    showAmount={true}
                    showMessage={true}
                    limit={5}
                  />
                </div>
              )}

              {/* Share Buttons */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Bagikan Campaign</h3>
                <SocialShare
                  shareData={{
                    title: selectedCampaign.title,
                    text: selectedCampaign.description,
                    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/donasi/campaign/${selectedCampaign.slug}`,
                    hashtags: ['Donasi', 'Sedekah', 'PondokImamSyafii']
                  }}
                  size="md"
                />
              </div>

              {/* Donation Button */}
              <div className="sticky bottom-0 bg-white pt-4 border-t">
                <Button
                  className="w-full py-6 text-lg"
                  size="lg"
                  onClick={() => {
                    window.location.href = `/donasi/donate?campaign=${selectedCampaign.id}`
                  }}
                >
                  <HeartSolidIcon className="w-6 h-6 mr-2" />
                  Donasi Sekarang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  )
}
