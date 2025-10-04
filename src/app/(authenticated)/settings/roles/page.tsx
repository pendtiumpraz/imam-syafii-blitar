'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Plus, Edit, Trash2, Users, Check, X, MoreHorizontal, Crown, User, BookOpen, Settings, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  critical?: boolean
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  userCount: number
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

const permissions: Permission[] = [
  // Dashboard
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access dashboard page', category: 'Dashboard' },

  // Student Management
  { id: 'student.view', name: 'View Students', description: 'View student list and details', category: 'Data Siswa' },
  { id: 'student.create', name: 'Create Student', description: 'Add new student records', category: 'Data Siswa' },
  { id: 'student.update', name: 'Update Student', description: 'Edit student information', category: 'Data Siswa' },
  { id: 'student.delete', name: 'Delete Student', description: 'Delete student records', category: 'Data Siswa', critical: true },
  { id: 'student.graduate', name: 'Graduate Student', description: 'Move students to alumni', category: 'Data Siswa' },
  { id: 'student.export', name: 'Export Students', description: 'Export student data', category: 'Data Siswa' },

  // Alumni Management
  { id: 'alumni.view', name: 'View Alumni', description: 'View alumni list and details', category: 'Data Alumni' },
  { id: 'alumni.create', name: 'Create Alumni', description: 'Add new alumni records', category: 'Data Alumni' },
  { id: 'alumni.update', name: 'Update Alumni', description: 'Edit alumni information', category: 'Data Alumni' },
  { id: 'alumni.delete', name: 'Delete Alumni', description: 'Delete alumni records', category: 'Data Alumni', critical: true },

  // Teacher Management
  { id: 'teacher.view', name: 'View Teachers', description: 'View teacher list', category: 'Data Pengajar' },
  { id: 'teacher.create', name: 'Create Teacher', description: 'Add new teacher records', category: 'Data Pengajar' },
  { id: 'teacher.update', name: 'Update Teacher', description: 'Edit teacher information', category: 'Data Pengajar' },
  { id: 'teacher.delete', name: 'Delete Teacher', description: 'Delete teacher records', category: 'Data Pengajar', critical: true },

  // PPDB Admin
  { id: 'ppdb.view', name: 'View PPDB', description: 'Access PPDB admin page', category: 'Admin PPDB' },
  { id: 'ppdb.manage', name: 'Manage PPDB', description: 'Manage student registration', category: 'Admin PPDB' },
  { id: 'ppdb.approve', name: 'Approve PPDB', description: 'Approve/reject applications', category: 'Admin PPDB' },

  // OTA Admin
  { id: 'ota.view', name: 'View OTA Programs', description: 'Access OTA admin page', category: 'OTA Admin' },
  { id: 'ota.create', name: 'Create OTA Program', description: 'Create new OTA programs', category: 'OTA Admin' },
  { id: 'ota.update', name: 'Update OTA Program', description: 'Edit OTA program details', category: 'OTA Admin' },
  { id: 'ota.delete', name: 'Delete OTA Program', description: 'Delete OTA programs', category: 'OTA Admin', critical: true },

  // Finance Management
  { id: 'finance.view', name: 'View Finance', description: 'View financial data', category: 'Keuangan' },
  { id: 'finance.create', name: 'Create Transaction', description: 'Create payment records', category: 'Keuangan' },
  { id: 'finance.update', name: 'Update Transaction', description: 'Edit payment records', category: 'Keuangan' },
  { id: 'finance.delete', name: 'Delete Transaction', description: 'Delete payment records', category: 'Keuangan', critical: true },
  { id: 'finance.export', name: 'Export Finance', description: 'Export financial data', category: 'Keuangan' },

  // Activities Management
  { id: 'activity.view', name: 'View Activities', description: 'View activity list', category: 'Kegiatan' },
  { id: 'activity.create', name: 'Create Activity', description: 'Add new activities', category: 'Kegiatan' },
  { id: 'activity.update', name: 'Update Activity', description: 'Edit activity details', category: 'Kegiatan' },
  { id: 'activity.delete', name: 'Delete Activity', description: 'Delete activities', category: 'Kegiatan', critical: true },

  // Curriculum Management
  { id: 'curriculum.view', name: 'View Curriculum', description: 'View curriculum data', category: 'Kurikulum' },
  { id: 'curriculum.create', name: 'Create Curriculum', description: 'Add new curriculum', category: 'Kurikulum' },
  { id: 'curriculum.update', name: 'Update Curriculum', description: 'Edit curriculum details', category: 'Kurikulum' },
  { id: 'curriculum.delete', name: 'Delete Curriculum', description: 'Delete curriculum', category: 'Kurikulum', critical: true },

  // Academic Management
  { id: 'academic.view', name: 'View Academic', description: 'Access academic dashboard', category: 'Akademik' },
  { id: 'academic.classes', name: 'Manage Classes', description: 'Manage class data', category: 'Akademik' },
  { id: 'academic.subjects', name: 'Manage Subjects', description: 'Manage subjects/courses', category: 'Akademik' },
  { id: 'academic.grades', name: 'Input Grades', description: 'Input and manage student grades', category: 'Akademik' },
  { id: 'academic.attendance', name: 'Manage Attendance', description: 'Record student attendance', category: 'Akademik' },
  { id: 'academic.schedules', name: 'Manage Schedules', description: 'Create and edit schedules', category: 'Akademik' },
  { id: 'academic.reportcards', name: 'Manage Report Cards', description: 'Generate and view report cards', category: 'Akademik' },
  { id: 'academic.exams', name: 'Manage Exams', description: 'Create and manage exams', category: 'Akademik' },

  // Quran Memorization
  { id: 'hafalan.view', name: 'View Hafalan', description: 'View Quran memorization data', category: 'Hafalan Al-Quran' },
  { id: 'hafalan.setoran', name: 'Manage Setoran', description: 'Record memorization submissions', category: 'Hafalan Al-Quran' },
  { id: 'hafalan.progress', name: 'View Progress', description: 'View student memorization progress', category: 'Hafalan Al-Quran' },

  // Video Kajian
  { id: 'video.view', name: 'View Videos', description: 'View video kajian list', category: 'Video Kajian' },
  { id: 'video.create', name: 'Create Video', description: 'Add new video kajian', category: 'Video Kajian' },
  { id: 'video.update', name: 'Update Video', description: 'Edit video details', category: 'Video Kajian' },
  { id: 'video.delete', name: 'Delete Video', description: 'Delete video kajian', category: 'Video Kajian', critical: true },

  // Perpustakaan (Library)
  { id: 'library.view', name: 'View Library', description: 'View ebook library', category: 'Perpustakaan' },
  { id: 'library.create', name: 'Add Ebook', description: 'Add new ebook/PDF', category: 'Perpustakaan' },
  { id: 'library.update', name: 'Update Ebook', description: 'Edit ebook details', category: 'Perpustakaan' },
  { id: 'library.delete', name: 'Delete Ebook', description: 'Delete ebook', category: 'Perpustakaan', critical: true },

  // Tanya Ustadz
  { id: 'tanyaustadz.view', name: 'View Questions', description: 'View student questions', category: 'Tanya Ustadz' },
  { id: 'tanyaustadz.answer', name: 'Answer Questions', description: 'Respond to questions', category: 'Tanya Ustadz' },
  { id: 'tanyaustadz.moderate', name: 'Moderate Questions', description: 'Approve/reject questions', category: 'Tanya Ustadz' },

  // Unit Usaha
  { id: 'unitusaha.view', name: 'View Unit Usaha', description: 'View business units dashboard', category: 'Unit Usaha' },
  { id: 'unitusaha.koperasi', name: 'Manage Koperasi', description: 'Manage school cooperative', category: 'Unit Usaha' },
  { id: 'unitusaha.kantin', name: 'Manage Kantin', description: 'Manage canteen operations', category: 'Unit Usaha' },
  { id: 'unitusaha.laundry', name: 'Manage Laundry', description: 'Manage laundry service', category: 'Unit Usaha' },
  { id: 'unitusaha.pasarbarkas', name: 'Manage Pasar Barkas', description: 'Manage second-hand market', category: 'Unit Usaha' },
  { id: 'unitusaha.pos', name: 'Manage POS', description: 'Access POS cashier system', category: 'Unit Usaha' },
  { id: 'unitusaha.products', name: 'Manage Products', description: 'Manage product catalog', category: 'Unit Usaha' },
  { id: 'unitusaha.inventory', name: 'Manage Inventory', description: 'Manage stock and inventory', category: 'Unit Usaha' },
  { id: 'unitusaha.suppliers', name: 'Manage Suppliers', description: 'Manage supplier data', category: 'Unit Usaha' },
  { id: 'unitusaha.purchases', name: 'Manage Purchases', description: 'Create purchase orders', category: 'Unit Usaha' },
  { id: 'unitusaha.reports', name: 'View Reports', description: 'View monthly reports', category: 'Unit Usaha' },

  // User Management
  { id: 'users.view', name: 'View Users', description: 'View user accounts', category: 'Pengguna' },
  { id: 'users.create', name: 'Create User', description: 'Create new user accounts', category: 'Pengguna', critical: true },
  { id: 'users.update', name: 'Update User', description: 'Edit user information', category: 'Pengguna' },
  { id: 'users.delete', name: 'Delete User', description: 'Delete user accounts', category: 'Pengguna', critical: true },
  { id: 'users.password', name: 'Reset Password', description: 'Reset user passwords', category: 'Pengguna' },

  // Staff Management
  { id: 'staff.view', name: 'View Staff', description: 'View staff information', category: 'Staff' },
  { id: 'staff.create', name: 'Create Staff', description: 'Add new staff members', category: 'Staff' },
  { id: 'staff.update', name: 'Update Staff', description: 'Edit staff information', category: 'Staff' },
  { id: 'staff.delete', name: 'Delete Staff', description: 'Delete staff accounts', category: 'Staff', critical: true },

  // Settings
  { id: 'settings.view', name: 'View Settings', description: 'Access settings page', category: 'Pengaturan' },
  { id: 'settings.general', name: 'General Settings', description: 'Manage general settings', category: 'Pengaturan' },
  { id: 'settings.payment', name: 'Payment Settings', description: 'Configure payment gateway', category: 'Pengaturan', critical: true },
  { id: 'settings.whatsapp', name: 'WhatsApp API', description: 'Configure WhatsApp integration', category: 'Pengaturan' },
  { id: 'settings.telegram', name: 'Telegram Bot', description: 'Configure Telegram bot', category: 'Pengaturan' },
  { id: 'settings.line', name: 'LINE Messaging', description: 'Configure LINE messaging', category: 'Pengaturan' },
  { id: 'settings.roles', name: 'Manage Roles', description: 'Manage user roles and permissions', category: 'Pengaturan', critical: true },
  { id: 'settings.notifications', name: 'Notification Settings', description: 'Configure notifications', category: 'Pengaturan' },
  { id: 'settings.system', name: 'System Settings', description: 'System configuration', category: 'Pengaturan', critical: true },
  { id: 'settings.security', name: 'Security Settings', description: 'Configure 2FA and security', category: 'Pengaturan', critical: true },
  { id: 'system.database', name: 'Database Access', description: 'Direct database access', category: 'System Administration', critical: true },
]

export default function RoleManagementPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [slideOverMode, setSlideOverMode] = useState<'add' | 'edit' | 'view'>('add')
  const [activeTab, setActiveTab] = useState<string>('Dashboard')

  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      permissions: permissions.map(p => p.id),
      color: 'bg-red-100 text-red-800 border-red-300',
      userCount: 1,
      isSystem: true,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'finance',
      name: 'Finance Manager',
      description: 'Manage payments, financial operations, and related reports',
      permissions: [
        'student.read', 'payment.create', 'payment.read', 'payment.update', 'payment.delete', 'payment.process', 'payment.refund', 'payment.export',
        'reports.financial', 'settings.payment', 'communication.whatsapp', 'communication.email'
      ],
      color: 'bg-green-100 text-green-800 border-green-300',
      userCount: 2,
      isSystem: true,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'academic',
      name: 'Academic Staff',
      description: 'Manage academic operations, students, and classes',
      permissions: [
        'student.create', 'student.read', 'student.update', 'student.import', 'student.export',
        'class.create', 'class.read', 'class.update', 'class.delete',
        'reports.academic', 'reports.student', 'reports.attendance',
        'communication.whatsapp', 'communication.email'
      ],
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      userCount: 5,
      isSystem: true,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'teacher',
      name: 'Teacher',
      description: 'View student information, manage classes, and access academic reports',
      permissions: [
        'student.read', 'class.read', 'reports.student', 'reports.academic', 'reports.attendance'
      ],
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      userCount: 15,
      isSystem: true,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'staff',
      name: 'General Staff',
      description: 'Basic access to student information and general reports',
      permissions: ['student.read', 'reports.student'],
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      userCount: 8,
      isSystem: false,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date()
    }
  ])

  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: [],
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  })

  const colorOptions = [
    { label: 'Red', value: 'bg-red-100 text-red-800 border-red-300' },
    { label: 'Green', value: 'bg-green-100 text-green-800 border-green-300' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-800 border-blue-300' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-800 border-purple-300' },
    { label: 'Yellow', value: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { label: 'Pink', value: 'bg-pink-100 text-pink-800 border-pink-300' },
    { label: 'Indigo', value: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { label: 'Gray', value: 'bg-gray-100 text-gray-800 border-gray-300' },
  ]

  const handleCreate = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const newRole: Role = {
        ...formData as Role,
        id: Math.random().toString(36).substr(2, 9),
        userCount: 0,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setRoles(prev => [...prev, newRole])
      setIsSlideOverOpen(false)
      resetForm()

      toast({
        title: 'Role Created',
        description: `${newRole.name} role has been created successfully.`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create role.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedRole || !formData.name || !formData.description) {
      return
    }

    setLoading(true)
    try {
      setRoles(prev => prev.map(r =>
        r.id === selectedRole.id
          ? { ...r, ...formData, updatedAt: new Date() } as Role
          : r
      ))

      setIsSlideOverOpen(false)
      setSelectedRole(null)
      resetForm()

      toast({
        title: 'Role Updated',
        description: 'Role has been updated successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      toast({
        title: 'Cannot Delete',
        description: 'System roles cannot be deleted.',
        variant: 'destructive'
      })
      return
    }

    if ((role?.userCount || 0) > 0) {
      toast({
        title: 'Cannot Delete',
        description: 'Role is currently assigned to users. Please reassign users before deleting.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      setRoles(prev => prev.filter(r => r.id !== roleId))
      
      toast({
        title: 'Role Deleted',
        description: 'Role has been deleted successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    })
    setActiveTab('Dashboard') // Reset tab to Dashboard
  }

  const openAddSlideOver = () => {
    resetForm()
    setSlideOverMode('add')
    setSelectedRole(null)
    setActiveTab('Dashboard')
    setIsSlideOverOpen(true)
  }

  const openEditSlideOver = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color
    })
    setActiveTab('Dashboard')
    setSlideOverMode('edit')
    setIsSlideOverOpen(true)
  }

  const openViewSlideOver = (role: Role) => {
    setSelectedRole(role)
    setSlideOverMode('view')
    setIsSlideOverOpen(true)
  }

  const closeSlideOver = () => {
    setIsSlideOverOpen(false)
    setTimeout(() => {
      setSelectedRole(null)
      resetForm()
    }, 300) // Wait for animation to complete
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions?.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...(prev.permissions || []), permissionId]
    }))
  }

  const getRoleIcon = (role: Role) => {
    if (role.name.toLowerCase().includes('admin')) return <Crown className="w-4 h-4" />
    if (role.name.toLowerCase().includes('teacher')) return <BookOpen className="w-4 h-4" />
    if (role.name.toLowerCase().includes('finance')) return <Settings className="w-4 h-4" />
    return <User className="w-4 h-4" />
  }

  const getPermissionsByCategory = () => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  const RoleForm = ({ mode }: { mode: 'add' | 'edit' | 'view' }) => {
    const categorizedPermissions = getPermissionsByCategory()
    const isViewMode = mode === 'view'
    const isEditMode = mode === 'edit'

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter role name"
              disabled={isViewMode || (isEditMode && selectedRole?.isSystem)}
              readOnly={isViewMode}
            />
            {isEditMode && selectedRole?.isSystem && (
              <p className="text-xs text-muted-foreground">System role names cannot be changed</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Role Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => !isViewMode && setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 ${color.value} ${
                    formData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  } ${isViewMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  title={color.label}
                  disabled={isViewMode}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter role description"
            rows={3}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Permissions ({formData.permissions?.length || 0} selected)</Label>
            {!isViewMode && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, permissions: permissions.map(p => p.id) }))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-auto min-w-full">
                {Object.keys(categorizedPermissions).map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs px-3 whitespace-nowrap">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {Object.entries(categorizedPermissions).map(([category, perms]) => (
              <TabsContent key={category} value={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">
                    {category} ({perms.filter(p => formData.permissions?.includes(p.id)).length}/{perms.length} selected)
                  </div>
                  {!isViewMode && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const categoryPermIds = perms.map(p => p.id)
                          setFormData(prev => ({
                            ...prev,
                            permissions: Array.from(new Set([...(prev.permissions || []), ...categoryPermIds]))
                          }))
                        }}
                        className="text-xs h-7"
                      >
                        Select All in {category}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const categoryPermIds = perms.map(p => p.id)
                          setFormData(prev => ({
                            ...prev,
                            permissions: (prev.permissions || []).filter(id => !categoryPermIds.includes(id))
                          }))
                        }}
                        className="text-xs h-7"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        formData.permissions?.includes(permission.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      } ${permission.critical ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <Switch
                        checked={formData.permissions?.includes(permission.id) || false}
                        onCheckedChange={() => togglePermission(permission.id)}
                        disabled={isViewMode || (selectedRole?.isSystem && permission.critical)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {permission.name}
                          </label>
                          {permission.critical && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {formData.permissions && formData.permissions.length > 0 && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={formData.color}>
                  {getRoleIcon({ name: formData.name } as Role)}
                  {formData.name || 'New Role'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formData.permissions.length} permission{formData.permissions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.description}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions for your school management system
          </p>
        </div>

        <Button onClick={openAddSlideOver}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">System Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.isSystem).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Custom Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => !r.isSystem).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{roles.reduce((sum, role) => sum + role.userCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    <Badge className={role.color}>
                      {role.name}
                    </Badge>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
                      <span>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                      <span>Updated {role.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openViewSlideOver(role)}>
                      <Shield className="w-4 h-4 mr-2" />
                      View Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditSlideOver(role)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Role
                    </DropdownMenuItem>
                    {!role.isSystem && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onClick={(e?: React.MouseEvent) => e?.preventDefault()}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Role
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the "{role.name}" role? This action cannot be undone.
                              {role.userCount > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                  Warning: This role is currently assigned to {role.userCount} user{role.userCount !== 1 ? 's' : ''}.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(role.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={role.userCount > 0}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slide-over Panel */}
      {isSlideOverOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
            onClick={closeSlideOver}
          />

          {/* Slide-over Container */}
          <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col ${isSlideOverOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {slideOverMode === 'add' && 'Create New Role'}
                  {slideOverMode === 'edit' && 'Edit Role'}
                  {slideOverMode === 'view' && 'Role Details'}
                </h2>
                <p className="text-sm text-gray-600">
                  {slideOverMode === 'add' && 'Define a new role with specific permissions for your staff members'}
                  {slideOverMode === 'edit' && 'Modify role permissions and settings'}
                  {slideOverMode === 'view' && `View permissions and information for ${selectedRole?.name}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeSlideOver} disabled={loading}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {slideOverMode === 'view' && selectedRole ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Badge className={selectedRole.color}>
                      {getRoleIcon(selectedRole)}
                      {selectedRole.name}
                    </Badge>
                    {selectedRole.isSystem && (
                      <Badge variant="outline">System Role</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {selectedRole.userCount} user{selectedRole.userCount !== 1 ? 's' : ''} assigned
                    </span>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedRole.description}
                    </p>
                  </div>

                  <div>
                    <Label className="text-base">
                      Permissions ({selectedRole.permissions.length})
                    </Label>
                    <div className="mt-3 space-y-4">
                      {Object.entries(getPermissionsByCategory()).map(([category, perms]) => {
                        const categoryPermissions = perms.filter(p => selectedRole.permissions.includes(p.id))
                        if (categoryPermissions.length === 0) return null

                        return (
                          <div key={category}>
                            <h4 className="font-medium text-sm mb-2">
                              {category} ({categoryPermissions.length}/{perms.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {categoryPermissions.map(permission => (
                                <div key={permission.id} className="flex items-center gap-2 text-sm">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span>{permission.name}</span>
                                  {permission.critical && (
                                    <Badge variant="destructive" className="text-xs">
                                      Critical
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <RoleForm mode={slideOverMode} />
              )}
            </div>

            {/* Sticky Footer */}
            <div className="border-t bg-white p-6">
              <div className="flex gap-3 justify-end">
                {slideOverMode === 'view' ? (
                  <>
                    <Button variant="outline" onClick={closeSlideOver}>
                      Close
                    </Button>
                    {selectedRole && (
                      <Button onClick={() => {
                        setFormData({
                          name: selectedRole.name,
                          description: selectedRole.description,
                          permissions: selectedRole.permissions,
                          color: selectedRole.color
                        })
                        setSlideOverMode('edit')
                      }}>
                        Edit Role
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={closeSlideOver} disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={slideOverMode === 'add' ? handleCreate : handleUpdate}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <Save className="w-4 h-4 mr-2 animate-spin" />
                          {slideOverMode === 'add' ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {slideOverMode === 'add' ? 'Create Role' : 'Update Role'}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}