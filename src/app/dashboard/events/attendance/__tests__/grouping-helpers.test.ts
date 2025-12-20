/**
 * Unit tests for attendance grouping and sorting helpers
 */

// Define the types inline for testing (matching the page component)
interface PersonEvent {
  id: string
  name: string
  startDate?: string
  endDate?: string
  location?: string
}

interface PersonAttendance {
  memberId: string
  name: string
  patrolId: string | number | null
  events: PersonEvent[]
}

/** Sort data alphabetically by name (case-insensitive) */
function sortByName<T extends { name: string }>(data: T[]): T[] {
  return [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

/** Helper to group data by patrol (Patrol → Person → Events) */
function groupByPatrol(data: PersonAttendance[]) {
  const sorted = sortByName(data)
  const groups = sorted.reduce<Record<string, PersonAttendance[]>>((acc, person) => {
    const key = String(person.patrolId ?? 'Unassigned')
    acc[key] = acc[key] ? [...acc[key], person] : [person]
    return acc
  }, {})
  // Sort patrol keys alphabetically
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

/** Helper to group data by patrol and event (Patrol → Event → People) */
function groupByPatrolAndEvent(data: PersonAttendance[]) {
  const sorted = sortByName(data)
  
  // First group by patrol
  const patrolGroups: Record<string, Record<string, { eventName: string; startDate?: string; people: PersonAttendance[] }>> = {}
  
  for (const person of sorted) {
    const patrolKey = String(person.patrolId ?? 'Unassigned')
    if (!patrolGroups[patrolKey]) {
      patrolGroups[patrolKey] = {}
    }
    
    for (const event of person.events) {
      const eventKey = event.id
      if (!patrolGroups[patrolKey][eventKey]) {
        patrolGroups[patrolKey][eventKey] = {
          eventName: event.name,
          startDate: event.startDate,
          people: []
        }
      }
      patrolGroups[patrolKey][eventKey].people.push(person)
    }
  }
  
  // Convert to sorted array structure
  return Object.entries(patrolGroups)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([patrolKey, events]) => ({
      patrolKey,
      events: Object.entries(events)
        .map(([eventId, eventData]) => ({
          eventId,
          ...eventData
        }))
        // Sort events by start date (soonest first)
        .sort((a, b) => {
          if (!a.startDate && !b.startDate) return 0
          if (!a.startDate) return 1
          if (!b.startDate) return -1
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        })
    }))
}

describe('sortByName', () => {
  it('sorts data alphabetically by name (case-insensitive)', () => {
    const data = [
      { name: 'Zara', id: '1' },
      { name: 'alice', id: '2' },
      { name: 'Bob', id: '3' },
    ]
    
    const result = sortByName(data)
    
    expect(result.map(d => d.name)).toEqual(['alice', 'Bob', 'Zara'])
  })
  
  it('returns empty array for empty input', () => {
    expect(sortByName([])).toEqual([])
  })
  
  it('does not mutate original array', () => {
    const data = [{ name: 'B' }, { name: 'A' }]
    const original = [...data]
    sortByName(data)
    expect(data).toEqual(original)
  })
})

describe('groupByPatrol', () => {
  const mockData: PersonAttendance[] = [
    { memberId: '1', name: 'Zara', patrolId: 'Patrol-A', events: [] },
    { memberId: '2', name: 'Alice', patrolId: 'Patrol-B', events: [] },
    { memberId: '3', name: 'Bob', patrolId: 'Patrol-A', events: [] },
    { memberId: '4', name: 'Charlie', patrolId: null, events: [] },
  ]
  
  it('groups data by patrol with people sorted alphabetically within each group', () => {
    const result = groupByPatrol(mockData)
    
    // Should have 3 groups: Patrol-A, Patrol-B, Unassigned
    expect(result.length).toBe(3)
    
    // Groups should be sorted alphabetically
    expect(result.map(([key]) => key)).toEqual(['Patrol-A', 'Patrol-B', 'Unassigned'])
    
    // People within Patrol-A should be sorted
    const patrolA = result.find(([key]) => key === 'Patrol-A')
    expect(patrolA?.[1].map(p => p.name)).toEqual(['Bob', 'Zara'])
  })
  
  it('handles null patrolId as "Unassigned"', () => {
    const result = groupByPatrol(mockData)
    const unassigned = result.find(([key]) => key === 'Unassigned')
    
    expect(unassigned).toBeDefined()
    expect(unassigned?.[1].length).toBe(1)
    expect(unassigned?.[1][0].name).toBe('Charlie')
  })
  
  it('handles numeric patrolId', () => {
    const data: PersonAttendance[] = [
      { memberId: '1', name: 'Alice', patrolId: 123, events: [] },
    ]
    
    const result = groupByPatrol(data)
    expect(result[0][0]).toBe('123')
  })
  
  it('returns empty array for empty input', () => {
    expect(groupByPatrol([])).toEqual([])
  })
})

describe('groupByPatrolAndEvent', () => {
  const mockData: PersonAttendance[] = [
    { 
      memberId: '1', 
      name: 'Zara', 
      patrolId: 'Patrol-A', 
      events: [
        { id: 'event-1', name: 'Bronze Practice', startDate: '2025-03-15' },
        { id: 'event-2', name: 'Silver Qualifier', startDate: '2025-04-20' },
      ] 
    },
    { 
      memberId: '2', 
      name: 'Alice', 
      patrolId: 'Patrol-A', 
      events: [
        { id: 'event-1', name: 'Bronze Practice', startDate: '2025-03-15' },
      ] 
    },
    { 
      memberId: '3', 
      name: 'Bob', 
      patrolId: 'Patrol-B', 
      events: [
        { id: 'event-2', name: 'Silver Qualifier', startDate: '2025-04-20' },
      ] 
    },
  ]
  
  it('groups data by patrol then by event', () => {
    const result = groupByPatrolAndEvent(mockData)
    
    // Should have 2 patrol groups
    expect(result.length).toBe(2)
    expect(result.map(g => g.patrolKey)).toEqual(['Patrol-A', 'Patrol-B'])
  })
  
  it('sorts events by start date within each patrol', () => {
    const result = groupByPatrolAndEvent(mockData)
    const patrolA = result.find(g => g.patrolKey === 'Patrol-A')
    
    // Events should be sorted by date (Bronze Practice before Silver Qualifier)
    expect(patrolA?.events.map(e => e.eventName)).toEqual(['Bronze Practice', 'Silver Qualifier'])
  })
  
  it('lists people alphabetically under each event', () => {
    const result = groupByPatrolAndEvent(mockData)
    const patrolA = result.find(g => g.patrolKey === 'Patrol-A')
    const bronzePractice = patrolA?.events.find(e => e.eventName === 'Bronze Practice')
    
    // Alice and Zara both attend Bronze Practice, should be sorted
    expect(bronzePractice?.people.map(p => p.name)).toEqual(['Alice', 'Zara'])
  })
  
  it('handles events without start dates', () => {
    const data: PersonAttendance[] = [
      { 
        memberId: '1', 
        name: 'Alice', 
        patrolId: 'Patrol-A', 
        events: [
          { id: 'event-1', name: 'Event A' },
          { id: 'event-2', name: 'Event B', startDate: '2025-01-01' },
        ] 
      },
    ]
    
    const result = groupByPatrolAndEvent(data)
    const patrolA = result[0]
    
    // Event with date should come first, then event without date
    expect(patrolA.events.map(e => e.eventName)).toEqual(['Event B', 'Event A'])
  })
  
  it('handles null patrolId as "Unassigned"', () => {
    const data: PersonAttendance[] = [
      { 
        memberId: '1', 
        name: 'Alice', 
        patrolId: null, 
        events: [{ id: 'event-1', name: 'Event A' }] 
      },
    ]
    
    const result = groupByPatrolAndEvent(data)
    expect(result[0].patrolKey).toBe('Unassigned')
  })
  
  it('returns empty array for empty input', () => {
    expect(groupByPatrolAndEvent([])).toEqual([])
  })
  
  it('handles person with no events', () => {
    const data: PersonAttendance[] = [
      { memberId: '1', name: 'Alice', patrolId: 'Patrol-A', events: [] },
    ]
    
    const result = groupByPatrolAndEvent(data)
    // Person with no events creates a patrol group with empty events array
    expect(result.length).toBe(1)
    expect(result[0].patrolKey).toBe('Patrol-A')
    expect(result[0].events).toEqual([])
  })
})
