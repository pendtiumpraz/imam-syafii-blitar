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
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';
import BulkOperationsModal from '@/components/bulk-operations/bulk-operations-modal';
import { ValidationRules } from '@/lib/bulk-operations';

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  semesters?: Semester[];
  _count?: {
    classes: number;
    studentClasses: number;
  };
}

interface AcademicYearFormData {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templateColumns, setTemplateColumns] = useState<any[]>([]);

  const [formData, setFormData] = useState<AcademicYearFormData>({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: false,
  });

  useEffect(() => {
    fetchAcademicYears();
    fetchTemplateInfo();
  }, [selectedStatus]);

  const fetchTemplateInfo = async () => {
    try {
      const response = await fetch('/api/import/academic-years');
      if (response.ok) {
        const data = await response.json();
        setTemplateColumns(data.templateColumns || []);
      }
    } catch (error) {
      console.error('Error fetching template info:', error);
    }
  };

  const handleImportComplete = async (importedData: any[]) => {
    try {
      const response = await fetch('/api/import/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importedData })
      });

      const result = await response.json();

      if (result.success && result.validRows > 0) {
        toast.success(`${result.validRows} tahun ajaran telah ditambahkan.`);
        fetchAcademicYears();
      } else if (result.errors?.length > 0) {
        toast.error(result.errors.slice(0, 3).join(', '));
      }
    } catch (error) {
      console.error('Error importing academic years:', error);
      toast.error('Gagal mengimpor data tahun ajaran');
    }
  };

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus === 'active') params.append('active', 'true');

      const response = await fetch(`/api/academic/years?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data || []);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Gagal memuat data tahun ajaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/academic/years';
      const method = editingYear ? 'PUT' : 'POST';
      const payload = editingYear
        ? { id: editingYear.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Tahun ajaran berhasil ${editingYear ? 'diperbarui' : 'ditambahkan'}`);
        fetchAcademicYears();
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
    if (!confirm('Apakah Anda yakin ingin menghapus tahun ajaran ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/academic/years?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.info('Tahun ajaran berhasil dihapus');
        fetchAcademicYears();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      isActive: false,
    });
    setEditingYear(null);
    setShowForm(false);
  };

  const handleEdit = (year: AcademicYear) => {
    setFormData({
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
      description: year.description || '',
      isActive: year.isActive,
    });
    setEditingYear(year);
    setShowForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredYears = academicYears.filter(year =>
    year.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tahun Ajaran</h1>
          <p className="text-gray-600 mt-2">Kelola tahun ajaran akademik</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Import / Export
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Ajaran</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total TA</p>
              <p className="text-2xl font-bold">{academicYears.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">TA Aktif</p>
              <p className="text-2xl font-bold">{academicYears.filter(y => y.isActive).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Kelas</p>
              <p className="text-2xl font-bold">
                {academicYears.reduce((acc, y) => acc + (y._count?.classes || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Siswa</p>
              <p className="text-2xl font-bold">
                {academicYears.reduce((acc, y) => acc + (y._count?.studentClasses || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari tahun ajaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

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

      {/* Academic Years Grid */}
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
        ) : filteredYears.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada data tahun ajaran</p>
              <p className="text-sm text-gray-400">Klik tombol "Tambah Tahun Ajaran" untuk menambahkan data</p>
            </Card>
          </div>
        ) : (
          filteredYears.map((year) => (
            <Card key={year.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{year.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(year)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(year.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={year.isActive ? 'default' : 'secondary'}>
                  {year.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                {year.semesters && year.semesters.length > 0 && (
                  <Badge variant="outline">
                    {year.semesters.length} Semester
                  </Badge>
                )}
              </div>

              {year.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {year.description}
                </p>
              )}

              {/* Semesters */}
              {year.semesters && year.semesters.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium text-gray-700">Semester:</p>
                  {year.semesters.map((semester) => (
                    <div key={semester.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                      <span>{semester.name}</span>
                      {semester.isActive && (
                        <Badge variant="default" className="text-xs">Aktif</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Kelas</p>
                  <p className="font-semibold">{year._count?.classes || 0}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-500">Siswa</p>
                  <p className="font-semibold">{year._count?.studentClasses || 0}</p>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Tahun Ajaran *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="contoh: 2024/2025"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: YYYY/YYYY</p>
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

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Deskripsi tahun ajaran..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm">Tahun ajaran aktif</label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Catatan:</p>
                    <p>Hanya satu tahun ajaran yang dapat aktif pada satu waktu. Mengaktifkan tahun ajaran ini akan menonaktifkan tahun ajaran lainnya.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingYear ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Data Tahun Ajaran"
        exportData={academicYears.map(y => ({
          name: y.name,
          startDate: y.startDate,
          endDate: y.endDate,
          description: y.description,
          isActive: y.isActive,
        }))}
        exportColumns={[
          { key: 'name', header: 'Nama' },
          { key: 'startDate', header: 'Tanggal Mulai' },
          { key: 'endDate', header: 'Tanggal Selesai' },
          { key: 'description', header: 'Keterangan' },
          { key: 'isActive', header: 'Aktif' },
        ]}
        templateColumns={templateColumns}
        importValidationRules={[
          ValidationRules.required('name'),
          ValidationRules.required('startDate'),
          ValidationRules.required('endDate'),
        ]}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
