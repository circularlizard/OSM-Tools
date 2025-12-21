import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'

const { When, Then } = createBdd()

When('I open the first event from the events list', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const hasEmptyState = await page.getByText(/No events found/i).isVisible().catch(() => false)
  if (hasEmptyState) {
    throw new Error('No events available to open for event detail scenario')
  }

  // Prefer table link on desktop; otherwise fall back to mobile card link.
  // Exclude the attendance route, which also lives under /dashboard/events/.
  const tableEventLink = page
    .locator('table tbody a[href^="/dashboard/events/"]:not([href$="/attendance"])')
    .first()
  const cardEventLink = page
    .locator('div.md\\:hidden a[href^="/dashboard/events/"]:not([href$="/attendance"])')
    .first()

  if (await tableEventLink.isVisible().catch(() => false)) {
    await tableEventLink.click()
  } else {
    await expect(cardEventLink).toBeVisible()
    await cardEventLink.click()
  }

  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('event-detail-title')).toBeVisible()
})

Then('the event detail page should load', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('event-detail-title')).toBeVisible()
})

Then('the event participants should render appropriately for this viewport', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // Desktop: participants table visible
  const tableVisible = await page.locator('table').isVisible().catch(() => false)
  if (tableVisible) {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible()
    return
  }

  // Mobile: participant cards visible (table hidden)
  const tableHidden = await page.locator('table').isHidden().catch(() => true)
  const hasCards = await page.locator('[class*="card"]').first().isVisible().catch(() => false)

  expect(tableHidden).toBeTruthy()
  expect(hasCards).toBeTruthy()
})
