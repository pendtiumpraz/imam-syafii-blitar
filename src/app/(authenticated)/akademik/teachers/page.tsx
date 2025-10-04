'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Calendar,
} from 'lucide-react';

interface Teacher {
  id: string;
  nip?: string;
  name: string;
  title?: string;
  gender: string;
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  address?: string;
  position: string;
  subjects: string[];
  education?: string;
  university?: string;
  major?: string;
  certifications: string[];
  employmentType: string;
  joinDate?: string;
  status: string;
  institution: string;
  specialization?: string;
  experience?: number;
  photo?: string;
  bio?: string;
  achievements: string[];
  isUstadz: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeacherFormData {
  nip: string;
  name: string;
  title: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  subjects: string[];
  education: string;
  university: string;
  major: string;
  certifications: string[];
  employmentType: string;
  joinDate: string;
  status: string;
  institution: string;
  specialization: string;
  experience: number;
  photo: string;
  bio: string;
  achievements: string[];
  isUstadz: boolean;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<TeacherFormData>({
    nip: '',
    name: '',
    title: '',
    gender: 'LAKI_LAKI',
    birthPlace: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    position: '',
    subjects: [],
    education: '',
    university: '',
    major: '',
    certifications: [],
    employmentType: 'TETAP',
    joinDate: '',
    status: 'ACTIVE',
    institution: 'ALL',
    specialization: '',
    experience: 0,
    photo: '',
    bio: '',
    achievements: [],
    isUstadz: true,
  });

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, searchTerm, selectedInstitution, selectedStatus]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        status: selectedStatus,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedInstitution) params.append('institution', selectedInstitution);

      const response = await fetch(`/api/teachers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';
      const payload = editingTeacher
        ? { id: editingTeacher.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Guru berhasil ${editingTeacher ? 'diperbarui' : 'ditambahkan'}`);
        fetchTeachers();
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
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teachers?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.info('Guru berhasil dihapus');
        fetchTeachers();
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
      nip: '',
      name: '',
      title: '',
      gender: 'LAKI_LAKI',
      birthPlace: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      position: '',
      subjects: [],
      education: '',
      university: '',
      major: '',
      certifications: [],
      employmentType: 'TETAP',
      joinDate: '',
      status: 'ACTIVE',
      institution: 'ALL',
      specialization: '',
      experience: 0,
      photo: '',
      bio: '',
      achievements: [],
      isUstadz: true,
    });
    setEditingTeacher(null);
    setShowForm(false);
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      nip: teacher.nip || '',
      name: teacher.name,
      title: teacher.title || '',
      gender: teacher.gender,
      birthPlace: teacher.birthPlace || '',
      birthDate: teacher.birthDate ? teacher.birthDate.split('T')[0] : '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      position: teacher.position,
      subjects: teacher.subjects || [],
      education: teacher.education || '',
      university: teacher.university || '',
      major: teacher.major || '',
      certifications: teacher.certifications || [],
      employmentType: teacher.employmentType,
      joinDate: teacher.joinDate ? teacher.joinDate.split('T')[0] : '',
      status: teacher.status,
      institution: teacher.institution,
      specialization: teacher.specialization || '',
      experience: teacher.experience || 0,
      photo: teacher.photo || '',
      bio: teacher.bio || '',
      achievements: teacher.achievements || [],
      isUstadz: teacher.isUstadz,
    });
    setEditingTeacher(teacher);
    setShowForm(true);
  };

  const filteredTeachers = teachers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Pengajar</h1>
          <p className="text-gray-600 mt-2">Kelola data guru dan ustadz</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Guru</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Guru</p>
              <p className="text-2xl font-bold">{teachers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ustadz</p>
              <p className="text-2xl font-bold">{teachers.filter(t => t.isUstadz).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tetap</p>
              <p className="text-2xl font-bold">{teachers.filter(t => t.employmentType === 'TETAP').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Honorer</p>
              <p className="text-2xl font-bold">{teachers.filter(t => t.employmentType === 'HONORER').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Institusi</option>
            <option value="TK">TK</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="PONDOK">Pondok</option>
            <option value="ALL">Semua</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
            <option value="RESIGNED">Mengundurkan Diri</option>
          </select>

          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter Lainnya</span>
          </Button>
        </div>
      </Card>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))
        ) : filteredTeachers.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada data guru</p>
              <p className="text-sm text-gray-400">Klik tombol "Tambah Guru" untuk menambahkan data</p>
            </Card>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="p-4">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {teacher.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{teacher.name}</h3>
                  {teacher.title && <p className="text-sm text-gray-600">{teacher.title}</p>}
                  <p className="text-sm text-gray-600">{teacher.position}</p>
                  {teacher.nip && <p className="text-xs text-gray-500 font-mono">NIP: {teacher.nip}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={teacher.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {teacher.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </Badge>
                {teacher.isUstadz && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    Ustadz/ah
                  </Badge>
                )}
                <Badge variant="outline">{teacher.employmentType}</Badge>
                <Badge variant="outline">{teacher.institution}</Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {teacher.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                )}

                {teacher.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{teacher.phone}</span>
                  </div>
                )}

                {teacher.specialization && (
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span>{teacher.specialization}</span>
                  </div>
                )}

                {teacher.experience && teacher.experience > 0 && (
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    <span>{teacher.experience} tahun pengalaman</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Detail
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(teacher)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(teacher.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTeacher ? 'Edit Guru' : 'Tambah Guru Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">NIP</label>
                  <Input
                    value={formData.nip}
                    onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                    placeholder="Nomor Induk Pegawai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="contoh: Ahmad Rahman, S.Pd"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Gelar</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="contoh: S.Pd, M.Pd, S.Ag"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telepon</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08xx xxxx xxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Posisi *</label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="contoh: Guru Kelas, Guru Mapel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Spesialisasi</label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="contoh: Matematika, Bahasa Arab"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Institusi *</label>
                  <select
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ALL">Semua</option>
                    <option value="TK">TK</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="PONDOK">Pondok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Kepegawaian</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TETAP">Tetap</option>
                    <option value="HONORER">Honorer</option>
                    <option value="KONTRAK">Kontrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                    <option value="RESIGNED">Mengundurkan Diri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Alamat lengkap"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isUstadz}
                  onChange={(e) => setFormData(prev => ({ ...prev, isUstadz: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm">Ustadz/Ustadzah</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingTeacher ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
