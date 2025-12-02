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
  sections: Array<{
    sectionId: string
    sectionName: string
    sectionType: string
  }>
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
    sections: [
      {
        sectionId: '12345',
        sectionName: 'Explorer Unit Alpha',
        sectionType: 'explorers',
      },
      {
        sectionId: '12346',
        sectionName: 'Scout Troop Beta',
        sectionType: 'scouts',
      },
    ],
  },
  standard: {
    id: 'mock-standard-001',
    name: 'Standard Leader',
    email: 'leader@mock.seee.test',
    image: null,
    role: 'standard',
    sections: [
      {
        sectionId: '12345',
        sectionName: 'Explorer Unit Alpha',
        sectionType: 'explorers',
      },
    ],
  },
  readonly: {
    id: 'mock-readonly-001',
    name: 'Read Only Viewer',
    email: 'viewer@mock.seee.test',
    image: null,
    role: 'readonly',
    sections: [
      {
        sectionId: '12345',
        sectionName: 'Explorer Unit Alpha',
        sectionType: 'explorers',
      },
    ],
  },
  multiSection: {
    id: 'mock-multi-001',
    name: 'Multi-Section Leader',
    email: 'multi@mock.seee.test',
    image: null,
    role: 'standard',
    sections: [
      {
        sectionId: '12345',
        sectionName: 'Explorer Unit Alpha',
        sectionType: 'explorers',
      },
      {
        sectionId: '12346',
        sectionName: 'Scout Troop Beta',
        sectionType: 'scouts',
      },
      {
        sectionId: '12347',
        sectionName: 'Network Unit Gamma',
        sectionType: 'network',
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
