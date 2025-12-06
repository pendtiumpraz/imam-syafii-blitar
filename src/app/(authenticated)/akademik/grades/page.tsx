'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  BarChart3,
  Plus,
  Search,
  Filter,
  Edit,
  Save,
  FileSpreadsheet,
  Users,
  BookOpen,
  Award,
  Lock,
  Unlock,
  Download,
} from 'lucide-react';
import BulkOperationsModal from '@/components/bulk-operations/bulk-operations-modal';
import { ValidationRules } from '@/lib/bulk-operations';

interface Grade {
  id: string;
  midterm: number | null;
  final: number | null;
  assignment: number | null;
  quiz: number | null;
  participation: number | null;
  project: number | null;
  daily: number | null;
  total: number | null;
  grade: string | null;
  point: number | null;
  akhlak: string | null;
  quranMemory: string | null;
  notes: string | null;
  isLocked: boolean;
  student: {
    id: string;
    nis: string;
    fullName: string;
    photo?: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
    nameArabic?: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
    academicYear: {
      name: string;
    };
  };
}

interface Class {
  id: string;
  name: string;
  grade: string;
  level: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  nameArabic?: string;
}

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
  academicYear: {
    name: string;
  };
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [gradeInputs, setGradeInputs] = useState<Record<string, any>>({});
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templateColumns, setTemplateColumns] = useState<any[]>([]);

  useEffect(() => {
    fetchSemesters();
    fetchClasses();
    fetchSubjects();
    fetchTemplateInfo();
  }, []);

  const fetchTemplateInfo = async () => {
    try {
      const response = await fetch('/api/import/grades');
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
      const response = await fetch('/api/import/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importedData })
      });

      const result = await response.json();

      if (result.success && result.validRows > 0) {
        toast.success(`${result.validRows} nilai telah ditambahkan/diupdate.`);
        if (selectedClass && selectedSubject && selectedSemester) {
          fetchGrades();
        }
      } else if (result.errors?.length > 0) {
        toast.error(result.errors.slice(0, 3).join(', '));
      }
    } catch (error) {
      console.error('Error importing grades:', error);
      toast.error('Gagal mengimpor data nilai');
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedSemester) {
      fetchGrades();
    }
  }, [selectedClass, selectedSubject, selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/academic/semesters');
      if (response.ok) {
        const data = await response.json();
        setSemesters(data);
        // Set default to active semester
        const activeSemester = data.find((semester: Semester) => semester.isActive);
        if (activeSemester && !selectedSemester) {
          setSelectedSemester(activeSemester.id);
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/academic/classes?active=true');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/academic/subjects?active=true');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        semesterId: selectedSemester,
      });

      const response = await fetch(`/api/academic/grades?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
        
        // Initialize grade inputs
        const inputs: Record<string, any> = {};
        data.forEach((grade: Grade) => {
          inputs[grade.id] = {
            midterm: grade.midterm || '',
            final: grade.final || '',
            assignment: grade.assignment || '',
            quiz: grade.quiz || '',
            participation: grade.participation || '',
            project: grade.project || '',
            daily: grade.daily || '',
            akhlak: grade.akhlak || '',
            quranMemory: grade.quranMemory || '',
            notes: grade.notes || '',
          };
        });
        setGradeInputs(inputs);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error("Error: Gagal memuat data nilai");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async (gradeId: string) => {
    try {
      const gradeData = gradeInputs[gradeId];
      const response = await fetch('/api/academic/grades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: gradeId,
          ...gradeData,
        }),
      });

      if (response.ok) {
        toast.info("Berhasil: Nilai berhasil disimpan");
        fetchGrades();
        setEditingGrade(null);
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error("Error");
    }
  };

  const handleBulkImport = () => {
    // This would open a file upload dialog for Excel import
    toast.info("Info: Fitur import Excel akan segera tersedia");
  };

  const handleBulkExport = () => {
    // This would export current grades to Excel
    toast.info("Info: Fitur export Excel akan segera tersedia");
  };

  const updateGradeInput = (gradeId: string, field: string, value: string) => {
    setGradeInputs(prev => ({
      ...prev,
      [gradeId]: {
        ...prev[gradeId],
        [field]: value,
      },
    }));
  };

  const calculateTotal = (gradeData: any): number | null => {
    const {
      midterm,
      final,
      assignment,
      quiz,
      participation,
      project,
    } = gradeData;

    let total = 0;
    let totalWeight = 0;

    // Weights: midterm 30%, final 35%, assignment 15%, quiz 10%, participation 5%, project 5%
    if (midterm && !isNaN(parseFloat(midterm))) {
      total += parseFloat(midterm) * 0.3;
      totalWeight += 0.3;
    }

    if (final && !isNaN(parseFloat(final))) {
      total += parseFloat(final) * 0.35;
      totalWeight += 0.35;
    }

    if (assignment && !isNaN(parseFloat(assignment))) {
      total += parseFloat(assignment) * 0.15;
      totalWeight += 0.15;
    }

    if (quiz && !isNaN(parseFloat(quiz))) {
      total += parseFloat(quiz) * 0.10;
      totalWeight += 0.10;
    }

    if (participation && !isNaN(parseFloat(participation))) {
      total += parseFloat(participation) * 0.05;
      totalWeight += 0.05;
    }

    if (project && !isNaN(parseFloat(project))) {
      total += parseFloat(project) * 0.05;
      totalWeight += 0.05;
    }

    if (totalWeight >= 0.5) {
      return Math.round((total / totalWeight * 100) * 100) / 100;
    }

    return null;
  };

  const getGradeLetter = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D+';
    if (score >= 45) return 'D';
    return 'E';
  };

  const filteredGrades = grades.filter(grade => 
    grade.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.student.nis.includes(searchTerm)
  );

  if (!selectedClass || !selectedSubject || !selectedSemester) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Input Nilai</h1>
          <p className="text-gray-600 mt-2">Kelola nilai siswa per mata pelajaran</p>
        </div>

        <Card className="p-8 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Kelas dan Mata Pelajaran</h3>
          <p className="text-gray-600 mb-6">
            Pilih kelas, mata pelajaran, dan semester untuk mulai input nilai
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name} - {semester.academicYear.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const selectedSemesterData = semesters.find(s => s.id === selectedSemester);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Input Nilai</h1>
          <p className="text-gray-600 mt-2">
            {selectedClassData?.name} - {selectedSubjectData?.name}
          </p>
          <p className="text-sm text-gray-500">
            {selectedSemesterData?.name} - {selectedSemesterData?.academicYear.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Import / Export
          </Button>
          <Button onClick={() => {
            setSelectedClass('');
            setSelectedSubject('');
            setSelectedSemester('');
          }}>
            Ganti Kelas
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Komponen Nilai:</span>
            <Badge variant="outline">UTS (30%)</Badge>
            <Badge variant="outline">UAS (35%)</Badge>
            <Badge variant="outline">Tugas (15%)</Badge>
            <Badge variant="outline">Kuis (10%)</Badge>
            <Badge variant="outline">Partisipasi (5%)</Badge>
            <Badge variant="outline">Proyek (5%)</Badge>
          </div>
        </div>
      </Card>

      {/* Grades Table */}
      <Card className="overflow-x-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Daftar Nilai Siswa</h3>
          <p className="text-sm text-gray-600">
            {filteredGrades.length} siswa
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Siswa</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">UTS</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">UAS</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Tugas</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Kuis</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Partisipasi</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Proyek</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Total</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Grade</th>
                <th className="px-3 py-3 text-center font-medium text-gray-900">Akhlak</th>
                <th className="px-4 py-3 text-center font-medium text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={11} className="px-4 py-8 text-center">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded mb-2 mx-auto w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded mx-auto w-1/4"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data nilai untuk kelas dan mata pelajaran ini
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade) => {
                  const isEditing = editingGrade === grade.id;
                  const currentInputs = gradeInputs[grade.id] || {};
                  const calculatedTotal = calculateTotal(currentInputs);

                  return (
                    <tr key={grade.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {grade.student.fullName.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{grade.student.fullName}</p>
                            <p className="text-xs text-gray-500">{grade.student.nis}</p>
                          </div>
                        </div>
                      </td>

                      {/* Grade input fields */}
                      {['midterm', 'final', 'assignment', 'quiz', 'participation', 'project'].map((field) => (
                        <td key={field} className="px-3 py-3 text-center">
                          {isEditing && !grade.isLocked ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={currentInputs[field] || ''}
                              onChange={(e) => updateGradeInput(grade.id, field, e.target.value)}
                              className="w-16 h-8 text-center text-xs"
                            />
                          ) : (
                            <span className={`font-medium ${grade[field as keyof Grade] ? 'text-gray-900' : 'text-gray-400'}`}>
                              {String(grade[field as keyof Grade] || '-')}
                            </span>
                          )}
                        </td>
                      ))}

                      {/* Total */}
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${(isEditing ? calculatedTotal : grade.total) ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isEditing ? (calculatedTotal?.toFixed(2) || '-') : (grade.total?.toFixed(2) || '-')}
                        </span>
                      </td>

                      {/* Grade Letter */}
                      <td className="px-3 py-3 text-center">
                        {(isEditing ? calculatedTotal : grade.total) ? (
                          <Badge variant="default">
                            {getGradeLetter(isEditing ? calculatedTotal! : grade.total!)}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Akhlak */}
                      <td className="px-3 py-3 text-center">
                        {isEditing && !grade.isLocked ? (
                          <select
                            value={currentInputs.akhlak || ''}
                            onChange={(e) => updateGradeInput(grade.id, 'akhlak', e.target.value)}
                            className="w-16 h-8 text-xs border rounded"
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        ) : (
                          <span className={`font-medium ${grade.akhlak ? 'text-gray-900' : 'text-gray-400'}`}>
                            {grade.akhlak || '-'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {grade.isLocked ? (
                            <Lock className="w-4 h-4 text-gray-400" />
                          ) : isEditing ? (
                            <>
                              <Button size="sm" onClick={() => handleSaveGrade(grade.id)}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingGrade(null)}>
                                Batal
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setEditingGrade(grade.id)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Data Nilai"
        exportData={grades.map(g => ({
          studentNis: g.student.nis,
          studentName: g.student.fullName,
          subjectCode: g.subject.code,
          subjectName: g.subject.name,
          daily: g.daily,
          quiz: g.quiz,
          assignment: g.assignment,
          midterm: g.midterm,
          final: g.final,
          participation: g.participation,
          total: g.total,
          grade: g.grade,
          akhlak: g.akhlak,
          notes: g.notes,
        }))}
        exportColumns={[
          { key: 'studentNis', header: 'NIS' },
          { key: 'studentName', header: 'Nama Siswa' },
          { key: 'subjectCode', header: 'Kode Mapel' },
          { key: 'subjectName', header: 'Nama Mapel' },
          { key: 'daily', header: 'Nilai Harian' },
          { key: 'quiz', header: 'Nilai Kuis' },
          { key: 'assignment', header: 'Nilai Tugas' },
          { key: 'midterm', header: 'Nilai UTS' },
          { key: 'final', header: 'Nilai UAS' },
          { key: 'participation', header: 'Partisipasi' },
          { key: 'total', header: 'Total' },
          { key: 'grade', header: 'Grade' },
          { key: 'akhlak', header: 'Akhlak' },
          { key: 'notes', header: 'Catatan' },
        ]}
        templateColumns={templateColumns}
        importValidationRules={[
          ValidationRules.required('studentNis'),
          ValidationRules.required('subjectCode'),
        ]}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}