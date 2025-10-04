'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, Building, User, Mail, Phone, HelpCircle } from 'lucide-react'
import { 
  detectTenantFromRequest, 
  getTenantBySubdomain, 
  getTenantByDomain,
  getAllTenants,
  parsePrefixedUsername,
  createPrefixedUsername,
  isValidTenantPrefix
} from '@/lib/tenant-auth'

interface Tenant {
  id: string
  name: string
  slug: string
  prefix: string
  domain?: string
  subdomain?: string
}

interface TenantLoginFormProps {
  redirectTo?: string
  className?: string
}

export default function TenantLoginForm({ redirectTo, className }: TenantLoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'username' | 'email' | 'phone'>('username')
  
  // Form state
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    phone: '',
    password: ''
  })
  
  // Tenant state
  const [detectedTenant, setDetectedTenant] = useState<Tenant | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [showTenantSelection, setShowTenantSelection] = useState(false)
  const [showPrefixHint, setShowPrefixHint] = useState(true)
  
  // Username parsing state
  const [parsedUsername, setParsedUsername] = useState<{
    tenantPrefix: string | null
    originalUsername: string
    isPrefixed: boolean
  } | null>(null)

  // Detect tenant on component mount
  useEffect(() => {
    const detectCurrentTenant = async () => {
      try {
        // Get current host information
        const host = window.location.host
        const { subdomain, domain } = detectTenantFromRequest({
          headers: { host }
        })

        let tenant = null
        
        if (subdomain) {
          tenant = await getTenantBySubdomain(subdomain)
        } else if (domain) {
          tenant = await getTenantByDomain(domain)
        }

        if (tenant) {
          setDetectedTenant(tenant)
          setSelectedTenant(tenant)
          console.log('Detected tenant:', tenant.name)
        } else {
          // No tenant detected, load all available tenants for selection
          const tenants = await getAllTenants()
          setAvailableTenants(tenants)
          if (tenants.length > 0) {
            setShowTenantSelection(true)
          }
        }
      } catch (error) {
        console.error('Error detecting tenant:', error)
        // Fallback to tenant selection
        try {
          const tenants = await getAllTenants()
          setAvailableTenants(tenants)
          setShowTenantSelection(true)
        } catch (fallbackError) {
          console.error('Error loading tenants:', fallbackError)
        }
      }
    }

    detectCurrentTenant()
  }, [])

  // Parse username when it changes
  useEffect(() => {
    if (credentials.username && loginMethod === 'username') {
      const parsed = parsePrefixedUsername(credentials.username)
      setParsedUsername(parsed)
      
      // If username is prefixed, try to find matching tenant
      if (parsed.isPrefixed && parsed.tenantPrefix && !selectedTenant) {
        const matchingTenant = availableTenants.find(t => t.prefix === parsed.tenantPrefix)
        if (matchingTenant) {
          setSelectedTenant(matchingTenant)
          setShowPrefixHint(false)
        }
      }
    } else {
      setParsedUsername(null)
    }
  }, [credentials.username, loginMethod, availableTenants, selectedTenant])

  const handleInputChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleTenantSelect = (tenantId: string) => {
    const tenant = availableTenants.find(t => t.id === tenantId)
    setSelectedTenant(tenant || null)
    if (tenant) {
      setShowTenantSelection(false)
    }
  }

  const getLoginValue = () => {
    switch (loginMethod) {
      case 'email':
        return credentials.email
      case 'phone':
        return credentials.phone
      case 'username':
      default:
        return credentials.username
    }
  }

  const validateForm = () => {
    const loginValue = getLoginValue()
    
    if (!loginValue.trim()) {
      setError(`Please enter your ${loginMethod}`)
      return false
    }
    
    if (!credentials.password.trim()) {
      setError('Please enter your password')
      return false
    }

    // For username login, validate prefix if tenant is selected
    if (loginMethod === 'username' && selectedTenant && !parsedUsername?.isPrefixed) {
      // Auto-add prefix if user forgot it
      const prefixedUsername = createPrefixedUsername(selectedTenant.prefix, credentials.username)
      setCredentials(prev => ({ ...prev, username: prefixedUsername }))
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const loginValue = getLoginValue()
      
      const result = await signIn('credentials', {
        username: loginValue,
        password: credentials.password,
        tenantId: selectedTenant?.id,
        host: window.location.host,
        redirect: false
      })

      if (result?.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Invalid credentials. Please check your username/email and password.')
            break
          default:
            setError('Login failed. Please try again.')
        }
      } else if (result?.ok) {
        // Check if user requires 2FA
        const session = await getSession()
        
        if (session?.user?.requires2FA) {
          router.push('/auth/2fa-verify')
        } else {
          const redirectUrl = redirectTo || searchParams?.get('callbackUrl') || '/dashboard'
          router.push(redirectUrl)
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentPlaceholder = () => {
    switch (loginMethod) {
      case 'email':
        return 'Enter your email address'
      case 'phone':
        return 'Enter your phone number'
      case 'username':
        if (selectedTenant && showPrefixHint) {
          return `Enter username (e.g., ${selectedTenant.prefix}_john)`
        }
        return 'Enter your username'
      default:
        return 'Enter your credentials'
    }
  }

  const renderTenantInfo = () => {
    if (!selectedTenant && !detectedTenant) return null

    const tenant = selectedTenant || detectedTenant
    if (!tenant) return null

    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {tenant.name}
              </span>
              <Badge variant="secondary" className="ml-2">
                {tenant.prefix}
              </Badge>
            </div>
          </div>
          {!detectedTenant && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTenant(null)
                setShowTenantSelection(true)
              }}
            >
              Change
            </Button>
          )}
        </div>
        
        {loginMethod === 'username' && showPrefixHint && (
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            Your username format: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
              {tenant.prefix}_your_username
            </code>
          </div>
        )}
      </div>
    )
  }

  const renderUsernameParsingInfo = () => {
    if (!parsedUsername || loginMethod !== 'username') return null

    return (
      <div className="mt-2 text-sm">
        {parsedUsername.isPrefixed ? (
          <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Tenant: <Badge variant="outline">{parsedUsername.tenantPrefix}</Badge>
            Username: <code>{parsedUsername.originalUsername}</code>
          </div>
        ) : (
          <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {selectedTenant ? (
              <span>Missing prefix. Will auto-add: <code>{selectedTenant.prefix}_</code></span>
            ) : (
              <span>No tenant prefix detected</span>
            )}
          </div>
        )}
      </div>
    )
  }

  if (showTenantSelection && availableTenants.length > 0) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Building className="w-5 h-5" />
            Select Your Organization
          </CardTitle>
          <CardDescription>
            Choose your organization to continue with login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              {availableTenants.map((tenant) => (
                <Button
                  key={tenant.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleTenantSelect(tenant.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Prefix: <Badge variant="secondary">{tenant.prefix}</Badge>
                      {tenant.domain && <span className="ml-2">({tenant.domain})</span>}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTenantSelection(false)
                  setSelectedTenant(null)
                }}
              >
                I don't see my organization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          {selectedTenant || detectedTenant 
            ? `Sign in to ${(selectedTenant || detectedTenant)?.name}`
            : 'Enter your credentials to access your account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderTenantInfo()}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="username" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                Username
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="text-xs">
                <Phone className="w-3 h-3 mr-1" />
                Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder={getCurrentPlaceholder()}
                value={credentials.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                required
              />
              {renderUsernameParsingInfo()}
            </TabsContent>

            <TabsContent value="email" className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder={getCurrentPlaceholder()}
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </TabsContent>

            <TabsContent value="phone" className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={getCurrentPlaceholder()}
                value={credentials.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isLoading}
                autoComplete="tel"
                required
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {availableTenants.length > 0 && !showTenantSelection && !detectedTenant && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTenantSelection(true)}
              >
                Choose different organization
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}