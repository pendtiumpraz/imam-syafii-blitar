'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StaffForm } from '@/components/staff/staff-form'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, UserCheck, UserX, Mail, Phone, Calendar, MapPin, BookOpen, Shield, Crown, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'TEACHER' | 'STAFF' | 'FINANCE' | 'ACADEMIC'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  avatar?: string
  employeeId: string
  joinDate: Date
  position: string
  department: string
  address: string
  dateOfBirth: Date
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  lastLoginAt?: Date
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
}

const permissions: Permission[] = [
  // Student Management
  { id: 'student.create', name: 'Create Student', description: 'Create new student records', category: 'Student Management' },
  { id: 'student.read', name: 'View Students', description: 'View student information', category: 'Student Management' },
  { id: 'student.update', name: 'Update Student', description: 'Edit student information', category: 'Student Management' },
  { id: 'student.delete', name: 'Delete Student', description: 'Delete student records', category: 'Student Management' },
  
  // Payment Management
  { id: 'payment.create', name: 'Create Payment', description: 'Create payment records', category: 'Payment Management' },
  { id: 'payment.read', name: 'View Payments', description: 'View payment information', category: 'Payment Management' },
  { id: 'payment.update', name: 'Update Payment', description: 'Edit payment records', category: 'Payment Management' },
  { id: 'payment.delete', name: 'Delete Payment', description: 'Delete payment records', category: 'Payment Management' },
  { id: 'payment.process', name: 'Process Payment', description: 'Process and confirm payments', category: 'Payment Management' },
  
  // Staff Management
  { id: 'staff.create', name: 'Create Staff', description: 'Create new staff accounts', category: 'Staff Management' },
  { id: 'staff.read', name: 'View Staff', description: 'View staff information', category: 'Staff Management' },
  { id: 'staff.update', name: 'Update Staff', description: 'Edit staff information', category: 'Staff Management' },
  { id: 'staff.delete', name: 'Delete Staff', description: 'Delete staff accounts', category: 'Staff Management' },
  
  // System Settings
  { id: 'settings.general', name: 'General Settings', description: 'Manage general system settings', category: 'System Settings' },
  { id: 'settings.payment', name: 'Payment Settings', description: 'Configure payment gateways', category: 'System Settings' },
  { id: 'settings.whatsapp', name: 'WhatsApp Settings', description: 'Configure WhatsApp integration', category: 'System Settings' },
  { id: 'settings.backup', name: 'Backup Settings', description: 'Manage system backups', category: 'System Settings' },
  
  // Reports
  { id: 'reports.financial', name: 'Financial Reports', description: 'Access financial reports', category: 'Reports' },
  { id: 'reports.academic', name: 'Academic Reports', description: 'Access academic reports', category: 'Reports' },
  { id: 'reports.student', name: 'Student Reports', description: 'Access student reports', category: 'Reports' },
  
  // System Admin
  { id: 'system.logs', name: 'System Logs', description: 'View system logs', category: 'System Administration' },
  { id: 'system.maintenance', name: 'System Maintenance', description: 'Perform system maintenance', category: 'System Administration' },
  { id: 'system.backup', name: 'System Backup', description: 'Create and restore backups', category: 'System Administration' }
]

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: permissions.map(p => p.id),
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  {
    id: 'finance',
    name: 'Finance Manager',
    description: 'Manage payments and financial operations',
    permissions: [
      'student.read', 'payment.create', 'payment.read', 'payment.update', 'payment.delete', 'payment.process',
      'reports.financial', 'settings.payment'
    ],
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    id: 'academic',
    name: 'Academic Staff',
    description: 'Manage academic operations and student records',
    permissions: [
      'student.create', 'student.read', 'student.update', 'reports.academic', 'reports.student'
    ],
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'View student information and academic reports',
    permissions: ['student.read', 'reports.student', 'reports.academic'],
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    id: 'staff',
    name: 'General Staff',
    description: 'Basic access to student information',
    permissions: ['student.read'],
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  }
]

export default function StaffManagementPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [roles, setRoles] = useState<Role[]>(defaultRoles)
  
  const [staff, setStaff] = useState<Staff[]>([
    {
      id: '1',
      name: 'Dr. Ahmad Hidayat',
      email: 'ahmad.hidayat@school.com',
      phone: '081234567890',
      role: 'ADMIN',
      status: 'ACTIVE',
      employeeId: 'STF001',
      joinDate: new Date('2020-01-15'),
      position: 'Principal',
      department: 'Administration',
      address: 'Jl. Pendidikan No. 123, Jakarta',
      dateOfBirth: new Date('1975-05-10'),
      emergencyContact: {
        name: 'Fatimah Hidayat',
        phone: '081234567891',
        relationship: 'Wife'
      },
      lastLoginAt: new Date(),
      permissions: permissions.map(p => p.id),
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Siti Nurhaliza, S.Pd',
      email: 'siti.nurhaliza@school.com',
      phone: '081234567892',
      role: 'TEACHER',
      status: 'ACTIVE',
      employeeId: 'STF002',
      joinDate: new Date('2020-08-01'),
      position: 'Arabic Teacher',
      department: 'Academic',
      address: 'Jl. Masjid No. 45, Jakarta',
      dateOfBirth: new Date('1985-03-15'),
      emergencyContact: {
        name: 'Muhammad Nurhaliza',
        phone: '081234567893',
        relationship: 'Husband'
      },
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      permissions: ['student.read', 'reports.student', 'reports.academic'],
      createdAt: new Date('2020-08-01'),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Muhammad Yusuf, S.E',
      email: 'muhammad.yusuf@school.com',
      phone: '081234567894',
      role: 'FINANCE',
      status: 'ACTIVE',
      employeeId: 'STF003',
      joinDate: new Date('2021-03-10'),
      position: 'Finance Manager',
      department: 'Finance',
      address: 'Jl. Bank No. 78, Jakarta',
      dateOfBirth: new Date('1980-11-22'),
      emergencyContact: {
        name: 'Khadijah Yusuf',
        phone: '081234567895',
        relationship: 'Wife'
      },
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      permissions: [
        'student.read', 'payment.create', 'payment.read', 'payment.update', 'payment.delete', 'payment.process',
        'reports.financial', 'settings.payment'
      ],
      createdAt: new Date('2021-03-10'),
      updatedAt: new Date()
    }
  ])

  const [formData, setFormData] = useState<Partial<Staff>>({
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
  })

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || s.role === filterRole
    const matchesStatus = !filterStatus || s.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleInfo = (roleId: string) => {
    return roles.find(r => r.id.toLowerCase() === roleId.toLowerCase()) || roles[0]
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'TEACHER':
        return <Badge className="bg-purple-100 text-purple-800"><BookOpen className="w-3 h-3 mr-1" />Teacher</Badge>
      case 'FINANCE':
        return <Badge className="bg-green-100 text-green-800"><Shield className="w-3 h-3 mr-1" />Finance</Badge>
      case 'ACADEMIC':
        return <Badge className="bg-blue-100 text-blue-800"><User className="w-3 h-3 mr-1" />Academic</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><User className="w-3 h-3 mr-1" />Staff</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Active</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800"><UserX className="w-3 h-3 mr-1" />Inactive</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800"><UserX className="w-3 h-3 mr-1" />Suspended</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleCreate = async (data: any) => {
    const newStaff: Staff = {
      ...data as Staff,
      id: Math.random().toString(36).substr(2, 9),
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: getRoleInfo(data.role!.toLowerCase()).permissions
    }

    setStaff(prev => [...prev, newStaff])
    setIsAddDialogOpen(false)
    resetForm()

    toast({
      title: 'Staff Created',
      description: `${newStaff.name} has been added successfully.`
    })
  }

  const handleUpdate = async (data: any) => {
    if (!selectedStaff) {
      return
    }

    setStaff(prev => prev.map(s =>
      s.id === selectedStaff.id
        ? {
            ...s,
            ...data,
            updatedAt: new Date(),
            permissions: getRoleInfo(data.role!.toLowerCase()).permissions
          } as Staff
        : s
    ))

    setIsEditDialogOpen(false)
    setSelectedStaff(null)
    resetForm()

    toast({
      title: 'Staff Updated',
      description: 'Staff information has been updated successfully.'
    })
  }

  const handleDelete = async (staffId: string) => {
    setLoading(true)
    try {
      setStaff(prev => prev.filter(s => s.id !== staffId))
      
      toast({
        title: 'Staff Deleted',
        description: 'Staff member has been removed successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete staff member.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
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
    })
  }

  const openEditDialog = (staff: Staff) => {
    setSelectedStaff(staff)
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      status: staff.status,
      employeeId: staff.employeeId,
      position: staff.position,
      department: staff.department,
      address: staff.address,
      dateOfBirth: staff.dateOfBirth,
      emergencyContact: staff.emergencyContact,
      permissions: staff.permissions
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff accounts, roles, and permissions
          </p>
        </div>
        
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="FINANCE">Finance Manager</SelectItem>
                <SelectItem value="ACADEMIC">Academic Staff</SelectItem>
                <SelectItem value="STAFF">General Staff</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Members ({filteredStaff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Employee ID: {member.employeeId}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {member.position} • {member.department} • Joined {member.joinDate.toLocaleDateString()}
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
                    <DropdownMenuItem onClick={() => openViewDialog(member)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(member)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onClick={(e?: React.MouseEvent) => e?.preventDefault()}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {member.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(member.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No staff members found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterRole || filterStatus
                    ? 'Try adjusting your search filters'
                    : 'Get started by adding your first staff member'
                  }
                </p>
                {!searchTerm && !filterRole && !filterStatus && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff Member
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Form */}
      <StaffForm
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreate}
        mode="add"
        initialData={{
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
        }}
        title="Add New Staff Member"
        description="Create a new staff account with appropriate role and permissions"
        roles={roles}
      />

      {/* Edit Staff Form */}
      <StaffForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdate}
        mode="edit"
        initialData={formData}
        title="Edit Staff Member"
        description="Update staff information and permissions"
        roles={roles}
      />

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStaff && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedStaff.avatar} />
                    <AvatarFallback className="text-lg">
                      {selectedStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStaff.name}</h2>
                    <p className="text-muted-foreground">{selectedStaff.position}</p>
                    <div className="flex gap-2 mt-2">
                      {getRoleBadge(selectedStaff.role)}
                      {getStatusBadge(selectedStaff.status)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedStaff.email}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedStaff.phone}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedStaff.dateOfBirth.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedStaff.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <div className="p-3 border rounded-lg">
                    <p><strong>Name:</strong> {selectedStaff.emergencyContact.name}</p>
                    <p><strong>Phone:</strong> {selectedStaff.emergencyContact.phone}</p>
                    <p><strong>Relationship:</strong> {selectedStaff.emergencyContact.relationship}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="employment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <p className="font-mono">{selectedStaff.employeeId}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <p>{selectedStaff.department}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <p>{selectedStaff.joinDate.toLocaleDateString()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <p>{selectedStaff.lastLoginAt?.toLocaleString() || 'Never'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Role: {getRoleInfo(selectedStaff.role.toLowerCase()).name}</Label>
                    <p className="text-sm text-muted-foreground">
                      {getRoleInfo(selectedStaff.role.toLowerCase()).description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(
                      selectedStaff.permissions.reduce((acc, permissionId) => {
                        const permission = permissions.find(p => p.id === permissionId)
                        if (permission) {
                          if (!acc[permission.category]) {
                            acc[permission.category] = []
                          }
                          acc[permission.category].push(permission)
                        }
                        return acc
                      }, {} as Record<string, Permission[]>)
                    ).map(([category, perms]) => (
                      <div key={category}>
                        <Label className="font-medium">{category}</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {perms.map(perm => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedStaff && (
              <Button onClick={() => {
                setIsViewDialogOpen(false)
                openEditDialog(selectedStaff)
              }}>
                Edit Staff
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}