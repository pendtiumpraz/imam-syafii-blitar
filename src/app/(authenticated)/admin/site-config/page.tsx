'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import {
  Settings,
  Upload,
  Save,
  Plus,
  Trash2,
  Menu,
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
} from 'lucide-react'

interface SiteConfig {
  logo?: string
  logoWhite?: string
  favicon?: string
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  address: string
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
  linkedIn?: string
  navbarItems: NavbarItem[]
  footerAbout: string
  footerLinks: FooterLink[]
}

interface NavbarItem {
  id: string
  label: string
  href: string
  order: number
  children?: NavbarItem[]
}

interface FooterLink {
  id: string
  category: string
  label: string
  href: string
}

const defaultConfig: SiteConfig = {
  siteName: 'Pondok Imam Syafii',
  siteDescription: 'Lembaga Pendidikan Islam Terpadu',
  contactEmail: 'info@pondokimamsyafii.sch.id',
  contactPhone: '+62 XXX XXX XXXX',
  contactWhatsapp: '+62 XXX XXX XXXX',
  address: 'Jl. Raya Ponpes Imam Syafii, Jawa Timur',
  navbarItems: [],
  footerAbout: 'Pondok Imam Syafii adalah lembaga pendidikan Islam terpadu yang menyelenggarakan pendidikan dari TK, SD, hingga Pondok Pesantren.',
  footerLinks: [],
}

export default function SiteConfigPage() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Navbar item form state
  const [navbarForm, setNavbarForm] = useState({ label: '', href: '', order: 0 })
  const [editingNavbar, setEditingNavbar] = useState<string | null>(null)

  // Footer link form state
  const [footerForm, setFooterForm] = useState({ category: '', label: '', href: '' })
  const [editingFooter, setEditingFooter] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-config')
      if (response.ok) {
        const data = await response.json()
        setConfig({ ...defaultConfig, ...data })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast({
        title: 'Error',
        description: 'Gagal mengambil konfigurasi situs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan konfigurasi')
      }

      toast({
        title: 'Berhasil',
        description: 'Konfigurasi situs berhasil disimpan',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan konfigurasi',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddNavbarItem = () => {
    if (!navbarForm.label || !navbarForm.href) {
      toast({
        title: 'Validasi',
        description: 'Label dan URL harus diisi',
        variant: 'destructive',
      })
      return
    }

    const newItem: NavbarItem = {
      id: Date.now().toString(),
      label: navbarForm.label,
      href: navbarForm.href,
      order: navbarForm.order || config.navbarItems.length,
    }

    setConfig({
      ...config,
      navbarItems: [...config.navbarItems, newItem].sort((a, b) => a.order - b.order),
    })

    setNavbarForm({ label: '', href: '', order: 0 })
  }

  const handleDeleteNavbarItem = (id: string) => {
    setConfig({
      ...config,
      navbarItems: config.navbarItems.filter(item => item.id !== id),
    })
  }

  const handleAddFooterLink = () => {
    if (!footerForm.category || !footerForm.label || !footerForm.href) {
      toast({
        title: 'Validasi',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      })
      return
    }

    const newLink: FooterLink = {
      id: Date.now().toString(),
      category: footerForm.category,
      label: footerForm.label,
      href: footerForm.href,
    }

    setConfig({
      ...config,
      footerLinks: [...config.footerLinks, newLink],
    })

    setFooterForm({ category: '', label: '', href: '' })
  }

  const handleDeleteFooterLink = (id: string) => {
    setConfig({
      ...config,
      footerLinks: config.footerLinks.filter(link => link.id !== id),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Konfigurasi Situs</h1>
          <p className="text-gray-600 mt-2">Kelola pengaturan website Pondok Imam Syafii</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Semua
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="navbar">Navbar</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Umum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Situs</label>
                <Input
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  placeholder="Pondok Imam Syafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi Situs</label>
                <Textarea
                  value={config.siteDescription}
                  onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                  placeholder="Deskripsi singkat tentang situs..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <Input
                  type="email"
                  value={config.contactEmail}
                  onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                  placeholder="info@pondokimamsyafii.sch.id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telepon
                </label>
                <Input
                  type="tel"
                  value={config.contactPhone}
                  onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                  placeholder="+62 XXX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <Input
                  type="tel"
                  value={config.contactWhatsapp}
                  onChange={(e) => setConfig({ ...config, contactWhatsapp: e.target.value })}
                  placeholder="+62 XXX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Alamat
                </label>
                <Textarea
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  placeholder="Alamat lengkap..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Logo Utama (URL)</label>
                <Input
                  type="url"
                  value={config.logo || ''}
                  onChange={(e) => setConfig({ ...config, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                {config.logo && (
                  <div className="mt-2">
                    <img src={config.logo} alt="Logo" className="h-16 object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Logo Putih (URL)</label>
                <Input
                  type="url"
                  value={config.logoWhite || ''}
                  onChange={(e) => setConfig({ ...config, logoWhite: e.target.value })}
                  placeholder="https://example.com/logo-white.png"
                />
                {config.logoWhite && (
                  <div className="mt-2 bg-gray-900 p-4 rounded">
                    <img src={config.logoWhite} alt="Logo White" className="h-16 object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Favicon (URL)</label>
                <Input
                  type="url"
                  value={config.favicon || ''}
                  onChange={(e) => setConfig({ ...config, favicon: e.target.value })}
                  placeholder="https://example.com/favicon.ico"
                />
                {config.favicon && (
                  <div className="mt-2">
                    <img src={config.favicon} alt="Favicon" className="h-8 w-8 object-contain" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navbar Settings */}
        <TabsContent value="navbar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="w-5 h-5" />
                Menu Navigasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-medium">Tambah Menu Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Label (e.g., Beranda)"
                    value={navbarForm.label}
                    onChange={(e) => setNavbarForm({ ...navbarForm, label: e.target.value })}
                  />
                  <Input
                    placeholder="URL (e.g., /)"
                    value={navbarForm.href}
                    onChange={(e) => setNavbarForm({ ...navbarForm, href: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Urutan"
                    value={navbarForm.order}
                    onChange={(e) => setNavbarForm({ ...navbarForm, order: parseInt(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddNavbarItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Menu
                </Button>
              </div>

              <div className="space-y-2">
                {config.navbarItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada menu</p>
                ) : (
                  config.navbarItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.href}</p>
                        <Badge variant="outline" className="mt-1">
                          Order: {item.order}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteNavbarItem(item.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tentang di Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.footerAbout}
                onChange={(e) => setConfig({ ...config, footerAbout: e.target.value })}
                placeholder="Deskripsi tentang organisasi untuk footer..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Link Footer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-medium">Tambah Link Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Kategori (e.g., Layanan)"
                    value={footerForm.category}
                    onChange={(e) => setFooterForm({ ...footerForm, category: e.target.value })}
                  />
                  <Input
                    placeholder="Label (e.g., PPDB)"
                    value={footerForm.label}
                    onChange={(e) => setFooterForm({ ...footerForm, label: e.target.value })}
                  />
                  <Input
                    placeholder="URL (e.g., /ppdb)"
                    value={footerForm.href}
                    onChange={(e) => setFooterForm({ ...footerForm, href: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddFooterLink} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Link
                </Button>
              </div>

              <div className="space-y-2">
                {config.footerLinks.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada link footer</p>
                ) : (
                  config.footerLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {link.category}
                        </Badge>
                        <p className="font-medium">{link.label}</p>
                        <p className="text-sm text-gray-600">{link.href}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteFooterLink(link.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Facebook className="w-4 h-4 inline mr-2 text-blue-600" />
                  Facebook
                </label>
                <Input
                  type="url"
                  value={config.facebook || ''}
                  onChange={(e) => setConfig({ ...config, facebook: e.target.value })}
                  placeholder="https://facebook.com/pondokimamsyafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Instagram className="w-4 h-4 inline mr-2 text-pink-600" />
                  Instagram
                </label>
                <Input
                  type="url"
                  value={config.instagram || ''}
                  onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                  placeholder="https://instagram.com/pondokimamsyafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Youtube className="w-4 h-4 inline mr-2 text-red-600" />
                  YouTube
                </label>
                <Input
                  type="url"
                  value={config.youtube || ''}
                  onChange={(e) => setConfig({ ...config, youtube: e.target.value })}
                  placeholder="https://youtube.com/@pondokimamsyafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-2 text-blue-400" />
                  Twitter / X
                </label>
                <Input
                  type="url"
                  value={config.twitter || ''}
                  onChange={(e) => setConfig({ ...config, twitter: e.target.value })}
                  placeholder="https://twitter.com/pondokimamsyafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-2 text-blue-700" />
                  LinkedIn
                </label>
                <Input
                  type="url"
                  value={config.linkedIn || ''}
                  onChange={(e) => setConfig({ ...config, linkedIn: e.target.value })}
                  placeholder="https://linkedin.com/company/pondokimamsyafii"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
