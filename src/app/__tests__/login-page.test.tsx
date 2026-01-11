/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve(undefined)),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}))
import * as nextAuthReact from 'next-auth/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn(() => null) }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    jest.spyOn(nextAuthReact, 'signIn').mockResolvedValueOnce(undefined as any)
    jest.spyOn(nextAuthReact, 'useSession' as any).mockReturnValue({ data: null, status: 'unauthenticated' })
    process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED = 'false'
    process.env.MOCK_AUTH_ENABLED = 'false'
    process.env.NEXT_PUBLIC_VISIBLE_APPS = 'expedition,planning'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('renders expedition tab by default and shows other apps when tab selected', async () => {
    const user = userEvent.setup()
    render(<Home />)
    expect(screen.getByText('Expedition Viewer')).toBeInTheDocument()
    expect(screen.queryByText('Expedition Planner')).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Other Apps' }))
    await waitFor(() => {
      expect(screen.getByText('Expedition Planner')).toBeInTheDocument()
    })
    expect(screen.queryByText('OSM Data Quality')).not.toBeInTheDocument()
    expect(screen.queryByText('Development Mode')).toBeNull()
  })

  test('renders mock panel when enabled', () => {
    process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED = 'true'
    render(<Home />)
    expect(screen.getByText('Development Mode')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expedition Viewer' })).toBeInTheDocument()
    expect(screen.getByLabelText('Mock persona (optional)')).toBeInTheDocument()
  })

  test('calls signIn with providers', async () => {
    process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED = 'true'
    const user = userEvent.setup()
    const spy = jest.spyOn(nextAuthReact, 'signIn').mockResolvedValue(undefined as any)
    render(<Home />)

    // OAuth flow: click expedition card
    await user.click(screen.getByRole('heading', { name: 'Expedition Viewer' }))
    expect(spy).toHaveBeenCalledWith(
      'osm-standard',
      expect.objectContaining({ callbackUrl: '/dashboard?appSelection=expedition' })
    )

    // Mock flow: click expedition mock button in dev panel
    await user.click(screen.getByRole('button', { name: 'Expedition Viewer' }))
    expect(spy).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({
        callbackUrl: '/dashboard?appSelection=expedition',
        username: 'standard',
        roleSelection: 'standard',
        appSelection: 'expedition',
      })
    )
  })

  test('shows configured apps from environment variable', async () => {
    const user = userEvent.setup()
    process.env.NEXT_PUBLIC_VISIBLE_APPS = 'expedition,planning,data-quality'
    render(<Home />)
    expect(screen.getByText('Expedition Viewer')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Other Apps' }))
    await waitFor(() => {
      expect(screen.getByText('Expedition Planner')).toBeInTheDocument()
      expect(screen.getByText('OSM Data Quality')).toBeInTheDocument()
    })
  })
})
