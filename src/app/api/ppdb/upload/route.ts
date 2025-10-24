import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const documentType: string = data.get('documentType') as string;
    const registrationId: string = data.get('registrationId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 2MB allowed.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'ppdb');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${registrationId}_${documentType}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/ppdb/${fileName}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update registration with document info
    const { default: prisma } = await import('@/lib/prisma');
    
    // Get current documents
    const registration = await prisma.registrations.findUnique({
      where: { id: registrationId },
      select: { documents: true }
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Parse existing documents
    let documents = [];
    try {
      documents = JSON.parse(registration.documents);
    } catch (e) {
      documents = [];
    }

    // Remove existing document of same type
    documents = documents.filter((doc: any) => doc.type !== documentType);

    // Add new document
    documents.push({
      type: documentType,
      fileName: file.name,
      url: publicUrl,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      fileType: file.type,
      status: 'uploaded'
    });

    // Update registration
    await prisma.registrations.update({
      where: { id: registrationId },
      data: {
        documents: JSON.stringify(documents),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');
    const documentType = searchParams.get('documentType');

    if (!registrationId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { default: prisma } = await import('@/lib/prisma');
    
    // Get current documents
    const registration = await prisma.registrations.findUnique({
      where: { id: registrationId },
      select: { documents: true }
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Parse existing documents
    let documents = [];
    try {
      documents = JSON.parse(registration.documents);
    } catch (e) {
      documents = [];
    }

    // Find and remove document
    const documentToDelete = documents.find((doc: any) => doc.type === documentType);
    documents = documents.filter((doc: any) => doc.type !== documentType);

    // Delete physical file
    if (documentToDelete && documentToDelete.url) {
      const filePath = join(process.cwd(), 'public', documentToDelete.url);
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (e) {
        console.warn('Could not delete file:', documentToDelete.url);
      }
    }

    // Update registration
    await prisma.registrations.update({
      where: { id: registrationId },
      data: {
        documents: JSON.stringify(documents),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}