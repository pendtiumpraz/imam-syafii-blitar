'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Save, Loader2 } from 'lucide-react'

interface Student {
  id: string
  nisn?: string | null
  nis: string
  fullName: string
  nickname?: string | null
  birthPlace: string
  birthDate: Date
  gender: string
  bloodType?: string | null
  address: string
  city: string
  phone?: string | null
  email?: string | null
  fatherName: string
  motherName: string
  institutionType: string
  grade?: string | null
  enrollmentYear: string
  status: string
  photo?: string | null
}

interface StudentEditFormProps {
  student: Student
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export function StudentEditForm({ student, isOpen, onClose, onSubmit }: StudentEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nisn: student.nisn || '',
    nis: student.nis,
    fullName: student.fullName,
    nickname: student.nickname || '',
    birthPlace: student.birthPlace,
    birthDate: new Date(student.birthDate).toISOString().split('T')[0],
    gender: student.gender,
    bloodType: student.bloodType || '',
    address: student.address,
    city: student.city,
    phone: student.phone || '',
    email: student.email || '',
    fatherName: student.fatherName,
    motherName: student.motherName,
    institutionType: student.institutionType,
    grade: student.grade || '',
    enrollmentYear: student.enrollmentYear,
    enrollmentDate: new Date(student.birthDate).toISOString().split('T')[0], // Default to birthdate, should be updated with actual enrollment date
    status: student.status,
    photo: student.photo || '',
    isOrphan: (student as any).isOrphan || false,
    // Default values for required fields that might not exist in the interface
    province: 'Jawa Timur',
    village: '',
    district: '',
    postalCode: '',
    fatherJob: '',
    fatherPhone: '',
    fatherEducation: '',
    motherJob: '',
    motherPhone: '',
    motherEducation: '',
    guardianName: '',
    guardianJob: '',
    guardianPhone: '',
    guardianRelation: '',
    previousSchool: '',
    specialNeeds: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nis || !formData.fullName || !formData.birthPlace || !formData.address || !formData.city || !formData.fatherName || !formData.motherName) {
      setError('Mohon lengkapi semua field yang wajib')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
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
      
      {/* Slide-out Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-1/3 xl:w-1/4 bg-white shadow-xl z-50 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Data Siswa</h2>
              <p className="text-sm text-gray-600">{student.fullName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>

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
                    NISN
                  </label>
                  <Input
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Nomor Induk Siswa Nasional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    NIS *
                  </label>
                  <Input
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Nomor Induk Siswa"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama Lengkap *
                  </label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nama lengkap siswa"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama Panggilan
                  </label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Nama panggilan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tempat Lahir *
                  </label>
                  <Input
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    placeholder="Tempat lahir"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tanggal Lahir *
                  </label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Pilih golongan darah</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status Yatim
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isOrphan}
                        onChange={(e) => setFormData({ ...formData, isOrphan: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm">Siswa Yatim (untuk program OTA)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Informasi Alamat</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alamat *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    placeholder="Alamat lengkap"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kota *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kota"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Provinsi
                  </label>
                  <Input
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Provinsi"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Informasi Kontak</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nomor Telepon
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Nomor telepon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Alamat email"
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Informasi Orang Tua</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama Ayah *
                  </label>
                  <Input
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Nama lengkap ayah"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama Ibu *
                  </label>
                  <Input
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Nama lengkap ibu"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Informasi Akademik</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Institusi *
                  </label>
                  <select
                    value={formData.institutionType}
                    onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="TK">TK</option>
                    <option value="SD">SD</option>
                    <option value="PONDOK">PONDOK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kelas
                  </label>
                  <Input
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="Kelas saat ini"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tahun Masuk
                  </label>
                  <Input
                    value={formData.enrollmentYear}
                    onChange={(e) => setFormData({ ...formData, enrollmentYear: e.target.value })}
                    placeholder="Tahun masuk"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="GRADUATED">Lulus</option>
                    <option value="TRANSFERRED">Pindah</option>
                    <option value="DROPPED_OUT">Keluar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 bg-white border-t pt-4 mt-6 -mx-6 px-6">
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
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}