import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/videos - Get all videos (public for /kajian, filtered for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') === 'true'

    const videos = await prisma.video.findMany({
      where: {
        isPublic: isPublic ? true : undefined,
        isDeleted: false,
      },
      orderBy: {
        uploadDate: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Map the database model to the frontend interface
    const mappedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      ustadz: video.teacher,
      date: video.uploadDate.toISOString(),
      duration: video.duration || '00:00',
      views: video.views,
      likes: 0, // TODO: Implement likes feature
      category: video.category,
      thumbnail: video.thumbnail || '/api/placeholder/400/225',
      videoUrl: video.url,
      description: video.description,
      tags: [], // TODO: Add tags to Video model
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    }))

    return NextResponse.json(mappedVideos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// POST /api/videos - Create a new video (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const video = await prisma.video.create({
      data: {
        title: body.title,
        description: body.description,
        url: body.videoUrl,
        thumbnail: body.thumbnail,
        duration: body.duration,
        category: body.category,
        teacher: body.ustadz,
        uploadDate: new Date(body.date),
        isPublic: true,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({
      id: video.id,
      title: video.title,
      ustadz: video.teacher,
      date: video.uploadDate.toISOString(),
      duration: video.duration || '00:00',
      views: video.views,
      likes: 0,
      category: video.category,
      thumbnail: video.thumbnail || '/api/placeholder/400/225',
      videoUrl: video.url,
      description: video.description,
      tags: [],
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
