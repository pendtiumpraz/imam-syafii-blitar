import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    email: string
    name: string
    role: string
  }

  interface Session {
    user: {
      id: string
      username?: string
      role?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    username?: string
  }
}