import * as ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

// Types for bulk operations
export interface ExportOptions {
  format: 'excel' | 'csv';
  filename?: string;
  sheetName?: string;
}

export interface ImportResult {
  success: boolean;
  data?: any[];
  errors: string[];
  totalRows: number;
  validRows: number;
  errorRows: number;
}

export interface ImportValidationRule {
  field: string;
  required: boolean;
  type?: 'string' | 'number' | 'date' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean | string;
}

export interface ProgressCallback {
  (current: number, total: number, message?: string): void;
}

// Excel Export Functions
export async function exportToExcel<T>(
  data: T[],
  columns: { key: keyof T; header: string; width?: number; type?: 'string' | 'number' | 'date' }[],
  options: ExportOptions = { format: 'excel' }
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName || 'Data');

  // Set column headers and widths
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key as string,
    width: col.width || 15,
  }));

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F3FF' }
  };

  // Add data rows
  data.forEach((item, index) => {
    const row = worksheet.addRow(item);

    // Format specific cell types
    columns.forEach((col, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      if (col.type === 'date' && item[col.key]) {
        cell.value = new Date(item[col.key] as any);
        cell.numFmt = 'dd/mm/yyyy';
      } else if (col.type === 'number' && item[col.key]) {
        cell.value = Number(item[col.key]);
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    }
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, filename);
}

// CSV Export Function
export function exportToCSV<T>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  options: ExportOptions = { format: 'csv' }
): void {
  const headers = columns.map(col => col.header);
  const csvData = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  const csvContent = [headers, ...csvData]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = options.filename || `export-${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, filename);
}

// Template Generation Functions
export async function generateExcelTemplate(
  columns: { key: string; header: string; width?: number; required?: boolean; example?: string }[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  // Instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instruksi');
  instructionsSheet.addRow(['INSTRUKSI PENGGUNAAN TEMPLATE']);
  instructionsSheet.addRow(['']);
  instructionsSheet.addRow(['1. Isi data pada sheet "Data"']);
  instructionsSheet.addRow(['2. Kolom yang bertanda (*) wajib diisi']);
  instructionsSheet.addRow(['3. Perhatikan format data sesuai contoh']);
  instructionsSheet.addRow(['4. Jangan mengubah nama kolom atau urutan kolom']);
  instructionsSheet.addRow(['5. HAPUS baris contoh (baris ke-2) sebelum mengupload!']);
  instructionsSheet.addRow(['']);
  instructionsSheet.addRow(['FORMAT DATA PENTING:']);
  instructionsSheet.addRow(['- Tanggal: DD/MM/YYYY (contoh: 15/05/2010) atau YYYY-MM-DD']);
  instructionsSheet.addRow(['- Jenis Kelamin: L atau P (atau MALE/FEMALE)']);
  instructionsSheet.addRow(['- Jenis Institusi: KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA']);
  instructionsSheet.addRow(['- Email: Kosongkan jika tidak ada (jangan isi sembarangan)']);
  instructionsSheet.addRow(['- Status: ACTIVE, GRADUATED, TRANSFERRED, atau DROPPED']);
  instructionsSheet.addRow(['']);
  instructionsSheet.addRow(['DETAIL KOLOM:']);

  columns.forEach((col, index) => {
    const required = col.required ? ' (Wajib)' : ' (Opsional)';
    const example = col.example ? ` - Contoh: ${col.example}` : '';
    instructionsSheet.addRow([`${col.header}${required}${example}`]);
  });

  // Data sheet
  const dataSheet = workbook.addWorksheet('Data');

  // Headers
  const headers = columns.map(col => col.required ? `${col.header} *` : col.header);
  dataSheet.addRow(headers);

  // Example row
  const exampleRow = columns.map(col => col.example || '');
  dataSheet.addRow(exampleRow);

  // Style headers
  dataSheet.getRow(1).font = { bold: true };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F3FF' }
  };

  // Style example row
  dataSheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } };

  // Set column widths
  columns.forEach((col, index) => {
    dataSheet.getColumn(index + 1).width = col.width || 15;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, filename);
}

// Import Functions
export async function importFromExcel(
  file: File,
  validationRules: ImportValidationRule[],
  onProgress?: ProgressCallback
): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target?.result as ArrayBuffer);

        const worksheet = workbook.getWorksheet('Data') || workbook.worksheets[0];
        const rows: any[] = [];
        const errors: string[] = [];

        let totalRows = 0;
        let validRows = 0;

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          if (rowNumber === 2 && Array.isArray(row.values) && row.values.every((cell: any) =>
            typeof cell === 'string' && cell.includes('Contoh')
          )) return; // Skip example row

          totalRows++;

          if (onProgress) {
            onProgress(rowNumber - 1, worksheet.rowCount - 1, `Processing row ${rowNumber}...`);
          }

          const rowData: any = {};
          const rowErrors: string[] = [];

          validationRules.forEach((rule, colIndex) => {
            const cellValue = row.getCell(colIndex + 1).value;
            const result = validateCell(cellValue, rule, rowNumber);

            if (result.valid) {
              rowData[rule.field] = result.value;
            } else {
              rowErrors.push(result.error!);
            }
          });

          if (rowErrors.length === 0) {
            rows.push(rowData);
            validRows++;
          } else {
            errors.push(`Baris ${rowNumber}: ${rowErrors.join(', ')}`);
          }
        });

        resolve({
          success: errors.length === 0 || validRows > 0,
          data: rows,
          errors,
          totalRows,
          validRows,
          errorRows: totalRows - validRows
        });
      } catch (error) {
        resolve({
          success: false,
          errors: [`Error reading Excel file: ${error}`],
          totalRows: 0,
          validRows: 0,
          errorRows: 0
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function importFromCSV(
  file: File,
  validationRules: ImportValidationRule[],
  onProgress?: ProgressCallback
): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step: (row, parser) => {
        if (onProgress) {
          const progress = parser.getCharIndex() / file.size * 100;
          onProgress(progress, 100, `Processing CSV data...`);
        }
      },
      complete: (results) => {
        const rows: any[] = [];
        const errors: string[] = [];
        let validRows = 0;

        results.data.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // Account for header row
          const rowData: any = {};
          const rowErrors: string[] = [];

          validationRules.forEach(rule => {
            const cellValue = row[rule.field] || row[`${rule.field} *`]; // Handle required field markers
            const result = validateCell(cellValue, rule, rowNumber);

            if (result.valid) {
              rowData[rule.field] = result.value;
            } else {
              rowErrors.push(result.error!);
            }
          });

          if (rowErrors.length === 0) {
            rows.push(rowData);
            validRows++;
          } else {
            errors.push(`Baris ${rowNumber}: ${rowErrors.join(', ')}`);
          }
        });

        resolve({
          success: errors.length === 0 || validRows > 0,
          data: rows,
          errors,
          totalRows: results.data.length,
          validRows,
          errorRows: results.data.length - validRows
        });
      },
      error: (error) => {
        resolve({
          success: false,
          errors: [`Error reading CSV file: ${error.message}`],
          totalRows: 0,
          validRows: 0,
          errorRows: 0
        });
      }
    });
  });
}

// Cell validation helper
function validateCell(
  cellValue: any,
  rule: ImportValidationRule,
  rowNumber: number
): { valid: boolean; value?: any; error?: string } {
  // Handle empty values
  if (cellValue === null || cellValue === undefined || cellValue === '') {
    if (rule.required) {
      return { valid: false, error: `${rule.field} wajib diisi` };
    }
    return { valid: true, value: null };
  }

  let value = cellValue;

  // Type conversion and validation
  switch (rule.type) {
    case 'string':
      value = String(value).trim();
      if (rule.minLength && value.length < rule.minLength) {
        return { valid: false, error: `${rule.field} minimal ${rule.minLength} karakter` };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { valid: false, error: `${rule.field} maksimal ${rule.maxLength} karakter` };
      }
      break;

    case 'number':
      value = Number(value);
      if (isNaN(value)) {
        return { valid: false, error: `${rule.field} harus berupa angka` };
      }
      break;

    case 'date':
      if (value instanceof Date) {
        // Already a date object
      } else if (typeof value === 'number') {
        // Handle Excel serial date
        const excelEpoch = new Date(1899, 11, 30);
        value = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      } else {
        const strValue = String(value).trim();
        let date: Date | null = null;

        // Try DD/MM/YYYY or DD-MM-YYYY format (common in Indonesia)
        const ddmmyyyyMatch = strValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // Try YYYY-MM-DD or YYYY/MM/DD format
        if (!date || isNaN(date.getTime())) {
          const yyyymmddMatch = strValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          if (yyyymmddMatch) {
            const [, year, month, day] = yyyymmddMatch;
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }

        // Try default Date parsing as fallback
        if (!date || isNaN(date.getTime())) {
          date = new Date(strValue);
        }

        if (!date || isNaN(date.getTime())) {
          return { valid: false, error: `${rule.field} format tanggal tidak valid (gunakan DD/MM/YYYY atau YYYY-MM-DD)` };
        }
        value = date;
      }
      break;

    case 'email':
      value = String(value).trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return { valid: false, error: `${rule.field} format email tidak valid` };
      }
      break;

    case 'phone':
      value = String(value).trim();
      // Remove any non-digit characters except +
      const cleanPhone = value.replace(/[^\d+]/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return { valid: false, error: `${rule.field} format nomor telepon tidak valid` };
      }
      value = cleanPhone;
      break;
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(String(value))) {
    return { valid: false, error: `${rule.field} format tidak sesuai` };
  }

  // Custom validation
  if (rule.validator) {
    const validationResult = rule.validator(value);
    if (validationResult !== true) {
      return {
        valid: false,
        error: typeof validationResult === 'string'
          ? validationResult
          : `${rule.field} tidak valid`
      };
    }
  }

  return { valid: true, value };
}

// Utility functions for common validation rules
export const ValidationRules = {
  required: (field: string): ImportValidationRule => ({
    field,
    required: true,
    type: 'string'
  }),

  email: (field: string, required = false): ImportValidationRule => ({
    field,
    required,
    type: 'email'
  }),

  phone: (field: string, required = false): ImportValidationRule => ({
    field,
    required,
    type: 'phone'
  }),

  date: (field: string, required = false): ImportValidationRule => ({
    field,
    required,
    type: 'date'
  }),

  number: (field: string, required = false): ImportValidationRule => ({
    field,
    required,
    type: 'number'
  }),

  nis: (field: string): ImportValidationRule => ({
    field,
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 20,
    pattern: /^[0-9]+$/
  }),

  gender: (field: string): ImportValidationRule => ({
    field,
    required: true,
    type: 'string',
    validator: (value) => ['MALE', 'FEMALE', 'L', 'P', 'Laki-laki', 'Perempuan'].includes(value)
      || 'Jenis kelamin harus L/P atau MALE/FEMALE'
  }),

  institutionType: (field: string): ImportValidationRule => ({
    field,
    required: true,
    type: 'string',
    validator: (value) => {
      const upperValue = String(value).toUpperCase().trim();
      const validTypes = ['KB_TK', 'SD', 'MTQ', 'MSWI', 'MSWA', 'SMP', 'SMA'];
      const aliases: Record<string, string> = {
        'TK': 'KB_TK',
        'KB-TK': 'KB_TK',
        'PONDOK': 'MTQ',
        'MADRASAH': 'MTQ'
      };
      return validTypes.includes(upperValue) || Object.keys(aliases).includes(upperValue)
        || 'Jenis institusi harus KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA';
    }
  })
};