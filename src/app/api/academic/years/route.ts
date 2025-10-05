import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');

    const academicYears = await prisma.academicYear.findMany({
      where: isActive === 'true' ? { isActive: true } : {},
      include: {
        semesters: {
          select: {
            id: true,
            name: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            classes: true,
            studentClasses: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { startDate: 'desc' },
      ],
    });

    return NextResponse.json(academicYears);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, startDate, endDate, description, isActive } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    // If this is being set as active, deactivate others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        isActive: Boolean(isActive),
      },
      include: {
        semesters: true,
        _count: {
          select: {
            classes: true,
            studentClasses: true,
          },
        },
      },
    });

    return NextResponse.json(academicYear, { status: 201 });
  } catch (error) {
    console.error('Error creating academic year:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Academic year with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, startDate, endDate, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      );
    }

    // If this is being set as active, deactivate others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { 
          isActive: true,
          NOT: { id }
        },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        description,
        isActive: Boolean(isActive),
      },
      include: {
        semesters: true,
        _count: {
          select: {
            classes: true,
            studentClasses: true,
          },
        },
      },
    });

    return NextResponse.json(academicYear);
  } catch (error) {
    console.error('Error updating academic year:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Academic year with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      );
    }

    // Check if academic year has associated data
    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
            studentClasses: true,
            semesters: true,
          },
        },
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    const { classes, studentClasses, semesters } = academicYear._count;
    if (classes > 0 || studentClasses > 0 || semesters > 0) {
      return NextResponse.json(
        { error: 'Cannot delete academic year that has classes or students associated with it' },
        { status: 409 }
      );
    }

    await softDelete(prisma.academicYear, { id }, session.user.id);

    return NextResponse.json({ message: 'Academic year soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}