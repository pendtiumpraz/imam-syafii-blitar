'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'
import { Course } from '@/types'

interface CourseFormProps {
  course?: Course
  onClose: () => void
  onSubmit: (data: {
    name: string
    description: string
    level: string
    schedule: string
    teacher: string
    duration: string
    capacity: number
    status: string
  }) => void
}

export function CourseForm({ course, onClose, onSubmit }: CourseFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'beginner',
    schedule: '',
    teacher: '',
    duration: '',
    capacity: '',
    status: 'active'
  })

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        description: course.description,
        level: course.level,
        schedule: course.schedule,
        teacher: course.teacher,
        duration: course.duration,
        capacity: String(course.capacity),
        status: course.status
      })
    }
  }, [course])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description || !formData.schedule || !formData.teacher || !formData.duration || !formData.capacity) {
      alert('Mohon lengkapi semua field yang wajib')
      return
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      level: formData.level,
      schedule: formData.schedule,
      teacher: formData.teacher,
      duration: formData.duration,
      capacity: parseInt(formData.capacity),
      status: formData.status
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{course ? 'Edit Kelas' : 'Tambah Kelas'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nama Kelas *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Tahfidz Al-Quran Tingkat Dasar"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Deskripsi *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                rows={3}
                placeholder="Deskripsi lengkap tentang kelas..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="beginner">Pemula</option>
                  <option value="intermediate">Menengah</option>
                  <option value="advanced">Lanjutan</option>
                </select>
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
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pengajar *
              </label>
              <Input
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="Contoh: Ustadz Ahmad Fauzi, S.Pd.I"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Jadwal *
                </label>
                <Input
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="Contoh: Senin-Kamis, 07:00-09:00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Durasi *
                </label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Contoh: 6 bulan"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Kapasitas Maksimal *
              </label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Contoh: 20"
                min="1"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button type="submit" className="flex-1">
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}