# CATATAN REVISI SISTEM PONDOK IMAM SYAFII

## A. BUG FIXES - Menu Admin

### 1. Menu Data Siswa - Tidak Bisa Diinput
**Status:** ✅ API Sudah Berfungsi
**Masalah:** Form tambah siswa tidak bisa menyimpan data
**Lokasi File:**
- `src/app/(authenticated)/siswa/page.tsx`
- `src/app/api/students/route.ts`
- `src/components/siswa/student-edit-form.tsx`

**Catatan:**
- API POST `/api/students` sudah berfungsi dengan validasi Zod
- Institution type sudah diupdate ke KB_TK, SD, MTQ, MSWi, MSWa, SMP, SMA
- Import CSV sudah tersedia

---

### 2. Menu Data Pengajar - Tidak Bisa Edit/Hapus
**Status:** ✅ SELESAI (2024-12-06)
**Masalah:** Halaman staff menggunakan data lokal (hardcoded), bukan dari database
**Lokasi File:**
- `src/app/(authenticated)/staff/page.tsx`

**Perbaikan yang sudah dilakukan:**
- ✅ Ganti data lokal dengan fetch dari API `/api/users?role=USTADZ`
- ✅ Implementasi fungsi edit dan delete yang terhubung ke API
- ✅ Tambahkan fitur Import/Export CSV

---

### 3. Menu Akademik - Kelas: Pilihan Tahun Ajaran dan Wali Kelas Kosong
**Status:** ✅ API Sudah Berfungsi (Perlu Data di Database)
**Masalah:** Dropdown tahun ajaran dan wali kelas tidak menampilkan data
**Lokasi File:**
- `src/app/(authenticated)/akademik/classes/page.tsx`
- `src/app/api/academic/years/route.ts`
- `src/app/api/users/route.ts`

**Catatan:**
- API sudah memanggil `/api/academic/years` dan `/api/users?role=USTADZ&isActive=true`
- Pastikan ada data tahun ajaran di database (jalankan seeder atau import CSV)
- Pastikan ada data user dengan role USTADZ di database
- Import CSV sudah tersedia untuk kedua entity

---

### 4. Menu Akademik - Mata Pelajaran Tidak Bisa Disimpan
**Status:** ✅ API Sudah Berfungsi
**Masalah:** Form mata pelajaran gagal submit
**Lokasi File:**
- `src/app/(authenticated)/akademik/subjects/page.tsx`
- `src/app/api/academic/subjects/route.ts`

**Catatan:**
- API sudah berfungsi dengan validasi level: KB_TK, SD, MTQ, MSWi, MSWa, SMP, SMA
- Sudah ada fitur Quick Add untuk mata pelajaran Islam
- Import CSV sudah tersedia

---

### 5. Menu Akademik - Raport Siswa: Input Dimana?
**Status:** Klarifikasi
**Penjelasan:** 
- Input nilai dilakukan di menu **Akademik > Nilai (Grades)**
- Raport di-generate otomatis dari data nilai yang sudah diinput
- Alur: Input Nilai → Generate Raport → Cetak/Download PDF

**Lokasi File:**
- `src/app/(authenticated)/akademik/grades/page.tsx` - Input nilai
- `src/app/(authenticated)/akademik/report-cards/page.tsx` - Generate & lihat raport
- `src/app/api/academic/report-cards/route.ts` - API generate raport

---

### 6. Sebagian Besar Menu Belum Bisa Diinput/Disimpan
**Status:** Audit diperlukan
**Daftar Menu yang perlu dicek:**
- [ ] Siswa (students)
- [ ] Staff/Pengajar
- [ ] Kelas (classes)
- [ ] Mata Pelajaran (subjects)
- [ ] Tahun Ajaran (academic years)
- [ ] Semester
- [ ] Nilai (grades)
- [ ] Absensi (attendance)
- [ ] SPP/Pembayaran
- [ ] Donasi
- [ ] Hafalan

---

## B. FORMAT CHANGES

### 7. Format Penyebutan Nama = Nama Lengkap + Gelar
**Status:** Perlu diubah
**Contoh:** 
- Sebelum: `Ahmad Hidayat`
- Sesudah: `Dr. Ahmad Hidayat, S.Pd.I`

**Lokasi yang perlu diubah:**
- Display nama di semua halaman
- Tambah field `title` (gelar depan) dan `suffix` (gelar belakang) di model User/Staff
- Format display: `{title} {fullName}, {suffix}`

**File yang perlu diupdate:**
- Schema Prisma - tambah field gelar
- Semua komponen yang menampilkan nama

---

### 8. Format SKS Diganti dengan Jam
**Status:** Perlu diubah
**Contoh:**
- Sebelum: `2 SKS`
- Sesudah: `2 Jam`

**Lokasi File:**
- `src/app/(authenticated)/akademik/subjects/page.tsx`
  - Line: `<Badge variant="outline">{subject.credits} SKS</Badge>` → `{subject.credits} Jam`
  - Line: `<label className="block text-sm font-medium mb-1">SKS *</label>` → `Jam *`

**File lain yang mungkin perlu diubah:**
- `src/app/(authenticated)/akademik/grades/page.tsx`
- Semua tempat yang menampilkan `credits` atau `SKS`

---

### 9. Format Satuan Pendidikan
**Status:** Perlu diubah
**Perubahan:**
| Sebelum | Sesudah |
|---------|---------|
| TK | KB-TK |
| SD | SD |
| SMP | SMP |
| PONDOK | SMA |

**Lokasi yang perlu diubah:**
- Schema Prisma (enum/string values)
- Semua dropdown/select options
- Semua badge/label display
- API validations

**File yang perlu diupdate:**
- `prisma/schema.prisma` - update institutionType values
- `src/app/(authenticated)/siswa/page.tsx`
- `src/app/(authenticated)/akademik/classes/page.tsx`
- `src/app/(authenticated)/akademik/subjects/page.tsx`
- `src/components/siswa/student-edit-form.tsx`
- Semua API routes yang memvalidasi level/institutionType

---

## C. MENU PUBLIK - PROFIL YAYASAN

### 10. Update Menu Bar Profil untuk Umum
**Status:** Perlu ditambahkan/diupdate

**Struktur Menu Profil yang Dibutuhkan:**

```
PROFIL
├── Identitas Yayasan
├── Latar Belakang
├── Visi & Misi
├── Program & Layanan
│   ├── KB-TK
│   ├── SD
│   ├── SMP (Pesantren)
│   ├── SMA (Pesantren)
│   └── Beasiswa Pendidikan
├── Keunggulan
└── Legalitas (Optional)
```

**File yang ada saat ini:**
- `src/app/about/yayasan/page.tsx`
- `src/app/about/tk/page.tsx`
- `src/app/about/sd/page.tsx`
- `src/app/about/pondok/page.tsx`
- `src/app/about/pengajar/page.tsx`
- `src/app/about/struktur/page.tsx`

**File yang perlu ditambahkan:**
- `src/app/about/latar-belakang/page.tsx`
- `src/app/about/visi-misi/page.tsx`
- `src/app/about/smp/page.tsx` - SMP (Pesantren)
- `src/app/about/sma/page.tsx` - SMA (Pesantren)
- `src/app/about/beasiswa/page.tsx` - Beasiswa Pendidikan
- `src/app/about/keunggulan/page.tsx`
- `src/app/about/legalitas/page.tsx` (optional)

**Update Navigation:**
- Update navbar/menu untuk menampilkan struktur baru
- Update footer links jika ada

---

## D. PRIORITAS PERBAIKAN

### High Priority (Harus segera diperbaiki)
1. Fix input data siswa
2. Fix edit/hapus pengajar
3. Fix dropdown tahun ajaran & wali kelas di kelas
4. Fix simpan mata pelajaran
5. Update menu profil publik

### Medium Priority
6. Audit semua menu input/save
7. Format nama + gelar
8. Format SKS → Jam
9. Format satuan pendidikan (KB-TK, SD, SMP, SMA)

### Low Priority
10. Klarifikasi alur raport siswa (dokumentasi)

---

## E. DATABASE SEEDER YANG DIPERLUKAN

Untuk memastikan dropdown tidak kosong, jalankan seeder:

```bash
# Seeder tahun ajaran
npx prisma db seed

# Atau manual via script
node scripts/seed-academic-years.js
node scripts/seed-organization.js
```

---

## F. CATATAN TEKNIS

### API Endpoints yang perlu dicek:
- `POST /api/students` - Create student
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student
- `GET /api/users?role=USTADZ` - Get teachers
- `POST /api/academic/subjects` - Create subject
- `GET /api/academic/years` - Get academic years
- `POST /api/academic/classes` - Create class

### Environment Variables yang diperlukan:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret
- `NEXTAUTH_URL` - Base URL

---

## G. FITUR IMPORT CSV - SELURUH MENU INPUT

### 11. Implementasi Import CSV & Template untuk Semua Menu
**Status:** Perlu diimplementasikan
**Tujuan:** Mempercepat proses input data dengan fitur upload CSV massal

**Komponen yang sudah ada:**
- `src/components/bulk-operations/bulk-operations-modal.tsx` - Modal untuk export/import
- `src/lib/bulk-operations.ts` - Utility functions untuk export/import
- `src/app/api/import/students/route.ts` - API import siswa (sudah ada)

**Menu yang perlu ditambahkan fitur Import CSV:**

#### 1. Data Siswa (Students) ✅ Sudah Ada
- File: `src/app/(authenticated)/siswa/page.tsx`
- API: `src/app/api/import/students/route.ts`
- Template columns sudah tersedia

#### 2. Data Pengajar/Staff ✅ Sudah Ada
- File: `src/app/(authenticated)/staff/page.tsx`
- API: `src/app/api/import/staff/route.ts`
- Template columns:
```csv
nip,name,title,suffix,email,phone,role,position,department,address,birthDate,joinDate,status
STF001,Ahmad Hidayat,Dr.,S.Pd.I,ahmad@school.com,081234567890,USTADZ,Guru Al-Quran,Akademik,Jl. Pendidikan No. 1,1980-05-15,2020-01-01,ACTIVE
```

#### 3. Data Kelas (Classes) ✅ Sudah Ada
- File: `src/app/(authenticated)/akademik/classes/page.tsx`
- API: `src/app/api/import/classes/route.ts`
- Template columns:
```csv
name,grade,section,level,program,capacity,room,academicYearId,teacherId,isActive
VII-A,7,A,SMP,REGULER,30,A1,<academic_year_id>,<teacher_id>,true
```

#### 4. Data Mata Pelajaran (Subjects) ✅ Sudah Ada
- File: `src/app/(authenticated)/akademik/subjects/page.tsx`
- API: `src/app/api/import/subjects/route.ts`
- Template columns:
```csv
code,name,nameArabic,description,credits,type,category,level,minGrade,maxGrade,isActive,sortOrder
MTK01,Matematika,,Pelajaran matematika dasar,2,WAJIB,UMUM,SD,1,6,true,1
QUR01,Al-Quran,القرآن الكريم,Pembelajaran Al-Quran,4,WAJIB,AGAMA,SD,1,6,true,2
```

#### 5. Data Tahun Ajaran (Academic Years) ✅ Sudah Ada
- File: `src/app/(authenticated)/akademik/academic-years/page.tsx`
- API: `src/app/api/import/academic-years/route.ts`
- Template columns:
```csv
name,startDate,endDate,description,isActive
2024/2025,2024-07-15,2025-06-30,Tahun ajaran 2024/2025,true
```

#### 6. Data Semester
- File: `src/app/(authenticated)/akademik/semesters/page.tsx`
- API yang perlu dibuat: `src/app/api/import/semesters/route.ts`
- Template columns:
```csv
name,academicYearId,startDate,endDate,isActive
Ganjil 2024/2025,<academic_year_id>,2024-07-15,2024-12-20,true
```

#### 7. Data Nilai (Grades) ✅ Sudah Ada
- File: `src/app/(authenticated)/akademik/grades/page.tsx`
- API: `src/app/api/import/grades/route.ts`
- Template columns:
```csv
studentId,subjectId,semesterId,classId,dailyScore,midtermScore,finalScore,practicalScore,notes
<student_id>,<subject_id>,<semester_id>,<class_id>,85,80,90,88,Baik
```

#### 8. Data Absensi (Attendance) ✅ Sudah Ada
- File: `src/app/(authenticated)/akademik/attendance/page.tsx`
- API: `src/app/api/import/attendance/route.ts`
- Template columns:
```csv
studentId,classId,semesterId,date,status,notes
<student_id>,<class_id>,<semester_id>,2024-07-15,HADIR,
<student_id>,<class_id>,<semester_id>,2024-07-16,IZIN,Acara keluarga
```

#### 9. Data SPP/Pembayaran
- File: `src/app/(authenticated)/spp/page.tsx`
- API yang perlu dibuat: `src/app/api/import/billing/route.ts`
- Template columns:
```csv
studentId,billTypeId,amount,dueDate,period,status,notes
<student_id>,<bill_type_id>,500000,2024-08-10,2024-08,PENDING,SPP bulan Agustus
```

#### 10. Data Donasi
- File: `src/app/(authenticated)/donasi-admin/page.tsx`
- API yang perlu dibuat: `src/app/api/import/donations/route.ts`
- Template columns:
```csv
donorName,donorEmail,donorPhone,amount,campaignId,paymentMethod,status,donatedAt,isAnonymous,message
Ahmad,ahmad@email.com,081234567890,100000,<campaign_id>,TRANSFER,CONFIRMED,2024-07-15,false,Semoga bermanfaat
```

#### 11. Data Hafalan
- File: `src/app/(authenticated)/hafalan/setoran/page.tsx`
- API yang perlu dibuat: `src/app/api/import/hafalan/route.ts`
- Template columns:
```csv
studentId,surahNumber,fromAyat,toAyat,quality,grade,recordedAt,notes
<student_id>,1,1,7,EXCELLENT,A,2024-07-15,Lancar dan tartil
```

#### 12. Data Alumni ✅ Sudah Ada
- File: `src/app/(authenticated)/alumni/page.tsx`
- API: `src/app/api/import/alumni/route.ts`
- Template columns:
```csv
name,nis,nisn,birthPlace,birthDate,gender,graduationYear,institutionType,phone,email,address,currentJob,currentCompany,notes
Ahmad Fadli,20200001,0012345678,Blitar,2000-05-15,MALE,2024,SD,081234567890,ahmad@email.com,Jl. Mawar No. 1,Guru,MI Al-Hikmah,
```

---

### Langkah Implementasi Import CSV:

**1. Buat API Import untuk setiap entity:**
```typescript
// Contoh struktur API import
// src/app/api/import/[entity]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// POST - Import data
export async function POST(request: NextRequest) {
  // Validasi session
  // Parse CSV/Excel data
  // Validate each row
  // Insert to database
  // Return result summary
}

// GET - Return template columns
export async function GET() {
  return NextResponse.json({
    templateColumns: [...],
    validationRules: {...}
  });
}
```

**2. Tambahkan tombol Import di setiap halaman:**
```tsx
// Di setiap page.tsx
import BulkOperationsModal from '@/components/bulk-operations/bulk-operations-modal';

// Tambahkan state
const [showBulkModal, setShowBulkModal] = useState(false);

// Tambahkan tombol
<Button onClick={() => setShowBulkModal(true)}>
  <Download className="w-4 h-4 mr-2" />
  Export / Import
</Button>

// Tambahkan modal
<BulkOperationsModal
  isOpen={showBulkModal}
  onClose={() => setShowBulkModal(false)}
  title="Data [Entity]"
  exportData={data}
  exportColumns={exportColumns}
  templateColumns={templateColumns}
  importValidationRules={validationRules}
  onImportComplete={handleImportComplete}
/>
```

**3. Buat template CSV yang bisa didownload:**
- Setiap template harus memiliki:
  - Header row dengan nama kolom
  - Baris contoh data
  - Keterangan kolom required/optional
  - Format yang diharapkan (tanggal, enum values, dll)

---

### Template CSV yang perlu disiapkan:

| No | Entity | Nama File Template |
|----|--------|-------------------|
| 1 | Siswa | `template-siswa.xlsx` |
| 2 | Staff/Pengajar | `template-staff.xlsx` |
| 3 | Kelas | `template-kelas.xlsx` |
| 4 | Mata Pelajaran | `template-mata-pelajaran.xlsx` |
| 5 | Tahun Ajaran | `template-tahun-ajaran.xlsx` |
| 6 | Semester | `template-semester.xlsx` |
| 7 | Nilai | `template-nilai.xlsx` |
| 8 | Absensi | `template-absensi.xlsx` |
| 9 | SPP/Tagihan | `template-spp.xlsx` |
| 10 | Donasi | `template-donasi.xlsx` |
| 11 | Hafalan | `template-hafalan.xlsx` |
| 12 | Alumni | `template-alumni.xlsx` |

---

### Catatan Penting:

1. **Format Tanggal:** Gunakan format `YYYY-MM-DD` atau `DD/MM/YYYY`
2. **ID Reference:** Untuk kolom yang mereferensi ID lain (studentId, classId, dll), sediakan dropdown atau lookup
3. **Validasi:** Setiap import harus memvalidasi:
   - Format data
   - Required fields
   - Unique constraints
   - Foreign key references
4. **Error Handling:** Tampilkan error per baris agar user bisa memperbaiki
5. **Preview:** Sediakan preview sebelum import final
6. **Rollback:** Implementasi transaction untuk rollback jika ada error

---

## I. CATATAN TAMBAHAN DARI USER

### 12. Prioritas Input Data via Excel/CSV
**Sumber:** Chat WhatsApp (3/12/2025)
**Catatan:**
> "Untuk form ini ada baiknya setor pakai format Excel saja, lebih praktis dan cepat, dan datanya bisa di minta ke masing masing lembaga"

**Sumber Data per Lembaga:**
| Lembaga | PIC Data |
|---------|----------|
| TK | Ustadzah Isna / Ustadzah Unaisah |
| MTQ | Ust. Ahmad |
| MSWi | Mas Bahrul |
| MSWa | Ustadzah Rofi' |

**Action:**
- Siapkan template Excel untuk masing-masing lembaga
- Koordinasi dengan PIC untuk format data yang sesuai
- Prioritaskan fitur import Excel di semua menu input

---

### 13. Form Pengajar - Field Universitas & Jurusan TIDAK WAJIB
**Sumber:** Chat WhatsApp (3/12/2025)
**Catatan:**
> "Untuk form ini yang 'universitas' dan 'jurusan' jangan di buat wajib di isi, karena TIDAK semua pengajar lulusan S1"

**Lokasi File yang perlu diubah:**
- `src/app/(authenticated)/staff/page.tsx`
- `src/components/staff/staff-form.tsx`
- `src/app/api/users/route.ts` (jika ada validasi)
- `src/app/api/import/staff/route.ts` (template import)

**Perubahan:**
```typescript
// SEBELUM (jika ada required validation)
university: z.string().min(1, 'Universitas wajib diisi'),
major: z.string().min(1, 'Jurusan wajib diisi'),

// SESUDAH
university: z.string().optional().nullable(),
major: z.string().optional().nullable(),
```

**Field Pendidikan Pengajar yang perlu di-review:**
- `university` - Nama universitas (TIDAK WAJIB)
- `major` - Jurusan (TIDAK WAJIB)
- `degree` - Jenjang pendidikan (S1, S2, S3, D3, SMA, dll) - Opsional
- `graduationYear` - Tahun lulus - Opsional

**Alasan:**
- Tidak semua pengajar/ustadz lulusan S1
- Banyak ustadz yang berasal dari pondok pesantren tanpa ijazah formal
- Pendidikan non-formal (pesantren) juga valid

---

### 14. Penyesuaian Jenis Lembaga/Satuan Pendidikan
**Update dari catatan sebelumnya:**

| Kode Internal | Nama Tampilan | Keterangan |
|---------------|---------------|------------|
| KB_TK | KB-TK | Kelompok Bermain & Taman Kanak-kanak |
| SD | SD | Sekolah Dasar |
| MTQ | MTQ | Madrasah Tahfidzul Quran |
| MSWi | MSWi | Madrasah Salafiyah Wustho Ikhwan |
| MSWa | MSWa | Madrasah Salafiyah Wustho Akhwat |
| SMP | SMP | Sekolah Menengah Pertama (Pesantren) |
| SMA | SMA | Sekolah Menengah Atas (Pesantren) |

**Catatan:**
- MTQ, MSWi, MSWa adalah program khusus pondok pesantren
- Perlu koordinasi lebih lanjut untuk finalisasi kode lembaga

---

## H. CHANGELOG

| Tanggal | Versi | Perubahan |
|---------|-------|-----------|
| 2024-XX-XX | 1.0 | Initial revision notes |
| 2024-XX-XX | 1.1 | Tambah requirement fitur Import CSV untuk semua menu input |
| 2024-XX-XX | 1.2 | Tambah catatan form pengajar dan prioritas input via Excel |
| 2024-12-06 | 1.3 | IMPLEMENTED: SKS->Jam, satuan pendidikan baru, staff page API integration |

---

*Dokumen ini dibuat untuk tracking perbaikan sistem Pondok Imam Syafii*
