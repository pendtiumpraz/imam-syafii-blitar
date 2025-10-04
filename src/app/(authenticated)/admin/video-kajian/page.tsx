'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import {
  Video,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  PlayCircle,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

const categories = [
  'Akidah', 'Fiqih', 'Hadits', 'Sirah', 'Tafsir',
  'Akhlak', 'Parenting', 'Muamalah', 'Tahsin'
]

export default function VideoKajianAdminPage() {
  const [videos, setVideos] = useState<VideoKajian[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoKajian | null>(null)
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

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/video-kajian')
      // const data = await response.json()
      // setVideos(data)
      setVideos([])
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch videos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
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
    setShowAddDialog(true)
  }

  const handleEdit = (video: VideoKajian) => {
    setSelectedVideo(video)
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
    setShowEditDialog(true)
  }

  const handleDelete = (video: VideoKajian) => {
    setSelectedVideo(video)
    setShowDeleteDialog(true)
  }

  const handleSubmitAdd = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/video-kajian', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      //   }),
      // })
      // if (!response.ok) throw new Error('Failed to create video')

      toast({
        title: 'Success',
        description: 'Video created successfully',
      })
      setShowAddDialog(false)
      fetchVideos()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create video',
        variant: 'destructive',
      })
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedVideo) return

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/video-kajian/${selectedVideo.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      //   }),
      // })
      // if (!response.ok) throw new Error('Failed to update video')

      toast({
        title: 'Success',
        description: 'Video updated successfully',
      })
      setShowEditDialog(false)
      fetchVideos()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update video',
        variant: 'destructive',
      })
    }
  }

  const handleSubmitDelete = async () => {
    if (!selectedVideo) return

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/video-kajian/${selectedVideo.id}`, {
      //   method: 'DELETE',
      // })
      // if (!response.ok) throw new Error('Failed to delete video')

      toast({
        title: 'Success',
        description: 'Video deleted successfully',
      })
      setShowDeleteDialog(false)
      fetchVideos()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete video',
        variant: 'destructive',
      })
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
                         video.ustadz.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || video.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Video Kajian Management</h1>
          <p className="text-gray-600 mt-2">Manage Islamic lecture videos shown in /kajian page</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.reduce((sum, v) => sum + v.views, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.reduce((sum, v) => sum + v.likes, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title or ustadz..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Videos Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Ustadz</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredVideos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No videos found</p>
                    <Button onClick={handleAdd} variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Video
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-primary-600" />
                        {video.title}
                      </div>
                    </TableCell>
                    <TableCell>{video.ustadz}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{video.category}</Badge>
                    </TableCell>
                    <TableCell>{video.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views}
                      </div>
                    </TableCell>
                    <TableCell>{video.likes}</TableCell>
                    <TableCell>
                      {new Date(video.date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(video)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(video)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Video Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add New Video</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new Islamic lecture video to the kajian page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Keutamaan Ilmu dan Ulama"
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
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="45:30"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Pembahasan tentang keutamaan menuntut ilmu..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="ilmu, ulama, keutamaan, adab"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdd}>Create Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Video</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update video information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ustadz">Ustadz *</Label>
                <Input
                  id="edit-ustadz"
                  value={formData.ustadz}
                  onChange={(e) => setFormData({ ...formData, ustadz: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <select
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration *</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-videoUrl">Video URL *</Label>
              <Input
                id="edit-videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
              <Input
                id="edit-thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit}>Update Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this video?
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete the video <strong>{selectedVideo.title}</strong> by {selectedVideo.ustadz}.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSubmitDelete}>
              Delete Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
