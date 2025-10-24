import type { MessageTemplate } from './whatsapp-service';

// Predefined message templates for common notifications
export const WHATSAPP_TEMPLATES = {
  // Payment reminder template
  payment_reminder: {
    name: 'payment_reminder',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '💳 Pengingat Pembayaran SPP',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum {{1}},\n\nTerdapat tagihan {{2}} untuk {{3}} sebesar {{4}} yang akan jatuh tempo pada {{5}}.\n\nMohon segera melakukan pembayaran untuk menghindari denda keterlambatan.\n\nBarakallahu fiikum.',
        example: {
          body_text: [['Bapak Ahmad', 'SPP Bulan Oktober', 'Ahmad Zein', 'Rp 500.000', '10 Oktober 2024']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'URL' as const,
            text: 'Bayar Sekarang',
            url: 'https://ponpesimamsyafii.id/payments/{{6}}',
          },
          {
            type: 'QUICK_REPLY' as const,
            text: 'Info Lebih Lanjut',
          },
        ],
      },
    ],
  } as MessageTemplate,

  // Grade update template
  grade_update: {
    name: 'grade_update',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '📊 Update Nilai Akademik',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum {{1}},\n\nNilai {{2}} untuk {{3}} telah diperbarui:\n\n📚 Mata Pelajaran: {{4}}\n🎯 Nilai: {{5}}\n📅 Semester: {{6}}\n👨‍🏫 Guru: {{7}}\n\nAlhamdulillah, semoga prestasi ini menjadi motivasi untuk terus belajar.',
        example: {
          body_text: [['Ibu Fatimah', 'Ujian Tengah Semester', 'Fatimah Az-Zahra', 'Matematika', '85', 'Ganjil 2024/2025', 'Ustadz Ahmad']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'URL' as const,
            text: 'Lihat Rapor Lengkap',
            url: 'https://ponpesimamsyafii.id/grades/{{8}}',
          },
        ],
      },
    ],
  } as MessageTemplate,

  // Attendance alert template
  attendance_alert: {
    name: 'attendance_alert',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '📅 Informasi Kehadiran',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum {{1}},\n\n{{2}} {{3}} pada tanggal {{4}}.\n\nStatus: {{5}}\nKeterangan: {{6}}\n\nMohon perhatikan kehadiran putra/putri Anda di sekolah.',
        example: {
          body_text: [['Bapak Umar', 'Umar bin Khattab', 'tidak hadir', '25 Oktober 2024', 'Sakit', 'Demam tinggi']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'URL' as const,
            text: 'Lihat Kehadiran',
            url: 'https://ponpesimamsyafii.id/attendance/{{7}}',
          },
        ],
      },
    ],
  } as MessageTemplate,

  // Hafalan progress template
  hafalan_progress: {
    name: 'hafalan_progress',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '📖 Progress Hafalan Al-Quran',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum {{1}},\n\nAlhamdulillah, {{2}} telah menyelesaikan hafalan:\n\n📚 Surah: {{3}}\n🎯 Ayat: {{4}}\n⭐ Kualitas: {{5}}\n👨‍🏫 Ustadz: {{6}}\n\nMay Allah bless their memorization journey. Semoga menjadi amal jariyah yang terus mengalir.',
        example: {
          body_text: [['Ibu Khadijah', 'Ali ibn Abi Talib', 'Al-Mulk', '1-30 (Lengkap)', 'Baik Sekali', 'Ustadz Mahmud']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'URL' as const,
            text: 'Lihat Progress Lengkap',
            url: 'https://ponpesimamsyafii.id/hafalan/{{7}}',
          },
        ],
      },
    ],
  } as MessageTemplate,

  // Achievement notification template
  achievement_notification: {
    name: 'achievement_notification',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '🏆 Prestasi Gemilang!',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum {{1}},\n\nAlhamdulillahi rabbil alamiin! {{2}} telah meraih prestasi:\n\n🎖️ {{3}}\n📝 {{4}}\n📅 {{5}}\n\nSemoga prestasi ini menjadi motivasi untuk terus berprestasi dan menjadi generasi Qurani yang gemilang.',
        example: {
          body_text: [['Bapak Salman', 'Salman Al-Farisi', 'Juara 1 Lomba Tahfidz Tingkat Kota', 'Berhasil menghafal 5 Juz dengan sangat baik', '20 Oktober 2024']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
    ],
  } as MessageTemplate,

  // General announcement template
  general_announcement: {
    name: 'general_announcement',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '📢 Pengumuman Penting',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum warahmatullahi wabarakatuh,\n\n{{1}}\n\n{{2}}\n\nBarakallahu fiikum.',
        example: {
          body_text: [['Pengumuman Libur Hari Raya', 'Pondok Pesantren akan libur mulai tanggal 10-17 April 2024 dalam rangka Hari Raya Idul Fitri. Kegiatan akan dimulai kembali pada tanggal 18 April 2024.']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
    ],
  } as MessageTemplate,

  // Event reminder template
  event_reminder: {
    name: 'event_reminder',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '🗓️ Pengingat Kegiatan',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum {{1}},\n\nMengingatkan kembali kegiatan:\n\n📅 Kegiatan: {{2}}\n🕐 Waktu: {{3}}\n📍 Tempat: {{4}}\n📝 Catatan: {{5}}\n\nMohon hadir tepat waktu. Barakallahu fiikum.',
        example: {
          body_text: [['Wali Santri', 'Kajian Bulanan Para Orang Tua', 'Sabtu, 28 Oktober 2024 - 14:00 WIB', 'Aula Pondok Pesantren', 'Membawa alat tulis dan buku catatan']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'QUICK_REPLY' as const,
            text: 'Konfirmasi Kehadiran',
          },
        ],
      },
    ],
  } as MessageTemplate,

  // Welcome new student template
  welcome_new_student: {
    name: 'welcome_new_student',
    language: 'id',
    category: 'UTILITY' as const,
    components: [
      {
        type: 'HEADER' as const,
        format: 'TEXT' as const,
        text: '🎉 Selamat Datang!',
      },
      {
        type: 'BODY' as const,
        text: 'Assalamu\'alaikum warahmatullahi wabarakatuh {{1}},\n\nAlhamdulillah, {{2}} telah resmi terdaftar sebagai santri Pondok Pesantren Imam Syafi\'i.\n\n🆔 No. Induk: {{3}}\n🏫 Kelas: {{4}}\n📅 Mulai: {{5}}\n\nSemoga menjadi santri yang sholeh/sholehah dan berprestasi. Marhaban bikum!',
        example: {
          body_text: [['Bapak Abdullah', 'Abdullah As-Siddiq', 'PPS2024001', 'VII-A', '15 Juli 2024']],
        },
      },
      {
        type: 'FOOTER' as const,
        text: 'Pondok Pesantren Imam Syafi\'i',
      },
      {
        type: 'BUTTONS' as const,
        buttons: [
          {
            type: 'URL' as const,
            text: 'Portal Orang Tua',
            url: 'https://ponpesimamsyafii.id/parent-portal',
          },
        ],
      },
    ],
  } as MessageTemplate,
};

// Helper function to get template by name
export function getWhatsAppTemplate(name: keyof typeof WHATSAPP_TEMPLATES): MessageTemplate | null {
  return WHATSAPP_TEMPLATES[name] || null;
}

// Helper function to format template parameters
export function formatTemplateParameters(
  templateName: keyof typeof WHATSAPP_TEMPLATES,
  params: Record<string, string>
): string[] {
  const paramArray: string[] = [];

  switch (templateName) {
    case 'payment_reminder':
      paramArray.push(
        params.parentName || '',
        params.billType || '',
        params.studentName || '',
        params.amount || '',
        params.dueDate || '',
        params.paymentUrl || ''
      );
      break;

    case 'grade_update':
      paramArray.push(
        params.parentName || '',
        params.examType || '',
        params.studentName || '',
        params.subject || '',
        params.grade || '',
        params.semester || '',
        params.teacher || '',
        params.gradeUrl || ''
      );
      break;

    case 'attendance_alert':
      paramArray.push(
        params.parentName || '',
        params.studentName || '',
        params.status || '',
        params.date || '',
        params.statusDescription || '',
        params.notes || '',
        params.attendanceUrl || ''
      );
      break;

    case 'hafalan_progress':
      paramArray.push(
        params.parentName || '',
        params.studentName || '',
        params.surah || '',
        params.ayat || '',
        params.quality || '',
        params.teacher || '',
        params.progressUrl || ''
      );
      break;

    case 'achievement_notification':
      paramArray.push(
        params.parentName || '',
        params.studentName || '',
        params.achievementTitle || '',
        params.achievementDescription || '',
        params.date || ''
      );
      break;

    case 'general_announcement':
      paramArray.push(
        params.title || '',
        params.content || ''
      );
      break;

    case 'event_reminder':
      paramArray.push(
        params.recipientName || '',
        params.eventName || '',
        params.eventTime || '',
        params.eventLocation || '',
        params.notes || ''
      );
      break;

    case 'welcome_new_student':
      paramArray.push(
        params.parentName || '',
        params.studentName || '',
        params.studentId || '',
        params.className || '',
        params.startDate || ''
      );
      break;
  }

  return paramArray;
}

// Common message builder functions
export const WhatsAppMessageBuilder = {
  paymentReminder: (data: {
    parentName: string;
    studentName: string;
    billType: string;
    amount: string;
    dueDate: string;
    paymentUrl?: string;
  }) => {
    const message = `*💳 Pengingat Pembayaran SPP*

Assalamu'alaikum ${data.parentName},

Terdapat tagihan ${data.billType} untuk ${data.studentName} sebesar ${data.amount} yang akan jatuh tempo pada ${data.dueDate}.

Mohon segera melakukan pembayaran untuk menghindari denda keterlambatan.

${data.paymentUrl ? `🔗 Bayar sekarang: ${data.paymentUrl}` : ''}

Barakallahu fiikum.

_Pondok Pesantren Imam Syafi'i_`;
    
    return message;
  },

  gradeUpdate: (data: {
    parentName: string;
    studentName: string;
    subject: string;
    grade: string;
    semester: string;
    teacher: string;
  }) => {
    const message = `*📊 Update Nilai Akademik*

Assalamu'alaikum ${data.parentName},

Nilai untuk ${data.studentName} telah diperbarui:

📚 Mata Pelajaran: ${data.subject}
🎯 Nilai: ${data.grade}
📅 Semester: ${data.semester}
👨‍🏫 Guru: ${data.teacher}

Alhamdulillah, semoga prestasi ini menjadi motivasi untuk terus belajar.

_Pondok Pesantren Imam Syafi'i_`;
    
    return message;
  },

  attendanceAlert: (data: {
    parentName: string;
    studentName: string;
    date: string;
    status: string;
    notes?: string;
  }) => {
    const statusText = {
      ALPHA: 'tidak hadir tanpa keterangan',
      SAKIT: 'tidak hadir karena sakit',
      IZIN: 'tidak hadir dengan izin',
      TERLAMBAT: 'terlambat',
    }[data.status] || 'tidak hadir';

    const message = `*📅 Informasi Kehadiran*

Assalamu'alaikum ${data.parentName},

${data.studentName} ${statusText} pada tanggal ${data.date}.

${data.notes ? `Keterangan: ${data.notes}` : ''}

Mohon perhatikan kehadiran putra/putri Anda di sekolah.

_Pondok Pesantren Imam Syafi'i_`;
    
    return message;
  },

  hafalan_progress: (data: {
    parentName: string;
    studentName: string;
    surah: string;
    progress: string;
    teacher: string;
  }) => {
    const message = `*📖 Progress Hafalan Al-Quran*

Assalamu'alaikum ${data.parentName},

Alhamdulillah, ${data.studentName} telah menyelesaikan hafalan:

📚 Surah: ${data.surah}
⭐ Progress: ${data.progress}
👨‍🏫 Ustadz: ${data.teacher}

May Allah bless their memorization journey. Semoga menjadi amal jariyah yang terus mengalir.

_Pondok Pesantren Imam Syafi'i_`;
    
    return message;
  },

  achievementNotification: (data: {
    parentName: string;
    studentName: string;
    achievementTitle: string;
    achievementDescription: string;
  }) => {
    const message = `*🏆 Prestasi Gemilang!*

Assalamu'alaikum ${data.parentName},

Alhamdulillahi rabbil alamiin! ${data.studentName} telah meraih prestasi:

🎖️ ${data.achievementTitle}
📝 ${data.achievementDescription}

Semoga prestasi ini menjadi motivasi untuk terus berprestasi dan menjadi generasi Qurani yang gemilang.

_Pondok Pesantren Imam Syafi'i_`;
    
    return message;
  },

  generalAnnouncement: (data: {
    title: string;
    content: string;
  }) => {
    const message = `*📢 ${data.title}*

Assalamu'alaikum warahmatullahi wabarakatuh,

${data.content}

Barakallahu fiikum.

_Pondok Pesantren Imam Syafi'i_`;
    
    return message;
  },
};