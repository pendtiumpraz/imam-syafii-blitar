import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Check if init secret is provided
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // You can set this in environment variable for security
    const INIT_SECRET = process.env.INIT_SECRET || 'init-secret-2024';
    
    if (secret !== INIT_SECRET) {
      return NextResponse.json(
        { error: 'Invalid initialization secret' },
        { status: 403 }
      );
    }

    const { default: prisma } = await import('@/lib/prisma');
    
    // Check if admin user already exists
    // Use findFirst to avoid middleware conflicts
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        username: 'admin'
      });
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@ponpesimamsyafii.id',
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    // Also create a staff user for testing
    const staffPassword = await bcrypt.hash('staff123', 10);
    
    const staffUser = await prisma.user.create({
      data: {
        username: 'staff',
        email: 'staff@ponpesimamsyafii.id',
        password: staffPassword,
        name: 'Staff User',
        role: 'STAFF',
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      users: [
        {
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          password: 'admin123'
        },
        {
          username: staffUser.username,
          email: staffUser.email,
          role: staffUser.role,
          password: 'staff123'
        }
      ]
    });
  } catch (error) {
    console.error('Init error:', error);
    
    // If user already exists, try to update password
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      try {
        const { default: prisma } = await import('@/lib/prisma');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await prisma.user.update({
          where: { username: 'admin' },
          data: { 
            password: hashedPassword,
            isActive: true 
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Admin password reset successfully',
          username: 'admin',
          password: 'admin123'
        });
      } catch (updateError) {
        return NextResponse.json(
          { error: 'Failed to update admin user' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}