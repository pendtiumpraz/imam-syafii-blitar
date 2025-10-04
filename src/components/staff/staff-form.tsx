'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Save, Loader2 } from 'lucide-react'

interface Staff {
  id?: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'TEACHER' | 'STAFF' | 'FINANCE' | 'ACADEMIC'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  employeeId: string
  position: string
  department: string
  address: string
  dateOfBirth: Date
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  permissions?: string[]
}

interface StaffFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  mode: 'add' | 'edit'
  initialData?: Partial<Staff>
  title: string
  description: string
  roles: any[]
}

export function StaffForm({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  title,
  description,
  roles
}: StaffFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Staff>>(
    initialData || {
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      status: 'ACTIVE',
      employeeId: '',
      position: '',
      department: '',
      address: '',
      dateOfBirth: new Date(),
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      permissions: []
    }
  )

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const getRoleInfo = (roleId: string) => {
    return roles.find(r => r.id.toLowerCase() === roleId.toLowerCase()) || roles[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff member')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Fixed Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-4xl bg-white shadow-xl z-50 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} id="staff-form" className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Enter employee ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as Staff['role'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="FINANCE">Finance Manager</SelectItem>
                      <SelectItem value="ACADEMIC">Academic Staff</SelectItem>
                      <SelectItem value="STAFF">General Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Staff['status'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Enter job position"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="IT">IT Support</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                />
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth?.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: new Date(e.target.value) }))}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact?.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact!, name: e.target.value }
                    }))}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyContact?.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact!, phone: e.target.value }
                    }))}
                    placeholder="Emergency contact phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyContact?.relationship}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact!, relationship: e.target.value }
                    }))}
                    placeholder="Relationship"
                  />
                </div>
              </div>
            </div>

            {/* Role Permissions */}
            {formData.role && roles.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Role Permissions</h3>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm text-muted-foreground mb-2">
                    This role will have the following permissions:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getRoleInfo(formData.role.toLowerCase()).permissions.map((permissionId: string) => (
                      <Badge key={permissionId} variant="outline" className="text-xs">
                        {permissionId.split('.').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4">
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
              form="staff-form"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'add' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'add' ? 'Create Staff' : 'Update Staff'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
