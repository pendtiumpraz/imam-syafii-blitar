'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { 
  Plus, Search, Filter, Users, Heart, 
  DollarSign, TrendingUp, User, Phone, Mail,
  Calendar, Edit, Trash2, Eye, ArrowUpCircle,
  CheckCircle, Clock, AlertTriangle, Banknote,
  FileText, Download, Settings, GraduationCap
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Student {
  id: string
  nis: string
  fullName: string
  institutionType: string
  grade: string | null
  monthlyNeeds: number | null
  otaProfile: string | null
  status: string
  photo: string | null
  achievements: string
  isOrphan: boolean
  hafalanProgress?: {
    totalSurah: number
    totalAyat: number
    totalJuz: number
    level: string
  } | null
}

interface OTAProgram {
  id: string
  monthlyTarget: number
  currentMonth: string
  totalCollected: number
  monthlyProgress: number
  monthsCompleted: number
  isActive: boolean
  displayOrder: number
  adminNotes: string | null
  programStart: string
  student: Student
  sponsors: Sponsor[]
  _count: {
    sponsors: number
  }
}

interface Sponsor {
  id: string
  donorName: string
  donorEmail: string | null
  amount: number
  isPaid: boolean
  paymentStatus: string
  createdAt: string
}

export default function OTAAdminPage() {
  const [programs, setPrograms] = useState<OTAProgram[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'programs' | 'students' | 'reports'>('programs')
  const [selectedInstitution, setSelectedInstitution] = useState<'all' | 'TK' | 'SD' | 'PONDOK'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<OTAProgram | null>(null)
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [showAddProgramModal, setShowAddProgramModal] = useState(false)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Statistics
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activePrograms: 0,
    totalTarget: 0,
    totalCollected: 0,
    monthlyProgress: 0,
    fullyFunded: 0,
    partiallyFunded: 0,
    unfunded: 0
  })

  useEffect(() => {
    fetchPrograms()
    fetchOrphanStudents()
  }, [selectedInstitution, selectedStatus])

  useEffect(() => {
    calculateStats()
  }, [programs])

  const fetchPrograms = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '50')
      if (selectedInstitution !== 'all') params.set('institution', selectedInstitution)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      if (searchTerm) params.set('search', searchTerm)
      
      const response = await fetch(`/api/ota/admin?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs)
      }
    } catch (error) {
      console.error('Error fetching OTA programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrphanStudents = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      if (selectedInstitution !== 'all') params.set('institution', selectedInstitution)
      params.set('orphanStatus', 'orphan')
      
      const response = await fetch(`/api/students/ota?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Error fetching orphan students:', error)
    }
  }

  const calculateStats = () => {
    if (!programs.length) return

    const totalPrograms = programs.length
    const activePrograms = programs.filter(p => p.isActive).length
    const totalTarget = programs.reduce((sum, p) => sum + parseFloat(p.monthlyTarget.toString()), 0)
    const totalCollected = programs.reduce((sum, p) => sum + parseFloat(p.totalCollected.toString()), 0)
    const monthlyProgress = programs.reduce((sum, p) => sum + parseFloat(p.monthlyProgress.toString()), 0)
    
    let fullyFunded = 0, partiallyFunded = 0, unfunded = 0
    programs.forEach(p => {
      const progress = parseFloat(p.monthlyProgress.toString())
      const target = parseFloat(p.monthlyTarget.toString())
      if (progress >= target) fullyFunded++
      else if (progress > 0) partiallyFunded++
      else unfunded++
    })

    setStats({
      totalPrograms,
      activePrograms,
      totalTarget,
      totalCollected,
      monthlyProgress,
      fullyFunded,
      partiallyFunded,
      unfunded
    })
  }

  const handleMarkAsOrphan = async (studentId: string, isOrphan: boolean) => {
    try {
      const response = await fetch('/api/students/ota', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          isOrphan,
        })
      })

      if (response.ok) {
        fetchOrphanStudents()
        alert(isOrphan ? 'Siswa berhasil ditandai sebagai yatim' : 'Status yatim siswa berhasil dihapus')
      } else {
        const error = await response.json()
        alert('Gagal mengupdate status siswa: ' + error.error)
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Terjadi kesalahan saat mengupdate status siswa')
    }
  }

  const handleCreateProgram = async (studentId: string, monthlyTarget: number, otaProfile?: string) => {
    try {
      const response = await fetch('/api/ota/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          monthlyTarget,
          otaProfile,
          displayOrder: programs.length
        })
      })

      if (response.ok) {
        fetchPrograms()
        setShowAddProgramModal(false)
        alert('Program OTA berhasil dibuat')
      } else {
        const error = await response.json()
        alert('Gagal membuat program OTA: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating program:', error)
      alert('Terjadi kesalahan saat membuat program OTA')
    }
  }

  const handlePromoteStudent = async (studentId: string, action: 'promote' | 'graduate', newGrade?: string) => {
    try {
      const response = await fetch('/api/students/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          action,
          newGrade,
          graduationDate: action === 'graduate' ? new Date().toISOString() : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        fetchPrograms()
        fetchOrphanStudents()
        setShowPromoteModal(false)
        alert(action === 'promote' ? 'Siswa berhasil naik kelas' : 'Siswa berhasil lulus')
      } else {
        const error = await response.json()
        alert('Gagal memproses: ' + error.error)
      }
    } catch (error) {
      console.error('Error promoting student:', error)
      alert('Terjadi kesalahan saat memproses')
    }
  }

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = 
      program.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.student.nis.includes(searchTerm)
    return matchesSearch
  })

  const filteredStudents = students.filter(student => {
    if (!student.isOrphan) return false
    const hasProgram = programs.some(p => p.student.id === student.id)
    if (hasProgram) return false // Don't show students who already have programs
    
    const matchesSearch = 
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.includes(searchTerm)
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manajemen Program OTA (Orang Tua Asuh)" />
      
      <main className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Program</p>
                  <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                  <p className="text-xs text-gray-500">{stats.activePrograms} aktif</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Target Bulanan</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalTarget)}</p>
                  <p className="text-xs text-gray-500">Total semua program</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Terkumpul Bulan Ini</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.monthlyProgress)}</p>
                  <p className="text-xs text-gray-500">
                    {stats.totalTarget > 0 ? Math.round((stats.monthlyProgress / stats.totalTarget) * 100) : 0}% dari target
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status Funding</p>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Terpenuhi: {stats.fullyFunded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Sebagian: {stats.partiallyFunded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Belum: {stats.unfunded}</span>
                    </div>
                  </div>
                </div>
                <Heart className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'programs', label: 'Program Aktif', icon: Heart },
                { key: 'students', label: 'Siswa Yatim', icon: Users },
                { key: 'reports', label: 'Laporan', icon: FileText }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === key
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Controls */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa atau NIS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Filter by Institution */}
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

                {/* Status Filter for Programs */}
                {activeTab === 'programs' && (
                  <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((status) => (
                      <Button
                        key={status}
                        variant={selectedStatus === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedStatus(status)}
                        className={selectedStatus === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : 'Non-Aktif'}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {activeTab === 'students' && (
                  <Button
                    onClick={() => {
                      // If there's only one student, auto-select it
                      if (filteredStudents.length === 1) {
                        setSelectedStudent(filteredStudents[0])
                      }
                      setShowAddProgramModal(true)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                    disabled={filteredStudents.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Program OTA
                  </Button>
                )}
                {activeTab === 'reports' && (
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Laporan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'programs' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target/Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donatur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prestasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada program OTA
                      </td>
                    </tr>
                  ) : (
                    filteredPrograms.map((program) => {
                      const progressPercentage = Math.round((parseFloat(program.monthlyProgress.toString()) / parseFloat(program.monthlyTarget.toString())) * 100)
                      const isFullyFunded = progressPercentage >= 100
                      
                      return (
                        <tr key={program.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {program.student.photo ? (
                                  <img src={program.student.photo} alt={program.student.fullName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{program.student.fullName}</p>
                                <p className="text-xs text-gray-500">{program.student.nis} • {program.student.institutionType} {program.student.grade}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(program.monthlyProgress)} / {formatCurrency(program.monthlyTarget)}
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className={`h-2 rounded-full ${
                                    isFullyFunded ? 'bg-green-600' : 
                                    progressPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{progressPercentage}%</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{program._count.sponsors} donatur</p>
                              <p className="text-xs text-gray-500">Total: {formatCurrency(program.totalCollected)}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                program.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {program.isActive ? 'Aktif' : 'Non-Aktif'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full block ${
                                isFullyFunded ? 'bg-green-100 text-green-800' :
                                progressPercentage > 0 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {isFullyFunded ? 'Terpenuhi' : progressPercentage > 0 ? 'Sebagian' : 'Belum Ada'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {program.student.hafalanProgress && (
                                <div>
                                  <p className="text-xs text-gray-600">{program.student.hafalanProgress.totalSurah} Surah</p>
                                  <p className="text-xs text-gray-500">{program.student.hafalanProgress.level}</p>
                                </div>
                              )}
                              {program.student.achievements && (
                                <p className="text-xs text-green-600">
                                  {JSON.parse(program.student.achievements).length} prestasi
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedProgram(program)}
                                className="h-8 w-8"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Edit Program"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Naik Kelas"
                                onClick={() => {
                                  setSelectedStudent(program.student)
                                  setShowPromoteModal(true)
                                }}
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-yellow-50 border-b">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Kelola siswa yatim dan buat program OTA untuk mereka
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Yatim
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kebutuhan Bulanan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program OTA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prestasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {students.filter(s => s.isOrphan).length === 0 
                          ? 'Belum ada siswa yang ditandai sebagai yatim'
                          : 'Semua siswa yatim sudah memiliki program OTA'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {student.photo ? (
                                <img src={student.photo} alt={student.fullName} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                              <p className="text-xs text-gray-500">{student.nis} • {student.institutionType} {student.grade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            student.isOrphan ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.isOrphan ? 'Yatim' : 'Bukan Yatim'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900">
                            {student.monthlyNeeds ? formatCurrency(student.monthlyNeeds) : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Belum Ada
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {student.hafalanProgress && (
                              <div>
                                <p className="text-xs text-gray-600">{student.hafalanProgress.totalSurah} Surah</p>
                                <p className="text-xs text-gray-500">{student.hafalanProgress.level}</p>
                              </div>
                            )}
                            {student.achievements && (
                              <p className="text-xs text-green-600">
                                {JSON.parse(student.achievements).length} prestasi
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsOrphan(student.id, !student.isOrphan)}
                              className="text-xs"
                            >
                              {student.isOrphan ? 'Hapus Status' : 'Tandai Yatim'}
                            </Button>
                            {student.isOrphan && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-xs"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowAddProgramModal(true)
                                }}
                              >
                                Buat Program
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setSelectedStudent(student)
                                setShowPromoteModal(true)
                              }}
                            >
                              Naik Kelas
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Laporan OTA</h3>
              <p className="text-gray-500 mb-6">
                Generate laporan bulanan untuk program OTA
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Generate Laporan Bulan Ini
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Detail Program OTA</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedProgram(null)}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {selectedProgram.student.photo ? (
                        <img src={selectedProgram.student.photo} alt={selectedProgram.student.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProgram.student.fullName}</h3>
                      <p className="text-sm text-gray-600">{selectedProgram.student.nis}</p>
                      <p className="text-sm text-gray-600">{selectedProgram.student.institutionType} {selectedProgram.student.grade}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Profil OTA</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedProgram.student.otaProfile || 'Belum ada profil'}
                    </p>
                  </div>
                </div>

                {/* Program Stats */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Target Bulanan</p>
                      <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedProgram.monthlyTarget)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Terkumpul Bulan Ini</p>
                      <p className="text-lg font-bold text-green-900">{formatCurrency(selectedProgram.monthlyProgress)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Total Terkumpul</p>
                      <p className="text-lg font-bold text-purple-900">{formatCurrency(selectedProgram.totalCollected)}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600">Bulan Terpenuhi</p>
                      <p className="text-lg font-bold text-yellow-900">{selectedProgram.monthsCompleted}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Progress Bulan Ini</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-green-600 h-4 rounded-full"
                        style={{ 
                          width: `${Math.min((parseFloat(selectedProgram.monthlyProgress.toString()) / parseFloat(selectedProgram.monthlyTarget.toString())) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round((parseFloat(selectedProgram.monthlyProgress.toString()) / parseFloat(selectedProgram.monthlyTarget.toString())) * 100)}% terpenuhi
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Sponsors */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4">Donatur Terbaru</h4>
                {selectedProgram.sponsors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Nama</th>
                          <th className="px-4 py-2 text-left">Jumlah</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedProgram.sponsors.map((sponsor) => (
                          <tr key={sponsor.id}>
                            <td className="px-4 py-2">{sponsor.donorName}</td>
                            <td className="px-4 py-2">{formatCurrency(sponsor.amount)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                sponsor.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {sponsor.isPaid ? 'Lunas' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-2">{formatDate(sponsor.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada donatur</p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProgram(null)}
                >
                  Tutup
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Edit Program
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Buat Program OTA</h2>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const studentId = formData.get('studentId') as string
                const monthlyTarget = parseFloat(formData.get('monthlyTarget') as string)
                const otaProfile = formData.get('otaProfile') as string
                handleCreateProgram(studentId, monthlyTarget, otaProfile)
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Siswa
                    </label>
                    {selectedStudent ? (
                      <>
                        <input type="hidden" name="studentId" value={selectedStudent.id} />
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {selectedStudent.fullName} - {selectedStudent.nis}
                        </p>
                      </>
                    ) : (
                      <select
                        name="studentId"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        onChange={(e) => {
                          const student = filteredStudents.find(s => s.id === e.target.value)
                          if (student) setSelectedStudent(student)
                        }}
                      >
                        <option value="">Pilih Siswa</option>
                        {filteredStudents.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} - {student.nis} ({student.institutionType} {student.grade})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Bulanan (Rp)
                    </label>
                    <input
                      type="number"
                      name="monthlyTarget"
                      required
                      min="50000"
                      step="10000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profil OTA (untuk halaman publik)
                    </label>
                    <textarea
                      name="otaProfile"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ceritakan tentang siswa ini untuk menarik donatur..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddProgramModal(false)
                      setSelectedStudent(null)
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Buat Program
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Promote Student Modal */}
      {showPromoteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Naikkan Kelas / Lulus</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Siswa
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedStudent.fullName} - {selectedStudent.institutionType} {selectedStudent.grade}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // For simplicity, auto-determine next grade
                      let nextGrade = ''
                      if (selectedStudent.institutionType === 'TK') {
                        nextGrade = selectedStudent.grade === 'RA-A' ? 'RA-B' : 'RA-A'
                      } else if (selectedStudent.institutionType === 'SD') {
                        const currentNum = parseInt(selectedStudent.grade?.replace('Kelas ', '') || '1')
                        nextGrade = `Kelas ${currentNum + 1}`
                      } else {
                        nextGrade = 'Ula 1' // Default for Pondok
                      }
                      handlePromoteStudent(selectedStudent.id, 'promote', nextGrade)
                    }}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Naikkan Kelas
                  </Button>
                  
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                    onClick={() => handlePromoteStudent(selectedStudent.id, 'graduate')}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Lulus
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPromoteModal(false)
                    setSelectedStudent(null)
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}