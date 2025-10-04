'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { UserFormSlideOver } from '@/components/users/user-form-slideover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Zap,
  CheckCircle2,
  Lock,
  RotateCcw,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  generateSecurePassword, 
  generateMemorablePassword, 
  checkPasswordStrength, 
  copyToClipboard,
  type PasswordStrength 
} from '@/lib/password-utils'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface GeneratedPasswordData {
  password: string
  username: string
  email: string
}

const roleIcons = {
  SUPER_ADMIN: <ShieldCheck className="w-4 h-4" />,
  ADMIN: <Shield className="w-4 h-4" />,
  USTADZ: <UserCheck className="w-4 h-4" />,
  STAFF: <User className="w-4 h-4" />,
  PARENT: <Users className="w-4 h-4" />,
}

const roleColors = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  USTADZ: 'bg-blue-100 text-blue-800',
  STAFF: 'bg-green-100 text-green-800',
  PARENT: 'bg-gray-100 text-gray-800',
}

interface Role {
  id: string
  name: string
  description: string
  color: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showUserSlideOver, setShowUserSlideOver] = useState(false)
  const [slideOverMode, setSlideOverMode] = useState<'add' | 'edit'>('add')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showGeneratedPasswordDialog, setShowGeneratedPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [changePasswordData, setChangePasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [generatedPasswordData, setGeneratedPasswordData] = useState<GeneratedPasswordData>({
    password: '',
    username: '',
    email: '',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Check if user has permission
  useEffect(() => {
    if (session && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      toast({
        title: 'Access Denied',
        description: 'Only Admin can access user management',
        variant: 'destructive',
      })
    }
  }, [session, router])

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        if (!response.ok) throw new Error('Failed to fetch roles')
        const data = await response.json()
        setRoles(data.roles || [])
      } catch (error) {
        console.error('Error fetching roles:', error)
        // Fallback to hardcoded roles if fetch fails
        setRoles([
          { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system access', color: 'bg-red-100' },
          { id: 'ADMIN', name: 'Admin', description: 'Administrative access', color: 'bg-purple-100' },
          { id: 'USTADZ', name: 'Ustadz', description: 'Teacher access', color: 'bg-blue-100' },
          { id: 'STAFF', name: 'Staff', description: 'Basic staff access', color: 'bg-green-100' },
          { id: 'PARENT', name: 'Parent', description: 'Parent access', color: 'bg-gray-100' },
        ])
      }
    }

    fetchRoles()
  }, [])

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter, activeFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(activeFilter && { isActive: activeFilter }),
      })

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setSlideOverMode('add')
    setShowUserSlideOver(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setSlideOverMode('edit')
    setShowUserSlideOver(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const handleUserFormSubmit = async (data: any) => {
    try {
      if (slideOverMode === 'add') {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create user')
        }

        // Show generated password if one was generated
        if (data.password) {
          setGeneratedPasswordData({
            password: data.password,
            username: data.username,
            email: data.email,
          })
          setShowGeneratedPasswordDialog(true)
        }

        toast({
          title: 'Success',
          description: 'User created successfully',
        })
      } else {
        // Edit mode
        if (!selectedUser) return

        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedUser.id,
            ...data,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update user')
        }

        toast({
          title: 'Success',
          description: 'User updated successfully',
        })
      }

      setShowUserSlideOver(false)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user',
        variant: 'destructive',
      })
      throw error // Re-throw to let the slide-over handle it
    }
  }

  const handleSubmitDelete = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
      setShowDeleteDialog(false)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  // Password utility functions for password change/reset dialogs
  const handlePasswordChange = (password: string) => {
    setChangePasswordData({ ...changePasswordData, newPassword: password })

    if (password) {
      setPasswordStrength(checkPasswordStrength(password))
    } else {
      setPasswordStrength(null)
    }
  }

  const generatePasswordForChange = async (type: 'secure' | 'memorable') => {
    setIsGenerating(true)
    try {
      let password = ''
      if (type === 'secure') {
        password = generateSecurePassword(12)
      } else {
        password = generateMemorablePassword()
      }
      
      setChangePasswordData({ ...changePasswordData, newPassword: password, confirmPassword: password })
      setPasswordStrength(checkPasswordStrength(password))
      
      toast({
        title: 'Password Generated',
        description: `${type === 'secure' ? 'Secure' : 'Memorable'} password generated successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate password',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPasswordToClipboard = async (password: string) => {
    const success = await copyToClipboard(password)
    if (success) {
      toast({
        title: 'Copied!',
        description: 'Password copied to clipboard',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to copy password',
        variant: 'destructive',
      })
    }
  }

  // Dialog handlers
  const handleChangePassword = (user: User) => {
    setSelectedUser(user)
    setChangePasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordStrength(null)
    setShowChangePasswordDialog(true)
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setChangePasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordStrength(null)
    setShowResetPasswordDialog(true)
  }

  // Submit handlers for password operations
  const handleSubmitChangePassword = async () => {
    if (!selectedUser) return

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password confirmation does not match',
        variant: 'destructive',
      })
      return
    }

    if (!changePasswordData.newPassword || changePasswordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      })
      return
    }

    setSaveLoading(true)
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changePasswordData.currentPassword,
          newPassword: changePasswordData.newPassword,
          userId: selectedUser.id !== session?.user.id ? selectedUser.id : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      const result = await response.json()
      
      // Show generated password if it was generated
      if (changePasswordData.newPassword && (changePasswordData.newPassword.includes('!') || changePasswordData.newPassword.includes('@'))) {
        setGeneratedPasswordData({
          password: changePasswordData.newPassword,
          username: selectedUser.username,
          email: selectedUser.email,
        })
        setShowGeneratedPasswordDialog(true)
      }

      toast({
        title: 'Success',
        description: result.message || 'Password changed successfully',
      })
      setShowChangePasswordDialog(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSubmitResetPassword = async () => {
    if (!selectedUser) return

    if (!changePasswordData.newPassword || changePasswordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      })
      return
    }

    setSaveLoading(true)
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: changePasswordData.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset password')
      }

      const result = await response.json()
      
      // Show generated password
      setGeneratedPasswordData({
        password: changePasswordData.newPassword,
        username: selectedUser.username,
        email: selectedUser.email,
      })
      setShowGeneratedPasswordDialog(true)

      toast({
        title: 'Success',
        description: result.message || 'Password reset successfully',
      })
      setShowResetPasswordDialog(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  if (session?.user.role !== 'SUPER_ADMIN' && session?.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users and their roles</p>
        </div>
        <Button onClick={handleAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(users || []).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Super Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(u => u.role === 'SUPER_ADMIN').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(u => u.role === 'ADMIN').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ustadz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(u => u.role === 'USTADZ').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(u => u.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, username, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                (users || []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[user.role as keyof typeof roleColors]} gap-1`}>
                        {roleIcons[user.role as keyof typeof roleIcons]}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                          disabled={user.id === session?.user.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangePassword(user)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        {session?.user.role === 'SUPER_ADMIN' && user.id !== session?.user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPassword(user)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === session?.user.id}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center px-4">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* User Form Slide-over (Add/Edit) */}
      <UserFormSlideOver
        user={selectedUser}
        isOpen={showUserSlideOver}
        onClose={() => setShowUserSlideOver(false)}
        onSubmit={handleUserFormSubmit}
        mode={slideOverMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user?
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete user <strong>{selectedUser.name}</strong> ({selectedUser.username}).
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSubmitDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Change Password</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedUser && selectedUser.id === session?.user.id 
                ? 'Change your password'
                : `Change password for ${selectedUser?.name}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser && selectedUser.id === session?.user.id && (
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={changePasswordData.newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                
                {/* Password Generation Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generatePasswordForChange('secure')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3 mr-1" />
                    )}
                    Secure
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generatePasswordForChange('memorable')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    Memorable
                  </Button>
                  {changePasswordData.newPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyPasswordToClipboard(changePasswordData.newPassword)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Password Strength:</span>
                      <span className={`text-sm font-bold text-${passwordStrength.color}-600`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <Progress 
                      value={(passwordStrength.score / 5) * 100} 
                      className={`h-2 bg-gray-200`}
                    />
                    {passwordStrength.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">Suggestions:</p>
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {passwordStrength.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {changePasswordData.newPassword && changePasswordData.confirmPassword && 
               changePasswordData.newPassword !== changePasswordData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitChangePassword}
              disabled={saveLoading || !changePasswordData.newPassword || 
                       changePasswordData.newPassword !== changePasswordData.confirmPassword}
            >
              {saveLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog (Admin Only) */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reset Password</DialogTitle>
            <DialogDescription className="text-gray-600">
              Reset password for {selectedUser?.name} ({selectedUser?.username})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will reset the user's password. They will need to use the new password to log in.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="reset-password">New Password</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showNewPassword ? "text" : "password"}
                    value={changePasswordData.newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                
                {/* Password Generation Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generatePasswordForChange('secure')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3 mr-1" />
                    )}
                    Secure
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generatePasswordForChange('memorable')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    Memorable
                  </Button>
                  {changePasswordData.newPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyPasswordToClipboard(changePasswordData.newPassword)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Password Strength:</span>
                      <span className={`text-sm font-bold text-${passwordStrength.color}-600`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <Progress 
                      value={(passwordStrength.score / 5) * 100} 
                      className={`h-2 bg-gray-200`}
                    />
                    {passwordStrength.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">Suggestions:</p>
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {passwordStrength.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitResetPassword}
              disabled={saveLoading || !changePasswordData.newPassword}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saveLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Password Success Dialog */}
      <Dialog open={showGeneratedPasswordDialog} onOpenChange={setShowGeneratedPasswordDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Password Updated Successfully
            </DialogTitle>
            <DialogDescription>
              The password has been updated. Please save the new password securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium text-gray-600">User:</Label>
                  <p className="font-medium">{generatedPasswordData.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email:</Label>
                  <p className="font-medium">{generatedPasswordData.email}</p>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">New Password:</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={generatedPasswordData.password}
                  readOnly
                  className="font-mono bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => copyPasswordToClipboard(generatedPasswordData.password)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Click the copy button to copy this password to clipboard
              </p>
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Make sure to save this password securely. 
                The user will need this password to log in to their account.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => copyPasswordToClipboard(generatedPasswordData.password)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Password
            </Button>
            <Button onClick={() => setShowGeneratedPasswordDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}