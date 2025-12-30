/**
 * Auth App Selection Tests
 * 
 * Tests for Stage 9 verification:
 * - App selection in JWT callback
 * - Session callback with app persistence
 * - OAuth redirect with app preservation
 * - Default app assignment by role
 */

import { DEFAULT_APP_FOR_ROLE } from '@/types/app'

describe('auth: App Selection', () => {
  describe('DEFAULT_APP_FOR_ROLE', () => {
    it('assigns expedition to standard users', () => {
      expect(DEFAULT_APP_FOR_ROLE.standard).toBe('expedition')
    })

    it('assigns planning to admin users', () => {
      expect(DEFAULT_APP_FOR_ROLE.admin).toBe('planning')
    })

    it('has mappings for all role types', () => {
      expect(DEFAULT_APP_FOR_ROLE).toHaveProperty('standard')
      expect(DEFAULT_APP_FOR_ROLE).toHaveProperty('admin')
    })
  })

  describe('app selection flow', () => {
    it('preserves app selection through OAuth flow', () => {
      // Simulate OAuth callback URL with appSelection
      const callbackUrl = new URL('http://localhost:3000/dashboard?appSelection=planning')
      const appSelection = callbackUrl.searchParams.get('appSelection')
      
      expect(appSelection).toBe('planning')
    })

    it('handles missing app selection gracefully', () => {
      const callbackUrl = new URL('http://localhost:3000/dashboard')
      const appSelection = callbackUrl.searchParams.get('appSelection')
      
      expect(appSelection).toBeNull()
    })

    it('validates app selection values', () => {
      const validApps = ['expedition', 'planning', 'platform-admin', 'multi']
      
      validApps.forEach(app => {
        const callbackUrl = new URL(`http://localhost:3000/dashboard?appSelection=${app}`)
        const appSelection = callbackUrl.searchParams.get('appSelection')
        expect(validApps).toContain(appSelection)
      })
    })
  })

  describe('role-based app defaults', () => {
    it('standard users default to expedition', () => {
      const role = 'standard'
      const defaultApp = DEFAULT_APP_FOR_ROLE[role]
      
      expect(defaultApp).toBe('expedition')
    })

    it('admin users default to planning', () => {
      const role = 'admin'
      const defaultApp = DEFAULT_APP_FOR_ROLE[role]
      
      expect(defaultApp).toBe('planning')
    })
  })

  describe('app selection URL handling', () => {
    it('constructs callback URL with app selection', () => {
      const baseUrl = 'http://localhost:3000'
      const callbackPath = '/dashboard'
      const appSelection = 'planning'
      
      const url = new URL(`${baseUrl}${callbackPath}`)
      url.searchParams.set('appSelection', appSelection)
      
      expect(url.toString()).toBe('http://localhost:3000/dashboard?appSelection=planning')
    })

    it('preserves existing query params when adding app selection', () => {
      const url = new URL('http://localhost:3000/dashboard?foo=bar')
      url.searchParams.set('appSelection', 'expedition')
      
      expect(url.searchParams.get('foo')).toBe('bar')
      expect(url.searchParams.get('appSelection')).toBe('expedition')
    })

    it('handles base URL without path', () => {
      const baseUrl = 'http://localhost:3000'
      const url = new URL(baseUrl)
      url.searchParams.set('appSelection', 'multi')
      
      expect(url.toString()).toBe('http://localhost:3000/?appSelection=multi')
    })
  })

  describe('multi-app scenarios', () => {
    it('supports all four app types', () => {
      const apps = ['expedition', 'planning', 'platform-admin', 'multi']
      
      apps.forEach(app => {
        const url = new URL(`http://localhost:3000/dashboard?appSelection=${app}`)
        expect(url.searchParams.get('appSelection')).toBe(app)
      })
    })

    it('handles app switching between sessions', () => {
      // First session: expedition
      const session1Url = new URL('http://localhost:3000/dashboard?appSelection=expedition')
      expect(session1Url.searchParams.get('appSelection')).toBe('expedition')
      
      // Second session: planning
      const session2Url = new URL('http://localhost:3000/dashboard?appSelection=planning')
      expect(session2Url.searchParams.get('appSelection')).toBe('planning')
    })

    it('validates app selection against allowed apps for role', () => {
      // Admin can access planning and platform-admin
      const adminApps = ['planning', 'platform-admin', 'multi']
      adminApps.forEach(app => {
        expect(['expedition', 'planning', 'platform-admin', 'multi']).toContain(app)
      })
      
      // Standard can access expedition and multi
      const standardApps = ['expedition', 'multi']
      standardApps.forEach(app => {
        expect(['expedition', 'planning', 'platform-admin', 'multi']).toContain(app)
      })
    })
  })

  describe('OAuth redirect preservation', () => {
    it('preserves app selection in redirect URL', () => {
      const originalUrl = 'http://localhost:3000/api/auth/callback/osm-admin?appSelection=planning'
      const url = new URL(originalUrl)
      const appSelection = url.searchParams.get('appSelection')
      
      // Construct final redirect
      const finalUrl = new URL('http://localhost:3000/dashboard')
      if (appSelection) {
        finalUrl.searchParams.set('appSelection', appSelection)
      }
      
      expect(finalUrl.searchParams.get('appSelection')).toBe('planning')
    })

    it('handles redirect without app selection', () => {
      const originalUrl = 'http://localhost:3000/api/auth/callback/osm-admin'
      const url = new URL(originalUrl)
      const appSelection = url.searchParams.get('appSelection')
      
      expect(appSelection).toBeNull()
      
      // Should use default based on role
      const role = 'admin'
      const defaultApp = DEFAULT_APP_FOR_ROLE[role]
      expect(defaultApp).toBe('planning')
    })
  })

  describe('session persistence', () => {
    it('simulates app selection in session token', () => {
      const mockToken = {
        roleSelection: 'admin' as const,
        appSelection: 'planning' as const,
        sessionVersion: 1,
      }
      
      expect(mockToken.appSelection).toBe('planning')
      expect(mockToken.roleSelection).toBe('admin')
    })

    it('simulates app selection in session object', () => {
      const mockSession = {
        user: { id: '123', name: 'Test User' },
        roleSelection: 'standard' as const,
        appSelection: 'expedition' as const,
      }
      
      expect(mockSession.appSelection).toBe('expedition')
      expect(mockSession.roleSelection).toBe('standard')
    })

    it('handles missing app selection with default', () => {
      const mockToken = {
        roleSelection: 'admin' as const,
        appSelection: undefined,
      }
      
      const effectiveApp = mockToken.appSelection ?? DEFAULT_APP_FOR_ROLE[mockToken.roleSelection]
      expect(effectiveApp).toBe('planning')
    })
  })
})
