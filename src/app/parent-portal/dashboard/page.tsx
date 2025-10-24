'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  Bell, 
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  BookOpen,
  Award,
  Target
} from 'lucide-react';
import ChildCard from '@/components/parent-portal/child-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ChildData {
  id: string;
  nis: string;
  fullName: string;
  nickname?: string;
  photo?: string;
  institutionType: string;
  grade?: string;
  relationship: string;
  isPrimary: boolean;
  currentClass?: {
    name: string;
    level: string;
    program?: string;
    teacher?: {
      name: string;
    };
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
    absentDays: number;
    sickDays: number;
    permittedDays: number;
    lateDays: number;
  };
  grades: {
    totalSubjects: number;
    average: number;
    subjects: any[];
  };
  payments: {
    pendingAmount: number;
    pendingCount: number;
    totalAmount: number;
    paidAmount: number;
  };
  hafalan?: {
    totalSurah: number;
    totalAyat: number;
    currentSurah?: {
      number: number;
      name: string;
      progress: number;
    };
    recentSessions: any[];
    level: string;
    badge: string[];
  };
}

interface DashboardData {
  overview: {
    totalChildren: number;
    overallAttendance: number;
    overallGradeAverage: number;
    totalPendingPayments: number;
    unreadMessagesCount: number;
    unreadNotificationsCount: number;
  };
  currentSemester: {
    id: string;
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  };
  children: ChildData[];
  recentAnnouncements: any[];
  quickStats: {
    attendanceAlerts: number;
    gradeAlerts: number;
    paymentAlerts: number;
  };
}

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/parent/dashboard');
        
        if (!response.ok) {
          throw new Error('Gagal memuat data dashboard');
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'PARENT') {
      fetchDashboardData();
    }
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gagal Memuat Dashboard</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { overview, currentSemester, children, recentAnnouncements, quickStats } = dashboardData;
  
  // Filter data based on selected child
  const selectedChild = selectedChildId === 'all' ? null : children.find(c => c.id === selectedChildId);
  const displayChildren = selectedChildId === 'all' ? children : selectedChild ? [selectedChild] : children;
  
  // Calculate filtered stats for selected child or overall
  const filteredStats = selectedChild ? {
    attendance: selectedChild.attendance.percentage,
    gradeAverage: selectedChild.grades.average,
    pendingPayments: selectedChild.payments.pendingAmount,
    hafalan_progress: selectedChild.hafalan?.totalSurah || 0
  } : {
    attendance: overview.overallAttendance,
    gradeAverage: overview.overallGradeAverage,
    pendingPayments: overview.totalPendingPayments,
    hafalan_progress: children.reduce((sum, child) => sum + (child.hafalan?.totalSurah || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold mb-2">
              Selamat datang, {session?.user?.name}
            </h1>
            <p className="text-green-100">
              Portal Orang Tua - Pondok Imam Syafi'i
            </p>
            {currentSemester && (
              <div className="mt-4 bg-white/20 rounded-lg p-3 inline-block">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{currentSemester.name} - {currentSemester.academicYear}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Child Selection and View Mode */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <label className="text-sm text-green-100 block mb-2">Tampilkan Data:</label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger className="w-48 bg-white text-gray-900">
                  <SelectValue placeholder="Pilih anak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Anak</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.nickname || child.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <label className="text-sm text-green-100 block mb-2">Mode Tampilan:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'overview'
                      ? 'bg-white text-green-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Ringkasan
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-white text-green-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Children (only show when viewing all) */}
        {selectedChildId === 'all' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Jumlah Anak</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalChildren}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar className={`w-8 h-8 mr-4 ${filteredStats.attendance >= 80 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-600">Kehadiran</p>
                  <p className={`text-2xl font-bold ${filteredStats.attendance >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                    {filteredStats.attendance}%
                  </p>
                </div>
              </div>
              <TrendingUp className={`w-5 h-5 ${filteredStats.attendance >= 80 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <Progress value={filteredStats.attendance} className="h-2" />
          </CardContent>
        </Card>

        {/* Academic Performance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <GraduationCap className={`w-8 h-8 mr-4 ${filteredStats.gradeAverage >= 75 ? 'text-green-600' : 'text-yellow-600'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-600">Nilai Rata-rata</p>
                  <p className={`text-2xl font-bold ${filteredStats.gradeAverage >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {filteredStats.gradeAverage.toFixed(1)}
                  </p>
                </div>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <Progress value={(filteredStats.gradeAverage / 100) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Hafalan Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 mr-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Hafalan</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredStats.hafalanProgress} Surah
                  </p>
                </div>
              </div>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              {selectedChild?.hafalan?.level && (
                <Badge variant="outline" className="text-xs">
                  {selectedChild.hafalan.level}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CreditCard className={`w-8 h-8 mr-4 ${filteredStats.pendingPayments > 0 ? 'text-red-600' : 'text-green-600'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-600">Tagihan</p>
                  <p className={`text-xl font-bold ${filteredStats.pendingPayments > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {filteredStats.pendingPayments > 0 
                      ? `Rp ${filteredStats.pendingPayments.toLocaleString('id-ID')}` 
                      : 'Lunas'
                    }
                  </p>
                </div>
              </div>
              {filteredStats.pendingPayments > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(quickStats.attendanceAlerts > 0 || quickStats.gradeAlerts > 0 || quickStats.paymentAlerts > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-red-800">Perhatian Diperlukan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickStats.attendanceAlerts > 0 && (
              <div className="flex items-center text-red-700">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {quickStats.attendanceAlerts} anak dengan kehadiran &lt; 80%
                </span>
              </div>
            )}
            {quickStats.gradeAlerts > 0 && (
              <div className="flex items-center text-red-700">
                <GraduationCap className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {quickStats.gradeAlerts} anak dengan nilai &lt; 70
                </span>
              </div>
            )}
            {quickStats.paymentAlerts > 0 && (
              <div className="flex items-center text-red-700">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {quickStats.paymentAlerts} anak dengan tagihan pending
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Charts Section */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Academic Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Tren Akademik
              </CardTitle>
              <CardDescription>
                Perkembangan nilai dan kehadiran dalam 6 bulan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple visualization - in a real app, you'd use a chart library */}
              <div className="space-y-4">
                {displayChildren.map((child) => (
                  <div key={child.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{child.nickname || child.fullName}</span>
                      <Badge variant={child.grades.average >= 75 ? 'default' : 'secondary'}>
                        {child.grades.average.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span>Kehadiran: </span>
                        <span className={child.attendance.percentage >= 80 ? 'text-green-600' : 'text-red-600'}>
                          {child.attendance.percentage}%
                        </span>
                      </div>
                      <div>
                        <span>Mata Pelajaran: </span>
                        <span>{child.grades.totalSubjects}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hafalan Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Progress Hafalan
              </CardTitle>
              <CardDescription>
                Perkembangan hafalan Al-Qur'an
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayChildren.map((child) => (
                  <div key={child.id} className="border-l-4 border-purple-500 pl-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{child.nickname || child.fullName}</span>
                      <Badge variant="outline">
                        {child.hafalan?.level || 'Belum Ada Data'}
                      </Badge>
                    </div>
                    {child.hafalan ? (
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Surah Selesai: {child.hafalan.totalSurah}</span>
                          <span>Total Ayat: {child.hafalan.totalAyat}</span>
                        </div>
                        {child.hafalan.currentSurah && (
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Sedang Menghafal: {child.hafalan.currentSurah.name}</span>
                              <span>{child.hafalan.currentSurah.progress}%</span>
                            </div>
                            <Progress value={child.hafalan.currentSurah.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Belum ada data hafalan</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {selectedChildId === 'all' ? 'Ringkasan Semua Anak' : `Detail ${selectedChild?.nickname || selectedChild?.fullName}`}
                </CardTitle>
                <Link
                  href="/parent-portal/children"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Lihat Semua
                </Link>
              </div>
              <CardDescription>
                {selectedChildId === 'all' 
                  ? `Informasi terkini dari ${children.length} anak` 
                  : 'Informasi detail dan perkembangan terkini'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada data anak</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedChildId === 'all' ? (
                    // Show all children in overview mode
                    children.slice(0, viewMode === 'detailed' ? children.length : 2).map((child) => (
                      <ChildCard key={child.id} child={child} showDetails={viewMode === 'detailed'} />
                    ))
                  ) : (
                    // Show detailed view for selected child
                    selectedChild && (
                      <ChildCard 
                        key={selectedChild.id} 
                        child={selectedChild} 
                        showDetails={true} 
                      />
                    )
                  )}
                  {selectedChildId === 'all' && viewMode === 'overview' && children.length > 2 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setViewMode('detailed')}
                        className="text-green-600 hover:text-green-700 font-medium mr-4"
                      >
                        Tampilkan Detail
                      </button>
                      <Link
                        href="/parent-portal/children"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Lihat {children.length - 2} anak lainnya
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activities Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription>
                {selectedChildId === 'all' ? 'Semua aktivitas anak' : `Aktivitas ${selectedChild?.nickname || selectedChild?.fullName}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayChildren.slice(0, 5).map((child, index) => (
                  <div key={`activity-${child.id}-${index}`} className="flex space-x-3 p-3 border-l-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Nilai baru untuk {child.grades.subjects[0]?.name || 'Mata Pelajaran'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {child.nickname || child.fullName} • 2 jam yang lalu
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {child.grades.average.toFixed(1)}
                    </Badge>
                  </div>
                ))}
                
                {/* View More Link */}
                <div className="text-center pt-2">
                  <Link
                    href={`/parent-portal/activities${selectedChildId !== 'all' ? `?child=${selectedChildId}` : ''}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Lihat Semua Aktivitas →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Jadwal & Event
              </CardTitle>
              <CardDescription>Kegiatan dan deadline mendatang</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <Clock className="w-4 h-4 text-yellow-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Ujian Tengah Semester</p>
                    <p className="text-xs text-gray-600">15 Maret 2024 • Semua mata pelajaran</p>
                  </div>
                  <Badge variant="secondary">3 hari lagi</Badge>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <BookOpen className="w-4 h-4 text-blue-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Tes Hafalan Bulanan</p>
                    <p className="text-xs text-gray-600">20 Maret 2024 • Juz 30</p>
                  </div>
                  <Badge variant="outline">1 minggu lagi</Badge>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 border-l-4 border-green-400 rounded">
                  <Users className="w-4 h-4 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Pertemuan Wali Murid</p>
                    <p className="text-xs text-gray-600">25 Maret 2024 • Ruang Serbaguna</p>
                  </div>
                  <Badge variant="outline">2 minggu lagi</Badge>
                </div>
                
                <div className="text-center pt-2">
                  <Link
                    href="/parent-portal/events"
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Lihat Kalender Lengkap →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Tindakan yang sering digunakan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href="/parent-portal/payments"
                  className="flex items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <CreditCard className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <div className="font-medium text-red-800">Bayar Tagihan</div>
                    <div className="text-sm text-red-600">
                      Rp {overview.totalPendingPayments.toLocaleString('id-ID')} pending
                    </div>
                  </div>
                </Link>

                <Link
                  href="/parent-portal/messages/new"
                  className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-blue-800">Kirim Pesan</div>
                    <div className="text-sm text-blue-600">Hubungi guru/admin</div>
                  </div>
                </Link>

                <Link
                  href="/parent-portal/announcements"
                  className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-green-800">Lihat Pengumuman</div>
                    <div className="text-sm text-green-600">Info terbaru sekolah</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Pengumuman Terbaru</CardTitle>
                <Link
                  href="/parent-portal/announcements"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Lihat Semua
                </Link>
              </div>
              <CardDescription>Informasi penting dari sekolah</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAnnouncements.length === 0 ? (
                <div className="text-center py-4">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Belum ada pengumuman</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAnnouncements.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {announcement.title}
                      </h4>
                      {announcement.summary && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {announcement.summary}
                        </p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-white mr-2 ${
                          announcement.priority === 'URGENT' ? 'bg-red-500' :
                          announcement.priority === 'HIGH' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}>
                          {announcement.priority}
                        </span>
                        <span>{new Date(announcement.publishDate).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications Summary */}
          {(overview.unreadMessagesCount > 0 || overview.unreadNotificationsCount > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Pemberitahuan
                </CardTitle>
                <CardDescription>Pesan dan notifikasi yang belum dibaca</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview.unreadMessagesCount > 0 && (
                    <Link
                      href="/parent-portal/messages"
                      className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <MessageSquare className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="font-medium text-blue-800">Pesan Baru</span>
                      </div>
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                        {overview.unreadMessagesCount}
                      </span>
                    </Link>
                  )}

                  {overview.unreadNotificationsCount > 0 && (
                    <Link
                      href="/parent-portal/notifications"
                      className="flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <Bell className="w-5 h-5 text-yellow-600 mr-3" />
                        <span className="font-medium text-yellow-800">Notifikasi</span>
                      </div>
                      <span className="bg-yellow-600 text-white text-xs rounded-full px-2 py-1">
                        {overview.unreadNotificationsCount}
                      </span>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}