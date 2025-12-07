import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getMockUser } from '@/mocks/mockSession'
import { setOAuthData } from './redis'

/**
 * Role-based scope calculator
 * Determines OAuth scopes based on selected user role
 */
function getScopesForRole(role: 'admin' | 'standard'): string[] {
  if (role === 'admin') {
    return [
      'section:event:read',
      'section:member:read',
      'section:programme:read',
      'section:flexirecord:read',
    ]
  }
  // Standard viewer - minimal scope
  return ['section:event:read']
}

/**
 * NextAuth Configuration for SEEE Expedition Dashboard
 * 
 * Authentication Strategy:
 * - OAuth 2.0 with Online Scout Manager (OSM) as provider
 * - Token rotation to handle 1-hour access token expiry
 * - Refresh tokens are used to obtain new access tokens automatically
 * 
 * Security Notes:
 * - All tokens are stored in encrypted JWT session cookies
 * - Refresh token rotation prevents token replay attacks
 * - Session max age is set to match refresh token lifetime
 */

const OSM_OAUTH_URL = process.env.OSM_OAUTH_URL || 'https://www.onlinescoutmanager.co.uk/oauth'
const OSM_API_URL = process.env.OSM_API_URL || 'https://www.onlinescoutmanager.co.uk'
const MOCK_AUTH_ENABLED = process.env.MOCK_AUTH_ENABLED === 'true'

/**
 * Read and validate the role selection from cookie
 * Used during OAuth callback to determine which scopes were requested
 */
function getRoleFromCookie(req: any): 'admin' | 'standard' {
  try {
    if (!req || !req.cookies) return 'standard'
    const cookieValue = req.cookies['oauth-role-selection']
    if (cookieValue === 'admin' || cookieValue === 'standard') {
      return cookieValue
    }
  } catch (error) {
    console.error('[Auth] Error reading role cookie:', error)
  }
  return 'standard'
}

/**
 * Refresh the access token using the refresh token
 * Called automatically when access token expires
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${OSM_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
        client_id: process.env.OSM_CLIENT_ID!,
        client_secret: process.env.OSM_CLIENT_SECRET!,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token if new one not provided
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

/**
 * Build the providers array based on environment configuration
 * - If MOCK_AUTH_ENABLED=true: Use credentials provider with mock data
 * - Otherwise: Use OSM OAuth provider with dynamic scope selection
 */
function getProviders(req?: any): AuthOptions['providers'] {
  if (MOCK_AUTH_ENABLED) {
    return [
      CredentialsProvider({
        id: 'credentials',
        name: 'Mock Login',
        credentials: {
          username: { label: 'Username', type: 'text', placeholder: 'admin, standard, readonly, or multiSection' },
          password: { label: 'Password', type: 'password' },
          roleSelection: { label: 'Role Selection', type: 'text', placeholder: 'admin or standard' },
        },
        async authorize(credentials) {
          const username = credentials?.username as string
          const roleSelection = (credentials?.roleSelection || 'standard') as 'admin' | 'standard'
          const mockUser = getMockUser(username)
          
          return {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            image: mockUser.image,
            sections: mockUser.sections,
            scopes: getScopesForRole(roleSelection),
            roleSelection,
          }
        },
      }),
    ]
  }

  // Production: OSM OAuth providers - separate provider per role
  // This allows different OAuth scopes to be requested based on user's role selection
  
  const createOAuthProvider = (role: 'admin' | 'standard') => ({
    id: role === 'admin' ? 'osm-admin' : 'osm-standard',
    name: `Online Scout Manager (${role === 'admin' ? 'Administrator' : 'Standard Viewer'})`,
    type: 'oauth' as const,
    version: '2.0',
    authorization: {
      url: `${OSM_OAUTH_URL}/oauth/authorize`,
      params: {
        scope: getScopesForRole(role).join(' '),
      },
    },
    token: {
      url: `${OSM_OAUTH_URL}/oauth/token`,
    },
    userinfo: {
      url: `${OSM_OAUTH_URL}/oauth/resource`,
    },
    clientId: process.env.OSM_CLIENT_ID,
    clientSecret: process.env.OSM_CLIENT_SECRET,
    async profile(profile: any) {
      // OSM returns { status, error, data: { user_id, full_name, email, sections, ... }, meta }
      const data = profile.data || {}
      const userId = String(data.user_id || 'unknown')
      
      // Store full OAuth data in Redis (avoids JWT size limits)
      if (userId !== 'unknown') {
        try {
          await setOAuthData(userId, {
            sections: data.sections || [],
            scopes: data.scopes || [],
            has_parent_access: data.has_parent_access,
            has_section_access: data.has_section_access,
          }, 86400) // 24 hours
        } catch (error) {
          console.error('[OAuth] Failed to store OAuth data in Redis:', error)
        }
      }
      
      return {
        id: userId,
        name: data.full_name || 'OSM User',
        email: data.email || null,
        image: data.profile_picture_url || null,
        // Store section IDs and role in user object
        sectionIds: (data.sections || []).map((s: any) => s.section_id),
        scopes: data.scopes || [],
        roleSelection: role, // Embed role in user profile
      }
    },
  })

  return [
    createOAuthProvider('admin') as any,
    createOAuthProvider('standard') as any,
  ]
}

export function getAuthConfig(req?: any): AuthOptions {
  return {
    providers: getProviders(req),
    callbacks: {
    /**
     * Redirect callback: Intercept the post-OAuth redirect to preserve role selection
     * The role cookie is available here and will persist to the next request
     */
    async redirect({ url, baseUrl }) {
      // Role selection cookie persists automatically via browser
      // The next request (JWT callback) will read it
      return url.startsWith(baseUrl) ? url : baseUrl
    },

    /**
     * SignIn callback: Runs during OAuth callback after user authenticates
     */
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === 'osm') {
        console.log('[SignIn] OSM authentication successful')
      }
      return true
    },

    async jwt({ token, account, user, trigger }) {
      // During OAuth initial sign-in, read role from user profile
      if (account && user && !token.roleSelection) {
        // Role is embedded in user profile by the OAuth provider
        const roleSelection = (user as any).roleSelection || 'standard'
        const scopes = getScopesForRole(roleSelection)
        
        token.roleSelection = roleSelection
        token.scopes = scopes
        
        console.log(`[JWT] Provider: ${account.provider}, Role: "${roleSelection}", Scopes: ${scopes.join(', ')}`)
      }
      // Mock authentication: skip token rotation
      if (MOCK_AUTH_ENABLED) {
        if (account && user) {
          // For mock mode, store full sections in Redis too
          const userId = (user as any).id
          try {
            await setOAuthData(userId, {
              sections: (user as any).sections || [],
              scopes: (user as any).scopes || [],
            }, 86400)
          } catch (error) {
            console.error('[Mock Auth] Failed to store OAuth data in Redis:', error)
          }
          
          // Initial sign-in: set mock tokens
          return {
            ...token,
            accessToken: 'mock-access-token',
            accessTokenExpires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
            refreshToken: 'mock-refresh-token',
            user,
            sectionIds: ((user as any).sections || []).map((s: any) => s.section_id),
            scopes: (user as any).scopes || [],
            roleSelection: (user as any).roleSelection || 'standard',
          }
        }
        // Subsequent requests: ensure accessToken is always present
        if (!token.accessToken) {
          token.accessToken = 'mock-access-token'
          token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000
          token.refreshToken = 'mock-refresh-token'
        }
        return token
      }

      // Real OAuth: Initial sign in
      if (account && user) {
        const roleSelection = (user as any).roleSelection || 'standard'
        const scopes = getScopesForRole(roleSelection)
        
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
          user,
          // Store only section IDs in JWT (full data is in Redis)
          sectionIds: (user as any).sectionIds || [],
          scopes,
          roleSelection,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token.user && typeof token.user === 'object' && 'id' in token.user) {
        const user = token.user as { id: string; name?: string | null; email?: string | null; image?: string | null }
        session.user = {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          // AdapterUser requires emailVerified; OSM profile doesn't include it
          // Use null to indicate unknown verification status
          emailVerified: null as unknown as Date | null,
        } as unknown as typeof session.user
      }
      session.accessToken = token.accessToken as string
      session.error = token.error as string | undefined
      // Store only section IDs in session (full data fetched from Redis when needed)
      session.sectionIds = token.sectionIds as number[] | undefined
      session.scopes = token.scopes as string[] | undefined
      session.roleSelection = token.roleSelection as 'admin' | 'standard' | undefined

      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days (matches typical refresh token lifetime)
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
}

export const authConfig = getAuthConfig()
