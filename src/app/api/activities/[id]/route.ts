import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateActivitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Type is required'),
  date: z.string(),
  location: z.string().optional().nullable(),
  status: z.enum(['planned', 'ongoing', 'completed']).default('planned'),
  photos: z.array(z.string()).optional().default([]),
});

// Mock data for activities (same as in route.ts)
const mockActivities = [
  {
    id: '1',
    title: 'Kajian Rutin Mingguan',
    description: 'Kajian rutin setiap hari Jumat dengan tema Fiqih Muamalah',
    type: 'kajian',
    date: new Date('2024-03-22'),
    location: 'Masjid Pondok',
    photos: ['/photos/kajian1.jpg', '/photos/kajian2.jpg'],
    status: 'planned',
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Pelatihan Komputer',
    description: 'Pelatihan komputer dasar untuk santri tingkat menengah',
    type: 'pelatihan',
    date: new Date('2024-03-20'),
    location: 'Lab Komputer',
    photos: ['/photos/pelatihan1.jpg'],
    status: 'completed',
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Bakti Sosial',
    description: 'Kegiatan bakti sosial di desa sekitar pondok',
    type: 'sosial',
    date: new Date('2024-03-18'),
    location: 'Desa Sumberejo',
    photos: ['/photos/baksos1.jpg', '/photos/baksos2.jpg', '/photos/baksos3.jpg'],
    status: 'completed',
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    title: 'Seminar Kewirausahaan',
    description: 'Seminar motivasi kewirausahaan untuk alumni dan santri senior',
    type: 'seminar',
    date: new Date('2024-03-25'),
    location: 'Aula Pondok',
    photos: [],
    status: 'planned',
    createdBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find activity from mock data
    const activity = mockActivities.find(a => a.id === params.id);

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateActivitySchema.parse(body);

    // Check if activity exists in mock data
    const existingActivity = mockActivities.find(a => a.id === params.id);

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Create updated activity (in real implementation, this would update the database)
    const updatedActivity = {
      ...existingActivity,
      ...validated,
      date: new Date(validated.date),
      updatedAt: new Date(),
    };

    // In a real implementation, you would update the database here
    // await prisma.activities.update({
    //   where: { id: params.id },
    //   data: updatedActivity,
    // });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if activity exists in mock data
    const existingActivity = mockActivities.find(a => a.id === params.id);

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would delete from the database here
    // await prisma.activities.delete({
    //   where: { id: params.id },
    // });

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}