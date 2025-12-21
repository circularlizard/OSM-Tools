import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'

const { Then } = createBdd()

Then('the member issues page should load', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('member-issues-title')).toBeVisible()
})

Then('the member issues summary should render', async ({ page }) => {
  await page.waitForLoadState('networkidle')

  // No members loaded state
  const noMembers = page.getByText(
    /No members loaded\. Please select a section to view member data issues\./i
  )
  if (await noMembers.isVisible().catch(() => false)) {
    await expect(noMembers).toBeVisible()
    return
  }

  // If there are no issues, the UI shows a green success state.
  const noIssues = page.getByRole('heading', { name: /No Issues Found/i })
  if (await noIssues.isVisible().catch(() => false)) {
    await expect(noIssues).toBeVisible()
    return
  }

  // Otherwise the page should render an issues summary paragraph and at least one accordion trigger.
  await expect(page.getByText(/members have data quality issues/i)).toBeVisible()

  const anyAccordionTrigger = page.locator('[data-state] > button').first()
  // Fallback if Radix markup differs
  const anyButton = page.getByRole('button').first()

  if (await anyAccordionTrigger.isVisible().catch(() => false)) {
    await expect(anyAccordionTrigger).toBeVisible()
    return
  }

  await expect(anyButton).toBeVisible()
})

Then('the member issues view should render appropriately for this viewport', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  await expect(page.getByTestId('member-issues-title')).toBeVisible()

  // Desktop: issues table may be visible when there are issues
  const tableVisible = await page.locator('table').isVisible().catch(() => false)
  if (tableVisible) {
    await expect(page.locator('table')).toBeVisible()
    // Column headers are stable for the sortable table
    await expect(page.getByRole('columnheader', { name: /Name/i })).toBeVisible()
    return
  }

  // Otherwise: expect at least one of the known content states to be visible
  const noMembersLoaded = await page
    .getByText(/No members loaded\. Please select a section to view member data issues\./i)
    .isVisible()
    .catch(() => false)

  const noIssues = await page
    .getByRole('heading', { name: /No Issues Found/i })
    .isVisible()
    .catch(() => false)

  const hasAccordion = await page
    .locator('[data-state] > button')
    .first()
    .isVisible()
    .catch(() => false)

  expect(noMembersLoaded || noIssues || hasAccordion).toBeTruthy()
})
