import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const courseSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  schedule: z.string().min(1, 'Jadwal wajib diisi'),
  teacher: z.string().min(1, 'Pengajar wajib diisi'),
  duration: z.string().min(1, 'Durasi wajib diisi'),
  capacity: z.number().min(1, 'Kapasitas minimal 1'),
  status: z.enum(['active', 'inactive', 'completed']).optional().default('active'),
});

// GET /api/courses - Get all courses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    const where: any = {
      isDeleted: false,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (level && level !== 'all') {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { teacher: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.courses.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      total: courses.length,
      active: courses.filter(c => c.status === 'active').length,
      totalEnrolled: courses.reduce((sum, c) => sum + c.enrolled, 0),
      totalCapacity: courses.reduce((sum, c) => sum + c.capacity, 0),
    };

    return NextResponse.json({ courses, stats });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = courseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const course = await prisma.courses.create({
      data: {
        name: data.name,
        description: data.description,
        level: data.level,
        schedule: data.schedule,
        teacher: data.teacher,
        duration: data.duration,
        capacity: data.capacity,
        status: data.status || 'active',
        enrolled: 0,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses - Update course
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.courses.findUnique({
      where: { id },
    });

    if (!existingCourse || existingCourse.isDeleted) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = await prisma.courses.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses - Soft delete course
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.courses.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
