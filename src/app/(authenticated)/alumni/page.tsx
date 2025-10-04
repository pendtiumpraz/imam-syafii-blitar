'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { 
  Plus, Search, Filter, Users, GraduationCap, 
  Briefcase, Building, Phone, Mail, MapPin,
  Calendar, Facebook, Instagram, Linkedin,
  MessageSquare, Download, CheckCircle, Edit
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { AlumniEditForm } from '@/components/alumni/alumni-edit-form'
import BulkOperationsModal from '@/components/bulk-operations/bulk-operations-modal'

interface Alumni {
  id: string
  nisn?: string | null
  nis?: string | null
  fullName: string
  nickname?: string | null
  birthPlace: string
  birthDate: Date
  gender: string
  currentAddress: string
  currentCity: string
  currentProvince?: string | null
  currentCountry: string
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  facebook?: string | null
  instagram?: string | null
  linkedin?: string | null
  institutionType: string
  graduationYear: string
  generation?: string | null
  currentJob?: string | null
  jobPosition?: string | null
  company?: string | null
  furtherEducation?: string | null
  university?: string | null
  major?: string | null
  maritalStatus?: string | null
  spouseName?: string | null
  childrenCount: number
  photo?: string | null
  memories?: string | null
  message?: string | null
  availableForEvents: boolean
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<'all' | 'TK' | 'SD' | 'PONDOK'>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [exportData, setExportData] = useState<any[]>([])
  const [exportColumns, setExportColumns] = useState<any[]>([])

  useEffect(() => {
    fetchAlumni()
  }, [selectedType, selectedYear])

  const fetchAlumni = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.set('institutionType', selectedType)
      if (selectedYear !== 'all') params.set('graduationYear', selectedYear)
      
      const response = await fetch(`/api/alumni?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAlumni(data.data)
      }
    } catch (error) {
      console.error('Error fetching alumni:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch = 
      alum.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alum.currentCity && alum.currentCity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alum.currentJob && alum.currentJob.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alum.company && alum.company.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const stats = {
    tk: (alumni || []).filter(a => a.institutionType === 'TK').length,
    sd: (alumni || []).filter(a => a.institutionType === 'SD').length,
    pondok: (alumni || []).filter(a => a.institutionType === 'PONDOK').length,
    total: (alumni || []).length,
    availableForEvents: (alumni || []).filter(a => a.availableForEvents).length
  }

  const graduationYears = Array.from(new Set((alumni || []).map(a => a.graduationYear))).sort((a, b) => b.localeCompare(a))

  const copyInvitationList = () => {
    const availableAlumni = filteredAlumni.filter(a => a.availableForEvents && a.whatsapp)
    const invitationText = (availableAlumni || []).map(a => 
      `${a.fullName} - ${a.whatsapp} - ${a.currentCity}`
    ).join('\n')
    
    const header = `📋 DAFTAR ALUMNI UNTUK DIUNDANG\n` +
                  `Total: ${availableAlumni.length} orang\n` +
                  `========================\n\n`
    
    navigator.clipboard.writeText(header + invitationText).then(() => {
      alert(`Berhasil menyalin ${availableAlumni.length} kontak alumni!`)
    })
  }

  const copyWhatsApp = (alum: Alumni) => {
    if (alum.whatsapp) {
      navigator.clipboard.writeText(alum.whatsapp).then(() => {
        setCopiedPhone(alum.id)
        setTimeout(() => setCopiedPhone(null), 2000)
      })
    }
  }

  const handleBulkExport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.set('institutionType', selectedType)
      if (selectedYear !== 'all') params.set('graduationYear', selectedYear)
      
      const response = await fetch(`/api/export/alumni?${params}`)
      if (response.ok) {
        const data = await response.json()
        setExportData(data.data || [])
        setExportColumns(data.columns || [])
        setShowBulkModal(true)
      }
    } catch (error) {
      console.error('Error preparing export:', error)
      alert('Gagal menyiapkan data export')
    }
  }

  const exportToCSV = () => {
    const headers = ['Nama', 'Angkatan', 'Tahun Lulus', 'Institusi', 'Kota', 'Pekerjaan', 'Perusahaan', 'WhatsApp', 'Email', 'Bersedia Hadir']
    const csvData = (filteredAlumni || []).map(a => [
      a.fullName,
      a.generation || '',
      a.graduationYear,
      a.institutionType,
      a.currentCity,
      a.currentJob || '',
      a.company || '',
      a.whatsapp || '',
      a.email || '',
      a.availableForEvents ? 'Ya' : 'Tidak'
    ])
    
    const csvContent = [
      headers.join(','),
      ...(csvData || []).map(row => (row || []).map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data-alumni-${selectedType}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Data Alumni" />
      
      <main className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Alumni</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alumni TK</p>
                <p className="text-2xl font-bold">{stats.tk}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alumni SD</p>
                <p className="text-2xl font-bold">{stats.sd}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alumni Pondok</p>
                <p className="text-2xl font-bold">{stats.pondok}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bisa Diundang</p>
                  <p className="text-2xl font-bold">{stats.availableForEvents}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari nama, kota, pekerjaan..."
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
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className={selectedType === type ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {type === 'all' ? 'Semua' : type}
                  </Button>
                ))}
              </div>

              {/* Filter by Year */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Semua Angkatan</option>
                {(graduationYears || []).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyInvitationList}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Salin Kontak
              </Button>
              <Button
                onClick={handleBulkExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Alumni
              </Button>
            </div>
          </div>
        </div>

        {/* Alumni Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">Tidak ada data alumni</p>
            </div>
          ) : (
            (filteredAlumni || []).map((alum) => (
              <Card key={alum.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {alum.photo ? (
                        <img src={alum.photo} alt={alum.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <GraduationCap className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{alum.fullName}</h3>
                      {alum.nickname && (
                        <p className="text-sm text-gray-600">({alum.nickname})</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          alum.institutionType === 'TK' ? 'bg-yellow-100 text-yellow-800' :
                          alum.institutionType === 'SD' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {alum.institutionType}
                        </span>
                        <span className="text-sm text-gray-600">
                          Lulus {alum.graduationYear}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  {alum.currentJob && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alum.currentJob}</p>
                          {alum.jobPosition && (
                            <p className="text-xs text-gray-600">{alum.jobPosition}</p>
                          )}
                          {alum.company && (
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Building className="w-3 h-3" />
                              {alum.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {alum.currentCity}
                      {alum.currentProvince && `, ${alum.currentProvince}`}
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2 mb-4">
                    {alum.whatsapp && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {alum.whatsapp}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyWhatsApp(alum)}
                          className="h-6 w-6"
                        >
                          {copiedPhone === alum.id ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    {alum.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{alum.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Social Media */}
                  <div className="flex gap-2 mb-4">
                    {alum.facebook && (
                      <a href={alum.facebook} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <Facebook className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {alum.instagram && (
                      <a href={`https://instagram.com/${alum.instagram}`} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <Instagram className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {alum.linkedin && (
                      <a href={alum.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <Linkedin className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Availability Badge and Actions */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      alum.availableForEvents ? 
                      'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {alum.availableForEvents ? '✓ Bisa Diundang' : 'Tidak Bisa Diundang'}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingAlumni(alum)
                          setShowEditForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedAlumni(alum)}
                      >
                        Detail →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Alumni Detail Modal */}
        {selectedAlumni && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">Detail Alumni</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedAlumni(null)}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                      {selectedAlumni.photo ? (
                        <img src={selectedAlumni.photo} alt={selectedAlumni.fullName} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <GraduationCap className="w-12 h-12 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{selectedAlumni.fullName}</h3>
                      {selectedAlumni.nickname && (
                        <p className="text-sm text-gray-600">Panggilan: {selectedAlumni.nickname}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Alumni {selectedAlumni.institutionType} - Lulus {selectedAlumni.graduationYear}
                      </p>
                      {selectedAlumni.generation && (
                        <p className="text-sm text-gray-600">Angkatan: {selectedAlumni.generation}</p>
                      )}
                    </div>
                  </div>

                  {/* Current Job */}
                  {selectedAlumni.currentJob && (
                    <div>
                      <h4 className="font-semibold mb-2">Pekerjaan Saat Ini</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{selectedAlumni.currentJob}</p>
                        {selectedAlumni.jobPosition && (
                          <p className="text-sm text-gray-600">{selectedAlumni.jobPosition}</p>
                        )}
                        {selectedAlumni.company && (
                          <p className="text-sm text-gray-600">di {selectedAlumni.company}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedAlumni.furtherEducation && (
                    <div>
                      <h4 className="font-semibold mb-2">Pendidikan Lanjutan</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{selectedAlumni.furtherEducation}</p>
                        {selectedAlumni.university && (
                          <p className="text-sm text-gray-600">{selectedAlumni.university}</p>
                        )}
                        {selectedAlumni.major && (
                          <p className="text-sm text-gray-600">Jurusan: {selectedAlumni.major}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div>
                    <h4 className="font-semibold mb-2">Kontak</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-gray-600">Alamat:</span> {selectedAlumni.currentAddress}, {selectedAlumni.currentCity}
                      </p>
                      {selectedAlumni.phone && (
                        <p className="text-sm">
                          <span className="text-gray-600">Telepon:</span> {selectedAlumni.phone}
                        </p>
                      )}
                      {selectedAlumni.whatsapp && (
                        <p className="text-sm">
                          <span className="text-gray-600">WhatsApp:</span> {selectedAlumni.whatsapp}
                        </p>
                      )}
                      {selectedAlumni.email && (
                        <p className="text-sm">
                          <span className="text-gray-600">Email:</span> {selectedAlumni.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Memories */}
                  {selectedAlumni.memories && (
                    <div>
                      <h4 className="font-semibold mb-2">Kenangan di Sekolah</h4>
                      <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">
                        {selectedAlumni.memories}
                      </p>
                    </div>
                  )}

                  {/* Message */}
                  {selectedAlumni.message && (
                    <div>
                      <h4 className="font-semibold mb-2">Pesan untuk Juniors</h4>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {selectedAlumni.message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setSelectedAlumni(null)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Alumni Form Sidebar */}
        {editingAlumni && (
          <AlumniEditForm
            alumni={editingAlumni}
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false)
              setEditingAlumni(null)
            }}
            onSubmit={async (updatedData) => {
              const response = await fetch(`/api/alumni/${editingAlumni.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Gagal memperbarui data alumni')
              }

              const updatedAlumni = await response.json()
              setAlumni((alumni || []).map(a => a.id === editingAlumni.id ? updatedAlumni : a))
              setShowEditForm(false)
              setEditingAlumni(null)
            }}
          />
        )}

        {/* Add Alumni Form */}
        {showForm && (
          <AlumniEditForm
            alumni={{
              id: '',
              fullName: '',
              birthPlace: '',
              birthDate: new Date(),
              gender: 'MALE',
              currentAddress: '',
              currentCity: '',
              currentCountry: 'Indonesia',
              institutionType: 'SD',
              graduationYear: new Date().getFullYear().toString(),
              childrenCount: 0,
              availableForEvents: false
            }}
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={async (data) => {
              const response = await fetch('/api/alumni', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Gagal menambahkan alumni')
              }

              const newAlumni = await response.json()
              setAlumni([...alumni, newAlumni])
              setShowForm(false)
            }}
          />
        )}

        {/* Bulk Operations Modal */}
        <BulkOperationsModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title="Data Alumni"
          exportData={exportData}
          exportColumns={exportColumns}
        />
      </main>
    </div>
  )
}