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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  status: 'DRAFT' | 'PUBLISHED'
  category: string
  tags: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  ogImage?: string
  author: string
  publishedAt?: string
  createdAt: string
  viewCount: number
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    category: '',
    tags: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImage: '',
  })

  useEffect(() => {
    fetchArticles()
  }, [statusFilter])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/articles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengambil artikel',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedArticle(null)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      status: 'DRAFT',
      category: '',
      tags: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
    })
    setShowEditor(true)
  }

  const handleEdit = (article: Article) => {
    setSelectedArticle(article)
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featuredImage: article.featuredImage || '',
      status: article.status,
      category: article.category,
      tags: article.tags.join(', '),
      seoTitle: article.seoTitle || '',
      seoDescription: article.seoDescription || '',
      seoKeywords: article.seoKeywords?.join(', ') || '',
      ogImage: article.ogImage || '',
    })
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Validasi',
        description: 'Judul dan konten harus diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }

      const response = await fetch(
        selectedArticle ? `/api/articles/${selectedArticle.id}` : '/api/articles',
        {
          method: selectedArticle ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Gagal menyimpan artikel')
      }

      toast({
        title: 'Berhasil',
        description: selectedArticle ? 'Artikel berhasil diperbarui' : 'Artikel berhasil dibuat',
      })

      setShowEditor(false)
      fetchArticles()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan artikel',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedArticle) return

    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus artikel')
      }

      toast({
        title: 'Berhasil',
        description: 'Artikel berhasil dihapus',
      })

      setShowDeleteDialog(false)
      fetchArticles()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus artikel',
        variant: 'destructive',
      })
    }
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(search.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Artikel</h1>
          <p className="text-gray-600 mt-2">Kelola artikel dan konten website</p>
        </div>
        <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Buat Artikel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Artikel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari artikel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
                  </TableCell>
                </TableRow>
              ) : filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Tidak ada artikel</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          article.status === 'PUBLISHED'
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }
                      >
                        {article.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.viewCount}</TableCell>
                    <TableCell>
                      {new Date(article.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/artikel/${article.slug}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(article)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedArticle(article)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600"
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

      {/* Article Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedArticle ? 'Edit Artikel' : 'Buat Artikel Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Judul *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Judul artikel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-artikel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ringkasan</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Ringkasan singkat artikel..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Konten *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tulis konten artikel di sini..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategori</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Berita, Pengumuman, dll"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (pisah dengan koma)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gambar Utama (URL)</label>
              <Input
                type="url"
                value={formData.featuredImage}
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">SEO Title</label>
                  <Input
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="Judul untuk SEO (max 60 karakter)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SEO Description</label>
                  <Textarea
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder="Deskripsi untuk SEO (max 160 karakter)"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SEO Keywords (pisah dengan koma)</label>
                  <Input
                    value={formData.seoKeywords}
                    onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Open Graph Image (URL)</label>
                  <Input
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    placeholder="https://example.com/og-image.jpg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Artikel</DialogTitle>
          </DialogHeader>
          <p>Yakin ingin menghapus artikel "{selectedArticle?.title}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
