'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Save, Globe, FileText, Loader2, Download, CheckCircle2 } from 'lucide-react'

interface SEOConfig {
  siteTitle: string
  siteDescription: string
  siteKeywords: string[]
  author: string
  twitterHandle: string
  fbAppId: string
  ogDefaultImage: string
  googleSiteVerification: string
  googleAnalyticsId: string
  facebookPixelId: string
  robots: string
  canonicalUrl: string
}

const defaultConfig: SEOConfig = {
  siteTitle: 'Pondok Imam Syafii',
  siteDescription: 'Lembaga Pendidikan Islam Terpadu',
  siteKeywords: [],
  author: 'Pondok Imam Syafii',
  twitterHandle: '',
  fbAppId: '',
  ogDefaultImage: '',
  googleSiteVerification: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
  robots: 'index, follow',
  canonicalUrl: '',
}

export default function SEOPage() {
  const [config, setConfig] = useState<SEOConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [sitemapStatus, setSitemapStatus] = useState({ generating: false, generated: false })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seo')
      if (response.ok) {
        const data = await response.json()
        setConfig({ ...defaultConfig, ...data })
      }
    } catch (error) {
      console.error('Error fetching SEO config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan konfigurasi SEO')
      }

      toast({
        title: 'Berhasil',
        description: 'Konfigurasi SEO berhasil disimpan',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan konfigurasi SEO',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateSitemap = async () => {
    try {
      setSitemapStatus({ generating: true, generated: false })
      const response = await fetch('/api/sitemap/generate', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Gagal generate sitemap')
      }

      setSitemapStatus({ generating: false, generated: true })
      toast({
        title: 'Berhasil',
        description: 'Sitemap berhasil digenerate',
      })

      // Reset status after 3 seconds
      setTimeout(() => {
        setSitemapStatus({ generating: false, generated: false })
      }, 3000)
    } catch (error: any) {
      setSitemapStatus({ generating: false, generated: false })
      toast({
        title: 'Error',
        description: error.message || 'Gagal generate sitemap',
        variant: 'destructive',
      })
    }
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
          <h1 className="text-3xl font-bold">SEO Manager</h1>
          <p className="text-gray-600 mt-2">Kelola pengaturan SEO dan metadata website</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic SEO</TabsTrigger>
          <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
        </TabsList>

        {/* Basic SEO Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Site Title *</label>
                <Input
                  value={config.siteTitle}
                  onChange={(e) => setConfig({ ...config, siteTitle: e.target.value })}
                  placeholder="Pondok Imam Syafii"
                />
                <p className="text-xs text-gray-500 mt-1">Maks 60 karakter untuk hasil terbaik di Google</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Site Description *</label>
                <Textarea
                  value={config.siteDescription}
                  onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                  placeholder="Deskripsi singkat tentang website..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Maks 160 karakter untuk hasil terbaik di Google</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Keywords (pisah dengan koma)</label>
                <Textarea
                  value={config.siteKeywords.join(', ')}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      siteKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean),
                    })
                  }
                  placeholder="pondok pesantren, sekolah islam, tahfidz, dll"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Author</label>
                <Input
                  value={config.author}
                  onChange={(e) => setConfig({ ...config, author: e.target.value })}
                  placeholder="Pondok Imam Syafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Canonical URL</label>
                <Input
                  type="url"
                  value={config.canonicalUrl}
                  onChange={(e) => setConfig({ ...config, canonicalUrl: e.target.value })}
                  placeholder="https://pondokimamsyafii.sch.id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Robots Meta Tag</label>
                <select
                  value={config.robots}
                  onChange={(e) => setConfig({ ...config, robots: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="index, follow">Index, Follow (Recommended)</option>
                  <option value="noindex, nofollow">No Index, No Follow</option>
                  <option value="index, nofollow">Index, No Follow</option>
                  <option value="noindex, follow">No Index, Follow</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Graph Tab */}
        <TabsContent value="opengraph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph & Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default OG Image (URL)</label>
                <Input
                  type="url"
                  value={config.ogDefaultImage}
                  onChange={(e) => setConfig({ ...config, ogDefaultImage: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Gambar default untuk share di sosial media (1200x630 px)</p>
                {config.ogDefaultImage && (
                  <div className="mt-2">
                    <img src={config.ogDefaultImage} alt="OG Image" className="h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Twitter Handle</label>
                <Input
                  value={config.twitterHandle}
                  onChange={(e) => setConfig({ ...config, twitterHandle: e.target.value })}
                  placeholder="@pondokimamsyafii"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Facebook App ID</label>
                <Input
                  value={config.fbAppId}
                  onChange={(e) => setConfig({ ...config, fbAppId: e.target.value })}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Google Site Verification</label>
                <Input
                  value={config.googleSiteVerification}
                  onChange={(e) => setConfig({ ...config, googleSiteVerification: e.target.value })}
                  placeholder="kode verifikasi dari Google Search Console"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Google Analytics ID</label>
                <Input
                  value={config.googleAnalyticsId}
                  onChange={(e) => setConfig({ ...config, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX atau UA-XXXXXXXXX-X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Facebook Pixel ID</label>
                <Input
                  value={config.facebookPixelId}
                  onChange={(e) => setConfig({ ...config, facebookPixelId: e.target.value })}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sitemap Tab */}
        <TabsContent value="sitemap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Sitemap Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Generate sitemap.xml untuk membantu mesin pencari menemukan dan mengindeks halaman website.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateSitemap}
                  disabled={sitemapStatus.generating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {sitemapStatus.generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : sitemapStatus.generated ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Generated!
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Sitemap
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open('/sitemap.xml', '_blank')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Lihat Sitemap
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open('/robots.txt', '_blank')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Lihat Robots.txt
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Submit ke Search Engines:</h3>
                <div className="space-y-2">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline"
                  >
                    → Google Search Console
                  </a>
                  <a
                    href="https://www.bing.com/webmasters"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline"
                  >
                    → Bing Webmaster Tools
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">Tools untuk mengecek SEO website:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <a
                  href="https://pagespeed.web.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Google PageSpeed Insights</span>
                </a>
                <a
                  href="https://developers.google.com/search/docs/appearance/structured-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Structured Data Testing Tool</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
