'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import {
  Building2,
  Save,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Target,
  Eye,
  Users,
  Calendar,
} from 'lucide-react'

interface OrganizationData {
  // Yayasan Info
  yayasanName: string
  yayasanDescription: string
  yayasanFoundedYear: string
  yayasanLegalNo: string

  // Institutions
  tkInfo: InstitutionInfo
  sdInfo: InstitutionInfo
  pondokInfo: InstitutionInfo

  // Vision & Mission
  vision: string
  missions: string[]

  // Organizational Structure
  structure: StructureItem[]

  // History Timeline
  history: HistoryItem[]
}

interface InstitutionInfo {
  name: string
  description: string
  headmaster: string
  accreditation: string
  capacity: string
  programs: string[]
}

interface StructureItem {
  id: string
  position: string
  name: string
  order: number
  parent?: string
}

interface HistoryItem {
  id: string
  year: string
  title: string
  description: string
}

const defaultData: OrganizationData = {
  yayasanName: 'Yayasan Pondok Imam Syafii',
  yayasanDescription: '',
  yayasanFoundedYear: '',
  yayasanLegalNo: '',
  tkInfo: {
    name: 'TK Imam Syafii',
    description: '',
    headmaster: '',
    accreditation: '',
    capacity: '',
    programs: [],
  },
  sdInfo: {
    name: 'SD Imam Syafii',
    description: '',
    headmaster: '',
    accreditation: '',
    capacity: '',
    programs: [],
  },
  pondokInfo: {
    name: 'Pondok Pesantren Imam Syafii',
    description: '',
    headmaster: '',
    accreditation: '',
    capacity: '',
    programs: [],
  },
  vision: '',
  missions: [],
  structure: [],
  history: [],
}

export default function OrganizationPage() {
  const [data, setData] = useState<OrganizationData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('yayasan')

  // Mission form
  const [missionInput, setMissionInput] = useState('')

  // Structure form
  const [structureForm, setStructureForm] = useState({
    position: '',
    name: '',
    order: 0,
    parent: '',
  })

  // History form
  const [historyForm, setHistoryForm] = useState({
    year: '',
    title: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/organization')
      if (response.ok) {
        const orgData = await response.json()
        setData({ ...defaultData, ...orgData })
      }
    } catch (error) {
      console.error('Error fetching organization data:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengambil data organisasi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan data organisasi')
      }

      toast({
        title: 'Berhasil',
        description: 'Data organisasi berhasil disimpan',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data organisasi',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddMission = () => {
    if (!missionInput.trim()) return
    setData({
      ...data,
      missions: [...data.missions, missionInput.trim()],
    })
    setMissionInput('')
  }

  const handleDeleteMission = (index: number) => {
    setData({
      ...data,
      missions: data.missions.filter((_, i) => i !== index),
    })
  }

  const handleAddStructure = () => {
    if (!structureForm.position || !structureForm.name) {
      toast({
        title: 'Validasi',
        description: 'Posisi dan nama harus diisi',
        variant: 'destructive',
      })
      return
    }

    const newItem: StructureItem = {
      id: Date.now().toString(),
      position: structureForm.position,
      name: structureForm.name,
      order: structureForm.order,
      parent: structureForm.parent || undefined,
    }

    setData({
      ...data,
      structure: [...data.structure, newItem].sort((a, b) => a.order - b.order),
    })

    setStructureForm({ position: '', name: '', order: 0, parent: '' })
  }

  const handleDeleteStructure = (id: string) => {
    setData({
      ...data,
      structure: data.structure.filter(item => item.id !== id),
    })
  }

  const handleAddHistory = () => {
    if (!historyForm.year || !historyForm.title) {
      toast({
        title: 'Validasi',
        description: 'Tahun dan judul harus diisi',
        variant: 'destructive',
      })
      return
    }

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      year: historyForm.year,
      title: historyForm.title,
      description: historyForm.description,
    }

    setData({
      ...data,
      history: [...data.history, newItem].sort((a, b) => parseInt(b.year) - parseInt(a.year)),
    })

    setHistoryForm({ year: '', title: '', description: '' })
  }

  const handleDeleteHistory = (id: string) => {
    setData({
      ...data,
      history: data.history.filter(item => item.id !== id),
    })
  }

  const updateInstitution = (type: 'tkInfo' | 'sdInfo' | 'pondokInfo', field: string, value: any) => {
    setData({
      ...data,
      [type]: {
        ...data[type],
        [field]: value,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Organisasi</h1>
          <p className="text-gray-600 mt-2">Kelola informasi yayasan dan lembaga pendidikan</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Semua
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="yayasan">Yayasan</TabsTrigger>
          <TabsTrigger value="tk">TK</TabsTrigger>
          <TabsTrigger value="sd">SD</TabsTrigger>
          <TabsTrigger value="pondok">Pondok</TabsTrigger>
          <TabsTrigger value="vision">Visi & Misi</TabsTrigger>
          <TabsTrigger value="structure">Struktur</TabsTrigger>
        </TabsList>

        {/* Yayasan Tab */}
        <TabsContent value="yayasan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informasi Yayasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Yayasan</label>
                <Input
                  value={data.yayasanName}
                  onChange={(e) => setData({ ...data, yayasanName: e.target.value })}
                  placeholder="Yayasan Pondok Imam Syafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <Textarea
                  value={data.yayasanDescription}
                  onChange={(e) => setData({ ...data, yayasanDescription: e.target.value })}
                  placeholder="Deskripsi tentang yayasan..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tahun Berdiri</label>
                  <Input
                    value={data.yayasanFoundedYear}
                    onChange={(e) => setData({ ...data, yayasanFoundedYear: e.target.value })}
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">No. Akte Pendirian</label>
                  <Input
                    value={data.yayasanLegalNo}
                    onChange={(e) => setData({ ...data, yayasanLegalNo: e.target.value })}
                    placeholder="123/ABC/2000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline Sejarah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-medium">Tambah Event Sejarah</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Tahun"
                    value={historyForm.year}
                    onChange={(e) => setHistoryForm({ ...historyForm, year: e.target.value })}
                  />
                  <Input
                    placeholder="Judul Event"
                    value={historyForm.title}
                    onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })}
                  />
                  <Input
                    placeholder="Deskripsi"
                    value={historyForm.description}
                    onChange={(e) => setHistoryForm({ ...historyForm, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddHistory} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Event
                </Button>
              </div>

              <div className="space-y-2">
                {data.history.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada timeline sejarah</p>
                ) : (
                  data.history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-green-600">{item.year}</span>
                          <span className="text-gray-400">|</span>
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteHistory(item.id)}
                        className="text-red-600 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TK Tab */}
        <TabsContent value="tk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi TK Imam Syafii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                <Input
                  value={data.tkInfo.name}
                  onChange={(e) => updateInstitution('tkInfo', 'name', e.target.value)}
                  placeholder="TK Imam Syafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <Textarea
                  value={data.tkInfo.description}
                  onChange={(e) => updateInstitution('tkInfo', 'description', e.target.value)}
                  placeholder="Deskripsi TK..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kepala Sekolah</label>
                  <Input
                    value={data.tkInfo.headmaster}
                    onChange={(e) => updateInstitution('tkInfo', 'headmaster', e.target.value)}
                    placeholder="Nama Kepala Sekolah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Akreditasi</label>
                  <Input
                    value={data.tkInfo.accreditation}
                    onChange={(e) => updateInstitution('tkInfo', 'accreditation', e.target.value)}
                    placeholder="A / B / C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kapasitas Siswa</label>
                  <Input
                    value={data.tkInfo.capacity}
                    onChange={(e) => updateInstitution('tkInfo', 'capacity', e.target.value)}
                    placeholder="100 siswa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Program Unggulan (pisah dengan koma)</label>
                  <Input
                    value={data.tkInfo.programs.join(', ')}
                    onChange={(e) =>
                      updateInstitution('tkInfo', 'programs', e.target.value.split(',').map(p => p.trim()))
                    }
                    placeholder="Tahfidz, Montessori, dll"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SD Tab */}
        <TabsContent value="sd" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi SD Imam Syafii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                <Input
                  value={data.sdInfo.name}
                  onChange={(e) => updateInstitution('sdInfo', 'name', e.target.value)}
                  placeholder="SD Imam Syafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <Textarea
                  value={data.sdInfo.description}
                  onChange={(e) => updateInstitution('sdInfo', 'description', e.target.value)}
                  placeholder="Deskripsi SD..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kepala Sekolah</label>
                  <Input
                    value={data.sdInfo.headmaster}
                    onChange={(e) => updateInstitution('sdInfo', 'headmaster', e.target.value)}
                    placeholder="Nama Kepala Sekolah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Akreditasi</label>
                  <Input
                    value={data.sdInfo.accreditation}
                    onChange={(e) => updateInstitution('sdInfo', 'accreditation', e.target.value)}
                    placeholder="A / B / C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kapasitas Siswa</label>
                  <Input
                    value={data.sdInfo.capacity}
                    onChange={(e) => updateInstitution('sdInfo', 'capacity', e.target.value)}
                    placeholder="200 siswa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Program Unggulan (pisah dengan koma)</label>
                  <Input
                    value={data.sdInfo.programs.join(', ')}
                    onChange={(e) =>
                      updateInstitution('sdInfo', 'programs', e.target.value.split(',').map(p => p.trim()))
                    }
                    placeholder="Tahfidz, IT, dll"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pondok Tab */}
        <TabsContent value="pondok" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pondok Pesantren Imam Syafii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                <Input
                  value={data.pondokInfo.name}
                  onChange={(e) => updateInstitution('pondokInfo', 'name', e.target.value)}
                  placeholder="Pondok Pesantren Imam Syafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <Textarea
                  value={data.pondokInfo.description}
                  onChange={(e) => updateInstitution('pondokInfo', 'description', e.target.value)}
                  placeholder="Deskripsi Pondok..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pengasuh / Kyai</label>
                  <Input
                    value={data.pondokInfo.headmaster}
                    onChange={(e) => updateInstitution('pondokInfo', 'headmaster', e.target.value)}
                    placeholder="Nama Pengasuh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Akreditasi</label>
                  <Input
                    value={data.pondokInfo.accreditation}
                    onChange={(e) => updateInstitution('pondokInfo', 'accreditation', e.target.value)}
                    placeholder="A / B / C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kapasitas Santri</label>
                  <Input
                    value={data.pondokInfo.capacity}
                    onChange={(e) => updateInstitution('pondokInfo', 'capacity', e.target.value)}
                    placeholder="500 santri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Program Unggulan (pisah dengan koma)</label>
                  <Input
                    value={data.pondokInfo.programs.join(', ')}
                    onChange={(e) =>
                      updateInstitution('pondokInfo', 'programs', e.target.value.split(',').map(p => p.trim()))
                    }
                    placeholder="Tahfidz, Kitab Kuning, dll"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vision & Mission Tab */}
        <TabsContent value="vision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Visi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.vision}
                onChange={(e) => setData({ ...data, vision: e.target.value })}
                placeholder="Visi organisasi..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Misi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Tambah misi baru..."
                  value={missionInput}
                  onChange={(e) => setMissionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMission()}
                />
                <Button onClick={handleAddMission}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {data.missions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada misi</p>
                ) : (
                  data.missions.map((mission, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex gap-3 flex-1">
                        <span className="font-bold text-green-600">{index + 1}.</span>
                        <p className="flex-1">{mission}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMission(index)}
                        className="text-red-600 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Struktur Organisasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-medium">Tambah Posisi Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Posisi / Jabatan"
                    value={structureForm.position}
                    onChange={(e) => setStructureForm({ ...structureForm, position: e.target.value })}
                  />
                  <Input
                    placeholder="Nama Pejabat"
                    value={structureForm.name}
                    onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Urutan"
                    value={structureForm.order}
                    onChange={(e) => setStructureForm({ ...structureForm, order: parseInt(e.target.value) })}
                  />
                  <Input
                    placeholder="Parent ID (optional)"
                    value={structureForm.parent}
                    onChange={(e) => setStructureForm({ ...structureForm, parent: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddStructure} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Posisi
                </Button>
              </div>

              <div className="space-y-2">
                {data.structure.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada struktur organisasi</p>
                ) : (
                  data.structure.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-green-600">{item.position}</p>
                        <p className="text-sm text-gray-600">{item.name}</p>
                        <p className="text-xs text-gray-400">Order: {item.order}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteStructure(item.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
