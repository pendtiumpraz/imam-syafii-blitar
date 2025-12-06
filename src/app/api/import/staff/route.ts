import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const StaffImportSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  username: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USTADZ', 'STAFF', 'PARENT']).default('USTADZ'),
  position: z.string().optional(),
  title: z.string().optional(), // Gelar depan (Dr., Ust., dll)
  suffix: z.string().optional(), // Gelar belakang (S.Pd, M.A, dll)
  department: z.string().optional(),
  address: z.string().optional(),
  isActive: z.union([z.boolean(), z.string()]).transform(val => 
    val === true || val === 'true' || val === 'TRUE' || val === '1' || val === 'yes' || val === 'YES'
  ).default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, preview = false } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results = {
      success: true,
      totalRows: data.length,
      validRows: 0,
      errorRows: 0,
      errors: [] as string[],
      duplicates: [] as string[],
      created: [] as any[]
    };

    const defaultPassword = await bcrypt.hash('password123', 12);

    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 2;
      const row = data[i];

      try {
        const validatedData = StaffImportSchema.parse(row);

        // Generate username if not provided
        const username = validatedData.username || 
          validatedData.email?.split('@')[0] || 
          validatedData.name?.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');

        // Check for existing user
        const existingUser = await prisma.users.findFirst({
          where: {
            OR: [
              { email: validatedData.email },
              { username: username }
            ],
            isDeleted: false
          }
        });

        if (existingUser) {
          results.duplicates.push(`Baris ${rowNumber}: User dengan email/username ${validatedData.email} sudah ada`);
          results.errorRows++;
          continue;
        }

        if (preview) {
          results.validRows++;
        } else {
          const newUser = await prisma.users.create({
            data: {
              name: validatedData.name,
              email: validatedData.email,
              username: username,
              password: defaultPassword,
              role: validatedData.role,
              isActive: validatedData.isActive,
            }
          });

          results.created.push({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          });
          results.validRows++;
        }

      } catch (error) {
        results.errorRows++;
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          results.errors.push(`Baris ${rowNumber}: ${errorMessages.join(', ')}`);
        } else {
          results.errors.push(`Baris ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    results.success = results.validRows > 0;
    return NextResponse.json(results);

  } catch (error) {
    console.error('Import staff error:', error);
    return NextResponse.json({ error: 'Failed to import staff data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const templateColumns = [
      { key: 'name', header: 'Nama Lengkap', required: true, example: 'Ahmad Hidayat', width: 25 },
      { key: 'title', header: 'Gelar Depan', required: false, example: 'Ust.', width: 10 },
      { key: 'suffix', header: 'Gelar Belakang', required: false, example: 'S.Pd.I', width: 10 },
      { key: 'email', header: 'Email', required: true, example: 'ahmad@pondok.sch.id', width: 25 },
      { key: 'username', header: 'Username', required: false, example: 'ahmad.hidayat', width: 15 },
      { key: 'phone', header: 'No. HP', required: false, example: '081234567890', width: 15 },
      { key: 'role', header: 'Role', required: false, example: 'USTADZ', width: 12 },
      { key: 'position', header: 'Jabatan', required: false, example: 'Guru Al-Quran', width: 20 },
      { key: 'department', header: 'Lembaga', required: false, example: 'MTQ', width: 15 },
      { key: 'address', header: 'Alamat', required: false, example: 'Jl. Masjid No. 1', width: 30 },
      { key: 'isActive', header: 'Status Aktif', required: false, example: 'true', width: 12 },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['name', 'email'],
        formats: {
          email: 'Format email yang valid',
          role: 'SUPER_ADMIN, ADMIN, USTADZ, STAFF, atau PARENT (default: USTADZ)',
          isActive: 'true/false atau 1/0 atau yes/no (default: true)',
          department: 'KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA'
        },
        notes: [
          'Password default: password123 (wajib diganti setelah login pertama)',
          'Username akan di-generate otomatis dari email jika tidak diisi',
          'Gelar depan/belakang opsional, tidak semua pengajar harus punya gelar formal'
        ]
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
