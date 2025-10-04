'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Save, Loader2 } from 'lucide-react'

interface DonationCategory {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
}

interface Campaign {
  id: string
  title: string
  slug: string
  description: string
  story?: string | null
  categoryId: string
  targetAmount: number
  currentAmount: number
  startDate: Date
  endDate?: Date | null
  mainImage?: string | null
  images: string[]
  video?: string | null
  status: string
  isFeatured: boolean
  isUrgent: boolean
  allowAnonymous: boolean
}

interface CampaignFormSlideoverProps {
  campaign?: Campaign | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export function CampaignFormSlideover({
  campaign,
  isOpen,
  onClose,
  onSubmit
}: CampaignFormSlideoverProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<DonationCategory[]>([])
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: '',
    description: '',
    story: '',
    targetAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    mainImage: '',
    images: '',
    video: '',
    status: 'DRAFT',
    isFeatured: false,
    isUrgent: false,
    allowAnonymous: true,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title,
        slug: campaign.slug,
        categoryId: campaign.categoryId,
        description: campaign.description,
        story: campaign.story || '',
        targetAmount: campaign.targetAmount.toString(),
        startDate: new Date(campaign.startDate).toISOString().split('T')[0],
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        mainImage: campaign.mainImage || '',
        images: Array.isArray(campaign.images) ? campaign.images.join(', ') : '',
        video: campaign.video || '',
        status: campaign.status,
        isFeatured: campaign.isFeatured,
        isUrgent: campaign.isUrgent,
        allowAnonymous: campaign.allowAnonymous,
      })
    } else {
      // Reset form for new campaign
      setFormData({
        title: '',
        slug: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        description: '',
        story: '',
        targetAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        mainImage: '',
        images: '',
        video: '',
        status: 'DRAFT',
        isFeatured: false,
        isUrgent: false,
        allowAnonymous: true,
      })
    }
  }, [campaign, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/donations/categories?active=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title })
    if (!campaign) {
      // Only auto-generate slug for new campaigns
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, title, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.categoryId || !formData.description || !formData.targetAmount) {
      setError('Mohon lengkapi semua field yang wajib')
      return
    }

    if (parseFloat(formData.targetAmount) <= 0) {
      setError('Target donasi harus lebih dari 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Parse images (comma-separated or JSON array)
      let imagesArray: string[] = []
      if (formData.images) {
        try {
          imagesArray = JSON.parse(formData.images)
        } catch {
          imagesArray = formData.images.split(',').map(img => img.trim()).filter(Boolean)
        }
      }

      const submitData = {
        title: formData.title,
        slug: formData.slug || undefined,
        categoryId: formData.categoryId,
        description: formData.description,
        story: formData.story || null,
        targetAmount: parseFloat(formData.targetAmount),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        mainImage: formData.mainImage || null,
        images: imagesArray,
        video: formData.video || null,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isUrgent: formData.isUrgent,
        allowAnonymous: formData.allowAnonymous,
      }

      await onSubmit(submitData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {campaign ? 'Edit Campaign Donasi' : 'Tambah Campaign Donasi'}
              </h2>
              <p className="text-sm text-gray-600">
                {campaign ? campaign.title : 'Buat campaign donasi baru'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Informasi Dasar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Judul Campaign *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Contoh: Bantu Renovasi Masjid Ponpes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slug {campaign ? '' : '(otomatis dari judul)'}
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="bantu-renovasi-masjid-ponpes"
                    disabled={!campaign}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /donasi/{formData.slug || 'slug-campaign'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kategori *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deskripsi Singkat *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    placeholder="Ringkasan singkat tentang campaign ini"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cerita Lengkap
                  </label>
                  <textarea
                    value={formData.story}
                    onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={6}
                    placeholder="Cerita detail tentang kebutuhan dan tujuan campaign..."
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Informasi Keuangan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Donasi (Rp) *
                  </label>
                  <Input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="10000000"
                    min="0"
                    step="1000"
                    required
                  />
                  {formData.targetAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Target: Rp {parseFloat(formData.targetAmount).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Jadwal Campaign</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tanggal Mulai *
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tanggal Berakhir
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kosongkan jika tidak ada batas waktu
                  </p>
                </div>
              </div>
            </div>

            {/* Media */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Media</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Gambar Utama URL
                  </label>
                  <Input
                    type="url"
                    value={formData.mainImage}
                    onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Gambar Tambahan
                  </label>
                  <textarea
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    placeholder='URL dipisahkan koma atau JSON array: ["url1", "url2"]'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: URL dipisah koma atau JSON array
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Video URL (YouTube Embed)
                  </label>
                  <Input
                    type="url"
                    value={formData.video}
                    onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
              </div>
            </div>

            {/* Status & Settings */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Status & Pengaturan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status Campaign
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REDIRECTED">Redirected</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">Featured (Tampilkan di halaman utama)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isUrgent}
                      onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium">Urgent (Mendesak)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowAnonymous}
                      onChange={(e) => setFormData({ ...formData, allowAnonymous: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Izinkan Donasi Anonim</span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {campaign ? 'Simpan Perubahan' : 'Buat Campaign'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
