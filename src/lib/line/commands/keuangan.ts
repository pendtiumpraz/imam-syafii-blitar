import { prisma } from '@/lib/prisma'
import { replyMessage } from '../client'

// TODO: Rewrite to match actual Payment model schema
// The current Payment model doesn't have 'type' or 'dueDate' fields
// It has: paymentType, amount, status, method, etc.

export const handleKeuanganCommand = {
  async checkSPP(nis: string, userId: string, replyToken: string) {
    try {
      const student = await prisma.students.findUnique({
        where: { nis }
      })

      if (!student) {
        await replyMessage(replyToken, [{
          type: 'text',
          text: `Siswa dengan NIS ${nis} tidak ditemukan.`
        }])
        return
      }

      // TODO: Implement proper payment checking
      await replyMessage(replyToken, [{
        type: 'text',
        text: `💰 Fitur pembayaran sedang dalam pengembangan untuk ${student.fullName}`
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  },

  async getPaymentDetail(id: string, userId: string, replyToken: string) {
    try {
      // TODO: Implement payment detail retrieval
      await replyMessage(replyToken, [{
        type: 'text',
        text: '💰 Fitur detail pembayaran sedang dalam pengembangan'
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  },

  async markAsPaid(id: string, userId: string, replyToken: string) {
    try {
      // TODO: Implement payment marking
      await replyMessage(replyToken, [{
        type: 'text',
        text: '💰 Fitur konfirmasi pembayaran sedang dalam pengembangan'
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  },

  async createBill(data: any, userId: string, replyToken: string) {
    try {
      // TODO: Implement bill creation
      await replyMessage(replyToken, [{
        type: 'text',
        text: '💰 Fitur pembuatan tagihan sedang dalam pengembangan'
      }])
    } catch (error: any) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }])
    }
  }
}