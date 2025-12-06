'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  UserCheck,
  Calendar,
  Search,
  Filter,
  Save,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
} from 'lucide-react';
import BulkOperationsModal from '@/components/bulk-operations/bulk-operations-modal';
import { ValidationRules } from '@/lib/bulk-operations';

interface Student {
  id: string;
  nis: string;
  fullName: string;
  photo?: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  level: string;
  _count: {
    studentClasses: number;
  };
}

interface Semester {
  id: string;
  name: string;
  isActive: boolean;
  academicYear: {
    name: string;
  };
}

interface Attendance {
  id?: string;
  studentId: string;
  status: string;
  timeIn?: string;
  notes?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  timeIn?: string;
  notes?: string;
  student: Student;
}

const ATTENDANCE_STATUS = {
  HADIR: { label: 'Hadir', color: 'bg-green-500', textColor: 'text-green-700' },
  TERLAMBAT: { label: 'Terlambat', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  IZIN: { label: 'Izin', color: 'bg-blue-500', textColor: 'text-blue-700' },
  SAKIT: { label: 'Sakit', color: 'bg-orange-500', textColor: 'text-orange-700' },
  ALPHA: { label: 'Alpha', color: 'bg-red-500', textColor: 'text-red-700' },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, Attendance>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templateColumns, setTemplateColumns] = useState<any[]>([]);

  useEffect(() => {
    fetchSemesters();
    fetchClasses();
    fetchTemplateInfo();
  }, []);

  const fetchTemplateInfo = async () => {
    try {
      const response = await fetch('/api/import/attendance');
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
      const response = await fetch('/api/import/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importedData })
      });

      const result = await response.json();

      if (result.success && result.validRows > 0) {
        toast.success(`${result.validRows} data absensi telah ditambahkan/diupdate.`);
        if (selectedClass && selectedSemester) {
          fetchStudents();
          fetchAttendance();
        }
      } else if (result.errors?.length > 0) {
        toast.error(result.errors.slice(0, 3).join(', '));
      }
    } catch (error) {
      console.error('Error importing attendance:', error);
      toast.error('Gagal mengimpor data absensi');
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSemester) {
      fetchStudents();
      fetchAttendance();
    }
  }, [selectedClass, selectedSemester, selectedDate]);

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/academic/semesters');
      if (response.ok) {
        const data = await response.json();
        setSemesters(data);
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API to get students in class
      const mockStudents: Student[] = [
        { id: '1', nis: '001', fullName: 'Ahmad Fauzi' },
        { id: '2', nis: '002', fullName: 'Siti Aisyah' },
        { id: '3', nis: '003', fullName: 'Muhammad Rizki' },
        { id: '4', nis: '004', fullName: 'Fatimah Zahra' },
        { id: '5', nis: '005', fullName: 'Abdul Rahman' },
      ];
      setStudents(mockStudents);

      // Initialize attendance data
      const initialAttendance: Record<string, Attendance> = {};
      mockStudents.forEach(student => {
        initialAttendance[student.id] = {
          studentId: student.id,
          status: 'HADIR',
          timeIn: '',
          notes: '',
        };
      });
      setAttendanceData(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams({
        classId: selectedClass,
        semesterId: selectedSemester,
        date: selectedDate,
      });

      const response = await fetch(`/api/academic/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (showHistory) {
          setAttendanceRecords(data);
        } else {
          // Update attendance data with existing records
          const updatedAttendance: Record<string, Attendance> = { ...attendanceData };
          data.forEach((record: any) => {
            updatedAttendance[record.studentId] = {
              studentId: record.studentId,
              status: record.status,
              timeIn: record.timeIn ? new Date(record.timeIn).toTimeString().slice(0, 5) : '',
              notes: record.notes || '',
            };
          });
          setAttendanceData(updatedAttendance);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAttendanceChange = (studentId: string, field: keyof Attendance, value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedSemester) {
      toast.error('Pilih kelas dan semester terlebih dahulu');
      return;
    }

    try {
      setSaving(true);

      const attendanceList = Object.values(attendanceData).map(attendance => ({
        studentId: attendance.studentId,
        status: attendance.status,
        timeIn: attendance.timeIn ? `${selectedDate}T${attendance.timeIn}:00` : undefined,
        notes: attendance.notes,
      }));

      const response = await fetch('/api/academic/attendance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass,
          semesterId: selectedSemester,
          date: selectedDate,
          attendances: attendanceList,
        }),
      });

      if (response.ok) {
        toast.info("Berhasil: Absensi berhasil disimpan");
        fetchAttendance();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status: string) => {
    const updatedAttendance: Record<string, Attendance> = {};
    students.forEach(student => {
      updatedAttendance[student.id] = {
        ...attendanceData[student.id],
        status,
        timeIn: status === 'HADIR' ? new Date().toTimeString().slice(0, 5) : '',
      };
    });
    setAttendanceData(updatedAttendance);
  };

  const getAttendanceStats = () => {
    const stats = {
      hadir: 0,
      terlambat: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
    };

    Object.values(attendanceData).forEach(attendance => {
      switch (attendance.status) {
        case 'HADIR':
          stats.hadir++;
          break;
        case 'TERLAMBAT':
          stats.terlambat++;
          break;
        case 'IZIN':
          stats.izin++;
          break;
        case 'SAKIT':
          stats.sakit++;
          break;
        case 'ALPHA':
          stats.alpha++;
          break;
      }
    });

    return stats;
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm)
  );

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSemesterData = semesters.find(s => s.id === selectedSemester);
  const stats = getAttendanceStats();

  if (!selectedClass || !selectedSemester) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Absensi Harian</h1>
          <p className="text-gray-600 mt-2">Kelola kehadiran siswa</p>
        </div>

        <Card className="p-8 text-center">
          <UserCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Kelas untuk Absensi</h3>
          <p className="text-gray-600 mb-6">
            Pilih kelas dan semester untuk memulai input absensi
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
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
                    {cls.name} ({cls.level}) - {cls._count.studentClasses} siswa
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Absensi Harian</h1>
          <p className="text-gray-600 mt-2">
            {selectedClassData?.name} ({selectedClassData?.level})
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
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <FileText className="w-4 h-4 mr-2" />
            {showHistory ? 'Input Absensi' : 'Riwayat Absensi'}
          </Button>
          <Button onClick={() => {
            setSelectedClass('');
            setSelectedSemester('');
          }}>
            Ganti Kelas
          </Button>
        </div>
      </div>

      {/* Date and Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Cari siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {!showHistory && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('HADIR')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Hadir Semua
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAttendance}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(stats).map(([key, count]) => {
          const status = ATTENDANCE_STATUS[key.toUpperCase() as keyof typeof ATTENDANCE_STATUS];
          return (
            <Card key={key} className="p-4 text-center">
              <div className={`w-8 h-8 ${status.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">{count}</span>
              </div>
              <p className={`font-medium ${status.textColor}`}>{status.label}</p>
              <p className="text-xs text-gray-500">
                {students.length > 0 ? Math.round((count / students.length) * 100) : 0}%
              </p>
            </Card>
          );
        })}
      </div>

      {/* Attendance List */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">
            {showHistory ? 'Riwayat Absensi' : 'Input Absensi'}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(selectedDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">NIS</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Nama Siswa</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-900">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-900">Waktu Masuk</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada data siswa
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const attendance = attendanceData[student.id] || {
                      studentId: student.id,
                      status: 'HADIR',
                      timeIn: '',
                      notes: '',
                    };

                    return (
                      <tr key={student.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">{index + 1}</td>
                        <td className="px-4 py-3 font-mono text-sm">{student.nis}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {student.fullName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{student.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {showHistory ? (
                            <Badge className={`${ATTENDANCE_STATUS[attendance.status as keyof typeof ATTENDANCE_STATUS]?.color} text-white`}>
                              {ATTENDANCE_STATUS[attendance.status as keyof typeof ATTENDANCE_STATUS]?.label}
                            </Badge>
                          ) : (
                            <select
                              value={attendance.status}
                              onChange={(e) => handleAttendanceChange(student.id, 'status', e.target.value)}
                              className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
                                <option key={key} value={key}>
                                  {value.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {showHistory ? (
                            <span className="text-sm font-mono">
                              {attendance.timeIn ? new Date(attendance.timeIn).toTimeString().slice(0, 5) : '-'}
                            </span>
                          ) : (
                            <Input
                              type="time"
                              value={attendance.timeIn || ''}
                              onChange={(e) => handleAttendanceChange(student.id, 'timeIn', e.target.value)}
                              className="w-24 h-8 text-center text-xs"
                              disabled={attendance.status === 'ALPHA'}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {showHistory ? (
                            <span className="text-sm text-gray-600">{attendance.notes || '-'}</span>
                          ) : (
                            <Input
                              value={attendance.notes || ''}
                              onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)}
                              placeholder="Keterangan..."
                              className="text-sm"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Data Absensi"
        exportData={attendanceRecords.map(a => ({
          studentNis: a.student.nis,
          studentName: a.student.fullName,
          date: a.date,
          status: a.status,
          timeIn: a.timeIn,
          notes: a.notes,
        }))}
        exportColumns={[
          { key: 'studentNis', header: 'NIS' },
          { key: 'studentName', header: 'Nama Siswa' },
          { key: 'date', header: 'Tanggal' },
          { key: 'status', header: 'Status' },
          { key: 'timeIn', header: 'Jam Masuk' },
          { key: 'notes', header: 'Keterangan' },
        ]}
        templateColumns={templateColumns}
        importValidationRules={[
          ValidationRules.required('studentNis'),
          ValidationRules.required('date'),
          ValidationRules.required('status'),
        ]}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}