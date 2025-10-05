import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete } from '@/lib/soft-delete'

// PUT /api/videos/[id] - Update a video (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = params

    const video = await prisma.video.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        url: body.videoUrl,
        thumbnail: body.thumbnail,
        duration: body.duration,
        category: body.category,
        teacher: body.ustadz,
        uploadDate: new Date(body.date),
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
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

// DELETE /api/videos/[id] - Delete a video (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Soft delete the video
    await softDelete(prisma.video, { id }, session.user?.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}

// PATCH /api/videos/[id]/view - Increment view count (public)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const video = await prisma.video.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ views: video.views })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}
