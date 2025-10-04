'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Printer,
  Users,
  Calendar,
  BarChart3,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ReportCard {
  id: string;
  totalScore?: number;
  rank?: number;
  totalSubjects: number;
  totalDays: number;
  presentDays: number;
  sickDays: number;
  permittedDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage?: number;
  behavior?: string;
  personality: string;
  extracurricular: string;
  achievements: string;
  notes?: string;
  recommendations?: string;
  parentNotes?: string;
  status: string;
  generatedAt?: string;
  pdfUrl?: string;
  student: {
    id: string;
    nis: string;
    fullName: string;
    photo?: string;
    birthDate: string;
    birthPlace: string;
  };
  semester: {
    id: string;
    name: string;
    academicYear: {
      name: string;
    };
  };
  class: {
    id: string;
    name: string;
    grade: string;
    level: string;
    teacher?: {
      name: string;
    };
  };
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

const REPORT_STATUS = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  FINAL: { label: 'Final', color: 'bg-blue-500', icon: CheckCircle },
  SIGNED: { label: 'Ditandatangani', color: 'bg-green-500', icon: Award },
  DISTRIBUTED: { label: 'Didistribusikan', color: 'bg-emerald-500', icon: FileText },
};

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  useEffect(() => {
    fetchSemesters();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchReportCards();
  }, [selectedClass, selectedSemester, selectedStatus]);

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

  const fetchReportCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSemester) params.append('semesterId', selectedSemester);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/academic/report-cards?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportCards(data);
      }
    } catch (error) {
      console.error('Error fetching report cards:', error);
      toast.error("Error: Gagal memuat data raport");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportCard = async (studentId: string, classId: string) => {
    if (!selectedSemester) {
      toast.error("Error: Pilih semester terlebih dahulu");
      return;
    }

    try {
      setGenerating(studentId);

      const response = await fetch('/api/academic/report-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          semesterId: selectedSemester,
          classId,
        }),
      });

      if (response.ok) {
        toast.info("Berhasil: Raport berhasil dibuat");
        fetchReportCards();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast.error("Error");
    } finally {
      setGenerating(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedClass || !selectedSemester) {
      toast.error("Error: Pilih kelas dan semester terlebih dahulu");
      return;
    }

    if (!confirm('Generate raport untuk semua siswa di kelas ini?')) {
      return;
    }

    try {
      setLoading(true);
      // This would generate report cards for all students in the class
      toast.info("Info: Fitur generate massal akan segera tersedia");
    } catch (error) {
      console.error('Error bulk generating:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReportCard = (reportCard: ReportCard) => {
    if (reportCard.pdfUrl) {
      window.open(reportCard.pdfUrl, '_blank');
    } else {
      // Generate PDF on-the-fly
      toast.info("Info: Sedang memproses PDF raport...");
    }
  };

  const handleBulkPrint = () => {
    if (selectedReports.length === 0) {
      toast.error("Error: Pilih raport yang ingin dicetak");
      return;
    }

    toast.info("Info: Fitur cetak massal akan segera tersedia");
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const filteredReportCards = reportCards.filter(reportCard => {
    const matchesSearch = reportCard.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reportCard.student.nis.includes(searchTerm);
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    return REPORT_STATUS[status as keyof typeof REPORT_STATUS]?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    return REPORT_STATUS[status as keyof typeof REPORT_STATUS]?.icon || Clock;
  };

  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSemesterData = semesters.find(s => s.id === selectedSemester);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raport Siswa</h1>
          <p className="text-gray-600 mt-2">Generate dan kelola raport siswa</p>
        </div>
        <div className="flex space-x-2">
          {selectedReports.length > 0 && (
            <Button variant="outline" onClick={handleBulkPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Cetak Terpilih ({selectedReports.length})
            </Button>
          )}
          <Button onClick={handleBulkGenerate}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Massal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Semester</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name} - {semester.academicYear.name}
              </option>
            ))}
          </select>

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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            {Object.entries(REPORT_STATUS).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Aksi Massal</span>
          </Button>
        </div>
      </Card>

      {/* Summary Stats */}
      {selectedClassData && selectedSemesterData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredReportCards.length}</p>
                <p className="text-sm text-gray-600">Total Raport</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredReportCards.filter(r => r.status === 'FINAL' || r.status === 'SIGNED').length}
                </p>
                <p className="text-sm text-gray-600">Selesai</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredReportCards.filter(r => r.status === 'DRAFT').length}
                </p>
                <p className="text-sm text-gray-600">Draft</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredReportCards.length > 0 
                    ? Math.round(filteredReportCards.reduce((sum, r) => sum + (r.totalScore || 0), 0) / filteredReportCards.length)
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Rata-rata Nilai</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Report Cards List */}
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
        ) : filteredReportCards.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Raport</h3>
              <p className="text-gray-600 mb-4">
                Belum ada raport yang dibuat untuk filter yang dipilih
              </p>
              <Button onClick={handleBulkGenerate}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Raport
              </Button>
            </Card>
          </div>
        ) : (
          filteredReportCards.map((reportCard) => {
            const StatusIcon = getStatusIcon(reportCard.status);
            
            return (
              <Card key={reportCard.id} className="p-4">
                {showBulkActions && (
                  <div className="mb-3">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(reportCard.id)}
                      onChange={() => toggleReportSelection(reportCard.id)}
                      className="rounded"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {reportCard.student.fullName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{reportCard.student.fullName}</h3>
                      <p className="text-sm text-gray-600">{reportCard.student.nis}</p>
                    </div>
                  </div>
                  
                  <Badge className={`${getStatusColor(reportCard.status)} text-white`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {REPORT_STATUS[reportCard.status as keyof typeof REPORT_STATUS]?.label}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kelas:</span>
                    <span className="font-medium">{reportCard.class.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Semester:</span>
                    <span className="font-medium">{reportCard.semester.name}</span>
                  </div>
                  
                  {reportCard.totalScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nilai Rata-rata:</span>
                      <span className="font-bold text-blue-600">{reportCard.totalScore.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {reportCard.rank && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peringkat:</span>
                      <span className="font-bold text-green-600">#{reportCard.rank}</span>
                    </div>
                  )}
                  
                  {reportCard.attendancePercentage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kehadiran:</span>
                      <span className="font-medium">{reportCard.attendancePercentage.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintReportCard(reportCard)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Lihat</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handlePrintReportCard(reportCard)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </Button>
                </div>

                {reportCard.generatedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Dibuat: {new Date(reportCard.generatedAt).toLocaleDateString('id-ID')}
                  </p>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}