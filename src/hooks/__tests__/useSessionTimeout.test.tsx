/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@testing-library/react'
import React from 'react'

jest.useFakeTimers()

const mockPush = jest.fn()

jest.mock('next-auth/react', () => {
  return {
    useSession: jest.fn(),
    getSession: jest.fn(),
  }
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { useSessionTimeout } from '../useSessionTimeout'
import { useSession, getSession } from 'next-auth/react'

function TestComponent() {
  useSessionTimeout()
  return null
}

describe('useSessionTimeout', () => {
  const INACTIVITY_MS = 15 * 60 * 1000

  beforeEach(() => {
    jest.clearAllMocks()
    jest.setSystemTime(0)
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id: 'u1' } } })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  test('does not redirect when session is still valid after inactivity', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })

    render(<TestComponent />)

    // Advance past inactivity threshold
    jest.advanceTimersByTime(INACTIVITY_MS + 1000)

    // allow any pending promises to resolve
    await Promise.resolve()

    expect(getSession).toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('redirects to login when session has expired after inactivity', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    render(<TestComponent />)

    jest.advanceTimersByTime(INACTIVITY_MS + 1000)
    await Promise.resolve()

    expect(getSession).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledTimes(1)
    const target = mockPush.mock.calls[0][0]
    expect(typeof target).toBe('string')
    expect(target).toContain('/?callbackUrl=')
  })

  test('does nothing when user is unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })

    render(<TestComponent />)

    jest.advanceTimersByTime(INACTIVITY_MS + 1000)

    expect(getSession).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
