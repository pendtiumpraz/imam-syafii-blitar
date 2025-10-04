'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { X, Save, Loader2 } from 'lucide-react'

interface EbookFormData {
  title: string
  author: string
  description: string
  category: string
  subcategory: string
  fileUrl: string
  coverImage: string
  fileSize: string
  pageCount: string
  language: string
  publisher: string
  publishYear: string
  tags: string
  isFeatured: boolean
}

interface EbookFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  mode: 'add' | 'edit'
  initialData?: EbookFormData
  title: string
  description: string
}

const categories = [
  'fiqh', 'hadith', 'tafsir', 'akhlak', 'sirah', 'aqidah'
]

const categoryLabels: { [key: string]: string } = {
  'fiqh': 'Fiqh',
  'hadith': 'Hadith',
  'tafsir': 'Tafsir',
  'akhlak': 'Akhlak',
  'sirah': 'Sirah Nabawiyah',
  'aqidah': 'Aqidah',
}

export function EbookForm({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  title,
  description
}: EbookFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<EbookFormData>(
    initialData || {
      title: '',
      author: '',
      description: '',
      category: 'fiqh',
      subcategory: '',
      fileUrl: '',
      coverImage: '',
      fileSize: '',
      pageCount: '',
      language: 'id',
      publisher: '',
      publishYear: '',
      tags: '',
      isFeatured: false,
    }
  )

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.author || !formData.description || !formData.fileUrl) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit({
        ...formData,
        fileSize: formData.fileSize ? parseInt(formData.fileSize) : undefined,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ebook')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Fixed Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-xl z-50 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} id="ebook-form" className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Kitab At-Tauhid"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Muhammad bin Abdul Wahhab"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Kitab yang membahas tentang tauhid..."
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            {/* File Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">File Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileUrl">PDF File URL *</Label>
                  <Input
                    id="fileUrl"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    placeholder="https://example.com/book.pdf"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://example.com/cover.jpg"
                  />
                  {formData.coverImage && (
                    <div className="mt-2">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="w-32 h-40 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fileSize">File Size (bytes)</Label>
                    <Input
                      id="fileSize"
                      type="number"
                      value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                      placeholder="5242880"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pageCount">Page Count</Label>
                    <Input
                      id="pageCount"
                      type="number"
                      value={formData.pageCount}
                      onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language *</Label>
                    <select
                      id="language"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="id">Indonesia</option>
                      <option value="ar">Arabic</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="Dar Al-Kitab Al-Arabi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publishYear">Publish Year</Label>
                    <Input
                      id="publishYear"
                      value={formData.publishYear}
                      onChange={(e) => setFormData({ ...formData, publishYear: e.target.value })}
                      placeholder="2020"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tauhid, aqidah, islam"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label htmlFor="featured">Featured Book</Label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="ebook-form"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'add' ? 'Create Ebook' : 'Update Ebook'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
