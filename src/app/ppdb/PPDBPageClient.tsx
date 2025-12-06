'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  GraduationCap,
  FileText,
  CreditCard,
  CheckCircle,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Download,
  School,
  Baby,
  Home,
  Building,
  BookOpen,
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

interface FeeDetail {
  registrationFee: number;
  enrollmentFee: number;
  monthlyFee: number;
  uniformFee: number;
  booksFee: number;
}

interface PPDBSettings {
  academicYear: string;
  openDate: string;
  closeDate: string;
  quotaKBTK: number;
  quotaTK: number;
  quotaSD: number;
  quotaSMP: number;
  quotaSMA: number;
  quotaPondok: number;
  registrationFeeKBTK: number;
  registrationFeeTK: number;
  registrationFeeSD: number;
  registrationFeeSMP: number;
  registrationFeeSMA: number;
  registrationFeePondok: number;
  feeDetails: Record<string, FeeDetail>;
  isActive: boolean;
}

interface Stats {
  [key: string]: {
    registered: number;
    accepted: number;
    enrolled: number;
  };
}

const programConfig = [
  {
    key: 'KB_TK',
    level: 'KB_TK',
    icon: Baby,
    title: 'KB - Taman Kanak-Kanak',
    age: '3-6 tahun',
    quotaKey: 'quotaKBTK',
    feeKey: 'registrationFeeKBTK',
    color: 'from-pink-500 to-rose-600',
    features: [
      'Pembelajaran Al-Quran dasar',
      'Hafalan surat pendek',
      'Akhlak & adab',
      'Bermain sambil belajar'
    ]
  },
  {
    key: 'SD',
    level: 'SD',
    icon: School,
    title: 'Sekolah Dasar Islam',
    age: '7-12 tahun',
    quotaKey: 'quotaSD',
    feeKey: 'registrationFeeSD',
    color: 'from-blue-500 to-indigo-600',
    features: [
      'Kurikulum Nasional + Diniyah',
      'Tahfidz 5 juz',
      'Bahasa Arab & Inggris',
      'Ekstrakurikuler'
    ]
  },
  {
    key: 'SMP',
    level: 'SMP',
    icon: Building,
    title: 'SMP Islam Terpadu',
    age: '13-15 tahun',
    quotaKey: 'quotaSMP',
    feeKey: 'registrationFeeSMP',
    color: 'from-purple-500 to-violet-600',
    features: [
      'Kurikulum Merdeka + Pesantren',
      'Target Tahfidz 10 juz',
      'Bahasa Arab intensif',
      'Asrama (opsional)'
    ]
  },
  {
    key: 'SMA',
    level: 'SMA',
    icon: GraduationCap,
    title: 'SMA Islam Terpadu',
    age: '16-18 tahun',
    quotaKey: 'quotaSMA',
    feeKey: 'registrationFeeSMA',
    color: 'from-orange-500 to-amber-600',
    features: [
      'Jurusan IPA/IPS/Keagamaan',
      'Target Tahfidz 15 juz',
      'Persiapan PTN & Timur Tengah',
      'Asrama (opsional)'
    ]
  },
  {
    key: 'PONDOK',
    level: 'PONDOK',
    icon: Home,
    title: 'Pondok Pesantren',
    age: '13+ tahun',
    quotaKey: 'quotaPondok',
    feeKey: 'registrationFeePondok',
    color: 'from-green-500 to-emerald-600',
    features: [
      'Program Tahfidz 30 juz',
      'Kitab kuning klasik',
      'Bahasa Arab intensif',
      'Full asrama & makan'
    ]
  }
];

const requirements: Record<string, string[]> = {
  KB_TK: [
    'Akta kelahiran',
    'Kartu Keluarga',
    'Pas foto 3x4 (3 lembar)',
    'Surat keterangan sehat'
  ],
  SD: [
    'Akta kelahiran',
    'Kartu Keluarga',
    'Ijazah TK (jika ada)',
    'Pas foto 3x4 (3 lembar)',
    'Surat keterangan sehat',
    'NISN (jika ada)'
  ],
  SMP: [
    'Akta kelahiran',
    'Kartu Keluarga',
    'Ijazah SD/MI',
    'SKHUN/Nilai UN',
    'Pas foto 3x4 (3 lembar)',
    'Surat keterangan sehat',
    'NISN'
  ],
  SMA: [
    'Akta kelahiran',
    'Kartu Keluarga',
    'Ijazah SMP/MTs',
    'SKHUN/Nilai UN',
    'Pas foto 3x4 (3 lembar)',
    'Surat keterangan sehat',
    'NISN',
    'Rapor semester 1-5'
  ],
  PONDOK: [
    'Akta kelahiran',
    'Kartu Keluarga',
    'Ijazah SD/SMP/SMA',
    'Pas foto 3x4 (3 lembar)',
    'Surat keterangan sehat',
    'Surat izin orang tua',
    'Surat keterangan berkelakuan baik'
  ]
};

export default function PPDBPageClient() {
  const [activeTab, setActiveTab] = useState('KB_TK');
  const [settings, setSettings] = useState<PPDBSettings | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/ppdb/settings?academicYear=2024/2025');
      if (response.ok) {
        const data = await response.json();
        const settingsData = data.settings;
        
        // Parse feeDetails if string
        if (typeof settingsData.feeDetails === 'string') {
          try {
            settingsData.feeDetails = JSON.parse(settingsData.feeDetails);
          } catch {
            settingsData.feeDetails = {};
          }
        }
        
        setSettings(settingsData);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching PPDB settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getQuota = (quotaKey: string) => {
    if (!settings) return 0;
    return (settings as any)[quotaKey] || 0;
  };

  const getRegistrationFee = (feeKey: string) => {
    if (!settings) return 0;
    return Number((settings as any)[feeKey]) || 0;
  };

  const getAvailable = (level: string) => {
    const quota = getQuota(programConfig.find(p => p.level === level)?.quotaKey || '');
    const registered = stats[level]?.registered || 0;
    return Math.max(0, quota - registered);
  };

  const getTotalFee = (level: string) => {
    const regFee = getRegistrationFee(programConfig.find(p => p.level === level)?.feeKey || '');
    const feeDetail = settings?.feeDetails?.[level];
    if (!feeDetail) return regFee;
    return regFee + (feeDetail.enrollmentFee || 0);
  };

  const steps = [
    {
      icon: FileText,
      title: 'Isi Formulir',
      description: 'Lengkapi formulir pendaftaran online'
    },
    {
      icon: CreditCard,
      title: 'Pembayaran',
      description: `Bayar biaya pendaftaran`
    },
    {
      icon: Calendar,
      title: 'Jadwal Test',
      description: 'Ikuti test sesuai jadwal yang ditentukan'
    },
    {
      icon: CheckCircle,
      title: 'Pengumuman',
      description: 'Cek hasil seleksi dan daftar ulang'
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Penerimaan Peserta Didik Baru
            </h1>
            <p className="text-xl mb-4 text-green-100">
              Tahun Ajaran {settings?.academicYear || '2024/2025'} - Pondok Pesantren Imam Syafi'i Blitar
            </p>
            {settings && (
              <p className="text-lg mb-8 text-green-200">
                Pendaftaran: {formatDate(settings.openDate)} - {formatDate(settings.closeDate)}
              </p>
            )}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/ppdb/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-green-700 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Daftar Sekarang
                </motion.button>
              </Link>
              <Link href="/ppdb/status">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-green-800/30 backdrop-blur text-white font-bold rounded-xl border-2 border-white/30 hover:bg-green-800/50 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Cek Status
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Program Pendidikan
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {programConfig.map((program, index) => {
                const quota = getQuota(program.quotaKey);
                const available = getAvailable(program.level);
                const totalFee = getTotalFee(program.level);
                
                return (
                  <motion.div
                    key={program.level}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all"
                  >
                    <div className={`p-4 bg-gradient-to-br ${program.color} text-white`}>
                      <program.icon className="w-10 h-10 mb-3" />
                      <h3 className="text-lg font-bold mb-1">{program.title}</h3>
                      <p className="text-white/90 text-sm">Usia {program.age}</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Kuota</p>
                          <p className="text-lg font-bold">{quota}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Tersisa</p>
                          <p className={`text-lg font-bold ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {available}
                          </p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">Biaya Masuk</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(totalFee)}</p>
                      </div>
                      <ul className="space-y-1 mb-4">
                        {program.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={`/ppdb/register?level=${program.level}`}>
                        <button 
                          className={`w-full py-2 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
                            available > 0 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg' 
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                          disabled={available <= 0}
                        >
                          {available > 0 ? (
                            <>
                              Daftar
                              <ArrowRight className="w-4 h-4" />
                            </>
                          ) : (
                            'Kuota Penuh'
                          )}
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Alur Pendaftaran
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Tabs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Persyaratan Pendaftaran
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {Object.keys(requirements).map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveTab(level)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                    activeTab === level
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:shadow'
                  }`}
                >
                  {level === 'KB_TK' ? 'KB-TK' : level}
                </button>
              ))}
            </div>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl p-8"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Dokumen yang diperlukan untuk {activeTab === 'KB_TK' ? 'KB-TK' : activeTab}:
              </h3>
              <ul className="space-y-3">
                {(requirements[activeTab] || []).map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12 text-white">
              <h2 className="text-3xl font-bold mb-6">Informasi & Kontak</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Sekretariat PPDB</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                      <p>Jl. Imam Syafi'i No. 123<br />Blitar, Jawa Timur 66111</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" />
                      <p>0342-123456 / 0812-3456-7890</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <p>ppdb@ponpesimamsyafii.id</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Jam Pelayanan</h3>
                  <div className="space-y-2">
                    <p>Senin - Jumat: 08:00 - 15:00</p>
                    <p>Sabtu: 08:00 - 12:00</p>
                    <p>Minggu & Hari Libur: Tutup</p>
                  </div>
                  <button className="mt-6 px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Download Brosur
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
