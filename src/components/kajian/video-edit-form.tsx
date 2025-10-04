'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { X, Save, Loader2 } from 'lucide-react'

interface VideoKajian {
  id: string
  title: string
  ustadz: string
  date: string
  duration: string
  views: number
  likes: number
  category: string
  thumbnail: string
  videoUrl: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface VideoFormData {
  title: string
  ustadz: string
  date: string
  duration: string
  category: string
  thumbnail: string
  videoUrl: string
  description: string
  tags: string
}

interface VideoEditFormProps {
  video?: VideoKajian | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: VideoFormData) => Promise<void>
  mode: 'add' | 'edit'
  categories: string[]
}

export function VideoEditForm({
  video,
  isOpen,
  onClose,
  onSubmit,
  mode,
  categories
}: VideoEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    ustadz: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    category: 'Fiqih',
    thumbnail: '',
    videoUrl: '',
    description: '',
    tags: '',
  })

  // Update form data when video or mode changes
  useEffect(() => {
    if (mode === 'edit' && video) {
      setFormData({
        title: video.title,
        ustadz: video.ustadz,
        date: video.date,
        duration: video.duration,
        category: video.category,
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        description: video.description,
        tags: video.tags.join(', '),
      })
    } else if (mode === 'add') {
      setFormData({
        title: '',
        ustadz: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        category: 'Fiqih',
        thumbnail: '',
        videoUrl: '',
        description: '',
        tags: '',
      })
    }
    setError(null)
  }, [video, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.ustadz || !formData.date || !formData.duration || !formData.videoUrl || !formData.description) {
      setError('Please complete all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving data')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-white shadow-xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'add' ? 'Add New Video' : 'Edit Video'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'add'
                  ? 'Add a new Islamic lecture video to the kajian page'
                  : video?.title}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-6 py-4" style={{ height: 'calc(100vh - 140px)' }}>
          <form id="video-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Video Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Video Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Keutamaan Ilmu dan Ulama"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ustadz">Ustadz *</Label>
                    <Input
                      id="ustadz"
                      value={formData.ustadz}
                      onChange={(e) => setFormData({ ...formData, ustadz: e.target.value })}
                      placeholder="Ustadz Ahmad Zainuddin"
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
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="45:30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Pembahasan tentang keutamaan menuntut ilmu..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Media URLs</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl">Video URL *</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    YouTube, Vimeo, or direct video URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. Will auto-generate from video if empty
                  </p>
                </div>

                {/* Thumbnail Preview */}
                {formData.thumbnail && (
                  <div>
                    <Label>Thumbnail Preview</Label>
                    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-video.png'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Tags</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="ilmu, ulama, keutamaan, adab"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate tags with commas for better searchability
                  </p>
                </div>

                {/* Tags Preview */}
                {formData.tags && (
                  <div>
                    <Label>Tags Preview</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.split(',').map((tag, index) => {
                        const trimmedTag = tag.trim()
                        if (!trimmedTag) return null
                        return (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                          >
                            {trimmedTag}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
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
              form="video-form"
              className="flex-1 bg-primary-600 hover:bg-primary-700"
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
                  {mode === 'add' ? 'Create Video' : 'Update Video'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
