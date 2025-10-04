'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { QuickRecordModal } from '@/components/hafalan/quick-record-modal';
import { SetoranFormSlideOver } from '@/components/hafalan/setoran-form-slide-over';
import { Mic, Search, Book, Users, Target, CheckCircle, Clock, AlertCircle, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Student {
  id: string;
  fullName: string;
  nickname?: string;
  photo?: string;
  grade?: string;
  institutionType: string;
}

interface Surah {
  id: string;
  number: number;
  name: string;
  nameArabic: string;
  totalAyat: number;
  juz: number;
  type: string;
}

interface StudentProgress {
  surahStatus: Array<{
    surah: Surah;
    status: string;
    progress: number;
    completedAyatsCount: number;
  }>;
  statistics: {
    overallProgress: number;
    juz30Progress: number;
    completedSurahs: number;
    totalAyatsMemorized: number;
  };
}

interface SetoranRecord {
  id: string;
  studentId: string;
  surahNumber: number;
  startAyat: number;
  endAyat: number;
  status: string;
  quality: string;
  teacherId: string;
  date: string;
  notes?: string;
  voiceNoteUrl?: string;
  student: {
    id: string;
    fullName: string;
    nickname?: string;
    photo?: string;
  };
  surah: {
    number: number;
    name: string;
    nameArabic: string;
    totalAyat: number;
    juz: number;
  };
  teacher: {
    id: string;
    name: string;
  };
}

export default function HafalanSetoranPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordType, setRecordType] = useState<'SETORAN_BARU' | 'MURAJA\'AH' | 'TES_HAFALAN'>('SETORAN_BARU');
  const [setoranRecords, setSetoranRecords] = useState<SetoranRecord[]>([]);
  const [showFormSlideOver, setShowFormSlideOver] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SetoranRecord | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'list'>('quick');

  // Load initial data
  useEffect(() => {
    loadStudents();
    loadSurahs();
  }, []);

  // Load student progress when student is selected
  useEffect(() => {
    if (selectedStudent) {
      loadStudentProgress(selectedStudent.id);
      loadSetoranRecords(selectedStudent.id);
    }
  }, [selectedStudent]);

  // Load all records when list tab is active
  useEffect(() => {
    if (activeTab === 'list') {
      loadSetoranRecords();
    }
  }, [activeTab]);

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=100');
      const data = await response.json();
      setStudents(data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadSurahs = async () => {
    try {
      const response = await fetch('/api/hafalan/surah');
      const data = await response.json();
      setSurahs(data.surahs || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading surahs:', error);
      setLoading(false);
    }
  };

  const loadStudentProgress = async (studentId: string) => {
    try {
      const response = await fetch(`/api/hafalan/student/${studentId}`);
      const data = await response.json();
      setStudentProgress(data);
    } catch (error) {
      console.error('Error loading student progress:', error);
    }
  };

  const loadSetoranRecords = async (studentId?: string) => {
    setRecordsLoading(true);
    try {
      const url = studentId
        ? `/api/hafalan/record?studentId=${studentId}&limit=100`
        : '/api/hafalan/record?limit=100';
      const response = await fetch(url);
      const data = await response.json();
      setSetoranRecords(data.records || []);
    } catch (error) {
      console.error('Error loading setoran records:', error);
      toast.error('Gagal memuat data setoran');
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowFormSlideOver(true);
  };

  const handleEditRecord = (record: SetoranRecord) => {
    setEditingRecord(record);
    setShowFormSlideOver(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data setoran ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hafalan/record/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Data setoran berhasil dihapus');
        loadSetoranRecords(selectedStudent?.id);
        if (selectedStudent) {
          loadStudentProgress(selectedStudent.id);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Gagal menghapus data setoran');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Terjadi kesalahan saat menghapus data');
    }
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowFormSlideOver(false);
    setEditingRecord(null);
    if (refresh) {
      loadSetoranRecords(selectedStudent?.id);
      if (selectedStudent) {
        loadStudentProgress(selectedStudent.id);
      }
    }
  };

  const getSurahStatusColor = (surah: Surah) => {
    if (!studentProgress) return 'bg-gray-200 text-gray-600';
    
    const surahData = studentProgress.surahStatus?.find(s => s.surah.number === surah.number);
    if (!surahData) return 'bg-gray-200 text-gray-600';

    switch (surahData.status) {
      case 'MUTQIN':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'LANCAR':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'MURAJA\'AH':
      case 'SEDANG_DIHAFAL':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'BARU':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'PERLU_MURAJA\'AH':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
    }
  };

  const getSurahStatusIcon = (surah: Surah) => {
    if (!studentProgress) return null;
    
    const surahData = studentProgress.surahStatus?.find(s => s.surah.number === surah.number);
    if (!surahData) return null;

    switch (surahData.status) {
      case 'MUTQIN':
        return <CheckCircle className="w-4 h-4" />;
      case 'LANCAR':
        return <Book className="w-4 h-4" />;
      case 'SEDANG_DIHAFAL':
        return <Clock className="w-4 h-4" />;
      case 'PERLU_MURAJA\'AH':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.nickname && student.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openRecordingModal = (surah: Surah, type: 'SETORAN_BARU' | 'MURAJA\'AH' | 'TES_HAFALAN' = 'SETORAN_BARU') => {
    setSelectedSurah(surah);
    setRecordType(type);
    setShowRecordModal(true);
  };

  const closeRecordModal = () => {
    setShowRecordModal(false);
    setSelectedSurah(null);
    // Refresh student progress after recording
    if (selectedStudent) {
      loadStudentProgress(selectedStudent.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setoran Hafalan Al-Quran
          </h1>
          <p className="text-gray-600">
            Sistem pencatatan hafalan yang mudah dan intuitif untuk para ustadz
          </p>
        </div>

        {/* Student Selector */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Search className="w-6 h-6 text-gray-500" />
              <Input
                placeholder="Cari nama santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-lg p-4"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
              {filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  variant={selectedStudent?.id === student.id ? "default" : "outline"}
                  className="p-4 h-auto justify-start text-left"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center gap-3 w-full">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {student.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{student.fullName}</p>
                      {student.nickname && (
                        <p className="text-sm text-gray-500 truncate">({student.nickname})</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {student.grade} - {student.institutionType}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Progress Summary */}
        {selectedStudent && studentProgress && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {selectedStudent.photo ? (
                    <img
                      src={selectedStudent.photo}
                      alt={selectedStudent.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStudent.fullName}</h2>
                    <p className="text-gray-600">
                      {selectedStudent.grade} - {selectedStudent.institutionType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress Keseluruhan</p>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(studentProgress.statistics.overallProgress)}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Book className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {studentProgress.statistics.completedSurahs}
                  </p>
                  <p className="text-sm text-gray-600">Surah Selesai</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {studentProgress.statistics.totalAyatsMemorized}
                  </p>
                  <p className="text-sm text-gray-600">Ayat Hafal</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(studentProgress.statistics.juz30Progress)}%
                  </p>
                  <p className="text-sm text-gray-600">Juz 30</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.max(0, 114 - studentProgress.statistics.completedSurahs)}
                  </p>
                  <p className="text-sm text-gray-600">Sedang Proses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        {selectedStudent && (
          <div className="mb-6">
            <div className="flex gap-2 border-b">
              <Button
                variant={activeTab === 'quick' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('quick')}
                className="rounded-b-none"
              >
                <Book className="w-4 h-4 mr-2" />
                Quick Record
              </Button>
              <Button
                variant={activeTab === 'list' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('list')}
                className="rounded-b-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Daftar Setoran
              </Button>
            </div>
          </div>
        )}

        {/* Records Table */}
        {selectedStudent && activeTab === 'list' && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Riwayat Setoran</h3>
                <Button onClick={handleAddRecord} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Setoran
                </Button>
              </div>

              {recordsLoading ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : setoranRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Belum Ada Data Setoran
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Mulai tambahkan data setoran hafalan untuk santri ini
                  </p>
                  <Button onClick={handleAddRecord} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Setoran Pertama
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Santri
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surah
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ayat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kualitas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ustadz
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {setoranRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {new Date(record.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {record.student.photo ? (
                                <img
                                  src={record.student.photo}
                                  alt={record.student.fullName}
                                  className="w-8 h-8 rounded-full mr-2"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2">
                                  {record.student.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.student.fullName}
                                </div>
                                {record.student.nickname && (
                                  <div className="text-xs text-gray-500">
                                    ({record.student.nickname})
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.surah.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.surah.nameArabic}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.startAyat}-{record.endAyat}
                            <span className="text-xs text-gray-500 ml-1">
                              ({record.endAyat - record.startAyat + 1} ayat)
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge
                              className={
                                record.status === 'MUTQIN'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'LANCAR'
                                  ? 'bg-blue-100 text-blue-800'
                                  : record.status === 'MURAJA\'AH'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge
                              className={
                                record.quality === 'A'
                                  ? 'bg-green-100 text-green-800'
                                  : record.quality === 'B'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {record.quality}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1 text-gray-400" />
                              {record.teacher.name}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRecord(record)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Surah Grid */}
        {selectedStudent && activeTab === 'quick' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Pilih Surah untuk Setoran</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {surahs.map((surah) => (
                  <Button
                    key={surah.id}
                    variant="outline"
                    className={`p-4 h-auto flex-col items-center gap-2 relative transition-all duration-200 ${getSurahStatusColor(surah)}`}
                    onClick={() => openRecordingModal(surah)}
                  >
                    <div className="absolute top-2 right-2">
                      {getSurahStatusIcon(surah)}
                    </div>
                    <div className="text-2xl font-bold">{surah.number}</div>
                    <div className="text-xs text-center leading-tight">
                      <div className="font-semibold">{surah.name}</div>
                      <div className="text-xs opacity-75">{surah.nameArabic}</div>
                      <div className="text-xs opacity-75">{surah.totalAyat} ayat</div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs absolute bottom-1 left-1 right-1"
                    >
                      Juz {surah.juz}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Action Buttons */}
        {selectedStudent && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-3">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-full shadow-lg"
              onClick={() => {
                if (selectedStudent) {
                  setRecordType('SETORAN_BARU');
                  setShowRecordModal(true);
                }
              }}
            >
              <Book className="w-6 h-6 mr-2" />
              Setoran Baru
            </Button>
            <Button
              size="lg"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-4 rounded-full shadow-lg"
              onClick={() => {
                if (selectedStudent) {
                  setRecordType('MURAJA\'AH');
                  setShowRecordModal(true);
                }
              }}
            >
              <Clock className="w-6 h-6 mr-2" />
              Muraja'ah
            </Button>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-full shadow-lg"
              onClick={() => {
                if (selectedStudent) {
                  setRecordType('TES_HAFALAN');
                  setShowRecordModal(true);
                }
              }}
            >
              <Target className="w-6 h-6 mr-2" />
              Tes Hafalan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-red-600 border-red-600 hover:bg-red-50 px-4 py-4 rounded-full shadow-lg"
              onClick={() => setRecording(!recording)}
            >
              <Mic className={`w-6 h-6 ${recording ? 'animate-pulse text-red-600' : ''}`} />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!selectedStudent && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Pilih Santri untuk Memulai
              </h3>
              <p className="text-gray-500">
                Gunakan pencarian di atas untuk menemukan santri dan mulai pencatatan hafalan
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recording Modal */}
        <QuickRecordModal
          isOpen={showRecordModal}
          onClose={closeRecordModal}
          surah={selectedSurah}
          student={selectedStudent}
          type={recordType}
        />

        {/* Form Slide Over */}
        <SetoranFormSlideOver
          isOpen={showFormSlideOver}
          onClose={handleFormClose}
          editingRecord={editingRecord}
          students={students}
          surahs={surahs}
          selectedStudent={selectedStudent}
        />
      </div>
    </div>
  );
}