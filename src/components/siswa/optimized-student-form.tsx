'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Save, Loader2 } from 'lucide-react'
import { useOptimizedForm, useDebounce, usePerformanceMonitor } from '@/hooks/use-performance'
import { LazySection } from '@/lib/lazy-loading'
import { OptimizedImage } from '@/lib/image-optimizer'

interface Student {
  id: string
  nisn?: string | null
  nis: string
  fullName: string
  nickname?: string | null
  birthPlace: string
  birthDate: Date
  gender: string
  bloodType?: string | null
  address: string
  city: string
  phone?: string | null
  email?: string | null
  fatherName: string
  motherName: string
  institutionType: string
  grade?: string | null
  enrollmentYear: string
  status: string
  photo?: string | null
}

interface StudentEditFormProps {
  student: Student
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

// Memoized form sections for better performance
interface FormSectionProps {
  values: any;
  setValue: (field: string, value: any) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: (field: string) => void;
}

const BasicInfoSection = memo(({ values, setValue, errors, touched, setTouched }: FormSectionProps) => (
  <div>
    <h3 className="font-semibold text-lg mb-4">Informasi Dasar</h3>
    <div className="space-y-4">
      <FormField
        label="NISN"
        name="nisn"
        value={values.nisn}
        onChange={(value) => setValue('nisn', value)}
        onBlur={() => setTouched('nisn')}
        error={touched.nisn ? errors.nisn : undefined}
        placeholder="Nomor Induk Siswa Nasional"
      />

      <FormField
        label="NIS *"
        name="nis"
        value={values.nis}
        onChange={(value) => setValue('nis', value)}
        onBlur={() => setTouched('nis')}
        error={touched.nis ? errors.nis : undefined}
        placeholder="Nomor Induk Siswa"
        required
      />

      <FormField
        label="Nama Lengkap *"
        name="fullName"
        value={values.fullName}
        onChange={(value) => setValue('fullName', value)}
        onBlur={() => setTouched('fullName')}
        error={touched.fullName ? errors.fullName : undefined}
        placeholder="Nama lengkap siswa"
        required
      />

      <FormField
        label="Nama Panggilan"
        name="nickname"
        value={values.nickname}
        onChange={(value) => setValue('nickname', value)}
        onBlur={() => setTouched('nickname')}
        error={touched.nickname ? errors.nickname : undefined}
        placeholder="Nama panggilan"
      />

      <FormField
        label="Tempat Lahir *"
        name="birthPlace"
        value={values.birthPlace}
        onChange={(value) => setValue('birthPlace', value)}
        onBlur={() => setTouched('birthPlace')}
        error={touched.birthPlace ? errors.birthPlace : undefined}
        placeholder="Tempat lahir"
        required
      />

      <FormField
        label="Tanggal Lahir *"
        name="birthDate"
        type="date"
        value={values.birthDate}
        onChange={(value) => setValue('birthDate', value)}
        onBlur={() => setTouched('birthDate')}
        error={touched.birthDate ? errors.birthDate : undefined}
        required
      />

      <SelectField
        label="Jenis Kelamin *"
        name="gender"
        value={values.gender}
        onChange={(value) => setValue('gender', value)}
        onBlur={() => setTouched('gender')}
        error={touched.gender ? errors.gender : undefined}
        options={[
          { value: 'MALE', label: 'Laki-laki' },
          { value: 'FEMALE', label: 'Perempuan' }
        ]}
        required
      />

      <SelectField
        label="Golongan Darah"
        name="bloodType"
        value={values.bloodType}
        onChange={(value) => setValue('bloodType', value)}
        onBlur={() => setTouched('bloodType')}
        error={touched.bloodType ? errors.bloodType : undefined}
        options={[
          { value: '', label: 'Pilih golongan darah' },
          { value: 'A', label: 'A' },
          { value: 'B', label: 'B' },
          { value: 'AB', label: 'AB' },
          { value: 'O', label: 'O' }
        ]}
      />
    </div>
  </div>
))

const AddressSection = memo(({ values, setValue, errors, touched, setTouched }: FormSectionProps) => (
  <LazySection fallback={<div className="h-32 bg-gray-100 animate-pulse rounded"></div>}>
    <div>
      <h3 className="font-semibold text-lg mb-4">Informasi Alamat</h3>
      <div className="space-y-4">
        <FormField
          label="Alamat *"
          name="address"
          type="textarea"
          value={values.address}
          onChange={(value) => setValue('address', value)}
          onBlur={() => setTouched('address')}
          error={touched.address ? errors.address : undefined}
          placeholder="Alamat lengkap"
          required
        />

        <FormField
          label="Kota *"
          name="city"
          value={values.city}
          onChange={(value) => setValue('city', value)}
          onBlur={() => setTouched('city')}
          error={touched.city ? errors.city : undefined}
          placeholder="Kota"
          required
        />

        <FormField
          label="Provinsi"
          name="province"
          value={values.province}
          onChange={(value) => setValue('province', value)}
          onBlur={() => setTouched('province')}
          error={touched.province ? errors.province : undefined}
          placeholder="Provinsi"
        />
      </div>
    </div>
  </LazySection>
))

const ContactSection = memo(({ values, setValue, errors, touched, setTouched }: FormSectionProps) => (
  <LazySection fallback={<div className="h-24 bg-gray-100 animate-pulse rounded"></div>}>
    <div>
      <h3 className="font-semibold text-lg mb-4">Informasi Kontak</h3>
      <div className="space-y-4">
        <FormField
          label="Nomor Telepon"
          name="phone"
          value={values.phone}
          onChange={(value) => setValue('phone', value)}
          onBlur={() => setTouched('phone')}
          error={touched.phone ? errors.phone : undefined}
          placeholder="Nomor telepon"
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(value) => setValue('email', value)}
          onBlur={() => setTouched('email')}
          error={touched.email ? errors.email : undefined}
          placeholder="Alamat email"
        />
      </div>
    </div>
  </LazySection>
))

// Optimized form field components
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const FormField = memo(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false
}: FormFieldProps) => {
  const debouncedOnChange = useDebounce(onChange, 300)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue) // Immediate update for UI
    debouncedOnChange(newValue) // Debounced for expensive operations
  }, [onChange, debouncedOnChange])

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          className={`w-full px-3 py-2 border rounded-md resize-none ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          rows={3}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <Input
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={error ? 'border-red-300 bg-red-50' : ''}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

const SelectField = memo(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  options,
  required = false
}: SelectFieldProps) => (
  <div>
    <label className="block text-sm font-medium mb-2">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      required={required}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
))

// Validation schema
const validationSchema = (values: Record<string, any>) => {
  const errors: Record<string, string> = {}

  if (!values.nis?.trim()) {
    errors.nis = 'NIS wajib diisi'
  }

  if (!values.fullName?.trim()) {
    errors.fullName = 'Nama lengkap wajib diisi'
  }

  if (!values.birthPlace?.trim()) {
    errors.birthPlace = 'Tempat lahir wajib diisi'
  }

  if (!values.address?.trim()) {
    errors.address = 'Alamat wajib diisi'
  }

  if (!values.city?.trim()) {
    errors.city = 'Kota wajib diisi'
  }

  if (!values.fatherName?.trim()) {
    errors.fatherName = 'Nama ayah wajib diisi'
  }

  if (!values.motherName?.trim()) {
    errors.motherName = 'Nama ibu wajib diisi'
  }

  // Only validate email format if email is filled and has content
  if (values.email && values.email.trim() && !values.email.includes('@')) {
    errors.email = 'Email tidak valid'
  }

  return errors
}

// Main optimized component
export const OptimizedStudentEditForm = memo(({
  student,
  isOpen,
  onClose,
  onSubmit
}: StudentEditFormProps) => {
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const { logPerformance } = usePerformanceMonitor('OptimizedStudentEditForm')

  // Initialize form with optimized form hook
  const initialValues = useMemo(() => ({
    nisn: student.nisn || '',
    nis: student.nis,
    fullName: student.fullName,
    nickname: student.nickname || '',
    birthPlace: student.birthPlace,
    birthDate: new Date(student.birthDate).toISOString().split('T')[0],
    gender: student.gender,
    bloodType: student.bloodType || '',
    address: student.address,
    city: student.city,
    phone: student.phone || '',
    email: student.email || '',
    fatherName: student.fatherName,
    motherName: student.motherName,
    institutionType: student.institutionType,
    grade: student.grade || '',
    enrollmentYear: student.enrollmentYear,
    enrollmentDate: new Date(student.birthDate).toISOString().split('T')[0],
    status: student.status,
    photo: student.photo || '',
    province: 'Jawa Timur',
    village: '',
    district: '',
    postalCode: '',
    fatherJob: '',
    fatherPhone: '',
    fatherEducation: '',
    motherJob: '',
    motherPhone: '',
    motherEducation: '',
    guardianName: '',
    guardianJob: '',
    guardianPhone: '',
    guardianRelation: '',
    previousSchool: '',
    specialNeeds: '',
    notes: ''
  }), [student])

  const {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    isValid
  } = useOptimizedForm(initialValues, validationSchema)

  // Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const startTime = performance.now()
    if (!validate()) {
      setGeneralError('Mohon perbaiki kesalahan pada form')
      return
    }

    setLoading(true)
    setGeneralError(null)

    try {
      await onSubmit(values)
      logPerformance('Form Submit', startTime)
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }, [values, validate, onSubmit, logPerformance])

  // Optimized close handler
  const handleClose = useCallback(() => {
    if (!loading) {
      const startTime = performance.now()
      onClose()
      logPerformance('Form Close', startTime)
    }
  }, [loading, onClose, logPerformance])

  // Don't render if not open (performance optimization)
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Slide-out Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-1/3 xl:w-1/4 bg-white shadow-xl z-50 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          {/* Header with optimized image */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              {student.photo && (
                <OptimizedImage
                  src={student.photo}
                  alt={student.fullName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Data Siswa</h2>
                <p className="text-sm text-gray-600">{student.fullName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Error Alert */}
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information - Always visible */}
            <BasicInfoSection
              values={values}
              setValue={setValue as (field: string, value: any) => void}
              errors={errors}
              touched={touched}
              setTouched={setTouched as (field: string) => void}
            />

            {/* Address Information - Lazy loaded */}
            <AddressSection
              values={values}
              setValue={setValue as (field: string, value: any) => void}
              errors={errors}
              touched={touched}
              setTouched={setTouched as (field: string) => void}
            />

            {/* Contact Information - Lazy loaded */}
            <ContactSection
              values={values}
              setValue={setValue as (field: string, value: any) => void}
              errors={errors}
              touched={touched}
              setTouched={setTouched as (field: string) => void}
            />

            {/* Parent Information - Lazy loaded */}
            <LazySection fallback={<div className="h-24 bg-gray-100 animate-pulse rounded"></div>}>
              <div>
                <h3 className="font-semibold text-lg mb-4">Informasi Orang Tua</h3>
                <div className="space-y-4">
                  <FormField
                    label="Nama Ayah *"
                    name="fatherName"
                    value={values.fatherName}
                    onChange={(value: string) => setValue('fatherName' as any, value)}
                    onBlur={() => setTouched('fatherName' as any)}
                    error={touched.fatherName ? errors.fatherName : undefined}
                    placeholder="Nama lengkap ayah"
                    required
                  />

                  <FormField
                    label="Nama Ibu *"
                    name="motherName"
                    value={values.motherName}
                    onChange={(value: string) => setValue('motherName' as any, value)}
                    onBlur={() => setTouched('motherName' as any)}
                    error={touched.motherName ? errors.motherName : undefined}
                    placeholder="Nama lengkap ibu"
                    required
                  />
                </div>
              </div>
            </LazySection>

            {/* Academic Information - Lazy loaded */}
            <LazySection fallback={<div className="h-32 bg-gray-100 animate-pulse rounded"></div>}>
              <div>
                <h3 className="font-semibold text-lg mb-4">Informasi Akademik</h3>
                <div className="space-y-4">
                  <SelectField
                    label="Institusi *"
                    name="institutionType"
                    value={values.institutionType}
                    onChange={(value: string) => setValue('institutionType' as any, value)}
                    onBlur={() => setTouched('institutionType' as any)}
                    error={touched.institutionType ? errors.institutionType : undefined}
                    options={[
                      { value: 'KB_TK', label: 'KB-TK' },
                      { value: 'SD', label: 'SD' },
                      { value: 'SMP', label: 'SMP' },
                      { value: 'SMA', label: 'SMA' }
                    ]}
                    required
                  />

                  <FormField
                    label="Kelas"
                    name="grade"
                    value={values.grade}
                    onChange={(value: string) => setValue('grade' as any, value)}
                    onBlur={() => setTouched('grade' as any)}
                    error={touched.grade ? errors.grade : undefined}
                    placeholder="Kelas saat ini"
                  />

                  <FormField
                    label="Tahun Masuk"
                    name="enrollmentYear"
                    value={values.enrollmentYear}
                    onChange={(value: string) => setValue('enrollmentYear' as any, value)}
                    onBlur={() => setTouched('enrollmentYear' as any)}
                    error={touched.enrollmentYear ? errors.enrollmentYear : undefined}
                    placeholder="Tahun masuk"
                  />

                  <SelectField
                    label="Status"
                    name="status"
                    value={values.status}
                    onChange={(value: string) => setValue('status' as any, value)}
                    onBlur={() => setTouched('status' as any)}
                    error={touched.status ? errors.status : undefined}
                    options={[
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'GRADUATED', label: 'Lulus' },
                      { value: 'TRANSFERRED', label: 'Pindah' },
                      { value: 'DROPPED_OUT', label: 'Keluar' }
                    ]}
                  />
                </div>
              </div>
            </LazySection>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 bg-white border-t pt-4 mt-6 -mx-6 px-6">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={loading || !isValid}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
})

OptimizedStudentEditForm.displayName = 'OptimizedStudentEditForm'