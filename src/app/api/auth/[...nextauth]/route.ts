import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth'

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
 * Note: Dynamic scope selection based on cookies is not fully supported
 * in NextAuth v4 with App Router. The role selection will be enforced
 * at the application layer via JWT token roleSelection field.
 */

const handler = NextAuth(authConfig)

export { handler as GET, handler as POST }
