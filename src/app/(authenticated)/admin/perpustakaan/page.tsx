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
import { EbookForm } from '@/components/perpustakaan/ebook-form'
import { toast } from '@/components/ui/use-toast'
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Upload,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Ebook {
  id: string
  title: string
  author: string
  description: string
  category: string
  subcategory?: string
  fileUrl: string
  coverImage?: string
  fileSize?: number
  pageCount?: number
  language: string
  publisher?: string
  publishYear?: string
  tags: string[]
  downloadCount: number
  viewCount: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

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

export default function PerpustakaanAdminPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null)
  const [formData, setFormData] = useState<EbookFormData>({
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
  })

  useEffect(() => {
    fetchEbooks()
  }, [])

  const fetchEbooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ebooks')
      if (response.ok) {
        const data = await response.json()
        setEbooks(data)
      }
    } catch (error) {
      console.error('Error fetching ebooks:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch ebooks',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
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
    })
    setShowAddDialog(true)
  }

  const handleEdit = (ebook: Ebook) => {
    setSelectedEbook(ebook)
    setFormData({
      title: ebook.title,
      author: ebook.author,
      description: ebook.description,
      category: ebook.category,
      subcategory: ebook.subcategory || '',
      fileUrl: ebook.fileUrl,
      coverImage: ebook.coverImage || '',
      fileSize: ebook.fileSize?.toString() || '',
      pageCount: ebook.pageCount?.toString() || '',
      language: ebook.language,
      publisher: ebook.publisher || '',
      publishYear: ebook.publishYear || '',
      tags: ebook.tags.join(', '),
      isFeatured: ebook.isFeatured,
    })
    setShowEditDialog(true)
  }

  const handleDelete = (ebook: Ebook) => {
    setSelectedEbook(ebook)
    setShowDeleteDialog(true)
  }

  const handleSubmitAdd = async (data: any) => {
    const response = await fetch('/api/ebooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create ebook')
    }

    toast({
      title: 'Success',
      description: 'Ebook created successfully',
    })
    setShowAddDialog(false)
    fetchEbooks()
  }

  const handleSubmitEdit = async (data: any) => {
    if (!selectedEbook) return

    const response = await fetch(`/api/ebooks/${selectedEbook.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update ebook')
    }

    toast({
      title: 'Success',
      description: 'Ebook updated successfully',
    })
    setShowEditDialog(false)
    fetchEbooks()
  }

  const handleSubmitDelete = async () => {
    if (!selectedEbook) return

    try {
      const response = await fetch(`/api/ebooks/${selectedEbook.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete ebook')
      }

      toast({
        title: 'Success',
        description: 'Ebook deleted successfully',
      })
      setShowDeleteDialog(false)
      fetchEbooks()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ebook',
        variant: 'destructive',
      })
    }
  }

  const filteredEbooks = ebooks.filter(ebook => {
    const matchesSearch = ebook.title.toLowerCase().includes(search.toLowerCase()) ||
                         ebook.author.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || ebook.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Perpustakaan Management</h1>
          <p className="text-gray-600 mt-2">Manage PDF books and ebooks shown in /perpustakaan page</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Ebook
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ebooks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ebooks.reduce((sum, e) => sum + e.viewCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ebooks.reduce((sum, e) => sum + e.downloadCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Featured Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ebooks.filter(e => e.isFeatured).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title or author..."
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
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Ebooks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredEbooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No ebooks found</p>
                    <Button onClick={handleAdd} variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Ebook
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEbooks.map((ebook) => (
                  <TableRow key={ebook.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        {ebook.title}
                      </div>
                    </TableCell>
                    <TableCell>{ebook.author}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabels[ebook.category]}</Badge>
                    </TableCell>
                    <TableCell>{ebook.pageCount || '-'}</TableCell>
                    <TableCell>{formatFileSize(ebook.fileSize)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {ebook.viewCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {ebook.downloadCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ebook.isFeatured ? (
                        <Badge className="bg-yellow-500">Featured</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(ebook)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(ebook)}
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

      {/* Add Ebook Form */}
      <EbookForm
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleSubmitAdd}
        mode="add"
        initialData={{
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
        }}
        title="Add New Ebook"
        description="Add a new book or ebook to the digital library."
      />

      {/* Edit Ebook Form */}
      <EbookForm
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSubmit={handleSubmitEdit}
        mode="edit"
        initialData={formData}
        title="Edit Ebook"
        description="Update ebook information."
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ebook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ebook?
            </DialogDescription>
          </DialogHeader>
          {selectedEbook && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete <strong>{selectedEbook.title}</strong> by {selectedEbook.author}.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSubmitDelete}>
              Delete Ebook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
