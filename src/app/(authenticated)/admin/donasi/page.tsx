'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CampaignFormSlideover } from '@/components/donasi/campaign-form-slideover'
import { toast } from '@/components/ui/use-toast'
import {
  Heart,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  CheckCircle2,
  Activity,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DonationCategory {
  id: string
  name: string
  description?: string | null
}

interface Campaign {
  id: string
  title: string
  slug: string
  description: string
  story?: string | null
  categoryId: string
  category: DonationCategory
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
  createdAt: string
  updatedAt: string
}

interface Statistics {
  totalCampaigns: number
  totalCollected: number
  activeCampaigns: number
  completedCampaigns: number
}

const statusLabels: { [key: string]: string } = {
  DRAFT: 'Draft',
  ACTIVE: 'Aktif',
  CLOSED: 'Ditutup',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  REDIRECTED: 'Dialihkan',
}

const statusColors: { [key: string]: string } = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  CLOSED: 'bg-orange-100 text-orange-800 border-orange-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  REDIRECTED: 'bg-purple-100 text-purple-800 border-purple-300',
}

export default function DonasiAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showSlideOver, setShowSlideOver] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [statistics, setStatistics] = useState<Statistics>({
    totalCampaigns: 0,
    totalCollected: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
  })

  useEffect(() => {
    fetchCampaigns()
  }, [statusFilter])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      params.append('limit', '100') // Get all campaigns

      const response = await fetch(`/api/donations/campaigns?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        calculateStatistics(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengambil data campaign',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (campaignsData: Campaign[]) => {
    const stats = {
      totalCampaigns: campaignsData.length,
      totalCollected: campaignsData.reduce((sum, c) => sum + c.currentAmount, 0),
      activeCampaigns: campaignsData.filter(c => c.status === 'ACTIVE').length,
      completedCampaigns: campaignsData.filter(c => c.status === 'COMPLETED').length,
    }
    setStatistics(stats)
  }

  const handleAdd = () => {
    setSelectedCampaign(null)
    setShowSlideOver(true)
  }

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowSlideOver(true)
  }

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowDeleteDialog(true)
  }

  const handleSubmit = async (data: any) => {
    try {
      let response
      if (selectedCampaign) {
        // Update existing campaign
        response = await fetch(`/api/donations/campaigns/${selectedCampaign.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        // Create new campaign
        response = await fetch('/api/donations/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal menyimpan campaign')
      }

      toast({
        title: 'Berhasil',
        description: selectedCampaign
          ? 'Campaign berhasil diperbarui'
          : 'Campaign berhasil dibuat',
      })
      setShowSlideOver(false)
      fetchCampaigns()
    } catch (error: any) {
      throw new Error(error.message || 'Gagal menyimpan campaign')
    }
  }

  const handleSubmitDelete = async () => {
    if (!selectedCampaign) return

    try {
      const response = await fetch(`/api/donations/campaigns/${selectedCampaign.slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal menghapus campaign')
      }

      toast({
        title: 'Berhasil',
        description: 'Campaign berhasil dihapus',
      })
      setShowDeleteDialog(false)
      fetchCampaigns()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus campaign',
        variant: 'destructive',
      })
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description.toLowerCase().includes(search.toLowerCase()) ||
      campaign.category.name.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Donasi</h1>
          <p className="text-gray-600 mt-2">Kelola campaign donasi dan galang dana</p>
        </div>
        <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Campaign
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Total Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Terkumpul
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics.totalCollected)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Campaign Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.activeCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Campaign Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statistics.completedCampaigns}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari berdasarkan judul, deskripsi, atau kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CLOSED">Ditutup</option>
              <option value="CANCELLED">Dibatalkan</option>
              <option value="DRAFT">Draft</option>
              <option value="REDIRECTED">Dialihkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Terkumpul</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Tidak ada campaign ditemukan</p>
                      <Button onClick={handleAdd} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Campaign Pertama
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const progress = calculateProgress(campaign.currentAmount, campaign.targetAmount)
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {campaign.isFeatured && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                                  Featured
                                </Badge>
                              )}
                              {campaign.isUrgent && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <span>{campaign.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.category.name}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(campaign.targetAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(campaign.currentAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 w-12 text-right">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}
                          >
                            {statusLabels[campaign.status] || campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(campaign)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(campaign)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Form Slide-over */}
      <CampaignFormSlideover
        campaign={selectedCampaign}
        isOpen={showSlideOver}
        onClose={() => setShowSlideOver(false)}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Campaign</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus campaign ini?
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Anda akan menghapus campaign <strong>{selectedCampaign.title}</strong>.
                {selectedCampaign.currentAmount > 0 && (
                  <span className="block mt-2">
                    Campaign ini sudah mengumpulkan{' '}
                    <strong>{formatCurrency(selectedCampaign.currentAmount)}</strong>.
                    Pastikan sudah tidak ada donasi aktif sebelum menghapus.
                  </span>
                )}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleSubmitDelete}>
              Hapus Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
