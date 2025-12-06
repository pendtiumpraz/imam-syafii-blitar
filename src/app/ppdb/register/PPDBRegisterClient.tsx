'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  School,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Heart,
} from 'lucide-react';

interface FormData {
  // Personal
  fullName: string;
  nickname: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  nik: string;
  nisn: string;
  
  // Address
  address: string;
  rt: string;
  rw: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  
  // Education
  level: string;
  previousSchool: string;
  gradeTarget: string;
  programType: string;
  boardingType: string;
  
  // Father
  fatherName: string;
  fatherNik: string;
  fatherJob: string;
  fatherPhone: string;
  fatherEducation: string;
  fatherIncome: string;
  
  // Mother
  motherName: string;
  motherNik: string;
  motherJob: string;
  motherPhone: string;
  motherEducation: string;
  motherIncome: string;
  
  // Guardian
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianAddress: string;
  
  // Contact
  phoneNumber: string;
  whatsapp: string;
  email: string;
  
  // Health
  bloodType: string;
  height: string;
  weight: string;
  specialNeeds: string;
  medicalHistory: string;
  
  // Documents
  documents: Array<{
    type: string;
    fileName: string;
    url: string;
    status: string;
  }>;
}

const initialFormData: FormData = {
  fullName: '',
  nickname: '',
  gender: '',
  birthPlace: '',
  birthDate: '',
  nik: '',
  nisn: '',
  address: '',
  rt: '',
  rw: '',
  village: '',
  district: '',
  city: 'Blitar',
  province: 'Jawa Timur',
  postalCode: '',
  level: '',
  previousSchool: '',
  gradeTarget: '',
  programType: 'REGULER',
  boardingType: '',
  fatherName: '',
  fatherNik: '',
  fatherJob: '',
  fatherPhone: '',
  fatherEducation: '',
  fatherIncome: '',
  motherName: '',
  motherNik: '',
  motherJob: '',
  motherPhone: '',
  motherEducation: '',
  motherIncome: '',
  guardianName: '',
  guardianRelation: '',
  guardianPhone: '',
  guardianAddress: '',
  phoneNumber: '',
  whatsapp: '',
  email: '',
  bloodType: '',
  height: '',
  weight: '',
  specialNeeds: '',
  medicalHistory: '',
  documents: [],
};

export default function PPDBRegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState('');

  useEffect(() => {
    const level = searchParams.get('level');
    if (level) {
      setFormData(prev => ({ ...prev, level }));
    }
    
    // Load saved draft from localStorage
    const savedDraft = localStorage.getItem('ppdb_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [searchParams]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('ppdb_draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const steps = [
    { number: 1, title: 'Data Calon Santri/Siswa', icon: User, subtitle: 'Informasi pribadi dan alamat' },
    { number: 2, title: 'Data Orang Tua/Wali', icon: Users, subtitle: 'Informasi ayah, ibu, dan wali' },
    { number: 3, title: 'Data Pendidikan Sebelumnya', icon: School, subtitle: 'Riwayat dan pilihan program' },
    { number: 4, title: 'Upload Dokumen', icon: FileText, subtitle: 'Berkas pendukung pendaftaran' },
    { number: 5, title: 'Pilihan Program & Konfirmasi', icon: CheckCircle, subtitle: 'Review dan konfirmasi data' },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.fullName) newErrors.fullName = 'Nama lengkap wajib diisi';
        if (!formData.gender) newErrors.gender = 'Jenis kelamin wajib dipilih';
        if (!formData.birthPlace) newErrors.birthPlace = 'Tempat lahir wajib diisi';
        if (!formData.birthDate) newErrors.birthDate = 'Tanggal lahir wajib diisi';
        if (!formData.address) newErrors.address = 'Alamat wajib diisi';
        if (!formData.village) newErrors.village = 'Kelurahan wajib diisi';
        if (!formData.district) newErrors.district = 'Kecamatan wajib diisi';
        if (!formData.city) newErrors.city = 'Kota wajib diisi';
        if (!formData.whatsapp) newErrors.whatsapp = 'Nomor WhatsApp wajib diisi';
        break;
      case 2:
        if (!formData.fatherName) newErrors.fatherName = 'Nama ayah wajib diisi';
        if (!formData.motherName) newErrors.motherName = 'Nama ibu wajib diisi';
        break;
      case 3:
        if (!formData.level) newErrors.level = 'Jenjang pendidikan wajib dipilih';
        if (formData.level === 'PONDOK' && !formData.boardingType) {
          newErrors.boardingType = 'Tipe asrama wajib dipilih';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ppdb/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setRegistrationId(result.data.id);
        localStorage.removeItem('ppdb_draft');
        // Redirect to success page
        router.push(`/ppdb/success?id=${result.data.id}&no=${result.data.registrationNo}`);
      } else {
        alert(result.error || 'Terjadi kesalahan saat mendaftar');
      }
    } catch (error) {
      alert('Gagal mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    if (!registrationId) {
      // If no registration ID yet, create a draft registration
      try {
        const response = await fetch('/api/ppdb/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, status: 'DRAFT' }),
        });
        const result = await response.json();
        if (result.success) {
          setRegistrationId(result.data.id);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        alert('Gagal membuat draft pendaftaran. Silakan coba lagi.');
        return;
      }
    }

    setUploadingDoc(documentType);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('registrationId', registrationId);

      const response = await fetch('/api/ppdb/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update form data with new document
        const newDoc = {
          type: documentType,
          fileName: file.name,
          url: result.data.url,
          uploadedAt: result.data.uploadedAt,
          fileSize: result.data.size,
          fileType: result.data.type,
          status: 'uploaded'
        };

        updateFormData('documents', [
          ...((formData as any).documents || []).filter((d: any) => d.type !== documentType),
          newDoc
        ]);
      } else {
        alert(result.error || 'Gagal mengupload file');
      }
    } catch (error) {
      alert('Gagal mengupload file. Silakan coba lagi.');
    } finally {
      setUploadingDoc('');
    }
  };

  const handleDocumentDelete = async (documentType: string) => {
    if (!registrationId) return;

    try {
      const response = await fetch(`/api/ppdb/upload?registrationId=${registrationId}&documentType=${documentType}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        updateFormData('documents', (formData.documents || []).filter(d => d.type !== documentType));
      } else {
        alert(result.error || 'Gagal menghapus file');
      }
    } catch (error) {
      alert('Gagal menghapus file. Silakan coba lagi.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Data Pribadi Calon Siswa</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nama lengkap sesuai akta"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => updateFormData('nickname', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Nama panggilan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Lahir *
                </label>
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => updateFormData('birthPlace', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.birthPlace ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Kota tempat lahir"
                />
                {errors.birthPlace && (
                  <p className="text-red-500 text-sm mt-1">{errors.birthPlace}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => updateFormData('birthDate', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.birthDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.birthDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIK
                </label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => updateFormData('nik', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Nomor Induk Kependudukan"
                  maxLength={16}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NISN
                </label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={(e) => updateFormData('nisn', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Nomor Induk Siswa Nasional"
                  maxLength={10}
                />
              </div>
            </div>

            <h4 className="text-lg font-semibold mt-8 mb-4">Alamat Lengkap</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Alamat lengkap (nama jalan, nomor rumah, dll)"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RT
                  </label>
                  <input
                    type="text"
                    value={formData.rt}
                    onChange={(e) => updateFormData('rt', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="001"
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RW
                  </label>
                  <input
                    type="text"
                    value={formData.rw}
                    onChange={(e) => updateFormData('rw', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="001"
                    maxLength={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="66111"
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelurahan/Desa *
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => updateFormData('village', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.village ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nama kelurahan/desa"
                  />
                  {errors.village && (
                    <p className="text-red-500 text-sm mt-1">{errors.village}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateFormData('district', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nama kecamatan"
                  />
                  {errors.district && (
                    <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota/Kabupaten *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nama kota/kabupaten"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
              </div>
            </div>

            <h4 className="text-lg font-semibold mt-8 mb-4">Informasi Kontak</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp *
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => updateFormData('whatsapp', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="08xx-xxxx-xxxx"
                />
                {errors.whatsapp && (
                  <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <h4 className="text-lg font-semibold mt-8 mb-4">Informasi Kesehatan</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Golongan Darah
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => updateFormData('bloodType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih golongan darah</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateFormData('height', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kebutuhan Khusus
                </label>
                <input
                  type="text"
                  value={formData.specialNeeds}
                  onChange={(e) => updateFormData('specialNeeds', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Kosongkan jika tidak ada"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Riwayat Penyakit
                </label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => updateFormData('medicalHistory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Tuliskan riwayat penyakit yang perlu diketahui (jika ada)"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Data Orang Tua</h3>
            
            {/* Father Data */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-blue-900">Data Ayah</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Ayah *
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => updateFormData('fatherName', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.fatherName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nama lengkap ayah"
                  />
                  {errors.fatherName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fatherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIK Ayah
                  </label>
                  <input
                    type="text"
                    value={formData.fatherNik}
                    onChange={(e) => updateFormData('fatherNik', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="NIK ayah"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pekerjaan Ayah
                  </label>
                  <input
                    type="text"
                    value={formData.fatherJob}
                    onChange={(e) => updateFormData('fatherJob', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Pekerjaan ayah"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. HP Ayah
                  </label>
                  <input
                    type="text"
                    value={formData.fatherPhone}
                    onChange={(e) => updateFormData('fatherPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pendidikan Ayah
                  </label>
                  <select
                    value={formData.fatherEducation}
                    onChange={(e) => updateFormData('fatherEducation', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih pendidikan</option>
                    <option value="SD">SD/MI</option>
                    <option value="SMP">SMP/MTs</option>
                    <option value="SMA">SMA/MA/SMK</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penghasilan Ayah
                  </label>
                  <select
                    value={formData.fatherIncome}
                    onChange={(e) => updateFormData('fatherIncome', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih range</option>
                    <option value="< 1jt">Kurang dari 1 juta</option>
                    <option value="1-3jt">1 - 3 juta</option>
                    <option value="3-5jt">3 - 5 juta</option>
                    <option value="5-10jt">5 - 10 juta</option>
                    <option value="> 10jt">Lebih dari 10 juta</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mother Data */}
            <div className="bg-pink-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-pink-900">Data Ibu</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Ibu *
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => updateFormData('motherName', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.motherName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nama lengkap ibu"
                  />
                  {errors.motherName && (
                    <p className="text-red-500 text-sm mt-1">{errors.motherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIK Ibu
                  </label>
                  <input
                    type="text"
                    value={formData.motherNik}
                    onChange={(e) => updateFormData('motherNik', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="NIK ibu"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pekerjaan Ibu
                  </label>
                  <input
                    type="text"
                    value={formData.motherJob}
                    onChange={(e) => updateFormData('motherJob', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Pekerjaan ibu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. HP Ibu
                  </label>
                  <input
                    type="text"
                    value={formData.motherPhone}
                    onChange={(e) => updateFormData('motherPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pendidikan Ibu
                  </label>
                  <select
                    value={formData.motherEducation}
                    onChange={(e) => updateFormData('motherEducation', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih pendidikan</option>
                    <option value="SD">SD/MI</option>
                    <option value="SMP">SMP/MTs</option>
                    <option value="SMA">SMA/MA/SMK</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penghasilan Ibu
                  </label>
                  <select
                    value={formData.motherIncome}
                    onChange={(e) => updateFormData('motherIncome', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih range</option>
                    <option value="< 1jt">Kurang dari 1 juta</option>
                    <option value="1-3jt">1 - 3 juta</option>
                    <option value="3-5jt">3 - 5 juta</option>
                    <option value="5-10jt">5 - 10 juta</option>
                    <option value="> 10jt">Lebih dari 10 juta</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Guardian Data (Optional) */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-900">
                Data Wali (Opsional - jika berbeda dengan orang tua)
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Wali
                  </label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => updateFormData('guardianName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Nama lengkap wali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hubungan dengan Calon Siswa
                  </label>
                  <input
                    type="text"
                    value={formData.guardianRelation}
                    onChange={(e) => updateFormData('guardianRelation', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Paman, Kakek, dll"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. HP Wali
                  </label>
                  <input
                    type="text"
                    value={formData.guardianPhone}
                    onChange={(e) => updateFormData('guardianPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Wali
                  </label>
                  <input
                    type="text"
                    value={formData.guardianAddress}
                    onChange={(e) => updateFormData('guardianAddress', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Alamat lengkap wali"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Informasi Pendidikan</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenjang Pendidikan *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => updateFormData('level', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.level ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih jenjang</option>
                  <option value="KB_TK">KB-TK (Kelompok Bermain & Taman Kanak-Kanak)</option>
                  <option value="SD">SD (Sekolah Dasar Islam)</option>
                  <option value="SMP">SMP (Sekolah Menengah Pertama Islam)</option>
                  <option value="SMA">SMA (Sekolah Menengah Atas Islam)</option>
                  <option value="PONDOK">Pondok Pesantren</option>
                </select>
                {errors.level && (
                  <p className="text-red-500 text-sm mt-1">{errors.level}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asal Sekolah
                </label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => updateFormData('previousSchool', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Nama sekolah sebelumnya"
                />
              </div>

              {formData.level && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kelas yang Dituju
                    </label>
                    <select
                      value={formData.gradeTarget}
                      onChange={(e) => updateFormData('gradeTarget', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih kelas</option>
                      {(formData.level === 'TK' || formData.level === 'KB_TK') && (
                        <>
                          <option value="KB">Kelompok Bermain</option>
                          <option value="TK A">TK A</option>
                          <option value="TK B">TK B</option>
                        </>
                      )}
                      {formData.level === 'SD' && (
                        <>
                          <option value="1">Kelas 1</option>
                          <option value="2">Kelas 2</option>
                          <option value="3">Kelas 3</option>
                          <option value="4">Kelas 4</option>
                          <option value="5">Kelas 5</option>
                          <option value="6">Kelas 6</option>
                        </>
                      )}
                      {formData.level === 'SMP' && (
                        <>
                          <option value="7">Kelas 7</option>
                          <option value="8">Kelas 8</option>
                          <option value="9">Kelas 9</option>
                        </>
                      )}
                      {formData.level === 'SMA' && (
                        <>
                          <option value="10">Kelas 10</option>
                          <option value="11">Kelas 11</option>
                          <option value="12">Kelas 12</option>
                        </>
                      )}
                      {formData.level === 'PONDOK' && (
                        <>
                          <option value="1 Ibtidaiyah">Kelas 1 Ibtidaiyah</option>
                          <option value="1 Tsanawiyah">Kelas 1 Tsanawiyah</option>
                          <option value="1 Aliyah">Kelas 1 Aliyah</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program
                    </label>
                    <select
                      value={formData.programType}
                      onChange={(e) => updateFormData('programType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="REGULER">Reguler</option>
                      {formData.level === 'PONDOK' && (
                        <>
                          <option value="TAHFIDZ">Tahfidz Al-Quran</option>
                          <option value="KITAB">Kitab Kuning Intensif</option>
                        </>
                      )}
                    </select>
                  </div>

                  {formData.level === 'PONDOK' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipe Asrama *
                      </label>
                      <select
                        value={formData.boardingType}
                        onChange={(e) => updateFormData('boardingType', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                          errors.boardingType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Pilih tipe</option>
                        <option value="MONDOK">Mondok (Asrama)</option>
                        <option value="PULANG">Pulang Pergi</option>
                      </select>
                      {errors.boardingType && (
                        <p className="text-red-500 text-sm mt-1">{errors.boardingType}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {formData.level === 'PONDOK' && formData.boardingType === 'MONDOK' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-semibold">Informasi Asrama</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Santri yang mondok wajib tinggal di asrama dan mengikuti seluruh kegiatan pondok.
                      Biaya asrama sudah termasuk makan 3x sehari dan laundry.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Upload Dokumen Pendaftaran</h3>
            
            {/* Contact Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-blue-900">Informasi Kontak</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => updateFormData('whatsapp', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="08xx-xxxx-xxxx"
                  />
                  {errors.whatsapp && (
                    <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-green-900">Informasi Kesehatan</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => updateFormData('bloodType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih golongan darah</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tinggi Badan (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateFormData('height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateFormData('weight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kebutuhan Khusus
                  </label>
                  <input
                    type="text"
                    value={formData.specialNeeds}
                    onChange={(e) => updateFormData('specialNeeds', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Kosongkan jika tidak ada"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Riwayat Penyakit
                  </label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => updateFormData('medicalHistory', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Tuliskan riwayat penyakit yang perlu diketahui (jika ada)"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Pilihan Program & Konfirmasi Data</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold">Petunjuk Upload</p>
                  <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                    <li>• Format file: JPG, PNG, atau PDF</li>
                    <li>• Ukuran maksimal: 2MB per file</li>
                    <li>• Pastikan dokumen dapat terbaca dengan jelas</li>
                    <li>• Dokumen akan diverifikasi oleh admin</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { type: 'akta', label: 'Akta Kelahiran', required: true },
                { type: 'kk', label: 'Kartu Keluarga', required: true },
                { type: 'foto', label: 'Pas Foto 3x4', required: true },
                { type: 'ijazah', label: 'Ijazah/Raport Terakhir', required: formData.level !== 'TK' && formData.level !== 'KB_TK' },
                { type: 'sehat', label: 'Surat Keterangan Sehat', required: true },
                { type: 'kip', label: 'Kartu Indonesia Pintar (jika ada)', required: false },
              ].map((doc) => {
                const uploadedDoc = (formData.documents || []).find(d => d.type === doc.type);
                const isUploading = uploadingDoc === doc.type;
                
                return (
                  <div key={doc.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {doc.label} {doc.required && '*'}
                      </label>
                      {uploadedDoc ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Uploaded
                          </span>
                          <a 
                            href={uploadedDoc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            Preview
                          </a>
                        </div>
                      ) : isUploading ? (
                        <span className="text-blue-600 text-sm flex items-center gap-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </div>
                    
                    {uploadedDoc && (
                      <div className="text-xs text-gray-500 mb-2">
                        {uploadedDoc.fileName} ({(uploadedDoc as any).fileSize ? ((uploadedDoc as any).fileSize / 1024).toFixed(1) : '0'} KB)
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(file, doc.type);
                            }
                          }}
                          disabled={isUploading}
                          className="hidden"
                        />
                        <div className={`px-4 py-2 text-white rounded-lg text-center transition-colors ${
                          isUploading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                        }`}>
                          {isUploading ? (
                            <>
                              <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : uploadedDoc ? (
                            <>
                              <Upload className="w-5 h-5 inline mr-2" />
                              Replace File
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 inline mr-2" />
                              Upload File
                            </>
                          )}
                        </div>
                      </label>
                      
                      {uploadedDoc && !isUploading && (
                        <button
                          onClick={() => handleDocumentDelete(doc.type)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Hapus dokumen"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Konfirmasi Data Pendaftaran</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-semibold">Data Anda Sudah Lengkap!</p>
                  <p className="text-green-700 text-sm mt-1">
                    Silakan periksa kembali data yang telah Anda isi sebelum mengirim pendaftaran.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary of all data */}
            <div className="space-y-6">
              {/* Personal Data Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Data Pribadi</h4>
                <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">Nama Lengkap:</dt>
                    <dd className="font-medium text-gray-900">{formData.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Jenis Kelamin:</dt>
                    <dd className="font-medium text-gray-900">
                      {formData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Tempat, Tanggal Lahir:</dt>
                    <dd className="font-medium text-gray-900">
                      {formData.birthPlace}, {formData.birthDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Alamat:</dt>
                    <dd className="font-medium text-gray-900">
                      {formData.address}, {formData.village}, {formData.district}, {formData.city}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Parent Data Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Data Orang Tua</h4>
                <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">Nama Ayah:</dt>
                    <dd className="font-medium text-gray-900">{formData.fatherName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Nama Ibu:</dt>
                    <dd className="font-medium text-gray-900">{formData.motherName}</dd>
                  </div>
                </dl>
              </div>

              {/* Education Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Informasi Pendidikan</h4>
                <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">Jenjang:</dt>
                    <dd className="font-medium text-gray-900">{formData.level}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Program:</dt>
                    <dd className="font-medium text-gray-900">{formData.programType}</dd>
                  </div>
                </dl>
              </div>

              {/* Contact Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Kontak</h4>
                <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">WhatsApp:</dt>
                    <dd className="font-medium text-gray-900">{formData.whatsapp}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium text-gray-900">{formData.email || '-'}</dd>
                  </div>
                </dl>
              </div>

              {/* Documents Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Dokumen</h4>
                <div className="space-y-2">
                  {(formData.documents || []).map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-900">{doc.fileName}</span>
                    </div>
                  ))}
                  {(formData.documents || []).length === 0 && (
                    <p className="text-gray-500 text-sm">Belum ada dokumen yang diupload</p>
                  )}
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  required
                />
                <span className="text-sm text-gray-700">
                  Saya menyatakan bahwa data yang saya isi adalah benar dan dapat dipertanggungjawabkan.
                  Saya bersedia menerima konsekuensi jika terdapat data yang tidak sesuai.
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Formulir Pendaftaran PPDB
            </h1>
            <p className="text-gray-600">
              Tahun Ajaran 2025/2026 - Pondok Pesantren Imam Syafi'i Blitar
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep >= step.number
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="text-sm font-semibold">{step.number}</span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-medium text-gray-800">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Sebelumnya
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
                >
                  Selanjutnya
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Kirim Pendaftaran
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Butuh bantuan? Hubungi kami di WhatsApp: 0812-3456-7890</p>
            <p className="mt-1">Atau email: ppdb@ponpesimamsyafii.id</p>
          </div>
        </div>
      </div>
    </div>
  );
}