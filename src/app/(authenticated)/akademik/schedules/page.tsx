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
  Filter,
  Edit,
  Trash2,
  Clock,
  User,
  MapPin,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  period?: number;
  notes?: string;
  isActive: boolean;
  class: {
    id: string;
    name: string;
    grade: string;
    level: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
    nameArabic?: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
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

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface ScheduleFormData {
  classId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  period: number;
  notes: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'SENIN', label: 'Senin' },
  { value: 'SELASA', label: 'Selasa' },
  { value: 'RABU', label: 'Rabu' },
  { value: 'KAMIS', label: 'Kamis' },
  { value: 'JUMAT', label: 'Jumat' },
  { value: 'SABTU', label: 'Sabtu' },
];

const TIME_PERIODS = [
  { period: 1, time: '07:00 - 07:45' },
  { period: 2, time: '07:45 - 08:30' },
  { period: 3, time: '08:30 - 09:15' },
  { period: 4, time: '09:30 - 10:15' },
  { period: 5, time: '10:15 - 11:00' },
  { period: 6, time: '11:00 - 11:45' },
  { period: 7, time: '13:00 - 13:45' },
  { period: 8, time: '13:45 - 14:30' },
  { period: 9, time: '14:30 - 15:15' },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const [formData, setFormData] = useState<ScheduleFormData>({
    classId: '',
    subjectId: '',
    teacherId: '',
    day: '',
    startTime: '',
    endTime: '',
    room: '',
    period: 1,
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchSchedules();
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedClass, selectedDay, selectedTeacher]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedDay) params.append('day', selectedDay);
      if (selectedTeacher) params.append('teacherId', selectedTeacher);

      const response = await fetch(`/api/academic/schedules?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || data || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error("Error: Gagal memuat data jadwal");
    } finally {
      setLoading(false);
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

  const fetchTeachers = async () => {
    try {
      // Fetch users with USTADZ role (teachers are stored in User model)
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
      const url = editingSchedule 
        ? '/api/academic/schedules' 
        : '/api/academic/schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';
      const payload = editingSchedule 
        ? { id: editingSchedule.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Jadwal berhasil ${editingSchedule ? 'diperbarui' : 'ditambahkan'}`);
        
        fetchSchedules();
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
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/academic/schedules?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.info("Berhasil: Jadwal berhasil dihapus");
        fetchSchedules();
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
      classId: '',
      subjectId: '',
      teacherId: '',
      day: '',
      startTime: '',
      endTime: '',
      room: '',
      period: 1,
      notes: '',
      isActive: true,
    });
    setEditingSchedule(null);
    setShowForm(false);
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      classId: schedule.class.id,
      subjectId: schedule.subject.id,
      teacherId: schedule.teacher.id,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room || '',
      period: schedule.period || 1,
      notes: schedule.notes || '',
      isActive: schedule.isActive,
    });
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const checkConflicts = (newSchedule: ScheduleFormData) => {
    return schedules.filter(schedule => 
      schedule.day === newSchedule.day &&
      schedule.startTime === newSchedule.startTime &&
      (schedule.class.id === newSchedule.classId || 
       schedule.teacher.id === newSchedule.teacherId) &&
      (!editingSchedule || schedule.id !== editingSchedule.id)
    );
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.class.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const groupedSchedules = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.value] = filteredSchedules
      .filter(schedule => schedule.day === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jadwal Pelajaran</h1>
          <p className="text-gray-600 mt-2">Kelola jadwal mata pelajaran dan guru</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari jadwal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.level})
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Hari</option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>

          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Guru</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>

          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter Lainnya</span>
          </Button>
        </div>
      </Card>

      {/* Schedule Display */}
      {viewMode === 'grid' ? (
        // Grid View (Timetable)
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <Card key={day.value} className="p-4">
              <h3 className="font-semibold text-center mb-4 text-lg">
                {day.label}
              </h3>
              
              <div className="space-y-2">
                {groupedSchedules[day.value]?.length > 0 ? (
                  groupedSchedules[day.value].map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-900">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(schedule.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {schedule.subject.name}
                        </p>
                        <p className="text-gray-600">
                          {schedule.class.name}
                        </p>
                        <p className="text-gray-600">
                          {schedule.teacher.name}
                        </p>
                        {schedule.room && (
                          <p className="text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {schedule.room}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    Tidak ada jadwal
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card className="overflow-x-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg">Daftar Jadwal</h3>
            <p className="text-sm text-gray-600">
              {filteredSchedules.length} jadwal
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Hari</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Waktu</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Mata Pelajaran</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Kelas</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Guru</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Ruang</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-300 rounded mb-2 mx-auto w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded mx-auto w-1/3"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p>Belum ada jadwal</p>
                      <p className="text-sm">Klik "Tambah Jadwal" untuk membuat jadwal baru</p>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {DAYS_OF_WEEK.find(d => d.value === schedule.day)?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {schedule.startTime} - {schedule.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{schedule.subject.name}</p>
                          <p className="text-xs text-gray-500">{schedule.subject.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{schedule.class.name}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{schedule.teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {schedule.room ? (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{schedule.room}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(schedule.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kelas *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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
                  <label className="block text-sm font-medium mb-1">Mata Pelajaran *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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

              <div>
                <label className="block text-sm font-medium mb-1">Guru *</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hari *</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Hari</option>
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Jam Mulai *</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Jam Selesai *</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ruangan</label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="contoh: A1, Lab IPA, Masjid"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Jam ke-</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_PERIODS.map((period) => (
                      <option key={period.period} value={period.period}>
                        {period.period} ({period.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-sm">Jadwal aktif</label>
              </div>

              {/* Conflict Warning */}
              {formData.classId && formData.teacherId && formData.day && formData.startTime && (
                (() => {
                  const conflicts = checkConflicts(formData);
                  return conflicts.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Konflik Jadwal Terdeteksi</span>
                      </div>
                      {conflicts.map((conflict) => (
                        <p key={conflict.id} className="text-xs text-yellow-700">
                          • {conflict.class.name} - {conflict.subject.name} ({conflict.teacher.name})
                        </p>
                      ))}
                    </div>
                  );
                })()
              )}

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingSchedule ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}