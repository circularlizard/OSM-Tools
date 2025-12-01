import type { NextAuthConfig } from 'next-auth'
import { JWT } from 'next-auth/jwt'

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

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: 'osm',
      name: 'Online Scout Manager',
      type: 'oauth',
      authorization: {
        url: `${OSM_OAUTH_URL}/authorize`,
        params: {
          scope: 'section:member:read section:events:read',
        },
      },
      token: `${OSM_OAUTH_URL}/token`,
      userinfo: `${OSM_API_URL}/api/user/info`,
      clientId: process.env.OSM_CLIENT_ID,
      clientSecret: process.env.OSM_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.user_id || profile.id,
          name: profile.name || profile.firstname + ' ' + profile.lastname,
          email: profile.email,
          image: profile.photo_guid ? `${OSM_API_URL}/api/member/photo/${profile.photo_guid}` : null,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
          user,
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
      if (token.user) {
        session.user = {
          id: (token.user as any).id,
          name: (token.user as any).name,
          email: (token.user as any).email,
          image: (token.user as any).image,
          // AdapterUser requires emailVerified; OSM profile doesn't include it
          // Use null to indicate unknown verification status
          emailVerified: null as unknown as Date | null,
        } as unknown as typeof session.user
      }
      session.accessToken = token.accessToken as string
      session.error = token.error as string | undefined

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
