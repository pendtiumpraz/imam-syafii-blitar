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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (startDate) {
      where.date = {
        ...where.date,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate)
      };
    }

    // Fetch activities data
    const activities = await prisma.activities.findMany({
      where,
      include: {
        creator: true
      },
      orderBy: [
        { date: 'desc' },
        { title: 'asc' }
      ]
    });

    const exportData = activities.map(activity => {
      const photos = JSON.parse(activity.photos || '[]');
      
      return {
        'Judul Kegiatan': activity.title,
        'Deskripsi': activity.description,
        'Jenis Kegiatan': activity.type,
        'Tanggal Kegiatan': activity.date.toISOString().split('T')[0],
        'Waktu': activity.date.toISOString().split('T')[1].substring(0, 5),
        'Lokasi': activity.location || '',
        'Status': activity.status,
        'Jumlah Foto': photos.length,
        'URL Foto': photos.join(', '),
        'Dibuat Oleh': activity.creator.name,
        'Tanggal Dibuat': activity.createdAt.toISOString().split('T')[0],
        'Terakhir Update': activity.updatedAt.toISOString().split('T')[0]
      };
    });

    return NextResponse.json({
      success: true,
      data: exportData,
      total: exportData.length,
      columns: [
        { key: 'Judul Kegiatan', header: 'Judul Kegiatan', width: 30 },
        { key: 'Deskripsi', header: 'Deskripsi', width: 40 },
        { key: 'Jenis Kegiatan', header: 'Jenis Kegiatan', width: 20 },
        { key: 'Tanggal Kegiatan', header: 'Tanggal Kegiatan', width: 15, type: 'date' },
        { key: 'Waktu', header: 'Waktu', width: 10 },
        { key: 'Lokasi', header: 'Lokasi', width: 25 },
        { key: 'Status', header: 'Status', width: 12 },
        { key: 'Jumlah Foto', header: 'Jumlah Foto', width: 12, type: 'number' },
        { key: 'URL Foto', header: 'URL Foto', width: 50 },
        { key: 'Dibuat Oleh', header: 'Dibuat Oleh', width: 20 },
        { key: 'Tanggal Dibuat', header: 'Tanggal Dibuat', width: 15, type: 'date' },
        { key: 'Terakhir Update', header: 'Terakhir Update', width: 15, type: 'date' }
      ]
    });

  } catch (error) {
    console.error('Export activities error:', error);
    return NextResponse.json(
      { error: 'Failed to export activities data' },
      { status: 500 }
    );
  }
}