'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Save, ArrowLeft, RefreshCw, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface FeeDetail {
  registrationFee: number
  enrollmentFee: number
  monthlyFee: number
  uniformFee: number
  booksFee: number
}

interface RegistrationPeriod {
  name: string
  startDate: string
  endDate: string
  discount: number
}

interface PPDBSettings {
  id: string
  academicYear: string
  openDate: string
  closeDate: string
  registrationPeriods: RegistrationPeriod[]
  quotaKBTK: number
  quotaTK: number
  quotaSD: number
  quotaSMP: number
  quotaSMA: number
  quotaPondok: number
  registrationFeeKBTK: number
  registrationFeeTK: number
  registrationFeeSD: number
  registrationFeeSMP: number
  registrationFeeSMA: number
  registrationFeePondok: number
  feeDetails: Record<string, FeeDetail>
  testEnabled: boolean
  testPassScore: number
  interviewEnabled: boolean
  interviewPassScore: number
  requiredDocs: Array<{ name: string; required: boolean }>
  isActive: boolean
}

const defaultFeeDetail: FeeDetail = {
  registrationFee: 0,
  enrollmentFee: 0,
  monthlyFee: 0,
  uniformFee: 0,
  booksFee: 0
}

const jenjangList = [
  { key: 'KB_TK', label: 'KB-TK', quotaKey: 'quotaKBTK', feeKey: 'registrationFeeKBTK' },
  { key: 'TK', label: 'TK', quotaKey: 'quotaTK', feeKey: 'registrationFeeTK' },
  { key: 'SD', label: 'SD', quotaKey: 'quotaSD', feeKey: 'registrationFeeSD' },
  { key: 'SMP', label: 'SMP', quotaKey: 'quotaSMP', feeKey: 'registrationFeeSMP' },
  { key: 'SMA', label: 'SMA', quotaKey: 'quotaSMA', feeKey: 'registrationFeeSMA' },
  { key: 'PONDOK', label: 'Pondok Pesantren', quotaKey: 'quotaPondok', feeKey: 'registrationFeePondok' },
]

export default function PPDBSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PPDBSettings | null>(null)
  const [academicYear, setAcademicYear] = useState('2025/2026')

  useEffect(() => {
    fetchSettings()
  }, [academicYear])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ppdb/settings?academicYear=${encodeURIComponent(academicYear)}`)
      if (response.ok) {
        const data = await response.json()
        const settingsData = data.settings
        
        // Parse JSON fields
        if (typeof settingsData.feeDetails === 'string') {
          try {
            settingsData.feeDetails = JSON.parse(settingsData.feeDetails)
          } catch {
            settingsData.feeDetails = {}
          }
        }
        
        if (typeof settingsData.requiredDocs === 'string') {
          try {
            settingsData.requiredDocs = JSON.parse(settingsData.requiredDocs)
          } catch {
            settingsData.requiredDocs = []
          }
        }

        if (typeof settingsData.registrationPeriods === 'string') {
          try {
            settingsData.registrationPeriods = JSON.parse(settingsData.registrationPeriods)
          } catch {
            settingsData.registrationPeriods = []
          }
        }

        // Convert decimal fields to numbers
        for (const j of jenjangList) {
          if (settingsData[j.feeKey]) {
            settingsData[j.feeKey] = Number(settingsData[j.feeKey])
          }
        }
        
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat pengaturan PPDB',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const { academicYear: _, ...settingsWithoutYear } = settings
      const response = await fetch('/api/ppdb/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear,
          ...settingsWithoutYear
        })
      })

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Pengaturan PPDB berhasil disimpan'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Gagal menyimpan pengaturan',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengaturan',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const updateFeeDetail = (jenjang: string, field: keyof FeeDetail, value: number) => {
    if (!settings) return
    const currentFeeDetails = settings.feeDetails || {}
    const currentJenjangFee = currentFeeDetails[jenjang] || { ...defaultFeeDetail }
    
    setSettings({
      ...settings,
      feeDetails: {
        ...currentFeeDetails,
        [jenjang]: {
          ...currentJenjangFee,
          [field]: value
        }
      }
    })
  }

  const addPeriod = () => {
    if (!settings) return
    const periods = settings.registrationPeriods || []
    const newPeriod: RegistrationPeriod = {
      name: `Gelombang ${periods.length + 1}`,
      startDate: '',
      endDate: '',
      discount: 0
    }
    setSettings({
      ...settings,
      registrationPeriods: [...periods, newPeriod]
    })
  }

  const updatePeriod = (index: number, field: keyof RegistrationPeriod, value: any) => {
    if (!settings) return
    const periods = [...(settings.registrationPeriods || [])]
    periods[index] = { ...periods[index], [field]: value }
    setSettings({ ...settings, registrationPeriods: periods })
  }

  const removePeriod = (index: number) => {
    if (!settings) return
    const periods = [...(settings.registrationPeriods || [])]
    periods.splice(index, 1)
    setSettings({ ...settings, registrationPeriods: periods })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-6">
        <p>Tidak dapat memuat pengaturan</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/ppdb-admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pengaturan PPDB</h1>
              <p className="text-gray-600">Atur tahun ajaran, periode, biaya, dan kuota</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025/2026"
              className="w-32"
            />
            <Button onClick={fetchSettings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="umum" className="space-y-6">
          <TabsList>
            <TabsTrigger value="umum">Umum & Periode</TabsTrigger>
            <TabsTrigger value="biaya">Biaya Pendaftaran</TabsTrigger>
            <TabsTrigger value="kuota">Kuota</TabsTrigger>
            <TabsTrigger value="test">Test & Interview</TabsTrigger>
          </TabsList>

          {/* Tab Umum & Periode */}
          <TabsContent value="umum" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tahun Ajaran</CardTitle>
                <CardDescription>Atur tahun ajaran dan tanggal pembukaan/penutupan PPDB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tahun Ajaran</Label>
                    <Input
                      value={settings.academicYear || academicYear}
                      onChange={(e) => updateSetting('academicYear', e.target.value)}
                      placeholder="2025/2026"
                    />
                  </div>
                  <div>
                    <Label>Tanggal Buka PPDB</Label>
                    <Input
                      type="date"
                      value={settings.openDate?.split('T')[0] || ''}
                      onChange={(e) => updateSetting('openDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tanggal Tutup PPDB</Label>
                    <Input
                      type="date"
                      value={settings.closeDate?.split('T')[0] || ''}
                      onChange={(e) => updateSetting('closeDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label>Status PPDB</Label>
                    <p className="text-sm text-gray-500">Buka/tutup pendaftaran PPDB</p>
                  </div>
                  <Switch
                    checked={settings.isActive}
                    onCheckedChange={(checked) => updateSetting('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gelombang Pendaftaran</CardTitle>
                    <CardDescription>Atur periode/gelombang pendaftaran dan diskon</CardDescription>
                  </div>
                  <Button onClick={addPeriod} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Gelombang
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(settings.registrationPeriods || []).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Belum ada gelombang pendaftaran</p>
                ) : (
                  <div className="space-y-4">
                    {(settings.registrationPeriods || []).map((period, index) => (
                      <div key={index} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <Label>Nama Gelombang</Label>
                          <Input
                            value={period.name}
                            onChange={(e) => updatePeriod(index, 'name', e.target.value)}
                            placeholder="Gelombang 1"
                          />
                        </div>
                        <div>
                          <Label>Tanggal Mulai</Label>
                          <Input
                            type="date"
                            value={period.startDate}
                            onChange={(e) => updatePeriod(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Tanggal Selesai</Label>
                          <Input
                            type="date"
                            value={period.endDate}
                            onChange={(e) => updatePeriod(index, 'endDate', e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <Label>Diskon (%)</Label>
                          <Input
                            type="number"
                            value={period.discount}
                            onChange={(e) => updatePeriod(index, 'discount', Number(e.target.value))}
                            min="0"
                            max="100"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePeriod(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Biaya */}
          <TabsContent value="biaya" className="space-y-6">
            {jenjangList.map((jenjang) => {
              const feeDetail = settings.feeDetails?.[jenjang.key] || defaultFeeDetail
              
              return (
                <Card key={jenjang.key}>
                  <CardHeader>
                    <CardTitle>{jenjang.label}</CardTitle>
                    <CardDescription>Atur biaya untuk jenjang {jenjang.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div>
                        <Label>Biaya Pendaftaran</Label>
                        <Input
                          type="number"
                          value={settings[jenjang.feeKey as keyof PPDBSettings] as number || 0}
                          onChange={(e) => updateSetting(jenjang.feeKey, Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(settings[jenjang.feeKey as keyof PPDBSettings] as number || 0)}
                        </p>
                      </div>
                      <div>
                        <Label>Biaya Daftar Ulang</Label>
                        <Input
                          type="number"
                          value={feeDetail.enrollmentFee}
                          onChange={(e) => updateFeeDetail(jenjang.key, 'enrollmentFee', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(feeDetail.enrollmentFee)}
                        </p>
                      </div>
                      <div>
                        <Label>SPP Bulanan</Label>
                        <Input
                          type="number"
                          value={feeDetail.monthlyFee}
                          onChange={(e) => updateFeeDetail(jenjang.key, 'monthlyFee', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(feeDetail.monthlyFee)}
                        </p>
                      </div>
                      <div>
                        <Label>Biaya Seragam</Label>
                        <Input
                          type="number"
                          value={feeDetail.uniformFee}
                          onChange={(e) => updateFeeDetail(jenjang.key, 'uniformFee', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(feeDetail.uniformFee)}
                        </p>
                      </div>
                      <div>
                        <Label>Biaya Buku</Label>
                        <Input
                          type="number"
                          value={feeDetail.booksFee}
                          onChange={(e) => updateFeeDetail(jenjang.key, 'booksFee', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(feeDetail.booksFee)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">
                        Total Biaya Awal: {formatCurrency(
                          (settings[jenjang.feeKey as keyof PPDBSettings] as number || 0) +
                          feeDetail.enrollmentFee +
                          feeDetail.uniformFee +
                          feeDetail.booksFee
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* Tab Kuota */}
          <TabsContent value="kuota">
            <Card>
              <CardHeader>
                <CardTitle>Kuota Penerimaan</CardTitle>
                <CardDescription>Atur jumlah kuota penerimaan per jenjang</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {jenjangList.map((jenjang) => (
                    <div key={jenjang.key}>
                      <Label>{jenjang.label}</Label>
                      <Input
                        type="number"
                        value={settings[jenjang.quotaKey as keyof PPDBSettings] as number || 0}
                        onChange={(e) => updateSetting(jenjang.quotaKey, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Test & Interview */}
          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Test Masuk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Test Masuk</Label>
                    <p className="text-sm text-gray-500">Aktifkan test masuk untuk calon siswa</p>
                  </div>
                  <Switch
                    checked={settings.testEnabled}
                    onCheckedChange={(checked) => updateSetting('testEnabled', checked)}
                  />
                </div>
                {settings.testEnabled && (
                  <div>
                    <Label>Nilai Minimum Lulus Test</Label>
                    <Input
                      type="number"
                      value={settings.testPassScore}
                      onChange={(e) => updateSetting('testPassScore', Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Interview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Interview</Label>
                    <p className="text-sm text-gray-500">Aktifkan interview untuk calon siswa</p>
                  </div>
                  <Switch
                    checked={settings.interviewEnabled}
                    onCheckedChange={(checked) => updateSetting('interviewEnabled', checked)}
                  />
                </div>
                {settings.interviewEnabled && (
                  <div>
                    <Label>Nilai Minimum Lulus Interview</Label>
                    <Input
                      type="number"
                      value={settings.interviewPassScore}
                      onChange={(e) => updateSetting('interviewPassScore', Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
