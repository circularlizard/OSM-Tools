import NextAuth from 'next-auth'
import { getAuthConfig } from '@/lib/auth'

/**
 * NextAuth.js Route Handler
 * 
 * This handles all authentication routes:
 * - GET/POST /api/auth/signin - Sign in page and submission
 * - GET/POST /api/auth/signout - Sign out
 * - GET/POST /api/auth/callback/:provider - OAuth callbacks
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/providers - Get available providers
 * - GET /api/auth/csrf - Get CSRF token
 * 
 * The configuration is imported from src/lib/auth.ts
 */

const handler = NextAuth(getAuthConfig())

export { handler as GET, handler as POST }
