import { prisma } from '@/lib/prisma'
import { replyMessage } from '../client'

// TODO: Implement proper Teacher commands
// The Teacher model has: name, position, subjects (relation), etc.

export const handlePengajarCommand = {
  async list(userId: string, replyToken: string) {
    try {
      const teachers = await prisma.teachers.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          position: true,
          isUstadz: true
        }
      })

      if (teachers.length === 0) {
        await replyMessage(replyToken, [{
          type: 'text',
          text: 'Belum ada data pengajar.'
        }])
        return
      }

      const teacherList = teachers.map(t => 
        `${t.isUstadz ? '🕌' : '👨‍🏫'} ${t.name} - ${t.position}`
      ).join('\n')

      await replyMessage(replyToken, [{
        type: 'text',
        text: `📚 Daftar Pengajar:\n\n${teacherList}`
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  },

  async create(data: any, userId: string, replyToken: string) {
    try {
      // TODO: Implement teacher creation with proper fields
      await replyMessage(replyToken, [{
        type: 'text',
        text: '👨‍🏫 Fitur tambah pengajar sedang dalam pengembangan'
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  },

  async getDetail(id: string, userId: string, replyToken: string) {
    try {
      const teacher = await prisma.teachers.findUnique({
        where: { id }
      })

      if (!teacher) {
        await replyMessage(replyToken, [{
          type: 'text',
          text: 'Pengajar tidak ditemukan.'
        }])
        return
      }

      // Parse subjects JSON string
      let subjectList = '-'
      try {
        const subjects = JSON.parse(teacher.subjects)
        if (Array.isArray(subjects) && subjects.length > 0) {
          subjectList = subjects.join(', ')
        }
      } catch (e) {
        // subjects might be empty or invalid JSON
      }

      await replyMessage(replyToken, [{
        type: 'text',
        text: `👨‍🏫 ${teacher.name}\n${teacher.position}\n\nMata Pelajaran: ${subjectList}`
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  }
}