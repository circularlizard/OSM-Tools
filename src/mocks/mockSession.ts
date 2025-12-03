import { SimplifiedOAuthSection } from '@/lib/schemas'

/**
 * Mock Session Data for Development and CI Testing
 * 
 * Provides predefined user profiles with different roles and section access
 * for offline development and automated testing without OSM credentials.
 */

export interface MockUser {
  id: string
  name: string
  email: string
  image: string | null
  role: 'admin' | 'standard' | 'readonly'
  sections: SimplifiedOAuthSection[]
  scopes: string[]
}

/**
 * Mock user profiles representing different access levels and scenarios
 */
export const mockUsers: Record<string, MockUser> = {
  admin: {
    id: 'mock-admin-001',
    name: 'Admin User',
    email: 'admin@mock.seee.test',
    image: null,
    role: 'admin',
    scopes: ['section:member:read', 'section:event:read', 'section:programme:read'],
    sections: [
      {
        section_name: 'Explorer Unit Alpha',
        section_id: 12345,
        group_id: 1000,
        section_type: 'explorers',
        latest_term: { name: 'Winter 2025', startdate: '2025-01-01', enddate: '2025-04-20', term_id: 1002 },
        upgrades: {
          level: 'gold',
          badges: true,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: true,
          programme: true,
          accounts: true,
          filestorage: true,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
      {
        section_name: 'Scout Troop Beta',
        section_id: 12346,
        group_id: 1000,
        section_type: 'scouts',
        latest_term: { name: 'Winter 2025', startdate: '2025-01-01', enddate: '2025-04-20', term_id: 1004 },
        upgrades: {
          level: 'gold',
          badges: true,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: true,
          programme: true,
          accounts: true,
          filestorage: true,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
    ],
  },
  standard: {
    id: 'mock-standard-001',
    name: 'Standard Leader',
    email: 'leader@mock.seee.test',
    image: null,
    role: 'standard',
    scopes: ['section:member:read', 'section:event:read', 'section:programme:read'],
    sections: [
      {
        section_name: 'Explorer Unit Alpha',
        section_id: 12345,
        group_id: 1000,
        section_type: 'explorers',
        latest_term: { name: 'Winter 2025', startdate: '2025-01-01', enddate: '2025-04-20', term_id: 1002 },
        upgrades: {
          level: 'gold',
          badges: true,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: true,
          programme: true,
          accounts: false,
          filestorage: false,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
    ],
  },
  readonly: {
    id: 'mock-readonly-001',
    name: 'Read Only Viewer',
    email: 'viewer@mock.seee.test',
    image: null,
    role: 'readonly',
    scopes: ['section:event:read'],
    sections: [
      {
        section_name: 'Explorer Unit Alpha',
        section_id: 12345,
        group_id: 1000,
        section_type: 'explorers',
        latest_term: { name: 'Winter 2025', startdate: '2025-01-01', enddate: '2025-04-20', term_id: 1002 },
        upgrades: {
          level: 'bronze',
          badges: false,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: false,
          programme: false,
          accounts: false,
          filestorage: false,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
    ],
  },
  multiSection: {
    id: 'mock-multi-001',
    name: 'Multi-Section Leader',
    email: 'multi@mock.seee.test',
    image: null,
    role: 'standard',
    scopes: ['section:member:read', 'section:event:read', 'section:programme:read'],
    sections: [
      {
        section_name: 'Explorer Unit Alpha',
        section_id: 12345,
        group_id: 1000,
        section_type: 'explorers',
        latest_term: { name: 'Autumn 2024', startdate: '2024-08-01', enddate: '2024-12-31', term_id: 1001 },
        upgrades: {
          level: 'gold',
          badges: true,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: true,
          programme: true,
          accounts: false,
          filestorage: false,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
      {
        section_name: 'Scout Troop Beta',
        section_id: 12346,
        group_id: 1000,
        section_type: 'scouts',
        latest_term: { name: 'Autumn 2024', startdate: '2024-08-01', enddate: '2024-12-31', term_id: 1003 },
        upgrades: {
          level: 'silver',
          badges: true,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: false,
          programme: true,
          accounts: false,
          filestorage: false,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
      {
        section_name: 'Network Unit Gamma',
        section_id: 12347,
        group_id: 1000,
        section_type: 'network',
        latest_term: { name: 'Autumn 2024', startdate: '2024-08-01', enddate: '2024-12-31', term_id: 1005 },
        upgrades: {
          level: 'gold',
          badges: false,
          campsiteexternalbookings: false,
          details: true,
          events: true,
          emailbolton: false,
          programme: false,
          accounts: false,
          filestorage: false,
          chat: false,
          ai: false,
          tasks: false,
          at_home: false,
        },
      },
    ],
  },
}

/**
 * Default mock user for quick testing
 * Used when MOCK_AUTH_ENABLED=true but no specific user is selected
 */
export const defaultMockUser = mockUsers.standard

/**
 * Get a mock user by role or id
 */
export function getMockUser(identifier: string = 'standard'): MockUser {
  return mockUsers[identifier] || defaultMockUser
}
