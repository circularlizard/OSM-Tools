import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'

const { Then, When } = createBdd()

Then('the attendance grouping mode {string} should be selected', async ({ page }, label: string) => {
  await page.waitForLoadState('networkidle')
  const radio = page.getByLabel(label)
  await expect(radio).toBeChecked()
})

When('I select attendance grouping mode {string}', async ({ page }, label: string) => {
  await page.waitForLoadState('networkidle')
  await page.getByLabel(label).click()
})

Then('the attendance-by-person view should render appropriately for this viewport', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // Desktop: table visible
  const tableVisible = await page.locator('table').isVisible().catch(() => false)
  if (tableVisible) {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /^Name$/i })).toBeVisible()
    return
  }

  // Mobile: cards/collapsible layout visible (tables hidden)
  const tableHidden = await page.locator('table').isHidden().catch(() => true)
  const hasCards = await page.locator('[class*="card"]').first().isVisible().catch(() => false)

  expect(tableHidden).toBeTruthy()
  expect(hasCards).toBeTruthy()
})
