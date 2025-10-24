import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const billTypeId = searchParams.get('billTypeId');
    const status = searchParams.get('status');
    const period = searchParams.get('period');
    const institutionType = searchParams.get('institutionType');
    const isOverdue = searchParams.get('isOverdue');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('reportType') || 'bills';

    // Build where clause
    const where: any = {};
    
    if (billTypeId && billTypeId !== 'all') {
      where.billTypeId = billTypeId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (period && period !== 'all') {
      where.period = period;
    }
    
    if (isOverdue && isOverdue !== 'all') {
      where.isOverdue = isOverdue === 'true';
    }

    if (startDate) {
      where.dueDate = {
        ...where.dueDate,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      where.dueDate = {
        ...where.dueDate,
        lte: new Date(endDate)
      };
    }

    // Add student filter if institutionType is specified
    if (institutionType && institutionType !== 'all') {
      where.student = {
        institutionType: institutionType
      };
    }

    if (reportType === 'payments') {
      // Export payment history
      const payments = await prisma.bill_payments.findMany({
        where: {
          bill: where
        },
        include: {
          bill: {
            include: {
              student: true,
              billType: true
            }
          }
        },
        orderBy: [
          { paymentDate: 'desc' }
        ]
      });

      const exportData = payments.map(payment => ({
        'No Pembayaran': payment.paymentNo,
        'No Tagihan': payment.bill.billNo,
        'Nama Siswa': payment.bill.student.fullName,
        'NIS': payment.bill.student.nis,
        'Institusi': payment.bill.student.institutionType,
        'Kelas': payment.bill.student.grade || '',
        'Jenis Tagihan': payment.bill.billType.name,
        'Periode': payment.bill.period,
        'Jumlah Bayar': payment.amount.toNumber(),
        'Tanggal Bayar': payment.paymentDate.toISOString().split('T')[0],
        'Metode Bayar': payment.method,
        'Channel': payment.channel || '',
        'Referensi': payment.reference || '',
        'Status Verifikasi': payment.verificationStatus,
        'Diverifikasi Oleh': payment.verifiedBy || '',
        'Tanggal Verifikasi': payment.verifiedAt ? payment.verifiedAt.toISOString().split('T')[0] : '',
        'Catatan': payment.notes || '',
        'Tanggal Dibuat': payment.createdAt.toISOString().split('T')[0]
      }));

      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        columns: [
          { key: 'No Pembayaran', header: 'No Pembayaran', width: 20 },
          { key: 'No Tagihan', header: 'No Tagihan', width: 20 },
          { key: 'Nama Siswa', header: 'Nama Siswa', width: 25 },
          { key: 'NIS', header: 'NIS', width: 15 },
          { key: 'Institusi', header: 'Institusi', width: 10 },
          { key: 'Kelas', header: 'Kelas', width: 8 },
          { key: 'Jenis Tagihan', header: 'Jenis Tagihan', width: 20 },
          { key: 'Periode', header: 'Periode', width: 12 },
          { key: 'Jumlah Bayar', header: 'Jumlah Bayar', width: 15, type: 'number' },
          { key: 'Tanggal Bayar', header: 'Tanggal Bayar', width: 15, type: 'date' },
          { key: 'Metode Bayar', header: 'Metode Bayar', width: 15 },
          { key: 'Channel', header: 'Channel', width: 12 },
          { key: 'Referensi', header: 'Referensi', width: 20 },
          { key: 'Status Verifikasi', header: 'Status Verifikasi', width: 15 },
          { key: 'Diverifikasi Oleh', header: 'Diverifikasi Oleh', width: 20 },
          { key: 'Tanggal Verifikasi', header: 'Tanggal Verifikasi', width: 15, type: 'date' },
          { key: 'Catatan', header: 'Catatan', width: 30 },
          { key: 'Tanggal Dibuat', header: 'Tanggal Dibuat', width: 15, type: 'date' }
        ]
      });
    } else {
      // Export bills
      const bills = await prisma.bills.findMany({
        where,
        include: {
          student: true,
          billType: true
        },
        orderBy: [
          { dueDate: 'asc' },
          { student: { fullName: 'asc' } }
        ]
      });

      const exportData = bills.map(bill => ({
        'No Tagihan': bill.billNo,
        'Nama Siswa': bill.student.fullName,
        'NIS': bill.student.nis,
        'Institusi': bill.student.institutionType,
        'Kelas': bill.student.grade || '',
        'Jenis Tagihan': bill.billType.name,
        'Kategori': bill.billType.category,
        'Periode': bill.period,
        'Jumlah Tagihan': bill.amount.toNumber(),
        'Jumlah Asli': bill.originalAmount.toNumber(),
        'Total Diskon': bill.totalDiscount.toNumber(),
        'Total Denda': bill.totalPenalty.toNumber(),
        'Jumlah Dibayar': bill.paidAmount.toNumber(),
        'Sisa Tagihan': bill.remainingAmount.toNumber(),
        'Tanggal Jatuh Tempo': bill.dueDate.toISOString().split('T')[0],
        'Status': bill.status,
        'Terlambat': bill.isOverdue ? 'Ya' : 'Tidak',
        'Hari Terlambat': bill.daysPastDue,
        'Tanggal Pertama Terlambat': bill.firstOverdueDate ? bill.firstOverdueDate.toISOString().split('T')[0] : '',
        'Jumlah Reminder': bill.reminderCount,
        'Reminder Terakhir': bill.lastReminderSent ? bill.lastReminderSent.toISOString().split('T')[0] : '',
        'Catatan': bill.notes || '',
        'Tanggal Dibuat': bill.generatedAt.toISOString().split('T')[0]
      }));

      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        columns: [
          { key: 'No Tagihan', header: 'No Tagihan', width: 20 },
          { key: 'Nama Siswa', header: 'Nama Siswa', width: 25 },
          { key: 'NIS', header: 'NIS', width: 15 },
          { key: 'Institusi', header: 'Institusi', width: 10 },
          { key: 'Kelas', header: 'Kelas', width: 8 },
          { key: 'Jenis Tagihan', header: 'Jenis Tagihan', width: 20 },
          { key: 'Kategori', header: 'Kategori', width: 15 },
          { key: 'Periode', header: 'Periode', width: 12 },
          { key: 'Jumlah Tagihan', header: 'Jumlah Tagihan', width: 15, type: 'number' },
          { key: 'Jumlah Asli', header: 'Jumlah Asli', width: 15, type: 'number' },
          { key: 'Total Diskon', header: 'Total Diskon', width: 15, type: 'number' },
          { key: 'Total Denda', header: 'Total Denda', width: 15, type: 'number' },
          { key: 'Jumlah Dibayar', header: 'Jumlah Dibayar', width: 15, type: 'number' },
          { key: 'Sisa Tagihan', header: 'Sisa Tagihan', width: 15, type: 'number' },
          { key: 'Tanggal Jatuh Tempo', header: 'Tanggal Jatuh Tempo', width: 15, type: 'date' },
          { key: 'Status', header: 'Status', width: 12 },
          { key: 'Terlambat', header: 'Terlambat', width: 10 },
          { key: 'Hari Terlambat', header: 'Hari Terlambat', width: 12, type: 'number' },
          { key: 'Tanggal Pertama Terlambat', header: 'Tanggal Pertama Terlambat', width: 20, type: 'date' },
          { key: 'Jumlah Reminder', header: 'Jumlah Reminder', width: 15, type: 'number' },
          { key: 'Reminder Terakhir', header: 'Reminder Terakhir', width: 15, type: 'date' },
          { key: 'Catatan', header: 'Catatan', width: 30 },
          { key: 'Tanggal Dibuat', header: 'Tanggal Dibuat', width: 15, type: 'date' }
        ]
      });
    }

  } catch (error) {
    console.error('Export billing error:', error);
    return NextResponse.json(
      { error: 'Failed to export billing data' },
      { status: 500 }
    );
  }
}