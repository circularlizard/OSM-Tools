/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react'
import SectionPickerModal from '@/components/layout/SectionPickerModal'
import { useStore } from '@/store/use-store'

function setStoreSections(sections: { sectionId: string; sectionName: string }[], selected?: { sectionId: string; sectionName: string } | null) {
  const setAvailableSections = useStore.getState().setAvailableSections
  const setCurrentSection = useStore.getState().setCurrentSection
  setAvailableSections(sections as any)
  setCurrentSection(selected ? ({ ...selected, sectionType: '' } as any) : null)
}

describe('SectionPickerModal', () => {
  afterEach(() => {
    // reset store
    useStore.getState().setAvailableSections([])
    useStore.getState().setCurrentSection(null)
  })

  test('does not render when single section', () => {
    setStoreSections([{ sectionId: '1', sectionName: 'Alpha' }])
    render(<SectionPickerModal />)
    expect(screen.queryByText('Select a Section')).toBeNull()
  })

  test('renders when multiple sections and none selected', () => {
    setStoreSections([{ sectionId: '1', sectionName: 'Alpha' }, { sectionId: '2', sectionName: 'Bravo' }])
    render(<SectionPickerModal />)
    expect(screen.getByText('Select a Section')).toBeInTheDocument()
  })
})
