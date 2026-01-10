import { render, screen } from '@testing-library/react'
import { useStore } from '@/store/use-store'
import DataQualityLayout from '../layout'

// Mock the store
jest.mock('@/store/use-store', () => ({
  useStore: jest.fn(),
}))

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>

describe('DataQualityLayout (REQ-DQ-01)', () => {
  const mockSetCurrentApp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStore.mockImplementation((selector) => {
      const state = {
        currentApp: null,
        setCurrentApp: mockSetCurrentApp,
      }
      return selector(state as unknown as ReturnType<typeof useStore.getState>)
    })
  })

  it('renders children', () => {
    render(
      <DataQualityLayout>
        <div data-testid="child">Child content</div>
      </DataQualityLayout>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('sets currentApp to data-quality on mount', () => {
    render(
      <DataQualityLayout>
        <div>Content</div>
      </DataQualityLayout>
    )

    expect(mockSetCurrentApp).toHaveBeenCalledWith('data-quality')
  })

  it('does not set currentApp if already data-quality', () => {
    mockUseStore.mockImplementation((selector) => {
      const state = {
        currentApp: 'data-quality',
        setCurrentApp: mockSetCurrentApp,
      }
      return selector(state as unknown as ReturnType<typeof useStore.getState>)
    })

    render(
      <DataQualityLayout>
        <div>Content</div>
      </DataQualityLayout>
    )

    expect(mockSetCurrentApp).not.toHaveBeenCalled()
  })
})
