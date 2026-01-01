import type { Section } from '@/store/use-store'

/**
 * Canonical identifiers for the SEEE Expedition context.
 * Keeping these in a single module avoids mismatches between apps.
 */
export const SEEE_SECTION_ID = '43105'
export const SEEE_SECTION_NAME = 'SE Explorer Expeditions'
export const SEEE_SECTION_TYPE = 'explorers'

/**
 * Helper to locate the SEEE section within a list of available sections.
 */
export function findSeeeSection(sections: Section[]): Section | null {
  return sections.find((section) => section.sectionId === SEEE_SECTION_ID) ?? null
}

/**
 * Static fallback for scenarios where OAuth data is unavailable but we still
 * need to lock UI state to the SEEE section.
 */
export const SEEE_FALLBACK_SECTION: Section = {
  sectionId: SEEE_SECTION_ID,
  sectionName: SEEE_SECTION_NAME,
  sectionType: SEEE_SECTION_TYPE,
}
