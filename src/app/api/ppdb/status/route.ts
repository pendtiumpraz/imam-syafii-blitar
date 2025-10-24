import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationNo, whatsapp } = body;
    
    if (!registrationNo || !whatsapp) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nomor pendaftaran dan WhatsApp harus diisi' 
        },
        { status: 400 }
      );
    }
    
    const { default: prisma } = await import('@/lib/prisma');
    
    // Find registration by registration number and whatsapp
    const registration = await prisma.registrations.findFirst({
      where: {
        registrationNo,
        whatsapp
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!registration) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data pendaftaran tidak ditemukan. Periksa kembali nomor pendaftaran dan WhatsApp Anda.' 
        },
        { status: 404 }
      );
    }
    
    // Parse JSON fields
    const parsedRegistration = {
      ...registration,
      documents: JSON.parse(registration.documents),
      testScore: registration.testScore ? JSON.parse(registration.testScore) : null
    };
    
    // Get status description
    const statusDescriptions: { [key: string]: string } = {
      'DRAFT': 'Draft - Belum disubmit',
      'SUBMITTED': 'Pendaftaran telah diterima',
      'DOCUMENT_CHECK': 'Dokumen sedang diperiksa',
      'VERIFIED': 'Dokumen terverifikasi',
      'TEST_SCHEDULED': 'Jadwal test telah ditentukan',
      'TEST_TAKEN': 'Test telah dilakukan',
      'PASSED': 'Lulus seleksi',
      'FAILED': 'Tidak lulus seleksi',
      'REGISTERED': 'Terdaftar sebagai siswa'
    };
    
    const paymentStatusDescriptions: { [key: string]: string } = {
      'UNPAID': 'Belum dibayar',
      'PAID': 'Sudah dibayar',
      'VERIFIED': 'Pembayaran terverifikasi'
    };
    
    return NextResponse.json({
      success: true,
      data: {
        ...parsedRegistration,
        statusDescription: statusDescriptions[registration.status] || registration.status,
        paymentStatusDescription: paymentStatusDescriptions[registration.paymentStatus] || registration.paymentStatus
      }
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gagal mengecek status pendaftaran' 
      },
      { status: 500 }
    );
  }
}