import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize called with:', { 
          username: credentials?.username,
          hasPassword: !!credentials?.password 
        })

        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          console.log('🔍 Looking for user:', credentials.username)
          console.log('🔧 Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            ENABLE_SOFT_DELETE: process.env.ENABLE_SOFT_DELETE,
            DATABASE_URL: process.env.DATABASE_URL?.substring(0, 50) + '...'
          })

          // Use findFirst instead of findUnique to avoid middleware conflicts
          // The soft delete middleware modifies findUnique queries in a way that breaks unique constraints
          const user = await prisma.user.findFirst({
            where: {
              username: credentials.username
            }
          })

          console.log('📊 Query result:', user ? 'User found' : 'User NOT found')

          if (!user) {
            console.log('❌ User not found:', credentials.username)
            return null
          }

          if (!user.isActive) {
            console.log('❌ User not active:', credentials.username)
            return null
          }

          console.log('✅ User found:', { 
            id: user.id, 
            username: user.username, 
            isActive: user.isActive 
          })

          console.log('🔑 Comparing passwords...')
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!passwordMatch) {
            console.log('❌ Password mismatch for user:', credentials.username)
            return null
          }

          console.log('✅ Password match successful for user:', credentials.username)
          
          // Check if user has 2FA enabled
          const requires2FA = user.twoFactorEnabled
          
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            isUstadz: user.isUstadz,
            requires2FA,
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = user.role
          token.username = user.username
          token.isUstadz = user.isUstadz
          token.requires2FA = user.requires2FA
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (token && session?.user) {
          session.user.id = token.sub as string
          session.user.role = token.role as string
          session.user.username = token.username as string
          session.user.isUstadz = token.isUstadz as boolean
          session.user.requires2FA = token.requires2FA as boolean
        }
        
        // Ensure session always has a valid structure
        if (!session) {
          return {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            user: null as any
          } as any
        }
        
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        // Return a valid empty session structure
        return {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: null as any
        } as any
      }
    },
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('SignIn callback:', { user: !!user, account: !!account, profile: !!profile })
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata)
      }
    },
  },
  events: {
    async session({ session, token }) {
      // Log session events for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Session event:', { session: !!session, token: !!token })
      }
    },
  },
}