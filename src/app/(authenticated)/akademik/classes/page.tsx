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
  UserPlus,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  section?: string;
  level: string;
  program?: string;
  capacity: number;
  room?: string;
  isActive: boolean;
  academicYear: {
    id: string;
    name: string;
    isActive: boolean;
  };
  teacher?: Teacher;
  _count: {
    studentClasses: number;
    teacherSubjects: number;
    schedules: number;
    exams: number;
  };
}

interface ClassFormData {
  name: string;
  grade: string;
  section: string;
  academicYearId: string;
  teacherId: string;
  capacity: number;
  room: string;
  level: string;
  program: string;
  description: string;
  isActive: boolean;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    grade: '',
    section: '',
    academicYearId: '',
    teacherId: '',
    capacity: 30,
    room: '',
    level: '',
    program: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/academic/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error("Error: Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/academic/years');
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data);
        // Set default to active academic year
        const activeYear = data.find((year: AcademicYear) => year.isActive);
        if (activeYear && !selectedAcademicYear) {
          setSelectedAcademicYear(activeYear.id);
          setFormData(prev => ({ ...prev, academicYearId: activeYear.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Fetch users with USTADZ role (teachers are stored in User model for class assignments)
      const response = await fetch('/api/users?role=USTADZ&isActive=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        // Map User model to the interface expected by the component
        const teachersData = (data.users || []).map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email || '',
        }));
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingClass 
        ? '/api/academic/classes' 
        : '/api/academic/classes';
      
      const method = editingClass ? 'PUT' : 'POST';
      const payload = editingClass 
        ? { id: editingClass.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Kelas berhasil ${editingClass ? 'diperbarui' : 'ditambahkan'}`);
        
        fetchClasses();
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error("Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/academic/classes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.info("Berhasil: Kelas berhasil dihapus");
        fetchClasses();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error("Error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      section: '',
      academicYearId: selectedAcademicYear || '',
      teacherId: '',
      capacity: 30,
      room: '',
      level: '',
      program: '',
      description: '',
      isActive: true,
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const handleEdit = (classItem: Class) => {
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      section: classItem.section || '',
      academicYearId: classItem.academicYear.id,
      teacherId: classItem.teacher?.id || '',
      capacity: classItem.capacity,
      room: classItem.room || '',
      level: classItem.level,
      program: classItem.program || '',
      description: '',
      isActive: classItem.isActive,
    });
    setEditingClass(classItem);
    setShowForm(true);
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.grade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !selectedLevel || classItem.level === selectedLevel;
    const matchesAcademicYear = !selectedAcademicYear || classItem.academicYear.id === selectedAcademicYear;
    
    return matchesSearch && matchesLevel && matchesAcademicYear;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Kelas</h1>
          <p className="text-gray-600 mt-2">Atur kelas dan penugasan siswa</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Jenjang</option>
            <option value="TK">TK</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="PONDOK">Pondok</option>
          </select>

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

          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter Lainnya</span>
          </Button>
        </div>
      </Card>

      {/* Classes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-2 mb-4">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-6 w-12 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))
        ) : (
          filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{classItem.name}</h3>
                  <p className="text-sm text-gray-600">
                    {classItem.level} - Grade {classItem.grade}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(classItem)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(classItem.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={classItem.isActive ? 'default' : 'secondary'}>
                  {classItem.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
                {classItem.program && (
                  <Badge variant="outline">{classItem.program}</Badge>
                )}
                {classItem.room && (
                  <Badge variant="outline">Ruang {classItem.room}</Badge>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{classItem._count.studentClasses} / {classItem.capacity} siswa</span>
                </div>
                
                {classItem.teacher && (
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>Wali: {classItem.teacher.name}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{classItem.academicYear.name}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Detail
                </Button>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Siswa
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Kelas *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="contoh: VII-A, 1A, TK B1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tingkat *</label>
                  <Input
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="contoh: VII, 1, B"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bagian</label>
                  <Input
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="contoh: A, B, C"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Jenjang *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Jenjang</option>
                  <option value="TK">TK</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="PONDOK">Pondok</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Program</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Program</option>
                  <option value="REGULER">Reguler</option>
                  <option value="TAHFIDZ">Tahfidz</option>
                  <option value="KITAB">Kitab Kuning</option>
                </select>
              </div>

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

              <div>
                <label className="block text-sm font-medium mb-1">Wali Kelas</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Wali Kelas</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kapasitas</label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ruangan</label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="contoh: A1, Lab IPA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Keterangan</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm">Kelas aktif</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingClass ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}