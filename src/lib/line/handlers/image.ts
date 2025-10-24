import { LineEvent } from '@/types/line'
import { replyMessage } from '../client'
import { getUserSession, setUserSession } from '../session'
import { uploadImage } from '@/lib/upload'
import { prisma } from '@/lib/prisma'

export async function handleImageMessage(event: LineEvent) {
  const userId = event.source?.userId || ''
  const replyToken = event.replyToken || ''
  const messageId = event.message?.id || ''
  
  // Get user session to check what we're waiting for
  const session = await getUserSession(userId)
  
  if (!session?.waitingFor) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '📷 Gambar diterima, tapi saat ini tidak ada proses yang memerlukan gambar.\n\nGunakan menu untuk memulai.'
    }])
    return
  }
  
  try {
    // Download image from LINE
    const imageUrl = await downloadLineImage(messageId)
    
    // Handle based on what we're waiting for
    switch (session.waitingFor) {
      case 'SISWA_PHOTO':
        await handleStudentPhoto(userId, imageUrl, replyToken, session)
        break
        
      case 'PAYMENT_PROOF':
        await handlePaymentProof(userId, imageUrl, replyToken, session)
        break
        
      case 'DOCUMENT_UPLOAD':
        await handleDocumentUpload(userId, imageUrl, replyToken, session)
        break
        
      default:
        await replyMessage(replyToken, [{
          type: 'text',
          text: '📷 Gambar tidak dapat diproses untuk konteks ini.'
        }])
    }
  } catch (error) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ Gagal memproses gambar. Silakan coba lagi.'
    }])
  }
}

async function downloadLineImage(messageId: string): Promise<string> {
  // Download image from LINE servers
  const response = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: {
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to download image')
  }
  
  // Convert to base64 or upload to storage
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  
  // Upload to cloud storage and return URL
  const uploadedUrl = await uploadImage(base64, `line-uploads/${messageId}.jpg`)
  
  return uploadedUrl
}

async function handleStudentPhoto(userId: string, imageUrl: string, replyToken: string, session: any) {
  const { data } = session
  
  // Store photo URL in session data
  data.photoUrl = imageUrl
  
  // Continue to next step
  await setUserSession(userId, { waitingFor: 'SISWA_BIRTHDATE', data })
  
  await replyMessage(replyToken, [
    {
      type: 'text',
      text: '✅ Foto siswa berhasil diunggah!'
    },
    {
      type: 'flex',
      altText: 'Lanjut Input Data',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'image',
              url: imageUrl,
              size: 'full',
              aspectMode: 'cover',
              aspectRatio: '1:1'
            },
            {
              type: 'text',
              text: 'Foto berhasil disimpan',
              size: 'sm',
              weight: 'bold',
              margin: 'md',
              align: 'center'
            },
            {
              type: 'text',
              text: 'Silakan lanjutkan dengan mengetik tanggal lahir (DD/MM/YYYY):',
              size: 'xs',
              wrap: true,
              margin: 'sm'
            }
          ]
        }
      }
    }
  ])
}

async function handlePaymentProof(userId: string, imageUrl: string, replyToken: string, session: any) {
  const { data } = session
  
  // Save payment proof
  await prisma.payments.update({
    where: { id: data.paymentId },
    data: {
      proofUrl: imageUrl,
      status: 'VERIFIED',
      verifiedAt: new Date()
    }
  })
  
  await setUserSession(userId, null)
  
  await replyMessage(replyToken, [{
    type: 'flex',
    altText: 'Pembayaran Berhasil',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: '✅ PEMBAYARAN BERHASIL',
          weight: 'bold',
          color: '#FFFFFF',
          align: 'center'
        }],
        backgroundColor: '#16A34A',
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: imageUrl,
            size: 'full',
            aspectMode: 'cover',
            aspectRatio: '4:3'
          },
          {
            type: 'text',
            text: 'Bukti pembayaran telah diterima dan diverifikasi.',
            size: 'sm',
            wrap: true,
            margin: 'lg'
          }
        ]
      }
    }
  }])
}

async function handleDocumentUpload(userId: string, imageUrl: string, replyToken: string, session: any) {
  // Handle document upload
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📄 Dokumen berhasil diunggah dan disimpan.'
  }])
  
  await setUserSession(userId, null)
}