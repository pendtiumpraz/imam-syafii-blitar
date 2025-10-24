import { LineEvent } from '@/types/line'
import { replyMessage } from '../client'
import { SessionManager } from '../core/SessionManager'
import { FlowManager } from '../core/FlowManager'
import { getPublicMainMenu, getProfileMenu, getPPDBInfo } from '../templates/PublicMenus'
import { getAdminMainMenu, getStudentManagementMenu, getFinanceManagementMenu } from '../templates/AdminMenus'
import { prisma } from '@/lib/prisma'

// Register all flows
import { addStudentFlow, searchStudentFlow, editStudentFlow, deleteStudentFlow } from '../flows/StudentFlows'
import { askUstadzFlow } from '../flows/TanyaUstadzFlows'

// Register flows on startup
FlowManager.registerFlow(addStudentFlow)
FlowManager.registerFlow(searchStudentFlow)
FlowManager.registerFlow(editStudentFlow)
FlowManager.registerFlow(deleteStudentFlow)
FlowManager.registerFlow(askUstadzFlow)

/**
 * Handle text messages and route to appropriate handler
 */
export async function handleModeTextMessage(event: LineEvent) {
  const text = event.message?.text?.toLowerCase().trim() || ''
  const userId = event.source?.userId || ''
  const replyToken = event.replyToken || ''
  
  console.log('ModeHandler - Text:', text, 'User:', userId)
  
  // Get or create session
  const session = await SessionManager.getSession(userId)
  
  // Check if user is in a flow
  if (session.activeFlowId) {
    console.log('User in flow:', session.activeFlowId)
    
    // Handle flow cancellation
    if (text === 'batal' || text === 'cancel') {
      await FlowManager.abortFlow(userId, replyToken)
      
      // Show appropriate menu based on mode
      if (session.mode === 'ADMIN') {
        await replyMessage(replyToken, [getAdminMainMenu()])
      } else {
        await replyMessage(replyToken, [getPublicMainMenu()])
      }
      return
    }
    
    // Process flow input
    await FlowManager.processInput(userId, text, replyToken)
    return
  }
  
  // Handle mode switching commands
  if (text === '/start' || text === 'start' || text === '/menu' || text === 'menu') {
    // Switch to public mode
    await SessionManager.setAdminMode(userId, false)
    await replyMessage(replyToken, [getPublicMainMenu()])
    return
  }
  
  if (text === '/admin_yys') {
    // Check if user is admin
    const isAdmin = await checkAdminAccess(userId)
    
    if (isAdmin) {
      await SessionManager.setAdminMode(userId, true)
      await replyMessage(replyToken, [getAdminMainMenu()])
    } else {
      await replyMessage(replyToken, [{
        type: 'text',
        text: '❌ Akses ditolak. Anda tidak memiliki hak akses admin.'
      }])
    }
    return
  }
  
  // Default response
  await replyMessage(replyToken, [{
    type: 'text',
    text: '💡 Ketik "menu" untuk menu utama atau "/admin_yys" untuk admin panel'
  }])
}

/**
 * Handle postback events from buttons
 */
export async function handleModePostback(event: LineEvent) {
  const data = event.postback?.data || ''
  const userId = event.source?.userId || ''
  const replyToken = event.replyToken || ''
  
  console.log('ModeHandler - Postback:', data, 'User:', userId)
  
  // Parse action from postback data
  const params = new URLSearchParams(data)
  const action = params.get('action')
  
  if (!action) return
  
  // Get session to check mode
  const session = await SessionManager.getSession(userId)
  
  // Check if user is in a flow - block navigation
  if (session.activeFlowId) {
    if (action === 'cancel') {
      await FlowManager.abortFlow(userId, replyToken)
      
      // Show appropriate menu
      if (session.mode === 'ADMIN') {
        await replyMessage(replyToken, [getAdminMainMenu()])
      } else {
        await replyMessage(replyToken, [getPublicMainMenu()])
      }
    } else {
      await replyMessage(replyToken, [{
        type: 'text',
        text: '⚠️ Anda sedang dalam proses. Selesaikan dulu atau ketik "batal" untuk membatalkan.'
      }])
    }
    return
  }
  
  // Route based on action
  switch (action) {
    // Public actions
    case 'public_profile':
      await replyMessage(replyToken, [getProfileMenu()])
      break
      
    case 'public_ppdb':
      await replyMessage(replyToken, [getPPDBInfo()])
      break
      
    case 'public_activities':
      await showActivities(replyToken)
      break
      
    case 'public_donation':
      await showDonationInfo(replyToken)
      break
      
    case 'public_news':
      await showLatestNews(replyToken)
      break
      
    case 'public_contact':
      await showContactInfo(replyToken)
      break
      
    case 'public_tanya_ustadz':
      await FlowManager.startFlow(userId, 'ask_ustadz', replyToken)
      break
      
    case 'back_to_public_menu':
      await replyMessage(replyToken, [getPublicMainMenu()])
      break
      
    // Admin actions
    case 'admin_students':
      if (await checkAdminSession(userId, replyToken)) {
        await replyMessage(replyToken, [getStudentManagementMenu()])
      }
      break
      
    case 'admin_teachers':
      if (await checkAdminSession(userId, replyToken)) {
        await showTeacherManagement(replyToken)
      }
      break
      
    case 'admin_finance':
      if (await checkAdminSession(userId, replyToken)) {
        await replyMessage(replyToken, [getFinanceManagementMenu()])
      }
      break
      
    case 'admin_reports':
      if (await checkAdminSession(userId, replyToken)) {
        await showReportsMenu(replyToken)
      }
      break
      
    case 'admin_academic':
      if (await checkAdminSession(userId, replyToken)) {
        await showAcademicMenu(replyToken)
      }
      break
      
    case 'admin_classes':
      if (await checkAdminSession(userId, replyToken)) {
        await showClassManagement(replyToken)
      }
      break
      
    case 'admin_broadcast':
      if (await checkAdminSession(userId, replyToken)) {
        await showBroadcastMenu(replyToken)
      }
      break
      
    case 'admin_settings':
      if (await checkAdminSession(userId, replyToken)) {
        await showAdminSettings(replyToken)
      }
      break
      
    case 'back_to_admin_menu':
      if (await checkAdminSession(userId, replyToken)) {
        await replyMessage(replyToken, [getAdminMainMenu()])
      }
      break
      
    case 'admin_logout':
      await SessionManager.setAdminMode(userId, false)
      await replyMessage(replyToken, [{
        type: 'text',
        text: '👋 Anda telah logout dari admin panel'
      }, getPublicMainMenu()])
      break
      
    // Flow actions
    case 'flow_add_student':
      if (await checkAdminSession(userId, replyToken)) {
        await FlowManager.startFlow(userId, 'add_student', replyToken)
      }
      break
      
    case 'flow_search_student':
      if (await checkAdminSession(userId, replyToken)) {
        await FlowManager.startFlow(userId, 'search_student', replyToken)
      }
      break
      
    case 'flow_edit_student':
      if (await checkAdminSession(userId, replyToken)) {
        await FlowManager.startFlow(userId, 'edit_student', replyToken)
      }
      break
      
    case 'flow_delete_student':
      if (await checkAdminSession(userId, replyToken)) {
        await FlowManager.startFlow(userId, 'delete_student', replyToken)
      }
      break
      
    case 'admin_list_students':
      if (await checkAdminSession(userId, replyToken)) {
        await listAllStudents(replyToken)
      }
      break
      
    default:
      console.log('Unknown action:', action)
  }
}

/**
 * Check if user has admin access
 */
async function checkAdminAccess(lineUserId: string): Promise<boolean> {
  // Check in database
  const admin = await prisma.line_admins.findUnique({
    where: { lineUserId },
    select: { isActive: true }
  })
  
  return admin?.isActive || false
}

/**
 * Check if user has active admin session
 */
async function checkAdminSession(userId: string, replyToken: string): Promise<boolean> {
  const session = await SessionManager.getSession(userId)
  
  if (!session.isAdmin) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '❌ Akses ditolak. Silakan login sebagai admin dengan mengetik "/admin_yys"'
    }])
    return false
  }
  
  return true
}

// Helper functions for various features
async function showActivities(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📅 Kegiatan Pondok:\n\n• Senin-Jumat: Tahfidz Pagi (05:00-06:30)\n• Sabtu: Olahraga Bersama (06:00-08:00)\n• Minggu: Kajian Umum (08:00-10:00)\n\n📍 Info lengkap: imam-syafii-blitar.vercel.app/kegiatan'
  }])
}

async function showDonationInfo(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '💰 Informasi Donasi:\n\n🏦 Bank Syariah Indonesia\nNo. Rek: 123-456-7890\na.n. Yayasan Pondok Imam Syafii\n\n📱 Konfirmasi: 0812-3456-7890\n\nJazakumullah khairan katsiran 🤲'
  }])
}

async function showLatestNews(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📰 Berita Terkini:\n\n1. Wisuda Tahfidz Angkatan 15\n2. Pembukaan PPDB 2024/2025\n3. Renovasi Masjid Selesai\n\n📱 Selengkapnya: imam-syafii-blitar.vercel.app/berita'
  }])
}

async function showContactInfo(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📞 Kontak Pondok:\n\n📍 Alamat:\nJl. Pendidikan No. 123\nBlitar, Jawa Timur\n\n📱 Telepon: (0342) 123456\n💬 WhatsApp: 0812-3456-7890\n📧 Email: info@pondokimamsyafii.id\n🌐 Website: imam-syafii-blitar.vercel.app'
  }])
}

async function showTeacherManagement(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '👨‍🏫 Manajemen Pengajar - Coming Soon'
  }])
}

async function showReportsMenu(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📊 Menu Laporan - Coming Soon'
  }])
}

async function showAcademicMenu(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📚 Menu Akademik - Coming Soon'
  }])
}

async function showClassManagement(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '🏫 Manajemen Kelas - Coming Soon'
  }])
}

async function showBroadcastMenu(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '📢 Broadcast Message - Coming Soon'
  }])
}

async function showAdminSettings(replyToken: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: '⚙️ Admin Settings - Coming Soon'
  }])
}

async function listAllStudents(replyToken: string) {
  const students = await prisma.students.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      fullName: true,
      nis: true,
      grade: true
    }
  })
  
  if (students.length === 0) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: '📋 Belum ada data siswa'
    }])
    return
  }
  
  const list = students.map((s, i) => 
    `${i + 1}. ${s.fullName}\n   NIS: ${s.nis}\n   Kelas: ${s.grade || '-'}`
  ).join('\n\n')
  
  await replyMessage(replyToken, [{
    type: 'text',
    text: `📋 Daftar Siswa (10 terbaru):\n\n${list}`
  }])
}