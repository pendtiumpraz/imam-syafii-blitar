import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, level, paymentStatus, format: exportFormat = 'xlsx' } = body

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (level) where.level = level
    if (paymentStatus) where.paymentStatus = paymentStatus

    // Get registrations
    const registrations = await prisma.registrations.findMany({
      where,
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { level: 'asc' },
        { ranking: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    if (registrations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data found to export'
      }, { status: 404 })
    }

    // Transform data for export
    const exportData = registrations.map((reg, index) => {
      const testScore = reg.testScore ? JSON.parse(reg.testScore) : {}
      const documents = JSON.parse(reg.documents || '[]')
      const latestPayment = reg.payments[0]

      return {
        'No': index + 1,
        'No. Pendaftaran': reg.registrationNo,
        'Nama Lengkap': reg.fullName,
        'Nama Panggilan': reg.nickname || '',
        'Jenis Kelamin': reg.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        'Tempat Lahir': reg.birthPlace,
        'Tanggal Lahir': format(new Date(reg.birthDate), 'dd/MM/yyyy'),
        'NIK': reg.nik || '',
        'NISN': reg.nisn || '',
        'Alamat': reg.address,
        'RT': reg.rt || '',
        'RW': reg.rw || '',
        'Desa/Kelurahan': reg.village,
        'Kecamatan': reg.district,
        'Kota/Kabupaten': reg.city,
        'Provinsi': reg.province,
        'Kode Pos': reg.postalCode || '',
        'Jenjang': reg.level,
        'Sekolah Sebelumnya': reg.previousSchool || '',
        'Kelas Tujuan': reg.gradeTarget || '',
        'Program': reg.programType || '',
        'Tipe Mondok': reg.boardingType || '',
        'Nama Ayah': reg.fatherName,
        'NIK Ayah': reg.fatherNik || '',
        'Pekerjaan Ayah': reg.fatherJob || '',
        'Telepon Ayah': reg.fatherPhone || '',
        'Pendidikan Ayah': reg.fatherEducation || '',
        'Penghasilan Ayah': reg.fatherIncome || '',
        'Nama Ibu': reg.motherName,
        'NIK Ibu': reg.motherNik || '',
        'Pekerjaan Ibu': reg.motherJob || '',
        'Telepon Ibu': reg.motherPhone || '',
        'Pendidikan Ibu': reg.motherEducation || '',
        'Penghasilan Ibu': reg.motherIncome || '',
        'Nama Wali': reg.guardianName || '',
        'Hubungan Wali': reg.guardianRelation || '',
        'Telepon Wali': reg.guardianPhone || '',
        'Alamat Wali': reg.guardianAddress || '',
        'No. Telepon': reg.phoneNumber,
        'WhatsApp': reg.whatsapp,
        'Email': reg.email || '',
        'Golongan Darah': reg.bloodType || '',
        'Tinggi Badan': reg.height ? `${reg.height} cm` : '',
        'Berat Badan': reg.weight ? `${reg.weight} kg` : '',
        'Kebutuhan Khusus': reg.specialNeeds || '',
        'Riwayat Penyakit': reg.medicalHistory || '',
        'Status': reg.status,
        'Status Pembayaran': reg.paymentStatus,
        'Jadwal Tes': reg.testSchedule ? format(new Date(reg.testSchedule), 'dd/MM/yyyy HH:mm') : '',
        'Tempat Tes': reg.testVenue || '',
        'Nilai Quran': testScore.quran || '',
        'Nilai Bahasa Arab': testScore.arabic || '',
        'Nilai Wawancara': testScore.interview || '',
        'Nilai Total': testScore.total || '',
        'Hasil Tes': reg.testResult || '',
        'Ranking': reg.ranking || '',
        'Biaya Pendaftaran': reg.registrationFee,
        'Metode Pembayaran': reg.paymentMethod || '',
        'Tanggal Bayar': reg.paymentDate ? format(new Date(reg.paymentDate), 'dd/MM/yyyy') : '',
        'Status Daftar Ulang': reg.reregStatus || '',
        'Tanggal Daftar Ulang': reg.reregDate ? format(new Date(reg.reregDate), 'dd/MM/yyyy') : '',
        'Catatan': reg.notes || '',
        'Diverifikasi Oleh': reg.verifiedBy || '',
        'Tanggal Verifikasi': reg.verifiedAt ? format(new Date(reg.verifiedAt), 'dd/MM/yyyy HH:mm') : '',
        'Alasan Penolakan': reg.rejectionReason || '',
        'Tanggal Daftar': format(new Date(reg.createdAt), 'dd/MM/yyyy HH:mm'),
        'Tanggal Update': format(new Date(reg.updatedAt), 'dd/MM/yyyy HH:mm'),
        'Dokumen Lengkap': documents.length > 0 ? 'Ya' : 'Tidak',
        'Jumlah Dokumen': documents.length,
        'Total Pembayaran': latestPayment ? latestPayment.amount : 0,
        'Status Pembayaran Terakhir': latestPayment?.status || 'N/A'
      }
    })

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 15 },  // No. Pendaftaran
      { wch: 25 },  // Nama Lengkap
      { wch: 15 },  // Nama Panggilan
      { wch: 12 },  // Jenis Kelamin
      { wch: 15 },  // Tempat Lahir
      { wch: 12 },  // Tanggal Lahir
      { wch: 18 },  // NIK
      { wch: 15 },  // NISN
      { wch: 30 },  // Alamat
      { wch: 5 },   // RT
      { wch: 5 },   // RW
      { wch: 20 },  // Desa
      { wch: 20 },  // Kecamatan
      { wch: 20 },  // Kota
      { wch: 15 },  // Provinsi
      { wch: 10 },  // Kode Pos
      { wch: 10 },  // Jenjang
      { wch: 25 },  // Sekolah Sebelumnya
      { wch: 12 },  // Kelas Tujuan
      { wch: 12 },  // Program
      { wch: 12 },  // Tipe Mondok
      { wch: 25 },  // Nama Ayah
      { wch: 18 },  // NIK Ayah
      { wch: 20 },  // Pekerjaan Ayah
      { wch: 15 },  // Telepon Ayah
      { wch: 15 },  // Pendidikan Ayah
      { wch: 15 },  // Penghasilan Ayah
      { wch: 25 },  // Nama Ibu
      { wch: 18 },  // NIK Ibu
      { wch: 20 },  // Pekerjaan Ibu
      { wch: 15 },  // Telepon Ibu
      { wch: 15 },  // Pendidikan Ibu
      { wch: 15 },  // Penghasilan Ibu
      { wch: 25 },  // Nama Wali
      { wch: 15 },  // Hubungan Wali
      { wch: 15 },  // Telepon Wali
      { wch: 30 },  // Alamat Wali
      { wch: 15 },  // No. Telepon
      { wch: 15 },  // WhatsApp
      { wch: 25 },  // Email
      { wch: 5 },   // Golongan Darah
      { wch: 12 },  // Tinggi Badan
      { wch: 12 },  // Berat Badan
      { wch: 20 },  // Kebutuhan Khusus
      { wch: 30 },  // Riwayat Penyakit
      { wch: 15 },  // Status
      { wch: 15 },  // Status Pembayaran
      { wch: 18 },  // Jadwal Tes
      { wch: 20 },  // Tempat Tes
      { wch: 10 },  // Nilai Quran
      { wch: 10 },  // Nilai Bahasa Arab
      { wch: 10 },  // Nilai Wawancara
      { wch: 10 },  // Nilai Total
      { wch: 10 },  // Hasil Tes
      { wch: 8 },   // Ranking
      { wch: 15 },  // Biaya Pendaftaran
      { wch: 15 },  // Metode Pembayaran
      { wch: 12 },  // Tanggal Bayar
      { wch: 15 },  // Status Daftar Ulang
      { wch: 18 },  // Tanggal Daftar Ulang
      { wch: 30 },  // Catatan
      { wch: 15 },  // Diverifikasi Oleh
      { wch: 18 },  // Tanggal Verifikasi
      { wch: 25 },  // Alasan Penolakan
      { wch: 18 },  // Tanggal Daftar
      { wch: 18 },  // Tanggal Update
      { wch: 12 },  // Dokumen Lengkap
      { wch: 12 },  // Jumlah Dokumen
      { wch: 15 },  // Total Pembayaran
      { wch: 20 }   // Status Pembayaran Terakhir
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    const sheetName = `PPDB_${level || 'ALL'}_${format(new Date(), 'yyyy-MM-dd')}`
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      compression: true 
    })

    // Create filename
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const filters = [
      status && `status-${status}`,
      level && `level-${level}`,
      paymentStatus && `payment-${paymentStatus}`
    ].filter(Boolean).join('_')
    
    const filename = `ppdb-registrations${filters ? `_${filters}` : ''}_${timestamp}.xlsx`

    // Log export action
    console.log('PPDB Export:', {
      adminId: session.user.id,
      filters: { status, level, paymentStatus },
      recordCount: registrations.length,
      timestamp: new Date()
    })

    // Return file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method for export statistics/info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get export statistics
    const stats = await getExportStats()

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Export stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get export statistics
async function getExportStats() {
  const [
    totalRegistrations,
    byStatus,
    byLevel,
    byPaymentStatus,
    recentRegistrations
  ] = await Promise.all([
    // Total registrations
    prisma.registrations.count(),
    
    // By status
    prisma.registrations.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    
    // By level
    prisma.registrations.groupBy({
      by: ['level'],
      _count: { level: true }
    }),
    
    // By payment status
    prisma.registrations.groupBy({
      by: ['paymentStatus'],
      _count: { paymentStatus: true }
    }),
    
    // Recent registrations (last 7 days)
    prisma.registrations.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  return {
    totalRegistrations,
    recentRegistrations,
    statusBreakdown: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>),
    levelBreakdown: byLevel.reduce((acc, item) => {
      acc[item.level] = item._count.level
      return acc
    }, {} as Record<string, number>),
    paymentBreakdown: byPaymentStatus.reduce((acc, item) => {
      acc[item.paymentStatus] = item._count.paymentStatus
      return acc
    }, {} as Record<string, number>)
  }
}