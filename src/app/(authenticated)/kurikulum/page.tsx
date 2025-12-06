'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Plus, Users, Clock, BookOpen, Edit, Trash2, Search } from 'lucide-react'
import { Course } from '@/types'
import { CourseForm } from '@/components/kurikulum/course-form'
import { CourseDetail } from '@/components/kurikulum/course-detail'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'

interface Stats {
  total: number
  active: number
  totalEnrolled: number
  totalCapacity: number
}

export default function Kurikulum() {
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, totalEnrolled: 0, totalCapacity: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'completed'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [filter, levelFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (levelFilter !== 'all') params.set('level', levelFilter)
      if (searchTerm) params.set('search', searchTerm)

      const response = await fetch(`/api/courses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        setStats(data.stats || { total: 0, active: 0, totalEnrolled: 0, totalCapacity: 0 })
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat data kelas',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data kelas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: Partial<Course>) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Kelas berhasil ditambahkan'
        })
        fetchCourses()
        setShowForm(false)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Gagal menambahkan kelas',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating course:', error)
      toast({
        title: 'Error',
        description: 'Gagal menambahkan kelas',
        variant: 'destructive'
      })
    }
  }

  const handleUpdate = async (data: Partial<Course>) => {
    if (!editingCourse) return

    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCourse.id, ...data })
      })

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Kelas berhasil diupdate'
        })
        fetchCourses()
        setEditingCourse(null)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Gagal mengupdate kelas',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengupdate kelas',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return

    try {
      const response = await fetch(`/api/courses?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Kelas berhasil dihapus'
        })
        fetchCourses()
      } else {
        toast({
          title: 'Error',
          description: 'Gagal menghapus kelas',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast({
        title: 'Error',
        description: 'Gagal menghapus kelas',
        variant: 'destructive'
      })
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Pemula'
      case 'intermediate': return 'Menengah'
      case 'advanced': return 'Lanjutan'
      default: return level
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif'
      case 'inactive': return 'Tidak Aktif'
      case 'completed': return 'Selesai'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateEnrollmentPercentage = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manajemen Kurikulum" />
      
      <main className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center">
                {stats.total}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Total Kelas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center text-green-600">
                {stats.active}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Kelas Aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center text-blue-600">
                {stats.totalEnrolled}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Total Santri
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center text-purple-600">
                {stats.totalCapacity > 0 ? Math.round((stats.totalEnrolled / stats.totalCapacity) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600 text-center">
                Rata-rata Kapasitas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
                className="pl-10 w-64"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="completed">Selesai</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Semua Level</option>
              <option value="beginner">Pemula</option>
              <option value="intermediate">Menengah</option>
              <option value="advanced">Lanjutan</option>
            </select>
          </div>

          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kelas
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Tidak ada kelas ditemukan
            </div>
          ) : (
            courses.map((course) => {
              const enrollmentPercentage = calculateEnrollmentPercentage(course.enrolled, course.capacity)
              
              return (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                          {getLevelLabel(course.level)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {getStatusLabel(course.status)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCourse(course)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(course.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle 
                      className="text-lg line-clamp-2 cursor-pointer hover:text-primary-600"
                      onClick={() => setSelectedCourse(course)}
                    >
                      {course.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-medium">{course.teacher}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{course.schedule}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolled} / {course.capacity} santri</span>
                      </div>
                    </div>

                    {/* Enrollment Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Kapasitas</span>
                        <span>{enrollmentPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            enrollmentPercentage >= 90 ? 'bg-red-600' :
                            enrollmentPercentage >= 70 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${enrollmentPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Durasi: {course.duration}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          enrollmentPercentage >= 90 ? 'bg-red-100 text-red-800' :
                          enrollmentPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {enrollmentPercentage >= 90 ? 'Penuh' :
                           enrollmentPercentage >= 70 ? 'Hampir Penuh' :
                           'Tersedia'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>

      {/* Course Form Modal - Add */}
      {showForm && (
        <CourseForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Course Form Modal - Edit */}
      {editingCourse && (
        <CourseForm
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSubmit={handleUpdate}
        />
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetail
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onUpdate={(updatedCourse) => {
            fetchCourses()
            setSelectedCourse(null)
          }}
        />
      )}
    </div>
  )
}
