import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(() => Promise.resolve(undefined)),
}))
import * as nextAuthReact from 'next-auth/react'

describe('Login Page', () => {
  beforeEach(() => {
    jest.spyOn(nextAuthReact, 'signIn').mockResolvedValueOnce(undefined as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('renders only OSM button when mock disabled', () => {
    process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED = 'false'
    process.env.MOCK_AUTH_ENABLED = 'false'
    render(<Home />)
    expect(screen.getByText('Sign in with OSM')).toBeInTheDocument()
    expect(screen.queryByText('Dev: Mock Login')).toBeNull()
  })

  test('renders mock button when enabled', () => {
    process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED = 'true'
    render(<Home />)
    expect(screen.getByText('Sign in with OSM')).toBeInTheDocument()
    expect(screen.getByText('Dev: Mock Login')).toBeInTheDocument()
  })

  test('calls signIn with providers', () => {
    process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED = 'true'
    const spy = jest.spyOn(nextAuthReact, 'signIn').mockResolvedValueOnce(undefined as any)
    render(<Home />)
    fireEvent.click(screen.getByText('Sign in with OSM'))
    expect(spy).toHaveBeenCalledWith('osm')
    fireEvent.click(screen.getByText('Dev: Mock Login'))
    expect(spy).toHaveBeenCalledWith('credentials', { redirect: true })
  })
})
