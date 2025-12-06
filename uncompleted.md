# DAFTAR MENU YANG BELUM LENGKAP

## A. MENU DENGAN DATA MOCK/DUMMY (Tidak Terhubung API)

### 1. Kurikulum
**Status:** ✅ SELESAI (2024-12-06)
**Perbaikan:** 
- ✅ Buat API CRUD `/api/courses/route.ts`
- ✅ Update halaman `/kurikulum/page.tsx` untuk fetch dari API
- ✅ Update `CourseForm` component untuk support edit mode
- Tabel `courses` sudah ada di Prisma schema

---

### 2. Unit Usaha - Dashboard
**Status:** ⚠️ Mock Data
**File:** `src/app/(authenticated)/unit-usaha/page.tsx`
**Masalah:** 
- Statistik menggunakan `mockStats` dengan `setTimeout`
- Tidak fetch dari API

---

### 3. Unit Usaha - Products
**Status:** ⚠️ Mock Data
**File:** `src/app/(authenticated)/unit-usaha/products/page.tsx`
**Masalah:**
- Products menggunakan `mockProducts`
- CRUD tidak terhubung ke database

---

### 4. Unit Usaha - POS (Point of Sale)
**Status:** ⚠️ Mock Data
**File:** `src/app/(authenticated)/unit-usaha/pos/page.tsx`
**Masalah:**
- Products list menggunakan mock data
- Transaksi penjualan tidak tersimpan ke database

---

### 5. Akademik - Attendance
**Status:** ⚠️ Partial Mock
**File:** `src/app/(authenticated)/akademik/attendance/page.tsx`
**Masalah:**
- List students dalam kelas menggunakan `mockStudents`
- Seharusnya fetch dari API berdasarkan kelas yang dipilih

**Solusi:**
- Fetch students dari `/api/students?classId=xxx`

---

### 6. Settings - Payment Gateway
**Status:** ⚠️ Mock Connection
**File:** `src/app/(authenticated)/settings/payment/page.tsx`
**Masalah:**
- Test connection menggunakan `setTimeout` (fake)
- Save settings tidak terhubung ke database

---

### 7. Settings - WhatsApp
**Status:** ⚠️ Mock Connection
**File:** `src/app/(authenticated)/settings/whatsapp/page.tsx`
**Masalah:**
- QR scanning dan connection test menggunakan mock
- Tidak terhubung ke WhatsApp API sebenarnya

---

### 8. Settings - System
**Status:** ⚠️ Mock Data
**File:** `src/app/(authenticated)/settings/system/page.tsx`
**Masalah:**
- System info menggunakan mock data
- Seharusnya fetch dari server (disk usage, memory, dll)

---

## B. FITUR YANG BELUM LENGKAP

### 9. SPMB/PPDB - Biaya Pendaftaran per Jenjang
**Status:** ✅ SELESAI (2024-12-06)
**File:** 
- `prisma/schema.prisma` - model ppdb_settings (UPDATED)
- `src/app/api/ppdb/settings/route.ts` (UPDATED)
- `src/app/(authenticated)/ppdb-admin/settings/page.tsx` (NEW)

**Perbaikan yang dilakukan:**
1. ✅ Tambah field SMA (quotaSMA, registrationFeeSMA)
2. ✅ Tambah field KB_TK (quotaKBTK, registrationFeeKBTK)
3. ✅ Tambah field feeDetails (JSON) untuk biaya detail per jenjang
4. ✅ Buat halaman admin `/ppdb-admin/settings` untuk manage biaya
5. ✅ Update API untuk handle semua jenjang (KB_TK, TK, SD, SMP, SMA, PONDOK)

**Biaya yang bisa diatur per jenjang (via feeDetails JSON):**
| Jenjang | Biaya Pendaftaran | Biaya Daftar Ulang | SPP Bulanan | Seragam | Buku |
|---------|-------------------|--------------------| ------------|---------|------|
| KB-TK   | ✅ | ✅ | ✅ | ✅ | ✅ |
| TK      | ✅ | ✅ | ✅ | ✅ | ✅ |
| SD      | ✅ | ✅ | ✅ | ✅ | ✅ |
| SMP     | ✅ | ✅ | ✅ | ✅ | ✅ |
| SMA     | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pondok  | ✅ | ✅ | ✅ | ✅ | ✅ |

**Akses:** `/ppdb-admin/settings`

---

## C. PRIORITAS PERBAIKAN

### High Priority
1. **SPMB Biaya Pendaftaran** - Langsung berdampak ke operasional
2. **Kurikulum API** - Menu tidak berfungsi sama sekali

### Medium Priority
3. **Unit Usaha** - Perlu API untuk products dan transaksi
4. **Attendance Students** - Fetch dari API

### Low Priority
5. **Settings mock connections** - Bisa ditunda, butuh integrasi eksternal

---

## D. CATATAN TEKNIS

### API yang Perlu Dibuat:
```
/api/courses (Kurikulum)
  - GET: List courses
  - POST: Create course
  - PUT: Update course
  - DELETE: Delete course

/api/ppdb/fees (Biaya PPDB)
  - GET: Get fees per jenjang
  - PUT: Update fees

/api/unit-usaha/products
  - CRUD products

/api/unit-usaha/transactions
  - POST: Create sale transaction
  - GET: List transactions
```

### Tabel Database yang Mungkin Perlu Ditambah:
- `courses` - untuk kurikulum
- `ppdb_fees` - untuk biaya pendaftaran per jenjang
- `business_products` - untuk unit usaha
- `business_transactions` - untuk transaksi POS

---

*Terakhir diupdate: 2024-12-06*
