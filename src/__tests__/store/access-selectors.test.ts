import { useStore, getFilteredMembers, getFilteredEvents, getFilteredLogistics } from '@/store/use-store'

describe('Access Control Selectors', () => {
  beforeEach(() => {
    // Reset store to default
    useStore.setState({
      currentSection: null,
      userRole: 'standard',
      availableSections: [],
      badgeMappings: {},
      flexiColumnMappings: {},
      accessControlStrategy: 'A',
      allowedPatrolIds: new Set<string>(['p1']),
      allowedEventIds: new Set<string>(['e1']),
      configLoaded: false,
      theme: 'system',
    } as any)
  })

  test('Admin bypasses filters', () => {
    useStore.setState({ userRole: 'admin' })
    const members = [
      { memberId: 'm1', patrolId: 'x' },
      { memberId: 'm2', patrolId: 'y' },
    ]
    const events = [
      { eventId: 'e2', patrolId: 'x' },
      { eventId: 'e3', patrolId: null },
    ]
    const items = [
      { id: 'l1', eventId: 'e9', patrolId: 'x' },
      { id: 'l2', eventId: null, patrolId: null },
    ]

    expect(getFilteredMembers(members)).toHaveLength(2)
    expect(getFilteredEvents(events)).toHaveLength(2)
    expect(getFilteredLogistics(items)).toHaveLength(2)
  })

  test('Strategy A: filters by allowed patrolIds', () => {
    useStore.setState({ accessControlStrategy: 'A', allowedPatrolIds: new Set<string>(['p1']) })
    const members = [
      { memberId: 'm1', patrolId: 'p1' },
      { memberId: 'm2', patrolId: 'p2' },
      { memberId: 'm3', patrolId: null },
    ]
    const events = [
      { eventId: 'e1', patrolId: 'p1' },
      { eventId: 'e2', patrolId: 'p2' },
      { eventId: 'e3', patrolId: null },
    ]
    const items = [
      { id: 'l1', eventId: 'e9', patrolId: 'p1' },
      { id: 'l2', eventId: 'e9', patrolId: 'p2' },
      { id: 'l3', eventId: null, patrolId: null },
    ]

    expect(getFilteredMembers(members).map((m) => m.memberId)).toEqual(['m1', 'm3'])
    expect(getFilteredEvents(events).map((e) => e.eventId)).toEqual(['e1', 'e3'])
    expect(getFilteredLogistics(items).map((i) => i.id)).toEqual(['l1', 'l3'])
  })

  test('Strategy B: filters by allowed eventIds', () => {
    useStore.setState({ accessControlStrategy: 'B', allowedEventIds: new Set<string>(['e1']) })
    const events = [
      { eventId: 'e1', patrolId: null },
      { eventId: 'e2', patrolId: null },
    ]
    const items = [
      { id: 'l1', eventId: 'e1', patrolId: null },
      { id: 'l2', eventId: 'e2', patrolId: null },
      { id: 'l3', eventId: null, patrolId: null },
    ]

    // Members are not constrained by Strategy B
    const members = [
      { memberId: 'm1', patrolId: 'x' },
      { memberId: 'm2', patrolId: 'y' },
    ]

    expect(getFilteredMembers(members)).toHaveLength(2)
    expect(getFilteredEvents(events).map((e) => e.eventId)).toEqual(['e1'])
    expect(getFilteredLogistics(items).map((i) => i.id)).toEqual(['l1', 'l3'])
  })
})
