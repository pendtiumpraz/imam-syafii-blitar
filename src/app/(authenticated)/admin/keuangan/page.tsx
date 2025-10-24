'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import {
  DollarSign,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  X,
} from 'lucide-react'

interface Transaction {
  id?: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: string
  description: string
  reference?: string
}

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  code?: string
  color?: string
}

interface TransactionStats {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

export default function KeuanganPage() {
  const [activeTab, setActiveTab] = useState('bulk-entry')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Bulk transaction entry
  const [bulkTransactions, setBulkTransactions] = useState<Transaction[]>([
    { date: new Date().toISOString().split('T')[0], type: 'INCOME', category: '', amount: '', description: '' },
  ])

  // Categories
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    code: '',
    color: '#10B981',
  })

  // Transaction history
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  })

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchTransactions()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/financial/categories')
      if (response.ok) {
        const data = await response.json()
        setIncomeCategories(data.filter((c: Category) => c.type === 'INCOME'))
        setExpenseCategories(data.filter((c: Category) => c.type === 'EXPENSE'))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      if (typeFilter) params.append('type', typeFilter)
      if (categoryFilter) params.append('category', categoryFilter)

      const response = await fetch(`/api/financial/transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBulkRow = () => {
    setBulkTransactions([
      ...bulkTransactions,
      { date: new Date().toISOString().split('T')[0], type: 'INCOME', category: '', amount: '', description: '' },
    ])
  }

  const handleRemoveBulkRow = (index: number) => {
    setBulkTransactions(bulkTransactions.filter((_, i) => i !== index))
  }

  const handleUpdateBulkRow = (index: number, field: keyof Transaction, value: any) => {
    const updated = [...bulkTransactions]
    updated[index] = { ...updated[index], [field]: value }
    setBulkTransactions(updated)
  }

  const handleSaveBulkTransactions = async () => {
    // Validate
    const invalid = bulkTransactions.some(
      (t) => !t.date || !t.category || !t.amount || parseFloat(t.amount) <= 0
    )

    if (invalid) {
      toast({
        title: 'Validasi',
        description: 'Pastikan semua transaksi memiliki tanggal, kategori, dan jumlah yang valid',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/financial/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: bulkTransactions }),
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan transaksi')
      }

      toast({
        title: 'Berhasil',
        description: `${bulkTransactions.length} transaksi berhasil disimpan`,
      })

      // Reset form
      setBulkTransactions([
        { date: new Date().toISOString().split('T')[0], type: 'INCOME', category: '', amount: '', description: '' },
      ])

      // Refresh data
      fetchTransactions()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan transaksi',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      toast({
        title: 'Validasi',
        description: 'Nama kategori harus diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/financial/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })

      if (!response.ok) {
        throw new Error('Gagal menambah kategori')
      }

      toast({
        title: 'Berhasil',
        description: 'Kategori berhasil ditambahkan',
      })

      setCategoryForm({ name: '', type: 'INCOME', code: '', color: '#10B981' })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambah kategori',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return

    try {
      const response = await fetch(`/api/financial/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus kategori')
      }

      toast({
        title: 'Berhasil',
        description: 'Kategori berhasil dihapus',
      })

      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus kategori',
        variant: 'destructive',
      })
    }
  }

  const handleExportTransactions = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      if (typeFilter) params.append('type', typeFilter)
      if (categoryFilter) params.append('category', categoryFilter)

      const response = await fetch(`/api/financial/transactions/export?${params}`)
      if (!response.ok) {
        throw new Error('Gagal export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()

      toast({
        title: 'Berhasil',
        description: 'Data berhasil diexport',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal export data',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
          <p className="text-gray-600 mt-2">Kelola transaksi dan kategori keuangan</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(stats.balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Jumlah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bulk-entry">Input Massal</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        {/* Bulk Entry Tab */}
        <TabsContent value="bulk-entry" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Entry Transaksi Massal</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={handleAddBulkRow} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Baris
                  </Button>
                  <Button
                    onClick={handleSaveBulkTransactions}
                    size="sm"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Semua ({bulkTransactions.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Referensi</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkTransactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="date"
                            value={transaction.date}
                            onChange={(e) => handleUpdateBulkRow(index, 'date', e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={transaction.type}
                            onChange={(e) => handleUpdateBulkRow(index, 'type', e.target.value)}
                            className="px-3 py-2 border rounded-md w-32"
                          >
                            <option value="INCOME">Pemasukan</option>
                            <option value="EXPENSE">Pengeluaran</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            value={transaction.category}
                            onChange={(e) => handleUpdateBulkRow(index, 'category', e.target.value)}
                            className="px-3 py-2 border rounded-md w-40"
                          >
                            <option value="">Pilih kategori</option>
                            {(transaction.type === 'INCOME' ? incomeCategories : expenseCategories).map(
                              (cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              )
                            )}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={transaction.amount}
                            onChange={(e) => handleUpdateBulkRow(index, 'amount', e.target.value)}
                            placeholder="0"
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={transaction.description}
                            onChange={(e) => handleUpdateBulkRow(index, 'description', e.target.value)}
                            placeholder="Keterangan"
                            className="w-48"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={transaction.reference || ''}
                            onChange={(e) => handleUpdateBulkRow(index, 'reference', e.target.value)}
                            placeholder="No. Ref"
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          {bulkTransactions.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveBulkRow(index)}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input
                  placeholder="Nama Kategori"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
                <select
                  value={categoryForm.type}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, type: e.target.value as 'INCOME' | 'EXPENSE' })
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
                <Input
                  placeholder="Kode (opsional)"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                />
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
                <Button onClick={handleAddCategory} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Kategori Pemasukan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Belum ada kategori pemasukan</p>
                  ) : (
                    incomeCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            {cat.code && (
                              <p className="text-xs text-gray-500">Kode: {cat.code}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategory(cat.id)}
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

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Kategori Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenseCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Belum ada kategori pengeluaran</p>
                  ) : (
                    expenseCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            {cat.code && (
                              <p className="text-xs text-gray-500">Kode: {cat.code}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategory(cat.id)}
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
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Filter Transaksi</CardTitle>
                <Button onClick={handleExportTransactions} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Dari tanggal"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Sampai tanggal"
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">Semua Tipe</option>
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">Semua Kategori</option>
                  {[...incomeCategories, ...expenseCategories].map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button onClick={fetchTransactions} className="bg-green-600 hover:bg-green-700">
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Referensi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tidak ada transaksi
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                transaction.type === 'INCOME'
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : 'bg-red-50 text-red-700 border-red-300'
                              }
                            >
                              {transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.categoryName}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span
                              className={
                                transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {transaction.type === 'INCOME' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {transaction.reference || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Keuangan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Pilih jenis laporan yang ingin digenerate:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => window.open('/api/financial/reports/general-donations', '_blank')}
                >
                  <FileText className="w-8 h-8 mb-2 text-green-600" />
                  <span>Laporan Donasi Umum</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => window.open('/api/financial/reports/ota-donations', '_blank')}
                >
                  <FileText className="w-8 h-8 mb-2 text-blue-600" />
                  <span>Laporan OTA</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => window.open('/api/financial/reports/income-expense', '_blank')}
                >
                  <FileText className="w-8 h-8 mb-2 text-purple-600" />
                  <span>Laporan Pemasukan & Pengeluaran</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => window.open('/api/financial/reports/monthly', '_blank')}
                >
                  <FileText className="w-8 h-8 mb-2 text-orange-600" />
                  <span>Laporan Bulanan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
