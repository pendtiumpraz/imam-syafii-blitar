'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface Semester {
  id: string;
  academicYearId: string;
  name: string;
  shortName?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  gradingDeadline?: string;
  reportDeadline?: string;
  createdAt: string;
  updatedAt: string;
  academicYear: {
    id: string;
    name: string;
    isActive: boolean;
  };
  _count: {
    teacherSubjects: number;
    grades: number;
    attendances: number;
    exams: number;
  };
}

interface SemesterFormData {
  academicYearId: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  gradingDeadline: string;
  reportDeadline: string;
  isActive: boolean;
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [formData, setFormData] = useState<SemesterFormData>({
    academicYearId: '',
    name: '',
    shortName: '',
    startDate: '',
    endDate: '',
    gradingDeadline: '',
    reportDeadline: '',
    isActive: false,
  });

  useEffect(() => {
    fetchSemesters();
    fetchAcademicYears();
  }, [selectedAcademicYear, selectedStatus]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAcademicYear) params.append('academicYearId', selectedAcademicYear);
      if (selectedStatus === 'active') params.append('active', 'true');

      const response = await fetch(`/api/academic/semesters?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSemesters(data || []);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Gagal memuat data semester');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/academic/years');
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data || []);
        // Set default to active academic year
        const activeYear = data.find((year: AcademicYear) => year.isActive);
        if (activeYear && !formData.academicYearId) {
          setFormData(prev => ({ ...prev, academicYearId: activeYear.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/academic/semesters';
      const method = editingSemester ? 'PUT' : 'POST';
      const payload = editingSemester
        ? { id: editingSemester.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Semester berhasil ${editingSemester ? 'diperbarui' : 'ditambahkan'}`);
        fetchSemesters();
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus semester ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/academic/semesters?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.info('Semester berhasil dihapus');
        fetchSemesters();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    const activeYear = academicYears.find(year => year.isActive);
    setFormData({
      academicYearId: activeYear?.id || '',
      name: '',
      shortName: '',
      startDate: '',
      endDate: '',
      gradingDeadline: '',
      reportDeadline: '',
      isActive: false,
    });
    setEditingSemester(null);
    setShowForm(false);
  };

  const handleEdit = (semester: Semester) => {
    setFormData({
      academicYearId: semester.academicYearId,
      name: semester.name,
      shortName: semester.shortName || '',
      startDate: semester.startDate.split('T')[0],
      endDate: semester.endDate.split('T')[0],
      gradingDeadline: semester.gradingDeadline ? semester.gradingDeadline.split('T')[0] : '',
      reportDeadline: semester.reportDeadline ? semester.reportDeadline.split('T')[0] : '',
      isActive: semester.isActive,
    });
    setEditingSemester(semester);
    setShowForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredSemesters = semesters.filter(semester =>
    semester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.academicYear.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Semester</h1>
          <p className="text-gray-600 mt-2">Kelola semester akademik</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Semester</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Semester</p>
              <p className="text-2xl font-bold">{semesters.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Semester Aktif</p>
              <p className="text-2xl font-bold">{semesters.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pengajar</p>
              <p className="text-2xl font-bold">
                {semesters.reduce((acc, s) => acc + s._count.teacherSubjects, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Nilai</p>
              <p className="text-2xl font-bold">
                {semesters.reduce((acc, s) => acc + s._count.grades, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari semester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tahun Ajaran</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.isActive && '(Aktif)'}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </Card>

      {/* Semesters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))
        ) : filteredSemesters.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada data semester</p>
              <p className="text-sm text-gray-400">Klik tombol "Tambah Semester" untuk menambahkan data</p>
            </Card>
          </div>
        ) : (
          filteredSemesters.map((semester) => (
            <Card key={semester.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{semester.name}</h3>
                  {semester.shortName && (
                    <p className="text-sm text-gray-600">{semester.shortName}</p>
                  )}
                  <p className="text-sm text-gray-600">{semester.academicYear.name}</p>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(semester)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(semester.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={semester.isActive ? 'default' : 'secondary'}>
                  {semester.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                {semester.academicYear.isActive && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    TA Aktif
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(semester.startDate)} - {formatDate(semester.endDate)}</span>
                </div>

                {semester.gradingDeadline && (
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                    <span>Deadline Nilai: {formatDate(semester.gradingDeadline)}</span>
                  </div>
                )}

                {semester.reportDeadline && (
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                    <span>Deadline Rapor: {formatDate(semester.reportDeadline)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Pengajar</p>
                  <p className="font-semibold">{semester._count.teacherSubjects}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Nilai</p>
                  <p className="font-semibold">{semester._count.grades}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Kehadiran</p>
                  <p className="font-semibold">{semester._count.attendances}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Ujian</p>
                  <p className="font-semibold">{semester._count.exams}</p>
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-1" />
                Detail
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingSemester ? 'Edit Semester' : 'Tambah Semester Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tahun Ajaran *</label>
                <select
                  value={formData.academicYearId}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.isActive && '(Aktif)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Semester *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="contoh: Semester Ganjil, Semester Genap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Pendek</label>
                  <Input
                    value={formData.shortName}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortName: e.target.value }))}
                    placeholder="contoh: Sem 1, Sem 2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai *</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Selesai *</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline Penilaian</label>
                  <Input
                    type="date"
                    value={formData.gradingDeadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradingDeadline: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline Rapor</label>
                  <Input
                    type="date"
                    value={formData.reportDeadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDeadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm">Semester aktif</label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Catatan:</p>
                    <p>Hanya satu semester yang dapat aktif dalam satu tahun ajaran. Mengaktifkan semester ini akan menonaktifkan semester lain dalam tahun ajaran yang sama.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingSemester ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
