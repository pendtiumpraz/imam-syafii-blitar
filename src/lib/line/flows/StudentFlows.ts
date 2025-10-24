import { FlowDefinition } from '../core/FlowManager'
import { prisma } from '@/lib/prisma'

/**
 * Flow untuk menambah siswa baru
 */
export const addStudentFlow: FlowDefinition = {
  id: 'add_student',
  name: 'Tambah Siswa Baru',
  description: 'Menambahkan data siswa baru ke sistem',
  requiredPermission: 'STUDENT_CREATE',
  steps: [
    {
      id: 'fullName',
      prompt: '📝 Masukkan nama lengkap siswa:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 3) {
          return '❌ Nama harus minimal 3 karakter'
        }
        if (input.length > 100) {
          return '❌ Nama terlalu panjang (maksimal 100 karakter)'
        }
        return true
      },
      transform: (input: string) => input.trim()
    },
    {
      id: 'nis',
      prompt: '🔢 Masukkan NIS (Nomor Induk Siswa) - 8 digit:',
      inputType: 'text',
      validation: async (input: string) => {
        if (!/^\d{8}$/.test(input)) {
          return '❌ NIS harus 8 digit angka. Contoh: 20240001'
        }
        // Check if NIS already exists
        const existing = await prisma.students.findUnique({
          where: { nis: input }
        })
        if (existing) {
          return '❌ NIS sudah terdaftar dalam sistem'
        }
        return true
      }
    },
    {
      id: 'gender',
      prompt: '👤 Pilih jenis kelamin:',
      inputType: 'select',
      options: ['Laki-laki', 'Perempuan'],
      transform: (input: string) => input === 'Laki-laki' ? 'MALE' : 'FEMALE'
    },
    {
      id: 'birthPlace',
      prompt: '🏙️ Masukkan tempat lahir:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 2) {
          return '❌ Tempat lahir tidak valid'
        }
        return true
      },
      transform: (input: string) => input.trim()
    },
    {
      id: 'birthDate',
      prompt: '📅 Masukkan tanggal lahir (DD/MM/YYYY):',
      inputType: 'text',
      validation: (input: string) => {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
        if (!regex.test(input)) {
          return '❌ Format tanggal salah. Gunakan format DD/MM/YYYY'
        }
        
        const [, day, month, year] = input.match(regex)!
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        if (isNaN(date.getTime())) {
          return '❌ Tanggal tidak valid'
        }
        
        const age = new Date().getFullYear() - date.getFullYear()
        if (age < 3 || age > 25) {
          return '❌ Usia siswa harus antara 3-25 tahun'
        }
        
        return true
      },
      transform: (input: string) => {
        const [day, month, year] = input.split('/')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    },
    {
      id: 'address',
      prompt: '🏠 Masukkan alamat lengkap:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 10) {
          return '❌ Alamat terlalu pendek (minimal 10 karakter)'
        }
        return true
      },
      transform: (input: string) => input.trim()
    },
    {
      id: 'city',
      prompt: '🌆 Masukkan kota/kabupaten:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 3) {
          return '❌ Nama kota tidak valid'
        }
        return true
      },
      transform: (input: string) => input.trim()
    },
    {
      id: 'fatherName',
      prompt: '👨 Masukkan nama ayah:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 3) {
          return '❌ Nama ayah harus minimal 3 karakter'
        }
        return true
      },
      transform: (input: string) => input.trim()
    },
    {
      id: 'fatherPhone',
      prompt: '📱 Masukkan nomor HP ayah (contoh: 081234567890):',
      inputType: 'text',
      validation: (input: string) => {
        if (!/^(08|628|\+628)\d{8,12}$/.test(input)) {
          return '❌ Nomor HP tidak valid. Gunakan format 08xxx atau 628xxx'
        }
        return true
      },
      transform: (input: string) => {
        // Normalize to 628xxx format
        if (input.startsWith('08')) {
          return '628' + input.substring(2)
        }
        if (input.startsWith('+')) {
          return input.substring(1)
        }
        return input
      }
    },
    {
      id: 'motherName',
      prompt: '👩 Masukkan nama ibu:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 3) {
          return '❌ Nama ibu harus minimal 3 karakter'
        }
        return true
      },
      transform: (input: string) => input.trim()
    },
    {
      id: 'motherPhone',
      prompt: '📱 Masukkan nomor HP ibu (opsional, ketik "skip" untuk lewati):',
      inputType: 'text',
      validation: (input: string) => {
        if (input.toLowerCase() === 'skip') return true
        if (!/^(08|628|\+628)\d{8,12}$/.test(input)) {
          return '❌ Nomor HP tidak valid atau ketik "skip" untuk lewati'
        }
        return true
      },
      transform: (input: string) => {
        if (input.toLowerCase() === 'skip') return null
        // Normalize to 628xxx format
        if (input.startsWith('08')) {
          return '628' + input.substring(2)
        }
        if (input.startsWith('+')) {
          return input.substring(1)
        }
        return input
      }
    },
    {
      id: 'confirm',
      prompt: '✅ Data sudah lengkap. Simpan data siswa?',
      inputType: 'confirm'
    }
  ],
  onComplete: async (data: any, userId: string) => {
    // Get or create system user for LINE bot
    let systemUser = await prisma.users.findFirst({
      where: { username: 'line-bot' }
    })
    
    if (!systemUser) {
      systemUser = await prisma.users.create({
        data: {
          username: 'line-bot',
          email: 'line-bot@system.local',
          password: 'not-used',
          name: 'LINE Bot System',
          role: 'STAFF'
        }
      })
    }

    // Only save if confirmed
    if (data.confirm !== 'ya') {
      throw new Error('Pembatalan oleh pengguna')
    }

    // Create student record
    const student = await prisma.students.create({
      data: {
        fullName: data.fullName,
        nis: data.nis,
        gender: data.gender,
        birthPlace: data.birthPlace,
        birthDate: data.birthDate,
        address: data.address,
        city: data.city,
        province: 'Jawa Timur',
        fatherName: data.fatherName,
        fatherPhone: data.fatherPhone,
        motherName: data.motherName,
        motherPhone: data.motherPhone,
        institutionType: 'PONDOK',
        enrollmentDate: new Date(),
        enrollmentYear: new Date().getFullYear().toString(),
        // TODO: creator relation doesn't exist in students model - needs schema update
        createdBy: systemUser.id
      }
    })

    console.log('Student created:', student.id)
  },
  onError: async (error: any, userId: string) => {
    console.error('Error in addStudentFlow:', error)
  }
}

/**
 * Flow untuk mencari siswa
 */
export const searchStudentFlow: FlowDefinition = {
  id: 'search_student',
  name: 'Cari Siswa',
  description: 'Mencari data siswa berdasarkan nama atau NIS',
  steps: [
    {
      id: 'query',
      prompt: '🔍 Masukkan nama atau NIS siswa yang ingin dicari:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input || input.length < 2) {
          return '❌ Kata kunci pencarian minimal 2 karakter'
        }
        return true
      }
    }
  ],
  onComplete: async (data: any, userId: string) => {
    const students = await prisma.students.findMany({
      where: {
        OR: [
          { fullName: { contains: data.query, mode: 'insensitive' } },
          { nis: { contains: data.query } }
        ]
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        nis: true,
        grade: true,
        gender: true,
        address: true
      }
    })

    // Store search results in session for further actions
    const { SessionManager } = await import('../core/SessionManager')
    await SessionManager.updateSession(userId, {
      state: { searchResults: students }
    })
  }
}

/**
 * Flow untuk edit siswa
 */
export const editStudentFlow: FlowDefinition = {
  id: 'edit_student',
  name: 'Edit Data Siswa',
  description: 'Mengubah data siswa yang sudah ada',
  requiredPermission: 'STUDENT_EDIT',
  steps: [
    {
      id: 'studentId',
      prompt: '🔍 Masukkan NIS siswa yang akan diedit:',
      inputType: 'text',
      validation: async (input: string) => {
        const student = await prisma.students.findUnique({
          where: { nis: input }
        })
        if (!student) {
          return '❌ Siswa dengan NIS tersebut tidak ditemukan'
        }
        return true
      },
      transform: async (input: string) => {
        const student = await prisma.students.findUnique({
          where: { nis: input }
        })
        return student?.id
      }
    },
    {
      id: 'field',
      prompt: '📝 Apa yang ingin diubah?',
      inputType: 'select',
      options: [
        'Nama Lengkap',
        'Alamat',
        'No. HP Ayah',
        'No. HP Ibu',
        'Status'
      ]
    },
    {
      id: 'newValue',
      prompt: '✏️ Masukkan nilai baru:',
      inputType: 'text',
      validation: (input: string) => {
        if (!input) {
          return '❌ Nilai tidak boleh kosong'
        }
        return true
      }
    },
    {
      id: 'confirm',
      prompt: '✅ Apakah Anda yakin ingin menyimpan perubahan?',
      inputType: 'confirm'
    }
  ],
  onComplete: async (data: any, userId: string) => {
    if (data.confirm !== 'ya') {
      throw new Error('Pembatalan oleh pengguna')
    }

    const updateData: any = {}
    
    switch (data.field) {
      case 'Nama Lengkap':
        updateData.fullName = data.newValue
        break
      case 'Alamat':
        updateData.address = data.newValue
        break
      case 'No. HP Ayah':
        updateData.fatherPhone = data.newValue
        break
      case 'No. HP Ibu':
        updateData.motherPhone = data.newValue
        break
      case 'Status':
        updateData.status = data.newValue.toUpperCase()
        break
    }

    await prisma.students.update({
      where: { id: data.studentId },
      data: updateData
    })
  }
}

/**
 * Flow untuk hapus siswa
 */
export const deleteStudentFlow: FlowDefinition = {
  id: 'delete_student',
  name: 'Hapus Data Siswa',
  description: 'Menghapus data siswa dari sistem',
  requiredPermission: 'STUDENT_DELETE',
  steps: [
    {
      id: 'nis',
      prompt: '🔍 Masukkan NIS siswa yang akan dihapus:',
      inputType: 'text',
      validation: async (input: string) => {
        const student = await prisma.students.findUnique({
          where: { nis: input },
          select: { fullName: true }
        })
        if (!student) {
          return '❌ Siswa dengan NIS tersebut tidak ditemukan'
        }
        return true
      }
    },
    {
      id: 'confirm',
      prompt: '⚠️ PERINGATAN: Data yang dihapus tidak dapat dikembalikan. Yakin ingin menghapus?',
      inputType: 'confirm'
    }
  ],
  onComplete: async (data: any, userId: string) => {
    if (data.confirm !== 'ya') {
      throw new Error('Pembatalan oleh pengguna')
    }

    await prisma.students.delete({
      where: { nis: data.nis }
    })
  }
}