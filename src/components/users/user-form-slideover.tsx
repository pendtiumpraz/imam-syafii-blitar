'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  X,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import {
  generateSecurePassword,
  generateMemorablePassword,
  checkPasswordStrength,
  copyToClipboard,
  type PasswordStrength
} from '@/lib/password-utils'

interface Role {
  id: string
  name: string
  description: string
  color: string
}

interface User {
  id: string
  username: string
  email: string
  name: string
  role: string
  isActive: boolean
}

interface UserFormSlideOverProps {
  user?: User | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  mode: 'add' | 'edit'
}

export function UserFormSlideOver({
  user,
  isOpen,
  onClose,
  onSubmit,
  mode
}: UserFormSlideOverProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || '',
    password: '',
    role: user?.role || 'STAFF',
    isActive: user?.isActive ?? true,
  })

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const response = await fetch('/api/roles')
        if (!response.ok) throw new Error('Failed to fetch roles')
        const data = await response.json()
        setRoles(data.roles || [])
      } catch (error) {
        console.error('Error fetching roles:', error)
        // Fallback to hardcoded roles
        setRoles([
          { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system access', color: 'bg-red-100' },
          { id: 'ADMIN', name: 'Admin', description: 'Administrative access', color: 'bg-purple-100' },
          { id: 'USTADZ', name: 'Ustadz', description: 'Teacher access', color: 'bg-blue-100' },
          { id: 'STAFF', name: 'Staff', description: 'Basic staff access', color: 'bg-green-100' },
          { id: 'PARENT', name: 'Parent', description: 'Parent access', color: 'bg-gray-100' },
        ])
      } finally {
        setLoadingRoles(false)
      }
    }

    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  // Update form when user changes
  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        username: user.username,
        email: user.email,
        name: user.name,
        password: '',
        role: user.role,
        isActive: user.isActive,
      })
    } else if (mode === 'add') {
      setFormData({
        username: '',
        email: '',
        name: '',
        password: '',
        role: 'STAFF',
        isActive: true,
      })
    }
    setPasswordStrength(null)
    setShowPassword(false)
    setError(null)
  }, [user, mode])

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })

    if (password) {
      setPasswordStrength(checkPasswordStrength(password))
    } else {
      setPasswordStrength(null)
    }
  }

  const generatePassword = async (type: 'secure' | 'memorable') => {
    setIsGenerating(true)
    try {
      let password = ''
      if (type === 'secure') {
        password = generateSecurePassword(12)
      } else {
        password = generateMemorablePassword()
      }

      handlePasswordChange(password)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPasswordToClipboard = async (password: string) => {
    await copyToClipboard(password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.email || !formData.name || !formData.role) {
      setError('Please fill in all required fields')
      return
    }

    if (mode === 'add' && !formData.password) {
      setError('Password is required for new users')
      return
    }

    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving')
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
      <div className={`fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-6 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'add' ? 'Add New User' : 'Edit User'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'add'
                ? 'Create a new user account with specified role and permissions'
                : `Editing ${user?.name || 'user'}`
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="font-semibold text-lg mb-4">
                {mode === 'add' ? 'Password *' : 'Password (leave empty to keep current)'}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">
                    {mode === 'add' ? 'Password' : 'New Password'}
                  </Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder={mode === 'add' ? "Min. 8 characters" : "Leave empty to keep current"}
                        required={mode === 'add'}
                        disabled={loading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
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
                        onClick={() => generatePassword('secure')}
                        disabled={isGenerating || loading}
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
                        onClick={() => generatePassword('memorable')}
                        disabled={isGenerating || loading}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Memorable
                      </Button>
                      {formData.password && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyPasswordToClipboard(formData.password)}
                          disabled={loading}
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
                          className="h-2 bg-gray-200"
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
            </div>

            {/* Role Selection */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Role & Permissions</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  {loadingRoles ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Loading roles...</span>
                    </div>
                  ) : (
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={loading}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!loadingRoles && roles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {roles.find(r => r.id === formData.role)?.description || ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Account Status</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={loading}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active Account
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.isActive
                  ? 'User can login and access the system'
                  : 'User cannot login (account is disabled)'
                }
              </p>
            </div>
          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="border-t p-6 bg-white sticky bottom-0">
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
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading || (mode === 'add' && !formData.password)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'add' ? 'Create User' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
