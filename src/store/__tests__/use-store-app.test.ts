/**
 * Zustand Store Tests - Multi-App State Management
 * 
 * Tests for Stage 9 verification:
 * - currentApp state management
 * - App switching and state isolation
 * - setCurrentApp action
 */

import { useStore } from '../use-store'
import type { AppKey } from '@/types/app'

describe('use-store: Multi-App State Management', () => {
  beforeEach(() => {
    // Reset store to clean state
    useStore.setState({
      currentApp: null,
      userRole: null,
      currentSection: null,
    })
  })

  describe('currentApp state', () => {
    it('initializes with null currentApp', () => {
      const { currentApp } = useStore.getState()
      expect(currentApp).toBeNull()
    })

    it('sets currentApp via setCurrentApp', () => {
      const { setCurrentApp } = useStore.getState()
      setCurrentApp('expedition')
      
      expect(useStore.getState().currentApp).toBe('expedition')
    })

    it('updates currentApp when called multiple times', () => {
      const { setCurrentApp } = useStore.getState()
      
      setCurrentApp('expedition')
      expect(useStore.getState().currentApp).toBe('expedition')
      
      setCurrentApp('planning')
      expect(useStore.getState().currentApp).toBe('planning')
    })

    it('allows setting currentApp to null', () => {
      const { setCurrentApp } = useStore.getState()
      
      setCurrentApp('expedition')
      expect(useStore.getState().currentApp).toBe('expedition')
      
      setCurrentApp(null)
      expect(useStore.getState().currentApp).toBeNull()
    })
  })

  describe('app switching', () => {
    it('switches between all app types', () => {
      const { setCurrentApp } = useStore.getState()
      const apps: AppKey[] = ['expedition', 'planning', 'platform-admin', 'multi']
      
      apps.forEach(app => {
        setCurrentApp(app)
        expect(useStore.getState().currentApp).toBe(app)
      })
    })

    it('maintains other state when switching apps', () => {
      const { setCurrentApp } = useStore.getState()
      
      // Set up some state
      useStore.setState({
        userRole: 'admin',
        currentSection: { 
          sectionId: '123', 
          termId: '456',
          sectionName: 'Test Section',
          sectionType: 'scouts',
        },
      })
      
      // Switch apps
      setCurrentApp('expedition')
      expect(useStore.getState().currentApp).toBe('expedition')
      expect(useStore.getState().userRole).toBe('admin')
      expect(useStore.getState().currentSection?.sectionId).toBe('123')
      
      setCurrentApp('planning')
      expect(useStore.getState().currentApp).toBe('planning')
      expect(useStore.getState().userRole).toBe('admin')
      expect(useStore.getState().currentSection?.sectionId).toBe('123')
    })

    it('preserves access control settings across app switches', () => {
      const { setCurrentApp } = useStore.getState()
      
      useStore.setState({
        accessControlStrategy: 'A',
        allowedPatrolIds: new Set(['patrol-1', 'patrol-2']),
        allowedEventIds: new Set(['event-1']),
      })
      
      setCurrentApp('expedition')
      expect(useStore.getState().accessControlStrategy).toBe('A')
      expect(useStore.getState().allowedPatrolIds.size).toBe(2)
      
      setCurrentApp('planning')
      expect(useStore.getState().accessControlStrategy).toBe('A')
      expect(useStore.getState().allowedPatrolIds.size).toBe(2)
    })
  })

  describe('app-specific scenarios', () => {
    it('supports expedition app', () => {
      const { setCurrentApp } = useStore.getState()
      setCurrentApp('expedition')
      
      expect(useStore.getState().currentApp).toBe('expedition')
    })

    it('supports planning app', () => {
      const { setCurrentApp } = useStore.getState()
      setCurrentApp('planning')
      
      expect(useStore.getState().currentApp).toBe('planning')
    })

    it('supports platform-admin app', () => {
      const { setCurrentApp } = useStore.getState()
      setCurrentApp('platform-admin')
      
      expect(useStore.getState().currentApp).toBe('platform-admin')
    })

    it('supports multi-section viewer app', () => {
      const { setCurrentApp } = useStore.getState()
      setCurrentApp('multi')
      
      expect(useStore.getState().currentApp).toBe('multi')
    })
  })

  describe('app state with role combinations', () => {
    it('allows admin with expedition app', () => {
      const { setCurrentApp } = useStore.getState()
      
      useStore.setState({ userRole: 'admin' })
      setCurrentApp('expedition')
      
      expect(useStore.getState().currentApp).toBe('expedition')
      expect(useStore.getState().userRole).toBe('admin')
    })

    it('allows admin with planning app', () => {
      const { setCurrentApp } = useStore.getState()
      
      useStore.setState({ userRole: 'admin' })
      setCurrentApp('planning')
      
      expect(useStore.getState().currentApp).toBe('planning')
      expect(useStore.getState().userRole).toBe('admin')
    })

    it('allows admin with platform-admin app', () => {
      const { setCurrentApp } = useStore.getState()
      
      useStore.setState({ userRole: 'admin' })
      setCurrentApp('platform-admin')
      
      expect(useStore.getState().currentApp).toBe('platform-admin')
      expect(useStore.getState().userRole).toBe('admin')
    })

    it('allows standard with expedition app', () => {
      const { setCurrentApp } = useStore.getState()
      
      useStore.setState({ userRole: 'standard' })
      setCurrentApp('expedition')
      
      expect(useStore.getState().currentApp).toBe('expedition')
      expect(useStore.getState().userRole).toBe('standard')
    })

    it('allows standard with multi app', () => {
      const { setCurrentApp } = useStore.getState()
      
      useStore.setState({ userRole: 'standard' })
      setCurrentApp('multi')
      
      expect(useStore.getState().currentApp).toBe('multi')
      expect(useStore.getState().userRole).toBe('standard')
    })
  })

  describe('state isolation', () => {
    it('does not leak state between app switches', () => {
      const { setCurrentApp } = useStore.getState()
      
      // Set up expedition state
      setCurrentApp('expedition')
      const expeditionState = useStore.getState().currentApp
      
      // Switch to planning
      setCurrentApp('planning')
      const planningState = useStore.getState().currentApp
      
      // States should be different
      expect(expeditionState).toBe('expedition')
      expect(planningState).toBe('planning')
      expect(expeditionState).not.toBe(planningState)
    })

    it('maintains independent state for each app context', () => {
      const { setCurrentApp } = useStore.getState()
      
      // Expedition context
      setCurrentApp('expedition')
      useStore.setState({ userRole: 'standard' })
      const expeditionRole = useStore.getState().userRole
      
      // Planning context (role persists as it's global)
      setCurrentApp('planning')
      const planningRole = useStore.getState().userRole
      
      // Role should persist (it's not app-specific)
      expect(expeditionRole).toBe(planningRole)
      
      // But app should be different
      expect(useStore.getState().currentApp).toBe('planning')
    })
  })

  describe('store selectors with currentApp', () => {
    it('provides currentApp in store state', () => {
      const { setCurrentApp } = useStore.getState()
      setCurrentApp('expedition')
      
      const state = useStore.getState()
      expect(state).toHaveProperty('currentApp')
      expect(state.currentApp).toBe('expedition')
    })

    it('allows subscribing to currentApp changes', () => {
      const { setCurrentApp } = useStore.getState()
      const states: (AppKey | null)[] = []
      
      const unsubscribe = useStore.subscribe(
        (state) => {
          states.push(state.currentApp)
        }
      )
      
      setCurrentApp('expedition')
      setCurrentApp('planning')
      setCurrentApp(null)
      
      unsubscribe()
      
      // First state is the initial null, then the three changes
      expect(states.length).toBeGreaterThanOrEqual(3)
      expect(states).toContain('expedition')
      expect(states).toContain('planning')
    })
  })

  describe('edge cases', () => {
    it('handles rapid app switching', () => {
      const { setCurrentApp } = useStore.getState()
      
      for (let i = 0; i < 10; i++) {
        setCurrentApp('expedition')
        setCurrentApp('planning')
      }
      
      expect(useStore.getState().currentApp).toBe('planning')
    })

    it('handles setting same app multiple times', () => {
      const { setCurrentApp } = useStore.getState()
      
      setCurrentApp('expedition')
      setCurrentApp('expedition')
      setCurrentApp('expedition')
      
      expect(useStore.getState().currentApp).toBe('expedition')
    })

    it('handles null to app to null transitions', () => {
      const { setCurrentApp } = useStore.getState()
      
      expect(useStore.getState().currentApp).toBeNull()
      
      setCurrentApp('expedition')
      expect(useStore.getState().currentApp).toBe('expedition')
      
      setCurrentApp(null)
      expect(useStore.getState().currentApp).toBeNull()
    })
  })
})
