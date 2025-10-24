import { describe, it, expect } from '@jest/globals';
import { ppdbRegistrationSchema, fileUploadSchema, multipleFileUploadSchema } from '@/lib/validations/ppdb';

describe('PPDB Registration Validation', () => {
  const validData = {
    fullName: 'Ahmad Zaki Mubarak',
    nickname: 'Zaki',
    birthPlace: 'Blitar',
    birthDate: new Date('2015-05-15'),
    gender: 'LAKI_LAKI' as const,
    religion: 'ISLAM',
    nationality: 'INDONESIA',
    address: 'Jl. Raya Blitar No. 123',
    village: 'Kepanjen Kidul',
    district: 'Kepanjenkidul',
    city: 'Blitar',
    province: 'Jawa Timur',
    level: 'TK' as const,
    fatherName: 'Ahmad Syafii',
    motherName: 'Fatimah Azzahra',
  };

  describe('Personal Information', () => {
    it('should accept valid personal information', () => {
      const result = ppdbRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short full name', () => {
      const data = { ...validData, fullName: 'AB' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('minimal 3 karakter');
      }
    });

    it('should reject invalid gender', () => {
      const data = { ...validData, gender: 'INVALID' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid age (too young)', () => {
      const data = { ...validData, birthDate: new Date('2022-01-01') };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Usia harus antara 3-25 tahun');
      }
    });

    it('should reject invalid age (too old)', () => {
      const data = { ...validData, birthDate: new Date('1990-01-01') };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Identification Numbers', () => {
    it('should accept valid NIK', () => {
      const data = { ...validData, nik: '3507012005150001' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid NIK (wrong length)', () => {
      const data = { ...validData, nik: '123456' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('16 digit');
      }
    });

    it('should accept valid NISN', () => {
      const data = { ...validData, nisn: '0012345678' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid NISN', () => {
      const data = { ...validData, nisn: '12345' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Contact Information', () => {
    it('should accept valid phone number formats', () => {
      const phoneNumbers = ['081234567890', '62812345678', '+62812345678'];

      phoneNumbers.forEach((phone) => {
        const data = { ...validData, phone };
        const result = ppdbRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone number', () => {
      const data = { ...validData, phone: '12345' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid email', () => {
      const data = { ...validData, email: 'test@example.com' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = { ...validData, email: 'invalid-email' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Address Information', () => {
    it('should reject short address', () => {
      const data = { ...validData, address: 'Short' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('minimal 10 karakter');
      }
    });

    it('should accept valid postal code', () => {
      const data = { ...validData, postalCode: '66171' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal code', () => {
      const data = { ...validData, postalCode: '123' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Parent Information', () => {
    it('should require father name', () => {
      const data = { ...validData, fatherName: '' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require mother name', () => {
      const data = { ...validData, motherName: '' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative father income', () => {
      const data = { ...validData, fatherIncome: -1000 };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Education Level', () => {
    it('should accept valid education levels', () => {
      const levels = ['TK', 'SD', 'SMP', 'PONDOK'] as const;

      levels.forEach((level) => {
        const data = { ...validData, level };
        const result = ppdbRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid education level', () => {
      const data = { ...validData, level: 'INVALID' };
      const result = ppdbRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('File Upload Validation', () => {
  it('should accept valid file (2MB JPEG)', () => {
    const file = new File([''], 'test.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });

    const result = fileUploadSchema.safeParse({ file });
    expect(result.success).toBe(true);
  });

  it('should reject file exceeding size limit', () => {
    const file = new File([''], 'test.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

    const result = fileUploadSchema.safeParse({ file });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('5MB');
    }
  });

  it('should reject invalid file type', () => {
    const file = new File([''], 'test.txt', {
      type: 'text/plain',
    });
    Object.defineProperty(file, 'size', { value: 1024 });

    const result = fileUploadSchema.safeParse({ file });
    expect(result.success).toBe(false);
  });

  it('should accept PDF file', () => {
    const file = new File([''], 'test.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });

    const result = fileUploadSchema.safeParse({ file });
    expect(result.success).toBe(true);
  });
});

describe('Multiple File Upload Validation', () => {
  it('should accept valid multiple files', () => {
    const files = [
      new File([''], 'test1.jpg', { type: 'image/jpeg' }),
      new File([''], 'test2.png', { type: 'image/png' }),
    ];

    files.forEach((file) => {
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    });

    const result = multipleFileUploadSchema.safeParse({ files });
    expect(result.success).toBe(true);
  });

  it('should reject more than 5 files', () => {
    const files = Array(6).fill(
      new File([''], 'test.jpg', { type: 'image/jpeg' })
    );

    const result = multipleFileUploadSchema.safeParse({ files });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Maksimal 5 file');
    }
  });

  it('should reject if any file exceeds size limit', () => {
    const files = [
      new File([''], 'test1.jpg', { type: 'image/jpeg' }),
      new File([''], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    Object.defineProperty(files[0], 'size', { value: 1024 * 1024 });
    Object.defineProperty(files[1], 'size', { value: 6 * 1024 * 1024 });

    const result = multipleFileUploadSchema.safeParse({ files });
    expect(result.success).toBe(false);
  });
});
