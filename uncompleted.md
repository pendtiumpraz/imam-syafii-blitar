# DAFTAR MENU YANG BELUM LENGKAP

## A. MENU DENGAN DATA MOCK/DUMMY (Tidak Terhubung API)

### 1. Kurikulum
**Status:** ❌ Tidak ada API
**Masalah:** 
- Halaman `/kurikulum/page.tsx` menggunakan data hardcoded
- Tidak ada API `/api/kurikulum` atau `/api/courses`
- Form tambah/edit tidak menyimpan ke database

**Solusi:**
- Buat tabel `courses` di Prisma schema
- Buat API CRUD `/api/courses`
- Hubungkan page ke API

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
**Status:** ⚠️ Partial - Perlu Update
**File:** 
- `prisma/schema.prisma` - model ppdb_settings
- `src/app/api/ppdb/settings/route.ts`

**Kondisi Saat Ini:**
Schema ppdb_settings sudah ada dengan field:
- quotaTK, quotaSD, quotaSMP, quotaPondok
- registrationFeeTK, registrationFeeSD, registrationFeeSMP, registrationFeePondok

**Masalah:**
1. ❌ Tidak ada SMA (quotaSMA, registrationFeeSMA)
2. ❌ KB dan TK belum dipisah (harusnya KB_TK atau terpisah)
3. ❌ Tidak ada biaya daftar ulang dan SPP per jenjang
4. ❌ Belum ada halaman admin untuk edit biaya (harus dari database langsung)

**Yang Perlu Ditambahkan ke Schema:**
```prisma
model ppdb_settings {
  // ... existing fields ...
  
  // Tambahan jenjang
  quotaKBTK             Int      @default(30)
  quotaSMA              Int      @default(40)
  registrationFeeKBTK   Decimal  @default(100000)
  registrationFeeSMA    Decimal  @default(200000)
  
  // Biaya tambahan per jenjang (optional - bisa pakai JSON)
  feeDetails            String   @default("{}") // JSON untuk biaya detail per jenjang
}
```

**Atau Format JSON untuk feeDetails:**
```json
{
  "KB_TK": {
    "registrationFee": 100000,
    "enrollmentFee": 500000,
    "monthlyFee": 300000,
    "uniformFee": 250000,
    "booksFee": 150000
  },
  "SD": { ... },
  "SMP": { ... },
  "SMA": { ... },
  "PONDOK": { ... }
}
```

**Yang Perlu Dibuat:**
1. Update schema Prisma dengan field baru
2. Buat halaman `/settings/ppdb` atau `/ppdb-admin/settings` untuk manage biaya
3. Update API PUT untuk handle semua jenjang
4. Update form PPDB publik untuk ambil biaya sesuai jenjang

**Jenjang yang perlu diatur biayanya:**
| Jenjang | Biaya Pendaftaran | Biaya Daftar Ulang | SPP Bulanan |
|---------|-------------------|--------------------| ------------|
| KB-TK   | Rp 100.000 | ? | ? |
| SD      | Rp 150.000 | ? | ? |
| SMP     | Rp 200.000 | ? | ? |
| SMA     | Rp 200.000 (BARU) | ? | ? |
| Pondok  | Rp 250.000 | ? | ? |

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
