import { prisma } from '@/lib/prisma'
import { replyMessage } from '../client'
import { getStudentCarousel } from '../templates/fancy-menus'
import { getSiswaDetail } from '../templates/menus'

async function getOrCreateSystemUser() {
  const systemUser = await prisma.users.findFirst({
    where: { username: 'line-bot' }
  })
  
  if (!systemUser) {
    return await prisma.users.create({
      data: {
        username: 'line-bot',
        email: 'line-bot@system.local',
        password: 'not-used', // Bot doesn't need password
        name: 'LINE Bot System',
        role: 'STAFF'
      }
    })
  }
  
  return systemUser
}

export const handleSiswaCommand = {
  async create(data: any, userId: string, replyToken: string) {
    try {
      // Get or create system user for bot operations
      const systemUser = await getOrCreateSystemUser()
      
      const student = await prisma.students.create({
        data: {
          fullName: data.name,
          nis: data.nis,
          birthDate: new Date(data.birthDate),
          birthPlace: data.birthPlace || 'Blitar',
          gender: data.gender?.toUpperCase() === 'L' ? 'MALE' : 'FEMALE',
          address: data.address || 'Blitar',
          city: 'Blitar',
          fatherName: data.parentName || 'Bapak',
          motherName: data.motherName || 'Ibu',
          fatherPhone: data.parentPhone,
          // Required fields
          institutionType: 'PONDOK',
          enrollmentDate: new Date(),
          enrollmentYear: new Date().getFullYear().toString(),
          // TODO: creator relation doesn't exist in students model - needs schema update
          createdBy: systemUser.id
        }
      })

      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `✅ Siswa berhasil ditambahkan!\n\nNama: ${student.fullName}\nNIS: ${student.nis}\n\nData telah tersimpan dalam sistem.`
        }
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Gagal menambah siswa: ${error.message}`
        }
      ])
    }
  },

  async list(userId: string, replyToken: string) {
    try {
      const students = await prisma.students.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          nis: true,
          grade: true
        }
      })

      if (students.length === 0) {
        await replyMessage(replyToken, [
          {
            type: 'text',
            text: 'Belum ada data siswa.'
          }
        ])
        return
      }

      const formattedStudents = students.map(s => ({
        id: s.id,
        name: s.fullName,
        nis: s.nis,
        status: 'ACTIVE',
        class: s.grade
      }))

      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `📚 Menampilkan ${students.length} siswa terbaru:`
        },
        getStudentCarousel(formattedStudents)
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Gagal mengambil data: ${error.message}`
        }
      ])
    }
  },

  async search(query: string, userId: string, replyToken: string) {
    try {
      const students = await prisma.students.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { nis: { contains: query } }
          ]
        },
        take: 5,
        select: {
          id: true,
          fullName: true,
          nis: true,
          grade: true
        }
      })

      if (students.length === 0) {
        await replyMessage(replyToken, [
          {
            type: 'text',
            text: `Tidak ditemukan siswa dengan kata kunci "${query}"`
          }
        ])
        return
      }

      const formattedStudents = students.map(s => ({
        id: s.id,
        name: s.fullName,
        nis: s.nis,
        status: 'ACTIVE',
        class: s.grade
      }))

      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `🔍 Ditemukan ${students.length} siswa:`
        },
        getStudentCarousel(formattedStudents)
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Gagal mencari: ${error.message}`
        }
      ])
    }
  },

  async getByNIS(nis: string, userId: string, replyToken: string) {
    try {
      const student = await prisma.students.findUnique({
        where: { nis },
        select: {
          id: true,
          fullName: true,
          nis: true,
          grade: true,
          address: true,
          fatherPhone: true
        }
      })

      if (!student) {
        await replyMessage(replyToken, [
          {
            type: 'text',
            text: `Siswa dengan NIS ${nis} tidak ditemukan.`
          }
        ])
        return
      }

      await replyMessage(replyToken, [
        getSiswaDetail(student),
        /* ...(student.payments?.length > 0 ? [{
          type: 'text' as const,
          text: `⚠️ Ada ${student.payments?.length} tagihan pending`
        }] : []) */
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`
        }
      ])
    }
  },

  async getDetail(id: string, userId: string, replyToken: string) {
    try {
      const student = await prisma.students.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          nis: true,
          grade: true,
          address: true,
          fatherPhone: true
        }
      })

      if (!student) {
        await replyMessage(replyToken, [
          {
            type: 'text',
            text: 'Siswa tidak ditemukan.'
          }
        ])
        return
      }

      await replyMessage(replyToken, [getSiswaDetail(student)])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`
        }
      ])
    }
  },

  async confirmDelete(id: string, userId: string, replyToken: string) {
    try {
      const student = await prisma.students.findUnique({
        where: { id },
        select: { fullName: true, nis: true }
      })

      if (!student) {
        await replyMessage(replyToken, [
          {
            type: 'text',
            text: 'Siswa tidak ditemukan.'
          }
        ])
        return
      }

      await replyMessage(replyToken, [
        {
          type: 'flex',
          altText: 'Konfirmasi Hapus',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '⚠️ Konfirmasi Hapus',
                  weight: 'bold',
                  size: 'lg',
                  color: '#E74C3C'
                },
                {
                  type: 'text',
                  text: `Apakah Anda yakin ingin menghapus:`,
                  margin: 'md',
                  wrap: true
                },
                {
                  type: 'text',
                  text: `${student.fullName} (${student.nis})`,
                  weight: 'bold',
                  margin: 'sm'
                },
                {
                  type: 'text',
                  text: 'Data yang dihapus tidak dapat dikembalikan!',
                  size: 'xs',
                  color: '#999999',
                  margin: 'md',
                  wrap: true
                }
              ]
            },
            footer: {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'button',
                  style: 'secondary',
                  action: {
                    type: 'message',
                    label: 'Batal',
                    text: 'batal'
                  }
                },
                {
                  type: 'button',
                  style: 'primary',
                  action: {
                    type: 'postback',
                    label: 'Ya, Hapus',
                    data: `action=confirm_delete&id=${id}`
                  },
                  color: '#E74C3C'
                }
              ],
              spacing: 'sm'
            }
          }
        }
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`
        }
      ])
    }
  },

  async delete(id: string, userId: string, replyToken: string) {
    try {
      const student = await prisma.students.delete({
        where: { id }
      })

      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `✅ Siswa ${student.fullName} (${student.nis}) berhasil dihapus.`
        }
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Gagal menghapus: ${error.message}`
        }
      ])
    }
  },

  async startEdit(id: string, userId: string, replyToken: string) {
    try {
      const student = await prisma.students.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          nis: true,
          grade: true
        }
      })

      if (!student) {
        await replyMessage(replyToken, [
          {
            type: 'text',
            text: 'Siswa tidak ditemukan.'
          }
        ])
        return
      }

      await replyMessage(replyToken, [
        {
          type: 'flex',
          altText: 'Edit Siswa',
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '✏️ EDIT DATA SISWA',
                  weight: 'bold',
                  color: '#FFFFFF'
                }
              ],
              backgroundColor: '#EAB308',
              paddingAll: '15px'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: student.fullName,
                  size: 'lg',
                  weight: 'bold'
                },
                {
                  type: 'text',
                  text: `NIS: ${student.nis}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm'
                },
                {
                  type: 'separator',
                  margin: 'lg'
                },
                {
                  type: 'text',
                  text: 'Pilih data yang ingin diubah:',
                  margin: 'lg',
                  size: 'sm'
                }
              ],
              paddingAll: '15px'
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '📝 Ubah Nama',
                    data: `action=edit_name&id=${id}`
                  },
                  style: 'secondary'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '📅 Ubah Tanggal Lahir',
                    data: `action=edit_birthdate&id=${id}`
                  },
                  style: 'secondary',
                  margin: 'sm'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '📱 Ubah No. HP Ortu',
                    data: `action=edit_phone&id=${id}`
                  },
                  style: 'secondary',
                  margin: 'sm'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '🏫 Ubah Kelas',
                    data: `action=edit_class&id=${id}`
                  },
                  style: 'secondary',
                  margin: 'sm'
                },
                {
                  type: 'separator',
                  margin: 'lg'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '↩️ Kembali',
                    data: 'action=back_to_menu'
                  },
                  style: 'link',
                  height: 'sm'
                }
              ],
              spacing: 'sm'
            }
          }
        }
      ])
    } catch (error: any) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`
        }
      ])
    }
  }
}