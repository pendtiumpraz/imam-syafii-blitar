import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format nama lengkap dengan gelar
 * @param name - Nama lengkap
 * @param title - Gelar depan (Dr., Ust., Ustdz., KH., dll)
 * @param suffix - Gelar belakang (S.Pd.I, M.A., Lc., dll)
 * @returns Nama lengkap dengan gelar
 * @example formatFullName('Ahmad Hidayat', 'Ust.', 'S.Pd.I') => 'Ust. Ahmad Hidayat, S.Pd.I'
 */
export function formatFullName(name: string, title?: string | null, suffix?: string | null): string {
  const parts: string[] = []
  
  if (title?.trim()) {
    parts.push(title.trim())
  }
  
  parts.push(name)
  
  let fullName = parts.join(' ')
  
  if (suffix?.trim()) {
    fullName += `, ${suffix.trim()}`
  }
  
  return fullName
}