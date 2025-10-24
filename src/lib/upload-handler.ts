import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

export type UploadType = 'image' | 'document' | 'video' | 'pdf'

interface UploadOptions {
  type: UploadType
  maxSize?: number // in bytes
  allowedExtensions?: string[]
}

const DEFAULT_MAX_SIZES: Record<UploadType, number> = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  pdf: 20 * 1024 * 1024, // 20MB
}

const DEFAULT_EXTENSIONS: Record<UploadType, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  video: ['.mp4', '.avi', '.mov', '.wmv'],
  pdf: ['.pdf'],
}

/**
 * Upload handler for files
 * This is a placeholder implementation - in production you would integrate with:
 * - Cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
 * - CDN
 * - Image optimization service
 */
export class UploadHandler {
  private uploadDir: string

  constructor(uploadDir: string = '/public/uploads') {
    this.uploadDir = uploadDir
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options: UploadOptions): { valid: boolean; error?: string } {
    const maxSize = options.maxSize || DEFAULT_MAX_SIZES[options.type]
    const allowedExtensions = options.allowedExtensions || DEFAULT_EXTENSIONS[options.type]

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File terlalu besar. Maksimal ${(maxSize / 1024 / 1024).toFixed(2)}MB`
      }
    }

    // Check file extension
    const ext = path.extname(file.name).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Format file tidak didukung. Hanya ${allowedExtensions.join(', ')}`
      }
    }

    return { valid: true }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const uuid = uuidv4()
    const timestamp = Date.now()
    return `${timestamp}-${uuid}${ext}`
  }

  /**
   * Upload file to server/cloud
   * In production, replace this with actual cloud upload
   */
  async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // Validate file
    const validation = this.validateFile(file, options)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    try {
      // Generate filename
      const filename = this.generateFilename(file.name)
      const subDir = `${options.type}s` // images, documents, videos, pdfs
      const relativePath = `${subDir}/${filename}`
      const fullPath = path.join(this.uploadDir, relativePath)

      // Ensure directory exists
      await mkdir(path.dirname(fullPath), { recursive: true })

      // Convert File to Buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Write file
      await writeFile(fullPath, buffer)

      // Return public URL
      const publicUrl = `/uploads/${relativePath}`

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Upload error:', error)
      return { success: false, error: 'Gagal upload file' }
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions
  ): Promise<{ success: boolean; urls?: string[]; errors?: string[] }> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file, options))
    )

    const urls = results
      .filter(r => r.success && r.url)
      .map(r => r.url!)

    const errors = results
      .filter(r => !r.success && r.error)
      .map(r => r.error!)

    return {
      success: urls.length === files.length,
      urls: urls.length > 0 ? urls : undefined,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}

/**
 * Client-side upload utility
 * This would be used in React components
 */
export async function uploadToServer(
  file: File,
  type: UploadType
): Promise<{ success: boolean; url?: string; error?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Upload gagal' }
    }

    return { success: true, url: data.url }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Gagal upload file' }
  }
}

/**
 * Compress image before upload (client-side)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          file.type,
          quality
        )
      }
    }
    reader.onerror = reject
  })
}

/**
 * Get file preview URL
 */
export function getFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
