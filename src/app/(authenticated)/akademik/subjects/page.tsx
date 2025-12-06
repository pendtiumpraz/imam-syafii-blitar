'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  Star,
  GraduationCap,
  Download,
} from 'lucide-react';
import BulkOperationsModal from '@/components/bulk-operations/bulk-operations-modal';
import { ValidationRules } from '@/lib/bulk-operations';

interface Subject {
  id: string;
  code: string;
  name: string;
  nameArabic?: string;
  description?: string;
  credits: number;
  type: string;
  category: string;
  level: string;
  minGrade?: string;
  maxGrade?: string;
  isActive: boolean;
  sortOrder: number;
  _count: {
    teacherSubjects: number;
    curriculumSubjects: number;
    grades: number;
    schedules: number;
    exams: number;
  };
}

interface SubjectFormData {
  code: string;
  name: string;
  nameArabic: string;
  description: string;
  credits: number;
  type: string;
  category: string;
  level: string;
  minGrade: string;
  maxGrade: string;
  isActive: boolean;
  sortOrder: number;
}

const SUBJECT_TYPES = {
  WAJIB: { label: 'Wajib', color: 'bg-blue-500' },
  PILIHAN: { label: 'Pilihan', color: 'bg-green-500' },
};

const SUBJECT_CATEGORIES = {
  UMUM: { label: 'Umum', color: 'bg-gray-500' },
  AGAMA: { label: 'Agama', color: 'bg-emerald-500' },
  MUATAN_LOKAL: { label: 'Muatan Lokal', color: 'bg-purple-500' },
};

const EDUCATION_LEVELS = ['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA'];

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  'KB_TK': 'KB-TK',
  'SD': 'SD',
  'MTQ': 'MTQ',
  'MSWi': 'MSWi',
  'MSWa': 'MSWa',
  'SMP': 'SMP',
  'SMA': 'SMA',
};

// Common Islamic subjects
const ISLAMIC_SUBJECTS = [
  { code: 'QUR01', name: 'Al-Quran', nameArabic: 'القرآن الكريم' },
  { code: 'HAD01', name: 'Hadist', nameArabic: 'الحديث الشريف' },
  { code: 'FIQ01', name: 'Fiqh', nameArabic: 'الفقه' },
  { code: 'AQD01', name: 'Aqidah', nameArabic: 'العقيدة' },
  { code: 'AKH01', name: 'Akhlak', nameArabic: 'الأخلاق' },
  { code: 'TAF01', name: 'Tafsir', nameArabic: 'التفسير' },
  { code: 'TAR01', name: 'Tarikh Islam', nameArabic: 'التاريخ الإسلامي' },
  { code: 'BAR01', name: 'Bahasa Arab', nameArabic: 'اللغة العربية' },
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templateColumns, setTemplateColumns] = useState<any[]>([]);

  const [formData, setFormData] = useState<SubjectFormData>({
    code: '',
    name: '',
    nameArabic: '',
    description: '',
    credits: 2,
    type: 'WAJIB',
    category: 'UMUM',
    level: '',
    minGrade: '',
    maxGrade: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchSubjects();
    fetchTemplateInfo();
  }, []);

  const fetchTemplateInfo = async () => {
    try {
      const response = await fetch('/api/import/subjects');
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
      const response = await fetch('/api/import/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importedData })
      });

      const result = await response.json();

      if (result.success && result.validRows > 0) {
        toast.success(`${result.validRows} mata pelajaran telah ditambahkan.`);
        fetchSubjects();
      } else if (result.errors?.length > 0) {
        toast.error(result.errors.slice(0, 3).join(', '));
      }
    } catch (error) {
      console.error('Error importing subjects:', error);
      toast.error('Gagal mengimpor data mata pelajaran');
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/academic/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error("Error: Gagal memuat data mata pelajaran");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSubject 
        ? '/api/academic/subjects' 
        : '/api/academic/subjects';
      
      const method = editingSubject ? 'PUT' : 'POST';
      const payload = editingSubject 
        ? { id: editingSubject.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Mata pelajaran berhasil ${editingSubject ? 'diperbarui' : 'ditambahkan'}`);
        
        fetchSubjects();
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
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/academic/subjects?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.info("Berhasil: Mata pelajaran berhasil dihapus");
        fetchSubjects();
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
      code: '',
      name: '',
      nameArabic: '',
      description: '',
      credits: 2,
      type: 'WAJIB',
      category: 'UMUM',
      level: '',
      minGrade: '',
      maxGrade: '',
      isActive: true,
      sortOrder: 0,
    });
    setEditingSubject(null);
    setShowForm(false);
  };

  const handleEdit = (subject: Subject) => {
    setFormData({
      code: subject.code,
      name: subject.name,
      nameArabic: subject.nameArabic || '',
      description: subject.description || '',
      credits: subject.credits,
      type: subject.type,
      category: subject.category,
      level: subject.level,
      minGrade: subject.minGrade || '',
      maxGrade: subject.maxGrade || '',
      isActive: subject.isActive,
      sortOrder: subject.sortOrder,
    });
    setEditingSubject(subject);
    setShowForm(true);
  };

  const handleQuickAdd = (islamicSubject: typeof ISLAMIC_SUBJECTS[0]) => {
    setFormData({
      ...formData,
      code: islamicSubject.code,
      name: islamicSubject.name,
      nameArabic: islamicSubject.nameArabic,
      category: 'AGAMA',
    });
    setShowForm(true);
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !selectedLevel || subject.level === selectedLevel;
    const matchesCategory = !selectedCategory || subject.category === selectedCategory;
    const matchesType = !selectedType || subject.type === selectedType;
    
    return matchesSearch && matchesLevel && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mata Pelajaran</h1>
          <p className="text-gray-600 mt-2">Kelola mata pelajaran dan kurikulum</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Import / Export
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Mata Pelajaran</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Islamic Subjects */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Tambah Cepat Mata Pelajaran Agama</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {ISLAMIC_SUBJECTS.map((subject) => (
            <Button
              key={subject.code}
              size="sm"
              variant="outline"
              onClick={() => handleQuickAdd(subject)}
              className="text-xs h-auto py-2 flex-col"
            >
              <span className="font-medium">{subject.name}</span>
              <span className="text-xs text-gray-500">{subject.nameArabic}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari mata pelajaran..."
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
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>{EDUCATION_LEVEL_LABELS[level] || level}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {Object.entries(SUBJECT_CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Jenis</option>
            {Object.entries(SUBJECT_TYPES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>

          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter Lainnya</span>
          </Button>
        </div>
      </Card>

      {/* Subjects Grid */}
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
          filteredSubjects.map((subject) => (
            <Card key={subject.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                  {subject.nameArabic && (
                    <p className="text-sm text-green-600 font-arabic">{subject.nameArabic}</p>
                  )}
                  <p className="text-sm text-gray-600 font-mono">{subject.code}</p>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(subject)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(subject.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge 
                  className={`${SUBJECT_CATEGORIES[subject.category as keyof typeof SUBJECT_CATEGORIES]?.color} text-white`}
                >
                  {SUBJECT_CATEGORIES[subject.category as keyof typeof SUBJECT_CATEGORIES]?.label}
                </Badge>
                
                <Badge 
                  variant="outline"
                  className={subject.type === 'WAJIB' ? 'border-blue-500 text-blue-700' : 'border-green-500 text-green-700'}
                >
                  {SUBJECT_TYPES[subject.type as keyof typeof SUBJECT_TYPES]?.label}
                </Badge>
                
                <Badge variant="outline">{subject.level}</Badge>
                
                <Badge variant="outline">{subject.credits} Jam</Badge>

                {!subject.isActive && (
                  <Badge variant="secondary">Nonaktif</Badge>
                )}
              </div>

              {subject.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {subject.description}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{subject._count.teacherSubjects} pengajar</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{subject._count.schedules} jadwal</span>
                </div>

                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <span>{subject._count.grades} nilai</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Detail
                </Button>
                <Button size="sm" variant="outline">
                  <Users className="w-4 h-4 mr-1" />
                  Pengajar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kode Mata Pelajaran *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="contoh: MTK01, BIN01, QUR01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jam *</label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nama Mata Pelajaran *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="contoh: Matematika, Bahasa Indonesia, Al-Quran"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nama Arab (Opsional)</label>
                <Input
                  value={formData.nameArabic}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameArabic: e.target.value }))}
                  placeholder="contoh: الرياضيات، القرآن الكريم"
                  className="font-arabic"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Jenjang *</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Jenjang</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>{EDUCATION_LEVEL_LABELS[level] || level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(SUBJECT_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Jenis *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(SUBJECT_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tingkat Minimum</label>
                  <Input
                    value={formData.minGrade}
                    onChange={(e) => setFormData(prev => ({ ...prev, minGrade: e.target.value }))}
                    placeholder="contoh: 1, VII, A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tingkat Maksimum</label>
                  <Input
                    value={formData.maxGrade}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxGrade: e.target.value }))}
                    placeholder="contoh: 6, IX, B"
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
                  placeholder="Deskripsi mata pelajaran..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan Tampilan</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded mr-2"
                  />
                  <label className="text-sm">Mata pelajaran aktif</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingSubject ? 'Perbarui' : 'Simpan'}
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
        title="Data Mata Pelajaran"
        exportData={subjects.map(s => ({
          code: s.code,
          name: s.name,
          nameArabic: s.nameArabic,
          credits: s.credits,
          type: s.type,
          category: s.category,
          level: s.level,
          minGrade: s.minGrade,
          maxGrade: s.maxGrade,
          isActive: s.isActive,
        }))}
        exportColumns={[
          { key: 'code', header: 'Kode' },
          { key: 'name', header: 'Nama' },
          { key: 'nameArabic', header: 'Nama Arab' },
          { key: 'credits', header: 'Jam' },
          { key: 'type', header: 'Jenis' },
          { key: 'category', header: 'Kategori' },
          { key: 'level', header: 'Jenjang' },
          { key: 'minGrade', header: 'Kelas Min' },
          { key: 'maxGrade', header: 'Kelas Max' },
          { key: 'isActive', header: 'Aktif' },
        ]}
        templateColumns={templateColumns}
        importValidationRules={[
          ValidationRules.required('code'),
          ValidationRules.required('name'),
          ValidationRules.required('level'),
        ]}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}