'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Heart, Users, Target, TrendingUp,
  User, Star, BookOpen, Award,
  CreditCard, Smartphone, Building,
  CheckCircle, Clock, AlertCircle,
  ArrowRight, Filter, Search, Copy
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatOTAForWhatsApp, copyToClipboard, showCopyNotification } from '@/lib/whatsapp-formatter'
import PublicLayout from '@/components/layout/PublicLayout'

interface HafalanProgress {
  totalSurah: number
  totalAyat: number
  totalJuz: number
  level: string
}

interface Student {
  initials: string
  institutionType: string
  grade: string | null
  otaProfile: string
  photo: string | null
  achievements: any[]
  hafalan_progress: HafalanProgress | null
}

interface Sponsor {
  publicName: string
  amount: number
  createdAt: string
  donorMessage: string | null
}

interface OTAProgram {
  id: string
  monthlyTarget: number
  currentMonth: string
  monthlyProgress: number
  totalCollected: number
  monthsCompleted: number
  progressPercentage: number
  student: Student
  sponsors: Sponsor[]
  donorCount: number
}

interface Statistics {
  totalPrograms: number
  totalTargetMonthly: number
  totalCollectedAllTime: number
  totalCollectedThisMonth: number
  averageCompletion: number
}

export default function OTAPublicPage() {
  const [programs, setPrograms] = useState<OTAProgram[]>([])
  const [stats, setStats] = useState<Statistics>({
    totalPrograms: 0,
    totalTargetMonthly: 0,
    totalCollectedAllTime: 0,
    totalCollectedThisMonth: 0,
    averageCompletion: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedInstitution, setSelectedInstitution] = useState<'all' | 'TK' | 'SD' | 'PONDOK'>('all')
  const [sortBy, setSortBy] = useState<'progress' | 'newest' | 'target'>('progress')
  const [selectedProgram, setSelectedProgram] = useState<OTAProgram | null>(null)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [donationForm, setDonationForm] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    amount: '',
    donorMessage: '',
    isAnonymous: false,
    paymentMethod: 'TRANSFER'
  })
  const [donationStep, setDonationStep] = useState<'form' | 'payment' | 'success'>('form')
  const [donationResult, setDonationResult] = useState<any>(null)

  useEffect(() => {
    fetchPrograms()
  }, [selectedInstitution, sortBy])

  const fetchPrograms = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedInstitution !== 'all') params.set('institution', selectedInstitution)
      
      const response = await fetch(`/api/ota/public?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs)
        setStats(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProgram) return

    try {
      const response = await fetch('/api/ota/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId: selectedProgram.id,
          ...donationForm,
          amount: parseFloat(donationForm.amount)
        })
      })

      if (response.ok) {
        const result = await response.json()
        setDonationResult(result)
        setDonationStep('payment')
      } else {
        const error = await response.json()
        alert('Gagal mengirim donasi: ' + error.error)
      }
    } catch (error) {
      console.error('Error submitting donation:', error)
      alert('Terjadi kesalahan saat mengirim donasi')
    }
  }

  const resetDonationModal = () => {
    setShowDonationModal(false)
    setSelectedProgram(null)
    setDonationStep('form')
    setDonationResult(null)
    setDonationForm({
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      amount: '',
      donorMessage: '',
      isAnonymous: false,
      paymentMethod: 'TRANSFER'
    })
  }

  const handleCopyToWhatsApp = async (program: OTAProgram) => {
    const whatsappText = formatOTAForWhatsApp({
      studentCode: program.student.initials,
      institution: program.student.institutionType,
      grade: program.student.grade || 'N/A',
      monthlyTarget: program.monthlyTarget,
      description: program.student.otaProfile,
      progress: program.progressPercentage
    })
    
    const success = await copyToClipboard(whatsappText)
    showCopyNotification(success)
  }

  const sortedPrograms = [...programs].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return a.progressPercentage - b.progressPercentage // Ascending (those who need more help first)
      case 'newest':
        return new Date(b.currentMonth).getTime() - new Date(a.currentMonth).getTime()
      case 'target':
        return parseFloat(b.monthlyTarget.toString()) - parseFloat(a.monthlyTarget.toString())
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <Heart className="w-16 h-16 mx-auto mb-6 text-white" />
            <h1 className="text-4xl font-bold mb-4">Program Orang Tua Asuh</h1>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Bantu siswa yatim berprestasi melanjutkan pendidikan dengan menjadi orang tua asuh mereka
            </p>
            
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                <p className="text-sm text-green-100">Siswa Yatim</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-2xl font-bold">{formatCurrency(stats.totalTargetMonthly)}</p>
                <p className="text-sm text-green-100">Target Bulanan</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCollectedThisMonth)}</p>
                <p className="text-sm text-green-100">Terkumpul Bulan Ini</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-2xl font-bold">{stats.averageCompletion}%</p>
                <p className="text-sm text-green-100">Rata-rata Tercapai</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Siswa yang Membutuhkan Bantuan</h2>
              <p className="text-gray-600">Pilih siswa yang ingin Anda bantu sebagai orang tua asuh</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Institution Filter */}
              <div className="flex gap-2">
                {(['all', 'TK', 'SD', 'PONDOK'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={selectedInstitution === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedInstitution(type)}
                    className={selectedInstitution === type ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {type === 'all' ? 'Semua' : type}
                  </Button>
                ))}
              </div>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="progress">Paling Membutuhkan</option>
                <option value="newest">Terbaru</option>
                <option value="target">Target Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        {sortedPrograms.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Program</h3>
            <p className="text-gray-500">Saat ini belum ada siswa yang membutuhkan bantuan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPrograms.map((program) => (
              <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {program.student.initials}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {program.student.initials}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          program.student.institutionType === 'TK' ? 'bg-yellow-100 text-yellow-800' :
                          program.student.institutionType === 'SD' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {program.student.institutionType}
                        </span>
                        {program.student.grade && (
                          <span className="text-gray-500">{program.student.grade}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {program.student.otaProfile}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress Bulan Ini</span>
                      <span className="text-sm font-bold text-gray-900">
                        {program.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          program.progressPercentage >= 100 ? 'bg-green-500' :
                          program.progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(program.progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{formatCurrency(program.monthlyProgress)}</span>
                      <span>{formatCurrency(program.monthlyTarget)}</span>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="space-y-2">
                    {program.student.hafalan_progress && (
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          {program.student.hafalan_progress.totalSurah} Surah • {program.student.hafalan_progress.level}
                        </span>
                      </div>
                    )}
                    
                    {program.student.achievements.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-gray-700">
                          {program.student.achievements.length} Prestasi
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-gray-700">
                        {program.donorCount} Donatur • {program.monthsCompleted} Bulan Terpenuhi
                      </span>
                    </div>
                  </div>

                  {/* Recent Donors */}
                  {program.sponsors.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Donatur Terbaru:</p>
                      <div className="space-y-1">
                        {program.sponsors.slice(0, 2).map((sponsor, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{sponsor.publicName}</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(sponsor.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToWhatsApp(program)}
                      className="text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10"
                      title="Salin untuk WhatsApp"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedProgram(program)
                        setShowDonationModal(true)
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Bantu Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {showDonationModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {donationStep === 'form' && (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold">Donasi untuk {selectedProgram.student.initials}</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetDonationModal}
                  >
                    ×
                  </Button>
                </div>

                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {selectedProgram.student.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedProgram.student.institutionType} {selectedProgram.student.grade}</h3>
                      <p className="text-sm text-gray-600">Target: {formatCurrency(selectedProgram.monthlyTarget)}/bulan</p>
                      <p className="text-sm text-green-600">Terkumpul: {formatCurrency(selectedProgram.monthlyProgress)} ({selectedProgram.progressPercentage}%)</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDonate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        value={donationForm.donorName}
                        onChange={(e) => setDonationForm({...donationForm, donorName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nama Anda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={donationForm.donorEmail}
                        onChange={(e) => setDonationForm({...donationForm, donorEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor HP/WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={donationForm.donorPhone}
                        onChange={(e) => setDonationForm({...donationForm, donorPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="08123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah Donasi (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        min="10000"
                        step="5000"
                        value={donationForm.amount}
                        onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="100000"
                      />
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Atau pilih jumlah:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[50000, 100000, 250000, 500000, 1000000, 2000000].map(amount => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDonationForm({...donationForm, amount: amount.toString()})}
                          className={donationForm.amount === amount.toString() ? 'bg-green-100 border-green-500' : ''}
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metode Pembayaran *
                    </label>
                    <select
                      required
                      value={donationForm.paymentMethod}
                      onChange={(e) => setDonationForm({...donationForm, paymentMethod: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="QRIS">QRIS</option>
                      <option value="EWALLET">E-Wallet (GoPay/OVO/DANA)</option>
                      <option value="VA">Virtual Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pesan untuk Siswa (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={donationForm.donorMessage}
                      onChange={(e) => setDonationForm({...donationForm, donorMessage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Pesan semangat untuk siswa..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={donationForm.isAnonymous}
                      onChange={(e) => setDonationForm({...donationForm, isAnonymous: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
                      Donasi secara anonim
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetDonationModal}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Lanjut ke Pembayaran
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {donationStep === 'payment' && donationResult && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Donasi Berhasil Dibuat!</h2>
                  <p className="text-gray-600">
                    Silakan lakukan pembayaran sesuai metode yang dipilih
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-900 mb-2">Detail Donasi</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">ID Donasi:</span>
                      <span className="font-mono font-medium">{donationResult.donationRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Siswa:</span>
                      <span className="font-medium">{donationResult.program.studentInitials}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Jumlah:</span>
                      <span className="font-bold text-green-700">{formatCurrency(donationResult.donation.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Metode:</span>
                      <span className="font-medium">{donationResult.donation.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Instruksi Pembayaran</h3>
                  <div className="text-sm text-blue-800">
                    {donationResult.donation.paymentMethod === 'TRANSFER' && (
                      <div>
                        <p className="mb-2">Transfer ke rekening berikut:</p>
                        <div className="bg-white p-3 rounded border">
                          <p><strong>Bank BCA</strong></p>
                          <p>No. Rek: <strong>1234567890</strong></p>
                          <p>A.n: <strong>Yayasan Imam Syafii</strong></p>
                        </div>
                        <p className="mt-2 text-xs">Kirim bukti transfer ke WhatsApp: 08123456789</p>
                      </div>
                    )}
                    {donationResult.donation.paymentMethod === 'QRIS' && (
                      <div>
                        <p>Scan QR Code berikut untuk pembayaran:</p>
                        <div className="bg-white p-4 rounded border text-center mt-2">
                          <p className="text-gray-500">[QR Code akan muncul di sini]</p>
                        </div>
                      </div>
                    )}
                    {donationResult.donation.paymentMethod === 'EWALLET' && (
                      <div>
                        <p>Transfer melalui E-Wallet ke:</p>
                        <div className="bg-white p-3 rounded border mt-2">
                          <p>GoPay/OVO/DANA: <strong>08123456789</strong></p>
                          <p>A.n: <strong>Yayasan Imam Syafii</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {donationResult.message}
                  </p>
                  <Button onClick={resetDonationModal} className="bg-green-600 hover:bg-green-700">
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PublicLayout>
  )
}