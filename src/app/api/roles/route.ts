import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/roles - Get all available roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN and ADMIN can view roles
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Role definitions that match the roles page
    const AVAILABLE_ROLES = [
      {
        id: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        color: 'bg-red-100 text-red-800 border-red-300'
      },
      {
        id: 'ADMIN',
        name: 'Admin',
        description: 'Administrative access to manage system',
        color: 'bg-purple-100 text-purple-800 border-purple-300'
      },
      {
        id: 'USTADZ',
        name: 'Ustadz',
        description: 'Teacher access for academic operations',
        color: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      {
        id: 'STAFF',
        name: 'Staff',
        description: 'Basic staff access to view student information',
        color: 'bg-green-100 text-green-800 border-green-300'
      },
      {
        id: 'PARENT',
        name: 'Parent',
        description: 'Parent access to view their children information',
        color: 'bg-gray-100 text-gray-800 border-gray-300'
      }
    ]

    return NextResponse.json({ roles: AVAILABLE_ROLES })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
